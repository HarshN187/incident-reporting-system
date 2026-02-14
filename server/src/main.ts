import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import http from "http";

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from "./routes/auth.routes";
import incidentRoutes from "./routes/incident.routes";
import userRoutes from "./routes/users.routes";
import analyticsRoutes from "./routes/analytics.routes";
import auditRoutes from "./routes/audit.routes";
import exportRoutes from "./routes/export.routes";
import uploadRoutes from "./routes/upload.routes";

// Import middleware
import { apiLimiter, errorHandler } from "./middlewares";

// Import socket initialization
import { initializeSocket } from "./socket";
import connectDB from "./config/db";

const app: Application = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);
app.set("io", io);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use("/api/", apiLimiter);

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/incidents", incidentRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/audit-logs", auditRoutes);
app.use("/api/v1/export", exportRoutes);
app.use("/api/v1/upload", uploadRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  });
};

startServer();

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
  console.error("❌ Unhandled Rejection:", err.message);
  server.close(() => process.exit(1));
});

export default app;
