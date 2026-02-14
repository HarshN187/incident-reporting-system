import { AuditLogModel } from "../models";
import {
  IAuthRequest,
  IPaginationResult,
  IAuditLog,
  IAuditFilters,
  AuditAction,
  AuditTargetType,
  AuditStatus,
  UserRole,
  IIncidentDocument,
} from "../types";

interface LogParams {
  action: AuditAction;
  performedBy: string | null;
  userRole: UserRole | null;
  targetType: AuditTargetType;
  targetId?: string;
  changes?: any;
  ipAddress: string;
  userAgent?: string;
  requestMethod?: string;
  requestUrl?: string;
  description?: string;
  metadata?: Record<string, any>;
  status?: AuditStatus;
  errorMessage?: string;
}

export class AuditService {
  // Log any action to audit trail
  static async log(params: LogParams): Promise<IAuditLog | null> {
    try {
      const {
        action,
        performedBy,
        userRole,
        targetType,
        targetId = undefined,
        changes = undefined,
        ipAddress,
        userAgent,
        requestMethod = undefined,
        requestUrl = undefined,
        description = "",
        metadata = {},
        status = AuditStatus.SUCCESS,
        errorMessage = undefined,
      } = params;

      const auditLog = await AuditLogModel.create({
        action,
        performedBy,
        userRole,
        targetType,
        targetId,
        changes,
        ipAddress,
        userAgent,
        requestMethod,
        requestUrl,
        description,
        metadata,
        status,
        errorMessage,
      });

      return auditLog;
    } catch (error) {
      console.error("Audit logging failed:", error);
      return null;
    }
  }

  // Specific logging methods
  static async logIncidentCreated(
    req: IAuthRequest,
    incident: IIncidentDocument,
  ): Promise<IAuditLog | null> {
    return this.log({
      action: AuditAction.INCIDENT_CREATED,
      performedBy: req.user!.userId,
      userRole: req.user!.role,
      targetType: AuditTargetType.INCIDENT,
      targetId: incident._id.toString(),
      ipAddress: req.ip!,
      userAgent: req.headers["user-agent"],
      requestMethod: req.method,
      requestUrl: req.originalUrl,
      description: `Created incident: ${incident.title}`,
      metadata: {
        category: incident.category,
        priority: incident.priority,
      },
    });
  }

  static async logIncidentUpdated(
    req: IAuthRequest,
    incident: IIncidentDocument,
    oldData: any,
  ): Promise<IAuditLog | null> {
    return this.log({
      action: AuditAction.INCIDENT_UPDATED,
      performedBy: req.user!.userId,
      userRole: req.user!.role,
      targetType: AuditTargetType.INCIDENT,
      targetId: incident._id.toString(),
      changes: {
        before: oldData,
        after: incident.toObject(),
      },
      ipAddress: req.ip!,
      userAgent: req.headers["user-agent"],
      requestMethod: req.method,
      requestUrl: req.originalUrl,
      description: `Updated incident: ${incident.title}`,
    });
  }

  static async logBulkAction(
    req: IAuthRequest,
    action: string,
    count: number,
    metadata: Record<string, any> = {},
  ): Promise<IAuditLog | null> {
    return this.log({
      action: action as AuditAction,
      performedBy: req.user!.userId,
      userRole: req.user!.role,
      targetType: AuditTargetType.INCIDENT,
      ipAddress: req.ip!,
      userAgent: req.headers["user-agent"],
      requestMethod: req.method,
      requestUrl: req.originalUrl,
      description: `Bulk action: ${action} on ${count} incidents`,
      metadata: {
        count,
        ...metadata,
      },
    });
  }

  static async logLogin(
    req: IAuthRequest,
    userId: string,
    success: boolean = true,
    reason: string = "",
  ): Promise<IAuditLog | null> {
    return this.log({
      action: success ? AuditAction.LOGIN_SUCCESS : AuditAction.LOGIN_FAILED,
      performedBy: userId || null,
      userRole: null,
      targetType: AuditTargetType.SYSTEM,
      ipAddress: req.ip!,
      userAgent: req.headers["user-agent"],
      requestMethod: req.method,
      requestUrl: req.originalUrl,
      status: success ? AuditStatus.SUCCESS : AuditStatus.FAILED,
      errorMessage: success ? undefined : reason,
      description: success ? "User logged in" : `Login failed: ${reason}`,
    });
  }

