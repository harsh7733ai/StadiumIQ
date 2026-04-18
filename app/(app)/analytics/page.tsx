"use client";

import { useEffect, useState, useCallback } from "react";
import { KpiCard } from "@/components/analytics/KpiCard";
import { WaitTimeChart } from "@/components/analytics/WaitTimeChart";
import { BottleneckList } from "@/components/analytics/BottleneckList";
import { ConcessionMix } from "@/components/analytics/ConcessionMix";
import type { AnalyticsPayload } from "@/lib/mock/analytics";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsPayload | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) setData(await res.json());
    } catch {
      // silent — stale data is fine
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    const id = setInterval(fetchAnalytics, 3000);
    return () => clearInterval(id);
  }, [fetchAnalytics]);

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-slate-500 text-sm">Loading…</p>
      </div>
    );
  }

  const { kpis, bottlenecks, hourly, mix } = data;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Operator Dashboard</h1>
          <p className="text-xs text-slate-500">Live venue intelligence</p>
        </div>
        <span className="text-[10px] bg-sky-600/20 text-sky-400 border border-sky-600/30 rounded-full px-2 py-0.5 font-medium">
          LIVE
        </span>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          label="Avg Wait"
          value={`${kpis.avgWaitSec}s`}
          subtitle="across all POIs"
          trend={kpis.avgWaitSec < 90 ? "up" : "down"}
          delta={`${kpis.waitReductionPct}% vs baseline`}
        />
        <KpiCard
          label="Revenue Lift"
          value={`+${kpis.revenueLiftPct}%`}
          subtitle="vs no-app baseline"
          trend="up"
          delta="est. today"
        />
        <KpiCard
          label="Fan NPS"
          value={String(kpis.npsProxy)}
          subtitle="proxy score"
          trend={kpis.npsProxy >= 70 ? "up" : "neutral"}
        />
        <KpiCard
          label="Active Fans"
          value={String(kpis.activeFans)}
          subtitle="in venue now"
          trend="neutral"
        />
      </div>

      <WaitTimeChart data={hourly} />

      <BottleneckList bottlenecks={bottlenecks} />

      <ConcessionMix data={mix} />
    </div>
  );
}
