import { Check } from "lucide-react";

const FOR_FANS = [
  "Live crowd heatmap — know before you go",
  "Shortest path routing, crowd-weighted",
  "Order from seat, skip the physical queue",
  "AI concierge for any venue question",
  "Share live pins with your group",
];

const FOR_VENUES = [
  "Real-time bottleneck detection + alerts",
  "Revenue lift via reduced queue abandonment",
  "Operator KPI dashboard with live data",
  "Match-event simulation for staff prep",
  "Two-sided platform with zero extra hardware",
];

function Column({
  tag,
  title,
  items,
  highlight,
}: {
  tag: string;
  title: string;
  items: string[];
  highlight: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 flex flex-col gap-6">
      <div>
        <span className={`text-xs font-semibold uppercase tracking-widest ${highlight}`}>{tag}</span>
        <h3 className="text-2xl font-bold text-white mt-2">{title}</h3>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
            <Check className={`w-4 h-4 mt-0.5 shrink-0 ${highlight}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TwoSidedSection() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <p className="text-xs text-sky-500 uppercase tracking-widest font-semibold mb-3">Platform</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white">Built for both sides of the turnstile.</h2>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Column tag="For fans" title="Your matchday copilot." items={FOR_FANS} highlight="text-sky-400" />
        <Column tag="For venues" title="Your ops intelligence layer." items={FOR_VENUES} highlight="text-amber-400" />
      </div>
    </section>
  );
}
