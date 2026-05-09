import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { createRating, getClaimRatings, getUserRatings } from '../controllers/rating.controller';

const router = Router();
router.post('/', verifyToken, createRating);
router.get('/claim/:claimId', verifyToken, getClaimRatings);
router.get('/user/:userId', verifyToken, getUserRatings);

export default router;