importScripts("https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyBnkeaV60URg30zEgS8pjes1nmfkNjusro",
  authDomain: "wasaachat.firebaseapp.com",
  projectId: "wasaachat",
  storageBucket: "wasaachat.firebasestorage.app",
  messagingSenderId: "774111400602",
  appId: "1:774111400602:web:e6145254bc58174b434523",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/favicon.ico",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});