import { Request, Response } from 'express';
import prisma from '../utils/db';
import { generateId } from '../utils/idGenerator';

// 发布食物
export const publishFood = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: 'Not logged in',
        errorCode: 'auth/unauthorized'
      });
    }

    const {
      title,
      description,
      allergens,
      campus,
      location,
      weight,
      expiryDays,
      imageUrl,
      category,
    } = req.body;

    if (!title || !description || !campus || !location || !weight || !expiryDays) {
      return res.status(400).json({
        message: 'Title, description, campus, location, weight and expiryDays are required',
        errorCode: 'food/missing-params'
      });
    }

    const days = parseInt(expiryDays, 10);
    if (isNaN(days) || days <= 0) {
      return res.status(400).json({
        message: 'expiryDays must be a positive integer',
        errorCode: 'food/invalid-expiry-days'
      });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    let dbUser = await prisma.user.findUnique({
      where: { id: user.userId }
    });
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: user.userId,
          email: user.email,
          role: user.role || 'user',
          emailVerified: true,
          avgRating: null,
          ratingCount: 0,
          updatedAt: new Date(),
        }
      });
    }

    const food = await prisma.food.create({
      data: {
        id: generateId(),
        title,
        description,
        allergens: allergens || [],
        campus,
        location,
        weight,
        expiryDays: days,
        expiresAt,
        category: category || null,
        imageUrl: imageUrl || null,
        publisherId: dbUser.id,
        updatedAt: new Date(),
      },
      include: {
        User: { select: { email: true } }
      }
    });

    return res.status(201).json({
      message: 'Food published successfully',
      foodId: food.id,
      food: food
    });

  } catch (error: any) {
    console.error('Publish food failed:', error);
    return res.status(500).json({
      message: 'Publish failed',
      errorCode: 'food/publish-failed',
      error: error.message
    });
  }
};

// 编辑食物
export const editFood = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: 'Not logged in',
        errorCode: 'auth/unauthorized'
      });
    }

    const foodId = req.params.foodId as string;
    const { title, description, allergens, campus, location, weight, imageUrl, status, category } = req.body;

    if (!foodId) {
      return res.status(400).json({
        message: 'Food ID is required',
        errorCode: 'food/missing-food-id'
      });
    }

    const food = await prisma.food.findUnique({
      where: { id: foodId },
      include: { User: true }
    });
    if (!food) {
      return res.status(404).json({
        message: 'Food not found',
        errorCode: 'food/not-found'
      });
    }

    if (food.publisherId !== user.userId) {
      return res.status(403).json({
        message: 'You are not the publisher of this food',
        errorCode: 'food/forbidden-edit'
      });
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (allergens) updateData.allergens = allergens;
    if (campus) updateData.campus = campus;
    if (location) updateData.location = location;
    if (weight) updateData.weight = weight;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (status) updateData.status = status;
    if (category !== undefined) updateData.category = category;
    updateData.updatedAt = new Date();

    const updatedFood = await prisma.food.update({
      where: { id: foodId },
      data: updateData,
      include: { User: { select: { email: true } } }
    });

    return res.status(200).json({
      message: 'Food updated successfully',
      food: updatedFood
    });

  } catch (error: any) {
    console.error('Edit food failed:', error);
    return res.status(500).json({
      message: 'Edit failed',
      errorCode: 'food/edit-failed',
      error: error.message
    });
  }
};

// 删除食物
export const deleteFood = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: 'Not logged in',
        errorCode: 'auth/unauthorized'
      });
    }

    const foodId = req.params.foodId as string;
    if (!foodId) {
      return res.status(400).json({
        message: 'Food ID is required',
        errorCode: 'food/missing-food-id'
      });
    }

    const food = await prisma.food.findUnique({
      where: { id: foodId },
      include: { User: true, Claim: true }
    });
    if (!food) {
      return res.status(404).json({
        message: 'Food not found',
        errorCode: 'food/not-found'
      });
    }

    if (food.publisherId !== user.userId) {
      return res.status(403).json({
        message: 'You are not the publisher of this food',
        errorCode: 'food/forbidden-delete'
      });
    }

    if (food.Claim) {
      await prisma.notification.create({
        data: {
          id: generateId(),
          userId: food.Claim.claimantId,
          type: 'FOOD_DELETED',
          content: `The food "${food.title}" you claimed has been deleted by the publisher.`,
          updatedAt: new Date(),
        }
      });
    }

    await prisma.claim.deleteMany({
      where: { foodId: foodId }
    });

    await prisma.food.delete({
      where: { id: foodId }
    });

    return res.status(200).json({
      message: 'Food deleted successfully',
      foodId: foodId
    });

  } catch (error: any) {
    console.error('Delete food failed:', error);
    return res.status(500).json({
      message: 'Delete failed',
      errorCode: 'food/delete-failed',
      error: error.message
    });
  }
};

