/**
 * Google Analytics 4 (gtag.js) typed wrapper.
 *
 * Firebase Analytics is used for session + SDK-level events; gtag.js
 * adds the classic GA4 layer so the venue operator can reuse existing
 * GA reporting tooling and Looker Studio dashboards.
 *
 * Every function here is a no-op when `NEXT_PUBLIC_GA_ID` is unset.
 */

type GtagArg = unknown;
type GtagFn = (...args: GtagArg[]) => void;

function gtagFn(): GtagFn | null {
  if (typeof window === "undefined") return null;
  const g = (window as unknown as { gtag?: GtagFn }).gtag;
  return g ?? null;
}

/** Manual page-view — useful inside the Next.js App Router where the
 * auto-config directive doesn't pick up client-side navigations. */
export function trackPageView(path: string, title?: string): void {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const gtag = gtagFn();
  if (!gaId || !gtag) return;
  gtag("config", gaId, {
    page_path: path,
    page_title: title,
  });
}

/**
 * Set a GA4 user property. Safe to call repeatedly — GA dedupes
 * identical values. Good fit for `venue_id`, `fan_tier`, `demo_mode`.
 */
export function setUserProperty(key: string, value: string): void {
  const gtag = gtagFn();
  if (!gtag) return;
  gtag("set", "user_properties", { [key]: value });
}

/** Fire a generic GA4 event with typed params. */
export function trackGtagEvent(
  name: string,
  params: Record<string, string | number | boolean> = {},
): void {
  const gtag = gtagFn();
  if (!gtag) return;
  gtag("event", name, params);
}

/**
 * Convenience wrappers for the four high-value conversions we want
 * visible in GA4 funnels / Looker Studio.
 */
export const conversions = {
  orderPlaced: (totalCents: number, items: number): void =>
    trackGtagEvent("order_placed", {
      value: totalCents / 100,
      currency: "INR",
      items,
    }),
  routeDrawn: (poiId: string, etaSec: number): void =>
    trackGtagEvent("route_drawn", { poi_id: poiId, eta_sec: etaSec }),
  conciergeAnswered: (action: string, ms: number): void =>
    trackGtagEvent("concierge_answered", { action, latency_ms: ms }),
  orderReadyToast: (poiId: string, waitSec: number): void =>
    trackGtagEvent("order_ready_toast", { poi_id: poiId, wait_sec: waitSec }),
} as const;
