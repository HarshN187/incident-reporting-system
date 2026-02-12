import multer, { StorageEngine, FileFilterCallback } from "multer";
import path from "path";
import crypto from "crypto";
import { Request } from "express";

// Allowed file types
const ALLOWED_MIMETYPES: string[] = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "10485760"); // 10MB

// Configure storage
const storage: StorageEngine = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, "uploads/evidence/");
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const uniqueName = `${Date.now()}-${crypto
      .randomBytes(16)
      .toString("hex")}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, GIF, PDF, DOC, and TXT files are allowed.",
      ),
    );
  }
};

// Configure multer
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5,
  },
  fileFilter: fileFilter,
});