// 获取列表
export const getFoodList = async (req: Request, res: Response) => {
  try {
    const { status, allergens, campus, location, keyword, category } = req.query;

    const where: any = {
      status: 'AVAILABLE',
      OR: [
        { expiresAt: { gt: new Date() } },
        { expiresAt: null }
      ]
    };

    if (allergens) {
      const allergenList = (allergens as string).split(',').filter(a => a.trim());
      if (allergenList.length > 0) {
        where.allergens = { hasSome: allergenList };
      }
    }
    if (campus) where.campus = campus as string;
    if (location) where.location = { contains: location as string };
    if (category) {
      where.category = { equals: category as string, mode: 'insensitive' };
    }
    if (keyword) {
      where.OR = [
        { title: { contains: keyword as string, mode: 'insensitive' } },
        { description: { contains: keyword as string, mode: 'insensitive' } }
      ];
    }

    const foods = await prisma.food.findMany({
      where,
      include: {
        User: { select: { email: true, avgRating: true, ratingCount: true } },
        Claim: { select: { Claimant: { select: { email: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      message: 'Get list successfully',
      foods: foods
    });

  } catch (error: any) {
    console.error('Get food list failed:', error);
    return res.status(500).json({
      message: 'Failed to get list',
      errorCode: 'food/list-failed',
      error: error.message
    });
  }
};

// 认领食物
export const claimFood = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: 'Not logged in',
        errorCode: 'auth/unauthorized'
      });
    }

    const { foodId, pickupTime } = req.body;
    if (!foodId) {
      return res.status(400).json({
        message: 'Food ID is required',
        errorCode: 'food/missing-food-id'
      });
    }

    const food = await prisma.food.findUnique({
      where: { id: foodId },
      include: { User: true, Claim: true }
    });
    if (!food) {
      return res.status(404).json({
        message: 'Food not found',
        errorCode: 'food/not-found'
      });
    }

    if (food.status !== 'AVAILABLE' || food.Claim) {
      return res.status(400).json({
        message: 'This food is already claimed',
        errorCode: 'food/already-claimed'
      });
    }
    if (food.publisherId === user.userId) {
      return res.status(403).json({
        message: 'You cannot claim your own food',
        errorCode: 'food/forbid-claim-own-food'
      });
    }

    let validatedPickupTime: Date | null = null;
    let isNewFlow = false;
    if (pickupTime !== undefined && pickupTime !== null && pickupTime !== '') {
      const timestamp = Date.parse(pickupTime);
      if (isNaN(timestamp)) {
        return res.status(400).json({
          message: 'Invalid pickup time format, expected ISO 8601 string',
          errorCode: 'food/invalid-pickup-time'
        });
      }
      validatedPickupTime = new Date(timestamp);
      isNewFlow = true;
    }

    // 创建认领
    const claimData: any = {
      id: generateId(),
      foodId: food.id,
      claimantId: user.userId,
      status: 'PENDING',
      updatedAt: new Date(),
    };
    if (isNewFlow && validatedPickupTime) {
      claimData.pickupTime = validatedPickupTime;
    }

    const claim = await prisma.claim.create({ data: claimData });

    // 更新为 CLAIMED
    await prisma.food.update({
      where: { id: foodId },
      data: { status: 'CLAIMED', updatedAt: new Date() }
    });

    // 获取发布者的信誉分信息
    const publisher = await prisma.user.findUnique({
      where: { id: food.publisherId },
      select: { avgRating: true, ratingCount: true }
    });

    // 获取认领者的信誉分信息（用于通知内容）
    const claimant = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { email: true, avgRating: true, ratingCount: true }
    });
    const claimantRatingInfo = (claimant?.ratingCount ?? 0) >= 2
      ? `Rating: ${claimant?.avgRating?.toFixed(1)}`
      : 'Insufficient ratings';

    // 发送通知
    if (isNewFlow) {
      const content = `${claimant?.email || user.email} (${claimantRatingInfo}) wants to claim your food "${food.title}". Expected pickup time: ${validatedPickupTime!.toISOString()}`;
      await prisma.notification.create({
        data: {
          id: generateId(),
          userId: food.publisherId,
          claimId: claim.id,
          type: 'CLAIM_REQUEST',
          content,
          updatedAt: new Date(),
        }
      });
    } else {
      const content = `Your food "${food.title}" has been claimed by ${claimant?.email || user.email} (${claimantRatingInfo}). Please confirm.`;
      await prisma.notification.create({
        data: {
          id: generateId(),
          userId: food.publisherId,
          claimId: claim.id,
          type: 'CLAIM',
          content,
          updatedAt: new Date(),
        }
      });
    }

    return res.status(200).json({
      message: isNewFlow ? 'Claim request sent' : 'Claimed successfully, waiting for publisher confirmation',
      claimId: claim.id,
      foodStatus: 'CLAIMED',
      publisherRating: publisher?.avgRating ?? null,
      publisherRatingCount: publisher?.ratingCount ?? 0
    });

  } catch (error: any) {
    console.error('Claim food failed:', error);
    return res.status(500).json({
      message: 'Claim failed',
      errorCode: 'food/claim-failed',
      error: error.message
    });
  }
};

