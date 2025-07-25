import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBnkeaV60URg30zEgS8pjes1nmfkNjusro",
  authDomain: "wasaachat.firebaseapp.com",
  projectId: "wasaachat",
  storageBucket: "wasaachat.firebasestorage.app",
  messagingSenderId: "774111400602",
  appId: "1:774111400602:web:e6145254bc58174b434523",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const messaging = typeof window !== "undefined" ? getMessaging(app) : null;

// VAPID key - you need to generate this in Firebase Console
// Go to Project Settings > Cloud Messaging > Web Push certificates
const VAPID_KEY = "BFSxghz-iaJ6k_nOSZyn7GTn8QuBTp2iHwvync98rFxunZfDntsjao2R6Ja7-J5mD0Ife9sVA-nHk6HZ6ZG8BI0"; // Replace with your actual VAPID key

// Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log("Notification permission:", permission);
    return permission === "granted";
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
};

// Check current notification permission status
export const getNotificationPermission = (): NotificationPermission => {
  if (!("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
};

// Get FCM token with proper error handling
export const getFcmToken = async (): Promise<string | null> => {
  if (!messaging) {
    console.warn("Messaging not available (likely SSR)");
    return null;
  }

  try {
    // Check if notifications are supported
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return null;
    }

    // Check current permission status
    const currentPermission = getNotificationPermission();
    console.log("Current notification permission:", currentPermission);

    if (currentPermission === "denied") {
      console.warn("Notification permission is denied");
      return null;
    }

    if (currentPermission === "default") {
      console.log("Requesting notification permission...");
      const granted = await requestNotificationPermission();
      if (!granted) {
        console.warn("User denied notification permission");
        return null;
      }
    }

    // Now try to get the token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY, // Make sure to set your VAPID key
    });

    if (token) {
      console.log("FCM Token generated successfully:", token);
      return token;
    } else {
      console.warn("No registration token available");
      return null;
    }
  } catch (error: any) {
    console.error("Error getting FCM token:", error);
    
    // Handle specific error cases
    if (error.code === "messaging/permission-blocked") {
      console.error("Notification permission is blocked. User needs to manually enable notifications in browser settings.");
    } else if (error.code === "messaging/token-unsubscribe-failed") {
      console.error("Failed to unsubscribe from FCM");
    } else if (error.code === "messaging/invalid-vapid-key") {
      console.error("Invalid VAPID key provided");
    }
    
    return null;
  }
};

// Get FCM token with user prompt (optional)
export const getFcmTokenWithPrompt = async (showPrompt: boolean = true): Promise<string | null> => {
  if (!messaging) return null;

  try {
    const currentPermission = getNotificationPermission();
    
    if (currentPermission === "denied") {
      if (showPrompt) {
        alert("Notifications are blocked. Please enable them in your browser settings to receive updates.");
      }
      return null;
    }

    if (currentPermission === "default") {
      if (showPrompt) {
        const userWantsNotifications = confirm(
          "Would you like to enable notifications to stay updated with important messages?"
        );
        if (!userWantsNotifications) {
          return null;
        }
      }
      
      const granted = await requestNotificationPermission();
      if (!granted) {
        return null;
      }
    }

    return await getFcmToken();
  } catch (error) {
    console.error("Error in getFcmTokenWithPrompt:", error);
    return null;
  }
};

// Handle foreground messages
export const onMessageListener = (callback: (payload: any) => void) => {
  if (!messaging) return;
  
  onMessage(messaging, (payload) => {
    console.log("Foreground message received:", payload);
    callback(payload);
  });
};

// Utility function to check if FCM is available
export const isFcmAvailable = (): boolean => {
  return !!(
    messaging && 
    "Notification" in window && 
    "serviceWorker" in navigator
  );
};

// Helper function to handle permission changes
export const handlePermissionChange = (callback: (permission: NotificationPermission) => void) => {
  if (!("Notification" in window)) return;

  // Listen for permission changes (not all browsers support this)
  if ("permissions" in navigator) {
    navigator.permissions.query({ name: "notifications" }).then((result) => {
      result.addEventListener("change", () => {
        callback(result.state as NotificationPermission);
      });
    });
  }
};