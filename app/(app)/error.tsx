"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: Props) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-red-400" />
      </div>
      <div className="space-y-1">
        <p className="text-white font-semibold">Something glitched.</p>
        <p className="text-sm text-slate-500">
          The venue data hiccuped. Tap below to retry.
        </p>
      </div>
      <button
        onClick={reset}
        className="text-sm font-medium bg-sky-500 hover:bg-sky-400 text-white px-6 py-2.5 rounded-full transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
