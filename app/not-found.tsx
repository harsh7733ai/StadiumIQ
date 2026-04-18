import Link from "next/link";
import { Zap } from "lucide-react";
import { BRAND } from "@/lib/brand";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-6 text-center gap-6">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-5 h-5 text-sky-500" />
        <span className="font-bold text-white text-sm">{BRAND.name}</span>
      </div>

      <p className="text-8xl font-black text-slate-800 tabular-nums select-none">404</p>

      <div className="space-y-2">
        <h1 className="text-xl font-bold text-white">Looks like this section is packed.</h1>
        <p className="text-sm text-slate-500 max-w-xs">
          That page doesn&apos;t exist — but the rest of the venue is open.
        </p>
      </div>

      <Link
        href="/"
        className="text-sm font-semibold bg-sky-500 hover:bg-sky-400 text-white px-6 py-2.5 rounded-full transition-colors"
      >
        Back to StadiumIQ
      </Link>
    </div>
  );
}
