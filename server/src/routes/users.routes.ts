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
import {
  checkRolePermission,
  validate,
  verifyAccessToken,
} from "../middlewares";
import {
  changeRoleSchema,
  createUserSchema,
  updateUserSchema,
} from "../validators";

const router: Router = express.Router();

// All routes require authentication and Super Admin role
router.use(verifyAccessToken);
router.use(checkRolePermission(UserRole.SUPERADMIN));

router.get("/", getAllUsers);
router.get("/:id", getUser);
router.post("/", validate(createUserSchema), createUser);
router.patch("/:id", validate(updateUserSchema), updateUser);
router.delete("/:id", deleteUser);
router.patch("/:id/role", validate(changeRoleSchema), changeUserRole);
router.patch("/:id/block", blockUser);
router.patch("/:id/unblock", unblockUser);

export default router;
