import { Request, Response } from 'express';
import { put } from '@vercel/blob';

export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.file;
    // 生成唯一文件名，避免覆盖（可使用时间戳+原始名）
    const fileName = `${Date.now()}-${file.originalname}`;

    // 上传到 Vercel Blob
    const blob = await put(fileName, file.buffer, {
      access: 'public',           // 公开访问
      contentType: file.mimetype, // 保持 MIME 类型
    });

    // 返回文件的公网 URL
    return res.status(200).json({
      message: 'Upload successful',
      url: blob.url,
    });
  } catch (error: any) {
    console.error('Upload failed:', error);
    return res.status(500).json({
      message: 'Upload failed',
      error: error.message,
    });
  }
};