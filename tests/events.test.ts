import { describe, it, expect, beforeEach } from "vitest";
import { dispatch, SIMULATE_EVENTS } from "@/lib/mock/events";
import { mockStore } from "@/lib/mock/store";
import { PoisSchema } from "@/lib/schemas/poi";
import rawPois from "@/public/venue/pois.json";

const pois = PoisSchema.parse(rawPois);

describe("match event dispatch", () => {
  beforeEach(() => {
    for (const poi of pois) mockStore.set(poi.id, 0);
  });

  it("exposes every canonical event name", () => {
    expect(SIMULATE_EVENTS).toContain("start_match");
    expect(SIMULATE_EVENTS).toContain("halftime_rush");
    expect(SIMULATE_EVENTS).toContain("goal_celebration");
    expect(SIMULATE_EVENTS).toContain("fourth_quarter_lull");
    expect(SIMULATE_EVENTS).toContain("reset");
  });

  it("every event keeps every POI's density within [0,1]", () => {
    for (const event of SIMULATE_EVENTS) {
      dispatch(event, mockStore, pois);
      for (const poi of pois) {
        const d = mockStore.get(poi.id);
        expect(d).toBeGreaterThanOrEqual(0);
        expect(d).toBeLessThanOrEqual(1);
      }
    }
  });

  it("halftime_rush drives every food POI above 0.8", () => {
    dispatch("halftime_rush", mockStore, pois);
    for (const poi of pois.filter((p) => p.type === "food")) {
      expect(mockStore.get(poi.id)).toBeGreaterThan(0.8);
    }
  });

  it("start_match spikes gate density above 0.8", () => {
    dispatch("start_match", mockStore, pois);
    for (const poi of pois.filter((p) => p.type === "gate")) {
      expect(mockStore.get(poi.id)).toBeGreaterThan(0.8);
    }
  });

  it("reset brings every POI back to a low baseline", () => {
    // Spike first, then reset, to prove reset actually resets.
    dispatch("halftime_rush", mockStore, pois);
    dispatch("reset", mockStore, pois);
    for (const poi of pois) {
      expect(mockStore.get(poi.id)).toBeLessThanOrEqual(0.2);
    }
  });

  it("goal_celebration pushes the beer POI to near-maximum", () => {
    dispatch("goal_celebration", mockStore, pois);
    expect(mockStore.get("food-beer")).toBeGreaterThan(0.95);
  });
});
