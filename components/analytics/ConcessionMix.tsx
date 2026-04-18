"use client";

import type { ConcessionSlice } from "@/lib/mock/analytics";

const SLICE_COLORS = ["#0EA5E9", "#F59E0B", "#8b5cf6"];

interface Props {
  data: ConcessionSlice[];
}

export function ConcessionMix({ data }: Props) {
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3">
      <p className="text-xs text-slate-500 uppercase tracking-wider">
        Concession Mix
      </p>
      {data.map((slice, i) => (
        <div key={slice.name} className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300">{slice.name}</span>
            <span className="text-slate-400 tabular-nums">{slice.pct}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{
                width: `${slice.pct}%`,
                backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
