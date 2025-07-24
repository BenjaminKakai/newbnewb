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

// Get FCM token
export const getFcmToken = async () => {
  if (!messaging) return null;
  try {
    const token = await getToken(messaging, {
      vapidKey: "YOUR_VAPID_KEY", // Replace with your VAPID key from Firebase Console
    });
    return token;
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
};

// Handle foreground messages
export const onMessageListener = (callback: (payload: any) => void) => {
  if (!messaging) return;
  onMessage(messaging, (payload) => {
    callback(payload);
  });
};