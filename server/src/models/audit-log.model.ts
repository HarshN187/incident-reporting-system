import mongoose, { Schema, Model } from "mongoose";
import {
  IAuditLogDocument,
  AuditAction,
  AuditTargetType,
  AuditStatus,
} from "../types/audit.types";
import { UserRole } from "../types";

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    action: {
      type: String,
      required: true,
      enum: Object.values(AuditAction),
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userRole: {
      type: String,
      enum: Object.values(UserRole),
    },
    targetType: {
      type: String,
      enum: Object.values(AuditTargetType),
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    changes: {
      before: Schema.Types.Mixed,
      after: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
    },
    requestMethod: {
      type: String,
      enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
    requestUrl: {
      type: String,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: Object.values(AuditStatus),
      default: AuditStatus.SUCCESS,
    },
    errorMessage: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: false,
  },
);

// Indexes
auditLogSchema.index({ performedBy: 1, timestamp: -1 });
auditLogSchema.index({ targetId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ ipAddress: 1 });

// TTL index - automatically delete logs older than 2 years
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 });

export const AuditLogModel: Model<IAuditLogDocument> =
  mongoose.model<IAuditLogDocument>("audit_logs", auditLogSchema);
