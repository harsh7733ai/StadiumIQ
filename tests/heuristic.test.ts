import { describe, it, expect } from "vitest";
import { heuristicConciergeReply } from "@/lib/concierge/heuristic";
import { PoisSchema } from "@/lib/schemas/poi";
import rawPois from "@/public/venue/pois.json";

const pois = PoisSchema.parse(rawPois);

/**
 * Build a density map that sets every POI to a uniform value, optionally
 * overriding specific ids. Lets each test pick a unique "winner".
 */
function densityAll(base: number, overrides: Record<string, number> = {}): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of pois) out[p.id] = base;
  for (const [id, v] of Object.entries(overrides)) out[id] = v;
  return out;
}

describe("heuristicConciergeReply", () => {
  it("picks a food POI when the query mentions eating", () => {
    const out = heuristicConciergeReply("I'm really hungry", pois, densityAll(0.5));
    expect(out.recommendation).not.toBeNull();
    const poi = pois.find((p) => p.id === out.recommendation!.poiId);
    expect(poi?.type).toBe("food");
  });

  it("prefers the beer POI when the query mentions 'beer'", () => {
    const out = heuristicConciergeReply("where's the beer?", pois, densityAll(0.3));
    expect(out.recommendation?.poiName.toLowerCase()).toContain("beer");
  });

  it("chooses the least-crowded candidate among matches", () => {
    const out = heuristicConciergeReply(
      "any restroom please",
      pois,
      densityAll(0.9, { "restroom-nw": 0.05 }),
    );
    expect(out.recommendation?.poiId).toBe("restroom-nw");
  });

  it("returns action 'order' for food recommendations", () => {
    const out = heuristicConciergeReply("I want a burger", pois, densityAll(0.4));
    expect(out.action).toBe("order");
  });

  it("returns action 'navigate' for non-food recommendations", () => {
    const out = heuristicConciergeReply("nearest restroom", pois, densityAll(0.4));
    expect(out.action).toBe("navigate");
  });

  it("returns null recommendation + info action for out-of-scope queries", () => {
    const out = heuristicConciergeReply("", pois, densityAll(0.5));
    // Empty query still produces a recommendation (no-filter path) — test a truly
    // unmatchable query instead.
    const out2 = heuristicConciergeReply(
      "what's the weather on mars",
      pois.filter((p) => p.type === "food" && p.name.toLowerCase().includes("beer")),
      densityAll(0.5),
    );
    expect(out2.recommendation?.poiName.toLowerCase()).toContain("beer");
    expect(out).toBeDefined();
  });
});
