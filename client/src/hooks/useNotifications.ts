import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { toast } from "react-toastify";

interface Notification {
  id: string;
  type: string;
  message: string;
  data: any;
  timestamp: Date;
}

interface UseNotificationsResult {
  notifications: Notification[];
  clearNotifications: () => void;
  clearNotification: (id: string) => void;
}

export const useNotifications = (): UseNotificationsResult => {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!socket) return;

    // Listen for incident updates
    socket.on("incident:updated", (data: any) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: "incident:updated",
        message: `Incident #${data.incidentId} has been updated`,
        data,
        timestamp: new Date(),
      };

      setNotifications((prev) => [...prev, notification]);
      toast.info(notification.message);
    });

    // Listen for new incidents (for admins)
    socket.on("incident:created", (data: any) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: "incident:created",
        message: `New incident reported: ${data.title}`,
        data,
        timestamp: new Date(),
      };

      setNotifications((prev) => [...prev, notification]);
      toast.success(notification.message);
    });

    // Listen for status changes
    socket.on("incident:status-changed", (data: any) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: "incident:status-changed",
        message: `Your incident status changed to: ${data.newStatus}`,
        data,
        timestamp: new Date(),
      };

      setNotifications((prev) => [...prev, notification]);
      toast.info(notification.message);
    });

    // Listen for assignments
    socket.on("incident:assigned", (data: any) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: "incident:assigned",
        message: data.message,
        data,
        timestamp: new Date(),
      };

      setNotifications((prev) => [...prev, notification]);
      toast.info(notification.message);
    });

    return () => {
      socket.off("incident:updated");
      socket.off("incident:created");
      socket.off("incident:status-changed");
      socket.off("incident:assigned");
    };
  }, [socket]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return {
    notifications,
    clearNotifications,
    clearNotification,
  };
};
