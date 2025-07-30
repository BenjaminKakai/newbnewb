import React from "react";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { getFcmToken, getFcmTokenWithPrompt } from "@/utils/firebase";

// Types
interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: "admin" | "member" | "guest";
  status?: string;
  lastSeen?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  kycStatus?: boolean;
  kycLevel?: "basic" | "intermediate" | "advanced" | null;
  verificationStatus?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  idNumberVerified?: boolean;
  identityType?: string;
  identityNumber?: string;
  gender?: string;
}

interface ApiUser {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone_number?: string;
  profile_picture?: string;
  username?: string;
  kyc_status?: boolean;
  kyc_level?: "basic" | "intermediate" | "advanced" | null;
  verification_status?: string;
  phone_verified?: boolean;
  email_verified?: boolean;
  id_number_verified?: boolean;
  gender?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  error: string | null;
  isRefreshing: boolean;

  signIn: (credentials: {
    phoneNumber: string;
    countryCode: string;
    country: string;
  }) => Promise<string>;
  generateQRCode: () => Promise<string>;
  verifyOtp: (data: {
    userId: string;
    otp: string;
    source: string;
  }) => Promise<string | null>;
  loginWithQRCode: (data: {
    accessToken: string;
    refreshToken?: string;
    user: ApiUser;
  }) => Promise<void>;
  resendOtp: (data: {
    userId: string;
    source: string;
    userType: string;
  }) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  refreshTokens: () => Promise<boolean>;
  logout: () => Promise<void>;
  logoutLocal: () => void;
  clearError: () => void;
  setUserId: (userId: string) => void;
  setUser: (user: User) => void;
  updateProfile: (updates: Partial<User>) => void;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  getAuthHeaders: () => Record<string, string>;
  isTokenValid: () => boolean;
  refreshUserData: () => Promise<void>;
  updateTokensFromMiddleware: (accessToken: string, refreshToken: string) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

const getDefaultHeaders = (accessToken?: string) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": API_KEY!,
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  return headers;
};

// Helper function to check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    // Check if token expires within the next 5 minutes (300 seconds)
    return payload.exp < (currentTime + 300);
  } catch (error) {
    console.error('Error parsing token:', error);
    return true;
  }
};

// Helper function to set tokens in cookies
const setTokenCookies = (accessToken: string, refreshToken: string) => {
  // Set access token cookie
  document.cookie = `access_token=${accessToken}; path=/; max-age=${60 * 60 * 24}; SameSite=Strict${
    process.env.NODE_ENV === 'production' ? '; Secure' : ''
  }`;
  
  // Set refresh token cookie
  document.cookie = `refresh_token=${refreshToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict${
    process.env.NODE_ENV === 'production' ? '; Secure' : ''
  }`;
};

