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
import { heuristicConciergeReply } from "@/lib/concierge/heuristic";
import rawPois from "@/public/venue/pois.json";

const pois = PoisSchema.parse(rawPois);
const poiIds = new Set(pois.map((p) => p.id));

const CONCIERGE_RATE_LIMIT_MAX = 20;
const CONCIERGE_RATE_LIMIT_WINDOW_MS = 60_000;

const FALLBACK: ConciergeResponse = {
  reply: "I couldn't read that question — can you rephrase?",
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
  const density = getDensitySnapshot();
  const graph = getGraph();

  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  function enrichWalkTime(raw: ConciergeResponse): ConciergeResponse {
    if (raw.recommendation === null) return raw;
    if (!poiIds.has(raw.recommendation.poiId)) {
      return { ...raw, recommendation: null, action: "info" };
    }
    const targetPoi = pois.find((p) => p.id === raw.recommendation!.poiId);
    if (!targetPoi) return raw;
    const route = shortestPath(
      graph,
      USER_SEAT_NODE_ID,
      targetPoi.nodeId,
      density,
      WALKING_SPEED_SVG_PER_SEC,
      ROUTING_ETA_ROUND_TO_SEC,
    );
    if (!route) return raw;
    return {
      ...raw,
      recommendation: { ...raw.recommendation, walkTimeSec: route.etaSec },
    };
  }

  try {
    const systemPrompt = buildSystemPrompt(pois, density, userLocation);
    const raw = await structuredChat<ConciergeResponse>(
      messages,
      ConciergeResponseSchema,
      systemPrompt,
    );
    return NextResponse.json(enrichWalkTime(raw));
  } catch {
    // Gemini failed (quota, network, malformed output). Degrade gracefully to a
    // deterministic, crowd-aware recommendation so the UX never shows an error.
    if (lastUserMessage.trim().length > 0) {
      const heuristic = heuristicConciergeReply(lastUserMessage, pois, density);
      return NextResponse.json(enrichWalkTime(heuristic));
    }
    return NextResponse.json(FALLBACK);
  }
}
