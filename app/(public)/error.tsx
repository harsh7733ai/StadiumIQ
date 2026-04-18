"use client";

import { useEffect } from "react";
import Link from "next/link";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PublicError({ error, reset }: Props) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-6xl font-black text-slate-800 select-none">500</p>
      <div className="space-y-1">
        <p className="text-white font-semibold">Something went wrong.</p>
        <p className="text-sm text-slate-500">We hit an unexpected error on our end.</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="text-sm font-medium border border-slate-700 hover:border-slate-500 text-slate-300 px-5 py-2 rounded-full transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="text-sm font-semibold bg-sky-500 hover:bg-sky-400 text-white px-5 py-2 rounded-full transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
