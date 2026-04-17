"use client";

import { useState } from "react";
import { VenueHeatmap } from "@/components/map/VenueHeatmap";
import { useCrowdDensity } from "@/hooks/useCrowdDensity";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PoisSchema, type Poi } from "@/lib/schemas/poi";
import { CROWD_THRESHOLDS, WAIT_TIME_SECONDS } from "@/lib/constants";
import rawPois from "@/public/venue/pois.json";

const pois: Poi[] = PoisSchema.parse(rawPois);

function densityLabel(d: number): string {
  if (d <= CROWD_THRESHOLDS.LOW) return "Low";
  if (d <= CROWD_THRESHOLDS.MEDIUM) return "Moderate";
  if (d <= CROWD_THRESHOLDS.HIGH) return "High";
  return "Critical";
}

function densityBadgeVariant(d: number): "default" | "secondary" | "destructive" | "outline" {
  if (d <= CROWD_THRESHOLDS.LOW) return "default";
  if (d <= CROWD_THRESHOLDS.MEDIUM) return "secondary";
  return "destructive";
}

function waitSeconds(d: number): number {
  if (d <= CROWD_THRESHOLDS.LOW) return WAIT_TIME_SECONDS.LOW;
  if (d <= CROWD_THRESHOLDS.MEDIUM) return WAIT_TIME_SECONDS.MEDIUM;
  if (d <= CROWD_THRESHOLDS.HIGH) return WAIT_TIME_SECONDS.HIGH;
  return WAIT_TIME_SECONDS.CRITICAL;
}

export default function MapPage() {
  const densityMap = useCrowdDensity();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedPoi = pois.find((p) => p.id === selectedId) ?? null;
  const selectedDensity = selectedId ? (densityMap[selectedId] ?? 0) : 0;

  return (
    <main className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h1 className="text-lg font-semibold text-white">Venue Map</h1>
        <span className="text-xs text-slate-400">Live · updating</span>
      </div>

      {/* Map area */}
      <div className="flex-1 p-3 min-h-0">
        <VenueHeatmap
          pois={pois}
          density={densityMap}
          onSelect={(id) => setSelectedId(id)}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 px-4 pb-4">
        {(
          [
            { label: "Low", color: "bg-green-500" },
            { label: "Moderate", color: "bg-yellow-500" },
            { label: "High", color: "bg-orange-500" },
            { label: "Critical", color: "bg-red-500" },
          ] as const
        ).map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className="text-xs text-slate-400">{label}</span>
          </div>
        ))}
      </div>

      {/* POI detail sheet */}
      <Sheet
        open={selectedId !== null}
        onOpenChange={(open) => { if (!open) setSelectedId(null); }}
      >
        <SheetContent side="bottom" className="rounded-t-2xl bg-slate-900 border-slate-700">
          {selectedPoi && (
            <>
              <SheetHeader className="pb-4">
                <SheetTitle className="text-white">{selectedPoi.name}</SheetTitle>
                <SheetDescription className="sr-only">
                  POI details for {selectedPoi.name}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400">Crowd density</span>
                  <Badge variant={densityBadgeVariant(selectedDensity)}>
                    {densityLabel(selectedDensity)}
                  </Badge>
                  <span className="text-sm font-mono text-white ml-auto">
                    {Math.round(selectedDensity * 100)}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Est. wait</span>
                  <span className="text-sm text-white">
                    ~{Math.round(waitSeconds(selectedDensity) / 60)} min
                  </span>
                </div>

                <Button className="w-full" variant="outline" disabled>
                  Navigate here — coming in Session 3
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </main>
  );
}
