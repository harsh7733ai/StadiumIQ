# Google Services Integration — StadiumIQ

This document provides a complete, machine-readable and human-readable
reference for every Google service integrated into StadiumIQ.

---

## Integration Map

| Google Service | SDK / API | Role in StadiumIQ | Status | Source File |
|---|---|---|---|---|
| **Gemini 2.0 Flash** | `@google/generative-ai` | AI Concierge — structured JSON chat with crowd-context system prompt | ✅ Live | `lib/gemini/client.ts` |
| **Firebase Auth** | `firebase/auth` | Anonymous sign-in (every visitor gets a real Firebase UID); Google OAuth upgrade preserves order history | ✅ Live | `lib/firebase/client.ts`, `lib/firebase/googleSignIn.ts` |
| **Cloud Firestore** | `firebase/firestore` | Durable mirror for orders + concierge queries; security rules enforce per-UID ownership | ✅ Live | `lib/firebase/orders.ts`, `firestore.rules` |
| **Firebase Analytics** | `firebase/analytics` | Product telemetry: `app_open`, `concierge_query`, `order_placed`, `route_drawn` | ✅ Live | `lib/firebase/analytics.ts` |
| **Firebase Cloud Messaging** | `firebase/messaging` | Push notification: "your order is ready" delivered via service worker | ✅ Live | `lib/firebase/messaging.ts` |
| **Firebase Performance** | `firebase/performance` | Custom traces: `concierge_request`, `route_compute`, `heatmap_refresh`, `order_place` | ✅ Live | `lib/firebase/performance.ts` |
| **Firebase Remote Config** | `firebase/remote-config` | Feature flags: concierge persona, message budget, heatmap poll rate, admin panel | ✅ Live | `lib/firebase/remoteConfig.ts` |
| **Firebase Storage** | `firebase/storage` | Venue asset management: floor plans, POI thumbnails, concession menu photos, receipts | ✅ Live | `lib/firebase/storage.ts` |
| **Google Analytics 4 (gtag.js)** | `gtag.js` script | Web analytics layer: conversion funnels (order_placed, route_drawn, concierge_answered) | ✅ Live | `lib/google/gtag.ts`, `components/shared/GoogleAnalytics.tsx` |
| **Google Wallet API** | REST (JWT) | Digital order receipts + event tickets saved to fan's Google Wallet | ✅ Live | `lib/google/wallet.ts` |
| **Google Maps** | Maps URLs + Embed API | Venue directions deep-link; embed iframe for location discovery | ✅ Live | `lib/google/maps.ts` |
| **Google Places API** | Maps URLs | Out-of-venue discovery: parking, hotels, food, transit via deep links | ✅ Live | `lib/google/places.ts` |
| **Google Cloud BigQuery** | `@google-cloud/bigquery` | Analytics event sink: `stadiumiq_analytics.events` table for long-term telemetry | ✅ Live | `lib/google/cloud.ts` |
| **Google Cloud Text-to-Speech** | `@google-cloud/text-to-speech` | Audio greeting synthesis (`en-US-Journey-O` voice) triggered on concierge responses | ✅ Live | `lib/google/cloud.ts` |
| **Google Cloud Vision** | REST API | Crowd density estimation from IP camera frames (batch processing per zone) | ✅ Live | `lib/google/vision.ts` |
| **Google reCAPTCHA v3** | Script + REST | Bot protection on the concierge `/api/concierge` endpoint | ✅ Live | `lib/security/recaptcha.ts`, `components/shared/RecaptchaScript.tsx` |

---

## Authentication & Security

### Firebase Auth (Anonymous → Google OAuth upgrade)

```typescript
// lib/firebase/googleSignIn.ts
// Anonymous UID is preserved by *linking* the Google credential,
// so the fan's order history and analytics trails survive the upgrade.
export async function signInWithGoogle(): Promise<GoogleIdentity | null> {
  if (auth.currentUser?.isAnonymous) {
    const linked = await linkWithPopup(auth.currentUser, provider);
    return toIdentity(linked.user);
  }
  // ...
}
```

### Firestore Security Rules

Every Firestore read/write is gated by per-UID ownership rules defined in
`firestore.rules`. Fans can only read/write documents scoped to their own
`request.auth.uid`.

### reCAPTCHA v3

The AI concierge endpoint at `/api/concierge` verifies every request with
a reCAPTCHA v3 score check before invoking the Gemini API. Score threshold:
`0.5` (configurable). Fails open in demo mode (no secret key required).

---

## Gemini AI Concierge

### Model & Configuration

```typescript
// lib/gemini/client.ts
const MODEL_NAME = "gemini-2.0-flash";  // Fast, generous free tier, JSON mode
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
  model: MODEL_NAME,
  systemInstruction: systemPrompt,
  generationConfig: {
    responseMimeType: "application/json",  // Structured output mode
    temperature: 0.4,
    maxOutputTokens: 1024,
  },
});
```

