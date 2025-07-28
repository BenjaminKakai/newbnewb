"use client";

import React, { useEffect } from "react";
import { ToastProvider } from "./ToastProvider";
import { KycRouteGuard } from "@/features/auth/components/KycRouteGuard";
import { NotificationProvider } from "@/features/calls/components/NotificationContext";
import { ThemeProvider } from "./ThemeProvider";
import { SocketProvider } from "@/services/notificationSocket";
import { useTokenSync } from "@/hooks/useTokenSync";
import { useAuthInit } from "@/store/authStore";

function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuthInit();
  useTokenSync();

  return <>{children}</>;
}

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          console.log("🔔 Notification permission:", permission);
        });
      }
    }
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <SocketProvider>
            <NotificationProvider>
              <KycRouteGuard>{children}</KycRouteGuard>
            </NotificationProvider>
          </SocketProvider>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default Providers;
