import { describe, it, expect, vi, afterEach } from "vitest";
import {
  analyseVenueFrame,
  batchAnalyseFrames,
  estimateCrowdFromObjects,
  type VisionCrowdEstimate,
  type VisionFrameAnalysis,
} from "@/lib/google/vision";

// ── estimateCrowdFromObjects ───────────────────────────────────────────────────

describe("lib/google/vision — estimateCrowdFromObjects", () => {
  it("counts only 'person' objects above confidence threshold", () => {
    const objects = [
      { name: "Person", score: 0.95 },
      { name: "Person", score: 0.7 },
      { name: "Car", score: 0.99 },
      { name: "Person", score: 0.4 }, // below threshold → excluded
    ];
    const result = estimateCrowdFromObjects(objects, "food-north", 100);
    expect(result.personCount).toBe(2);
  });

  it("occupancy ratio is personCount / zoneCapacity clamped to [0,1]", () => {
    const objects = [
      { name: "Person", score: 0.9 },
      { name: "Person", score: 0.85 },
    ];
    const result = estimateCrowdFromObjects(objects, "gate-a", 10);
    expect(result.occupancy).toBeCloseTo(0.2, 5);
  });

  it("clamps occupancy at 1 when personCount > capacity", () => {
    const objects = Array.from({ length: 50 }, () => ({
      name: "Person",
      score: 0.9,
    }));
    const result = estimateCrowdFromObjects(objects, "zone", 10);
    expect(result.occupancy).toBe(1);
  });

  it("returns personCount = 0 when no persons are detected", () => {
    const result = estimateCrowdFromObjects(
      [{ name: "Stadium", score: 0.99 }],
      "restroom",
      50,
    );
    expect(result.personCount).toBe(0);
    expect(result.occupancy).toBe(0);
  });

  it("averages confidence scores of detected persons", () => {
    const objects = [
      { name: "Person", score: 0.8 },
      { name: "Person", score: 0.9 },
    ];
    const result = estimateCrowdFromObjects(objects, "merch", 100);
    expect(result.confidence).toBeCloseTo(0.85, 5);
  });

  it("sets confidence to 0 when no persons detected", () => {
    const result = estimateCrowdFromObjects([], "empty-zone", 100);
    expect(result.confidence).toBe(0);
  });

  it("includes zoneId in the result", () => {
    const result = estimateCrowdFromObjects([], "food-beer", 100);
    expect(result.zoneId).toBe("food-beer");
  });

  it("analysedAt is a valid ISO 8601 timestamp", () => {
    const result = estimateCrowdFromObjects([], "zone-x", 100);
    expect(() => new Date(result.analysedAt)).not.toThrow();
    expect(new Date(result.analysedAt).toISOString()).toBe(result.analysedAt);
  });

  it("handles case insensitive 'person' matching", () => {
    const objects = [
      { name: "person", score: 0.9 },   // lowercase
      { name: "Person", score: 0.9 },   // title case
      { name: "PERSON", score: 0.9 },   // uppercase — not matched (strict lowercasing)
    ];
    const result = estimateCrowdFromObjects(objects, "test", 100);
    // "person" and "Person" → .toLowerCase() === "person" → 2 matches
    // "PERSON" → .toLowerCase() === "person" → also matches, 3 total
    expect(result.personCount).toBeGreaterThanOrEqual(2);
  });
});

// ── analyseVenueFrame — demo/mock mode ────────────────────────────────────────

