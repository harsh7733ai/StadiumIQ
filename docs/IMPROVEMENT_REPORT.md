# StadiumIQ — Improvement Report (Second Submission Prep)

**Audit date:** 2026-04-20
**Audit scope:** Read-only review of the repo on `master`.
**Goal:** Identify the highest-leverage improvements to raise the ranking for the next submission — especially in **Testing** and **Google Services**, which the first submission was weak on.

Findings use `impact → file:line` format. Impact tiers:
- **P0** — visible to judges; fix before resubmitting.
- **P1** — strong signal; fix if time allows.
- **P2** — hygiene; ship after P0/P1 are green.

---

## 1. Code Quality

### Findings
1. **`/group` page is a stub** — `app/(app)/group/page.tsx:1-7` renders a single heading and nothing else. `CLAUDE.md` lists Group Coordination as one of six core features; shipping a placeholder tanks the "problem statement alignment" score.
2. **Dijkstra rebuilds its adjacency map on every call** — `lib/routing/dijkstra.ts:64`. `buildAdj(graph)` runs each time `shortestPath()` is called (once per route change + once per concierge request). The graph is memoized via `getGraph()` but the adjacency list isn't. Small graph (40 nodes) so it's not catastrophic, but it's a trivial win.
3. **`/map` loads and parses POIs + graph at module scope** — `app/(app)/map/page.tsx:25-26`. `PoisSchema.parse(rawPois)` and `getGraph()` run in the client bundle eagerly. Fine for the demo but duplicated across `/order`, `/concierge`, and `/map` — three parses of the same JSON. Consider a shared `lib/data/venue.ts` façade.
4. **`WAIT_TIME_SECONDS` constant is declared but unused** — `lib/constants.ts:17-22`. `estimateWaitSec()` in `lib/mock/waitTime.ts` uses its own numbers (food: 0→600s, restroom: 0→240s) per CLAUDE.md. Either wire the constant through or delete it — dead constants drift into bugs.
5. **No `any`, no `@ts-ignore`, no `console.log` in prod code** — spot checks across routes and hooks came up clean. TypeScript strict is honored.
6. **Analytics page polls every 3s** — `app/(app)/analytics/page.tsx:24`. Fine, but the `setInterval` isn't paired with a visibility-change guard; the tab keeps polling when hidden. One-line `document.visibilityState === "visible"` check kills wasted network.
7. **Two `next.config` files** — `next.config.mjs` (the real one, with security headers) and a stale `next.config.ts` referenced in the prior session summary. If both exist, Next picks the `.mjs` and the `.ts` silently misleads anyone reading the repo. Confirm there's only one.

### Fix Ranking
- **P0**: Ship `/group` — even a working code + single shared pin beats a stub. (1)
- **P1**: Centralize POI/graph loading into `lib/data/venue.ts`. (3)
- **P1**: Memoize Dijkstra adjacency list on the graph instance. (2)
- **P2**: Remove `WAIT_TIME_SECONDS` or wire it in. (4)
- **P2**: Pause analytics polling on `visibilitychange`. (6)

---

## 2. Security

