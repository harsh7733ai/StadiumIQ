"use client";

import { motion } from "framer-motion";
import type { VenueGraph } from "@/lib/schemas/graph";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface Props {
  path: string[];
  graph: VenueGraph;
}

export function RouteOverlay({ path, graph }: Props) {
  const prefersReducedMotion = useReducedMotion();

  if (path.length < 2) return null;

  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  const points = path
    .map((id) => nodeMap.get(id))
    .filter(Boolean)
    .map((n) => `${n!.x},${n!.y}`)
    .join(" ");

  return (
    <motion.polyline
      role="img"
      aria-label={`Suggested route with ${path.length - 1} segments avoiding crowded areas`}
      points={points}
      fill="none"
      stroke="#38bdf8"
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="12 6"
      initial={prefersReducedMotion ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: "easeOut" }}
    />
  );
}
