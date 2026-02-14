import { Response } from "express";
import fs from "fs";
import { IAuthRequest, IApiResponse } from "../types/api.types";
import { asyncHandler } from "../middlewares";
import { exportToCSV, exportToPDF } from "../utils";
import { IncidentModel } from "../models";
import { AuditService } from "../services";
import { AuditAction, AuditTargetType } from "../types";

// @desc    Export incidents
// @route   POST /api/v1/export/incidents
// @access  Private (Admin/Super Admin)
export const exportIncidents = asyncHandler(
  async (req: IAuthRequest, res: Response) => {
    const { format, filters = {} } = req.body;

    // Build query
    const query: any = {};

    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;
    if (filters.priority) query.priority = filters.priority;

    if (filters.dateFrom && filters.dateTo) {
      query.createdAt = {
        $gte: new Date(filters.dateFrom),
        $lte: new Date(filters.dateTo),
      };
    }

    // Fetch incidents
    const incidents = await IncidentModel.find(query)
      .populate("reportedBy", "username email")
      .populate("assignedTo", "username email")
      .populate("resolvedBy", "username email")
      .sort({ createdAt: -1 })
      .lean();

    // Log export
    await AuditService. log({
      action: AuditAction.DATA_EXPORT,
      performedBy: req.user!.userId,
      userRole: req.user!.role,
      targetType: AuditTargetType.SYSTEM,
      ipAddress: req.ip!,
      userAgent: req.headers["user-agent"],
      metadata: {
        format,
        incidentCount: incidents.length,
        filters,
      },
    });

    if (format === "csv") {
      const csv = exportToCSV(incidents);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=incidents-${Date.now()}.csv`,
      );
      res.send(csv);
    } else if (format === "pdf") {
      const filepath = await exportToPDF(incidents);

      res.download(filepath, (err) => {
        if (err) {
          console.error("Download error:", err);
        }
        // Delete file after sending
        fs.unlinkSync(filepath);
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid format. Use "csv" or "pdf"',
      } as IApiResponse);
    }
  },
);