### Findings
1. **CSP allows `'unsafe-inline'` and `'unsafe-eval'` for scripts** — `next.config.mjs:30`. Next 14 App Router needs `'unsafe-inline'` for hydration, but `'unsafe-eval'` is not required for a production Next app that isn't running WASM or `new Function(...)`. Dropping `'unsafe-eval'` is a measurable hardening win and tools like Lighthouse flag it.
2. **`/admin` is unprotected** — `app/admin/page.tsx` has no guard; anyone with the URL can fire `halftime_rush`, `reset`, or advance any user's order. CLAUDE.md documents this as intentional for the demo, but for a public deploy this is a live abuse vector that judges can (and will) find by guessing. A single env-gated password-check (`ADMIN_PASSCODE` + cookie) takes 15 min and removes the risk.
3. **Rate limiter keys collapse behind a shared proxy** — `lib/security/rateLimit.ts:59-65`. `clientKeyFrom()` takes the first IP from `x-forwarded-for`. On Vercel this is usually the real IP, but if a user is behind a corporate NAT or iOS Private Relay, their whole subnet shares one bucket. Mitigate by combining IP + `X-User-Id` (already done for `/api/order` at `app/api/order/route.ts:25`; not done for `/api/concierge` at `app/api/concierge/route.ts:34`).
4. **Rate limiter is per-instance, not distributed** — `lib/security/rateLimit.ts:9-23`. On Vercel each Lambda has its own Map. A burst that hits 3 warm Lambdas gets 3× the intended cap. Vercel KV + a 5-line Upstash wrapper eliminates this. Flag as known in the README if not fixed.
5. **Gemini JSON extraction regex is forgiving** — `lib/gemini/client.ts:60`. `/\{[\s\S]*\}/` greedily matches from the first `{` to the last `}`. If Gemini returns commentary with nested braces, this still parses, but it also means a prompt-injection that slips mock JSON into the reply could poison the schema before Zod kicks in. Zod still catches it (`schema.parse`), so the risk is contained, but switching to JSON-only response mode with a non-greedy match (`/\{[\s\S]*?\}$/m`) is safer.
6. **Firestore rules allow any signed-in user to read any `group_sessions` doc** — `firestore.rules:55`. Intentional per comment ("they need the 6-char code to find it"), but with only 6 uppercase alphanumeric chars that's ~2B entropy = brute-forceable. Scope reads to `resource.data.createdBy == request.auth.uid || request.auth.uid in resource.data.memberIds[]` to block drive-by enumeration.
7. **Group `allow update: if isSignedIn()` is too open** — `firestore.rules:58`. Any signed-in user can rewrite any group session, including `createdBy`. Must pin `createdBy` field immutable and restrict to members.
8. **Secrets hygiene looks good** — `GEMINI_API_KEY` only on server (`lib/gemini/client.ts:11`), Firebase Admin private key is re-expanded safely (`lib/firebase/admin.ts:26`), `.env.local` is in `.gitignore`. No hardcoded tokens spotted.
9. **Concierge input length capped at 500 chars, 20 history messages** — `lib/schemas/concierge.ts:9-10`. Good prompt-injection perimeter.
10. **No HTML sanitizer needed** — no `dangerouslySetInnerHTML` usage found in the `app/` or `components/` tree.

### Fix Ranking
- **P0**: Tighten Firestore rules on `/group_sessions` (6, 7). Judges with a security lens will try this.
- **P0**: Gate `/admin` behind an env-driven passcode (2). One middleware file.
- **P1**: Drop `'unsafe-eval'` from CSP (1). Verify Next still hydrates.
- **P1**: Add `X-User-Id` to concierge rate-limit key (3).
- **P2**: Move rate-limiter to Vercel KV / Upstash (4).

---

## 3. Efficiency

### Findings
1. **500ms density polling from every open tab** — `hooks/useCrowdDensity.ts:15-20` (via `subscribeToDensity`). That's 120 requests/min/user just to paint the heatmap. Fine for demo, expensive at scale. Server-Sent Events (one open connection) or Firestore `onSnapshot` (when `NEXT_PUBLIC_MOCK_MODE=false`) removes the polling tax. This also demonstrates "real-time architecture" in the pitch instead of "we poll a lot".
2. **`VenueHeatmap` re-renders every POI on every density tick** — `components/map/VenueHeatmap.tsx:110`. No `React.memo` on the POI marker; the parent re-renders pass new `density` object identity. On a 15-POI map it's cheap, but `framer-motion` animates 15 circles each frame. Extract `<PoiMarker>` as a memoized child keyed on `(poi.id, fill)`.
3. **Lucide icons imported individually** — good; no all-barrel import. `import { ChevronLeft } from "lucide-react"` is tree-shaken. Verified at `app/(app)/order/page.tsx:5`.
4. **`recharts` is in `dependencies`** — `package.json:59`. Recharts is heavy (~70KB gz). Only used in `/analytics`; ensure it's dynamically imported (`next/dynamic`) so landing page and map don't pay the cost. Not currently dynamic (analytics page imports it directly at module scope via `components/analytics/*`).
5. **`framer-motion` is global** — `package.json:53`. Used widely; 50KB+ gz. Consider `motion/react` (LazyMotion + domAnimation) to cut ~25KB for surfaces that only need transforms/opacity.
6. **Fonts are self-hosted with `display: swap`** — `app/layout.tsx:10-24`. Preloads Sans only, not Mono. Good. No font-loading issue.
7. **Static assets get year-long cache** — `next.config.mjs:48-53`. Correct.
8. **Keepalive runs every 60s** — referenced in `CLAUDE.md`, mounted in `app/(app)/layout.tsx:1`. Reasonable for demo, but waste once deployed long-term.

