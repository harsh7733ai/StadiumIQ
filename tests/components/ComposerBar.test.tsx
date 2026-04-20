import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ComposerBar } from "@/components/concierge/ComposerBar";

// Framer Motion reads matchMedia internally; jsdom doesn't ship it.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe("ComposerBar", () => {
  it("renders the input with an accessible label", () => {
    render(<ComposerBar onSend={vi.fn()} loading={false} />);
    const input = screen.getByLabelText(/concierge question/i);
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe("INPUT");
  });

  it("disables the send button when the input is empty", () => {
    render(<ComposerBar onSend={vi.fn()} loading={false} />);
    const button = screen.getByRole("button", { name: /send question/i });
    expect(button).toBeDisabled();
  });

  it("enables the send button once text is entered", async () => {
    const user = userEvent.setup();
    render(<ComposerBar onSend={vi.fn()} loading={false} />);
    const input = screen.getByLabelText(/concierge question/i);
    await user.type(input, "nearest food?");
    const button = screen.getByRole("button", { name: /send question/i });
    expect(button).toBeEnabled();
  });

  it("calls onSend with the trimmed value when submitted", async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ComposerBar onSend={onSend} loading={false} />);
    const input = screen.getByLabelText(/concierge question/i);
    await user.type(input, "   halftime beer   ");
    await user.click(screen.getByRole("button", { name: /send question/i }));
    expect(onSend).toHaveBeenCalledWith("halftime beer");
  });

  it("submits on Enter key press", async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ComposerBar onSend={onSend} loading={false} />);
    const input = screen.getByLabelText(/concierge question/i);
    await user.type(input, "where is the nearest exit?");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSend).toHaveBeenCalledWith("where is the nearest exit?");
  });

  it("does not submit on Shift+Enter (newline)", async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ComposerBar onSend={onSend} loading={false} />);
    const input = screen.getByLabelText(/concierge question/i);
    await user.type(input, "test");
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });

  it("does not submit while loading", async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    render(<ComposerBar onSend={onSend} loading={true} />);
    const button = screen.getByRole("button", { name: /sending question/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleName(/sending question/i);
  });

  it("marks input as aria-busy when loading", () => {
    render(<ComposerBar onSend={vi.fn()} loading={true} />);
    const input = screen.getByLabelText(/concierge question/i);
    expect(input).toHaveAttribute("aria-busy", "true");
  });

  it("calls onInitialValueConsumed after submitting with an initial value", async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    const onConsumed = vi.fn();
    render(
      <ComposerBar
        onSend={onSend}
        loading={false}
        initialValue="nearest burger"
        onInitialValueConsumed={onConsumed}
      />,
    );
    const button = screen.getByRole("button", { name: /send question/i });
    fireEvent.click(button);
    expect(onSend).toHaveBeenCalledWith("nearest burger");
    expect(onConsumed).toHaveBeenCalled();
  });
});
