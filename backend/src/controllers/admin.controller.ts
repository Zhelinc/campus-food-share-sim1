import { Request, Response } from 'express';
import prisma from '../utils/db';

// user
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
    const id = userId as string; 
    const { email } = req.body;

    // check email
    const existing = await prisma.user.findFirst({
      where: { 
        email, 
        NOT: { id } 
      }
    });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use', errorCode: 'auth/email-already-exists' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { email, updatedAt: new Date() }
    });

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

    await prisma.claim.deleteMany({ where: { claimantId: id } });
    // get foodid about the user
    const userFoods = await prisma.food.findMany({
      where: { publisherId: id },
      select: { id: true }
    });
    // 删除食物的认领记录
    for (const food of userFoods) {
      await prisma.claim.deleteMany({ where: { foodId: food.id } });
    }
    // 删除该用户发布的食物
    await prisma.food.deleteMany({ where: { publisherId: id } });
    await prisma.user.delete({ where: { id } });

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};

// food

export const getAllFoods = async (req: Request, res: Response) => {
  try {
    const foods = await prisma.food.findMany({
      include: {
        User: { select: { email: true } },
        Claim: { include: { Claimant: { select: { email: true } } } }
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

// get rate
export const getAllRatings = async (req: Request, res: Response) => {
  try {
    const ratings = await prisma.rating.findMany({
      include: {
        rater: { select: { id: true, email: true } },
        rated: { select: { id: true, email: true } },
        claim: { include: { Food: { select: { title: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json({ ratings });
  } catch (error: any) {
    return res.status(500).json({ message: 'Failed to get ratings', error: error.message });
  }
};

// d rate
export const deleteRating = async (req: Request, res: Response) => {
  try {
    const { ratingId } = req.params;
    // 确保 ratingId 是字符串，不是数组
    if (!ratingId || Array.isArray(ratingId)) {
      return res.status(400).json({ message: 'Invalid rating ID' });
    }

    // aa rate
    const rating = await prisma.rating.findUnique({
      where: { id: ratingId },
      include: { rated: true }
    });
    if (!rating) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    await prisma.rating.delete({ where: { id: ratingId } });

    // rec r
    const agg = await prisma.rating.aggregate({
      where: { ratedId: rating.ratedId },
      _avg: { score: true },
      _count: { score: true }
    });
    await prisma.user.update({
      where: { id: rating.ratedId },
      data: {
        avgRating: agg._avg.score ?? null,
        ratingCount: agg._count.score
      }
    });

    return res.status(200).json({ message: 'Rating deleted successfully' });
  } catch (error: any) {
    console.error('Delete rating error:', error);
    return res.status(500).json({ message: 'Failed to delete rating', error: error.message });
  }
};