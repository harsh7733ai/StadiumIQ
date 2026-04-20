import { NextResponse } from "next/server";
import { createSession, getSession, joinSession } from "@/lib/mock/groupStore";
import { logAnalyticsEvent } from "@/lib/google/cloud";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const typedBody = body as { action?: string; code?: string; userId?: string; displayName?: string };

    if (typedBody.action === "create" && typedBody.userId && typedBody.displayName) {
      const session = createSession(typedBody.userId, typedBody.displayName);
      await logAnalyticsEvent("group_created", { userId: typedBody.userId });
      return NextResponse.json(session);
    } 
    
    if (typedBody.action === "join" && typedBody.code && typedBody.userId && typedBody.displayName) {
      try {
        const session = joinSession(typedBody.code, typedBody.userId, typedBody.displayName);
        await logAnalyticsEvent("group_joined", { userId: typedBody.userId, code: typedBody.code });
        return NextResponse.json(session);
      } catch {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ error: "Invalid action or missing parameters" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  
  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const session = getSession(code);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json(session);
}
