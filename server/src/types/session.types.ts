import { Document, Types } from "mongoose";

export interface ISession {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  refreshToken: string;
  refreshTokenHash: string;
  ipAddress: string;
  userAgent?: string;
  isValid: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISessionDocument extends ISession, Document {}
