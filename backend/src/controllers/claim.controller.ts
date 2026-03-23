import { Request, Response } from 'express';
import prisma from '../utils/db';
import { generateId } from '../utils/idGenerator';

/**
 * 发布者回应认领请求
 * action: 'accept' | 'reject_with_counter'
 * if action = 'reject_with_counter', must provide counterPickupTime
 */
export const respondToClaim = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Not logged in', errorCode: 'auth/unauthorized' });

    const { claimId, action, counterPickupTime } = req.body;
    if (!claimId || !['accept', 'reject_with_counter'].includes(action)) {
      return res.status(400).json({ message: 'claimId and valid action required', errorCode: 'claim/missing-params' });
    }
    if (action === 'reject_with_counter' && !counterPickupTime) {
      return res.status(400).json({ message: 'counterPickupTime required when rejecting with counter', errorCode: 'claim/missing-counter-time' });
    }

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { Food: { include: { User: true } }, Claimant: true }
    });
    if (!claim) return res.status(404).json({ message: 'Claim not found', errorCode: 'claim/not-found' });
    if (claim.Food.publisherId !== user.userId) {
      return res.status(403).json({ message: 'You are not the publisher', errorCode: 'claim/forbidden' });
    }

    if (action === 'accept') {
      // 接受认领
      await prisma.claim.update({
        where: { id: claimId },
        data: { status: 'ACCEPTED', updatedAt: new Date() }
      });
      await prisma.food.update({
        where: { id: claim.foodId },
        data: { status: 'COMPLETED', updatedAt: new Date() }
      });
      await prisma.notification.create({
        data: {
          id: generateId(),
          userId: claim.claimantId,
          claimId: claim.id,
          type: 'CLAIM_ACCEPTED',
          content: `Your claim for "${claim.Food.title}" has been accepted. Please pick up at ${claim.pickupTime?.toLocaleString()} at ${claim.Food.location}.`,
          updatedAt: new Date(),
        }
      });
      return res.status(200).json({ message: 'Claim accepted' });
    } else {
      // 拒绝并提议新时间
      const newTime = new Date(counterPickupTime);
      await prisma.claim.update({
        where: { id: claimId },
        data: {
          status: 'COUNTERED',
          counterPickupTime: newTime,
          updatedAt: new Date(),
        }
      });
      // 食物保持 CLAIMED 状态，等待申领者回应
      await prisma.notification.create({
        data: {
          id: generateId(),
          userId: claim.claimantId,
          claimId: claim.id,
          type: 'CLAIM_COUNTER_OFFER',
          content: `The publisher of "${claim.Food.title}" suggested a new pickup time: ${newTime.toLocaleString()}. Please respond.`,
          updatedAt: new Date(),
        }
      });
      return res.status(200).json({ message: 'Counter offer sent' });
    }
  } catch (error: any) {
    console.error('Respond to claim failed:', error);
    return res.status(500).json({ message: 'Failed to respond', error: error.message });
  }
};

/**
 * 申领者对反提议的回应
 * action: 'accept' | 'reject'
 */
export const respondToCounter = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: 'Not logged in', errorCode: 'auth/unauthorized' });

    const { claimId, action } = req.body;
    if (!claimId || !['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'claimId and valid action required', errorCode: 'claim/missing-params' });
    }

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
      include: { Food: true, Claimant: true }
    });
    if (!claim) return res.status(404).json({ message: 'Claim not found', errorCode: 'claim/not-found' });
    if (claim.claimantId !== user.userId) {
      return res.status(403).json({ message: 'You are not the claimant', errorCode: 'claim/forbidden' });
    }
    if (claim.status !== 'COUNTERED') {
      return res.status(400).json({ message: 'Claim is not in countered state', errorCode: 'claim/invalid-state' });
    }

    if (action === 'accept') {
      // 接受反提议，完成认领
      await prisma.claim.update({
        where: { id: claimId },
        data: {
          status: 'ACCEPTED',
          pickupTime: claim.counterPickupTime, // 采用新时间
          counterPickupTime: null,
          updatedAt: new Date(),
        }
      });
      await prisma.food.update({
        where: { id: claim.foodId },
        data: { status: 'COMPLETED', updatedAt: new Date() }
      });
      await prisma.notification.create({
        data: {
          id: generateId(),
          userId: claim.Food.publisherId,
          claimId: claim.id,
          type: 'CLAIM_ACCEPTED',
          content: `${user.email} accepted your counter offer. The food is now claimed.`,
          updatedAt: new Date(),
        }
      });
      return res.status(200).json({ message: 'Counter offer accepted' });
    } else {
      // 拒绝反提议，撤销认领，恢复食物为可用状态
      await prisma.claim.delete({ where: { id: claimId } });
      await prisma.food.update({
        where: { id: claim.foodId },
        data: { status: 'AVAILABLE', updatedAt: new Date() }
      });
      await prisma.notification.create({
        data: {
          id: generateId(),
          userId: claim.Food.publisherId,
          type: 'CLAIM_REJECTED',
          content: `${user.email} rejected your counter offer. The food is available again.`,
          updatedAt: new Date(),
        }
      });
      return res.status(200).json({ message: 'Counter offer rejected, food released' });
    }
  } catch (error: any) {
    console.error('Respond to counter failed:', error);
    return res.status(500).json({ message: 'Failed to respond', error: error.message });
  }
};