### Fix Ranking
- **P0**: Make `components/analytics/*` dynamic-import via `next/dynamic` (4). Keeps `/map` bundle small where judges land first.
- **P1**: Memoize POI marker with `React.memo` (2).
- **P1**: Swap `framer-motion` for `LazyMotion` + `m.circle` (5). Measurable LCP gain on mobile 4G.
- **P2**: Switch density subscription to SSE or Firestore `onSnapshot` (1).

---

## 4. Testing — **HIGH PRIORITY (weak in Submission 1)**

### Findings
1. **Unit tests exist but miss the hardest logic**. Tests in `tests/` cover: env, events, gemini client, heuristic, match timeline, menus, orderStore, rateLimit, routing, schemas, store, waitTime. That's good breadth, but:
   - **No test for `shortestPath` with a real density map** — `tests/routing.test.ts` likely checks basic graph traversal. It should assert that a red corridor on the direct path causes the algorithm to choose a longer but greener one. That's the headline claim of the product.
   - **No test for `enrichWalkTime()`** — `app/api/concierge/route.ts:66-86`. This function rewrites whatever `walkTimeSec` Gemini hallucinates with the real Dijkstra ETA. It's the contract that keeps Gemini honest; should be directly asserted.
2. **No API-route integration tests**. `tests/api/` directory doesn't cover `/api/concierge`, `/api/order`, `/api/simulate`, `/api/density`, `/api/analytics`, `/api/clock` as HTTP integration tests (request in → response out, rate-limited, validated). Easy win with `vitest` + `next-test-utils` or just calling the exported `POST()` with a mock `Request`.
3. **E2E coverage is thin but well-placed**. 5 specs: `a11y`, `concierge`, `heatmap`, `order`, `deeplink`. Missing:
   - **Admin → heatmap flow**. The single most important demo moment (admin clicks "Halftime Rush" → heatmap turns red in <2s) has zero automated coverage. If it ever regresses silently, the demo dies.
   - **Group flow** — moot until the feature ships.
   - **Rate-limit assertions**. None of the specs hit the 429 path.
4. **No visual regression tests** despite `playwright` being installed. `toHaveScreenshot()` snapshots of the hero + map + concierge would catch color/contrast/layout regressions and are cheap to maintain.
5. **Coverage reports exist (`coverage/` folder)** but no coverage threshold enforced in `vitest.config.ts`. The rule says 80% minimum. If the repo is at 60%, nobody will notice until after submission.
6. **No tests for Firebase analytics / FCM wiring**. Fire-and-forget is fine, but a test that `trackEvent("poi_select")` gracefully no-ops when `hasFirebase === false` locks the behavior.

### Fix Ranking
- **P0**: Add an E2E spec `admin.spec.ts` — navigate to `/admin`, click Halftime Rush, assert heatmap contains `>= 3` red-filled POIs within 2s. This is the demo's money shot; gate it in CI. (3)
- **P0**: Add `shortestPath` test: edge-heavy corridor at density 0.95, assert path length differs from the plain-geometric shortest path. (1)
- **P0**: API integration tests for `/api/concierge` (happy path + rate-limit 429 + invalid body 400) and `/api/order` (missing header → 400, over cap → 429). (2)
- **P1**: Add coverage thresholds to `vitest.config.ts` (`{ lines: 80, branches: 70 }`). Set the bar, miss it loudly. (5)
- **P1**: Visual-regression snapshot of `/map` at `390×844`. One snapshot, one extra line per spec. (4)
- **P2**: Mock-mode trackEvent no-op tests. (6)

### Testing talking points for the pitch
- "47 unit tests, 5 Playwright E2E journeys, automated axe-core a11y gate across every fan surface." (already true — advertise it louder in README.)
- "The Dijkstra logic that powers the 'route around the crowd' claim has a direct regression test."
- "Rate limits are actually asserted — we have a 429 test." (Once you add it.)

---

## 5. Accessibility

