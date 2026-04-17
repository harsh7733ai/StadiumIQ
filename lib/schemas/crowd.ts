import { z } from "zod";

export const DensitySchema = z.object({
  poiId: z.string(),
  density: z.number().min(0).max(1),
  timestamp: z.number(), // Unix ms
});
export type Density = z.infer<typeof DensitySchema>;

export const CrowdStateSchema = z.record(z.string(), DensitySchema);
export type CrowdState = z.infer<typeof CrowdStateSchema>;
