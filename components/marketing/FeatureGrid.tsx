import { Map, MessageSquare, ShoppingBag, Users } from "lucide-react";

const FEATURES = [
  {
    icon: Map,
    title: "Live Crowd Heatmap",
    body: "See density across the entire venue in real time. Know which gate, restroom, or stand is packed before you move.",
    accent: "bg-sky-600/10 border-sky-600/20 text-sky-400",
  },
  {
    icon: MessageSquare,
    title: "AI Concierge",
    body: "Ask anything in plain English. \"Nearest veggie option under 5 min wait\" gets you a pin and reasoning, not a list.",
    accent: "bg-violet-600/10 border-violet-600/20 text-violet-400",
  },
  {
    icon: ShoppingBag,
    title: "Virtual Queue",
    body: "Order from your seat, skip the line. Pick up when your code goes green — no waiting, no guessing.",
    accent: "bg-amber-600/10 border-amber-600/20 text-amber-400",
  },
  {
    icon: Users,
    title: "Group Coordination",
    body: "Share your live pin with your crew. One tap shows everyone's location and the best spot to reunite.",
    accent: "bg-emerald-600/10 border-emerald-600/20 text-emerald-400",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="max-w-5xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <p className="text-xs text-sky-500 uppercase tracking-widest font-semibold mb-3">Features</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white">Everything a fan needs.</h2>
        <p className="text-slate-400 mt-3 max-w-md mx-auto text-sm">
          Four features that turn frustration into flow — crowd routing, ordering, concierge, and group sync.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {FEATURES.map(({ icon: Icon, title, body, accent }) => (
          <div
            key={title}
            className="rounded-2xl bg-slate-900 border border-slate-800 p-6 hover:-translate-y-1 transition-transform duration-200"
          >
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border ${accent} mb-4`}>
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-white font-semibold mb-2">{title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