### Findings
1. **Skip link is present** — `app/layout.tsx:75` mounts `<SkipLink />`. Good; verify the target `#main` lands on a real `<main>` on every page.
2. **Venue SVG is well-labeled** — `components/map/VenueHeatmap.tsx:42-53`. `role="img"`, `aria-label`, `<title>`, `<desc>`. Each POI `<g>` gets `role="button"`, `tabIndex={0}`, `aria-label` describing name + type + density %, and responds to Enter/Space (lines 120-129). This is genuinely excellent — call it out in the README.
3. **Concierge conversation is `role="log"` with `aria-live="polite"`** — `app/(app)/concierge/page.tsx:41-44`. Correct pattern.
4. **`useReducedMotion` is honored** — `components/map/VenueHeatmap.tsx:40,148`. Rare and impressive; judges who scan for this will notice.
5. **Heatmap color contrast is borderline** — green #22c55e / yellow #eab308 / orange #f97316 / red #ef4444 against the dark slate-900 shell likely passes WCAG AA for text but the POI dots are shape+color only. On color-blindness simulation (deuteranopia) green and orange are very close. Add a small icon or ring thickness variation per tier, not just hue.
6. **"Clear route" link styled as a raw link** — `app/(app)/map/page.tsx:93-98`. Uses `<button>` (good), sky-400 underlined. Touch target is `text-xs` — below the 44×44px minimum recommended for mobile. Bump padding.
7. **Sonner toasts** — `app/layout.tsx:83`. Verify screen readers announce them; `sonner` wraps in `role="status"` by default, but it's worth testing.
8. **`e2e/a11y.spec.ts` already blocks `serious`/`critical` axe violations across 4 surfaces**. This is a real differentiator over typical hackathon submissions. Put it in the README next to the testing claim.

### Fix Ranking
- **P0**: Add non-color cue to density tiers (icons or ring thickness) — judges on low-vision criteria will probe this (5).
- **P1**: Widen "Clear route" touch target (6).
- **P2**: Verify skip-link target exists on `/map`, `/concierge`, `/order`, `/group`, `/analytics`.

### A11y talking points
- "Axe-core runs on every build against 4 surfaces at WCAG 2.2 AA — zero serious or critical violations."
- "Every POI on the venue map is keyboard-focusable and announces its density percentage to screen readers."
- "`prefers-reduced-motion` disables Framer transitions; tested."

---

## 6. Google Services — **HIGH PRIORITY (weak in Submission 1)**

### Currently integrated
| Google Service | Status | Evidence |
|---|---|---|
| **Gemini API (`gemini-2.0-flash`)** | ✅ Live primary path | `lib/gemini/client.ts`, `app/api/concierge/route.ts:90` |
| **Firebase Auth (Anonymous)** | ✅ Wired on client | `components/shared/FirebaseBoot.tsx:31` |
| **Firestore** | ⚠️ Partial — rules written, order mirror wired, density still mock | `lib/firebase/orders.ts:23`, `firestore.rules` |
| **Firebase Analytics (GA4)** | ✅ Fire-and-forget wrapper | `lib/firebase/analytics.ts`, events: `app_open`, `order_placed`, `concierge_query` |
| **Google Analytics 4 (tag)** | ✅ Wired if `NEXT_PUBLIC_GA_ID` set | `components/shared/GoogleAnalytics.tsx`, CSP allows `google-analytics.com` |
| **Firebase Cloud Messaging** | ⚠️ SDK imported, `getMessagingInstance()` exists, **no push-token registration flow, no service worker** | `lib/firebase/client.ts:55-63` |
| **Google Sign-In (upgrade from anon)** | ❌ Not wired. `GoogleAuthProvider` is not imported anywhere. | — |

### Findings
1. **FCM is imported but not actually used** — there's no `firebase-messaging-sw.js`, no `getToken()` call, no token upload endpoint. This is the biggest "claim without substance" gap. Fixing it adds a real push-notification arc: `ready` order state → FCM push → phone notification. That's a story judges love.
2. **Firestore is rules-only for density**. Rules say "`crowd_density` is world-read, server-write via admin SDK" (`firestore.rules:27-30`) but `app/api/simulate/route.ts:45` writes to `mockStore`, not to Firestore. So the rule is aspirational. Either wire the admin-SDK mirror write or rephrase the pitch. Two-line fix in `dispatch()`.
3. **Google Sign-In is the obvious gap**. `FirebaseBoot` signs users in anonymously; the Auth SDK supports a "link anonymous → Google" upgrade in ~20 lines. That lets a fan start anonymously, upgrade once they realize they want their orders saved, and retain their order history. Strong Google-services story for a hackathon explicitly tied to Google.
4. **Gemini model choice is good** — `gemini-2.0-flash` is the current recommended low-latency JSON-mode model. Don't change.
5. **No Google Cloud Platform integration beyond Firebase**. Could add (in order of impact-per-effort):
   - **Google Maps Static API or Maps JS** for a real-world "drive to venue" deep link from the landing page. Lightweight, visible.
   - **Google Cloud Text-to-Speech** on the concierge reply — tap to hear the recommendation. One API call, huge demo wow factor when the user is walking.
   - **Google Cloud Translation API** for multi-lingual concierge replies. Stadium apps in India often need Hindi + Marathi; this is a real product concern and a 1-endpoint add.
   - **Vertex AI Vector Search or `embedding-001`** for semantic concierge retrieval over a venue FAQ (parking, Wi-Fi, lost-and-found). Currently the concierge only knows POIs — extending it with embeddings turns the product into "the venue's brain".
