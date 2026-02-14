export interface User {
  _id: string;
  username: string;
  email: string;
  role: "user" | "admin" | "superadmin";
  status: "active" | "blocked" | "pending";
  firstName?: string;
  lastName?: string;
  department?: string;
  lastLogin?: Date;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  department?: string;
}

export interface Incident {
  _id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  severity: number;
  status: IncidentStatus;
  reportedBy: User | string;
  assignedTo?: User | string;
  evidenceFiles: EvidenceFile[];
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: User | string;
  resolutionTime?: number;
  incidentDate: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export type IncidentCategory =
  | "phishing"
  | "malware"
  | "ransomware"
  | "unauthorized_access"
  | "data_breach"
  | "ddos"
  | "social_engineering"
  | "insider_threat"
  | "other";

export type IncidentPriority = "low" | "medium" | "high" | "critical";

export type IncidentStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed"
  | "rejected";

export interface EvidenceFile {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface IncidentCreate {
  title: string;
  description: string;
  category: IncidentCategory;
  priority?: IncidentPriority;
  severity?: number;
  evidenceFiles?: EvidenceFile[];
  tags?: string[];
}

export interface DashboardAnalytics {
  totalIncidents: number;
  statusStats: {
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
    rejected: number;
  };
  categoryData: Array<{
    category: string;
    count: number;
  }>;
  averageResolutionTime: {
    minutes: number;
    hours: string;
  };
  resolutionTimeTrend: Array<{
    date: string;
    avgResolutionTime: number;
    count: number;
  }>;
  priorityStats: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export interface AuditLog {
  _id: string;
  action: string;
  performedBy: User;
  userRole: string;
  targetType: string;
  targetId?: string;
  ipAddress: string;
  description?: string;
  timestamp: string;
  status: "success" | "failed" | "partial";
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface PaginationParams {
  page: number;
  limit: number;
  totalPages: number;
  totalCount: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationParams;
}
