"use client";

import { RecommendationCard } from "./RecommendationCard";
import type { ConciergeMessage } from "@/lib/schemas/concierge";
import { ConciergeResponseSchema } from "@/lib/schemas/concierge";

interface Props {
  message: ConciergeMessage;
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-sky-600 px-3.5 py-2.5">
          <p className="text-sm text-white">{message.content}</p>
        </div>
      </div>
    );
  }

  let reply = message.content;
  let recommendation = null;

  try {
    const parsed = ConciergeResponseSchema.parse(JSON.parse(message.content));
    reply = parsed.reply;
    recommendation = parsed.recommendation;
  } catch {
    // content is plain text (shouldn't happen, but handle gracefully)
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-1">
        <div className="rounded-2xl rounded-tl-sm bg-slate-800 px-3.5 py-2.5">
          <p className="text-sm text-slate-100">{reply}</p>
        </div>
        {recommendation && <RecommendationCard rec={recommendation} />}
      </div>
    </div>
  );
}
