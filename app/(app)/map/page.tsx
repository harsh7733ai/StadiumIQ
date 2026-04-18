"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { VenueHeatmap } from "@/components/map/VenueHeatmap";
import { RouteOverlay } from "@/components/map/RouteOverlay";
import { UserMarker } from "@/components/map/UserMarker";
import { useCrowdDensity } from "@/hooks/useCrowdDensity";
import { useRoute } from "@/hooks/useRoute";
import { getGraph } from "@/lib/routing";
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
import { CROWD_THRESHOLDS, USER_SEAT_NODE_ID } from "@/lib/constants";
import { estimateWaitSec } from "@/lib/mock/waitTime";
import rawPois from "@/public/venue/pois.json";

const pois: Poi[] = PoisSchema.parse(rawPois);
const graph = getGraph();

const userSeatNode = graph.nodes.find((n) => n.id === USER_SEAT_NODE_ID);
const USER_X = userSeatNode?.x ?? 560;
const USER_Y = userSeatNode?.y ?? 215;

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

function formatEta(sec: number): string {
  if (sec < 60) return `${sec}s`;
  return `${Math.round(sec / 60)} min`;
}

function MapPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const densityMap = useCrowdDensity();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [navTarget, setNavTarget] = useState<string | null>(null);

  const { path, etaSec } = useRoute(navTarget);

  // Auto-activate routing from deep-link ?nav=<poiId>
  useEffect(() => {
    const navParam = searchParams.get("nav");
    if (navParam && pois.some((p) => p.id === navParam)) {
      setNavTarget(navParam);
    }
  }, [searchParams]);

  const selectedPoi = pois.find((p) => p.id === selectedId) ?? null;
  const selectedDensity = selectedId ? (densityMap[selectedId] ?? 0) : 0;

  function handleNavigate() {
    if (selectedId) {
      setNavTarget(selectedId);
      setSelectedId(null);
    }
  }

  function clearRoute() {
    setNavTarget(null);
    // Remove the nav param from the URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete("nav");
    const newUrl = params.size > 0 ? `/map?${params.toString()}` : "/map";
    router.replace(newUrl);
  }

  return (
    <main className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h1 className="text-lg font-semibold text-white">Venue Map</h1>
        <div className="flex items-center gap-2">
          {navTarget && (
            <button
              onClick={clearRoute}
              className="text-xs text-sky-400 underline underline-offset-2"
            >
              Clear route
            </button>
          )}
          <span className="text-xs text-slate-400">Live · updating</span>
        </div>
      </div>

      {/* ETA chip */}
      {navTarget && path.length > 0 && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-sky-950 border-b border-sky-800">
          <span className="text-xs text-sky-300">
            Navigating to{" "}
            <span className="font-semibold text-sky-100">
              {pois.find((p) => p.id === navTarget)?.name ?? navTarget}
            </span>
          </span>
          <Badge variant="outline" className="text-sky-200 border-sky-700 text-xs">
            ~{formatEta(etaSec)} walk
          </Badge>
        </div>
      )}

      {/* Map area */}
      <div className="flex-1 p-3 min-h-0">
        <VenueHeatmap
          pois={pois}
          density={densityMap}
          onSelect={(id) => setSelectedId(id)}
        >
          <RouteOverlay path={path} graph={graph} />
          <UserMarker x={USER_X} y={USER_Y} />
        </VenueHeatmap>
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
                    ~{Math.max(1, Math.round(estimateWaitSec(selectedDensity, selectedPoi.type) / 60))} min
                  </span>
                </div>

                <Button
                  className="w-full bg-sky-600 hover:bg-sky-500 text-white"
                  onClick={handleNavigate}
                >
                  Navigate here
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </main>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-950 text-slate-400 text-sm">Loading map…</div>}>
      <MapPageInner />
    </Suspense>
  );
}
