"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MenuItem } from "@/lib/mock/menus";

type Cart = Record<string, number>;

const TAX_RATE = 0.08875;

interface Props {
  items: MenuItem[];
  cart: Cart;
  loading: boolean;
  onPlaceOrder: () => void;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function CartSummary({ items, cart, loading, onPlaceOrder }: Props) {
  const cartItems = items
    .filter((item) => (cart[item.id] ?? 0) > 0)
    .map((item) => ({ ...item, qty: cart[item.id] ?? 0 }));

  const subtotalCents = cartItems.reduce(
    (sum, item) => sum + item.priceCents * item.qty,
    0,
  );
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  const totalCents = subtotalCents + taxCents;
  const isEmpty = cartItems.length === 0;

  return (
    <div className="border-t border-slate-800 bg-slate-950 px-4 py-4 space-y-3">
      {!isEmpty && (
        <div className="space-y-1.5">
          {cartItems.map((item) => (
            <div key={item.id} className="flex justify-between text-xs text-slate-400">
              <span>
                {item.name} × {item.qty}
              </span>
              <span>{formatCents(item.priceCents * item.qty)}</span>
            </div>
          ))}
          <div className="flex justify-between text-xs text-slate-500 pt-1 border-t border-slate-800">
            <span>Tax (8.875%)</span>
            <span>{formatCents(taxCents)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-white">
            <span>Total</span>
            <span>{formatCents(totalCents)}</span>
          </div>
        </div>
      )}

      <Button
        className="w-full bg-sky-600 hover:bg-sky-500 text-white"
        disabled={isEmpty || loading}
        onClick={onPlaceOrder}
      >
        {loading ? (
          "Placing order…"
        ) : isEmpty ? (
          <span className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Add items to order
          </span>
        ) : (
          `Place Order · ${formatCents(totalCents)}`
        )}
      </Button>
    </div>
  );
}
