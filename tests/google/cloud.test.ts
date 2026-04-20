import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Mock @google-cloud/bigquery ───────────────────────────────────────────────

const mockInsert = vi.fn();
const mockTable = vi.fn(() => ({ insert: mockInsert }));
const mockDataset = vi.fn(() => ({ table: mockTable }));
const MockBigQuery = vi.fn(() => ({ dataset: mockDataset }));
// Attach the static timestamp helper
(MockBigQuery as unknown as Record<string, unknown>).timestamp = vi.fn(
  (d: Date) => d.toISOString(),
);

vi.mock("@google-cloud/bigquery", () => ({
  BigQuery: MockBigQuery,
}));

// ── Mock @google-cloud/text-to-speech ─────────────────────────────────────────

const mockSynthesizeSpeech = vi.fn();
const MockTextToSpeechClient = vi.fn(() => ({
  synthesizeSpeech: mockSynthesizeSpeech,
}));

vi.mock("@google-cloud/text-to-speech", () => ({
  TextToSpeechClient: MockTextToSpeechClient,
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("lib/google/cloud — logAnalyticsEvent", () => {
  beforeEach(() => {
    vi.resetModules();
    mockInsert.mockReset();
    mockDataset.mockClear();
    mockTable.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("logs to console and returns early in mock mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "true");
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const { logAnalyticsEvent } = await import("@/lib/google/cloud");
    await logAnalyticsEvent("test_event", { count: 1 });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("BigQuery Logging event: test_event"),
      expect.objectContaining({ count: 1 }),
    );
    expect(mockInsert).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("calls BigQuery table.insert with correct payload when not in demo mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "false");
    mockInsert.mockResolvedValue(undefined);

    const { logAnalyticsEvent } = await import("@/lib/google/cloud");
    await logAnalyticsEvent("order_placed", { orderId: "ord-1", total: 500 });

    expect(mockDataset).toHaveBeenCalledWith("stadiumiq_analytics");
    expect(mockTable).toHaveBeenCalledWith("events");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          event: "order_placed",
          metadata: { orderId: "ord-1", total: 500 },
        }),
      ]),
    );
  });

  it("includes a timestamp in the BigQuery row", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "false");
    mockInsert.mockResolvedValue(undefined);

    const { logAnalyticsEvent } = await import("@/lib/google/cloud");
    await logAnalyticsEvent("route_drawn", { poiId: "food-south" });

    // insert is called with an array of row objects: insert([{ event, metadata, timestamp }])
    const [rows] = mockInsert.mock.calls;
    const row = rows[0][0];
    expect(row).toHaveProperty("timestamp");
  });

  it("swallows BigQuery errors without throwing", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "false");
    mockInsert.mockRejectedValue(new Error("BigQuery network error"));
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { logAnalyticsEvent } = await import("@/lib/google/cloud");
    await expect(
      logAnalyticsEvent("error_event", { x: 1 }),
    ).resolves.toBeUndefined();

    consoleSpy.mockRestore();
  });

  it("accepts arbitrary string+number metadata fields", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "false");
    mockInsert.mockResolvedValue(undefined);

    const { logAnalyticsEvent } = await import("@/lib/google/cloud");
    const meta = { userId: "u123", latencyMs: 42, label: "test" };
    await logAnalyticsEvent("custom_event", meta);

    // insert([{ event, metadata, timestamp }]) — rows[0][0].metadata
    const [rows] = mockInsert.mock.calls;
    const row = rows[0][0];
    expect(row.metadata).toEqual(meta);
  });
});

describe("lib/google/cloud — generateGreetingAudio", () => {
  beforeEach(() => {
    vi.resetModules();
    mockSynthesizeSpeech.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("logs to console and returns null in mock/demo mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "true");
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const { generateGreetingAudio } = await import("@/lib/google/cloud");
    const result = await generateGreetingAudio("Hello!");

    expect(result).toBeNull();
    // cloud.ts calls console.log with a single string argument in TTS mock path
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Text-To-Speech"),
    );
    consoleSpy.mockRestore();
  });

  it("calls synthesizeSpeech with the correct request shape when live", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "false");
    const fakeAudioContent = Buffer.from("fake-audio");
    mockSynthesizeSpeech.mockResolvedValue([
      { audioContent: fakeAudioContent },
    ]);

    const { generateGreetingAudio } = await import("@/lib/google/cloud");
    const result = await generateGreetingAudio("Welcome!");

    expect(mockSynthesizeSpeech).toHaveBeenCalledWith(
      expect.objectContaining({
        input: { text: "Welcome!" },
        voice: expect.objectContaining({ languageCode: "en-US" }),
        audioConfig: expect.objectContaining({ audioEncoding: "MP3" }),
      }),
    );
    expect(result).toBeInstanceOf(Buffer);
  });

  it("returns a Buffer when audioContent is present", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "false");
    const fakeAudioContent = new Uint8Array([1, 2, 3]);
    mockSynthesizeSpeech.mockResolvedValue([
      { audioContent: fakeAudioContent },
    ]);

    const { generateGreetingAudio } = await import("@/lib/google/cloud");
    const result = await generateGreetingAudio("Test");

    expect(result).not.toBeNull();
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it("returns null when audioContent is missing/empty", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "false");
    mockSynthesizeSpeech.mockResolvedValue([{ audioContent: null }]);

    const { generateGreetingAudio } = await import("@/lib/google/cloud");
    const result = await generateGreetingAudio("Test");

    expect(result).toBeNull();
  });

  it("returns null and logs error when TTS throws", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "false");
    mockSynthesizeSpeech.mockRejectedValue(new Error("TTS quota exceeded"));
    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { generateGreetingAudio } = await import("@/lib/google/cloud");
    const result = await generateGreetingAudio("Test");

    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });

  it("uses en-US-Journey-O voice model", async () => {
    vi.stubEnv("NEXT_PUBLIC_MOCK_MODE", "false");
    mockSynthesizeSpeech.mockResolvedValue([
      { audioContent: Buffer.from("x") },
    ]);

    const { generateGreetingAudio } = await import("@/lib/google/cloud");
    await generateGreetingAudio("Voice test");

    const [call] = mockSynthesizeSpeech.mock.calls;
    expect(call[0].voice.name).toBe("en-US-Journey-O");
  });
});
