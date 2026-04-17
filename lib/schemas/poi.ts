import { z } from "zod";

export const POI_TYPES = ["gate", "food", "restroom", "merch", "firstaid"] as const;

export const PoiTypeSchema = z.enum(POI_TYPES);
export type PoiType = z.infer<typeof PoiTypeSchema>;

export const CoordsSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export type Coords = z.infer<typeof CoordsSchema>;

export const PoiSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: PoiTypeSchema,
  coords: CoordsSchema,
  nodeId: z.string(),
  description: z.string().optional(),
});
export type Poi = z.infer<typeof PoiSchema>;

export const PoisSchema = z.array(PoiSchema);
export type Pois = z.infer<typeof PoisSchema>;
