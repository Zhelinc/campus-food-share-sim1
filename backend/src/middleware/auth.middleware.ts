// backend/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  // 1. 从 Authorization 头获取 token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'No valid token provided',
      errorCode: 'auth/missing-token'
    });
  }

  // 2. 提取 token 部分
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      message: 'Token format invalid',
      errorCode: 'auth/invalid-token'
    });
  }

  try {
    // 3. 验证 token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };

    // 4. 将用户信息挂载到 req 对象
    req.user = decoded;

    // 5. 继续执行下一个中间件/路由
    next();
  } catch (error) {
    // token 无效或过期
    return res.status(401).json({
      message: 'Token is invalid or expired',
      errorCode: 'auth/token-verification-failed'
    });
  }
};