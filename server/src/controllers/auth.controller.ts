import { Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { SessionModel, UserModel } from "../models";
import {
  IAuthResponse,
  IAuthTokens,
  IJWTPayload,
  UserRole,
  IAuthRequest,
  IApiResponse,
  UserStatus,
  AuditAction,
  AuditTargetType,
} from "../types";
import { asyncHandler } from "../middlewares";
import { AuditService } from "../services";

const JWT_CONFIG = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET || "access_secret",
    expiresIn:
      (process.env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"]) || "15m",
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET || "access_secret",
    expiresIn:
      (process.env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"]) || "7d",
  },
};

const generateTokens = async (
  userId: string,
  role: UserRole,
  req: IAuthRequest,
): Promise<IAuthTokens> => {
  // Access Token Payload
  const accessTokenPayload: IJWTPayload = {
    userId,
    role,
    type: "access",
  };

  // Refresh Token Payload
  const refreshTokenPayload: IJWTPayload = {
    userId,
    role,
    type: "refresh",
  };

  const accessToken = jwt.sign(
    accessTokenPayload,
    JWT_CONFIG.accessToken.secret,
    { expiresIn: JWT_CONFIG.accessToken.expiresIn },
  );

  const refreshToken = jwt.sign(
    refreshTokenPayload,
    JWT_CONFIG.refreshToken.secret,
    { expiresIn: JWT_CONFIG.refreshToken.expiresIn },
  );

  // Store refresh token in database
  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await SessionModel.create({
    userId,
    refreshToken,
    refreshTokenHash,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    expiresAt,
  });

  return { accessToken, refreshToken };
};

// @desc    Register new user
// @route   POST /api/v1/auth/register
// @access  Public
export const register = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { username, email, password, firstName, lastName, department } =
      req.body;

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User already exists with this email or username",
      } as IApiResponse);
      return;
    }

    // Create user
    const user = await UserModel.create({
      username,
      email,
      password,
      firstName,
      lastName,
      department,
      role: UserRole.USER,
    });

    // Generate tokens
    const tokens = await generateTokens(user._id.toString(), user.role, req);

    // Log registration
    await AuditService.logLogin(req, user._id.toString(), true);

    const response: IApiResponse<IAuthResponse> = {
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          status: user.status,
          firstName: user.firstName,
          lastName: user.lastName,
          department: user.department,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          failedLoginAttempts: user.failedLoginAttempts,
        },
        tokens,
      },
    };

    res.status(201).json(response);
  },
);

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { email, password } = req.body;

  // Find user and include password
  const user = await UserModel.findOne({ email }).select("+password");

  if (!user) {
    await AuditService.logLogin(req, "", false, "User not found");
    res.status(401).json({
      success: false,
      message: "Invalid credentials",
    } as IApiResponse);
    return;
  }

  // Check if account is blocked
  if (user.status === "blocked") {
    await AuditService.logLogin(
      req,
      user._id.toString(),
      false,
      "Account blocked",
    );
    res.status(403).json({
      success: false,
      message: "Your account has been blocked. Please contact support.",
    } as IApiResponse);
    return;
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    // Increment failed login attempts
    user.failedLoginAttempts += 1;

    // Block account after 5 failed attempts
    if (user.failedLoginAttempts >= 5) {
      user.status = UserStatus.BLOCKED;
      await user.save();

      await AuditService.logLogin(
        req,
        user._id.toString(),
        false,
        "Account blocked due to failed attempts",
      );

      res.status(403).json({
        success: false,
        message: "Account blocked due to multiple failed login attempts",
      } as IApiResponse);
      return;
    }

    await user.save();
    await AuditService.logLogin(
      req,
      user._id.toString(),
      false,
      "Invalid password",
    );

    res.status(401).json({
      success: false,
      message: "Invalid credentials",
    } as IApiResponse);
    return;
  }

  // Reset failed attempts on successful login
  user.failedLoginAttempts = 0;
  user.lastLogin = new Date();
  user.lastLoginIP = req.ip;
  await user.save();

  // Generate tokens
  const tokens = await generateTokens(user._id.toString(), user.role, req);

  // Log successful login
  await AuditService.logLogin(req, user._id.toString(), true);

  const response: IApiResponse<IAuthResponse> = {
    success: true,
    message: "Login successful",
    data: {
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        firstName: user.firstName,
        lastName: user.lastName,
        department: user.department,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        failedLoginAttempts: user.failedLoginAttempts,
      },
      tokens,
    },
  };

  res.status(200).json(response);
});

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
export const refreshToken = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Refresh token is required",
      } as IApiResponse);
      return;
    }

    // Verify refresh token
    const decoded = jwt.verify(
      token,
      JWT_CONFIG.refreshToken.secret,
    ) as IJWTPayload;

    // Check if refresh token exists and is valid in database
    const session = await SessionModel.findOne({
      userId: decoded.userId,
      refreshToken: token,
      isValid: true,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      } as IApiResponse);
      return;
    }

    // Get user
    const user = await UserModel.findById(decoded.userId);

    if (!user || user.status === "blocked") {
      res.status(401).json({
        success: false,
        message: "User not found or blocked",
      } as IApiResponse);
      return;
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
        type: "access",
      },
      JWT_CONFIG.accessToken.secret,
      { expiresIn: JWT_CONFIG.accessToken.expiresIn },
    );

    const response: IApiResponse<{ accessToken: string }> = {
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: newAccessToken,
      },
    };

    res.status(200).json(response);
  },
);

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
export const logout = asyncHandler(async (req: IAuthRequest, res: Response) => {
  const { refreshToken } = req.body;

  // Invalidate refresh token
  if (refreshToken) {
    await SessionModel.updateOne({ refreshToken }, { isValid: false });
  }

  const response: IApiResponse = {
    success: true,
    message: "Logged out successfully",
  };

  res.status(200).json(response);
});

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
export const getCurrentUser = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const user = await UserModel.findById(req.user!.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      } as IApiResponse);
      return;
    }

    const response: IApiResponse = {
      success: true,
      data: user,
    };

    res.status(200).json(response);
  },
);

