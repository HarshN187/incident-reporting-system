import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { IJWTPayload } from "../types/user.types";
import { IIncidentDocument } from "../types/incident.types";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export const initializeSocket = (server: HTTPServer): Server => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET!,
      ) as IJWTPayload;

      socket.userId = decoded.userId;
      socket.userRole = decoded.role;

      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Join role-based room
    socket.join(`role:${socket.userRole}`);

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

// Helper function to notify incident update
export const notifyIncidentUpdate = (
  io: Server,
  userId: string,
  incidentData: IIncidentDocument,
): void => {
  io.to(`user:${userId}`).emit("incident:updated", {
    incidentId: incidentData._id.toString(),
    title: incidentData.title,
    status: incidentData.status,
    message: "Your incident has been updated",
  });
};

// Helper function to notify new incident to admins
export const notifyNewIncident = (
  io: Server,
  incidentData: IIncidentDocument,
): void => {
  io.to("role:admin").to("role:superadmin").emit("incident:created", {
    incidentId: incidentData._id.toString(),
    title: incidentData.title,
    category: incidentData.category,
    priority: incidentData.priority,
    reportedBy: incidentData.reportedBy,
  });
};
