import { Response, NextFunction } from "express";
import { Error as MongooseError } from "mongoose";
import { AuditLogModel } from "../models";
import {
  IAuthRequest,
  AuditAction,
  AuditTargetType,
  AuditStatus,
} from "../types";

interface CustomError extends Error {
  statusCode?: number;
  code?: number;
  keyPattern?: Record<string, number>;
}

export const errorHandler = async (
  err: CustomError,
  req: IAuthRequest,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  console.error(err.stack);

  if (err.statusCode === 500 || !err.statusCode) {
    try {
      await AuditLogModel.create({
        action: AuditAction.SETTINGS_CHANGED,
        performedBy: req.user?.userId || null,
        userRole: req.user?.role || null,
        targetType: AuditTargetType.SYSTEM,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        requestMethod: req.method,
        requestUrl: req.originalUrl,
        status: AuditStatus.FAILED,
        errorMessage: err.message,
        metadata: {
          stack: err.stack,
        },
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const mongooseErr = err as MongooseError.ValidationError;
    const errors = Object.values(mongooseErr.errors).map((e) => e.message);
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
    return;
  }

  // Mongoose duplicate key error
  if (err.code === 11000 && err.keyPattern) {
    const field = Object.keys(err.keyPattern)[0];
    res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
    return;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === "CastError") {
    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
    return;
  }

  if (err.name === "TokenExpiredError") {
    res.status(401).json({
      success: false,
      message: "Token expired",
      code: "TOKEN_EXPIRED",
    });
    return;
  }

  // Default error response
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// Async handler wrapper
export const asyncHandler = <T>(
  fn: (req: IAuthRequest, res: Response, next: NextFunction) => Promise<T>,
) => {
  return (req: IAuthRequest, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
