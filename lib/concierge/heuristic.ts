import type { Poi } from "@/lib/schemas/poi";
import type { DensityMap } from "@/lib/data/crowd";
import type { ConciergeResponse } from "@/lib/schemas/concierge";
import { estimateWaitSec } from "@/lib/mock/waitTime";

/**
 * Deterministic, no-network fallback for the AI concierge.
 *
 * Used when Gemini is unavailable (quota exhausted, network error, etc.) so
 * the user still gets a useful, crowd-aware recommendation instead of a
 * generic "I'm having a moment" message. Keyword-matches the user query to a
 * POI type, then picks the lowest-density match.
 */
export function heuristicConciergeReply(
  query: string,
  pois: readonly Poi[],
  density: DensityMap,
): ConciergeResponse {
  const q = query.toLowerCase();

  const typeHints: Array<{ keywords: string[]; types: Poi["type"][] }> = [
    { keywords: ["beer", "bar", "drink", "alcohol"], types: ["food"] },
    { keywords: ["coffee", "tea", "espresso"], types: ["food"] },
    { keywords: ["veg", "vegetarian", "vegan", "salad"], types: ["food"] },
    { keywords: ["burger", "pizza", "dessert", "snack", "hungry", "eat", "food"], types: ["food"] },
    { keywords: ["restroom", "toilet", "bathroom", "washroom", "loo"], types: ["restroom"] },
    { keywords: ["merch", "jersey", "scarf", "shop", "store", "souvenir"], types: ["merch"] },
    { keywords: ["medic", "first aid", "hurt", "injury", "nurse"], types: ["firstaid"] },
    { keywords: ["gate", "entry", "entrance", "exit"], types: ["gate"] },
  ];

  const nameBoost: Array<{ keywords: string[]; contains: string }> = [
    { keywords: ["beer", "bar", "drink", "alcohol"], contains: "beer" },
    { keywords: ["coffee", "tea", "espresso"], contains: "coffee" },
    { keywords: ["veg", "vegetarian", "vegan", "salad"], contains: "veg" },
    { keywords: ["pizza"], contains: "pizza" },
    { keywords: ["burger"], contains: "burger" },
    { keywords: ["dessert", "ice cream", "sweet"], contains: "dessert" },
  ];

  const matchedTypes = new Set<Poi["type"]>();
  for (const hint of typeHints) {
    if (hint.keywords.some((k) => q.includes(k))) {
      hint.types.forEach((t) => matchedTypes.add(t));
    }
  }

  const nameFilter = nameBoost.find((n) => n.keywords.some((k) => q.includes(k)))?.contains;

  let candidates = pois.filter((p) => matchedTypes.size === 0 || matchedTypes.has(p.type));
  if (nameFilter) {
    const filtered = candidates.filter((p) => p.name.toLowerCase().includes(nameFilter));
    if (filtered.length > 0) candidates = filtered;
  }

  if (candidates.length === 0) {
    return {
      reply:
        "I couldn't match your question to a specific spot inside the venue. Try asking about food, restrooms, merch, or first aid.",
      recommendation: null,
      action: "info",
    };
  }

  // Pick the lowest-density POI among candidates.
  const best = [...candidates].sort(
    (a, b) => (density[a.id] ?? 0) - (density[b.id] ?? 0),
  )[0]!;

  const bestDensity = density[best.id] ?? 0;
  const waitSec = estimateWaitSec(bestDensity, best.type);
  const waitLabel = waitSec === 0 ? "no wait" : `~${Math.max(1, Math.round(waitSec / 60))} min wait`;
  const isOrderable = best.type === "food";

  return {
    reply: `${best.name} is your best bet right now — ${waitLabel} and ${Math.round(
      bestDensity * 100,
    )}% crowded.`,
    recommendation: {
      poiId: best.id,
      poiName: best.name,
      walkTimeSec: 90,
      currentDensity: bestDensity,
      reason: `Lowest crowd density among matching ${best.type} POIs right now.`,
    },
    action: isOrderable ? "order" : "navigate",
  };
}
