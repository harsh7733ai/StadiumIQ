"use client";

const CHIPS = [
  "Shortest beer line right now",
  "Nearest restroom",
  "Vegetarian food under 5 min",
] as const;

interface Props {
  onSelect: (text: string) => void;
}

export function SuggestedPrompts({ onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2 px-3 pb-2">
      {CHIPS.map((chip) => (
        <button
          key={chip}
          onClick={() => onSelect(chip)}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-full px-3 py-1.5 transition-colors"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
