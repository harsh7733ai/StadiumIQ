import { NextResponse } from "next/server";
import { orderStore } from "@/lib/mock/orderStore";
import { PlaceOrderRequestSchema } from "@/lib/schemas/order";
import type { Order } from "@/lib/schemas/order";
import { PoisSchema } from "@/lib/schemas/poi";
import { generatePickupCode } from "@/lib/util/pickupCode";
import rawPois from "@/public/venue/pois.json";

const pois = PoisSchema.parse(rawPois);
const poiMap = new Map(pois.map((p) => [p.id, p]));

export async function POST(request: Request) {
  const userId = request.headers.get("X-User-Id");
  if (!userId) {
    return NextResponse.json({ error: "Missing X-User-Id header" }, { status: 400 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = PlaceOrderRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { poiId, items } = parsed.data;
  const poi = poiMap.get(poiId);
  if (!poi) {
    return NextResponse.json({ error: `Unknown POI: ${poiId}` }, { status: 400 });
  }

  const totalCents = items.reduce((sum, item) => sum + item.priceCents * item.qty, 0);
  const pickupCode = generatePickupCode(orderStore.getActiveCodes());

  const order: Order = {
    id: crypto.randomUUID(),
    userId,
    poiId,
    poiName: poi.name,
    items,
    totalCents,
    pickupCode,
    state: "placed",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  orderStore.create(order);
  return NextResponse.json(order);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const all = searchParams.get("all");

  let orders;
  if (all === "true") {
    orders = orderStore.getAll();
  } else if (userId) {
    orders = orderStore.getByUserId(userId);
  } else {
    return NextResponse.json({ error: "Provide ?userId= or ?all=true" }, { status: 400 });
  }

  const sorted = [...orders].sort((a, b) => b.createdAt - a.createdAt);
  return NextResponse.json(sorted);
}
