"use client";

import { useRef, useEffect, useState } from "react";
import { useConcierge } from "@/hooks/useConcierge";
import { ChatMessage } from "@/components/concierge/ChatMessage";
import { ComposerBar } from "@/components/concierge/ComposerBar";
import { SuggestedPrompts } from "@/components/concierge/SuggestedPrompts";
import { trackEvent } from "@/lib/firebase/analytics";

export default function ConciergePage() {
  const { messages, send, loading } = useConcierge();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [pendingText, setPendingText] = useState<string | undefined>(undefined);

  const showSuggestions = messages.length === 1;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleChipSelect(text: string) {
    setPendingText(text);
  }

  async function handleSend(text: string) {
    setPendingText(undefined);
    void trackEvent("concierge_query", { length: text.length });
    await send(text);
  }

  return (
    <main className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h1 className="text-lg font-semibold text-white">AI Concierge</h1>
        <span className="text-xs text-slate-400">Powered by Google Gemini</span>
      </div>

      {/* Message list */}
      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Concierge conversation"
        className="flex-1 overflow-y-auto px-3 py-4 space-y-3"
      >
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        {loading && (
          <div className="flex justify-start" role="status" aria-live="polite">
            <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-2.5">
              <span className="text-sm text-slate-400 animate-pulse">Thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts */}
      {showSuggestions && !loading && (
        <SuggestedPrompts onSelect={handleChipSelect} />
      )}

      {/* Composer */}
      <ComposerBar
        onSend={handleSend}
        loading={loading}
        initialValue={pendingText}
        onInitialValueConsumed={() => setPendingText(undefined)}
      />
    </main>
  );
}
