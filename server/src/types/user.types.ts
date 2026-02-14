import { Document, Types } from "mongoose";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  SUPERADMIN = "superadmin",
}

export enum UserStatus {
  ACTIVE = "active",
  BLOCKED = "blocked",
  PENDING = "pending",
}

export interface IUser {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  firstName?: string;
  lastName?: string;
  department?: string;
  lastLogin?: Date;
  lastLoginIP?: string;
  failedLoginAttempts: number;
  passwordChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface IUserDocument extends IUser, Document {
  fullName: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserRegistration {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  department?: string;
}

export interface IUserLogin {
  email: string;
  password: string;
}

export interface IUserUpdate {
  firstName?: string;
  lastName?: string;
  department?: string;
  email?: string;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface IAuthResponse {
  user: Omit<IUser, "password">;
  tokens: IAuthTokens;
}

export interface IJWTPayload {
  userId: string;
  role: UserRole;
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
}

export interface IUserFilter {
  email?: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
  firstName?: string;
  lastName?: string;
  department?: string;
  createdAt?: Date;
  createdBy?: string;
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
}
