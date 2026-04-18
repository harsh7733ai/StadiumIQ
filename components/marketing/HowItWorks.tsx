const STEPS = [
  {
    step: "01",
    title: "Scan your ticket",
    body: "Open the PWA from any QR code at entry. No app install, no account required.",
  },
  {
    step: "02",
    title: "See the venue live",
    body: "A color-coded heatmap updates every 500ms. Green means go, red means reroute.",
  },
  {
    step: "03",
    title: "Order, navigate, coordinate",
    body: "Skip lines with virtual queuing, ask the AI where to go, or find your group — all without leaving your seat.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <p className="text-xs text-sky-500 uppercase tracking-widest font-semibold mb-3">How it works</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white">Three steps to a better matchday.</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {STEPS.map(({ step, title, body }) => (
          <div key={step} className="relative pl-6 border-l border-slate-800">
            <p className="text-5xl font-black text-slate-800 select-none leading-none mb-3">{step}</p>
            <h3 className="text-white font-semibold mb-2">{title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
