# Metrics & telemetry

StadiumIQ measures two things: **does the product solve the user problem** (fan behavior) and **does it help venues operate** (operator KPIs). Every number in the analytics dashboard traces back to a concrete event emitted from the client and mirrored server-side.

---

## Event taxonomy (GA4 + Firebase Analytics)

All events are emitted via `lib/firebase/analytics.ts` → `trackEvent(name, params)`. Names are `snake_case` and follow the GA4 naming convention so events land in BigQuery without munging.

| Event | When it fires | Key params | What we learn |
|---|---|---|---|
| `app_open` | `(app)` layout mount | `entry_path` | Session count, entry surface mix (map vs concierge vs order) |
| `poi_selected` | User taps a POI marker | `poi_id`, `poi_type`, `density` | Which POIs get attention; do people tap red or green? |
| `route_drawn` | Dijkstra returns a path and it's rendered | `poi_id`, `eta_sec`, `nodes_in_path` | How long the average fan is willing to walk; congestion routing impact |
| `concierge_query` | User sends a concierge message | `length`, `had_recommendation` (after response) | Concierge activation rate; fallback-heuristic hit rate |
| `order_placed` | `/api/order` returns 200 | `poi_id`, `total_cents`, `item_count` | Funnel from view → order; avg order value |
| `order_ready_toast` | Order transitions to `ready` | `poi_id`, `time_from_placed_sec` | Pickup latency; operational KPI |
| `admin_event` | `/api/simulate` handler success | `event` | Demo-mode only; confirms the heatmap drove a state change |

Event payloads are capped at 100 chars per string param (GA4 limit). No PII flows into params — only IDs and densities.

---

## Fan-facing KPIs (shown as "Your impact" in future work)

These are **not yet** surfaced in-app but the events above are sufficient to compute them:

- **Time-in-queue saved per fan-session** = sum(expected-wait at `order_placed` − actual pickup latency from `order_ready_toast`).
- **Steps saved per route** = baseline straight-line distance − Dijkstra distance (both computed in SVG units, converted to meters at the venue calibration constant).
- **Stress reduction** (proxy) = `concierge_query` count with `action: "info"` vs `"navigate"` — a low info: nav ratio means fewer confused fans.

---

## Operator KPIs (`/analytics` dashboard)

The operator view surfaces these with mocked numbers in demo mode. The code paths are identical to the production read:

| KPI | Source | Mocked demo value |
|---|---|---|
| Average wait time (today) | `avg(order.updatedAt_ready − order.createdAt)` across all `ready` orders | 4m 12s |
| Top 3 bottleneck POIs | `topN(mockStore.getAll(), density desc, 3)` | halftime rush: food-burger, food-beer, restroom-nw |
| Revenue lift vs baseline | `(orders_today / orders_baseline) - 1` | +38% (mocked) |
| NPS proxy | `ratio(order_placed / concierge_query)` above threshold | 62 (mocked) |

---

## Latency targets (what we measure, not guess)

| Signal | Target | How we measure it |
|---|---|---|
| Admin event → heatmap color change on phone | ≤ 2s | `/admin` button press timestamp → density poll arrival (500ms poll interval) |
| Concierge query → structured reply | ≤ 3s (Gemini), < 50ms (heuristic fallback) | Server-side `fetchResponseMs` param on `concierge_query` event |
| Route render after tap | ≤ 300ms | Dijkstra over 40-node graph: measured < 5ms in `tests/routing.test.ts` |
| Order placed → UI confirmation | ≤ 200ms (mock mode, single region) | network-tab verified |

---

## Test coverage as a metric

`npm run test:coverage` writes a summary to `coverage/` and uploads it as a CI artifact (`.github/workflows/ci.yml`). Current numbers:

- **Unit + integration tests:** 18 files, 113 tests.
- **E2E tests:** 4 specs across 3 critical journeys (heatmap/POI sheet, concierge, order flow, deep-link).
- **Line coverage** on `lib/` + `hooks/` + `components/` (tracked layers): ~64% lines, ~87% branches at the time of writing.

Gaps we're consciously leaving uncovered:

- `/lib/firebase/*` (Firestore integration layer) — behind the `NEXT_PUBLIC_MOCK_MODE=false` branch; exercised manually in the Firebase emulator, not in CI, because it requires credentials.
- Client React entry points (`app/(app)/*/page.tsx`) — covered by Playwright E2E instead of RTL.
