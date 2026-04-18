"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChefHat, CheckCircle, Package } from "lucide-react";
import { toast } from "sonner";
import type { Order, OrderState } from "@/lib/schemas/order";

const STATE_CONFIG: Record<
  OrderState,
  { label: string; icon: React.ReactNode; color: string; badgeClass: string }
> = {
  placed: {
    label: "Order placed",
    icon: <Clock className="w-4 h-4" />,
    color: "text-slate-400",
    badgeClass: "bg-slate-700 text-slate-300",
  },
  preparing: {
    label: "Preparing",
    icon: <ChefHat className="w-4 h-4" />,
    color: "text-yellow-400",
    badgeClass: "bg-yellow-900 text-yellow-300",
  },
  ready: {
    label: "Ready for pickup!",
    icon: <CheckCircle className="w-4 h-4" />,
    color: "text-green-400",
    badgeClass: "bg-green-900 text-green-300",
  },
  collected: {
    label: "Collected",
    icon: <Package className="w-4 h-4" />,
    color: "text-slate-500",
    badgeClass: "bg-slate-800 text-slate-500",
  },
};

const STEPS: OrderState[] = ["placed", "preparing", "ready", "collected"];

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

interface Props {
  order: Order;
}

export function OrderStatusCard({ order }: Props) {
  const prevStateRef = useRef<OrderState>(order.state);
  const config = STATE_CONFIG[order.state];

  useEffect(() => {
    if (prevStateRef.current !== "ready" && order.state === "ready") {
      toast.success(`Order #${order.pickupCode} is ready!`, {
        description: `Head to ${order.poiName} to pick it up.`,
        duration: 8000,
      });
    }
    prevStateRef.current = order.state;
  }, [order.state, order.pickupCode, order.poiName]);

  const isCollected = order.state === "collected";

  return (
    <motion.div
      key={order.id}
      layout
      animate={order.state === "ready" ? { scale: [1, 1.03, 1] } : {}}
      transition={{ duration: 0.4 }}
      className="rounded-2xl bg-slate-900 border border-slate-700 p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300">{order.poiName}</span>
        <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${config.badgeClass}`}>
          {config.icon}
          {config.label}
        </span>
      </div>

      {/* Pickup code */}
      <div className="text-center py-2">
        <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Pickup code</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={order.state}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-4xl font-bold tracking-widest tabular-nums ${isCollected ? "text-slate-600" : "text-white"}`}
          >
            {order.pickupCode}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress stepper */}
      <div className="flex items-center gap-1">
        {STEPS.map((step, idx) => {
          const stepIdx = STEPS.indexOf(order.state);
          const isPast = idx < stepIdx;
          const isCurrent = idx === stepIdx;
          const stepConfig = STATE_CONFIG[step];

          return (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`w-2 h-2 rounded-full shrink-0 transition-colors duration-300 ${
                  isCurrent
                    ? step === "ready"
                      ? "bg-green-400 ring-2 ring-green-400/30"
                      : step === "preparing"
                      ? "bg-yellow-400 ring-2 ring-yellow-400/30"
                      : "bg-sky-400 ring-2 ring-sky-400/30"
                    : isPast
                    ? "bg-slate-500"
                    : "bg-slate-700"
                }`}
              />
              {idx < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px mx-1 transition-colors duration-300 ${
                    isPast ? "bg-slate-500" : "bg-slate-700"
                  }`}
                />
              )}
              <span className={`sr-only`}>{stepConfig.label}</span>
            </div>
          );
        })}
      </div>

      {/* Items */}
      <div className="space-y-1">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-xs text-slate-500">
            <span>{item.name} × {item.qty}</span>
            <span>{formatCents(item.priceCents * item.qty)}</span>
          </div>
        ))}
        <div className="flex justify-between text-xs font-medium text-slate-400 pt-1 border-t border-slate-800">
          <span>Total</span>
          <span>{formatCents(order.totalCents)}</span>
        </div>
      </div>
    </motion.div>
  );
}
