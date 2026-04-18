"use client";

import { useEffect } from "react";

const INTERVAL_MS = 60_000;

export function KeepaliveBoot() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    function ping() {
      if (document.visibilityState !== "visible") return;
      fetch("/api/density", { method: "HEAD" }).catch(() => {
        // silent — keepalive is best-effort
      });
    }

    ping();
    const id = setInterval(ping, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return null;
}
