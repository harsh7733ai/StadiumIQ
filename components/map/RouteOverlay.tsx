"use client";

import { motion } from "framer-motion";
import type { VenueGraph } from "@/lib/schemas/graph";

interface Props {
  path: string[];
  graph: VenueGraph;
}

export function RouteOverlay({ path, graph }: Props) {
  if (path.length < 2) return null;

  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  const points = path
    .map((id) => nodeMap.get(id))
    .filter(Boolean)
    .map((n) => `${n!.x},${n!.y}`)
    .join(" ");

  return (
    <motion.polyline
      points={points}
      fill="none"
      stroke="#38bdf8"
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="12 6"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    />
  );
}
