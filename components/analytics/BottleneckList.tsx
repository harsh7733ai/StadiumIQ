"use client";

import type { BottleneckPoi } from "@/lib/mock/analytics";
import { CROWD_THRESHOLDS } from "@/lib/constants";

function barColor(density: number): string {
  if (density <= CROWD_THRESHOLDS.LOW) return "bg-green-500";
  if (density <= CROWD_THRESHOLDS.MEDIUM) return "bg-yellow-500";
  if (density <= CROWD_THRESHOLDS.HIGH) return "bg-orange-500";
  return "bg-red-500";
}

function fmtWait(sec: number): string {
  if (sec < 60) return `${sec}s`;
  return `${Math.round(sec / 60)} min`;
}

interface Props {
  bottlenecks: BottleneckPoi[];
}

export function BottleneckList({ bottlenecks }: Props) {
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3">
      <p className="text-xs text-slate-500 uppercase tracking-wider">
        Top Bottlenecks
      </p>
      {bottlenecks.map((poi, i) => (
        <div key={poi.id} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 tabular-nums w-3">
                {i + 1}
              </span>
              <span className="text-sm text-white">{poi.name}</span>
            </div>
            <span className="text-xs text-slate-400 tabular-nums">
              {fmtWait(poi.waitSec)} wait
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${barColor(poi.density)}`}
              style={{ width: `${Math.round(poi.density * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
