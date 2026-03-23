import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { respondToClaim, respondToCounter } from '../controllers/claim.controller';

const router = Router();

router.post('/respond', verifyToken, respondToClaim);
router.post('/respond-to-counter', verifyToken, respondToCounter);

export default router;