// ... (Previous login, register, refreshToken, logout, getCurrentUser methods from Part 1)

// @desc    Change password
// @route   PATCH /api/v1/auth/change-password
// @access  Private
export const changePassword = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    const user = await UserModel.findById(req.user!.userId).select("+password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      } as IApiResponse);
      return;
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      } as IApiResponse);
      return;
    }

    // Update password
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    // Invalidate all existing sessions
    await SessionModel.updateMany({ userId: user._id }, { isValid: false });

    // Log password change
    await AuditService.log({
      action: AuditAction.PASSWORD_CHANGED,
      performedBy: user._id.toString(),
      userRole: user.role,
      targetType: AuditTargetType.SYSTEM,
      ipAddress: req.ip!,
      userAgent: req.headers["user-agent"],
    });

    const response: IApiResponse = {
      success: true,
      message: "Password changed successfully. Please login again.",
    };

    res.status(200).json(response);
  },
);

// @desc    Update user profile
// @route   PATCH /api/v1/auth/update-profile
// @access  Private
export const updateProfile = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { firstName, lastName, department } = req.body;

    const user = await UserModel.findById(req.user!.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      } as IApiResponse);
      return;
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (department) user.department = department;

    await user.save();

    const response: IApiResponse = {
      success: true,
      message: "Profile updated successfully",
      data: user,
    };

    res.status(200).json(response);
  },
);

// @desc    Forgot password - Send reset token
// @route   POST /api/v1/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { email } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      // Don't reveal if user exists
      res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent",
      } as IApiResponse);
      return;
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id, type: "password-reset" },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: "1h" },
    );

    // In production, send email with reset link
    // For now, return token (remove in production)
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // TODO: Send email using email service
    console.log("Password reset URL:", resetUrl);

    // Log forgot password request
    await AuditService.log({
      action: AuditAction.PASSWORD_CHANGED,
      performedBy: user._id.toString(),
      userRole: user.role,
      targetType: AuditTargetType.SYSTEM,
      ipAddress: req.ip!,
      userAgent: req.headers["user-agent"],
      description: "Password reset requested",
    });

    const response: IApiResponse = {
      success: true,
      message: "Password reset link sent to email",
      // Remove this in production
      data: { resetToken, resetUrl },
    };

    res.status(200).json(response);
  },
);

// @desc    Reset password with token
// @route   POST /api/v1/auth/reset-password/:token
// @access  Public
export const resetPassword = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    try {
      // Verify reset token
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;

      if (decoded.type !== "password-reset") {
        res.status(400).json({
          success: false,
          message: "Invalid reset token",
        } as IApiResponse);
        return;
      }

      const user = await UserModel.findById(decoded.userId).select("+password");

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        } as IApiResponse);
        return;
      }

      // Update password
      user.password = newPassword;
      user.passwordChangedAt = new Date();
      user.failedLoginAttempts = 0;
      user.status = UserStatus.ACTIVE;
      await user.save();

      // Invalidate all sessions
      await SessionModel.updateMany({ userId: user._id }, { isValid: false });

      // Log password reset
      await AuditService.log({
        action: AuditAction.PASSWORD_CHANGED,
        performedBy: user._id.toString(),
        userRole: user.role,
        targetType: AuditTargetType.SYSTEM,
        ipAddress: req.ip!,
        userAgent: req.headers["user-agent"],
        description: "Password reset completed",
      });

      const response: IApiResponse = {
        success: true,
        message:
          "Password reset successful. You can now login with your new password.",
      };

      res.status(200).json(response);
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        res.status(400).json({
          success: false,
          message: "Reset token has expired. Please request a new one.",
        } as IApiResponse);
        return;
      }

      res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      } as IApiResponse);
    }
  },
);
