import type { VercelRequest, VercelResponse } from '@vercel/node';
import { autoCancelTimeoutClaims } from '../../utils/autoCancelTimeout';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.CRON_SECRET;
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    console.warn(`[Cron] Unauthorized attempt from ${req.socket.remoteAddress}`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  console.log(`[Cron] Starting auto-cancel check at ${new Date().toISOString()}`);
  
  try {
    const result = await autoCancelTimeoutClaims();
    
    console.log(`[Cron] Completed: cancelled ${result.cancelledCount} timeout claims`);
    
    return res.status(200).json({
      success: true,
      message: `Auto-cancelled ${result.cancelledCount} timeout claims`,
      cancelledCount: result.cancelledCount,
      details: result.details,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cron] Failed:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
}