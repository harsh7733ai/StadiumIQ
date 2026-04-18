"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  label: string;
  value: string;
  subtitle: string;
  trend?: "up" | "down" | "neutral";
  delta?: string;
}

export function KpiCard({ label, value, subtitle, trend = "neutral", delta }: Props) {
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-1">
      <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold tabular-nums text-white leading-none">
          {value}
        </span>
        {delta && (
          <span
            className={`flex items-center gap-0.5 text-xs font-medium mb-0.5 ${
              trend === "up"
                ? "text-green-400"
                : trend === "down"
                ? "text-red-400"
                : "text-slate-500"
            }`}
          >
            {trend === "up" && <TrendingUp className="w-3 h-3" />}
            {trend === "down" && <TrendingDown className="w-3 h-3" />}
            {delta}
          </span>
        )}
      </div>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}
