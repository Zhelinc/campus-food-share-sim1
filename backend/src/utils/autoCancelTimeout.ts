import prisma from './db';
import { generateId } from './idGenerator';

export interface AutoCancelResult {
  cancelledCount: number;
  details: Array<{ claimId: string; foodTitle: string }>;
}

export async function autoCancelTimeoutClaims(): Promise<AutoCancelResult> {
  const TWENTY_FOUR_HOURS_AGO = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const timeoutClaims = await prisma.claim.findMany({
    where: {
      status: { in: ['PENDING', 'COUNTERED'] },
      updatedAt: { lt: TWENTY_FOUR_HOURS_AGO }
    },
    include: { 
      Food: true,
      Claimant: true 
    }
  });

  console.log(`[AutoCancel] Found ${timeoutClaims.length} timeout claims`);

  const results: Array<{ claimId: string; foodTitle: string }> = [];

  for (const claim of timeoutClaims) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.claim.delete({ where: { id: claim.id } });
        
        await tx.food.update({
          where: { id: claim.foodId },
          data: { status: 'AVAILABLE', updatedAt: new Date() }
        });
        
        await tx.notification.create({
          data: {
            id: generateId(),
            userId: claim.Food.publisherId,
            type: 'CLAIM_TIMEOUT',
            content: `[Auto-cancelled] You did not respond to the claim for "${claim.Food.title}" within 24 hours. The food is now available for others to claim.`,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        });
        
        await tx.notification.create({
          data: {
            id: generateId(),
            userId: claim.claimantId,
            type: 'CLAIM_TIMEOUT',
            content: `[Auto-cancelled] The publisher did not respond to your claim for "${claim.Food.title}" within 24 hours. You can claim it again if still available.`,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        });
      });
      
      results.push({ claimId: claim.id, foodTitle: claim.Food.title });
      console.log(`[AutoCancel] Cancelled claim ${claim.id} for food "${claim.Food.title}"`);
    } catch (err) {
      console.error(`[AutoCancel] Failed to cancel claim ${claim.id}:`, err);
    }
  }

  return { cancelledCount: results.length, details: results };
}