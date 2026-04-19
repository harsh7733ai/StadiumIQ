import { describe, it, expect } from "vitest";
import { rateLimit, clientKeyFrom } from "@/lib/security/rateLimit";

/**
 * Each test uses a unique key prefix so the globalThis-backed store can't
 * leak state between cases even when run in parallel.
 */
function uniqueKey(prefix: string): string {
  return `${prefix}:${crypto.randomUUID()}`;
}

describe("rateLimit", () => {
  it("allows up to `max` hits within the window", () => {
    const key = uniqueKey("allow");
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(key, 3, 1000).ok).toBe(true);
    }
  });

  it("rejects the (max+1)th hit with ok=false", () => {
    const key = uniqueKey("reject");
    for (let i = 0; i < 3; i++) rateLimit(key, 3, 1000);
    const out = rateLimit(key, 3, 1000);
    expect(out.ok).toBe(false);
    expect(out.remaining).toBe(0);
    expect(out.resetInMs).toBeGreaterThan(0);
  });

  it("isolates buckets by key", () => {
    const a = uniqueKey("a");
    const b = uniqueKey("b");
    for (let i = 0; i < 3; i++) rateLimit(a, 3, 1000);
    expect(rateLimit(a, 3, 1000).ok).toBe(false);
    expect(rateLimit(b, 3, 1000).ok).toBe(true);
  });

  it("resets after the window expires", () => {
    const key = uniqueKey("reset");
    rateLimit(key, 1, 1); // window closes immediately
    // Tiny delay to ensure Date.now() advances past resetAt.
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(rateLimit(key, 1, 1000).ok).toBe(true);
        resolve();
      }, 5);
    });
  });

  it("reports decreasing `remaining` on each hit", () => {
    const key = uniqueKey("remaining");
    expect(rateLimit(key, 3, 1000).remaining).toBe(2);
    expect(rateLimit(key, 3, 1000).remaining).toBe(1);
    expect(rateLimit(key, 3, 1000).remaining).toBe(0);
  });
});

describe("clientKeyFrom", () => {
  it("prefers the first X-Forwarded-For entry", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(clientKeyFrom(req)).toBe("1.2.3.4");
  });

  it("falls back to X-Real-IP", () => {
    const req = new Request("https://example.com", {
      headers: { "x-real-ip": "9.9.9.9" },
    });
    expect(clientKeyFrom(req)).toBe("9.9.9.9");
  });

  it("falls back to 'anonymous' when no proxy headers are present", () => {
    const req = new Request("https://example.com");
    expect(clientKeyFrom(req)).toBe("anonymous");
  });
});
