# User stories

StadiumIQ is a two-sided product. Fans are the primary persona because they carry the phone, but venue operators are the paying customer. The admin simulator is a demo artifact, not a user persona — it exists to prove the system reacts to live events.

These stories are written as acceptance-level, not epic-level. Each one points to the feature, file, and the E2E or unit test that pins its behavior.

---

## Persona 1 — The Fan (42,000 at a match)

### F1. Find food that isn't mobbed

> **As a fan** mid-match with 10 minutes of halftime, I want to see which food stand has the shortest line from where I'm sitting, so I don't waste my break standing in a queue.

- **Surfaces:** `/map`, `/concierge`
- **Behavior:** The heatmap colors POIs green → red by live density. Tapping a POI opens a sheet with current density, estimated wait (`estimateWaitSec`), and a "Navigate here" button that runs crowd-weighted Dijkstra.
- **Acceptance:**
  - Density updates reflect within 500ms of an admin event (`lib/mock/store.ts` poll cadence).
  - Wait time matches `density × 600` for food (`lib/mock/waitTime.ts`).
  - "Navigate here" draws an animated polyline along the least-crowded path.
- **Tests:** `tests/waitTime.test.ts`, `tests/routing.test.ts`, `e2e/heatmap.spec.ts`.

### F2. Ask in plain English

> **As a fan** who doesn't want to study a map, I want to type "nearest veggie food with no wait" and get a concrete recommendation, so the app does the thinking.

- **Surfaces:** `/concierge`
- **Behavior:** Chat UI posts the full history + `userLocation` to `/api/concierge`. Gemini is called with `responseMimeType: "application/json"` and a Zod-validated response schema. On any failure (quota, network, malformed JSON), a deterministic keyword heuristic takes over and returns a real crowd-aware recommendation — users never see raw errors.
- **Acceptance:**
  - Recommendation includes `poiId`, `poiName`, `walkTimeSec` (from Dijkstra, not hallucinated), `currentDensity`, `reason`.
  - "Take me there" deep-links to `/map?nav=<poiId>` and the route is pre-drawn on arrival.
  - Repeated rapid queries are rate-limited (20/min/IP) with a friendly "give me a few seconds" reply.
- **Tests:** `tests/heuristic.test.ts`, `tests/api/concierge.test.ts`, `tests/components/ChatMessage.test.tsx`, `e2e/concierge.spec.ts`, `e2e/deeplink.spec.ts`.

### F3. Skip the physical line

> **As a fan**, I want to order a burger from my seat and get a pickup code, so I can walk up when it's ready instead of standing in line.

- **Surfaces:** `/order`
- **Behavior:** Pick a concession, add items, tap Place Order. Backend validates cart (≤20 items, ≤20 qty per line), generates a 4-digit pickup code, creates an order with `state: "placed"`. Status updates drive the `placed → preparing → ready → collected` state machine with a toast + `aria-live` announcement when ready.
- **Acceptance:**
  - Pickup code is a unique 4-digit string.
  - Oversized carts return 400 with a validation error (DoS guard).
  - Missing `X-User-Id` header returns 400 (auth convention).
  - `OrderStatusCard` exposes an `aria-live="polite"` region describing the current state.
- **Tests:** `tests/orderStore.test.ts`, `tests/api/order.test.ts`, `tests/components/OrderStatusCard.test.tsx`, `e2e/order.spec.ts`.

### F4. Accessibility first

> **As a fan** using assistive tech or with reduced-motion preferences, I want the live updates to be discoverable without being disorienting.

- **Surfaces:** all app pages
- **Behavior:**
  - Every live region uses `role="log"` / `role="status"` + `aria-live="polite"`.
  - `useReducedMotion` drops Framer Motion transition durations to 0 when the user opts out.
  - Every interactive control has an accessible name (explicit `<label>` or `aria-label`).
- **Tests:** `tests/components/*.test.tsx` assert the ARIA attributes directly. See [`ACCESSIBILITY.md`](ACCESSIBILITY.md) for the full audit.

---

## Persona 2 — The Venue Operator

### O1. See what's actually happening in the building

> **As a venue operations manager**, I want a dashboard that shows me where bottlenecks are forming, so I can deploy staff before a crush turns into a complaint.

- **Surfaces:** `/analytics`
- **Behavior:** Read-only KPI dashboard — average wait time today, top 3 bottleneck POIs by density, revenue-lift estimate, NPS proxy. Numbers surface from the mock store in demo mode; the same code paths read from Firestore aggregations in production.
- **Acceptance:** dashboard renders without error even with an empty store; bottleneck list updates when `/admin` fires a density event.

### O2. Prove the system works before spending money

> **As a venue operations manager** evaluating StadiumIQ for next season, I want to see the heatmap react to the events that actually happen at our matches — halftime, goals, fourth quarters — so I can trust it.

- **Surfaces:** `/admin`
- **Behavior:** One-click buttons for `start_match`, `halftime_rush`, `goal_celebration`, `fourth_quarter_lull`, `reset` — each writes a preset density profile and propagates to every open client within ≤500ms.
- **Acceptance:** admin event → heatmap color change visible on the demo phone within 2 seconds.
- **Tests:** `tests/events.test.ts`, `tests/api/simulate.test.ts`.

---

## What we didn't build (and why)

These stories are valid product bets, but outside the 48-hour scope. They live in the pitch deck as roadmap:

- Real CV crowd counting from venue IP cameras — ops hardware lift, not a software demo.
- Ticketing partner SSO (Ticketmaster, SeatGeek) — depends on partnership BD.
- Wheelchair/sensory-low routing modes — extension of the existing graph weights; listed so operators know it's on the plan.
- Dynamic concession pricing — needs POS integration.

See `CLAUDE.md § Roadmap items` for the full "not built" list.
