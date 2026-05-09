import { Request, Response } from 'express';
import prisma from '../utils/db';

// 创建评分
export const createRating = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const { claimId, score, comment } = req.body;
    if (!claimId || score === undefined || score < 0 || score > 5) {
      return res.status(400).json({ message: 'Invalid score (0-5) or missing claimId' });
    }

    const claim = await prisma.claim.findUnique({
      where: { id: claimId as string },
      include: { Food: true }
    });
    if (!claim) return res.status(404).json({ message: 'Claim not found' });
    if (claim.Food.status !== 'COMPLETED') {
      return res.status(400).json({ message: 'Cannot rate before completion' });
    }

    const raterId = user.userId;
    const ratedId = claim.Food.publisherId === raterId ? claim.claimantId : claim.Food.publisherId;
    if (raterId === ratedId) {
      return res.status(400).json({ message: 'Cannot rate yourself' });
    }

    const existing = await prisma.rating.findUnique({
      where: { claimId_raterId: { claimId: claimId as string, raterId } }
    });
    if (existing) {
      return res.status(409).json({ message: 'You have already rated this transaction' });
    }

    // 创建评分
    const rating = await prisma.rating.create({
      data: { claimId: claimId as string, score, comment, raterId, ratedId }
    });

    // 更新
    const agg = await prisma.rating.aggregate({
      where: { ratedId },
      _avg: { score: true },
      _count: { score: true }
    });
    const newAvg = agg._avg.score ?? null;
    const newCount = agg._count.score;

    await prisma.user.update({
      where: { id: ratedId },
      data: { avgRating: newAvg, ratingCount: newCount }
    });

    return res.status(201).json({ message: 'Rating submitted', rating });
  } catch (error: any) {
    console.error('Rating failed:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// 获取交易的所有评分
export const getClaimRatings = async (req: Request, res: Response) => {
  try {
    const claimId = req.params.claimId as string;
    if (!claimId) return res.status(400).json({ message: 'Missing claimId' });

    const ratings = await prisma.rating.findMany({
      where: { claimId },
      include: {
        rater: { select: { email: true, avgRating: true, ratingCount: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(ratings);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch ratings' });
  }
};

// 获取用户收到的评分
export const getUserRatings = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    if (!userId) return res.status(400).json({ message: 'Missing userId' });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [ratings, total] = await Promise.all([
      prisma.rating.findMany({
        where: { ratedId: userId },
        include: {
          rater: { select: { email: true, avgRating: true, ratingCount: true } },
          claim: { include: { Food: { select: { title: true } } } }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.rating.count({ where: { ratedId: userId } })
    ]);

    return res.json({ ratings, total, page, limit });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch user ratings' });
  }
};