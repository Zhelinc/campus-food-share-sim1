// backend/src/config/firebase-admin.ts 终极无错版（适配所有Firebase Admin版本，极简合法）
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// 1. 固定密钥文件名（与你config目录下的实际文件一致，无需修改）
const SERVICE_ACCOUNT_FILE = 'campus-food-share-10f92-firebase-adminsdk-fbsvc-02a197251b.json';
const serviceAccountPath = path.resolve(__dirname, SERVICE_ACCOUNT_FILE);

try {
  // 2. 读取密钥文件并解析为原始对象（不做任何字段转换，保留官方原始格式）
  const fileContent = fs.readFileSync(serviceAccountPath, 'utf8');
  const serviceAccount = JSON.parse(fileContent);

  // 3. 核心验证：确保3个必选字段存在且有效（Firebase SDK初始化的核心依赖）
  console.log('🔑 Verify core key fields:');
  console.log('   project_id:', serviceAccount.project_id);
  console.log('   client_email:', serviceAccount.client_email);
  console.log('   private_key exists:', !!serviceAccount.private_key);

  if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error('Invalid key file: missing required fields project_id/client_email/private_key');
  }

  // 4. 全局仅初始化一次SDK（原始对象直接断言，规避所有类型命名问题，适配所有版本）
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
    console.log('✅ Firebase Admin SDK initialized successfully! (Compatible with all versions, no type errors)');
  }

} catch (err) {
  console.error('❌ Firebase Admin SDK initialization failed:', (err as Error).message);
  throw new Error('Please check the key file path, integrity, or network environment');
}

// 导出auth模块供业务接口使用
export const firebaseAuth = admin.auth();
export default admin;