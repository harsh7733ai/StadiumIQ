"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { SimulateEvent } from "@/lib/mock/events";
import type { Order, OrderState } from "@/lib/schemas/order";
import { subscribeToAllOrders, advanceOrder } from "@/lib/data/orders";

interface EventButton {
  event: SimulateEvent;
  label: string;
  description: string;
  variant: "default" | "destructive" | "outline" | "secondary";
}

const EVENT_BUTTONS: EventButton[] = [
  {
    event: "start_match",
    label: "Start Match",
    description: "Gates surge, all POIs set to pre-game baseline",
    variant: "default",
  },
  {
    event: "halftime_rush",
    label: "Halftime Rush",
    description: "Food + beer → critical, restrooms → high",
    variant: "default",
  },
  {
    event: "goal_celebration",
    label: "Goal Celebration",
    description: "Beer → 99%, merch spikes, crowd erupts",
    variant: "default",
  },
  {
    event: "fourth_quarter_lull",
    label: "4th Quarter Lull",
    description: "Food drops, gates start climbing toward exit",
    variant: "outline",
  },
  {
    event: "reset",
    label: "Reset All",
    description: "All POIs → 10% — clean slate",
    variant: "destructive",
  },
];

const STATE_BADGE: Record<OrderState, string> = {
  placed:    "bg-slate-700 text-slate-300",
  preparing: "bg-yellow-900 text-yellow-300",
  ready:     "bg-green-900 text-green-300",
  collected: "bg-slate-800 text-slate-500",
};

export default function AdminPage() {
  const [simLoading, setSimLoading] = useState<SimulateEvent | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAllOrders((all) => {
      setOrders([...all].sort((a, b) => b.createdAt - a.createdAt));
    });
    return unsubscribe;
  }, []);

  async function dispatch(event: SimulateEvent) {
    setSimLoading(event);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        toast.error(`Failed: ${data.error ?? "unknown error"}`);
        return;
      }

      const label = EVENT_BUTTONS.find((b) => b.event === event)?.label ?? event;
      toast.success(`${label} dispatched`, { description: "Heatmap updating…" });
    } catch {
      toast.error("Network error — is the dev server running?");
    } finally {
      setSimLoading(null);
    }
  }

  async function handleAdvance(order: Order) {
    setAdvancingId(order.id);
    try {
      const updated = await advanceOrder(order.id);
      toast.success(`Order #${order.pickupCode} → ${updated.state}`);
    } catch {
      toast.error("Failed to advance order");
    } finally {
      setAdvancingId(null);
    }
  }

  const activeOrders = orders.filter((o) => o.state !== "collected");

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center py-8 px-4 gap-6">
      {/* ── Sim controls ── */}
      <Card className="w-full max-w-md bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-xl">Demo Control</CardTitle>
          <CardDescription className="text-amber-400 text-xs font-medium">
            ⚠ Not linked from the app — bookmark this URL
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {EVENT_BUTTONS.map(({ event, label, description, variant }) => (
            <div key={event} className="space-y-1">
              <Button
                variant={variant}
                className="w-full justify-start text-left"
                disabled={simLoading !== null}
                onClick={() => void dispatch(event)}
              >
                {simLoading === event ? (
                  <span className="animate-pulse">Dispatching…</span>
                ) : (
                  label
                )}
              </Button>
              <p className="text-xs text-slate-500 pl-1">{description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Active orders ── */}
      <Card className="w-full max-w-md bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-xl">Active Orders</CardTitle>
          <CardDescription className="text-slate-500 text-xs">
            Advance orders to simulate kitchen progress
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {activeOrders.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-4">
              No active orders yet.
            </p>
          ) : (
            activeOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 border border-slate-700"
              >
                <span className="text-2xl font-bold tabular-nums text-white tracking-widest">
                  {order.pickupCode}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{order.poiName}</p>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-0.5 ${STATE_BADGE[order.state]}`}>
                    {order.state}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-600 text-slate-300 text-xs shrink-0"
                  disabled={order.state === "collected" || advancingId === order.id}
                  onClick={() => void handleAdvance(order)}
                >
                  {advancingId === order.id ? "…" : "Advance"}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </main>
  );
}
