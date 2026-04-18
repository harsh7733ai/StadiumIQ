import Link from "next/link";
import { Zap } from "lucide-react";
import { BRAND } from "@/lib/brand";

export function NavBar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-sky-500" />
        <span className="font-bold text-white text-sm tracking-tight">{BRAND.name}</span>
      </Link>

      <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
        <Link href="#features" className="hover:text-white transition-colors">Features</Link>
        <Link href="#how-it-works" className="hover:text-white transition-colors">How it works</Link>
        <Link href="/analytics" className="hover:text-white transition-colors">Operators</Link>
      </div>

      <Link
        href="/map"
        className="text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white px-4 py-2 rounded-full transition-colors"
      >
        Open app →
      </Link>
    </nav>
  );
}
