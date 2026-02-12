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
import { authLimiter, verifyAccessToken } from "../middlewares";

const router: Router = express.Router();

// Public routes with rate limiting
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Protected routes
router.use(verifyAccessToken); // All routes below require authentication

router.post("/logout", logout);
router.get("/me", getCurrentUser);
router.patch("/update-profile", updateProfile);
router.patch("/change-password", changePassword);

export default router;