// Helper function to clear token cookies
const clearTokenCookies = () => {
  document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        accessToken: null,
        refreshToken: null,
        userId: null,
        isAuthenticated: false,
        isLoading: false,
        isLoggingOut: false,
        error: null,
        isRefreshing: false,

        signIn: async (credentials) => {
          set({ isLoading: true, error: null });

          try {
            // Try to get FCM token, but don't fail if it's not available
            let fcmToken: string | null = null;

            try {
              fcmToken = await getFcmToken();
              if (!fcmToken) {
                console.log(
                  "FCM token not available, continuing without notifications"
                );
              }
            } catch (fcmError) {
              console.warn("Could not get FCM token:", fcmError);
              // Continue without FCM token - don't fail the entire sign-in process
            }

            const formData = {
              login_type: "phone_number",
              phone_number: credentials.phoneNumber,
              country_code: credentials.countryCode,
              country: credentials.country,
              fcm_token: fcmToken || "web_no_fcm_token", // Use a fallback value
              source: "web",
              app_id: "web_app",
            };

            const response = await fetch(`${API_BASE_URL}/auth/signin`, {
              method: "POST",
              headers: getDefaultHeaders(),
              body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || "Authentication failed");
            }

            set({
              userId: data.user_id,
              isLoading: false,
              error: null,
            });

            return data.user_id;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Authentication failed";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        generateQRCode: async () => {
          console.log("🔄 generateQRCode API call starting...");
          set({ isLoading: true, error: null });

          try {
            const response = await fetch(
              `${API_BASE_URL}/auth/generate-qr-code`,
              {
                method: "GET",
                headers: getDefaultHeaders(),
              }
            );

            console.log("📡 QR API Response status:", response.status);
            console.log("📡 QR API Response ok:", response.ok);

            if (!response.ok) {
              const errorText = await response.text();
              console.error("❌ QR API Error response:", errorText);
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log("✅ QR API Response data:", data);

            if (!data.qr_code) {
              console.error("❌ No qr_code in response:", data);
              throw new Error("No QR code returned from server");
            }

            const qrCodeToken = data.qr_code;
            console.log("🎯 QR Code token received:", {
              length: qrCodeToken.length,
              preview: qrCodeToken.substring(0, 20) + "...",
              type: typeof qrCodeToken,
            });

            set({ isLoading: false, error: null });
            console.log("✅ generateQRCode completed successfully");

            return qrCodeToken;
          } catch (error) {
            console.error("❌ generateQRCode failed:", error);
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to generate QR code";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        verifyOtp: async ({ userId, otp, source }) => {
          set({ isLoading: true, error: null });

          try {
            const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
              method: "POST",
              headers: getDefaultHeaders(),
              body: JSON.stringify({
                user_id: userId,
                otp,
                source,
              }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || "OTP verification failed");
            }

            const userData: User = {
              id: data.user.id,
              name: `${data.user.first_name} ${data.user.last_name}`.trim(),
              email: data.user.email,
              phone: data.user.phone_number,
              avatar: data.user.profile_picture,
              role: "member" as const,
              username: data.user.username,
              firstName: data.user.first_name,
              lastName: data.user.last_name,
              kycStatus: data.user.kyc_status,
              kycLevel: data.user.kyc_level,
              verificationStatus: data.user.verification_status,
              phoneVerified: data.user.phone_verified,
              emailVerified: data.user.email_verified,
              idNumberVerified: data.user.id_number_verified,
            };

            // Store tokens in localStorage and cookies
            localStorage.setItem("access_token", data.tokens.access_token);
            if (data.tokens.refresh_token) {
              localStorage.setItem("refresh_token", data.tokens.refresh_token);
            }
            localStorage.setItem("user_data", JSON.stringify(userData));

            // Set tokens in cookies for middleware
            if (typeof window !== 'undefined') {
              setTokenCookies(data.tokens.access_token, data.tokens.refresh_token);
            }

            set({
              accessToken: data.tokens.access_token,
              refreshToken: data.tokens.refresh_token,
              user: userData,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              userId: data.user.id,
            });

            if (data.user.kyc_level === "basic") {
              if (!data.user.id_number_verified) {
                return "/profile/verify-id";
              }
              return "/profile/complete";
            } else if (
              data.user.kyc_level === "intermediate" ||
              data.user.kyc_level === "advanced"
            ) {
              return "/chat";
            } else if (!data.user.kyc_level) {
              return "/profile/complete";
            }

            return "/chat";
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "OTP verification failed";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        loginWithQRCode: async ({ accessToken, refreshToken, user }) => {
          set({ isLoading: true, error: null });

          try {
            localStorage.setItem("access_token", accessToken);
            if (refreshToken) {
              localStorage.setItem("refresh_token", refreshToken);
            }

            // Set tokens in cookies for middleware
            if (typeof window !== 'undefined' && refreshToken) {
              setTokenCookies(accessToken, refreshToken);
            }

            const userData: User = {
              id: user.id,
              name: `${user.first_name} ${user.last_name}`.trim(),
              email: user.email,
              phone: user.phone_number,
              avatar: user.profile_picture,
              role: "member" as const,
              username: user.username,
              firstName: user.first_name,
              lastName: user.last_name,
              kycStatus: user.kyc_status,
              kycLevel: user.kyc_level,
              verificationStatus: user.verification_status,
              phoneVerified: user.phone_verified,
              emailVerified: user.email_verified,
              idNumberVerified: user.id_number_verified,
              gender: user.gender,
            };

            localStorage.setItem("user_data", JSON.stringify(userData));

            set({
              accessToken,
              refreshToken,
              user: userData,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              userId: user.id,
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "QR code login failed";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        refreshTokens: async () => {
          const { refreshToken, isRefreshing } = get();
          
          // Prevent multiple simultaneous refresh attempts
          if (isRefreshing) {
            return false;
          }

          if (!refreshToken) {
            console.warn("No refresh token available");
            return false;
          }

          set({ isRefreshing: true, error: null });

          try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
              method: "POST",
              headers: getDefaultHeaders(),
              body: JSON.stringify({
                refresh_token: refreshToken,
                source: "web",
                user_type: "client",
              }),
            });

            if (!response.ok) {
              throw new Error("Token refresh failed");
            }

            const data = await response.json();

            // Update localStorage
            localStorage.setItem("access_token", data.tokens.access_token);
            localStorage.setItem("refresh_token", data.tokens.refresh_token);

            // Update cookies for middleware
            if (typeof window !== 'undefined') {
              setTokenCookies(data.tokens.access_token, data.tokens.refresh_token);
            }

            // Update user data if returned
            if (data.user) {
              const userData: User = {
                id: data.user.id,
                name: `${data.user.first_name} ${data.user.last_name}`.trim(),
                email: data.user.email,
                phone: data.user.phone_number,
                avatar: data.user.profile_picture,
                role: "member" as const,
                username: data.user.username,
                firstName: data.user.first_name,
                lastName: data.user.last_name,
                kycStatus: data.user.kyc_status,
                kycLevel: data.user.kyc_level,
                verificationStatus: data.user.verification_status,
                phoneVerified: data.user.phone_verified,
                emailVerified: data.user.email_verified,
                idNumberVerified: data.user.id_number_verified,
                gender: data.user.gender,
              };

              localStorage.setItem("user_data", JSON.stringify(userData));
              
              set({
                accessToken: data.tokens.access_token,
                refreshToken: data.tokens.refresh_token,
                user: userData,
                isRefreshing: false,
                error: null,
              });
            } else {
              set({
                accessToken: data.tokens.access_token,
                refreshToken: data.tokens.refresh_token,
                isRefreshing: false,
                error: null,
              });
            }

            console.log("Tokens refreshed successfully");
            return true;
          } catch (error) {
            console.error("Token refresh failed:", error);
            set({
              isRefreshing: false,
              error: error instanceof Error ? error.message : "Token refresh failed",
            });

            // If refresh fails, logout the user
            get().logoutLocal();
            return false;
          }
        },

        updateTokensFromMiddleware: (accessToken: string, refreshToken: string) => {
          // Update localStorage
          localStorage.setItem("access_token", accessToken);
          localStorage.setItem("refresh_token", refreshToken);

          // Update state
          set({
            accessToken,
            refreshToken,
          });

          console.log("Tokens updated from middleware");
        },

        resendOtp: async ({ userId, source, userType }) => {
          set({ isLoading: true, error: null });

          try {
            const fcmToken = await getFcmToken();
            const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
              method: "POST",
              headers: getDefaultHeaders(),
              body: JSON.stringify({
                user_id: userId,
                source,
                user_type: userType,
                fcm_token: fcmToken || "sample_fcm_token",
              }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || "Failed to resend OTP");
            }

            set({ isLoading: false, error: null });
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Failed to resend OTP";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        forgotPassword: async (email) => {
          set({ isLoading: true, error: null });

          try {
            const response = await fetch(
              `${API_BASE_URL}/auth/forgot-password`,
              {
                method: "POST",
                headers: getDefaultHeaders(),
                body: JSON.stringify({ email }),
              }
            );

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.message || "Failed to send reset email");
            }

            set({ isLoading: false, error: null });
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to send reset email";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },

        logout: async () => {
          const { accessToken } = get();
          set({ isLoggingOut: true, error: null });

          try {
            if (accessToken) {
              const response = await fetch(`${API_BASE_URL}/auth/logout`, {
                method: "GET",
                headers: getDefaultHeaders(accessToken),
              });

              if (!response.ok) {
                console.warn(
                  "Logout API call failed, but continuing with local logout"
                );
              }
            }
          } catch (error) {
            console.warn("Logout API call failed:", error);
          } finally {
            try {
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
              localStorage.removeItem("user_data");
              localStorage.removeItem("auth-storage");

              // Clear cookies
              if (typeof window !== 'undefined') {
                clearTokenCookies();
              }

              const keysToRemove = [];
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (
                  key &&
                  (key.includes("auth") ||
                    key.includes("token") ||
                    key.includes("user"))
                ) {
                  keysToRemove.push(key);
                }
              }
              keysToRemove.forEach((key) => localStorage.removeItem(key));
            } catch (storageError) {
              console.warn("Error clearing localStorage:", storageError);
            }

            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              userId: null,
              isAuthenticated: false,
              isLoading: false,
              isLoggingOut: false,
              isRefreshing: false,
              error: null,
            });
          }
        },

        logoutLocal: () => {
          try {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("user_data");
            localStorage.removeItem("auth-storage");

            // Clear cookies
            if (typeof window !== 'undefined') {
              clearTokenCookies();
            }

            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (
                key &&
                (key.includes("auth") ||
                  key.includes("token") ||
                  key.includes("user"))
              ) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach((key) => localStorage.removeItem(key));
          } catch (error: any) {
            console.warn(
              "Error clearing localStorage during local logout:",
              error
            );
          }

          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            userId: null,
            isAuthenticated: false,
            isLoading: false,
            isLoggingOut: false,
            isRefreshing: false,
            error: null,
          });
        },

        clearError: () => {
          set({ error: null });
        },

        setUserId: (userId: string) => {
          set({ userId });
        },

        setUser: (user: User) => {
          set({ user, isAuthenticated: true, userId: user.id });
        },

        updateProfile: (updates: Partial<User>) => {
          const currentUser = get().user;
          if (currentUser) {
            const updatedUser = { ...currentUser, ...updates };
            set({ user: updatedUser });
          }
        },

        updateUserProfile: async (updates: Partial<User>) => {
          const currentUser = get().user;
          if (currentUser) {
            const updatedUser = { ...currentUser, ...updates };
            set({ user: updatedUser });

            try {
              localStorage.setItem("user_data", JSON.stringify(updatedUser));
            } catch (error) {
              console.warn("Failed to store updated user data:", error);
            }
          }
        },

        getAuthHeaders: () => {
          const { accessToken } = get();
          return getDefaultHeaders(accessToken || undefined);
        },

        isTokenValid: () => {
          const { accessToken, isAuthenticated } = get();
          if (!isAuthenticated || !accessToken) {
            return false;
          }
          return !isTokenExpired(accessToken);
        },

        refreshUserData: async () => {
          const { accessToken, user } = get();

          if (!accessToken || !user) {
            throw new Error("No authenticated user to refresh");
          }

          set({ isLoading: true, error: null });

          try {
            const response = await fetch(`${API_BASE_URL}/user/profile`, {
              method: "GET",
              headers: getDefaultHeaders(accessToken),
            });

            if (!response.ok) {
              throw new Error("Failed to refresh user data");
            }

            const userData = await response.json();

            set({
              user: userData.user || userData,
              isLoading: false,
              error: null,
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Failed to refresh user data";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw error;
          }
        },
      }),
      {
        name: "auth-storage",
        partialize: (state) => ({
          user: state.user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          userId: state.userId,
          isAuthenticated: state.isAuthenticated,
        }),
        version: 2,
      }
    ),
    { name: "AuthStore" }
  )
);

