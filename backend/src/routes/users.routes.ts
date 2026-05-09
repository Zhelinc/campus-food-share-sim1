// backend/src/routes/users.routes.ts
import { Router } from 'express';
import { 
  registerUser, 
  loginUser, 
  getUserInfo, 
  changePassword,
  forgotPassword,  
  resetPassword    
} from '../controllers/users.controller';
import { verifyToken } from '../middleware/auth.middleware';

import { verifyEmail } from '../controllers/users.controller';

const router = Router();

// 注册
router.post('/register', registerUser);

// 登录
router.post('/login', loginUser);

// 获取用户信息
router.get('/info', verifyToken, getUserInfo);

// 修改密码
router.post('/change-password', verifyToken, changePassword);

// 忘记密码
router.post('/forgot-password', forgotPassword);

// 重置密码
router.post('/reset-password', resetPassword);

router.get('/verify-email', verifyEmail);
export default router;