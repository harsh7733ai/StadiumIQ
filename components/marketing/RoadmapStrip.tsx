const ROADMAP = [
  "Computer-vision crowd counting from IP cameras",
  "Ticketmaster + SeatGeek integrations",
  "Accessible + sensory-low routing modes",
  "Dynamic concession pricing",
  "Sponsor surfaces & native ad placements",
  "Multi-venue operator platform",
];

export function RoadmapStrip() {
  return (
    <section className="border-y border-slate-800 bg-slate-900/40 py-12 overflow-hidden">
      <p className="text-center text-xs text-slate-500 uppercase tracking-widest mb-6">Roadmap</p>
      <div className="flex gap-4 overflow-x-auto pb-2 px-6 scrollbar-hide max-w-5xl mx-auto flex-wrap justify-center">
        {ROADMAP.map((item) => (
          <span
            key={item}
            className="shrink-0 text-xs text-slate-400 border border-slate-700 rounded-full px-4 py-1.5 whitespace-nowrap"
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
