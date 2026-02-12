import express, { Router } from "express";
import {
  createIncident,
  getIncidents,
  getIncident,
  updateIncident,
  updateIncidentStatus,
  assignIncident,
  bulkUpdateIncidents,
  deleteIncident,
  getMyIncidents,
} from "../controllers";
import { UserRole } from "../types";
import {
  canViewIncident,
  checkRolePermission,
  verifyAccessToken,
} from "../middlewares";

const router: Router = express.Router();

// All routes require authentication
router.use(verifyAccessToken);

// User routes
router.post("/", createIncident);
router.get("/my-incidents", getMyIncidents);

// Routes accessible by all authenticated users
router.get("/", getIncidents);
router.get("/:id", canViewIncident, getIncident);

// Admin/Super Admin only routes
router.patch(
  "/:id",
  checkRolePermission(UserRole.ADMIN, UserRole.SUPERADMIN),
  updateIncident,
);
router.patch(
  "/:id/status",
  checkRolePermission(UserRole.ADMIN, UserRole.SUPERADMIN),
  updateIncidentStatus,
);
router.patch(
  "/:id/assign",
  checkRolePermission(UserRole.ADMIN, UserRole.SUPERADMIN),
  assignIncident,
);
router.patch(
  "/bulk-update",
  checkRolePermission(UserRole.ADMIN, UserRole.SUPERADMIN),
  bulkUpdateIncidents,
);

// Super Admin only
router.delete("/:id", checkRolePermission(UserRole.SUPERADMIN), deleteIncident);

export default router;
