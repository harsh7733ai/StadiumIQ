export { shortestPath } from "./dijkstra";
export type { RouteResult } from "./dijkstra";

import rawGraph from "@/public/venue/graph.json";
import { VenueGraphSchema } from "@/lib/schemas/graph";
import type { VenueGraph } from "@/lib/schemas/graph";

let _graph: VenueGraph | null = null;

export function getGraph(): VenueGraph {
  if (!_graph) {
    _graph = VenueGraphSchema.parse(rawGraph);
  }
  return _graph;
}
