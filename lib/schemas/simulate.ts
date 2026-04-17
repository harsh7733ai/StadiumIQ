import { z } from "zod";
import { SIMULATE_EVENTS } from "@/lib/mock/events";

export const SimulateEventSchema = z.enum(SIMULATE_EVENTS);

export const SimulateRequestSchema = z.object({
  event: SimulateEventSchema,
});
export type SimulateRequest = z.infer<typeof SimulateRequestSchema>;

export const SimulateResponseSchema = z.object({
  ok: z.boolean(),
});
export type SimulateResponse = z.infer<typeof SimulateResponseSchema>;
