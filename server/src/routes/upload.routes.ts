import express, { Router } from "express";
import {
  uploadEvidence,
  deleteEvidence,
  downloadEvidence,
} from "../controllers";
import { upload, uploadLimiter, verifyAccessToken } from "../middlewares";

const router: Router = express.Router();

// All routes require authentication
router.use(verifyAccessToken);

router.post(
  "/evidence",
  uploadLimiter,
  upload.array("evidence", 5),
  uploadEvidence,
);
router.delete("/evidence/:filename", deleteEvidence);
router.get("/evidence/:filename", downloadEvidence);

export default router;
