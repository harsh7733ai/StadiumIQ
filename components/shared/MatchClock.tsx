"use client";

import { useState, useEffect } from "react";

interface ClockState {
  quarter: number;
  mm: string;
  ss: string;
}

function parseClock(matchMinute: number): ClockState {
  const QUARTER_DURATION = 22.5;
  const quarter = Math.min(4, Math.floor(matchMinute / QUARTER_DURATION) + 1);
  const secInQuarter = (matchMinute % QUARTER_DURATION) * 60;
  const mm = Math.floor(secInQuarter / 60);
  const ss = Math.floor(secInQuarter % 60);
  return {
    quarter,
    mm: String(mm).padStart(2, "0"),
    ss: String(ss).padStart(2, "0"),
  };
}

export function MatchClock() {
  const [clock, setClock] = useState<ClockState | null>(null);

  useEffect(() => {
    async function fetch_clock() {
      try {
        const res = await fetch("/api/clock", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { matchMinute: number };
        setClock(parseClock(data.matchMinute));
      } catch {
        // silently skip
      }
    }

    void fetch_clock();
    const id = setInterval(() => void fetch_clock(), 1000);
    return () => clearInterval(id);
  }, []);

  if (!clock) return <span className="text-xs text-slate-600">—</span>;

  return (
    <span className="text-xs text-slate-400 tabular-nums font-medium">
      Q{clock.quarter} · {clock.mm}:{clock.ss}
    </span>
  );
}
