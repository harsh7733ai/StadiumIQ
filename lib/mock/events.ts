import type { MockStore } from "./store";
import type { Poi } from "@/lib/schemas/poi";

export type { MockStore };

export const SIMULATE_EVENTS = [
  "start_match",
  "halftime_rush",
  "goal_celebration",
  "fourth_quarter_lull",
  "reset",
] as const;

export type SimulateEvent = (typeof SIMULATE_EVENTS)[number];

export function dispatch(
  event: SimulateEvent,
  store: MockStore,
  pois: Poi[]
): void {
  switch (event) {
    case "start_match": {
      const updates: Record<string, number> = {};
      for (const poi of pois) {
        updates[poi.id] = poi.type === "gate" ? 0.85 : 0.2;
      }
      store.setMany(updates);
      break;
    }

    case "halftime_rush": {
      const updates: Record<string, number> = {};
      for (const poi of pois) {
        if (poi.type === "food") updates[poi.id] = 0.95;
        else if (poi.type === "restroom") updates[poi.id] = 0.8;
        else if (poi.type === "gate") updates[poi.id] = 0.25;
        else updates[poi.id] = 0.35;
      }
      store.setMany(updates);
      break;
    }

    case "goal_celebration": {
      const updates: Record<string, number> = {};
      for (const poi of pois) {
        if (poi.id === "food-beer") updates[poi.id] = 0.99;
        else if (poi.type === "food") updates[poi.id] = 0.75;
        else if (poi.type === "merch") updates[poi.id] = 0.7;
        else updates[poi.id] = store.get(poi.id);
      }
      store.setMany(updates);
      break;
    }

    case "fourth_quarter_lull": {
      const updates: Record<string, number> = {};
      for (const poi of pois) {
        if (poi.type === "food") updates[poi.id] = 0.2;
        else if (poi.type === "gate") updates[poi.id] = 0.6;
        else updates[poi.id] = store.get(poi.id) * 0.7;
      }
      store.setMany(updates);
      break;
    }

    case "reset": {
      const updates: Record<string, number> = {};
      for (const poi of pois) {
        updates[poi.id] = 0.1;
      }
      store.setMany(updates);
      break;
    }
  }
}
