// backend/src/controllers/food.controller.ts
import { Request, Response } from 'express';
import prisma from '../utils/db';
import { generateId } from '../utils/idGenerator';

/**
 * 发布食物接口
 */
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

    // 查找用户（使用 userId）
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
        User: { select: { email: true } }  // 注意：大写 User
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

/**
 * 编辑食物接口（仅发布者可编辑）
 */
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
      include: { User: true }  // 大写 User
    });
    if (!food) {
      return res.status(404).json({
        message: 'Food not found',
        errorCode: 'food/not-found'
      });
    }

    // 验证发布者身份
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
      include: { User: { select: { email: true } } }  // 大写 User
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

/**
 * 删除食物接口（仅发布者可删除）
 */
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
      include: { User: true, Claim: true }  // 大写 User, Claim
    });
    if (!food) {
      return res.status(404).json({
        message: 'Food not found',
        errorCode: 'food/not-found'
      });
    }

    // 验证发布者身份
    if (food.publisherId !== user.userId) {
      return res.status(403).json({
        message: 'You are not the publisher of this food',
        errorCode: 'food/forbidden-delete'
      });
    }

    // 如果食物已被认领，给认领者发送通知
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

/**
 * 获取食物列表（公开接口，无需登录）
 * 过滤：status = AVAILABLE，未过期（expiresAt > now 或 expiresAt 为 null）
 * 支持模糊搜索（不区分大小写）
 */
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
        User: { select: { email: true } },                     // 大写 User
        Claim: { select: { Claimant: { select: { email: true } } } }  // 注意：Claim 模型中的关系名 Claimant（大写）
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

/**
 * 认领食物接口
 */
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
      include: { User: true, Claim: true }  // 大写 User, Claim
    });
    if (!food) {
      return res.status(404).json({
        message: 'Food not found',
        errorCode: 'food/not-found'
      });
    }

    // 检查食物是否可认领
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

    // 处理 pickupTime（可选，新功能）
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

    // 创建认领记录
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

    // 更新食物状态为 CLAIMED
    await prisma.food.update({
      where: { id: foodId },
      data: { status: 'CLAIMED', updatedAt: new Date() }
    });

    // 发送通知给发布者
    if (isNewFlow) {
      // 新流程：包含期望时间
      const content = `${user.email} wants to claim your food "${food.title}". Expected pickup time: ${validatedPickupTime!.toISOString()}`;
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
      // 旧流程
      await prisma.notification.create({
        data: {
          id: generateId(),
          userId: food.publisherId,
          claimId: claim.id,
          type: 'CLAIM',
          content: `Your food "${food.title}" has been claimed by ${user.email}. Please confirm.`,
          updatedAt: new Date(),
        }
      });
    }

    return res.status(200).json({
      message: isNewFlow ? 'Claim request sent' : 'Claimed successfully, waiting for publisher confirmation',
      claimId: claim.id,
      foodStatus: 'CLAIMED'
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

/**
 * 确认认领接口
 */
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
      include: {
        Food: { include: { User: true } }  // 大写 Food, User
      }
    });
    if (!claim) {
      return res.status(404).json({
        message: 'Claim not found',
        errorCode: 'food/claim-not-found'
      });
    }

    // 验证当前用户是否为食物的发布者
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

/**
 * 获取当前用户发布的食物列表
 */
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
        User: { select: { email: true } }  // 大写 User
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      message: 'My publications retrieved successfully',
      foods
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