### Structured Output Contract

Every Gemini response is validated against a Zod schema:
```typescript
const ConciergeResponseSchema = z.object({
  reply: z.string(),
  recommendation: ConciergeRecommendationSchema.nullable(),
  action: z.enum(["navigate", "order", "info"]),
});
```

Malformed responses are retried with a regex-extract fallback, then degraded
to a crowd-aware heuristic. The UI never receives raw LLM text.

---

## Google Cloud Vision — Crowd Intelligence Pipeline

```
IP Camera Frame (JPEG/PNG)
  → analyseVenueFrame(imageBase64, zoneId, capacity)
  → Vision API: LABEL_DETECTION + OBJECT_LOCALIZATION + SAFE_SEARCH_DETECTION
  → estimateCrowdFromObjects(objects, zoneId, capacity)
  → VisionCrowdEstimate { occupancy: 0..1, personCount, confidence }
  → Firestore density document
  → StadiumIQ PWA /api/density → heatmap update
```

Source: `lib/google/vision.ts`

Demo mode: Returns stable pseudo-random estimates based on `zoneId` hash so
the full pipeline is testable without real credentials.

---

## Google Wallet — Fan Passes

Two pass types are implemented:

1. **Order Receipt Pass** — issued when a fan places a concession order.
   Contains: pickup code (QR), POI location, order total, pickup time.

2. **Event Ticket Pass** — issued at gate entry.
   Contains: seat label, event name, venue, event date, gate barcode (QR).

Both use the **Generic Pass** type from the Google Wallet REST API v1.
Passes are constructed server-side (RS256 JWT), so signing keys never
reach the client.

Source: `lib/google/wallet.ts`

---

## Firebase Cloud Messaging — Push Notifications

```
Order status → "ready"
  → Firebase Admin SDK (server): sendEachForMulticast()
  → FCM service worker (/firebase-messaging-sw.js)
  → Native "Order Ready" push notification
  → Fan taps → /order?id=<orderId> deeplink
```

Foreground messages are handled by `subscribeToForegroundMessages` in
`lib/firebase/messaging.ts`, which surfaces an in-app Sonner toast as
a fallback when the PWA is in focus.

---

## Google Analytics 4 — Conversion Funnel

Events fired via both Firebase Analytics and gtag.js (dual sink):

| Event | Trigger | Parameters |
|---|---|---|
| `app_open` | First page load | `anonymous`, `uid_length` |
| `concierge_answered` | AI response received | `action`, `latency_ms` |
| `order_placed` | Order API `201 Created` | `value`, `currency: "INR"`, `items` |
| `route_drawn` | POI route animated | `poi_id`, `eta_sec` |
| `order_ready_toast` | FCM push received | `poi_id`, `wait_sec` |
| `google_signin_success` | OAuth upgrade | `was_anonymous: true` |
| `google_signout` | Sign-out button | — |

Source: `lib/google/gtag.ts`, `lib/firebase/analytics.ts`

---

## BigQuery — Long-term Analytics

The `logAnalyticsEvent` function in `lib/google/cloud.ts` mirrors key events
to a BigQuery table (`stadiumiq_analytics.events`) for venue operators who
need deeper analysis beyond the GA4 standard reports.

Schema:
```json
{
  "event": "string",
  "metadata": { "key": "string | number" },
  "timestamp": "TIMESTAMP"
}
```

Operators can connect the `stadiumiq_analytics` BigQuery dataset to
Looker Studio for custom venue analytics dashboards.

---

## Google Maps & Places

### Venue Directions

Deep-links to the Google Maps native app (or Maps web) with the venue
pre-set as destination. Supports all travel modes: driving, walking,
transit, bicycling.

### Places Discovery

Context-aware search deep-links for:
- Nearby parking (`getNearbyParkingUrl`)
- Nearby hotels (`getNearbyHotelsUrl`)
- Transit directions (`getTransitDirectionsUrl`)
- Nearby food (`getNearbyFoodUrl`)
- Venue place card (`getVenuePlaceUrl`)

Source: `lib/google/places.ts`, `lib/google/maps.ts`

---

## Content Security Policy

`next.config.mjs` explicitly allowlists the Google API origins the app
calls. No other third-party origins are permitted:

```
generativelanguage.googleapis.com   ← Gemini
firestore.googleapis.com            ← Firestore
identitytoolkit.googleapis.com      ← Firebase Auth
securetoken.googleapis.com          ← Token rotation
firebaseinstallations.googleapis.com ← FCM
google-analytics.com                ← GA4
www.googletagmanager.com            ← gtag.js
pay.google.com                      ← Google Wallet
www.recaptcha.net                   ← reCAPTCHA v3
```

---

*Updated: 2026-04-21 | StadiumIQ hackathon submission*
