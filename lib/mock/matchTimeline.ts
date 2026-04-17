import type { PoiType } from "@/lib/schemas/poi";

// Deterministic jitter: seeded by minute so values look alive, not stepped
function jitter(minute: number, seed: number): number {
  const x = Math.sin(minute * 127.1 + seed * 311.7) * 43758.5453;
  return (x - Math.floor(x)) * 0.08 - 0.04; // ±0.04 range
}

export function densityFor(matchMinute: number, poiType: PoiType): number {
  const m = matchMinute;

  switch (poiType) {
    case "gate": {
      // Pre-game rush: minutes -15 to 0
      if (m >= -15 && m <= 0) return Math.min(1, 0.9 + jitter(m, 1));
      // Post-game exit: minutes 90 to 110
      if (m >= 90 && m <= 110) return Math.min(1, 0.92 + jitter(m, 2));
      // Halftime trickle
      if (m >= 44 && m <= 52) return Math.min(1, 0.3 + jitter(m, 3));
      return Math.max(0, 0.1 + jitter(m, 4));
    }

    case "food": {
      // Halftime spike: 45-50 mins
      if (m >= 44 && m <= 52) return Math.min(1, 0.85 + jitter(m, 5));
      // Late-game hunger: 75+ mins
      if (m >= 75) return Math.min(1, 0.55 + (m - 75) * 0.006 + jitter(m, 6));
      return Math.max(0, 0.3 + jitter(m, 7));
    }

    case "restroom": {
      // Lags food by ~5 min, capped at 0.75
      const foodLag = m - 5;
      if (foodLag >= 44 && foodLag <= 52) return Math.min(0.75, 0.72 + jitter(m, 8));
      if (foodLag >= 75) return Math.min(0.75, 0.45 + (foodLag - 75) * 0.005 + jitter(m, 9));
      return Math.max(0, 0.25 + jitter(m, 10));
    }

    case "merch": {
      return Math.max(0, Math.min(1, 0.4 + jitter(m, 11)));
    }

    case "firstaid": {
      return Math.max(0, 0.1 + jitter(m, 12) * 0.5);
    }
  }
}
