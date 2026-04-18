import { NextResponse } from "next/server";
import {
  getHeadlineKPIs,
  getTopBottlenecks,
  getHourlyWaitSeries,
  getConcessionMix,
} from "@/lib/mock/analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    kpis: getHeadlineKPIs(),
    bottlenecks: getTopBottlenecks(3),
    hourly: getHourlyWaitSeries(),
    mix: getConcessionMix(),
  });
}
