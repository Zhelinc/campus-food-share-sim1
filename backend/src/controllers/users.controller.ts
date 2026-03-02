import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../utils/db';
import { generateId } from '../utils/idGenerator';

const ADMIN_INVITE_CODE = process.env.ADMIN_INVITE_CODE || '123456';
const SALT_ROUNDS = 10;

// 临时存储验证码（内存，生产环境应使用 Redis）
const resetCodes = new Map<string, { code: string; expires: number }>();

/**
 * 用户注册
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, confirmPassword, role = 'user', invitationCode } = req.body;

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Email, password and confirm password are required', errorCode: 'auth/empty-params' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match', errorCode: 'auth/password-mismatch' });
    }

    const AUTHORIZED_SCHOOL_DOMAINS = ['bupt.edu.cn', 'qmul.ac.uk'];
    const isAuthorized = AUTHORIZED_SCHOOL_DOMAINS.some(domain => email.endsWith(`@${domain}`));
    if (!isAuthorized) {
      return res.status(400).json({ message: 'This email domain is not authorized', errorCode: 'auth/invalid-email-domain' });
    }

    const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({ message: 'Password complexity is insufficient', errorCode: 'auth/weak-password' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered', errorCode: 'auth/email-already-exists' });
    }

    if (role === 'admin') {
      if (!invitationCode || invitationCode !== ADMIN_INVITE_CODE) {
        return res.status(403).json({ message: 'Invalid admin invitation code', errorCode: 'auth/invalid-invitation-code' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const firebaseUid = 'mock-' + Date.now() + Math.random().toString(36).substr(2, 8);
    const newUser = await prisma.user.create({
      data: {
        id: generateId(),
        firebaseUid,
        email,
        password: hashedPassword,
        role: role === 'admin' ? 'admin' : 'user',
        updatedAt: new Date(),
      }
    });

    const mockFirebaseToken = `mock-token-${newUser.firebaseUid}`;
    return res.status(201).json({
      message: 'Registration successful',
      token: mockFirebaseToken,
      user: {
        uid: newUser.firebaseUid,
        email: newUser.email,
        role: newUser.role,
        dbUserId: newUser.id
      }
    });

  } catch (error: any) {
    console.error('Registration failed:', error);
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

/**
 * 用户登录
 */
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required', errorCode: 'auth/empty-params' });
    }

    const dbUser = await prisma.user.findUnique({ where: { email } });
    if (!dbUser) {
      return res.status(401).json({ message: 'Invalid email or password', errorCode: 'auth/invalid-credentials' });
    }

    // 密码验证（兼容旧用户无密码的情况，但正常情况应有密码）
    if (dbUser.password) {
      const valid = await bcrypt.compare(password, dbUser.password);
      if (!valid) {
        return res.status(401).json({ message: 'Invalid email or password', errorCode: 'auth/invalid-credentials' });
      }
    } else {
      // 开发环境临时处理：无密码用户允许任意密码登录，并提示设置密码
      console.warn(`User ${email} has no password set, using temporary login. Please remind user to set password.`);
    }

    const mockFirebaseToken = `mock-token-${dbUser.firebaseUid}`;
    return res.status(200).json({
      message: 'Login successful',
      token: mockFirebaseToken,
      expiresIn: 7200,
      user: {
        uid: dbUser.firebaseUid,
        email: dbUser.email,
        emailVerified: true,
        dbUserId: dbUser.id,
        role: dbUser.role
      }
    });

  } catch (error: any) {
    console.error('Login failed:', error);
    return res.status(400).json({ message: error.message || 'Login failed', errorCode: error.code || 'UNKNOWN_ERROR' });
  }
};

/**
 * 获取用户信息
 */
export const getUserInfo = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Not logged in', errorCode: 'auth/unauthorized' });
    }

        const dbUser = await prisma.user.findUnique({
      where: { firebaseUid: user.uid },
      include: {
        Food: { select: { title: true, status: true, location: true, quality: true, campus: true } },
        Claim: {
          include: {
            Food: {
              select: {
                id: true,            // 👈 关键：必须包含 id
                title: true,
                description: true,
                imageUrl: true,
                status: true,
                location: true,
                quality: true,
                campus: true,
                // 如果有其他字段（如 allergens），也可按需添加
              }
            }
          }
        }
      }
    });

    if (!dbUser) {
      return res.status(404).json({ message: 'User not found', errorCode: 'auth/user-not-found' });
    }

    // 移除密码字段
    const { password, ...userWithoutPassword } = dbUser;
    return res.status(200).json({
      message: 'Get user info successfully',
      user: {
        ...userWithoutPassword,
        publishedFoods: dbUser.Food,
        claimedFoods: dbUser.Claim.map(c => c.Food)
      }
    });

  } catch (error: any) {
    console.error('Failed to get user info:', error);
    return res.status(500).json({ message: 'Failed to get user info', error: error.message });
  }
};

/**
 * 修改密码
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Not logged in', errorCode: 'auth/unauthorized' });
    }

    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: 'All fields are required', errorCode: 'auth/empty-params' });
    }
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: 'New passwords do not match', errorCode: 'auth/password-mismatch' });
    }

    const dbUser = await prisma.user.findUnique({
      where: { firebaseUid: user.uid }
    });
    if (!dbUser) {
      return res.status(404).json({ message: 'User not found', errorCode: 'auth/user-not-found' });
    }

    if (dbUser.password) {
      const valid = await bcrypt.compare(oldPassword, dbUser.password);
      if (!valid) {
        return res.status(401).json({ message: 'Invalid old password', errorCode: 'auth/invalid-old-password' });
      }
    }

    const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({ message: 'New password complexity is insufficient', errorCode: 'auth/weak-password' });
    }

    const hashedNew = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { password: hashedNew, updatedAt: new Date() }
    });

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error: any) {
    console.error('Failed to change password:', error);
    return res.status(500).json({ message: 'Failed to change password', error: error.message });
  }
};

/**
 * 忘记密码 - 发送验证码
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email cannot be empty', errorCode: 'auth/empty-params' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // 为安全，返回相同消息
      return res.status(200).json({ message: 'If the email exists, a reset code has been sent' });
    }

    // 生成6位数字验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10分钟有效
    resetCodes.set(email, { code, expires });

    // 模拟发送邮件（实际应调用邮件服务）
    console.log(`[Simulated email] Sending reset code to ${email}: ${code}`);

    return res.status(200).json({ message: 'Verification code sent to your email, please check' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to send', error: error.message });
  }
};

/**
 * 重置密码
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword, confirmNewPassword } = req.body;
    if (!email || !code || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: 'All fields are required', errorCode: 'auth/empty-params' });
    }
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: 'Passwords do not match', errorCode: 'auth/password-mismatch' });
    }

    // 密码复杂度校验
    const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({ message: 'Password complexity is insufficient', errorCode: 'auth/weak-password' });
    }

    const stored = resetCodes.get(email);
    if (!stored || stored.code !== code || stored.expires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired verification code', errorCode: 'auth/invalid-code' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found', errorCode: 'auth/user-not-found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, updatedAt: new Date() }
    });

    // 清除验证码
    resetCodes.delete(email);

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Reset failed', error: error.message });
  }
};