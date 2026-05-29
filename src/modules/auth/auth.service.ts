import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserSignUpDto } from './dto/user.singup.dto';
import { ERROR_MESSAGES } from 'src/common/constants';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IEnv } from 'src/config/env.config';
import { ForgotPasswordDto } from './dto/forgot.password.dto';
import { ChangePasswordDto } from './dto/change.password.dto';
import { VerifyOtpDto } from './dto/verify.otp.dto';
import { ResetPasswordDto } from './dto/reset.password.dto';
import { sendOtpEmail } from 'src/common/helpers/mail.helper';
import { uploadImageToCloudinary } from 'src/common/helpers/cloudinary.helper';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async hast(text: string) {
    const hash = await bcrypt.hash(text, 10);

    return hash;
  }

  async userSignUp(data: UserSignUpDto) {
    // Check if email or phone already exist
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    const existingPhone = data.contactNumber
      ? await this.prisma.user.findUnique({
          where: { contactNumber: data.contactNumber },
        })
      : null;

    if (existingUser)
      throw new BadRequestException(ERROR_MESSAGES.USER.USER_ALREADY_EXISTS);
    if (existingPhone)
      throw new BadRequestException(ERROR_MESSAGES.USER.PHONE_ALREADY_EXISTS);

    // Hash password
    const hashedPassword = await this.hast(data.password);

    // Generate 6‑digit OTP for email verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const verificationOtpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const user = await this.prisma.user.create({
      data: {
        userName: data.userName,
        email: data.email,
        contactNumber: data.contactNumber || null,
        password: hashedPassword,
        verificationOtp: hashedOtp,
        verificationOtpExpiry,
      },
    });

    // Send verification OTP email
    await sendOtpEmail(user.email, otp);

    return { message: 'User created successfully. Verification OTP sent.' };
  }

  async signIn(data: LoginDto) {
    const { email } = data;
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isVerified) {
      throw new ForbiddenException(
        'Please verify your email before logging in',
      );
    }
    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException('Account suspended');
    }
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new NotFoundException(ERROR_MESSAGES.AUTH.INVALID_PASSWORD);
    }

    // Generate new tokens
    const tokens = await this.generateTokens(user.userId, user.email);
    // Update refresh token storage
    await this.updateRefreshToken(user.userId, tokens.refreshToken);
    // Record last login timestamp
    await this.prisma.user.update({
      where: { userId: user.userId },
      data: { lastLogin: new Date() },
    });

    const { password, refreshToken, otpCode, otpExpiry, ...rest } = user;
    return tokens;
  }

  async resendForgotPasswordOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException(ERROR_MESSAGES.USER.USER_NOT_FOUND);
    if (!user.isVerified) {
      throw new ForbiddenException('Please verify your email first');
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await this.prisma.user.update({
      where: { userId: user.userId },
      data: { otpCode: hashedOtp, otpExpiry },
    });
    await sendOtpEmail(user.email, otp);
    return { message: 'Forgot password OTP resent' };
  }

  async resendVerificationOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException(ERROR_MESSAGES.USER.USER_NOT_FOUND);
    if (user.isVerified) {
      throw new BadRequestException('Email already verified');
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await this.prisma.user.update({
      where: { userId: user.userId },
      data: { verificationOtp: hashedOtp, verificationOtpExpiry: otpExpiry },
    });
    await sendOtpEmail(user.email, otp);
    return { message: 'Verification OTP resent' };
  }

  async findUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { userId } });
    if (!user) throw new NotFoundException(ERROR_MESSAGES.USER.USER_NOT_FOUND);
    const { password, refreshToken, otpCode, otpExpiry, ...rest } = user;
    return rest;
  }

  // ---------------------------------------------------------------------
  // Email verification
  // ---------------------------------------------------------------------
  async verifyEmail(dto: { email: string; otp: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new BadRequestException('Invalid verification details');
    }
    if (!user.verificationOtp || !user.verificationOtpExpiry) {
      throw new BadRequestException('Verification OTP not generated');
    }
    if (new Date() > user.verificationOtpExpiry) {
      // clear expired OTP
      await this.prisma.user.update({
        where: { userId: user.userId },
        data: { verificationOtp: null, verificationOtpExpiry: null },
      });
      throw new BadRequestException('Verification OTP expired');
    }
    const isValid = await bcrypt.compare(dto.otp, user.verificationOtp);
    if (!isValid) {
      throw new BadRequestException('Invalid verification OTP');
    }
    await this.prisma.user.update({
      where: { userId: user.userId },
      data: {
        isVerified: true,
        verificationOtp: null,
        verificationOtpExpiry: null,
      },
    });
    return null;
  }

  // ---------------------------------------------------------------------
  // Profile update (email change allowed only if already verified)
  // ---------------------------------------------------------------------
  async updateProfile(
    data: {
      userName?: string;
      contactNumber?: string;
      profilePhotoUrl?: string;
    },
    currentUser: { userId: string },
    file?: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { userId: currentUser.userId },
    });
    if (!user) throw new NotFoundException(ERROR_MESSAGES.USER.USER_NOT_FOUND);

    let profilePhotoUrl = data.profilePhotoUrl;
    if (file) {
      try {
        profilePhotoUrl = await uploadImageToCloudinary(file.buffer);
      } catch (error) {
        throw new BadRequestException('Image upload failed');
      }
    }

    // Update fields
    await this.prisma.user.update({
      where: { userId: currentUser.userId },
      data: {
        userName: data.userName,
        contactNumber: data.contactNumber,
        profilePhotoUrl: profilePhotoUrl,
      },
    });
    return { message: 'Profile updated successfully' };
  }

  // ─── Change Password (authenticated user) ────────────────────────────
  async changePassword(
    data: ChangePasswordDto,
    currentUser: { userId: string },
  ) {
    const { oldPassword, newPassword } = data;

    const user = await this.prisma.user.findUnique({
      where: { userId: currentUser.userId },
    });

    if (!user) throw new NotFoundException(ERROR_MESSAGES.USER.USER_NOT_FOUND);

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.OLD_PASSWORD_INCORRECT);
    }

    // Ensure new password differs from old
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.SAME_PASSWORD);
    }

    // Hash and save
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { userId: currentUser.userId },
      data: { password: hashedNewPassword },
    });

    return { message: 'Password changed successfully' };
  }

  // ─── Forgot Password (send OTP) ──────────────────────────────────────
  async forgotPassword(data: ForgotPasswordDto) {
    const email = data.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    console.log(user);

    if (!user) throw new NotFoundException(ERROR_MESSAGES.USER.USER_NOT_FOUND);

    if (!user.isVerified) {
      throw new ForbiddenException('Please verify your email first');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP before storing (so DB never holds plaintext OTP)
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Set expiry to 5 minutes from now
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.user.update({
      where: { userId: user.userId },
      data: {
        otpCode: hashedOtp,
        otpExpiry,
      },
    });

    console.log(email, otp);
    // Send email
    const res = await sendOtpEmail(email, otp);
    console.log(res);

    return { message: 'OTP sent to your email' };
  }

  // ─── Verify OTP ──────────────────────────────────────────────────────
  async verifyOtp(data: VerifyOtpDto) {
    const email = data.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) throw new NotFoundException(ERROR_MESSAGES.USER.USER_NOT_FOUND);

    if (!user.otpCode || !user.otpExpiry) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.INVALID_OTP);
    }

    // Check expiry
    if (new Date() > user.otpExpiry) {
      // Clear expired OTP
      await this.prisma.user.update({
        where: { userId: user.userId },
        data: { otpCode: null, otpExpiry: null },
      });
      throw new BadRequestException(ERROR_MESSAGES.AUTH.OTP_EXPIRED);
    }

    // Compare hashed OTP
    const isOtpValid = await bcrypt.compare(data.otp, user.otpCode);
    if (!isOtpValid) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.INVALID_OTP);
    }

    return { message: 'OTP verified successfully' };
  }

  // ─── Reset Password (with OTP) ───────────────────────────────────────
  async resetPassword(data: ResetPasswordDto) {
    const email = data.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) throw new NotFoundException(ERROR_MESSAGES.USER.USER_NOT_FOUND);

    if (!user.otpCode || !user.otpExpiry) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.INVALID_OTP);
    }

    // Check expiry
    if (new Date() > user.otpExpiry) {
      await this.prisma.user.update({
        where: { userId: user.userId },
        data: { otpCode: null, otpExpiry: null },
      });
      throw new BadRequestException(ERROR_MESSAGES.AUTH.OTP_EXPIRED);
    }

    // Compare hashed OTP
    const isOtpValid = await bcrypt.compare(data.otp, user.otpCode);
    if (!isOtpValid) {
      throw new BadRequestException(ERROR_MESSAGES.AUTH.INVALID_OTP);
    }

    // Hash new password and save, clear OTP fields
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await this.prisma.user.update({
      where: { userId: user.userId },
      data: {
        password: hashedPassword,
        otpCode: null,
        otpExpiry: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  // ─── Token Helpers ────────────────────────────────────────────────────
  async generateTokens(userId: string, email: string) {
    const env = this.configService.get<IEnv>('env');
    const payload = { sub: userId, email };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: env?.JWT_CONFIG.JWT_SECRET,
      expiresIn: '7d',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: env?.JWT_CONFIG.JWT_REFRESH_SECRET,
      expiresIn: '30d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);

    await this.prisma.user.update({
      where: { userId: userId },
      data: {
        refreshToken: hashed,
      },
    });
  }

  async refreshToken(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId: userId },
    });

    if (!user || !user.refreshToken) {
      throw new ForbiddenException('Access denied');
    }

    if (!user.isVerified) {
      throw new ForbiddenException('Please verify your email first');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!isMatch) {
      throw new ForbiddenException('Access denied');
    }

    const tokens = await this.generateTokens(user.userId, user.email);

    await this.updateRefreshToken(user.userId, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { userId: userId },
      data: {
        refreshToken: null,
      },
    });

    return {
      message: 'Logout successful',
    };
  }
}
