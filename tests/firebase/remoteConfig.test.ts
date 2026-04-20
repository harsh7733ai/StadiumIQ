import { describe, it, expect } from "vitest";
import {
  REMOTE_CONFIG_DEFAULTS,
  getFlag,
  getBoolFlag,
  getIntFlag,
} from "@/lib/firebase/remoteConfig";

// These tests run in node-only (no window). That means `getConfig()`
// always returns null and every helper short-circuits to the baked-in
// defaults — exactly the behavior we want to verify for the demo build.

describe("lib/firebase/remoteConfig — defaults", () => {
  it("has a default for every flag we consult at runtime", () => {
    expect(REMOTE_CONFIG_DEFAULTS.concierge_persona).toBe("helpful_stadium_guide");
    expect(REMOTE_CONFIG_DEFAULTS.concierge_max_messages).toBe("12");
    expect(REMOTE_CONFIG_DEFAULTS.heatmap_poll_ms).toBe("500");
    expect(REMOTE_CONFIG_DEFAULTS.admin_panel_enabled).toBe("true");
    expect(REMOTE_CONFIG_DEFAULTS.demo_profile).toBe("halftime_rush");
    expect(REMOTE_CONFIG_DEFAULTS.enable_group_coordination).toBe("true");
    expect(REMOTE_CONFIG_DEFAULTS.enable_order_push_notifications).toBe("true");
  });

  it("getFlag returns the default string when Remote Config is offline", () => {
    expect(getFlag("concierge_persona")).toBe("helpful_stadium_guide");
    expect(getFlag("demo_profile")).toBe("halftime_rush");
  });

  it("getBoolFlag parses 'true' as true", () => {
    expect(getBoolFlag("admin_panel_enabled")).toBe(true);
    expect(getBoolFlag("enable_group_coordination")).toBe(true);
  });

  it("getIntFlag parses integer defaults and respects fallback", () => {
    expect(getIntFlag("heatmap_poll_ms", 1000)).toBe(500);
    expect(getIntFlag("concierge_max_messages", 5)).toBe(12);
    // Note: a flag containing a non-integer string would hit the
    // fallback. All current defaults parse cleanly, so we just
    // verify the happy path here.
  });
});
