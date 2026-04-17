import { NextResponse } from "next/server";
import { z } from "zod";
import { mockStore } from "@/lib/mock/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(mockStore.getAll());
}

const PatchBodySchema = z.union([
  z.object({ poiId: z.string(), value: z.number().min(0).max(1) }),
  z.object({ updates: z.record(z.string(), z.number().min(0).max(1)) }),
]);

export async function PATCH(request: Request) {
  const body: unknown = await request.json();
  const parsed = PatchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if ("poiId" in parsed.data) {
    mockStore.set(parsed.data.poiId, parsed.data.value);
  } else {
    mockStore.setMany(parsed.data.updates);
  }

  return NextResponse.json({ ok: true });
}
