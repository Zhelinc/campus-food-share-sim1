// backend/src/controllers/admin.controller.ts
import { Request, Response } from 'express';
import prisma from '../utils/db';

// ================== 用户管理 ==================

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        Food: true,
        Claim: true
      }
    });
    return res.status(200).json({ message: 'Get user list successfully', users });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to get user list', error: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const id = userId as string; // 类型断言
    const { email } = req.body;

    // 检查邮箱是否已被其他用户使用
    const existing = await prisma.user.findFirst({
      where: { 
        email, 
        NOT: { id } // 现在 id 是 string 类型
      }
    });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use', errorCode: 'auth/email-already-exists' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { email, updatedAt: new Date() }
    });

    // 移除密码字段后返回
    const { password, ...userWithoutPassword } = updatedUser;
    return res.status(200).json({ message: 'User updated successfully', user: userWithoutPassword });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const id = userId as string;

    // 删除该用户的认领记录
    await prisma.claim.deleteMany({ where: { claimantId: id } });
    // 获取该用户发布的所有食物 ID
    const userFoods = await prisma.food.findMany({
      where: { publisherId: id },
      select: { id: true }
    });
    // 删除这些食物的认领记录
    for (const food of userFoods) {
      await prisma.claim.deleteMany({ where: { foodId: food.id } });
    }
    // 删除该用户发布的食物
    await prisma.food.deleteMany({ where: { publisherId: id } });
    // 最后删除用户
    await prisma.user.delete({ where: { id } });

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

// ================== 食物管理 ==================

export const getAllFoods = async (req: Request, res: Response) => {
  try {
    const foods = await prisma.food.findMany({
      include: {
        User: { select: { email: true } },
        Claim: { include: { User: { select: { email: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json({ message: 'Get all foods successfully', foods });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to get foods', error: error.message });
  }
};

export const updateAnyFood = async (req: Request, res: Response) => {
  try {
    const { foodId } = req.params;
    const id = foodId as string;
    const data = req.body;
    const updated = await prisma.food.update({
      where: { id },
      data: { ...data, updatedAt: new Date() }
    });
    return res.status(200).json({ message: 'Food updated successfully', food: updated });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to update food', error: error.message });
  }
};

export const deleteAnyFood = async (req: Request, res: Response) => {
  try {
    const { foodId } = req.params;
    const id = foodId as string;
    await prisma.claim.deleteMany({ where: { foodId: id } });
    await prisma.food.delete({ where: { id } });
    return res.status(200).json({ message: 'Food deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to delete food', error: error.message });
  }
};