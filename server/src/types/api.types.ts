import { Request } from "express";
import { IUser, UserRole } from "./user.types";
import {
  IIncidentDocument,
  IncidentCategory,
  IncidentPriority,
  IncidentStatus,
} from "./incident.types";

export interface IAuthRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
    email: string;
    username: string;
  };
  incident?: IIncidentDocument;
}
export interface IAuthenticatedRequest<
  TQuery = {},
  TParams = {},
  TBody = {},
> extends Request<TParams, any, TBody, TQuery> {
  user?: {
    userId: string;
    role: UserRole;
    email: string;
    username: string;
  };
  incident?: IIncidentDocument;
}

export interface IPaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
}

export interface IPaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalCount: number;
  };
}

export interface IApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface ISocketEvents {
  "incident:created": (data: IIncidentNotification) => void;
  "incident:updated": (data: IIncidentNotification) => void;
  "incident:status-changed": (data: IStatusChangeNotification) => void;
  "incident:assigned": (data: IAssignmentNotification) => void;
  "user:role-changed": (data: IRoleChangeNotification) => void;
}

export interface IIncidentNotification {
  incidentId: string;
  title: string;
  category?: IncidentCategory;
  priority?: IncidentPriority;
  status?: IncidentStatus;
  reportedBy?: string;
  message: string;
}

export interface IStatusChangeNotification {
  incidentId: string;
  title: string;
  oldStatus: IncidentStatus;
  newStatus: IncidentStatus;
  message: string;
}

export interface IAssignmentNotification {
  incidentId: string;
  count?: number;
  message: string;
}

export interface IRoleChangeNotification {
  userId: string;
  oldRole: UserRole;
  newRole: UserRole;
  message: string;
}
