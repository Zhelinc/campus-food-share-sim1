import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { verifyAdmin } from '../middleware/admin.middleware';
import {
  getAllUsers,
  updateUser,
  deleteUser,
  getAllFoods,
  updateAnyFood,
  deleteAnyFood
} from '../controllers/admin.controller';

import { getAllRatings, deleteRating } from '../controllers/admin.controller';
const router = Router();

router.use(verifyToken, verifyAdmin);

// 用户管理
router.get('/users', getAllUsers);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);

// 食物管理
router.get('/foods', getAllFoods);
router.put('/foods/:foodId', updateAnyFood);
router.delete('/foods/:foodId', deleteAnyFood);

router.get('/ratings', getAllRatings);
router.delete('/ratings/:ratingId', deleteRating);

export default router;