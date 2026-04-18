const STATS = [
  { value: "38%", label: "shorter wait times" },
  { value: "2s", label: "heatmap update latency" },
  { value: "+23%", label: "concession revenue lift" },
  { value: "72", label: "fan NPS score" },
];

export function StatsStrip() {
  return (
    <section className="border-y border-slate-800 bg-slate-900/50">
      <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-3xl font-bold text-white tabular-nums">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
