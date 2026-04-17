type DensityMap = Record<string, number>;
type Listener = (map: DensityMap) => void;

export interface MockStore {
  getAll(): DensityMap;
  get(poiId: string): number;
  set(poiId: string, value: number): void;
  setMany(updates: DensityMap): void;
  subscribe(listener: Listener): () => void;
}

function createStore(): MockStore {
  const data: DensityMap = {};
  const listeners = new Set<Listener>();

  function notify() {
    const snapshot = { ...data };
    listeners.forEach((l) => l(snapshot));
  }

  return {
    getAll() {
      return { ...data };
    },
    get(poiId) {
      return data[poiId] ?? 0;
    },
    set(poiId, value) {
      data[poiId] = Math.min(1, Math.max(0, value));
      notify();
    },
    setMany(updates) {
      for (const [id, val] of Object.entries(updates)) {
        data[id] = Math.min(1, Math.max(0, val));
      }
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// Survive HMR in Next.js dev mode by anchoring to globalThis
declare global {
  // eslint-disable-next-line no-var
  var _stadiumiqMockStore: MockStore | undefined;
}

export const mockStore: MockStore =
  globalThis._stadiumiqMockStore ??
  (globalThis._stadiumiqMockStore = createStore());
