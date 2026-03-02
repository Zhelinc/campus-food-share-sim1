import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/db';

export const verifyAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: 'Not logged in',
        errorCode: 'auth/unauthorized'
      });
    }

    const dbUser = await prisma.user.findUnique({
      where: { firebaseUid: user.uid }
    });

    if (!dbUser || dbUser.role !== 'admin') {
      return res.status(403).json({
        message: 'Admin permission required',
        errorCode: 'auth/forbidden'
      });
    }

    next();
  } catch (error: any) {
    return res.status(500).json({
      message: 'Permission verification failed',
      error: error.message
    });
  }
};