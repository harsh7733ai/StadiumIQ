import { NextResponse } from "next/server";
import { getMatchMinute } from "@/lib/mock/generator";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ matchMinute: getMatchMinute() });
}