export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useUserId = () => useAuthStore((state) => state.userId);
export const useIsLoggingOut = () =>
  useAuthStore((state) => state.isLoggingOut);

export const useAuthHeaders = () =>
  useAuthStore((state) => state.getAuthHeaders());
export const useIsTokenValid = () =>
  useAuthStore((state) => state.isTokenValid());

export const useKycLevel = () =>
  useAuthStore((state) => state.user?.kycLevel || null);
export const useVerificationStatus = () =>
  useAuthStore((state) => state.user?.verificationStatus || "pending");
export const useIdNumberVerified = () =>
  useAuthStore((state) => state.user?.idNumberVerified || false);

export const useTokenValidation = () => {
  const { isAuthenticated, isTokenValid, logoutLocal, refreshTokens } = useAuthStore();

  React.useEffect(() => {
    if (isAuthenticated && !isTokenValid()) {
      console.warn("Invalid token detected, attempting refresh...");
      refreshTokens().catch(() => {
        console.warn("Token refresh failed, logging out locally");
        logoutLocal();
      });
    }
  }, [isAuthenticated, isTokenValid, logoutLocal, refreshTokens]);
};

export const useAuthInit = () => {
  const { setUser, isAuthenticated, updateTokensFromMiddleware } = useAuthStore();

  React.useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const storedUserData = localStorage.getItem("user_data");

    if (storedToken && storedUserData && !isAuthenticated) {
      try {
        const userData = JSON.parse(storedUserData);
        setUser(userData);
        console.log("User restored from localStorage:", userData);
      } catch (error) {
        console.warn("Failed to parse stored user data:", error);
        localStorage.removeItem("user_data");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
    }
  }, [setUser, isAuthenticated]);

  // Listen for token updates from middleware
  React.useEffect(() => {
    const handleMiddlewareTokenUpdate = () => {
      const newAccessToken = document.querySelector('meta[name="x-new-access-token"]')?.getAttribute('content');
      const newRefreshToken = document.querySelector('meta[name="x-new-refresh-token"]')?.getAttribute('content');
      
      if (newAccessToken && newRefreshToken) {
        updateTokensFromMiddleware(newAccessToken, newRefreshToken);
        
        // Clean up the meta tags
        document.querySelector('meta[name="x-new-access-token"]')?.remove();
        document.querySelector('meta[name="x-new-refresh-token"]')?.remove();
      }
    };

    // Check for token updates on page load
    handleMiddlewareTokenUpdate();

    // Listen for custom events from middleware
    window.addEventListener('tokenRefreshed', handleMiddlewareTokenUpdate);
    
    return () => {
      window.removeEventListener('tokenRefreshed', handleMiddlewareTokenUpdate);
    };
  }, [updateTokensFromMiddleware]);
};

