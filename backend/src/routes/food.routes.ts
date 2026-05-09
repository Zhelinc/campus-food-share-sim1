import { Router } from 'express';
import {
  publishFood,
  getFoodList,
  claimFood,
  confirmClaim,
  editFood,
  deleteFood,
  getMyPublishedFoods
} from '../controllers/food.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/list', getFoodList);

router.post('/publish', verifyToken, publishFood);
router.post('/claim', verifyToken, claimFood);
router.post('/confirm-claim', verifyToken, confirmClaim);
router.get('/my-publish', verifyToken, getMyPublishedFoods);

router.put('/:foodId', verifyToken, editFood);      // 新增
router.delete('/:foodId', verifyToken, deleteFood); // 新增

// 兼容
router.post('/edit', verifyToken, editFood);        // 保留，但可考虑移除
router.post('/delete', verifyToken, deleteFood);    // 保留

export default router;