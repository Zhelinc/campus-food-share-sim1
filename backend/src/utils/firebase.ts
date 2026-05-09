import * as admin from 'firebase-admin';

const serviceAccount = require('../config/campus-food-share-10f92-firebase-adminsdk-fbsvc-02a197251b.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export const verifyIdToken = async (token: string) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // 额外验证
    if (!decodedToken.email?.endsWith('@university.edu')) {
      throw new Error('Only school email allowed');
    }
    
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid authentication token');
  }
};

export default admin;