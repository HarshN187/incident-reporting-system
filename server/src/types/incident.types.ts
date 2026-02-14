import { Document, Types } from "mongoose";
import { IUser } from "./user.types";

export enum IncidentCategory {
  PHISHING = "phishing",
  MALWARE = "malware",
  RANSOMWARE = "ransomware",
  UNAUTHORIZED_ACCESS = "unauthorized_access",
  DATA_BREACH = "data_breach",
  DDOS = "ddos",
  SOCIAL_ENGINEERING = "social_engineering",
  INSIDER_THREAT = "insider_threat",
  OTHER = "other",
}

export enum IncidentPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum IncidentStatus {
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  CLOSED = "closed",
  REJECTED = "rejected",
}

export interface IEvidenceFile {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

export interface IActivityLog {
  action: string;
  performedBy: string;
  timestamp: Date;
  details?: string;
}

export interface IIncident {
  _id: Types.ObjectId;
  title: string;
  description: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  severity: number;
  status: IncidentStatus;
  reportedBy: Types.ObjectId | IUser;
  assignedTo?: string | IUser;
  evidenceFiles: IEvidenceFile[];
  resolutionNotes?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionTime?: number;
  incidentDate: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  tags: string[];
  activityLog: IActivityLog[];
}

export interface IIncidentDocument extends IIncident, Document {
  ageInDays: number;
}

export interface IIncidentCreate {
  title: string;
  description: string;
  category: IncidentCategory;
  priority?: IncidentPriority;
  severity?: number;
  evidenceFiles?: IEvidenceFile[];
  tags?: string[];
}

export interface IIncidentUpdate {
  title?: string;
  description?: string;
  category?: IncidentCategory;
  priority?: IncidentPriority;
  severity?: number;
  status?: IncidentStatus;
  assignedTo?: string;
  resolutionNotes?: string;
  tags?: string[];
}

export interface IIncidentFilters {
  status?: IncidentStatus;
  category?: IncidentCategory;
  priority?: IncidentPriority;
  reportedBy?: string;
  assignedTo?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  incidentId?: string;
  page?: string;
  sortBy?: string;
  limit?: string;
}

export interface IBulkUpdate {
  incidentIds: string[];
  status?: IncidentStatus;
  assignedTo?: string;
  resolutionNotes?: string;
}
