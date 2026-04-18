import { z } from "zod";

export const ConciergeMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});
export type ConciergeMessage = z.infer<typeof ConciergeMessageSchema>;

export const ConciergeRequestSchema = z.object({
  messages: z.array(ConciergeMessageSchema).min(1),
  userLocation: z.object({ nodeId: z.string() }),
});
export type ConciergeRequest = z.infer<typeof ConciergeRequestSchema>;

export const ConciergeRecommendationSchema = z.object({
  poiId: z.string(),
  poiName: z.string(),
  walkTimeSec: z.number().nonnegative(),
  currentDensity: z.number().min(0).max(1),
  reason: z.string(),
});
export type ConciergeRecommendation = z.infer<typeof ConciergeRecommendationSchema>;

export const ConciergeActionSchema = z.enum(["navigate", "order", "info"]);
export type ConciergeAction = z.infer<typeof ConciergeActionSchema>;

export const ConciergeResponseSchema = z.object({
  reply: z.string(),
  recommendation: ConciergeRecommendationSchema.nullable(),
  action: ConciergeActionSchema,
});
export type ConciergeResponse = z.infer<typeof ConciergeResponseSchema>;
