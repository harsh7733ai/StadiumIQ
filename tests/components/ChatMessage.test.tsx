import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatMessage } from "@/components/concierge/ChatMessage";
import type { ConciergeMessage, ConciergeResponse } from "@/lib/schemas/concierge";

// next/navigation is a peer we don't need to exercise here — stub minimally.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

describe("ChatMessage", () => {
  it("renders user messages as plain text bubbles", () => {
    const message: ConciergeMessage = { role: "user", content: "Where's the nearest burger?" };
    render(<ChatMessage message={message} />);
    expect(screen.getByText("Where's the nearest burger?")).toBeInTheDocument();
  });

  it("renders assistant messages by parsing the embedded ConciergeResponse", () => {
    const payload: ConciergeResponse = {
      reply: "Try the Veg Corner — 2 minutes away and nearly empty.",
      recommendation: {
        poiId: "food-veg",
        poiName: "Veg Corner",
        walkTimeSec: 120,
        currentDensity: 0.15,
        reason: "Low crowd + short walk",
      },
      action: "navigate",
    };
    const message: ConciergeMessage = {
      role: "assistant",
      content: JSON.stringify(payload),
    };
    render(<ChatMessage message={message} />);
    expect(screen.getByText(/Try the Veg Corner/)).toBeInTheDocument();
    expect(screen.getByText("Veg Corner")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /take me there/i })).toBeInTheDocument();
  });

  it("falls back to raw text when assistant payload isn't valid JSON", () => {
    const message: ConciergeMessage = { role: "assistant", content: "plain fallback text" };
    render(<ChatMessage message={message} />);
    expect(screen.getByText("plain fallback text")).toBeInTheDocument();
  });

  it("omits the Order button for non-food recommendations", () => {
    const payload: ConciergeResponse = {
      reply: "Restroom NW is closest.",
      recommendation: {
        poiId: "restroom-nw",
        poiName: "Restroom NW",
        walkTimeSec: 45,
        currentDensity: 0.1,
        reason: "Nearest + low density",
      },
      action: "navigate",
    };
    const message: ConciergeMessage = { role: "assistant", content: JSON.stringify(payload) };
    render(<ChatMessage message={message} />);
    expect(screen.getByRole("button", { name: /take me there/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /order now/i })).not.toBeInTheDocument();
  });
});
