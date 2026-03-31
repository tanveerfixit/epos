import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      user?: any;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  userId: number;
  user: any;
}
