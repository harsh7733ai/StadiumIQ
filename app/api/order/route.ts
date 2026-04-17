import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ message: "Order API — not yet implemented" }, { status: 501 });
}
