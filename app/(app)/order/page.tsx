"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MenuList } from "@/components/order/MenuList";
import { CartSummary } from "@/components/order/CartSummary";
import { OrderStatusCard } from "@/components/order/OrderStatusCard";
import { PoisSchema, type Poi } from "@/lib/schemas/poi";
import { CROWD_THRESHOLDS } from "@/lib/constants";
import { useCrowdDensity } from "@/hooks/useCrowdDensity";
import { placeOrder, subscribeToUserOrders } from "@/lib/data/orders";
import { getMenuForPoi } from "@/lib/mock/menus";
import { useUserId } from "@/lib/user/identity";
import type { Order, OrderItem } from "@/lib/schemas/order";
import rawPois from "@/public/venue/pois.json";

const pois: Poi[] = PoisSchema.parse(rawPois);
const foodPois = pois.filter((p) => p.type === "food");

function densityLabel(d: number): string {
  if (d <= CROWD_THRESHOLDS.LOW) return "Low";
  if (d <= CROWD_THRESHOLDS.MEDIUM) return "Moderate";
  if (d <= CROWD_THRESHOLDS.HIGH) return "High";
  return "Critical";
}

function densityBadgeVariant(d: number): "default" | "secondary" | "destructive" {
  if (d <= CROWD_THRESHOLDS.LOW) return "default";
  if (d <= CROWD_THRESHOLDS.MEDIUM) return "secondary";
  return "destructive";
}

type Cart = Record<string, number>;

function OrderPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = useUserId();
  const densityMap = useCrowdDensity();

  const poiParam = searchParams.get("poi");
  const selectedPoi = poiParam ? (pois.find((p) => p.id === poiParam) ?? null) : null;
  const menuItems = selectedPoi ? getMenuForPoi(selectedPoi.id) : [];

  const [cart, setCart] = useState<Cart>({});
  const [placing, setPlacing] = useState(false);
  const [myOrders, setMyOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = subscribeToUserOrders(userId, (orders) => {
      setMyOrders([...orders].sort((a, b) => b.createdAt - a.createdAt));
    });
    return unsubscribe;
  }, [userId]);

  useEffect(() => {
    setCart({});
  }, [poiParam]);

  async function handlePlaceOrder() {
    if (!selectedPoi || !userId) return;
    setPlacing(true);
    try {
      const items: OrderItem[] = menuItems
        .filter((item) => (cart[item.id] ?? 0) > 0)
        .map((item) => ({
          id: item.id,
          name: item.name,
          priceCents: item.priceCents,
          qty: cart[item.id] ?? 0,
        }));

      await placeOrder({ poiId: selectedPoi.id, items }, userId);
      setCart({});
    } finally {
      setPlacing(false);
    }
  }

  const activeOrders = myOrders.filter((o) => o.state !== "collected");
  const recentCollected = myOrders.filter((o) => o.state === "collected").slice(0, 2);

  const displayOrders = selectedPoi
    ? myOrders.filter((o) => o.poiId === selectedPoi.id).slice(0, 3)
    : [...activeOrders, ...recentCollected];

  return (
    <main className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800">
        {selectedPoi && (
          <button
            onClick={() => router.replace("/order")}
            className="text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-lg font-semibold text-white">
          {selectedPoi ? selectedPoi.name : "Order Food & Drinks"}
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!selectedPoi ? (
          <div className="p-4 space-y-3">
            <p className="text-xs text-slate-500">Select a concession to order from</p>
            {foodPois.map((poi) => {
              const d = densityMap[poi.id] ?? 0;
              return (
                <button
                  key={poi.id}
                  onClick={() => router.push(`/order?poi=${poi.id}`)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-600 transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{poi.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {getMenuForPoi(poi.id).length} items
                    </p>
                  </div>
                  <Badge variant={densityBadgeVariant(d)} className="text-xs">
                    {densityLabel(d)}
                  </Badge>
                </button>
              );
            })}

            {displayOrders.length > 0 && (
              <div className="mt-6 space-y-3">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Your orders</p>
                {displayOrders.map((order) => (
                  <OrderStatusCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 pb-0">
            <MenuList items={menuItems} cart={cart} onChange={setCart} />

            {displayOrders.length > 0 && (
              <div className="mt-6 space-y-3 pb-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Your orders here
                </p>
                {displayOrders.map((order) => (
                  <OrderStatusCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedPoi && (
        <CartSummary
          items={menuItems}
          cart={cart}
          loading={placing}
          onPlaceOrder={() => void handlePlaceOrder()}
        />
      )}
    </main>
  );
}

export default function OrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400 text-sm">
          Loading…
        </div>
      }
    >
      <OrderPageInner />
    </Suspense>
  );
}