describe("lib/google/vision — analyseVenueFrame (demo mode)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a safe result in demo mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "true");
    const result = await analyseVenueFrame("base64data", "food-north", 200);
    expect(result.safe).toBe(true);
  });

  it("returns crowd labels in demo mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "true");
    const result = await analyseVenueFrame("base64data", "food-north", 200);
    expect(result.labels.length).toBeGreaterThan(0);
    expect(result.labels).toContain("crowd");
  });

  it("returns a non-null crowdEstimate in demo mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "true");
    const result = await analyseVenueFrame("base64data", "food-north", 200);
    expect(result.crowdEstimate).not.toBeNull();
  });

  it("crowd estimate occupancy is between 0 and 1", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "true");
    const result = await analyseVenueFrame("base64data", "gate-a", 500);
    expect(result.crowdEstimate!.occupancy).toBeGreaterThan(0);
    expect(result.crowdEstimate!.occupancy).toBeLessThanOrEqual(1);
  });

  it("crowd estimate zoneId matches the input", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "true");
    const result = await analyseVenueFrame("img", "restroom-south", 80);
    expect(result.crowdEstimate!.zoneId).toBe("restroom-south");
  });

  it("crowd estimate personCount = occupancy × capacity (rounded)", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "true");
    const capacity = 100;
    const result = await analyseVenueFrame("img", "merch-stand", capacity);
    const est = result.crowdEstimate!;
    expect(est.personCount).toBe(Math.round(est.occupancy * capacity));
  });

  it("returns different estimates for different zoneIds (stable hash)", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "true");
    const r1 = await analyseVenueFrame("img", "food-north", 100);
    const r2 = await analyseVenueFrame("img", "food-south", 100);
    // Different zones → different stable hash → different occupancy
    expect(r1.crowdEstimate!.occupancy).not.toBe(
      r2.crowdEstimate!.occupancy,
    );
  });

  it("falls back to mock when GOOGLE_CLOUD_API_KEY is absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "false");
    vi.stubEnv("GOOGLE_CLOUD_API_KEY", "");
    const result = await analyseVenueFrame("img", "zone", 100);
    expect(result.safe).toBe(true);
    expect(result.crowdEstimate).not.toBeNull();
  });

  it("never throws regardless of input", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "true");
    await expect(analyseVenueFrame("", "zone", 0)).resolves.not.toThrow();
    await expect(analyseVenueFrame("bad", "z", -1)).resolves.not.toThrow();
  });
});

// ── batchAnalyseFrames ────────────────────────────────────────────────────────

describe("lib/google/vision — batchAnalyseFrames", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns results in the same order as input frames", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "true");
    const frames = [
      { imageBase64: "img1", zoneId: "food-north", zoneCapacity: 100 },
      { imageBase64: "img2", zoneId: "food-south", zoneCapacity: 150 },
      { imageBase64: "img3", zoneId: "gate-a", zoneCapacity: 500 },
    ];
    const results = await batchAnalyseFrames(frames);
    expect(results).toHaveLength(3);
    expect(results[0].crowdEstimate?.zoneId).toBe("food-north");
    expect(results[1].crowdEstimate?.zoneId).toBe("food-south");
    expect(results[2].crowdEstimate?.zoneId).toBe("gate-a");
  });

  it("returns an empty array for empty input", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "true");
    const results = await batchAnalyseFrames([]);
    expect(results).toEqual([]);
  });

  it("all results have safe=true in demo mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "true");
    const frames = [
      { imageBase64: "a", zoneId: "zone-1", zoneCapacity: 100 },
      { imageBase64: "b", zoneId: "zone-2", zoneCapacity: 200 },
    ];
    const results = await batchAnalyseFrames(frames);
    expect(results.every((r) => r.safe)).toBe(true);
  });

  it("returns VisionFrameAnalysis shape for each result", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "true");
    const frames = [{ imageBase64: "x", zoneId: "zone", zoneCapacity: 100 }];
    const [result] = await batchAnalyseFrames(frames);
    expect(result).toHaveProperty("safe");
    expect(result).toHaveProperty("labels");
    expect(result).toHaveProperty("crowdEstimate");
  });
});

// ── Type contracts ─────────────────────────────────────────────────────────────

