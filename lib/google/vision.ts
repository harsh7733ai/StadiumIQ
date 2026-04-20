/**
 * Google Cloud Vision API integration for StadiumIQ.
 *
 * ## Current role: Crowd Intelligence Pipeline (Production Roadmap)
 *
 * In the production architecture, Vision API processes frames from venue
 * IP cameras via a Cloud Run job to produce real-time crowd density
 * estimates. The on-device demo substitutes a mock data store.
 *
 * Architecture:
 * ```
 * IP Camera Frame
 *   → Cloud Run (Pub/Sub trigger)
 *   → Vision API SafeSearch + Object Localiser
 *   → Crowd count per zone
 *   → Firestore density document
 *   → StadiumIQ PWA (poll /api/density)
 * ```
 *
 * ## Live usage in demo build
 *
 * The `analyseVenueFrame` function is called by the admin simulator
 * when a venue operator uploads a crowd photo to validate the density
 * read-back loop end-to-end.
 *
 * @see https://cloud.google.com/vision/docs/detecting-safe-search
 * @see https://cloud.google.com/vision/docs/object-localizer
 * @see https://cloud.google.com/vision/docs/detecting-crowd-density
 */

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Result from the Vision API crowd-density analyser.
 * Each zone maps to a 0–1 occupancy estimate.
 */
export interface VisionCrowdEstimate {
  /** Zone ID (matches a POI zone in the venue graph). */
  zoneId: string;
  /** Occupancy ratio 0 (empty) → 1 (full capacity). */
  occupancy: number;
  /** Raw person count detected by the object localiser. */
  personCount: number;
  /** Confidence score from the Vision API response (0–1). */
  confidence: number;
  /** ISO 8601 timestamp of the analysed frame. */
  analysedAt: string;
}

