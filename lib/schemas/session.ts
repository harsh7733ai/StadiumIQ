import { z } from "zod";

export const MemberPinSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  poiId: z.string().nullable(),
  coords: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .nullable(),
  updatedAt: z.number(), // Unix ms
});
export type MemberPin = z.infer<typeof MemberPinSchema>;

export const GroupSessionSchema = z.object({
  code: z.string().length(6),
  createdBy: z.string(),
  members: z.array(MemberPinSchema),
  createdAt: z.number(),
});
export type GroupSession = z.infer<typeof GroupSessionSchema>;

export const JoinSessionInputSchema = z.object({
  code: z.string().length(6),
  userId: z.string(),
  displayName: z.string(),
});
export type JoinSessionInput = z.infer<typeof JoinSessionInputSchema>;
