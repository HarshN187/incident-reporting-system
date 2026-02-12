import { Response } from "express";
import path from "path";
import fs from "fs";
import {
  IAuthRequest,
  IApiResponse,
  AuditAction,
  AuditTargetType,
} from "../types";
import { asyncHandler } from "../middlewares";
import { AuditService } from "../services";

// @desc    Upload evidence files
// @route   POST /api/v1/upload/evidence
// @access  Private
export const uploadEvidence = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      res.status(400).json({
        success: false,
        message: "No files uploaded",
      } as IApiResponse);
      return;
    }

    const files = req.files as Express.Multer.File[];

    const fileData = files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/evidence/${file.filename}`,
      uploadedAt: new Date(),
    }));

    // Log upload
    await AuditService.log({
      action: AuditAction.FILE_UPLOADED,
      performedBy: req.user!.userId,
      userRole: req.user!.role,
      targetType: AuditTargetType.FILE,
      ipAddress: req.ip!,
      userAgent: req.headers["user-agent"],
      metadata: {
        fileCount: files.length,
        totalSize: files.reduce((sum, f) => sum + f.size, 0),
      },
    });

    const response: IApiResponse = {
      success: true,
      message: "Files uploaded successfully",
      data: fileData,
    };

    res.status(200).json(response);
  },
);

// @desc    Delete evidence file
// @route   DELETE /api/v1/upload/evidence/:filename
// @access  Private
export const deleteEvidence = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { filename } = req.params;

    const filePath = path.join(__dirname, "../../uploads/evidence", filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        message: "File not found",
      } as IApiResponse);
      return;
    }

    fs.unlinkSync(filePath);

    // Log deletion
    await AuditService.log({
      action: AuditAction.FILE_DELETED,
      performedBy: req.user!.userId,
      userRole: req.user!.role,
      targetType: AuditTargetType.FILE,
      ipAddress: req.ip!,
      userAgent: req.headers["user-agent"],
      metadata: { filename },
    });

    const response: IApiResponse = {
      success: true,
      message: "File deleted successfully",
    };

    res.status(200).json(response);
  },
);

// @desc    Download evidence file
// @route   GET /api/v1/upload/evidence/:filename
// @access  Private
export const downloadEvidence = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { filename } = req.params;

    const filePath = path.join(__dirname, "../../uploads/evidence", filename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        message: "File not found",
      } as IApiResponse);
      return;
    }

    res.download(filePath);
  },
);
