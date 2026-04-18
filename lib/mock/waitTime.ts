import type { PoiType } from "@/lib/schemas/poi";

export function estimateWaitSec(density: number, poiType: PoiType): number {
  const d = Math.max(0, Math.min(1, density));
  switch (poiType) {
    case "food":
      return Math.round(d * 600);
    case "restroom":
      return Math.round(d * 240);
    default:
      return 0;
  }
}
