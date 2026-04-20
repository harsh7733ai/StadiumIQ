"use client";

import { useEffect, useState } from "react";
import { registerForPush, subscribeToForegroundMessages } from "@/lib/firebase/messaging";
import { trackEvent } from "@/lib/firebase/analytics";
import { hasFirebase, publicEnv } from "@/lib/env";

export interface UseFcmTokenResult {
  token: string | null;
  permission: NotificationPermission | "unsupported";
  register: () => Promise<void>;
}

/**
 * Client hook that, on explicit user action, registers the FCM service
 * worker and returns an FCM token usable by the server to push an
 * order-ready notification.
 *
 * Returns `"unsupported"` permission when the browser lacks FCM APIs
 * entirely (e.g. iOS in-app WebView); the UI should hide the "Enable
 * notifications" button in that case.
 */
export function useFcmToken(): UseFcmTokenResult {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (!hasFirebase || !token) return;
    let unsubscribe: (() => void) | undefined;
    void (async () => {
      unsubscribe = await subscribeToForegroundMessages((payload) => {
        void trackEvent("fcm_foreground_message", {
          has_notification: Boolean(payload.notification),
          has_data: Boolean(payload.data),
        });
      });
    })();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [token]);

  async function register(): Promise<void> {
    const vapid = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const reg = await registerForPush(vapid);
    if (reg) {
      setToken(reg.token);
      setPermission("granted");
      void trackEvent("fcm_token_registered", { token_length: reg.token.length });
    } else if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
    // Reference publicEnv so tree-shaking keeps analytics config live even
    // when the caller hasn't requested push — GA4 still needs to fire.
    void publicEnv;
  }

  return { token, permission, register };
}
