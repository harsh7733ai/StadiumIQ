"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { SimulateEvent } from "@/lib/mock/events";

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

export default function AdminPage() {
  const [loading, setLoading] = useState<SimulateEvent | null>(null);

  async function dispatch(event: SimulateEvent) {
    setLoading(event);
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
      toast.success(`${label} dispatched`, {
        description: "Heatmap updating…",
      });
    } catch {
      toast.error("Network error — is the dev server running?");
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
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
                disabled={loading !== null}
                onClick={() => dispatch(event)}
              >
                {loading === event ? (
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
    </main>
  );
}
