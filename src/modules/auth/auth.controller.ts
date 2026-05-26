import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Patch,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiConsumes,
} from '@nestjs/swagger';
import { UserSignUpDto } from './dto/user.singup.dto';
import { SUCCESS_MESSAGES } from 'src/common/constants';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh.token.dto';
import { GetCurrentUser } from 'src/common/decorator/get-current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { sendResponse } from 'src/common/helpers/api-response.helper';
import { ForgotPasswordDto } from './dto/forgot.password.dto';
import { ResendVerificationOtpDto, ResendForgotPasswordOtpDto } from './dto/resend-otp.dto';
import { ChangePasswordDto } from './dto/change.password.dto';
import { AuthService } from './auth.service';
import { VerifyOtpDto } from './dto/verify.otp.dto';
import { ResetPasswordDto } from './dto/reset.password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // ---------------------------------------------------------------------
  // Email verification endpoint
  // ---------------------------------------------------------------------

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with OTP' })
  @ApiOkResponse({ description: 'Email verified successfully' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    const result = await this.authService.verifyEmail(dto);
    return sendResponse(HttpStatus.OK, 'Email verified', result);
  }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User Sign Up' })
  @ApiCreatedResponse({ description: 'User registered successfully' })
  async userSignUp(@Body() data: UserSignUpDto) {
    await this.authService.userSignUp(data);
    return sendResponse(
      HttpStatus.CREATED,
      SUCCESS_MESSAGES.AUTH.REGISTRATION_SUCCESS,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User / Admin Login' })
  @ApiOkResponse({ description: 'Login successful' })
  async signIn(@Body() data: LoginDto) {
    const result = await this.authService.signIn(data);
    return sendResponse(HttpStatus.OK, SUCCESS_MESSAGES.AUTH.LOGIN_SUCCESS, result);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Change Password" })
  @ApiCreatedResponse({ description: "Password changed successfully" })
  async changePassword(@Body() data: ChangePasswordDto, @GetCurrentUser() user: any) {
    const result = await this.authService.changePassword(data, user);
    return sendResponse(HttpStatus.OK, SUCCESS_MESSAGES.AUTH.PASSWORD_CHANGED, result);
  }

  @ApiOperation({ summary: "Forgot Password" })
  @ApiCreatedResponse({ description: "OTP sent successfully" })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() data: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(data);
    return sendResponse(HttpStatus.OK, SUCCESS_MESSAGES.AUTH.OTP_SENT, result);
  }

    // ---------------------------------------------------------------------
  // Resend OTP endpoints
  // ---------------------------------------------------------------------

  @Post('resend-verification-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification OTP' })
  @ApiOkResponse({ description: 'Verification OTP resent' })
  async resendVerificationOtp(@Body() dto: ResendVerificationOtpDto) {
    const result = await this.authService.resendVerificationOtp(dto.email);
    return sendResponse(HttpStatus.OK, 'Verification OTP resent', result);
  }

  @Post('resend-forgot-password-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend forgot password OTP' })
  @ApiOkResponse({ description: 'Forgot password OTP resent' })
  async resendForgotPasswordOtp(@Body() dto: ResendForgotPasswordOtpDto) {
    const result = await this.authService.resendForgotPasswordOtp(dto.email);
    return sendResponse(HttpStatus.OK, 'Forgot password OTP resent', result);
  }

  @ApiOperation({ summary: "Verify OTP for Password Reset" })
  @ApiOkResponse({ description: "OTP verified successfully" })
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() data: VerifyOtpDto) {
    const result = await this.authService.verifyOtp(data);
    return sendResponse(HttpStatus.OK, SUCCESS_MESSAGES.AUTH.OTP_VERIFIED || 'OTP verified successfully', result);
  }

  @ApiOperation({ summary: "Reset Password" })
  @ApiOkResponse({ description: "Password reset successfully" })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() data: ResetPasswordDto) {
    const result = await this.authService.resetPassword(data);
    return sendResponse(HttpStatus.OK, SUCCESS_MESSAGES.AUTH.PASSWORD_CHANGED || 'Password reset successfully', result);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiOkResponse({ description: 'Token refreshed successfully' })
  async refreshToken(@Body() body: RefreshTokenDto) {
    const { userId, refreshToken } = body;
    const result = await this.authService.refreshToken(userId, refreshToken);
    return sendResponse(HttpStatus.OK, 'Token refreshed successfully', result);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiOkResponse({ description: 'User profile fetched successfully' })
  async getMe(@GetCurrentUser() user: any) {
    if (!user?.userId) {
      throw new UnauthorizedException('Invalid token');
    }
    const result = await this.authService.findUser(user.userId);
    return sendResponse(HttpStatus.OK, 'User profile fetched successfully', result);
  }

  // ---------------------------------------------------------------------
  // Profile update (email change allowed only if already verified)
  // ---------------------------------------------------------------------

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user profile' })
  @ApiOkResponse({ description: 'Profile updated successfully' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @GetCurrentUser() user: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const result = await this.authService.updateProfile(dto, { userId: user.userId }, file);
    return sendResponse(HttpStatus.OK, 'Profile updated', result);
  }
}

