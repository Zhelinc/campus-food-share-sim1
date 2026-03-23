import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send email verification link to the user
 * @param to recipient email address
 * @param token JWT token for email verification
 */
export const sendVerificationEmail = async (to: string, token: string) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"Campus Food Share" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Verify Your Email Address',
    html: `
      <h2>Welcome to Campus Food Share!</h2>
      <p>Please click the link below to verify your email address. This link will expire in 24 hours.</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>If you did not register for this service, please ignore this email.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (to: string, code: string) => {
  const mailOptions = {
    from: `"Campus Food Share" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Password Reset Code',
    html: `
      <h2>Reset Your Password</h2>
      <p>Your verification code is:</p>
      <h1 style="color: #ff6700; font-size: 32px;">${code}</h1>
      <p>This code will expire in 10 minutes.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
    `,
  };
  await transporter.sendMail(mailOptions);
};