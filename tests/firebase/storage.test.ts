import { describe, it, expect } from "vitest";
import { storageKeys, uploadAsset, getAssetUrl, deleteAsset } from "@/lib/firebase/storage";

describe("lib/firebase/storage — storageKeys", () => {
  it("builds the venue floor-plan key", () => {
    expect(storageKeys.venueFloorPlan("wankhede")).toBe(
      "venues/wankhede/floor-plan.svg",
    );
  });

  it("builds the POI thumbnail key", () => {
    expect(storageKeys.poiThumbnail("wankhede", "food-burger")).toBe(
      "venues/wankhede/pois/food-burger.jpg",
    );
  });

  it("builds the concession menu photo key", () => {
    expect(
      storageKeys.concessionMenuPhoto("wankhede", "food-burger", "classic"),
    ).toBe("venues/wankhede/menus/food-burger/classic.jpg");
  });

  it("builds the receipt key scoped per-user", () => {
    expect(storageKeys.receipt("user_42", "ord_1")).toBe(
      "receipts/user_42/ord_1.pdf",
    );
  });

  it("different users get different receipt paths", () => {
    expect(storageKeys.receipt("a", "x")).not.toBe(storageKeys.receipt("b", "x"));
  });
});

describe("lib/firebase/storage — fail-closed without config", () => {
  // With no NEXT_PUBLIC_FIREBASE_* set, every operation should throw
  // with a clear, actionable error message. This is deliberate — ops
  // needs to know immediately if prod is missing Storage config.

  it("uploadAsset throws when Firebase is not configured", async () => {
    await expect(
      uploadAsset("venues/x/floor-plan.svg", new Uint8Array([1, 2, 3])),
    ).rejects.toThrow(/Firebase Storage is not configured/);
  });

  it("getAssetUrl throws when Firebase is not configured", async () => {
    await expect(getAssetUrl("venues/x/floor-plan.svg")).rejects.toThrow(
      /Firebase Storage is not configured/,
    );
  });

  it("deleteAsset throws when Firebase is not configured", async () => {
    await expect(deleteAsset("venues/x/floor-plan.svg")).rejects.toThrow(
      /Firebase Storage is not configured/,
    );
  });
});
