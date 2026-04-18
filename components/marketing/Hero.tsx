import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function Hero() {
  return (
    <section className="relative pt-32 pb-24 px-6 overflow-hidden">
      {/* background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-sky-500/10 blur-[120px]"
      />

      <div className="relative max-w-3xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium px-4 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          Live crowd intelligence · Demo build
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight tracking-tight">
          {BRAND.tagline}
        </h1>

        <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
          {BRAND.description}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/map"
            className="w-full sm:w-auto text-sm font-semibold bg-sky-500 hover:bg-sky-400 text-white px-8 py-3 rounded-full transition-colors"
          >
            Try the live demo →
          </Link>
          <Link
            href="/analytics"
            className="w-full sm:w-auto text-sm font-medium border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white px-8 py-3 rounded-full transition-colors"
          >
            Operator dashboard
          </Link>
        </div>
      </div>

      {/* mock app preview */}
      <div className="relative mt-16 max-w-sm mx-auto">
        <div className="rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/60 overflow-hidden">
          {/* phone chrome */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/70" />
              <div className="w-2 h-2 rounded-full bg-amber-500/70" />
              <div className="w-2 h-2 rounded-full bg-green-500/70" />
            </div>
            <span className="text-[10px] text-slate-500 font-mono">stadiumiq.app/map</span>
            <div className="w-12" />
          </div>

          {/* fake heatmap */}
          <div className="relative bg-slate-950 p-4 h-56">
            <svg viewBox="0 0 400 240" className="w-full h-full" aria-hidden>
              {/* outer ring */}
              <ellipse cx="200" cy="120" rx="170" ry="100" fill="none" stroke="#334155" strokeWidth="2" />
              {/* inner ring */}
              <ellipse cx="200" cy="120" rx="100" ry="60" fill="none" stroke="#334155" strokeWidth="1.5" />
              {/* crowd blobs */}
              <circle cx="200" cy="20" r="18" fill="#ef4444" opacity="0.7" />
              <circle cx="340" cy="90" r="14" fill="#f59e0b" opacity="0.65" />
              <circle cx="60" cy="90" r="14" fill="#22c55e" opacity="0.65" />
              <circle cx="120" cy="200" r="12" fill="#22c55e" opacity="0.55" />
              <circle cx="280" cy="200" r="12" fill="#f59e0b" opacity="0.6" />
              <circle cx="200" cy="120" r="8" fill="#0ea5e9" opacity="0.9" />
              {/* route line */}
              <polyline
                points="200,120 200,95 200,60 200,30 200,20"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                opacity="0.8"
              />
              {/* labels */}
              <text x="185" y="17" fill="#fca5a5" fontSize="7" fontFamily="monospace">GATE N</text>
              <text x="325" y="88" fill="#fcd34d" fontSize="7" fontFamily="monospace">FOOD</text>
              <text x="30" y="88" fill="#86efac" fontSize="7" fontFamily="monospace">MERCH</text>
            </svg>
          </div>

          {/* fake bottom sheet */}
          <div className="px-4 py-3 bg-slate-900 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white">Gate North</p>
                <p className="text-[10px] text-red-400">High density · 4 min wait</p>
              </div>
              <button className="text-[10px] bg-sky-500 text-white px-3 py-1.5 rounded-full font-medium">
                Navigate
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