// 确认认领
export const confirmClaim = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: 'Not logged in',
        errorCode: 'auth/unauthorized'
      });
    }

    const { claimId } = req.body;
    if (!claimId) {
      return res.status(400).json({
        message: 'Claim ID is required',
        errorCode: 'food/missing-claim-id'
      });
    }

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { Food: true }
    });
    if (!claim) {
      return res.status(404).json({
        message: 'Claim not found',
        errorCode: 'food/claim-not-found'
      });
    }

    if (claim.Food.publisherId !== user.userId) {
      return res.status(403).json({
        message: 'You are not the publisher of this food',
        errorCode: 'food/forbidden-confirm'
      });
    }

    await prisma.claim.update({
      where: { id: claimId },
      data: {
        status: 'ACCEPTED',
        updatedAt: new Date(),
      }
    });

    await prisma.food.update({
      where: { id: claim.foodId },
      data: {
        status: 'COMPLETED',
        updatedAt: new Date(),
      }
    });

    await prisma.notification.create({
      data: {
        id: generateId(),
        userId: claim.claimantId,
        type: 'CLAIM_CONFIRMED',
        content: `Your claim for "${claim.Food.title}" has been confirmed. You can now pick up the food.`,
        updatedAt: new Date(),
      }
    });

    return res.status(200).json({
      message: 'Claim confirmed successfully',
      claimStatus: 'ACCEPTED',
      foodStatus: 'COMPLETED'
    });

  } catch (error: any) {
    console.error('Confirm claim failed:', error);
    return res.status(500).json({
      message: 'Confirm claim failed',
      errorCode: 'food/confirm-failed',
      error: error.message
    });
  }
};

// 获取我发布的
export const getMyPublishedFoods = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        message: 'Not logged in',
        errorCode: 'auth/unauthorized'
      });
    }

    const foods = await prisma.food.findMany({
      where: { publisherId: user.userId },
      include: {
        User: { select: { email: true, avgRating: true, ratingCount: true } },
        Claim: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const foodsWithClaimId = foods.map(food => {
      const claim = (food as any).Claim;
      const claimId = claim ? claim.id : null;
      return {
        ...food,
        completedClaimId: (food.status === 'COMPLETED' && claimId) ? claimId : null
      };
    });

    return res.status(200).json({
      message: 'My publications retrieved successfully',
      foods: foodsWithClaimId
    });
  } catch (error: any) {
    console.error('Get my publications failed:', error);
    return res.status(500).json({
      message: 'Failed to retrieve my publications',
      errorCode: 'food/my-publish-failed',
      error: error.message
    });
  }
};