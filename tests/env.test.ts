import { describe, it, expect } from "vitest";
import { publicEnv, serverEnv, isMockMode, hasFirebase, hasAnalytics } from "@/lib/env";

describe("env module", () => {
  it("exposes a validated server env object", () => {
    expect(serverEnv).toBeDefined();
    expect(["development", "test", "production"]).toContain(serverEnv.NODE_ENV);
  });

  it("exposes a validated public env with MOCK_MODE as boolean", () => {
    expect(typeof publicEnv.NEXT_PUBLIC_MOCK_MODE).toBe("boolean");
  });

  it("derives isMockMode from NEXT_PUBLIC_MOCK_MODE", () => {
    expect(typeof isMockMode).toBe("boolean");
    expect(isMockMode).toBe(publicEnv.NEXT_PUBLIC_MOCK_MODE);
  });

  it("hasFirebase reflects presence of required Firebase keys", () => {
    const expected = Boolean(
      publicEnv.NEXT_PUBLIC_FIREBASE_API_KEY &&
        publicEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    );
    expect(hasFirebase).toBe(expected);
  });

  it("hasAnalytics reflects presence of NEXT_PUBLIC_GA_ID", () => {
    expect(hasAnalytics).toBe(Boolean(publicEnv.NEXT_PUBLIC_GA_ID));
  });
});
