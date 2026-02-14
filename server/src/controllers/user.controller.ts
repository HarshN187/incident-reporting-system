import { Response } from "express";
import { UserModel } from "../models";
import {
  IAuthRequest,
  IApiResponse,
  IPaginationResult,
  IAuthenticatedRequest,
} from "../types/api.types";
import { IUser, IUserFilter, UserRole, UserStatus } from "../types/user.types";
import { AuditAction } from "../types/audit.types";
import { asyncHandler } from "../middlewares";
import { AuditService } from "../services";
import { RootFilterQuery } from "mongoose";

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private (Super Admin)
export const getAllUsers = asyncHandler(
  async (req: IAuthenticatedRequest<IUserFilter>, res: Response) => {
    const {
      page = "1",
      limit = "10",
      role,
      status,
      search,
      sortBy = "-createdAt",
    } = req.query;

    const pageNum = parseInt(String(page));
    const limitNum = parseInt(String(limit));

    const query: RootFilterQuery<typeof UserModel> = {};

    if (role) query.role = role;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ];
    }

    const totalCount = await UserModel.countDocuments(query);

    const users = await UserModel.find(query)
      .select("-password")
      .sort(sortBy)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean();

    const response: IApiResponse<IPaginationResult<IUser>> = {
      success: true,
      data: {
        data: users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalCount,
        },
      },
    };

    res.status(200).json(response);
  },
);

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private (Super Admin)
export const getUser = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { id } = req.params;

    const user = await UserModel.findById(id).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const response: IApiResponse<IUser> = {
      success: true,
      data: user,
    };

    res.status(200).json(response);
  },
);

// @desc    Create new user
// @route   POST /api/v1/users
// @access  Private (Super Admin)
export const createUser = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { username, email, password, firstName, lastName, role, department } =
      req.body;

    const existingUser = await UserModel.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User already exists with this email or username",
      });
      return;
    }

    const user = await UserModel.create({
      username,
      email,
      password,
      firstName,
      lastName,
      role: role || UserRole.USER,
      department,
      createdBy: req.user!.userId,
    });

    await AuditService.logUserManagement(
      req,
      AuditAction.USER_CREATED,
      user._id.toString(),
    );

    const response: IApiResponse<IUser> = {
      success: true,
      message: "User created successfully",
      data: user,
    };

    res.status(201).json(response);
  },
);

// @desc    Update user
// @route   PATCH /api/v1/users/:id
// @access  Private (Super Admin)
export const updateUser = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { id } = req.params;
    const { firstName, lastName, email, department } = req.body;

    const user = await UserModel.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const oldData = user.toObject();

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (department) user.department = department;

    await user.save();

    await AuditService.logUserManagement(
      req,
      AuditAction.USER_UPDATED,
      user._id.toString(),
      { before: oldData, after: user.toObject() },
    );

    const response: IApiResponse<IUser> = {
      success: true,
      message: "User updated successfully",
      data: user,
    };

    res.status(200).json(response);
  },
);

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private (Super Admin)
export const deleteUser = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { id } = req.params;

    const user = await UserModel.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Cannot delete yourself
    if (user._id.toString() === req.user!.userId) {
      res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
      return;
    }

    await user.deleteOne();

    await AuditService.logUserManagement(req, AuditAction.USER_DELETED, id);

    const response: IApiResponse = {
      success: true,
      message: "User deleted successfully",
    };

    res.status(200).json(response);
  },
);

// @desc    Change user role
// @route   PATCH /api/v1/users/:id/role
// @access  Private (Super Admin)
export const changeUserRole = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!Object.values(UserRole).includes(role)) {
      res.status(400).json({
        success: false,
        message: "Invalid role",
      });
      return;
    }

    const user = await UserModel.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await AuditService.logUserManagement(
      req,
      AuditAction.USER_ROLE_CHANGED,
      user._id.toString(),
      { before: { role: oldRole }, after: { role } },
    );

    // Notify user via socket
    const io = req.app.get("io");
    io.to(`user:${user._id}`).emit("user:role-changed", {
      userId: user._id.toString(),
      oldRole,
      newRole: role,
      message: `Your role has been changed to ${role}`,
    });

    const response: IApiResponse<IUser> = {
      success: true,
      message: "User role updated successfully",
      data: user,
    };

    res.status(200).json(response);
  },
);

// @desc    Block user
// @route   PATCH /api/v1/users/:id/block
// @access  Private (Super Admin)
export const blockUser = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { id } = req.params;

    const user = await UserModel.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (user._id.toString() === req.user!.userId) {
      res.status(400).json({
        success: false,
        message: "You cannot block yourself",
      });
      return;
    }

    user.status = UserStatus.BLOCKED;
    await user.save();

    await AuditService.logUserManagement(
      req,
      AuditAction.USER_BLOCKED,
      user._id.toString(),
    );

    const response: IApiResponse<IUser> = {
      success: true,
      message: "User blocked successfully",
      data: user,
    };

    res.status(200).json(response);
  },
);

// @desc    Unblock user
// @route   PATCH /api/v1/users/:id/unblock
// @access  Private (Super Admin)
export const unblockUser = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { id } = req.params;

    const user = await UserModel.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    user.status = UserStatus.ACTIVE;
    user.failedLoginAttempts = 0;
    await user.save();

    await AuditService.logUserManagement(
      req,
      AuditAction.USER_UNBLOCKED,
      user._id.toString(),
    );

    const response: IApiResponse<IUser> = {
      success: true,
      message: "User unblocked successfully",
      data: user,
    };

    res.status(200).json(response);
  },
);
