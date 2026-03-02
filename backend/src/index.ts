import express, { Request, Response, NextFunction } from 'express';  
import cors from 'cors';  
import path from 'path';  
import routes from './routes/index';  
const app = express();  
const PORT = process.env.PORT || 8080;  
app.use(cors());  
app.use(express.json({ limit: '10mb' }));  
app.use(express.urlencoded({ extended: true, limit: '10mb' }));  
// 静态文件服务  
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));  
// 健康检查（不依赖数据库）  
app.get('/health', (req, res) => {  
  res.status(200).json({ status: 'ok', message: 'Server is running normally' });  
});  
// API 路由  
app.use('/api', routes);  
// 全局错误处理  
process.on('unhandledRejection', (reason: any) => {  
  console.error('❌ Unhandled Promise rejection:', reason);  
});  
process.on('uncaughtException', (error: Error) => {  
  console.error('❌ Uncaught exception:', error);  
});  
// 错误处理中间件  
app.use((err: any, req: Request, res: Response, next: NextFunction) => {  
  console.error('❌ Request error:', err);  
    
  if (res.headersSent) {  
    return next(err);  
  }  
    
  res.status(err.status || 500).json({  
    message: err.message || 'Internal server error',  
    errorCode: err.errorCode || 'INTERNAL_SERVER_ERROR'  
  });  
});  
// 404 处理  
app.use((req: Request, res: Response) => {  
  res.status(404).json({   
    message: 'Route not found',  
    errorCode: 'NOT_FOUND'  
  });  
});  
// 启动服务器  
const server = app.listen(PORT, () => {  
  console.log(`✅ Server running at http://localhost:${PORT}`);  
});  
// 优雅关闭  
process.on('SIGTERM', () => {  
  console.log('Received SIGTERM signal, shutting down...');  
  server.close(() => {  
    console.log('Server closed');  
    process.exit(0);  
  });  
});  
export default app;