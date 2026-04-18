import Link from "next/link";
import { Zap } from "lucide-react";
import { BRAND } from "@/lib/brand";

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950">
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-sky-500" />
          <span className="font-bold text-white text-sm">{BRAND.name}</span>
        </Link>

        <nav className="flex items-center gap-6 text-xs text-slate-500">
          <Link href="/map" className="hover:text-slate-300 transition-colors">App</Link>
          <Link href="/analytics" className="hover:text-slate-300 transition-colors">Operators</Link>
          <Link href="/admin" className="hover:text-slate-300 transition-colors">Admin</Link>
        </nav>

        <p className="text-xs text-slate-600">&copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
      </div>
    </footer>
  );
}
