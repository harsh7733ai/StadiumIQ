import type { VenueGraph } from "@/lib/schemas/graph";
import type { DensityMap } from "@/lib/data/crowd";
import { CROWD_PENALTY_MAX } from "@/lib/constants";

export interface RouteResult {
  path: string[];
  totalWeight: number;
  etaSec: number;
}

type AdjMap = Map<string, Array<{ to: string; baseWeight: number; nearPoiId?: string }>>;

function buildAdj(graph: VenueGraph): AdjMap {
  const adj: AdjMap = new Map();
  for (const node of graph.nodes) {
    adj.set(node.id, []);
  }
  for (const edge of graph.edges) {
    adj.get(edge.from)?.push({ to: edge.to, baseWeight: edge.weight });
    adj.get(edge.to)?.push({ to: edge.from, baseWeight: edge.weight });
  }
  return adj;
}

function edgeWeight(
  baseWeight: number,
  fromId: string,
  toId: string,
  density: DensityMap,
): number {
  const d = Math.max(density[fromId] ?? 0, density[toId] ?? 0);
  return baseWeight * (1 + CROWD_PENALTY_MAX * d);
}

export function shortestPath(
  graph: VenueGraph,
  from: string,
  to: string,
  density: DensityMap,
  walkingSpeedSvgPerSec: number,
  etaRoundToSec: number,
): RouteResult | null {
  const adj = buildAdj(graph);

  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const visited = new Set<string>();

  for (const node of graph.nodes) {
    dist.set(node.id, Infinity);
    prev.set(node.id, null);
  }
  dist.set(from, 0);

  // Simple min-heap via sorted array — graph is small (~40 nodes)
  const queue: Array<{ id: string; d: number }> = [{ id: from, d: 0 }];

  while (queue.length > 0) {
    queue.sort((a, b) => a.d - b.d);
    const { id: u } = queue.shift()!;

    if (visited.has(u)) continue;
    visited.add(u);

    if (u === to) break;

    const neighbors = adj.get(u) ?? [];
    for (const { to: v, baseWeight } of neighbors) {
      if (visited.has(v)) continue;
      const w = edgeWeight(baseWeight, u, v, density);
      const alt = (dist.get(u) ?? Infinity) + w;
      if (alt < (dist.get(v) ?? Infinity)) {
        dist.set(v, alt);
        prev.set(v, u);
        queue.push({ id: v, d: alt });
      }
    }
  }

  if (!isFinite(dist.get(to) ?? Infinity)) return null;

  const path: string[] = [];
  let cur: string | null = to;
  while (cur !== null) {
    path.unshift(cur);
    cur = prev.get(cur) ?? null;
  }

  const totalWeight = dist.get(to) ?? 0;
  const rawSec = totalWeight / walkingSpeedSvgPerSec;
  const etaSec = Math.max(
    etaRoundToSec,
    Math.round(rawSec / etaRoundToSec) * etaRoundToSec,
  );

  return { path, totalWeight, etaSec };
}
