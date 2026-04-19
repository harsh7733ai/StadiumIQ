import { describe, it, expect } from "vitest";
import { getMenuForPoi } from "@/lib/mock/menus";
import { PoisSchema } from "@/lib/schemas/poi";
import rawPois from "@/public/venue/pois.json";

const pois = PoisSchema.parse(rawPois);
const foodPois = pois.filter((p) => p.type === "food");

describe("getMenuForPoi", () => {
  it("returns at least one item for every food POI", () => {
    for (const poi of foodPois) {
      const menu = getMenuForPoi(poi.id);
      expect(menu.length).toBeGreaterThan(0);
    }
  });

  it("returns menu items with strictly positive integer prices", () => {
    for (const poi of foodPois) {
      for (const item of getMenuForPoi(poi.id)) {
        expect(Number.isInteger(item.priceCents)).toBe(true);
        expect(item.priceCents).toBeGreaterThan(0);
      }
    }
  });

  it("returns an empty list for unknown POI ids", () => {
    expect(getMenuForPoi("does-not-exist")).toEqual([]);
  });

  it("returns items with stable, non-empty ids and names", () => {
    for (const poi of foodPois) {
      for (const item of getMenuForPoi(poi.id)) {
        expect(item.id).toMatch(/\S/);
        expect(item.name).toMatch(/\S/);
      }
    }
  });
});
