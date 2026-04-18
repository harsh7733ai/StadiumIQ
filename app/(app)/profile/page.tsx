"use client";

import { useEffect, useState } from "react";
import { User, Ticket, ShoppingBag } from "lucide-react";
import { getOrCreateUserId } from "@/lib/user/identity";

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(getOrCreateUserId());
  }, []);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-sky-600/20 flex items-center justify-center">
          <User className="w-8 h-8 text-sky-400" />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold">Guest Fan</p>
          <p className="text-xs text-slate-500 mt-0.5">Anonymous session</p>
        </div>
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3">
        <p className="text-xs text-slate-500 uppercase tracking-wider">Session</p>
        <div className="flex items-start gap-3">
          <Ticket className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-slate-400">User ID</p>
            <p className="text-xs font-mono text-slate-300 break-all">{userId ?? "—"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3">
        <p className="text-xs text-slate-500 uppercase tracking-wider">Quick Links</p>
        <a
          href="/order"
          className="flex items-center gap-3 py-2 text-sm text-slate-300 hover:text-white transition-colors"
        >
          <ShoppingBag className="w-4 h-4 text-slate-500" />
          View my orders
        </a>
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">App</p>
        <p className="text-xs text-slate-600">StadiumIQ v0.1 · Demo build</p>
      </div>
    </div>
  );
}
