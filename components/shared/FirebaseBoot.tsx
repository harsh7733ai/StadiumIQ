"use client";

import { useEffect } from "react";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { trackEvent } from "@/lib/firebase/analytics";
import { hasFirebase } from "@/lib/env";

/**
 * Boots Firebase on the client:
 *  - signs the visitor in anonymously (every user gets a real Firebase UID)
 *  - logs an `app_open` analytics event
 *
 * Mounted once from the authenticated app layout. No-op when Firebase is
 * unconfigured (e.g. local dev without creds).
 */
export function FirebaseBoot() {
  useEffect(() => {
    if (!hasFirebase) return;

    try {
      const auth = getFirebaseAuth();

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
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
