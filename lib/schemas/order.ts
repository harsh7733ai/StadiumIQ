import { z } from "zod";

export const ORDER_STATES = ["placed", "preparing", "ready", "collected"] as const;

export const OrderStateSchema = z.enum(ORDER_STATES);
export type OrderState = z.infer<typeof OrderStateSchema>;

export const OrderItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  priceCents: z.number().int().positive(),
  qty: z.number().int().positive(),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  poiId: z.string(),
  poiName: z.string(),
  items: z.array(OrderItemSchema),
  totalCents: z.number().int().nonnegative(),
  pickupCode: z.string().length(4),
  state: OrderStateSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type Order = z.infer<typeof OrderSchema>;

// ── API request schemas ──────────────────────────────────────────────────────

export const PlaceOrderRequestSchema = z.object({
  poiId: z.string(),
  items: z.array(OrderItemSchema).min(1),
});
export type PlaceOrderRequest = z.infer<typeof PlaceOrderRequestSchema>;

export const AdvanceOrderRequestSchema = z.object({
  id: z.string(),
});
export type AdvanceOrderRequest = z.infer<typeof AdvanceOrderRequestSchema>;

// ── API response schemas ─────────────────────────────────────────────────────

export const OrderResponseSchema = OrderSchema;
export type OrderResponse = Order;

export const OrderListResponseSchema = z.array(OrderSchema);
export type OrderListResponse = Order[];
