import * as nodemailer from 'nodemailer';

/** Create a reusable SMTP transporter */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

/**
 * Send an email verification link to the user.
 */
export async function sendVerificationEmail(
  to: string,
  token: string,
): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Book Project" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify your email address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #333;">Email Verification</h2>
        <p>Please click the button below to verify your email address.</p>
        <a href="${verificationUrl}" style="display: inline-block; background: #4f46e5; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px;">Verify Email</a>
        <p style="color: #666; margin-top: 24px;">If you did not create an account, you can safely ignore this email.</p>
      </div>
    `,
  });
}
