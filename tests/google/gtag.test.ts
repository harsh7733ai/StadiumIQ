import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  trackPageView,
  setUserProperty,
  trackGtagEvent,
  conversions,
} from "@/lib/google/gtag";

type GtagMock = ReturnType<typeof vi.fn>;

declare global {
  // eslint-disable-next-line no-var
  var gtag: GtagMock | undefined;
}

function installGtag(): GtagMock {
  const fn = vi.fn();
  (globalThis as unknown as { window: { gtag: GtagMock } }).window = {
    gtag: fn,
  };
  return fn;
}

function clearGtag(): void {
  const w = (globalThis as unknown as { window?: { gtag?: unknown } }).window;
  if (w) {
    delete w.gtag;
  }
}

describe("lib/google/gtag", () => {
  beforeEach(() => {
    clearGtag();
    // Clear env between tests to isolate NEXT_PUBLIC_GA_ID handling.
    delete process.env.NEXT_PUBLIC_GA_ID;
  });

  describe("trackPageView", () => {
    it("is a no-op when gtag is not loaded", () => {
      // Should not throw even without window.gtag.
      expect(() => trackPageView("/test")).not.toThrow();
    });

    it("is a no-op when NEXT_PUBLIC_GA_ID is unset", () => {
      const fn = installGtag();
      trackPageView("/test");
      expect(fn).not.toHaveBeenCalled();
    });

    it("calls gtag('config', ...) when both gtag and GA_ID are present", () => {
      process.env.NEXT_PUBLIC_GA_ID = "G-TEST123";
      const fn = installGtag();
      trackPageView("/order", "Order Page");
      expect(fn).toHaveBeenCalledWith("config", "G-TEST123", {
        page_path: "/order",
        page_title: "Order Page",
      });
    });
  });

  describe("setUserProperty", () => {
    it("forwards the user property to gtag", () => {
      const fn = installGtag();
      setUserProperty("auth_method", "google");
      expect(fn).toHaveBeenCalledWith("set", "user_properties", {
        auth_method: "google",
      });
    });

    it("is a no-op when gtag is not loaded", () => {
      expect(() => setUserProperty("demo_mode", "true")).not.toThrow();
    });
  });

  describe("trackGtagEvent", () => {
    it("emits a GA4 event with typed params", () => {
      const fn = installGtag();
      trackGtagEvent("order_placed", { value: 29.0, items: 2 });
      expect(fn).toHaveBeenCalledWith("event", "order_placed", {
        value: 29.0,
        items: 2,
      });
    });

    it("defaults params to empty object when omitted", () => {
      const fn = installGtag();
      trackGtagEvent("app_open");
      expect(fn).toHaveBeenCalledWith("event", "app_open", {});
    });
  });

  describe("conversions", () => {
    it("orderPlaced converts cents to rupees and includes currency", () => {
      const fn = installGtag();
      conversions.orderPlaced(2900, 3);
      expect(fn).toHaveBeenCalledWith("event", "order_placed", {
        value: 29.0,
        currency: "INR",
        items: 3,
      });
    });

    it("routeDrawn emits poi_id and eta_sec", () => {
      const fn = installGtag();
      conversions.routeDrawn("food-burger", 42);
      expect(fn).toHaveBeenCalledWith("event", "route_drawn", {
        poi_id: "food-burger",
        eta_sec: 42,
      });
    });

    it("conciergeAnswered emits action and latency_ms", () => {
      const fn = installGtag();
      conversions.conciergeAnswered("navigate", 320);
      expect(fn).toHaveBeenCalledWith("event", "concierge_answered", {
        action: "navigate",
        latency_ms: 320,
      });
    });

    it("orderReadyToast emits poi_id and wait_sec", () => {
      const fn = installGtag();
      conversions.orderReadyToast("food-pizza", 180);
      expect(fn).toHaveBeenCalledWith("event", "order_ready_toast", {
        poi_id: "food-pizza",
        wait_sec: 180,
      });
    });
  });
});