  static async logUserManagement(
    req: IAuthRequest,
    action: AuditAction,
    targetUserId: string,
    changes: any = null,
  ): Promise<IAuditLog | null> {
    return this.log({
      action,
      performedBy: req.user!.userId,
      userRole: req.user!.role,
      targetType: AuditTargetType.USER,
      targetId: targetUserId,
      changes,
      ipAddress: req.ip!,
      userAgent: req.headers["user-agent"],
      requestMethod: req.method,
      requestUrl: req.originalUrl,
      description: `User management: ${action}`,
    });
  }

  // Query audit logs with filters
  static async queryLogs(
    filters: IAuditFilters = {},
    pagination: {
      page?: number;
      limit?: number;
      sortBy?: string;
    } = {},
  ): Promise<IPaginationResult<IAuditLog>> {
    const { page = 1, limit = 50, sortBy = "-timestamp" } = pagination;

    const query: any = {};

    // Build query from filters
    if (filters.action) query.action = filters.action;
    if (filters.performedBy) query.performedBy = filters.performedBy;
    if (filters.targetId) query.targetId = filters.targetId;
    if (filters.targetType) query.targetType = filters.targetType;
    if (filters.ipAddress) query.ipAddress = filters.ipAddress;

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }

    const totalCount = await AuditLogModel.countDocuments(query);

    const logs = await AuditLogModel.find(query)
      .populate("performedBy", "username email")
      .sort(sortBy)
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    return {
      data: logs as IAuditLog[],
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
      },
    };
  }

  // Add these methods to the AuditService class

  static async getLogById(id: string): Promise<IAuditLog | null> {
    try {
      const log = await AuditLogModel.findById(id)
        .populate("performedBy", "username email")
        .lean();

      return log as IAuditLog | null;
    } catch (error) {
      console.error("Failed to fetch audit log:", error);
      return null;
    }
  }

  static async exportLogs(
    format: "csv" | "pdf",
    filters: IAuditFilters = {},
  ): Promise<string> {
    const query: any = {};

    if (filters.action) query.action = filters.action;
    if (filters.performedBy) query.performedBy = filters.performedBy;
    if (filters.targetId) query.targetId = filters.targetId;

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }

    const logs = await AuditLogModel.find(query)
      .populate("performedBy", "username email")
      .sort("-timestamp")
      .lean();
    console.log("🚀 ~ AuditService ~ exportLogs ~ logs:", logs);

    if (format === "csv") {
      const { Parser } = require("json2csv");
      const fields = [
        { label: "ID", value: "_id" },
        { label: "Action", value: "action" },
        { label: "Performed By", value: "performedBy.username" },
        { label: "User Role", value: "userRole" },
        { label: "Target Type", value: "targetType" },
        { label: "IP Address", value: "ipAddress" },
        { label: "Status", value: "status" },
        { label: "Timestamp", value: "timestamp" },
      ];

      const parser = new Parser({ fields });
      console.log("🚀 ~ AuditService ~ exportLogs ~ parser:", parser);
      return parser.parse(logs);
    } else {
      // PDF export implementation
      const PDFDocument = require("pdfkit");
      const fs = require("fs");
      const path = require("path");

      return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const filename = `audit-logs-${Date.now()}.pdf`;
        const filepath = path.join(__dirname, "../../exports", filename);

        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        doc.fontSize(20).text("Audit Logs Report", { align: "center" });
        doc.moveDown();
        doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
        doc.moveDown();

        logs.forEach((log: any, index: number) => {
          if (index > 0) doc.moveDown();
          doc
            .fontSize(10)
            .text(`${index + 1}. ${log.action}`, { bold: true })
            .text(`Performed by: ${log.performedBy?.username || "N/A"}`)
            .text(`IP: ${log.ipAddress}`)
            .text(`Time: ${new Date(log.timestamp).toLocaleString()}`);

          if (doc.y > 700) {
            doc.addPage();
          }
        });

        doc.end();

        stream.on("finish", () => resolve(filepath));
        stream.on("error", (error: Error) => reject(error));
      });
    }
  }
}
