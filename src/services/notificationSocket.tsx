"use client";

import { createContext, useContext, useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import { toast } from "react-hot-toast";
import { onMessageListener } from "@/utils/firebase";
import { useAuthStore } from "@/store/authStore";

interface Notification {
  id: string;
  user_id: string;
  channel: string;
  user_email: string | null;
  user_phone: string;
  origin_service: string;
  template_id: string;
  entity_id: string;
  entity_type: string;
  type: string;
  payload: { name: string; time: string };
  body: string;
  status: string;
  delivered_at: string | null;
  attempts: number;
  read_receipt: boolean;
  priority: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  template: { id: string; template_code: string; title: string; language: string };
}

interface SocketContextType {
  socket: Socket | null;
  notifications: Notification[];
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) return;

    // Initialize Socket.IO
    const socketInstance = io("http://138.68.190.213:3002", {
      extraHeaders: {
        "x-api-key": "QgR1v+o16jphR9AMSJ9Qf8SnOqmMd4HPziLZvMU1Mt0t7ocaT38q/8AsuOII2YxM60WaXQMkFIYv2bqo+pS/sw==",
        "bearer-token": accessToken,
      },
    });

    setSocket(socketInstance);

    // Socket event listeners
    socketInstance.on("connect", () => {
      console.log("Socket connected");
      socketInstance.emit("user-notifications", { page: 1, pageSize: 10 });
      socketInstance.emit("get-unread-count");
    });

    socketInstance.on("user-notifications", (data: { notifications: Notification[] }) => {
      setNotifications(data.notifications || []);
    });

    socketInstance.on("new-notification", (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      toast.success(notification.body, { duration: 4000 });
    });

    socketInstance.on("get-unread-count", (data: { count: number }) => {
      console.log("Unread notifications count:", data.count);
    });

    // Firebase Messaging foreground listener
    onMessageListener((payload) => {
      const notification = payload.notification;
      if (notification) {
        toast.success(notification.body || "New notification", {
          duration: 4000,
          icon: "🔔",
        });
      }
    });

    return () => {
      socketInstance.disconnect();
      setSocket(null);
    };
  }, [accessToken]);

  const markAsRead = (notificationId: string) => {
    if (socket) {
      socket.emit("mark-notification-as-read", { notificationId });
    }
  };

  const markAllAsRead = () => {
    if (socket) {
      socket.emit("mark-all-as-read");
    }
  };

  return (
    <SocketContext.Provider value={{ socket, notifications, markAsRead, markAllAsRead }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};