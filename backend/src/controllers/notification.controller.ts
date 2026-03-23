import { Request, Response } from 'express';
import prisma from '../utils/db';

export const getMyNotifications = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Not logged in', errorCode: 'auth/unauthorized' });

    // 直接通过 userId 查找用户（JWT 中的 userId 就是数据库 id）
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) return res.status(404).json({ message: 'User not found', errorCode: 'auth/user-not-found' });

    const { page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const notifications = await prisma.notification.findMany({
      where: { userId: dbUser.id },
      include: {
    Claim: {
      include: {
        Food: { select: { title: true, location: true } }
      }
    }
  },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    const total = await prisma.notification.count({ where: { userId: dbUser.id } });

    return res.status(200).json({
      notifications,
      pagination: { page: parseInt(page as string), limit: take, total, pages: Math.ceil(total / take) }
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to get notifications', error: error.message });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Not logged in', errorCode: 'auth/unauthorized' });

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) return res.status(404).json({ message: 'User not found', errorCode: 'auth/user-not-found' });

    const count = await prisma.notification.count({
      where: { userId: dbUser.id, isRead: false }
    });
    return res.status(200).json({ unreadCount: count });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to get unread count', error: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Not logged in', errorCode: 'auth/unauthorized' });

    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser) return res.status(404).json({ message: 'User not found', errorCode: 'auth/user-not-found' });

    const { notificationId, all } = req.body;
    if (all) {
      await prisma.notification.updateMany({
        where: { userId: dbUser.id, isRead: false },
        data: { isRead: true, updatedAt: new Date() }
      });
      return res.status(200).json({ message: 'All notifications marked as read' });
    } else if (notificationId) {
      const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId: dbUser.id }
      });
      if (!notification) return res.status(404).json({ message: 'Notification not found or no permission', errorCode: 'notification/not-found' });
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true, updatedAt: new Date() }
      });
      return res.status(200).json({ message: 'Notification marked as read' });
    } else {
      return res.status(400).json({ message: 'Please provide notificationId or all parameter', errorCode: 'notification/missing-params' });
    }
  } catch (error: any) {
    return res.status(500).json({ message: 'Operation failed', error: error.message });
  }
};