export const usePeriodicTokenRefresh = () => {
  const { isAuthenticated, isTokenValid, refreshTokens } = useAuthStore();

  React.useEffect(() => {
    if (!isAuthenticated) return;

    const checkAndRefreshToken = async () => {
      if (!isTokenValid()) {
        console.log("Token expired, refreshing...");
        try {
          await refreshTokens();
        } catch (error) {
          console.error("Periodic token refresh failed:", error);
        }
      }
    };

    // Check token validity every 5 minutes
    const interval = setInterval(checkAndRefreshToken, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, isTokenValid, refreshTokens]);
};

export const useKycFlow = () => {
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();

  const getNextKycStep = (): string | null => {
    if (!isAuthenticated || !user) return null;

    if (user.kycLevel === "basic") {
      if (!user.idNumberVerified) {
        return "/profile/verify-id";
      }
      return "/profile/complete";
    }

    if (user.kycLevel === "intermediate" || user.kycLevel === "advanced") {
      return null;
    }

    if (!user.kycLevel) {
      return "/profile/complete";
    }

    return null;
  };

  const isKycComplete = (): boolean => {
    return user?.kycLevel === "intermediate" || user?.kycLevel === "advanced";
  };

  const canAccessChat = (): boolean => {
    return isKycComplete();
  };

  return {
    getNextKycStep,
    isKycComplete,
    canAccessChat,
    kycLevel: user?.kycLevel || null,
    idNumberVerified: user?.idNumberVerified || false,
    verificationStatus: user?.verificationStatus || "pending",
  };
};