import { NextResponse } from "next/server";
import { orderStore } from "@/lib/mock/orderStore";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const order = orderStore.advance(params.id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  return NextResponse.json(order);
}
