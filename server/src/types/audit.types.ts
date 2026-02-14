import { Document, Types } from "mongoose";
import { IUser, UserRole } from "./user.types";

export enum AuditAction {
  // Incident Actions
  INCIDENT_CREATED = "incident_created",
  INCIDENT_UPDATED = "incident_updated",
  INCIDENT_DELETED = "incident_deleted",
  INCIDENT_STATUS_CHANGED = "incident_status_changed",
  INCIDENT_ASSIGNED = "incident_assigned",
  INCIDENT_RESOLVED = "incident_resolved",

  // User Actions
  USER_CREATED = "user_created",
  USER_UPDATED = "user_updated",
  USER_DELETED = "user_deleted",
  USER_ROLE_CHANGED = "user_role_changed",
  USER_BLOCKED = "user_blocked",
  USER_UNBLOCKED = "user_unblocked",

  // Auth Actions
  LOGIN_SUCCESS = "login_success",
  LOGIN_FAILED = "login_failed",
  LOGOUT = "logout",
  PASSWORD_CHANGED = "password_changed",
  TOKEN_REFRESHED = "token_refreshed",

  // Bulk Actions
  BULK_STATUS_UPDATE = "bulk_status_update",
  BULK_ASSIGN = "bulk_assign",
  DATA_EXPORT = "data_export",

  // System Actions
  SETTINGS_CHANGED = "settings_changed",
  FILE_UPLOADED = "file_uploaded",
  FILE_DELETED = "file_deleted",
}

export enum AuditTargetType {
  INCIDENT = "incident",
  USER = "user",
  SYSTEM = "system",
  FILE = "file",
}

export enum AuditStatus {
  SUCCESS = "success",
  FAILED = "failed",
  PARTIAL = "partial",
}

export interface IChangeLog {
  before?: any;
  after?: any;
}

export interface IAuditLog {
  _id: Types.ObjectId;
  action: AuditAction;
  performedBy: Types.ObjectId | IUser;
  userRole: UserRole;
  targetType: AuditTargetType;
  targetId?: string;
  changes?: IChangeLog;
  ipAddress: string;
  userAgent?: string;
  requestMethod?: string;
  requestUrl?: string;
  description?: string;
  metadata?: Record<string, any>;
  status: AuditStatus;
  errorMessage?: string;
  timestamp: Date;
}

export interface IAuditLogDocument extends IAuditLog, Document {}

export interface IAuditFilters {
  action?: AuditAction;
  performedBy?: string;
  targetId?: string;
  targetType?: AuditTargetType;
  ipAddress?: string;
  startDate?: Date;
  endDate?: Date;
  page?: string;
  limit?: string;
  sortBy?: string;
  incidentId?: string;
}
