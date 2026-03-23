// backend/src/types/express.d.ts

import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      /**
       * Custom user property added by the verifyToken middleware.
       * Contains the decoded JWT payload.
       */
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}