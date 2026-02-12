import express, { Router } from "express";
import { UserRole } from "../types/user.types";
import { checkRolePermission, verifyAccessToken } from "../middlewares";
import { exportIncidents } from "../controllers";

const router: Router = express.Router();

// All routes require authentication and Admin/Super Admin role
router.use(verifyAccessToken);
router.use(checkRolePermission(UserRole.ADMIN, UserRole.SUPERADMIN));

router.post("/incidents", exportIncidents);

export default router;
