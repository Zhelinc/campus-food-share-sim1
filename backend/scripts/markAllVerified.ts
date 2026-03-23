// backend/scripts/markAllVerified.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 开始更新所有用户的 emailVerified 字段为 true...');
  
  const result = await prisma.user.updateMany({
    data: {
      emailVerified: true,
    },
  });

  console.log(`✅ 成功更新 ${result.count} 个用户的 emailVerified 为 true。`);
}

main()
  .catch((e) => {
    console.error('❌ 更新失败：', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });