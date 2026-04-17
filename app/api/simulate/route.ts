import { NextResponse } from "next/server";
import { mockStore } from "@/lib/mock/store";
import { dispatch } from "@/lib/mock/events";
import { SimulateRequestSchema } from "@/lib/schemas/simulate";
import pois from "@/public/venue/pois.json";
import { PoisSchema } from "@/lib/schemas/poi";

const validatedPois = PoisSchema.parse(pois);

export async function POST(request: Request) {
  const body: unknown = await request.json();
  const parsed = SimulateRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid event", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  dispatch(parsed.data.event, mockStore, validatedPois);
  return NextResponse.json({ ok: true });
}
