import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/db';
import { generateId } from '../utils/idGenerator';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/mailer';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 10;
const ADMIN_INVITE_CODE = process.env.ADMIN_INVITE_CODE || '123456';

/**
 * Register a new user
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, confirmPassword, role = 'user', invitationCode } = req.body;

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({
        message: 'Email, password and confirm password are required',
        errorCode: 'auth/empty-params',
      });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'Passwords do not match',
        errorCode: 'auth/password-mismatch',
      });
    }

    const AUTHORIZED_SCHOOL_DOMAINS = ['bupt.edu.cn', 'qmul.ac.uk'];
    const isAuthorized = AUTHORIZED_SCHOOL_DOMAINS.some((domain) =>
      email.endsWith(`@${domain}`)
    );
    if (!isAuthorized) {
      return res.status(400).json({
        message: 'Email domain is not authorized',
        errorCode: 'auth/invalid-email-domain',
      });
    }

    const PASSWORD_REGEX =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        message:
          'Password must be at least 6 characters and include uppercase, lowercase, number and special character',
        errorCode: 'auth/weak-password',
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        message: 'Email already registered',
        errorCode: 'auth/email-already-exists',
      });
    }

    if (role === 'admin') {
      if (!invitationCode || invitationCode !== ADMIN_INVITE_CODE) {
        return res.status(403).json({
          message: 'Invalid admin invitation code',
          errorCode: 'auth/invalid-invitation-code',
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await prisma.user.create({
      data: {
        id: generateId(),
        email,
        password: hashedPassword,
        role,
        emailVerified: false,
        updatedAt: new Date(),
      },
    });

    const verificationToken = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await sendVerificationEmail(newUser.email, verificationToken);

    return res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } catch (error: any) {
    console.error('Registration failed:', error);
    return res.status(500).json({
      message: 'Registration failed',
      errorCode: 'auth/registration-failed',
      error: error.message,
    });
  }
};

/**
 * Verify user's email using token
 */
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        message: 'Invalid verification token',
        errorCode: 'auth/invalid-verification-token',
      });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        message: 'Verification link has expired or is invalid',
        errorCode: 'auth/invalid-verification-token',
      });
    }

    const { userId } = decoded;
    if (!userId) {
      return res.status(400).json({
        message: 'Invalid token payload',
        errorCode: 'auth/invalid-verification-token',
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true, updatedAt: new Date() },
    });

    return res.status(200).json({
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (error: any) {
    console.error('Email verification failed:', error);
    return res.status(500).json({
      message: 'Email verification failed',
      errorCode: 'auth/verification-failed',
      error: error.message,
    });
  }
};

/**
 * Login user
 */
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
        errorCode: 'auth/empty-params',
      });
    }

    const dbUser = await prisma.user.findUnique({ where: { email } });
    if (!dbUser) {
      return res.status(401).json({
        message: 'Invalid email or password',
        errorCode: 'auth/invalid-credentials',
      });
    }

    if (!dbUser.password) {
      return res.status(401).json({
        message: 'This account has no password set. Please use password reset.',
        errorCode: 'auth/no-password',
      });
    }

    const valid = await bcrypt.compare(password, dbUser.password);
    if (!valid) {
      return res.status(401).json({
        message: 'Invalid email or password',
        errorCode: 'auth/invalid-credentials',
      });
    }

    if (!dbUser.emailVerified) {
      return res.status(403).json({
        message: 'Please verify your email before logging in',
        errorCode: 'auth/email-not-verified',
      });
    }

    const token = jwt.sign(
      { userId: dbUser.id, email: dbUser.email, role: dbUser.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const { password: _, ...userWithoutPassword } = dbUser;

    return res.status(200).json({
      message: 'Login successful',
      token,
      expiresIn: JWT_EXPIRES_IN,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.error('Login failed:', error);
    return res.status(500).json({
      message: 'Login failed',
      errorCode: 'auth/login-failed',
      error: error.message,
    });
  }
};

/**
 * Get current user info (requires authentication)
 */
export const getUserInfo = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: 'Unauthorized',
        errorCode: 'auth/unauthorized',
      });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        Food: { select: { title: true, status: true, location: true, weight: true, campus: true } },
        Claim: { include: { Food: { select: { title: true, status: true, imageUrl: true } } } },
      },
    });

    if (!dbUser) {
      return res.status(404).json({
        message: 'User not found',
        errorCode: 'auth/user-not-found',
      });
    }

    const { password, ...userWithoutPassword } = dbUser;
    return res.status(200).json({
      message: 'User info retrieved',
      user: {
        ...userWithoutPassword,
        publishedFoods: dbUser.Food,
        claimedFoods: dbUser.Claim.map((c) => c.Food),
      },
    });
  } catch (error: any) {
    console.error('Get user info failed:', error);
    return res.status(500).json({
      message: 'Failed to get user info',
      errorCode: 'auth/user-info-failed',
      error: error.message,
    });
  }
};

