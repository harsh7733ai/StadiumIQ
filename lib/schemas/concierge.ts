import { z } from "zod";

export const ConciergeActionSchema = z.enum(["navigate", "order", "info"]);
export type ConciergeAction = z.infer<typeof ConciergeActionSchema>;

export const ConciergeResponseSchema = z.object({
  poiId: z.string(),
  reasoning: z.string(),
  walkTimeSec: z.number().nonnegative(),
  action: ConciergeActionSchema,
});
export type ConciergeResponse = z.infer<typeof ConciergeResponseSchema>;

export const ConciergeRequestSchema = z.object({
  query: z.string().min(1).max(500),
  userLocation: z
    .object({
      poiId: z.string().nullable(),
      coords: z.object({ x: z.number(), y: z.number() }).nullable(),
    })
    .optional(),
});
export type ConciergeRequest = z.infer<typeof ConciergeRequestSchema>;
