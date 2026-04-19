import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Unmount any React trees RTL rendered so tests stay isolated.
afterEach(() => {
  cleanup();
});
