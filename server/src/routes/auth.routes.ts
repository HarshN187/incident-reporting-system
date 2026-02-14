import express, { Router } from "express";
import {
  register,
  login,
  logout,
  getCurrentUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  updateProfile,
} from "../controllers";
import { authLimiter, validate, verifyAccessToken } from "../middlewares";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
} from "../validators";

const router: Router = express.Router();

// Public routes with rate limiting
router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);

router.post("/refresh-token", refreshToken);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Protected routes
router.use(verifyAccessToken);

router.post("/logout", logout);
router.get("/me", getCurrentUser);
router.patch("/update-profile", updateProfile);
router.patch(
  "/change-password",
  validate(changePasswordSchema),
  changePassword,
);

export default router;
