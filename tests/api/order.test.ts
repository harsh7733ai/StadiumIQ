import { describe, it, expect } from "vitest";
import { POST, GET } from "@/app/api/order/route";

/**
 * Integration tests for /api/order. The underlying orderStore is a global
 * singleton that has no `clear()` method by design (we don't want a
 * production kill-switch). To keep tests isolated, each test uses a fresh
 * random user ID and asserts only on that user's orders.
 */
function uid(): string {
  return `test-${Math.random().toString(36).slice(2, 10)}`;
}

function makeRequest(url: string, init: RequestInit = {}) {
  return new Request(url, init);
}

describe("POST /api/order", () => {
  it("rejects requests missing the X-User-Id header", async () => {
    const req = makeRequest("http://localhost/api/order", {
      method: "POST",
      body: JSON.stringify({
        poiId: "food-burger",
        items: [{ id: "b", name: "Burger", priceCents: 1200, qty: 1 }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/X-User-Id/i);
  });

  it("rejects an invalid body (empty items array)", async () => {
    const req = makeRequest("http://localhost/api/order", {
      method: "POST",
      headers: { "X-User-Id": uid() },
      body: JSON.stringify({ poiId: "food-burger", items: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects unknown POI IDs", async () => {
    const req = makeRequest("http://localhost/api/order", {
      method: "POST",
      headers: { "X-User-Id": uid() },
      body: JSON.stringify({
        poiId: "nonexistent",
        items: [{ id: "x", name: "Thing", priceCents: 100, qty: 1 }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/unknown POI/i);
  });

  it("rejects oversize carts (>20 items)", async () => {
    const items = Array.from({ length: 21 }, (_, i) => ({
      id: `i${i}`,
      name: `Item ${i}`,
      priceCents: 100,
      qty: 1,
    }));
    const req = makeRequest("http://localhost/api/order", {
      method: "POST",
      headers: { "X-User-Id": uid() },
      body: JSON.stringify({ poiId: "food-burger", items }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects oversize quantities (>20 per line item)", async () => {
    const req = makeRequest("http://localhost/api/order", {
      method: "POST",
      headers: { "X-User-Id": uid() },
      body: JSON.stringify({
        poiId: "food-burger",
        items: [{ id: "b", name: "Burger", priceCents: 1200, qty: 21 }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates an order with correct totalCents, pickupCode, and state=placed", async () => {
    const user = uid();
    const req = makeRequest("http://localhost/api/order", {
      method: "POST",
      headers: { "X-User-Id": user },
      body: JSON.stringify({
        poiId: "food-burger",
        items: [
          { id: "burger", name: "Burger", priceCents: 1200, qty: 2 },
          { id: "fries", name: "Fries", priceCents: 500, qty: 1 },
        ],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const order = await res.json();
    expect(order.state).toBe("placed");
    expect(order.totalCents).toBe(1200 * 2 + 500);
    expect(order.pickupCode).toMatch(/^\d{4}$/);
    expect(order.userId).toBe(user);
    expect(order.poiName).toBe("Burger Stand");
  });
});

describe("GET /api/order", () => {
  it("returns 400 when neither userId nor all=true is passed", async () => {
    const res = await GET(makeRequest("http://localhost/api/order"));
    expect(res.status).toBe(400);
  });

  it("returns empty array for a user with no orders", async () => {
    const res = await GET(makeRequest(`http://localhost/api/order?userId=${uid()}`));
    expect(res.status).toBe(200);
    const orders = await res.json();
    expect(orders).toEqual([]);
  });

  it("filters orders by userId and sorts by createdAt desc", async () => {
    const user = uid();
    const postReq = (body: object) =>
      makeRequest("http://localhost/api/order", {
        method: "POST",
        headers: { "X-User-Id": user },
        body: JSON.stringify(body),
      });

    await POST(
      postReq({
        poiId: "food-burger",
        items: [{ id: "burger", name: "Burger", priceCents: 1200, qty: 1 }],
      }),
    );
    await new Promise((r) => setTimeout(r, 3));
    await POST(
      postReq({
        poiId: "food-pizza",
        items: [{ id: "p", name: "Pizza", priceCents: 1500, qty: 1 }],
      }),
    );

    const res = await GET(makeRequest(`http://localhost/api/order?userId=${user}`));
    const orders = await res.json();
    expect(orders.length).toBe(2);
    expect(orders[0].createdAt).toBeGreaterThanOrEqual(orders[1].createdAt);
  });
});
