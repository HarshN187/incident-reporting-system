import express, { Router } from "express";
import {
  getDashboardAnalytics,
  getIncidentTrends,
  getCategoryBreakdown,
  getStatusBreakdown,
  getResolutionTimeAnalytics,
  getUserActivityStats,
} from "../controllers";
import { UserRole } from "../types";
import { checkRolePermission, verifyAccessToken } from "../middlewares";

const router: Router = express.Router();

// All routes require authentication and Admin/Super Admin role
router.use(verifyAccessToken);
router.use(checkRolePermission(UserRole.ADMIN, UserRole.SUPERADMIN));

router.get("/dashboard", getDashboardAnalytics);
router.get("/trends", getIncidentTrends);
router.get("/category-breakdown", getCategoryBreakdown);
router.get("/status-breakdown", getStatusBreakdown);
router.get("/resolution-time", getResolutionTimeAnalytics);
router.get("/user-activity", getUserActivityStats);

export default router;
