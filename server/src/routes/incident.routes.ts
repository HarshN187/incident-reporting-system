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
  validate,
  verifyAccessToken,
} from "../middlewares";
import {
  bulkUpdateSchema,
  createIncidentSchema,
  updateIncidentSchema,
  updateStatusSchema,
} from "../validators";

const router: Router = express.Router();

router.use(verifyAccessToken);

// User routes
router.post("/", validate(createIncidentSchema), createIncident);
router.get("/my-incidents", getMyIncidents);

router.patch(
  "/bulk-update",
  checkRolePermission(UserRole.ADMIN, UserRole.SUPERADMIN),
  validate(bulkUpdateSchema),
  bulkUpdateIncidents,
);

// Routes accessible by all authenticated users
router.get("/", getIncidents);
router.get("/:id", canViewIncident, getIncident);

// Admin/Super Admin only routes
router.patch(
  "/:id",
  checkRolePermission(UserRole.ADMIN, UserRole.SUPERADMIN),
  validate(updateIncidentSchema),
  updateIncident,
);
router.patch(
  "/:id/status",
  checkRolePermission(UserRole.ADMIN, UserRole.SUPERADMIN),
  validate(updateStatusSchema),
  updateIncidentStatus,
);
router.patch(
  "/:id/assign",
  checkRolePermission(UserRole.ADMIN, UserRole.SUPERADMIN),
  assignIncident,
);

// Super Admin only
router.delete("/:id", checkRolePermission(UserRole.SUPERADMIN), deleteIncident);

export default router;
