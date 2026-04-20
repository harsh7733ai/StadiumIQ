import type { Order, PlaceOrderRequest } from "@/lib/schemas/order";
import { OrderSchema, OrderListResponseSchema } from "@/lib/schemas/order";
import { conversions } from "@/lib/google/gtag";
import { trackEvent } from "@/lib/firebase/analytics";

const IS_MOCK = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

type Listener = (orders: Order[]) => void;

// ── Polling helpers ──────────────────────────────────────────────────────────

function startPolling(
  url: string,
  cb: Listener,
  intervalMs = 500,
): () => void {
  let active = true;

  async function poll() {
    if (!active) return;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data: unknown = await res.json();
        const parsed = OrderListResponseSchema.safeParse(data);
        if (parsed.success) cb(parsed.data);
      }
    } catch {
      // network blip — silently skip
    }
  }

  void poll();
  const id = setInterval(() => void poll(), intervalMs);
  return () => {
    active = false;
    clearInterval(id);
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function placeOrder(
  input: PlaceOrderRequest,
  userId: string,
): Promise<Order> {
  if (!IS_MOCK) throw new Error("Firestore placeOrder not implemented");

  const res = await fetch("/api/order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": userId,
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Failed to place order");
  }

  const data: unknown = await res.json();
  const order = OrderSchema.parse(data);

  // Conversion telemetry — GA4 for Looker Studio funnels + Firebase for
  // Firebase console DebugView. See docs/GOOGLE_SERVICES.md.
  conversions.orderPlaced(
    order.totalCents,
    order.items.reduce((n, item) => n + item.qty, 0),
  );
  void trackEvent("order_placed", {
    poi_id: order.poiId,
    total_cents: order.totalCents,
    item_count: order.items.reduce((n, item) => n + item.qty, 0),
  });

  return order;
}

export async function advanceOrder(id: string): Promise<Order> {
  if (!IS_MOCK) throw new Error("Firestore advanceOrder not implemented");

  const res = await fetch(`/api/order/${id}/advance`, { method: "POST" });

  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Failed to advance order");
  }

  const data: unknown = await res.json();
  return OrderSchema.parse(data);
}

export function subscribeToUserOrders(userId: string, cb: Listener): () => void {
  if (!IS_MOCK) throw new Error("Firestore subscribeToUserOrders not implemented");
  return startPolling(`/api/order?userId=${encodeURIComponent(userId)}`, cb);
}

export function subscribeToAllOrders(cb: Listener): () => void {
  if (!IS_MOCK) throw new Error("Firestore subscribeToAllOrders not implemented");
  return startPolling("/api/order?all=true", cb);
}
