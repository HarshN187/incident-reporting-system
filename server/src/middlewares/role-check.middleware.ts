import { Response, NextFunction } from "express";
import { IAuthRequest, UserRole } from "../types";
import { IncidentModel } from "../models";

export const checkRolePermission = (...allowedRoles: UserRole[]) => {
  return (req: IAuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized - Please authenticate first",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message:
          "Forbidden - You do not have permission to perform this action",
        requiredRole: allowedRoles,
        yourRole: req.user.role,
      });
      return;
    }

    next();
  };
};

export const canViewIncident = async (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.params;

  try {
    const incident = await IncidentModel.findById(id);

    if (!incident) {
      res.status(404).json({
        success: false,
        message: "Incident not found",
      });
      return;
    }

    // Admins and Super Admins can view all incidents
    if ([UserRole.ADMIN, UserRole.SUPERADMIN].includes(req.user!.role)) {
      req.incident = incident;
      next();
      return;
    }

    // Users can only view their own incidents
    if (incident.reportedBy.toString() !== req.user!.userId) {
      res.status(403).json({
        success: false,
        message: "You can only view your own incidents",
      });
      return;
    }

    req.incident = incident;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking permissions",
    });
  }
};

export const canModifyIncident = (
  req: IAuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (![UserRole.ADMIN, UserRole.SUPERADMIN].includes(req.user!.role)) {
    res.status(403).json({
      success: false,
      message: "Only admins can modify incidents",
    });
    return;
  }
  next();
};
