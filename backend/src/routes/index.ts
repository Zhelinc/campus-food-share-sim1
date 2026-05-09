import { Router } from 'express';
import userRoutes from './users.routes';
import foodRoutes from './food.routes';
import uploadRoutes from './upload.routes';
import adminRoutes from './admin.routes';
import notificationRoutes from './notification.routes'; // 新增
import claimRoutes from './claim.routes';
import ratingRoutes from './rating.routes';
import { autoCancelTimeoutClaims } from '../utils/autoCancelTimeout';
const router = Router();

// 挂载用户路由
router.use('/users', userRoutes);

// 挂载食物路由
router.use('/food', foodRoutes);

// 挂载上传路由
router.use('/upload', uploadRoutes);

// 挂载管理员路由
router.use('/admin', adminRoutes);

// 挂载通知路由
router.use('/notifications', notificationRoutes);

router.use('/claim', claimRoutes);
router.use('/rating', ratingRoutes);

router.get('/cron/auto-cancel', async (req, res) => {
  // 验证 CRON_SECRET（防止恶意调用）
  const authHeader = req.headers.authorization;
  const expectedToken = process.env.CRON_SECRET;
  
  // 如果设置了密钥，则验证；没设置则跳过（仅开发环境）
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    console.warn(`[Cron] Unauthorized attempt from ${req.socket.remoteAddress}`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  console.log(`[Cron] Starting auto-cancel check at ${new Date().toISOString()}`);
  
  try {
    const result = await autoCancelTimeoutClaims();
    
    console.log(`[Cron] Completed: cancelled ${result.cancelledCount} timeout claims`);
    
    res.status(200).json({
      success: true,
      message: `Auto-cancelled ${result.cancelledCount} timeout claims`,
      cancelledCount: result.cancelledCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cron] Failed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router;