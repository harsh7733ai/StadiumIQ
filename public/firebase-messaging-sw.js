/* eslint-disable */
/**
 * Firebase Cloud Messaging service worker.
 *
 * Runs in the background on the fan's device so order-ready notifications
 * fire even when the StadiumIQ PWA is closed. Activated lazily by
 * `useFcmToken()` after the user grants notification permission.
 *
 * Uses the compat SDK because service workers do not support ES module
 * imports from the modular Firebase SDK on all browsers yet.
 */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// These values are public-scope config (same shape as NEXT_PUBLIC_FIREBASE_*).
// Replaced at deploy time by the build system for production.
const FIREBASE_CONFIG = {
  apiKey: "DEMO_API_KEY",
  authDomain: "stadiumiq.firebaseapp.com",
  projectId: "stadiumiq",
  storageBucket: "stadiumiq.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:demo",
};

// eslint-disable-next-line no-undef
firebase.initializeApp(FIREBASE_CONFIG);

// eslint-disable-next-line no-undef
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title =
    payload.notification?.title ?? "Your order is ready";
  const options = {
    body: payload.notification?.body ?? "Head to the pickup counter.",
    icon: "/icon.svg",
    badge: "/icon.svg",
    data: payload.data ?? {},
    tag: "stadiumiq-order",
  };
  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/order";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.endsWith(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }
        return clients.openWindow(targetUrl);
      }),
  );
});
