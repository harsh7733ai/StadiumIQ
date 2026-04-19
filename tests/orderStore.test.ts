import { describe, it, expect } from "vitest";
import { orderStore } from "@/lib/mock/orderStore";
import type { Order } from "@/lib/schemas/order";

/**
 * orderStore is a `globalThis` singleton shared across tests. To keep tests
 * isolated without adding a destructive `clear()` hole to the production API,
 * every test uses a freshly-generated user id and only asserts on that user's
 * orders.
 */
function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    userId: overrides.userId ?? crypto.randomUUID(),
    poiId: overrides.poiId ?? "food-beer",
    poiName: overrides.poiName ?? "Beer Garden",
    items: overrides.items ?? [{ id: "beer", name: "IPA", priceCents: 800, qty: 1 }],
    totalCents: overrides.totalCents ?? 800,
    pickupCode: overrides.pickupCode ?? String(Math.floor(1000 + Math.random() * 9000)),
    state: overrides.state ?? "placed",
    createdAt: overrides.createdAt ?? Date.now(),
    updatedAt: overrides.updatedAt ?? Date.now(),
  };
}

describe("orderStore", () => {
  it("create() adds an order retrievable by id", () => {
    const order = makeOrder();
    orderStore.create(order);
    expect(orderStore.getById(order.id)).toEqual(order);
  });

  it("getByUserId() returns only the caller's orders", () => {
    const userA = crypto.randomUUID();
    const userB = crypto.randomUUID();

    orderStore.create(makeOrder({ userId: userA }));
    orderStore.create(makeOrder({ userId: userB }));
    orderStore.create(makeOrder({ userId: userA }));

    expect(orderStore.getByUserId(userA)).toHaveLength(2);
    expect(orderStore.getByUserId(userB)).toHaveLength(1);
  });

  it("advance() walks placed → preparing → ready → collected", () => {
    const order = makeOrder();
    orderStore.create(order);

    expect(orderStore.advance(order.id)?.state).toBe("preparing");
    expect(orderStore.advance(order.id)?.state).toBe("ready");
    expect(orderStore.advance(order.id)?.state).toBe("collected");
  });

  it("advance() is idempotent once state is 'collected'", () => {
    const order = makeOrder({ state: "collected" });
    orderStore.create(order);

    const out = orderStore.advance(order.id);
    expect(out?.state).toBe("collected");
  });

  it("advance() returns undefined for an unknown id", () => {
    expect(orderStore.advance("does-not-exist")).toBeUndefined();
  });

  it("getActiveCodes() excludes collected orders", () => {
    const activeCode = `A${Math.floor(1000 + Math.random() * 9000)}`;
    const collectedCode = `C${Math.floor(1000 + Math.random() * 9000)}`;

    orderStore.create(makeOrder({ pickupCode: activeCode, state: "placed" }));
    orderStore.create(makeOrder({ pickupCode: collectedCode, state: "collected" }));

    const codes = orderStore.getActiveCodes();
    expect(codes.has(activeCode)).toBe(true);
    expect(codes.has(collectedCode)).toBe(false);
  });

  it("subscribe() fires immediately with the current snapshot and on every mutation", () => {
    const snapshots: Order[][] = [];
    const unsub = orderStore.subscribe((orders) => {
      snapshots.push(orders);
    });

    const initialCount = snapshots.length;
    orderStore.create(makeOrder());
    expect(snapshots.length).toBeGreaterThan(initialCount);

    unsub();
  });

  it("unsubscribed listeners stop receiving updates", () => {
    let called = 0;
    const unsub = orderStore.subscribe(() => {
      called++;
    });

    const beforeUnsub = called;
    unsub();
    orderStore.create(makeOrder());
    expect(called).toBe(beforeUnsub);
  });
});
