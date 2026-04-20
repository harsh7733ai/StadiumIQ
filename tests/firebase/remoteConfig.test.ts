import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Enhanced tests for lib/firebase/remoteConfig.ts
 *
 * Firebase Remote Config drives runtime feature flags for StadiumIQ:
 * - Concierge persona & message budget
 * - Heatmap poll frequency
 * - Admin panel visibility  
 * - Group coordination toggle
 * - Push notification toggle
 *
 * All helpers fall back to baked-in defaults when Remote Config is
 * offline (SSR, Firebase unconfigured, network timeout) so the app
 * remains functional in any environment.
 */

// Run in `node` environment — `window` is undefined → getConfig() → null.

import {
  REMOTE_CONFIG_DEFAULTS,
  getFlag,
  getBoolFlag,
  getIntFlag,
  refreshRemoteConfig,
  type RemoteConfigKey,
} from "@/lib/firebase/remoteConfig";

// ── REMOTE_CONFIG_DEFAULTS shape ──────────────────────────────────────────────

describe("lib/firebase/remoteConfig — REMOTE_CONFIG_DEFAULTS", () => {
  it("contains all 7 required keys", () => {
    const keys: RemoteConfigKey[] = [
      "concierge_persona",
      "concierge_max_messages",
      "heatmap_poll_ms",
      "admin_panel_enabled",
      "demo_profile",
      "enable_group_coordination",
      "enable_order_push_notifications",
    ];
    for (const key of keys) {
      expect(REMOTE_CONFIG_DEFAULTS).toHaveProperty(key);
    }
  });

  it("all default values are strings", () => {
    for (const [, v] of Object.entries(REMOTE_CONFIG_DEFAULTS)) {
      expect(typeof v).toBe("string");
    }
  });

  it("concierge_persona default is the expected guide persona", () => {
    expect(REMOTE_CONFIG_DEFAULTS.concierge_persona).toBe("helpful_stadium_guide");
  });

  it("concierge_max_messages default is '12'", () => {
    expect(REMOTE_CONFIG_DEFAULTS.concierge_max_messages).toBe("12");
  });

  it("heatmap_poll_ms default is '500'", () => {
    expect(REMOTE_CONFIG_DEFAULTS.heatmap_poll_ms).toBe("500");
  });

  it("admin_panel_enabled default is 'true'", () => {
    expect(REMOTE_CONFIG_DEFAULTS.admin_panel_enabled).toBe("true");
  });

  it("demo_profile default is 'halftime_rush'", () => {
    expect(REMOTE_CONFIG_DEFAULTS.demo_profile).toBe("halftime_rush");
  });

  it("enable_group_coordination default is 'true'", () => {
    expect(REMOTE_CONFIG_DEFAULTS.enable_group_coordination).toBe("true");
  });

  it("enable_order_push_notifications default is 'true'", () => {
    expect(REMOTE_CONFIG_DEFAULTS.enable_order_push_notifications).toBe("true");
  });
});

// ── getFlag ────────────────────────────────────────────────────────────────────

describe("lib/firebase/remoteConfig — getFlag (node/SSR fallback)", () => {
  it("returns the default for concierge_persona", () => {
    expect(getFlag("concierge_persona")).toBe("helpful_stadium_guide");
  });

  it("returns the default for demo_profile", () => {
    expect(getFlag("demo_profile")).toBe("halftime_rush");
  });

  it("returns the default for heatmap_poll_ms", () => {
    expect(getFlag("heatmap_poll_ms")).toBe("500");
  });

  it("returns the default for admin_panel_enabled", () => {
    expect(getFlag("admin_panel_enabled")).toBe("true");
  });

  it("returns the default for concierge_max_messages", () => {
    expect(getFlag("concierge_max_messages")).toBe("12");
  });

  it("returns the default for enable_group_coordination", () => {
    expect(getFlag("enable_group_coordination")).toBe("true");
  });

  it("returns the default for enable_order_push_notifications", () => {
    expect(getFlag("enable_order_push_notifications")).toBe("true");
  });

  it("every flag returns a non-empty string", () => {
    const keys = Object.keys(REMOTE_CONFIG_DEFAULTS) as RemoteConfigKey[];
    for (const key of keys) {
      const value = getFlag(key);
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    }
  });
});

// ── getBoolFlag ────────────────────────────────────────────────────────────────

describe("lib/firebase/remoteConfig — getBoolFlag", () => {
  it("returns true for admin_panel_enabled (default 'true')", () => {
    expect(getBoolFlag("admin_panel_enabled")).toBe(true);
  });

  it("returns true for enable_group_coordination", () => {
    expect(getBoolFlag("enable_group_coordination")).toBe(true);
  });

  it("returns true for enable_order_push_notifications", () => {
    expect(getBoolFlag("enable_order_push_notifications")).toBe(true);
  });

  it("returns false for flags whose defaults are not 'true'", () => {
    // concierge_persona = "helpful_stadium_guide" → not "true" → false
    expect(getBoolFlag("concierge_persona")).toBe(false);
    // demo_profile = "halftime_rush" → not "true" → false
    expect(getBoolFlag("demo_profile")).toBe(false);
  });

  it("always returns a boolean", () => {
    const keys = Object.keys(REMOTE_CONFIG_DEFAULTS) as RemoteConfigKey[];
    for (const key of keys) {
      expect(typeof getBoolFlag(key)).toBe("boolean");
    }
  });
});

// ── getIntFlag ─────────────────────────────────────────────────────────────────

describe("lib/firebase/remoteConfig — getIntFlag", () => {
  it("parses heatmap_poll_ms as 500", () => {
    expect(getIntFlag("heatmap_poll_ms", 1000)).toBe(500);
  });

  it("parses concierge_max_messages as 12", () => {
    expect(getIntFlag("concierge_max_messages", 5)).toBe(12);
  });

  it("returns the fallback when the flag is not a valid integer", () => {
    // "helpful_stadium_guide" → parseInt → NaN → fallback
    expect(getIntFlag("concierge_persona", 99)).toBe(99);
  });

  it("returns the fallback for 'halftime_rush' (non-numeric)", () => {
    expect(getIntFlag("demo_profile", 0)).toBe(0);
  });

  it("always returns a finite number", () => {
    const keys = Object.keys(REMOTE_CONFIG_DEFAULTS) as RemoteConfigKey[];
    for (const key of keys) {
      const val = getIntFlag(key, 42);
      expect(Number.isFinite(val)).toBe(true);
    }
  });

  it("returns a positive number for poll and message count defaults", () => {
    expect(getIntFlag("heatmap_poll_ms", 0)).toBeGreaterThan(0);
    expect(getIntFlag("concierge_max_messages", 0)).toBeGreaterThan(0);
  });
});

// ── refreshRemoteConfig ────────────────────────────────────────────────────────

describe("lib/firebase/remoteConfig — refreshRemoteConfig", () => {
  it("returns false in SSR/node environment (window is undefined)", async () => {
    const result = await refreshRemoteConfig();
    expect(result).toBe(false);
  });

  it("never throws in SSR environment", async () => {
    await expect(refreshRemoteConfig()).resolves.not.toThrow();
  });

  it("always returns a boolean", async () => {
    const result = await refreshRemoteConfig();
    expect(typeof result).toBe("boolean");
  });
});
