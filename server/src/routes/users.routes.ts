import express, { Router } from "express";
import {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  changeUserRole,
  blockUser,
  unblockUser,
} from "../controllers";

import { UserRole } from "../types";
import { checkRolePermission, verifyAccessToken } from "../middlewares";

const router: Router = express.Router();

// All routes require authentication and Super Admin role
router.use(verifyAccessToken);
router.use(checkRolePermission(UserRole.SUPERADMIN));

router.get("/", getAllUsers);
router.get("/:id", getUser);
router.post("/", createUser);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);
router.patch("/:id/role", changeUserRole);
router.patch("/:id/block", blockUser);
router.patch("/:id/unblock", unblockUser);

export default router;
