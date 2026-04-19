import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/simulate/route";
import { mockStore } from "@/lib/mock/store";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/simulate", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/simulate", () => {
  it("rejects unknown event names with 400 + validation details", async () => {
    const res = await POST(makeRequest({ event: "not-a-real-event" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid event");
    expect(body.details).toBeDefined();
  });

  it("rejects requests without an `event` field", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("accepts 'start_match' and bumps gate density", async () => {
    const res = await POST(makeRequest({ event: "start_match" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    // Gates should be at ~0.85 after start_match.
    const gateDensity = mockStore.get("gate-north");
    expect(gateDensity ?? 0).toBeGreaterThan(0.5);
  });

  it("accepts 'halftime_rush' and spikes food POIs", async () => {
    await POST(makeRequest({ event: "halftime_rush" }));
    const foodDensity = mockStore.get("food-burger") ?? 0;
    expect(foodDensity).toBeGreaterThan(0.7);
  });

  it("accepts 'reset' and clears elevated densities", async () => {
    await POST(makeRequest({ event: "halftime_rush" }));
    const res = await POST(makeRequest({ event: "reset" }));
    expect(res.status).toBe(200);

    const foodDensity = mockStore.get("food-burger") ?? 0;
    expect(foodDensity).toBeLessThan(0.5);
  });
});