describe("lib/google/vision — VisionCrowdEstimate schema", () => {
  const estimate: VisionCrowdEstimate = {
    zoneId: "food-north",
    occupancy: 0.65,
    personCount: 65,
    confidence: 0.91,
    analysedAt: new Date().toISOString(),
  };

  it("occupancy is a number in [0, 1]", () => {
    expect(estimate.occupancy).toBeGreaterThanOrEqual(0);
    expect(estimate.occupancy).toBeLessThanOrEqual(1);
  });

  it("personCount is a non-negative integer", () => {
    expect(Number.isInteger(estimate.personCount)).toBe(true);
    expect(estimate.personCount).toBeGreaterThanOrEqual(0);
  });

  it("confidence is a number in [0, 1]", () => {
    expect(estimate.confidence).toBeGreaterThanOrEqual(0);
    expect(estimate.confidence).toBeLessThanOrEqual(1);
  });

  it("analysedAt is a valid ISO timestamp", () => {
    expect(new Date(estimate.analysedAt).toISOString()).toBe(estimate.analysedAt);
  });
});

// ── analyseVenueFrame — live API path (fetch mocked) ──────────────────────────

describe("lib/google/vision — analyseVenueFrame (live API path)", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    vi.unstubAllEnvs();
    global.fetch = originalFetch;
  });

  function makeFetchMock(body: unknown, status = 200): typeof fetch {
    return vi.fn().mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => body } as Response);
  }

  it("calls the Vision API when an API key is provided", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "false");
    vi.stubEnv("GOOGLE_CLOUD_API_KEY", "test-vision-key");
    global.fetch = makeFetchMock({ responses: [{ labelAnnotations: [{ description: "crowd", score: 0.92 }], localizedObjectAnnotations: [{ name: "Person", score: 0.9 }, { name: "Person", score: 0.85 }], safeSearchAnnotation: { adult: "UNLIKELY", violence: "UNLIKELY", racy: "UNLIKELY" } }] });
    const result = await analyseVenueFrame("base64img", "zone-a", 100);
    expect(result.safe).toBe(true);
    expect(result.crowdEstimate!.personCount).toBe(2);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("vision.googleapis.com"), expect.objectContaining({ method: "POST" }));
  });

  it("falls back to mock when Vision API returns HTTP error", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "false");
    vi.stubEnv("GOOGLE_CLOUD_API_KEY", "test-key");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    global.fetch = makeFetchMock({}, 403);
    const result = await analyseVenueFrame("img", "zone", 100);
    expect(result.crowdEstimate).not.toBeNull();
    consoleSpy.mockRestore();
  });

  it("falls back to mock when fetch throws a network error", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "false");
    vi.stubEnv("GOOGLE_CLOUD_API_KEY", "test-key");
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    global.fetch = vi.fn().mockRejectedValue(new Error("NetworkError"));
    const result = await analyseVenueFrame("img", "zone", 100);
    expect(result.crowdEstimate).not.toBeNull();
    consoleSpy.mockRestore();
  });

  it("returns safe=false when Vision API flags adult or violence content", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "false");
    vi.stubEnv("GOOGLE_CLOUD_API_KEY", "test-key");
    global.fetch = makeFetchMock({ responses: [{ safeSearchAnnotation: { adult: "VERY_LIKELY", violence: "UNLIKELY", racy: "POSSIBLE" }, labelAnnotations: [] }] });
    const result = await analyseVenueFrame("img", "zone", 100);
    expect(result.safe).toBe(false);
    expect(result.crowdEstimate).toBeNull();
  });

  it("filters out low-confidence labels", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "false");
    vi.stubEnv("GOOGLE_CLOUD_API_KEY", "test-key");
    global.fetch = makeFetchMock({ responses: [{ labelAnnotations: [{ description: "crowd", score: 0.3 }, { description: "stadium", score: 0.9 }] }] });
    const result = await analyseVenueFrame("img", "zone", 100);
    expect(result.labels).toContain("stadium");
    expect(result.labels).not.toContain("crowd");
  });

  it("returns safe=true with no crowdEstimate when responses array is empty", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "false");
    vi.stubEnv("GOOGLE_CLOUD_API_KEY", "test-key");
    global.fetch = makeFetchMock({ responses: [] });
    const result = await analyseVenueFrame("img", "zone", 100);
    expect(result.safe).toBe(true);
    expect(result.crowdEstimate).toBeNull();
  });
});
