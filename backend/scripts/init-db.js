// scripts/init-db.js
const { execSync } = require('child_process');

try {
  console.log('🔄 正在生成 Prisma 客户端...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('🔄 正在同步数据库结构...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' }); 
  // 注意：--accept-data-loss 标志允许在某些 schema 变更时接受潜在数据丢失（如删除列），
  // 如果你的模型变更不会导致数据丢失，可以不加此选项。为了更安全，可先用 --force-reset 但会清空数据。
  // 推荐不加该选项，若遇到需要数据丢失的变更，手动处理即可。

  console.log('✅ 数据库初始化完成');
} catch (error) {
  console.error('❌ 数据库初始化失败:', error.message);
  process.exit(1);
}