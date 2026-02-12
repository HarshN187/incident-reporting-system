import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { IJWTPayload, IAuthRequest } from "../types";
import { UserModel } from "../models";

export const verifyAccessToken = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "No token provided, authorization denied",
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET!,
    ) as IJWTPayload;

    // Check if user exists and is active
    const user = await UserModel.findById(decoded.userId).select("-password");

    if (!user) {
      res.status(401).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (user.status === "blocked") {
      res.status(403).json({
        success: false,
        message: "Your account has been blocked",
      });
      return;
    }

    // Check if password was changed after token was issued
    if (user.passwordChangedAt && decoded.iat) {
      const passwordChangedTimestamp = user.passwordChangedAt.getTime() / 1000;
      if (decoded.iat < passwordChangedTimestamp) {
        res.status(401).json({
          success: false,
          message: "Password recently changed, please log in again",
        });
        return;
      }
    }

    // Attach user to request object
    req.user = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
      username: user.username,
    };

    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({
        success: false,
        message: "Token expired",
        code: "TOKEN_EXPIRED",
      });
      return;
    }

    if (error.name === "JsonWebTokenError") {
      res.status(401).json({
        success: false,
        message: "Invalid token",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};
