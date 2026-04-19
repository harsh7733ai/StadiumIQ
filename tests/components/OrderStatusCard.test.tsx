import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderStatusCard } from "@/components/order/OrderStatusCard";
import type { Order } from "@/lib/schemas/order";

vi.mock("sonner", () => ({
  toast: { success: vi.fn() },
}));

// Framer Motion uses IntersectionObserver / window.matchMedia internally.
// jsdom doesn't provide matchMedia, so stub it.
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

function baseOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "ord_1",
    userId: "user_1",
    poiId: "food-burger",
    poiName: "Burger Stand",
    items: [
      { id: "burger", name: "Burger", priceCents: 1200, qty: 2 },
      { id: "fries", name: "Fries", priceCents: 500, qty: 1 },
    ],
    totalCents: 2900,
    pickupCode: "4271",
    state: "placed",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe("OrderStatusCard", () => {
  it("renders pickup code and POI name", () => {
    render(<OrderStatusCard order={baseOrder()} />);
    expect(screen.getByText("4271")).toBeInTheDocument();
    expect(screen.getByText("Burger Stand")).toBeInTheDocument();
  });

  it("displays the current state label", () => {
    render(<OrderStatusCard order={baseOrder({ state: "preparing" })} />);
    // Label appears in the badge AND as sr-only stepper text — both should match.
    expect(screen.getAllByText(/preparing/i).length).toBeGreaterThanOrEqual(1);
  });

  it("shows 'Ready for pickup!' when state is ready", () => {
    render(<OrderStatusCard order={baseOrder({ state: "ready" })} />);
    expect(screen.getAllByText(/ready for pickup/i).length).toBeGreaterThanOrEqual(1);
  });

  it("lists each line item with its quantity and formatted price", () => {
    render(<OrderStatusCard order={baseOrder()} />);
    expect(screen.getByText(/Burger × 2/)).toBeInTheDocument();
    expect(screen.getByText(/Fries × 1/)).toBeInTheDocument();
    expect(screen.getByText("$24.00")).toBeInTheDocument(); // 1200 × 2
    expect(screen.getByText("$5.00")).toBeInTheDocument();
    expect(screen.getByText("$29.00")).toBeInTheDocument(); // total
  });

  it("exposes an aria-live status region for screen readers", () => {
    render(<OrderStatusCard order={baseOrder({ state: "ready" })} />);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAttribute(
      "aria-label",
      expect.stringMatching(/Order 4271 at Burger Stand is Ready for pickup!/i),
    );
  });
});
