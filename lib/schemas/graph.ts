import { z } from "zod";

export const GraphNodeSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
});

export const GraphEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  weight: z.number().positive(),
});

export const VenueGraphSchema = z.object({
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
});

export type GraphNode = z.infer<typeof GraphNodeSchema>;
export type GraphEdge = z.infer<typeof GraphEdgeSchema>;
export type VenueGraph = z.infer<typeof VenueGraphSchema>;
