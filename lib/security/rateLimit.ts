/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * Backed by a `globalThis` singleton so it survives Next.js HMR and warm
 * serverless invocations. Not a replacement for a real distributed limiter
 * (Redis / Upstash) in production, but enough to blunt casual abuse of the
 * `/api/concierge` endpoint during the demo.
 */
type Bucket = { count: number; resetAt: number };

const GLOBAL_KEY = "__stadiumiq_rate_limit" as const;

interface GlobalWithStore {
  [GLOBAL_KEY]?: Map<string, Bucket>;
}

function getStore(): Map<string, Bucket> {
  const g = globalThis as GlobalWithStore;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = new Map<string, Bucket>();
  }
  return g[GLOBAL_KEY]!;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetInMs: number;
}

/**
 * Returns `{ ok: false }` if `key` has exceeded `max` requests within
 * `windowMs`. Otherwise increments the bucket and returns `{ ok: true }`.
 */
export function rateLimit(key: string, max: number, windowMs: number): RateLimitResult {
  const store = getStore();
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const fresh: Bucket = { count: 1, resetAt: now + windowMs };
    store.set(key, fresh);
    return { ok: true, remaining: max - 1, resetInMs: windowMs };
  }

  if (bucket.count >= max) {
    return { ok: false, remaining: 0, resetInMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { ok: true, remaining: max - bucket.count, resetInMs: bucket.resetAt - now };
}

/**
 * Derives a best-effort client key from standard proxy headers. Falls back
 * to a constant so the limiter still applies globally rather than failing
 * open when headers are missing (e.g. local curl).
 */
export function clientKeyFrom(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "anonymous";
}
