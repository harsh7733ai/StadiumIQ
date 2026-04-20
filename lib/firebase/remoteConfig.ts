import {
  getRemoteConfig,
  fetchAndActivate,
  getValue,
  type RemoteConfig,
} from "firebase/remote-config";
import { getFirebaseApp } from "./client";
import { hasFirebase } from "@/lib/env";

/**
 * Firebase Remote Config wrapper.
 *
 * Lets the ops team flip feature flags (concierge persona, rate-limit
 * budgets, demo profile) without a redeploy. Each flag has a baked-in
 * default so the app works identically when Remote Config is offline.
 *
 * Client-only. Ten-minute minimum fetch interval at build time; five
 * seconds in development for tight iteration.
 */
let configInstance: RemoteConfig | null = null;

const FETCH_INTERVAL_MS =
  process.env.NODE_ENV === "production" ? 10 * 60_000 : 5_000;

/**
 * Canonical defaults for every flag the app consults. Mirrors the shape
 * that would live in the Firebase console under Parameters.
 */
export const REMOTE_CONFIG_DEFAULTS = {
  concierge_persona: "helpful_stadium_guide",
  concierge_max_messages: "12",
  heatmap_poll_ms: "500",
  admin_panel_enabled: "true",
  demo_profile: "halftime_rush",
  enable_group_coordination: "true",
  enable_order_push_notifications: "true",
} as const;

export type RemoteConfigKey = keyof typeof REMOTE_CONFIG_DEFAULTS;

function getConfig(): RemoteConfig | null {
  if (typeof window === "undefined") return null;
  if (!hasFirebase) return null;
  if (configInstance) return configInstance;

  try {
    const rc = getRemoteConfig(getFirebaseApp());
    rc.settings.minimumFetchIntervalMillis = FETCH_INTERVAL_MS;
    rc.defaultConfig = REMOTE_CONFIG_DEFAULTS as unknown as Record<string, string>;
    configInstance = rc;
    return configInstance;
  } catch {
    return null;
  }
}

/**
 * Fetch + activate the latest config from the server. Safe to call on
 * every mount — the SDK respects `minimumFetchIntervalMillis`.
 */
export async function refreshRemoteConfig(): Promise<boolean> {
  const rc = getConfig();
  if (!rc) return false;
  try {
    return await fetchAndActivate(rc);
  } catch {
    return false;
  }
}

/** Read a flag value. Falls back to the baked-in default. */
export function getFlag(key: RemoteConfigKey): string {
  const rc = getConfig();
  if (!rc) return REMOTE_CONFIG_DEFAULTS[key];
  try {
    const v = getValue(rc, key).asString();
    return v.length > 0 ? v : REMOTE_CONFIG_DEFAULTS[key];
  } catch {
    return REMOTE_CONFIG_DEFAULTS[key];
  }
}

/** Typed boolean flag lookup. */
export function getBoolFlag(key: RemoteConfigKey): boolean {
  return getFlag(key) === "true";
}

/** Typed integer flag lookup with a fallback. */
export function getIntFlag(key: RemoteConfigKey, fallback: number): number {
  const v = parseInt(getFlag(key), 10);
  return Number.isFinite(v) ? v : fallback;
}
