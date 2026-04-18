"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { HourlyPoint } from "@/lib/mock/analytics";

interface Props {
  data: HourlyPoint[];
}

export function WaitTimeChart({ data }: Props) {
  return (
    <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
        Avg Wait Time (sec)
      </p>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="waitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={2}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 8,
              fontSize: 12,
              color: "#e2e8f0",
            }}
            formatter={(v) => [`${v}s`, "Avg wait"]}
            labelStyle={{ color: "#94a3b8" }}
          />
          <Area
            type="monotone"
            dataKey="avgWaitSec"
            stroke="#0EA5E9"
            strokeWidth={2}
            fill="url(#waitGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#0EA5E9" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
