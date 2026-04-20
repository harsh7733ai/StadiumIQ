import { getToken, onMessage, type MessagePayload } from "firebase/messaging";
import { getMessagingInstance } from "./client";

/**
 * Firebase Cloud Messaging (FCM) helpers.
 *
 * Fan side: registers the service worker, requests notification permission,
 * exchanges it for an FCM token, and subscribes to foreground messages.
 *
 * The VAPID key is a **public** identifier — safe to expose via
 * NEXT_PUBLIC_FIREBASE_VAPID_KEY.
 */
export interface FcmRegistration {
  token: string;
  registration: ServiceWorkerRegistration;
}

/**
 * Request permission + register the service worker + mint an FCM token.
 * Returns `null` if the user denies permission, the browser blocks SW,
 * or Firebase is not configured.
 */
export async function registerForPush(
  vapidKey: string | undefined,
): Promise<FcmRegistration | null> {
  if (typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;
  if (!("Notification" in window)) return null;
  if (!vapidKey) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/" },
    );

    const messaging = await getMessagingInstance();
    if (!messaging) return null;

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    if (!token) return null;

    return { token, registration };
  } catch {
    return null;
  }
}

/**
 * Subscribe to foreground messages (the SW handles background messages).
 * Returns an unsubscribe function; safe to no-op if messaging is
 * unavailable.
 */
export async function subscribeToForegroundMessages(
  handler: (payload: MessagePayload) => void,
): Promise<() => void> {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};
  return onMessage(messaging, handler);
}
