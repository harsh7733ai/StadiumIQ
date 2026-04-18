import { getDensitySnapshot } from "@/lib/data/crowd";
import { estimateWaitSec } from "@/lib/mock/waitTime";
import { densityFor } from "@/lib/mock/matchTimeline";
import { getMatchMinute } from "@/lib/mock/generator";
import rawPois from "@/public/venue/pois.json";
import { PoisSchema } from "@/lib/schemas/poi";

const pois = PoisSchema.parse(rawPois);
const foodPois = pois.filter((p) => p.type === "food");

export interface HeadlineKPIs {
  avgWaitSec: number;
  waitReductionPct: number;
  revenueLiftPct: number;
  npsProxy: number;
  activeFans: number;
}

export interface BottleneckPoi {
  id: string;
  name: string;
  density: number;
  waitSec: number;
}

export interface HourlyPoint {
  label: string;
  avgWaitSec: number;
}

export interface ConcessionSlice {
  name: string;
  pct: number;
}

export function getHeadlineKPIs(): HeadlineKPIs {
  const density = getDensitySnapshot();
  const waits = foodPois.map((p) =>
    estimateWaitSec(density[p.id] ?? 0, "food"),
  );
  const avgWaitSec =
    waits.length > 0
      ? Math.round(waits.reduce((s, w) => s + w, 0) / waits.length)
      : 0;

  const waitReductionPct = Math.min(
    61,
    Math.max(18, Math.round(61 - avgWaitSec / 12)),
  );
  const revenueLiftPct = Math.min(
    34,
    Math.max(8, Math.round(12 + waitReductionPct * 0.55)),
  );
  const npsProxy = Math.min(72, Math.max(38, Math.round(38 + waitReductionPct * 0.55)));

  const densityValues = Object.values(density);
  const avgDensity =
    densityValues.length > 0
      ? densityValues.reduce((s, d) => s + d, 0) / densityValues.length
      : 0;
  const activeFans = Math.round(18000 + avgDensity * 24000);

  return { avgWaitSec, waitReductionPct, revenueLiftPct, npsProxy, activeFans };
}

export function getTopBottlenecks(n = 3): BottleneckPoi[] {
  const density = getDensitySnapshot();
  return pois
    .filter((p) => p.type === "food" || p.type === "restroom")
    .map((p) => ({
      id: p.id,
      name: p.name,
      density: density[p.id] ?? 0,
      waitSec: estimateWaitSec(density[p.id] ?? 0, p.type),
    }))
    .sort((a, b) => b.density - a.density)
    .slice(0, n);
}

export function getHourlyWaitSeries(): HourlyPoint[] {
  const currentMinute = getMatchMinute();
  const points: HourlyPoint[] = [];

  for (let i = 11; i >= 0; i--) {
    const minute = Math.max(0, currentMinute - i * 7.5);
    const waits = foodPois.map(() =>
      estimateWaitSec(densityFor(minute, "food"), "food"),
    );
    const avg =
      waits.length > 0
        ? Math.round(waits.reduce((s, w) => s + w, 0) / waits.length)
        : 0;

    const totalMin = Math.round(minute);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const label =
      h > 0
        ? `${h}h${String(m).padStart(2, "0")}`
        : `${String(totalMin).padStart(2, "0")}m`;

    points.push({ label, avgWaitSec: avg });
  }

  return points;
}

export interface AnalyticsPayload {
  kpis: HeadlineKPIs;
  bottlenecks: BottleneckPoi[];
  hourly: HourlyPoint[];
  mix: ConcessionSlice[];
}

export function getConcessionMix(): ConcessionSlice[] {
  return [
    { name: "Food", pct: 44 },
    { name: "Beer", pct: 38 },
    { name: "Merch", pct: 18 },
  ];
}