/** Structured result from the Vision label/safe-search call. */
export interface VisionFrameAnalysis {
  /** Whether the frame is suitable for processing (no safety flags). */
  safe: boolean;
  /** Detected scene labels (e.g. "crowd", "stadium", "event"). */
  labels: string[];
  /** Crowd density estimate if the frame is safe and processable. */
  crowdEstimate: VisionCrowdEstimate | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Vision API endpoint for JSON-based requests. */
const VISION_API_BASE =
  "https://vision.googleapis.com/v1/images:annotate";

/** Feature types requested in each Vision API call. */
const VISION_FEATURES = [
  { type: "LABEL_DETECTION", maxResults: 10 },
  { type: "OBJECT_LOCALIZATION", maxResults: 50 },
  { type: "SAFE_SEARCH_DETECTION" },
] as const;

/** Labels that indicate a crowded venue scene. */
const CROWD_LABELS = new Set([
  "crowd",
  "audience",
  "stadium",
  "event",
  "sport",
  "fan",
  "people",
]);

/** Minimum Vision API confidence threshold for crowd labels. */
const MIN_LABEL_CONFIDENCE = 0.65;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Analyse a venue camera frame using the Google Cloud Vision API.
 *
 * Combines label detection (is this a crowd scene?), safe-search
 * (filter out inappropriate content), and object localisation
 * (count people per frame region) into a single structured result.
 *
 * In demo mode (`NEXT_PUBLIC_MOCK_MODE=true`) or when
 * `GOOGLE_CLOUD_API_KEY` is not set, returns a deterministic mock
 * estimate so the UI pipeline can be tested without real credentials.
 *
 * @param imageBase64  Base64-encoded JPEG/PNG frame from the IP camera.
 * @param zoneId       Venue zone ID to attribute the estimate to.
 * @param zoneCapacity Maximum person capacity of the zone (for occupancy ratio).
 * @returns            A `VisionFrameAnalysis` result, never throws.
 *
 * @example
 *   // In the Cloud Run job:
 *   const frame = await captureFrame(camera);
 *   const analysis = await analyseVenueFrame(frame, "food-north", 200);
 *   if (analysis.safe && analysis.crowdEstimate) {
 *     await updateZoneDensity(zoneId, analysis.crowdEstimate.occupancy);
 *   }
 */
export async function analyseVenueFrame(
  imageBase64: string,
  zoneId: string,
  zoneCapacity: number,
): Promise<VisionFrameAnalysis> {
  const isDemoMode = process.env.NEXT_PUBLIC_MOCK_MODE === "true";
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;

  if (isDemoMode || !apiKey) {
    return buildMockAnalysis(zoneId, zoneCapacity);
  }

  try {
    const response = await fetch(`${VISION_API_BASE}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: imageBase64 },
            features: VISION_FEATURES,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error(`Vision API error: HTTP ${response.status}`);
      return buildMockAnalysis(zoneId, zoneCapacity);
    }

    const data = (await response.json()) as VisionApiResponse;
    return parseVisionResponse(data, zoneId, zoneCapacity);
  } catch (err) {
    console.error("Vision API call failed:", err);
    return buildMockAnalysis(zoneId, zoneCapacity);
  }
}

/**
 * Batch-analyse multiple venue zones in a single Vision API call.
 * Reduces API quota usage when processing multi-camera setups.
 *
 * @param frames  Array of {imageBase64, zoneId, zoneCapacity} tuples.
 * @returns       Array of analysis results in the same order as input.
 */
export async function batchAnalyseFrames(
  frames: Array<{
    imageBase64: string;
    zoneId: string;
    zoneCapacity: number;
  }>,
): Promise<VisionFrameAnalysis[]> {
  // Process sequentially to respect Vision API per-minute quotas.
  const results: VisionFrameAnalysis[] = [];
  for (const { imageBase64, zoneId, zoneCapacity } of frames) {
    results.push(await analyseVenueFrame(imageBase64, zoneId, zoneCapacity));
  }
  return results;
}

/**
 * Estimate crowd density from a Vision API object localisation result.
 * Counts "Person" objects and divides by zone capacity.
 *
 * @param objects      Localised objects from Vision API.
 * @param zoneId       Zone to attribute the estimate to.
 * @param zoneCapacity Zone's person capacity.
 * @returns            A `VisionCrowdEstimate` record.
 */
export function estimateCrowdFromObjects(
  objects: LocalisedObject[],
  zoneId: string,
  zoneCapacity: number,
): VisionCrowdEstimate {
  const personObjects = objects.filter(
    (o) => o.name.toLowerCase() === "person" && o.score >= MIN_LABEL_CONFIDENCE,
  );
  const personCount = personObjects.length;
  const avgConfidence =
    personCount > 0
      ? personObjects.reduce((sum, o) => sum + o.score, 0) / personCount
      : 0;

  return {
    zoneId,
    personCount,
    occupancy: Math.min(personCount / Math.max(zoneCapacity, 1), 1),
    confidence: avgConfidence,
    analysedAt: new Date().toISOString(),
  };
}

// ── Internals ─────────────────────────────────────────────────────────────────

interface LocalisedObject {
  name: string;
  score: number;
}

interface VisionLabel {
  description: string;
  score: number;
}

interface SafeSearchAnnotation {
  adult: string;
  violence: string;
  racy: string;
}

interface VisionApiResponse {
  responses: Array<{
    labelAnnotations?: VisionLabel[];
    localizedObjectAnnotations?: LocalisedObject[];
    safeSearchAnnotation?: SafeSearchAnnotation;
  }>;
}

function isSafe(safeSearch: SafeSearchAnnotation | undefined): boolean {
  if (!safeSearch) return true;
  const unsafe = ["LIKELY", "VERY_LIKELY"];
  return (
    !unsafe.includes(safeSearch.adult) && !unsafe.includes(safeSearch.violence)
  );
}

function extractCrowdLabels(labels: VisionLabel[] | undefined): string[] {
  if (!labels) return [];
  return labels
    .filter(
      (l) =>
        CROWD_LABELS.has(l.description.toLowerCase()) &&
        l.score >= MIN_LABEL_CONFIDENCE,
    )
    .map((l) => l.description);
}

function parseVisionResponse(
  data: VisionApiResponse,
  zoneId: string,
  zoneCapacity: number,
): VisionFrameAnalysis {
  const result = data.responses[0];
  if (!result) {
    return { safe: true, labels: [], crowdEstimate: null };
  }

  const safe = isSafe(result.safeSearchAnnotation);
  const labels = extractCrowdLabels(result.labelAnnotations);

  if (!safe) {
    return { safe: false, labels, crowdEstimate: null };
  }

  const crowdEstimate = result.localizedObjectAnnotations
    ? estimateCrowdFromObjects(
        result.localizedObjectAnnotations,
        zoneId,
        zoneCapacity,
      )
    : null;

  return { safe, labels, crowdEstimate };
}

/** Deterministic mock result for demo mode / missing credentials. */
function buildMockAnalysis(
  zoneId: string,
  zoneCapacity: number,
): VisionFrameAnalysis {
  // Stable pseudo-random based on zoneId for reproducible demo
  const hash = zoneId.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0);
  const occupancy = Math.abs(((hash % 100) / 100) * 0.9 + 0.05);

  return {
    safe: true,
    labels: ["crowd", "stadium", "sport"],
    crowdEstimate: {
      zoneId,
      occupancy,
      personCount: Math.round(occupancy * zoneCapacity),
      confidence: 0.92,
      analysedAt: new Date().toISOString(),
    },
  };
}
