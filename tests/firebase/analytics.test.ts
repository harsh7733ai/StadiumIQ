import { describe, it, expect } from "vitest";
import { trackEvent } from "@/lib/firebase/analytics";

describe("lib/firebase/analytics", () => {
  it("trackEvent is a no-op without window and does not throw", async () => {
    // Node-mode tests run without a DOM, and `hasFirebase` is false in
    // test env (no NEXT_PUBLIC_FIREBASE_*). The wrapper must swallow
    // every failure path silently.
    await expect(trackEvent("app_open", { anonymous: true })).resolves.toBeUndefined();
  });

  it("trackEvent accepts an empty params object", async () => {
    await expect(trackEvent("heartbeat")).resolves.toBeUndefined();
  });

  it("trackEvent accepts numeric and boolean params", async () => {
    await expect(
      trackEvent("order_placed", {
        value: 29.0,
        items: 3,
        redeemed: false,
      }),
    ).resolves.toBeUndefined();
  });
});
