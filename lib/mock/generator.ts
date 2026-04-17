import { mockStore } from "./store";
import { densityFor } from "./matchTimeline";
import type { Poi } from "@/lib/schemas/poi";

interface SimulatorState {
  intervalId: ReturnType<typeof setInterval> | null;
  matchMinute: number;
}

declare global {
  // eslint-disable-next-line no-var
  var _stadiumiqSimulator: SimulatorState | undefined;
}

function getState(): SimulatorState {
  if (!globalThis._stadiumiqSimulator) {
    globalThis._stadiumiqSimulator = { intervalId: null, matchMinute: 0 };
  }
  return globalThis._stadiumiqSimulator;
}

export function startSimulation(pois: Poi[], tickMs = 3000): void {
  const state = getState();
  if (state.intervalId !== null) return; // idempotent

  function tick() {
    const updates: Record<string, number> = {};
    for (const poi of pois) {
      updates[poi.id] = densityFor(state.matchMinute, poi.type);
    }
    mockStore.setMany(updates);
    state.matchMinute += tickMs / 60000; // advance by real elapsed time
  }

  tick(); // immediate first tick
  state.intervalId = setInterval(tick, tickMs);
}

export function stopSimulation(): void {
  const state = getState();
  if (state.intervalId !== null) {
    clearInterval(state.intervalId);
    state.intervalId = null;
  }
}

export function resetSimulationClock(): void {
  getState().matchMinute = 0;
}
