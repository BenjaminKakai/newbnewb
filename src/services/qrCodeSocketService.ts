// services/qrCodeSocketService.ts
import { io, Socket } from "socket.io-client";
import { useState } from "react";

// Define specific error interface for socket errors
export interface SocketError {
  message: string;
  description?: string;
  context?: string;
  type?: string;
  code?: string | number;
}

export interface QRAuthResponse {
  tokens: {
    access_token: string;
    refresh_token: string;
  };
  user: {
    id: string;
    username?: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    kyc_status: boolean;
    kyc_level?: string | null;
    verification_status: string;
    phone_verified: boolean;
    email_verified: boolean;
    id_number_verified: boolean;
    profile_picture?: string;
    gender?: string;
    // Allow additional properties with unknown type for safety
    [key: string]: unknown;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_USER_API_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

export interface QRCodeService {
  connect: (qrCode: string) => Promise<void>;
  disconnect: () => void;
  onAuthSuccess: (callback: (data: QRAuthResponse) => void) => void;
  onError: (callback: (error: string) => void) => void;
  onDisconnect: (callback: () => void) => void;
  isConnected: () => boolean;
}

// Enhanced qrCodeSocketService.ts with detailed debugging
class QRCodeSocketService implements QRCodeService {
  private socket: Socket | null = null;
  private readonly socketUrl = API_BASE_URL;
  private readonly apiKey = API_KEY;
  private authSuccessCallback: ((data: QRAuthResponse) => void) | null = null;
  private errorCallback: ((error: string) => void) | null = null;
  private disconnectCallback: (() => void) | null = null;

  async connect(qrCode: string): Promise<void> {
    try {
      this.disconnect();

      console.log("🔌 Connecting to QR Code WebSocket...", {
        url: this.socketUrl,
        qrCodeLength: qrCode.length,
        qrCodePreview: qrCode.substring(0, 20) + "...",
      });

      this.socket = io(this.socketUrl, {
        auth: {
          qr_code: qrCode,
        },
        transports: ["websocket", "polling"],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.setupEventListeners();

      // Wait for connection with detailed logging
      await new Promise<void>((resolve, reject) => {
        if (!this.socket) {
          reject(new Error("Failed to create socket"));
          return;
        }

        const connectionTimeout = setTimeout(() => {
          console.error("❌ Socket connection timeout after 10 seconds");
          reject(new Error("Connection timeout"));
        }, 10000);

        this.socket.on("connect", () => {
          clearTimeout(connectionTimeout);
          console.log("✅ Connected to QR Code WebSocket successfully");
          console.log("📊 Socket Info:", {
            id: this.socket?.id,
            connected: this.socket?.connected,
            transport: this.socket?.io?.engine?.transport?.name,
          });
          resolve();
        });

        this.socket.on("connect_error", (error) => {
          clearTimeout(connectionTimeout);
          console.error("❌ Socket connection error:", {
            message: error.message,
            description: error.description,
            context: error.context,
            type: error.type,
          });
          reject(new Error(`Connection failed: ${error.message}`));
        });
      });

      // Send QR code after successful connection
      this.sendQRCode(qrCode);
    } catch (error) {
      console.error("❌ QR Code socket connection failed:", error);
      this.disconnect();
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    console.log("🎧 Setting up socket event listeners...");

    // Listen for auth success event
    this.socket.on("auth_success", (data: QRAuthResponse) => {
      console.log("🎉 QR Auth success received:", {
        hasTokens: !!data.tokens,
        hasUser: !!data.user,
        userId: data.user?.id,
        accessTokenPreview: data.tokens?.access_token?.substring(0, 20) + "...",
      });
      if (this.authSuccessCallback) {
        this.authSuccessCallback(data);
      }
    });

    // Listen for errors with proper typing
    this.socket.on("error", (error: string | SocketError) => {
      console.error("❌ QR Socket error:", error);
      const errorMessage = this.extractErrorMessage(error);
      if (this.errorCallback) {
        this.errorCallback(errorMessage);
      }
    });

    // Listen for disconnection
    this.socket.on("disconnect", (reason) => {
      console.log("🔌 QR Socket disconnected:", {
        reason,
        wasConnected: this.socket?.connected,
      });
      if (this.disconnectCallback) {
        this.disconnectCallback();
      }
    });

    // Listen for connection errors
    this.socket.on("connect_error", (error) => {
      console.error("❌ QR Socket connection error:", error);
      if (this.errorCallback) {
        this.errorCallback(`Connection error: ${error.message}`);
      }
    });

    // Listen for QR code status updates
    this.socket.on(
      "qr_status",
      (status: { status: string; message?: string }) => {
        console.log("📱 QR Status update:", status);
      }
    );

    // Listen for QR code expiration
    this.socket.on("qr_expired", () => {
      console.log("⏰ QR Code expired");
      if (this.errorCallback) {
        this.errorCallback("QR Code has expired. Please generate a new one.");
      }
    });

    // Listen for any custom events that might be relevant
    this.socket.on("qr_scanned", (data) => {
      console.log("📸 QR Code was scanned:", data);
    });

    this.socket.on("auth_pending", (data) => {
      console.log("⏳ Authentication pending:", data);
    });

    // Generic event listener for debugging
    this.socket.onAny((eventName, ...args) => {
      console.log(`📡 Socket event received: ${eventName}`, args);
    });
  }

  // Helper method to extract error message from different error types
  private extractErrorMessage(error: string | SocketError): string {
    if (typeof error === "string") {
      return error;
    }

    if (error && typeof error === "object") {
      return error.message || "Unknown socket error";
    }

    return "Unknown socket error";
  }

  private sendQRCode(qrCode: string): void {
    if (!this.socket || !this.socket.connected) {
      throw new Error("Socket not connected");
    }

    console.log("📤 Sending QR code to socket:", {
      qrCodeLength: qrCode.length,
      qrCodePreview: qrCode.substring(0, 20) + "...",
      socketId: this.socket.id,
      connected: this.socket.connected,
    });

    // Send QR code as body/payload
    this.socket.emit("qr_login", { qr_code: qrCode });

    // Add confirmation that the emit was successful
    console.log("✅ QR code emit completed");
  }

  disconnect(): void {
    if (this.socket) {
      console.log("🔌 Disconnecting QR Code WebSocket");
      this.socket.disconnect();
      this.socket = null;
    }

    // Clear callbacks
    this.authSuccessCallback = null;
    this.errorCallback = null;
    this.disconnectCallback = null;
  }

  onAuthSuccess(callback: (data: QRAuthResponse) => void): void {
    console.log("📝 Registering auth success callback");
    this.authSuccessCallback = callback;
  }

  onError(callback: (error: string) => void): void {
    console.log("📝 Registering error callback");
    this.errorCallback = callback;
  }

  onDisconnect(callback: () => void): void {
    console.log("📝 Registering disconnect callback");
    this.disconnectCallback = callback;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Create singleton instance
const qrCodeSocketService = new QRCodeSocketService();

export default qrCodeSocketService;

// Fixed useQRCodeAuth hook - remove conflicting event listeners
export const useQRCodeAuth = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Remove the useEffect that was setting up conflicting event listeners
  // The modal component will handle event listeners directly

  const connectWithQRCode = async (qrCode: string) => {
    try {
      setIsConnecting(true);
      setError(null);

      await qrCodeSocketService.connect(qrCode);

      setIsConnected(true);
      setIsConnecting(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to connect";
      setError(errorMessage);
      setIsConnecting(false);
      setIsConnected(false);
      throw error;
    }
  };

  const disconnect = () => {
    qrCodeSocketService.disconnect();
    setIsConnected(false);
    setIsConnecting(false);
    setError(null);
  };

  return {
    connectWithQRCode,
    disconnect,
    isConnecting,
    isConnected,
    error,
    clearError: () => setError(null),
  };
};
