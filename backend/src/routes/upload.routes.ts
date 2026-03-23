import { Router } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { uploadImage } from '../controllers/upload.controller';

// 使用内存存储（关键修改）
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

const router = Router();

router.post('/', verifyToken, upload.single('image'), uploadImage);

export default router;