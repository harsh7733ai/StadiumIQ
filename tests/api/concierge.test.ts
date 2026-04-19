import { describe, it, expect, vi, beforeEach } from "vitest";

// The production mock-mode flag gates density reads. Tests simulate the
// demo environment.
process.env.NEXT_PUBLIC_MOCK_MODE = "true";

// Force Gemini to fail so every test exercises the deterministic heuristic
// fallback. That's the right behavior to pin down — it's what real users see
// when the GCP key runs out of quota.
vi.mock("@/lib/gemini/client", () => ({
  structuredChat: vi.fn().mockRejectedValue(new Error("gemini unavailable")),
}));

// Import AFTER the mock so the route picks up the stub.
import { POST } from "@/app/api/concierge/route";

function makeRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/concierge", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json", ...headers },
  });
}

describe("POST /api/concierge", () => {
  beforeEach(() => {
    // Each test gets a fresh-ish rate-limit bucket via a unique IP.
  });

  it("rejects invalid JSON gracefully with a friendly fallback", async () => {
    const req = new Request("http://localhost/api/concierge", {
      method: "POST",
      body: "not-json",
      headers: { "x-forwarded-for": "10.0.0.1" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reply).toMatch(/couldn't read|rephrase/i);
  });

  it("rejects requests that fail schema validation with a fallback reply", async () => {
    const res = await POST(
      makeRequest({ messages: [], userLocation: { nodeId: "n-seat" } }, { "x-forwarded-for": "10.0.0.2" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.recommendation).toBeNull();
  });

  it("returns a heuristic recommendation when Gemini fails", async () => {
    const res = await POST(
      makeRequest(
        {
          messages: [{ role: "user", content: "Where's the nearest restroom?" }],
          userLocation: { nodeId: "n-seat" },
        },
        { "x-forwarded-for": "10.0.0.3" },
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reply).toBeDefined();
    expect(body.recommendation?.poiId).toMatch(/^restroom/);
    expect(body.recommendation?.walkTimeSec).toBeGreaterThan(0);
    expect(body.action).toBe("navigate");
  });

  it("returns a food recommendation with action=order for food queries", async () => {
    const res = await POST(
      makeRequest(
        {
          messages: [{ role: "user", content: "I want a beer" }],
          userLocation: { nodeId: "n-seat" },
        },
        { "x-forwarded-for": "10.0.0.4" },
      ),
    );
    const body = await res.json();
    expect(body.recommendation?.poiId).toMatch(/^food/);
    expect(body.action).toBe("order");
  });

  it("rate-limits after 20 requests from the same IP within a minute", async () => {
    const ip = "10.0.0.99";
    const body = {
      messages: [{ role: "user", content: "quick check" }],
      userLocation: { nodeId: "n-seat" },
    };
    // Burn through the quota.
    for (let i = 0; i < 20; i++) {
      const res = await POST(makeRequest(body, { "x-forwarded-for": ip }));
      expect(res.status).toBe(200);
    }
    const blocked = await POST(makeRequest(body, { "x-forwarded-for": ip }));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
  });
});
