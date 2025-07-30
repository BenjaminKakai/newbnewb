"use client";
import React, { useEffect } from "react";
import { ToastProvider } from "./ToastProvider";
import { KycRouteGuard } from "@/features/auth/components/KycRouteGuard";
import { NotificationProvider } from "@/features/calls/components/NotificationContext";
import { ThemeProvider } from "./ThemeProvider";
import { SocketProvider } from "@/services/notificationSocket";
import { useAuthInit, useAuthStore } from "@/store/authStore";

// Simple auth provider that syncs tokens from cookies
function AuthProvider({ children }: { children: React.ReactNode }) {
  const { updateTokensFromMiddleware } = useAuthStore();
  
  // Initialize auth from localStorage
  useAuthInit();
  
  // Sync tokens from cookies (set by middleware)
  useEffect(() => {
    const syncTokensFromCookies = () => {
      // Function to get cookie value
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
      };

      const accessToken = getCookie('access_token');
      const refreshToken = getCookie('refresh_token');

      if (accessToken && refreshToken) {
        // Only update if tokens are different from current state
        const currentState = useAuthStore.getState();
        if (currentState.accessToken !== accessToken) {
          updateTokensFromMiddleware(accessToken, refreshToken);
        }
      }
    };

    // Sync on mount
    syncTokensFromCookies();

    // Sync when window gets focus (in case tokens were refreshed in another tab)
    const handleFocus = () => syncTokensFromCookies();
    window.addEventListener('focus', handleFocus);

    return () => window.removeEventListener('focus', handleFocus);
  }, [updateTokensFromMiddleware]);

  // Periodic token validation (every 5 minutes)
  useEffect(() => {
    const { isAuthenticated, isTokenValid, refreshTokens } = useAuthStore.getState();
    
    if (!isAuthenticated) return;

    const checkTokenValidity = async () => {
      if (!isTokenValid()) {
        try {
          await refreshTokens();
        } catch (error) {
          console.error('Token refresh failed:', error);
        }
      }
    };

    const interval = setInterval(checkTokenValidity, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

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