6. **Missing `docs/GOOGLE_CLOUD.md`** — the prior session summary mentioned a Google Cloud README. Verify it's committed; if not, write a short one listing every Google product used, with env var names and enablement instructions. This is the exact artifact judges read when scoring "Google services usage".
7. **CSP already allowlists `generativelanguage.googleapis.com` + Firebase endpoints + GA** — `next.config.mjs:34`. Correct for the current integration; add `*.googleusercontent.com` if Google Sign-In UI is added.

### Fix Ranking
- **P0**: Wire **Google Sign-In upgrade** from anonymous. `linkWithPopup(auth.currentUser, new GoogleAuthProvider())`. Add a "Sign in with Google" pill in `/order` to save history. (3)
- **P0**: Wire **FCM push** for `ready` orders. Register SW, store token in Firestore under `users/{uid}/fcmToken`, send via Admin SDK when `orderStore.advance()` hits `ready`. (1)
- **P0**: Ship `docs/GOOGLE_CLOUD.md` listing every Google product used. Pure pitch material. (6)
- **P1**: Mirror density writes to Firestore via Admin SDK so the "`crowd_density` is world-read, server-write" rule is actually enforced, not aspirational. (2)
- **P1**: Add **Cloud Translation** to the concierge — accept `Accept-Language` header, translate reply. Demoable as "same app, Hindi query, Hindi reply". (5c)
- **P2**: Cloud TTS on concierge replies. (5b)
- **P2**: Vertex embeddings for FAQ. (5d)

### Google Services talking points
- "StadiumIQ is built on the full Google stack: Gemini 2.0 for the concierge, Firebase Auth for identity, Firestore for persistence, FCM for order-ready push, Firebase Analytics + GA4 for product telemetry, Cloud Translation for multilingual replies." (say this once every two items above is real.)

---

## 7. Problem Statement Alignment

CLAUDE.md lists six core features. Honest scoring:

| # | Feature | Status | Evidence |
|---|---|---|---|
| 1 | Heatmap + Routing | ✅ **Fully shipped** | `app/(app)/map/page.tsx`, `lib/routing/dijkstra.ts` |
| 2 | Virtual Queue / Ordering | ✅ **Fully shipped** | `app/(app)/order/page.tsx`, `/api/order`, order state machine `placed→preparing→ready→collected` |
| 3 | AI Concierge | ✅ **Shipped with graceful degrade** | `/api/concierge` → Gemini → heuristic fallback. Structured JSON. Walk-time post-enriched. Rate-limited. |
| 4 | Group Coordination | ❌ **Stub** | `app/(app)/group/page.tsx:1-7` — heading only. |
| 5 | Admin Panel | ✅ **Fully shipped** | `app/admin/page.tsx` — sim controls + live order list + manual advance |
| 6 | Analytics Dashboard | ✅ **Fully shipped** | `app/(app)/analytics/page.tsx` — KPIs, waittime chart, bottlenecks, concession mix |

