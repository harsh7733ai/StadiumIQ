import { getPerformance, trace, type PerformanceTrace, type FirebasePerformance } from "firebase/performance";
import { getFirebaseApp } from "./client";
import { hasFirebase } from "@/lib/env";

/**
 * Firebase Performance Monitoring wrapper.
 *
 * Captures page-load and custom trace metrics and pipes them to the
 * Firebase console for Core Web Vitals comparison against the venue
 * SLOs (LCP < 2.5s, TTI < 3s).
 *
 * Client-only. Swallows all failures — perf telemetry must never
 * degrade UX.
 */
let performanceInstance: FirebasePerformance | null = null;

function getPerf(): FirebasePerformance | null {
  if (typeof window === "undefined") return null;
  if (!hasFirebase) return null;
  if (performanceInstance) return performanceInstance;

  try {
    performanceInstance = getPerformance(getFirebaseApp());
    return performanceInstance;
  } catch {
    return null;
  }
}

/**
 * Start a custom performance trace. Returns a handle with `stop()` or
 * `null` if Performance Monitoring is unavailable in the current env.
 */
export function startTrace(name: string): PerformanceTrace | null {
  const perf = getPerf();
  if (!perf) return null;
  try {
    const t = trace(perf, name);
    t.start();
    return t;
  } catch {
    return null;
  }
}

/**
 * Time an async operation under a named trace. Wraps `startTrace`/`stop`.
 *
 * @example
 *   const route = await withTrace("concierge_request", () => fetch(...));
 */
export async function withTrace<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  const t = startTrace(name);
  try {
    return await fn();
  } finally {
    try {
      t?.stop();
    } catch {
      // swallow
    }
  }
}

/**
 * Idempotent initializer. Safe to call on every client mount.
 */
export function initPerformance(): void {
  getPerf();
}
