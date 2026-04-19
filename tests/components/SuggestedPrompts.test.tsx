import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SuggestedPrompts } from "@/components/concierge/SuggestedPrompts";

describe("SuggestedPrompts", () => {
  it("renders all chips", () => {
    render(<SuggestedPrompts onSelect={vi.fn()} />);
    expect(screen.getByRole("button", { name: /shortest beer line/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /nearest restroom/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /vegetarian food/i })).toBeInTheDocument();
  });

  it("calls onSelect with the chip text when clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SuggestedPrompts onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: /nearest restroom/i }));
    expect(onSelect).toHaveBeenCalledWith("Nearest restroom");
  });
});
