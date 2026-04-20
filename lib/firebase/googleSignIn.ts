import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  linkWithPopup,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "./client";
import { hasFirebase } from "@/lib/env";

/**
 * Google Sign-In wrapper (via Firebase Auth + Google Identity Services).
 *
 * Preserves the visitor's anonymous UID by *linking* the Google credential
 * into the existing anonymous account — their order history + analytics
 * trails survive the upgrade. Falls back to plain sign-in if linking fails
 * (e.g. the Google account is already attached to a different Firebase user).
 */

/** Small DTO returned to components. Avoids leaking the full Firebase User. */
export interface GoogleIdentity {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

function toIdentity(user: User): GoogleIdentity {
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous,
  };
}

/**
 * Trigger the Google OAuth popup. On success, returns the upgraded user
 * identity. On failure (user cancelled, popup blocked, Firebase
 * unconfigured) returns `null` — callers render an error toast.
 */
export async function signInWithGoogle(): Promise<GoogleIdentity | null> {
  if (!hasFirebase) return null;
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    if (auth.currentUser?.isAnonymous) {
      const linked = await linkWithPopup(auth.currentUser, provider);
      return toIdentity(linked.user);
    }
    const result = await signInWithPopup(auth, provider);
    return toIdentity(result.user);
  } catch {
    // Fallback: fresh sign-in (loses anonymous UID, but user is authenticated).
    try {
      const result = await signInWithPopup(auth, provider);
      return toIdentity(result.user);
    } catch {
      return null;
    }
  }
}

/** Sign the user out. Returns `true` on success. */
export async function signOutOfGoogle(): Promise<boolean> {
  if (!hasFirebase) return false;
  try {
    await firebaseSignOut(getFirebaseAuth());
    return true;
  } catch {
    return false;
  }
}

/** Subscribe to auth-state changes. Returns an unsubscribe function. */
export function watchIdentity(
  handler: (identity: GoogleIdentity | null) => void,
): () => void {
  if (!hasFirebase) return () => {};
  try {
    return onAuthStateChanged(getFirebaseAuth(), (user) => {
      handler(user ? toIdentity(user) : null);
    });
  } catch {
    return () => {};
  }
}