/**
 * Change password (authenticated)
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: 'Unauthorized',
        errorCode: 'auth/unauthorized',
      });
    }

    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        message: 'All fields are required',
        errorCode: 'auth/empty-params',
      });
    }
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        message: 'New passwords do not match',
        errorCode: 'auth/password-mismatch',
      });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) {
      return res.status(404).json({
        message: 'User not found',
        errorCode: 'auth/user-not-found',
      });
    }

    if (dbUser.password) {
      const valid = await bcrypt.compare(oldPassword, dbUser.password);
      if (!valid) {
        return res.status(401).json({
          message: 'Old password is incorrect',
          errorCode: 'auth/invalid-old-password',
        });
      }
    }

    const PASSWORD_REGEX =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({
        message:
          'Password must be at least 6 characters and include uppercase, lowercase, number and special character',
        errorCode: 'auth/weak-password',
      });
    }

    const hashedNew = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { password: hashedNew, updatedAt: new Date() },
    });

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('Change password failed:', error);
    return res.status(500).json({
      message: 'Failed to change password',
      errorCode: 'auth/change-password-failed',
      error: error.message,
    });
  }
};

/**
 * Forgot password - send reset code via email and store in database
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        message: 'Email is required',
        errorCode: 'auth/empty-params',
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(200).json({
        message: 'If that email exists, a password reset code has been sent.',
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.passwordReset.deleteMany({ where: { email } });
    await prisma.passwordReset.create({
      data: { email, code, expiresAt },
    });

    await sendPasswordResetEmail(email, code);

    return res.status(200).json({
      message: 'If that email exists, a password reset code has been sent.',
    });
  } catch (error: any) {
    console.error('Forgot password failed:', error);
    return res.status(500).json({
      message: 'Failed to process request',
      errorCode: 'auth/forgot-password-failed',
      error: error.message,
    });
  }
};

/**
 * Reset password using code from database
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword, confirmNewPassword } = req.body;
    if (!email || !code || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        message: 'All fields are required',
        errorCode: 'auth/empty-params',
      });
    }
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        message: 'Passwords do not match',
        errorCode: 'auth/password-mismatch',
      });
    }

    const PASSWORD_REGEX =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({
        message:
          'Password must be at least 6 characters and include uppercase, lowercase, number and special character',
        errorCode: 'auth/weak-password',
      });
    }

    const resetRecord = await prisma.passwordReset.findUnique({
      where: { email },
    });

    if (!resetRecord || resetRecord.code !== code || resetRecord.expiresAt < new Date()) {
      return res.status(400).json({
        message: 'Invalid or expired code',
        errorCode: 'auth/invalid-code',
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        errorCode: 'auth/user-not-found',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, updatedAt: new Date() },
    });

    await prisma.passwordReset.delete({ where: { email } });

    return res.status(200).json({ message: 'Password reset successful' });
  } catch (error: any) {
    console.error('Reset password failed:', error);
    return res.status(500).json({
      message: 'Failed to reset password',
      errorCode: 'auth/reset-password-failed',
      error: error.message,
    });
  }
};