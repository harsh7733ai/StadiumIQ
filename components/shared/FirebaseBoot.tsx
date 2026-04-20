"use client";

import { useEffect } from "react";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { trackEvent } from "@/lib/firebase/analytics";
import { initPerformance } from "@/lib/firebase/performance";
import { refreshRemoteConfig } from "@/lib/firebase/remoteConfig";
import { setUserProperty } from "@/lib/google/gtag";
import { hasFirebase } from "@/lib/env";

/**
 * Boots Firebase on the client:
 *  - signs the visitor in anonymously (every user gets a real Firebase UID)
 *  - starts Firebase Performance Monitoring (Core Web Vitals + custom traces)
 *  - fetches the latest Remote Config (feature flags, concierge persona)
 *  - logs an `app_open` analytics event
 *  - sets GA4 user properties (auth method, demo mode)
 *
 * Mounted once from the authenticated app layout. No-op when Firebase is
 * unconfigured (e.g. local dev without creds).
 */
export function FirebaseBoot() {
  useEffect(() => {
    if (!hasFirebase) return;

    try {
      // 1. Performance Monitoring — starts collecting Core Web Vitals.
      initPerformance();

      // 2. Remote Config — fetch + activate latest flags in the background.
      void refreshRemoteConfig();

      // 3. Auth — keep an anonymous UID live for every visitor.
      const auth = getFirebaseAuth();

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setUserProperty("auth_method", user.isAnonymous ? "anonymous" : "google");
          setUserProperty("demo_mode", process.env.NEXT_PUBLIC_MOCK_MODE ?? "true");

          void trackEvent("app_open", {
            anonymous: user.isAnonymous,
            uid_length: user.uid.length,
          });
        }
      });

      if (!auth.currentUser) {
        void signInAnonymously(auth).catch(() => {
          // User-facing nothing — anonymous auth is best-effort.
        });
      }

      return () => unsubscribe();
    } catch {
      // Firebase not initialised in this env — silently skip.
    }
  }, []);

  return null;
}
