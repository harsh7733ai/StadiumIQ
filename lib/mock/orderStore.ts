import type { Order, OrderState } from "@/lib/schemas/order";

type Listener = (orders: Order[]) => void;

export interface OrderStore {
  getAll(): Order[];
  getById(id: string): Order | undefined;
  getByUserId(userId: string): Order[];
  create(order: Order): void;
  advance(id: string): Order | undefined;
  getActiveCodes(): Set<string>;
  subscribe(listener: Listener): () => void;
}

const STATE_MACHINE: Record<OrderState, OrderState | null> = {
  placed:     "preparing",
  preparing:  "ready",
  ready:      "collected",
  collected:  null,
};

function createOrderStore(): OrderStore {
  const orders = new Map<string, Order>();
  const listeners = new Set<Listener>();

  function notify() {
    const snapshot = Array.from(orders.values());
    listeners.forEach((l) => l(snapshot));
  }

  return {
    getAll() {
      const result: Order[] = [];
      orders.forEach((o) => result.push(o));
      return result;
    },
    getById(id) {
      return orders.get(id);
    },
    getByUserId(userId) {
      const result: Order[] = [];
      orders.forEach((o) => { if (o.userId === userId) result.push(o); });
      return result;
    },
    create(order) {
      orders.set(order.id, order);
      notify();
    },
    advance(id) {
      const order = orders.get(id);
      if (!order) return undefined;
      const next = STATE_MACHINE[order.state];
      if (!next) return order;
      const updated: Order = { ...order, state: next, updatedAt: Date.now() };
      orders.set(id, updated);
      notify();
      return updated;
    },
    getActiveCodes() {
      const codes = new Set<string>();
      orders.forEach((o) => { if (o.state !== "collected") codes.add(o.pickupCode); });
      return codes;
    },
    subscribe(listener) {
      listeners.add(listener);
      const result: Order[] = [];
      orders.forEach((o) => result.push(o));
      listener(result);
      return () => listeners.delete(listener);
    },
  };
}

declare global {
  // eslint-disable-next-line no-var
  var __stadiumiq_order_store: OrderStore | undefined;
}

export const orderStore: OrderStore =
  globalThis.__stadiumiq_order_store ??
  (globalThis.__stadiumiq_order_store = createOrderStore());
