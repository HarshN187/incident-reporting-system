import { Response } from "express";
import { IAuthRequest, IApiResponse, IAuditFilters } from "../types";
import { asyncHandler } from "../middlewares";
import { AuditService } from "../services";

// @desc    Get all audit logs
// @route   GET /api/v1/audit-logs
// @access  Private (Super Admin)
export const getAuditLogs = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const {
      page = "1",
      limit = "50",
      action,
      performedBy,
      targetType,
      ipAddress,
      startDate,
      endDate,
      sortBy = "-timestamp",
    } = req.query;

    const filters: IAuditFilters = {
      action: action as any,
      performedBy: performedBy as string,
      targetType: targetType as any,
      ipAddress: ipAddress as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    };

    const result = await AuditService.queryLogs(filters, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sortBy: sortBy as string,
    });

    const response: IApiResponse = {
      success: true,
      data: result,
    };

    res.status(200).json(response);
  },
);

// @desc    Get single audit log
// @route   GET /api/v1/audit-logs/:id
// @access  Private (Super Admin)
export const getAuditLog = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { id } = req.params;

    const log = await AuditService.getLogById(id);

    if (!log) {
      res.status(404).json({
        success: false,
        message: "Audit log not found",
      } as IApiResponse);
      return;
    }

    const response: IApiResponse = {
      success: true,
      data: log,
    };

    res.status(200).json(response);
  },
);

// @desc    Get audit logs for specific user
// @route   GET /api/v1/audit-logs/user/:userId
// @access  Private (Super Admin)
export const getUserAuditLogs = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { userId } = req.params;
    const { page = "1", limit = "50" } = req.query;

    const result = await AuditService.queryLogs(
      { performedBy: userId },
      {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      },
    );

    const response: IApiResponse = {
      success: true,
      data: result,
    };

    res.status(200).json(response);
  },
);

// @desc    Get audit logs for specific incident
// @route   GET /api/v1/audit-logs/incident/:incidentId
// @access  Private (Super Admin)
export const getIncidentAuditLogs = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { incidentId } = req.params;
    const { page = "1", limit = "50" } = req.query;

    const result = await AuditService.queryLogs(
      { targetId: incidentId },
      {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      },
    );

    const response: IApiResponse = {
      success: true,
      data: result,
    };

    res.status(200).json(response);
  },
);

// @desc    Export audit logs
// @route   POST /api/v1/audit-logs/export
// @access  Private (Super Admin)
export const exportAuditLogs = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { format = "csv", filters = {} } = req.body;

    const result = await AuditService.exportLogs(format, filters);

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=audit-logs-${Date.now()}.csv`,
      );
      res.send(result);
    } else {
      res.download(result as string);
    }
  },
);