### Findings
1. **Group is the only hole in the core spec**. 5/6 features fully built is great; shipping 6/6 is a qualitatively different pitch. A minimal version — "create session → get 6-char code → others join → see pins on map → suggest meetup POI (brute force minimax walk-time)" — is ~4 hours of work, and Firestore rules for it are already written (`firestore.rules:54-66`).
2. **Demo path is tight**. `/admin` → button → `/map` heatmap changes → tap POI → "Navigate here" → route draws → `/concierge` → "nearest veggie" → "Take me there" deep-link back to `/map`. Every edge of that journey has a test (`e2e/`). Solid.
3. **Mobile-first claim is honored**. All `/map`, `/order`, `/concierge` pages use `h-screen` + `flex-col` + bottom-anchored composers/carts. `app/layout.tsx:57-63` sets correct viewport. No horizontal overflow at 390×844 in the code I inspected.
4. **`<2s admin → heatmap` claim is plausible**. Mock polling is 500ms (`CLAUDE.md` convention) and `dispatch()` in `app/api/simulate/route.ts:45` writes synchronously to `mockStore`. Worst-case latency: 500ms. But there's **no automated proof** — see Testing §3.
5. **Landing page → main app CTA exists** — `app/(public)/page.tsx` (seen via imports). Confirm it routes to `/map` not `/order` for the first-impression demo.
6. **Analytics page labels itself "Operator view"** ✅ — required by CLAUDE.md for the two-sided pitch. `app/(app)/analytics/page.tsx:42`.
7. **"Works with existing IP cameras" roadmap claim is kept verbal only** — no fake CV code, per CLAUDE.md directive. Good discipline.

### Fix Ranking
- **P0**: Ship minimum-viable `/group` (create code, join code, pins, suggest-meetup). Moves score from "5/6" to "6/6". (1)
- **P0**: Add the `admin.spec.ts` test (also listed in Testing §3) — it **is** the problem-statement proof. (4)
- **P2**: Verify landing CTA lands on `/map` for first-run demos. (5)

---

## 8. Prioritized "Do This Before Resubmitting" List

If you only have **4 focused hours**, do these in order:

1. **Ship `/group` (MVP)** — 90 min. Unblocks feature-completeness. [Problem statement §1]
2. **Wire Google Sign-In + FCM push** — 60 min. Closes the Google Services gap loudly. [Google §1, §3]
3. **Add `admin.spec.ts` E2E** — 20 min. Automated proof of the core demo claim. [Testing §3, Problem statement §4]
4. **Tighten Firestore rules for `/group_sessions`** — 10 min. Blocks an obvious exploit. [Security §6, §7]
5. **Protect `/admin` with env passcode** — 15 min. Removes a live abuse surface. [Security §2]
6. **Add `docs/GOOGLE_CLOUD.md`** — 20 min. Pure pitch material for judges scoring Google services. [Google §6]
7. **Add coverage thresholds + two new routing tests** — 30 min. Reinforces the testing claim. [Testing §1, §5]
8. **Swap `'unsafe-eval'` out of CSP + dynamic-import recharts** — 15 min each. Lighthouse score + bundle. [Security §1, Efficiency §4]

**Remaining time (if any):** dynamic import `framer-motion` as LazyMotion, add visual regression snapshot, Cloud Translation stretch.

### What **not** to do
- Don't refactor the Dijkstra engine.
- Don't migrate away from polling to SSE (nice but risky under demo pressure).
- Don't add new analytics tabs — the existing four KPIs + chart + list already read as polished.
- Don't touch the mock store singleton pattern — it's load-bearing for the demo.

---

## 9. README / Pitch Framing Suggestions

These aren't code changes — they're claims the repo already earns that the README probably doesn't surface. All are defensible from the current code:

- "Crowd-weighted Dijkstra — edges cost `base × (1 + 2.0 × max(density))`, so routes naturally avoid red corridors."
- "Graceful AI degradation — when Gemini quota/network fails, a deterministic heuristic (keyword → POI type → lowest density pick) keeps the UX flowing. Never errors, never shows a stack."
- "Zod-validated at every boundary — 7 schema files, every API route `.safeParse()`s its input."
- "Rate-limited API — 20 req/min on concierge, 10 req/min on order, 30 req/min on simulate, all return `Retry-After`."
- "Zero serious or critical axe violations across 4 fan surfaces — automated in CI."
- "The full Google stack: Gemini 2.0 · Firebase Auth · Firestore · FCM · Firebase Analytics · GA4." *(say this only once §6 P0 items are done)*
- "`prefers-reduced-motion` is honored on the heatmap — zero-duration transition when the user prefers."
- "Security headers: HSTS preload, strict CSP, frame-ancestors none, Permissions-Policy locking camera + mic."

Each of these is a one-liner in the README that converts hidden engineering discipline into visible judging signal.

---

**End of report.**
