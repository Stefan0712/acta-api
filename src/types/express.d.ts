import { Request } from 'express';
import { Types } from 'mongoose';

interface AuthUser {
    id: Types.ObjectId | string; 
}

declare global {
  namespace Express {
    interface Request {
      user: AuthUser;
    }
  }
}