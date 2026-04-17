import { z } from "zod";

export const ORDER_STATES = ["placed", "preparing", "ready", "collected"] as const;

export const OrderStateSchema = z.enum(ORDER_STATES);
export type OrderState = z.infer<typeof OrderStateSchema>;

export const OrderItemSchema = z.object({
  menuItemId: z.string(),
  name: z.string(),
  quantity: z.number().int().positive(),
  priceGbp: z.number().positive(),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderSchema = z.object({
  id: z.string(),
  poiId: z.string(),
  userId: z.string(),
  items: z.array(OrderItemSchema),
  state: OrderStateSchema,
  pickupCode: z.string().length(4),
  totalGbp: z.number().positive(),
  createdAt: z.number(), // Unix ms
  updatedAt: z.number(),
});
export type Order = z.infer<typeof OrderSchema>;

export const PlaceOrderInputSchema = z.object({
  poiId: z.string(),
  items: z.array(OrderItemSchema),
});
export type PlaceOrderInput = z.infer<typeof PlaceOrderInputSchema>;
