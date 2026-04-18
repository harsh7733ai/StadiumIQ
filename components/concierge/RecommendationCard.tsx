"use client";

import { useRouter } from "next/navigation";
import { Utensils, MapPin, ShoppingBag, HeartPulse, DoorOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ConciergeRecommendation } from "@/lib/schemas/concierge";
import { CROWD_THRESHOLDS } from "@/lib/constants";
import type { PoiType } from "@/lib/schemas/poi";

const TYPE_ICONS: Record<PoiType, React.ReactNode> = {
  food: <Utensils className="w-4 h-4" />,
  restroom: <MapPin className="w-4 h-4" />,
  merch: <ShoppingBag className="w-4 h-4" />,
  firstaid: <HeartPulse className="w-4 h-4" />,
  gate: <DoorOpen className="w-4 h-4" />,
};

function densityColor(d: number): string {
  if (d <= CROWD_THRESHOLDS.LOW) return "#22c55e";
  if (d <= CROWD_THRESHOLDS.MEDIUM) return "#eab308";
  if (d <= CROWD_THRESHOLDS.HIGH) return "#f97316";
  return "#ef4444";
}

function poiTypeFromId(poiId: string): PoiType {
  if (poiId.startsWith("food")) return "food";
  if (poiId.startsWith("restroom")) return "restroom";
  if (poiId.startsWith("merch")) return "merch";
  if (poiId.startsWith("firstaid")) return "firstaid";
  return "gate";
}

function formatWalk(sec: number): string {
  if (sec < 60) return `${sec}s walk`;
  return `${Math.round(sec / 60)} min walk`;
}

function formatWait(sec: number): string {
  if (sec === 0) return "no wait";
  if (sec < 60) return `${sec}s wait`;
  return `~${Math.round(sec / 60)} min wait`;
}

function estimateWaitFromDensity(density: number, poiId: string): number {
  const type = poiTypeFromId(poiId);
  if (type === "food") return Math.round(density * 600);
  if (type === "restroom") return Math.round(density * 240);
  return 0;
}

interface Props {
  rec: ConciergeRecommendation;
}

export function RecommendationCard({ rec }: Props) {
  const router = useRouter();
  const poiType = poiTypeFromId(rec.poiId);
  const waitSec = estimateWaitFromDensity(rec.currentDensity, rec.poiId);
  const isOrderable = poiType === "food";

  return (
    <Card className="mt-2 bg-slate-800 border-slate-700">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">{TYPE_ICONS[poiType]}</span>
          <span className="font-semibold text-white text-sm">{rec.poiName}</span>
          <span
            className="ml-auto w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: densityColor(rec.currentDensity) }}
            title={`${Math.round(rec.currentDensity * 100)}% density`}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="text-sky-300 border-sky-700 text-xs">
            {formatWalk(rec.walkTimeSec)}
          </Badge>
          <Badge variant="outline" className="text-slate-300 border-slate-600 text-xs">
            {formatWait(waitSec)}
          </Badge>
        </div>

        <p className="text-xs text-slate-400">{rec.reason}</p>

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-sky-600 hover:bg-sky-500 text-white text-xs"
            onClick={() => router.push(`/map?nav=${rec.poiId}`)}
          >
            Take me there
          </Button>
          {isOrderable && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 text-xs"
              onClick={() => router.push(`/order?poi=${rec.poiId}`)}
            >
              Order now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
