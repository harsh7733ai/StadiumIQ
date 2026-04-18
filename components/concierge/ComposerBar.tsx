"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  onSend: (text: string) => Promise<void>;
  loading: boolean;
  initialValue?: string;
  onInitialValueConsumed?: () => void;
}

export function ComposerBar({ onSend, loading, initialValue, onInitialValueConsumed }: Props) {
  const [value, setValue] = useState(initialValue ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  if (initialValue && initialValue !== value) {
    setValue(initialValue);
  }

  async function submit() {
    const text = value.trim();
    if (!text || loading) return;
    setValue("");
    onInitialValueConsumed?.();
    await onSend(text);
    inputRef.current?.focus();
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  }

  return (
    <div className="flex gap-2 px-3 py-3 border-t border-slate-800 bg-slate-950">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Ask about food, restrooms, or getting around…"
        disabled={loading}
        className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
      />
      <Button
        size="icon"
        onClick={() => void submit()}
        disabled={loading || !value.trim()}
        className="bg-sky-600 hover:bg-sky-500 shrink-0"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
