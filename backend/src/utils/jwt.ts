import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '3lCtA9Qdgdg6knWLzpUF9XmGR++QwV33p5cRvFNFY9U=';
const JWT_EXPIRES_IN = '7d'; // token 有效期

export const generateToken = (userId: string, email: string, role: string) => {
  return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
  } catch (error) {
    return null;
  }
};