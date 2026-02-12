import express, { Router } from "express";
import {
  getAuditLogs,
  getAuditLog,
  getUserAuditLogs,
  getIncidentAuditLogs,
  exportAuditLogs,
} from "../controllers";
import { UserRole } from "../types";
import { checkRolePermission, verifyAccessToken } from "../middlewares";

const router: Router = express.Router();

// All routes require authentication and Super Admin role
router.use(verifyAccessToken);
router.use(checkRolePermission(UserRole.SUPERADMIN));

router.get("/", getAuditLogs);
router.get("/:id", getAuditLog);
router.get("/user/:userId", getUserAuditLogs);
router.get("/incident/:incidentId", getIncidentAuditLogs);
router.post("/export", exportAuditLogs);

export default router;
