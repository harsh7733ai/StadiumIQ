"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MenuItem } from "@/lib/mock/menus";

type Cart = Record<string, number>;

interface Props {
  items: MenuItem[];
  cart: Cart;
  onChange: (cart: Cart) => void;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function MenuList({ items, cart, onChange }: Props) {
  function adjust(itemId: string, delta: number) {
    const current = cart[itemId] ?? 0;
    const next = Math.max(0, current + delta);
    if (next === 0) {
      const next2 = { ...cart };
      delete next2[itemId];
      onChange(next2);
    } else {
      onChange({ ...cart, [itemId]: next });
    }
  }

  return (
    <div className="divide-y divide-slate-800">
      {items.map((item) => {
        const qty = cart[item.id] ?? 0;
        return (
          <div key={item.id} className="flex items-center gap-3 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{item.name}</p>
              <p className="text-xs text-slate-500 truncate">{item.description}</p>
            </div>
            <span className="text-sm font-medium text-slate-300 shrink-0">
              {formatCents(item.priceCents)}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7 border-slate-700 text-slate-300"
                onClick={() => adjust(item.id, -1)}
                disabled={qty === 0}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="w-5 text-center text-sm text-white tabular-nums">
                {qty}
              </span>
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7 border-slate-700 text-slate-300"
                onClick={() => adjust(item.id, 1)}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
