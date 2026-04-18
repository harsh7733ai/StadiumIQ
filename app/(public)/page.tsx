import { NavBar } from "@/components/marketing/NavBar";
import { Hero } from "@/components/marketing/Hero";
import { StatsStrip } from "@/components/marketing/StatsStrip";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { TwoSidedSection } from "@/components/marketing/TwoSidedSection";
import { RoadmapStrip } from "@/components/marketing/RoadmapStrip";
import { Footer } from "@/components/marketing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <NavBar />
      <Hero />
      <StatsStrip />
      <FeatureGrid />
      <HowItWorks />
      <TwoSidedSection />
      <RoadmapStrip />
      <Footer />
    </div>
  );
}
