import { NextResponse } from "next/server";
import { PoisSchema } from "@/lib/schemas/poi";
import { ConciergeRequestSchema, ConciergeResponseSchema } from "@/lib/schemas/concierge";
import type { ConciergeResponse } from "@/lib/schemas/concierge";
import { getDensitySnapshot } from "@/lib/data/crowd";
import { buildSystemPrompt } from "@/lib/claude/conciergePrompt";
import { structuredChat } from "@/lib/gemini/client";
import { getGraph, shortestPath } from "@/lib/routing";
import { USER_SEAT_NODE_ID, WALKING_SPEED_SVG_PER_SEC, ROUTING_ETA_ROUND_TO_SEC } from "@/lib/constants";
import { rateLimit, clientKeyFrom } from "@/lib/security/rateLimit";
import rawPois from "@/public/venue/pois.json";

const pois = PoisSchema.parse(rawPois);
const poiIds = new Set(pois.map((p) => p.id));

const CONCIERGE_RATE_LIMIT_MAX = 20;
const CONCIERGE_RATE_LIMIT_WINDOW_MS = 60_000;

const FALLBACK: ConciergeResponse = {
  reply: "I'm having a moment — please ask me again!",
  recommendation: null,
  action: "info",
};

const RATE_LIMITED: ConciergeResponse = {
  reply: "Whoa — you're asking faster than I can think. Give me a few seconds and try again.",
  recommendation: null,
  action: "info",
};

export async function POST(request: Request) {
  const limit = rateLimit(
    `concierge:${clientKeyFrom(request)}`,
    CONCIERGE_RATE_LIMIT_MAX,
    CONCIERGE_RATE_LIMIT_WINDOW_MS,
  );
  if (!limit.ok) {
    return NextResponse.json(RATE_LIMITED, {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil(limit.resetInMs / 1000)),
        "X-RateLimit-Remaining": "0",
      },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(FALLBACK);
  }

  const parsed = ConciergeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(FALLBACK);
  }

  const { messages, userLocation } = parsed.data;

  try {
    const density = getDensitySnapshot();
    const systemPrompt = buildSystemPrompt(pois, density, userLocation);
    const graph = getGraph();

    const raw = await structuredChat<ConciergeResponse>(
      messages,
      ConciergeResponseSchema,
      systemPrompt,
    );

    // Validate poiId exists and enrich walkTimeSec from Dijkstra
    if (raw.recommendation !== null) {
      if (!poiIds.has(raw.recommendation.poiId)) {
        return NextResponse.json({ ...raw, recommendation: null, action: "info" } satisfies ConciergeResponse);
      }

      const targetPoi = pois.find((p) => p.id === raw.recommendation!.poiId);
      if (targetPoi) {
        const route = shortestPath(
          graph,
          USER_SEAT_NODE_ID,
          targetPoi.nodeId,
          density,
          WALKING_SPEED_SVG_PER_SEC,
          ROUTING_ETA_ROUND_TO_SEC,
        );
        if (route) {
          return NextResponse.json({
            ...raw,
            recommendation: { ...raw.recommendation, walkTimeSec: route.etaSec },
          } satisfies ConciergeResponse);
        }
      }
    }

    return NextResponse.json(raw);
  } catch {
    return NextResponse.json(FALLBACK);
  }
}
