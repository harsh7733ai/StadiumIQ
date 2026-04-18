import { mockStore } from "@/lib/mock/store";

const IS_MOCK = process.env.NEXT_PUBLIC_MOCK_MODE === "true";

export type DensityMap = Record<string, number>;
type Listener = (map: DensityMap) => void;

// ─── Mock branch (client-side polling) ────────────────────────────────────────

let pollIntervalId: ReturnType<typeof setInterval> | null = null;
const mockListeners = new Set<Listener>();
let lastKnownMap: DensityMap = {};

async function pollOnce(): Promise<void> {
  try {
    const res = await fetch("/api/density", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as DensityMap;
    lastKnownMap = data;
    mockListeners.forEach((cb) => cb(data));
  } catch {
    // network error during dev — silently skip
  }
}

function subscribeMock(cb: Listener): () => void {
  mockListeners.add(cb);
  // Send last known state immediately so UI isn't blank
  if (Object.keys(lastKnownMap).length > 0) cb(lastKnownMap);

  if (mockListeners.size === 1) {
    pollOnce();
    pollIntervalId = setInterval(pollOnce, 500);
  }

  return () => {
    mockListeners.delete(cb);
    if (mockListeners.size === 0 && pollIntervalId !== null) {
      clearInterval(pollIntervalId);
      pollIntervalId = null;
    }
  };
}

// ─── Public API ────────────────────────────────────────────────────────────────

export function subscribeToDensity(cb: Listener): () => void {
  if (IS_MOCK) return subscribeMock(cb);
  throw new Error("Firestore subscribeToDensity not implemented");
}

export function setDensity(poiId: string, value: number): void {
  if (IS_MOCK) {
    fetch("/api/density", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poiId, value }),
    }).catch(() => {});
    return;
  }
  throw new Error("Firestore setDensity not implemented");
}

export function setManyDensities(updates: DensityMap): void {
  if (IS_MOCK) {
    fetch("/api/density", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    }).catch(() => {});
    return;
  }
  throw new Error("Firestore setManyDensities not implemented");
}

export function getDensitySnapshot(): DensityMap {
  if (IS_MOCK) return mockStore.getAll();
  throw new Error("Firestore getDensitySnapshot not implemented");
}
