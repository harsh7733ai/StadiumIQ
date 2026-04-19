import { getAnalytics, isSupported, logEvent, type Analytics } from "firebase/analytics";
import { getFirebaseApp } from "./client";
import { hasFirebase } from "@/lib/env";

/**
 * Firebase Analytics wrapper.
 *
 * Runs only in the browser (SSR-safe), only when Firebase is configured, and
 * only when the runtime environment supports the Analytics SDK (some
 * in-app browsers don't). All failures are swallowed — analytics must never
 * crash the product.
 */
let analyticsInstance: Analytics | null = null;

async function getAnalyticsInstance(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  if (!hasFirebase) return null;
  if (analyticsInstance) return analyticsInstance;

  try {
    const supported = await isSupported();
    if (!supported) return null;
    analyticsInstance = getAnalytics(getFirebaseApp());
    return analyticsInstance;
  } catch {
    return null;
  }
}

/**
 * Track a product event. Fire-and-forget — never throws.
 *
 * @example trackEvent("poi_select", { poiId: "food-beer" })
 */
export async function trackEvent(
  name: string,
  params: Record<string, string | number | boolean> = {},
): Promise<void> {
  try {
    const analytics = await getAnalyticsInstance();
    if (!analytics) return;
    logEvent(analytics, name, params);
  } catch {
    // Intentionally swallow — analytics must never break UX.
  }
}
