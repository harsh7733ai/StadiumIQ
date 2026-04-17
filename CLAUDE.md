# StadiumIQ

> Mobile-first PWA that makes large sporting venues feel navigable — live crowd intelligence, virtual queues, and an AI concierge for attendees.

**Hackathon context:** 48-hour build. Speed and demo polish beat completeness. Every decision is made through that lens.

---

## What we're building

A PWA that stadium attendees open on their phone to:

1. **See live crowd density** as a heatmap on a floor-plan map of the venue.
2. **Get routed** from their seat to any point of interest via the least-crowded path.
3. **Order food/drinks** from concessions and skip the physical line (virtual queue + pickup code).
4. **Ask an AI concierge** natural-language questions like "nearest veggie option under 5-min wait" and get a pin + reasoning back.
5. **Coordinate with their group** via shared live pins + auto-suggested meeting points.

Plus a `/admin` control panel (hidden from judges until the demo) that simulates match events — halftime rush, goal celebration, 4th-quarter lull — to drive live heatmap changes during the pitch.

Plus a `/analytics` B2B dashboard showing venue-operator KPIs (avg wait time, bottleneck POIs, revenue lift). This reframes the product as a two-sided platform in the pitch.

---

## Stack (locked — do not re-evaluate)

- **Framework:** Next.js 14 App Router + TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui + Framer Motion for transitions
- **Backend/DB/Auth:** Firebase (Firestore realtime, Firebase Auth with Google sign-in, FCM for push)
- **LLM:** Anthropic Claude API (`claude-sonnet-4-5`) for the concierge, with structured JSON output
- **Validation:** Zod at every API boundary
- **Deployment:** Vercel (one command, free tier)
- **Maps:** Hand-traced SVG of venue floor plan — NOT Mapbox/Leaflet/Google Maps
- **Icons:** lucide-react only
- **Fonts:** Geist

If a library isn't on this list, ask before installing.

---

## File structure

```
/app
  /(public)
    page.tsx                 # Landing page
  /(app)
    /map                     # Main heatmap + routing view
    /order                   # Virtual queue / concessions
    /concierge               # AI concierge chat UI
    /group                   # Group session + shared pins
    /analytics               # B2B operator dashboard
  /admin                     # Demo control panel (hidden)
  /api
    /concierge/route.ts      # Claude API proxy
    /simulate/route.ts       # Admin: trigger match events
    /order/route.ts          # Place / update orders
/components
  /map                       # SVG venue, heatmap overlay, routing layer
  /ui                        # shadcn components
  /shared                    # Headers, nav, toasts
/lib
  /firebase                  # All Firestore reads/writes live here
  /routing                   # Dijkstra over POI graph
  /mock                      # Mock data generators (match timeline, crowd counts)
  /schemas                   # Zod schemas + inferred TS types
  /claude                    # Anthropic client + concierge prompt
/public
  /venue
    floor-plan.svg           # Hand-traced venue SVG
    pois.json                # POI definitions
    graph.json               # Routing graph: nodes + weighted edges
```

Keep this structure. Don't reorganize without a concrete reason.

---

## Conventions

- **Server components by default.** Add `"use client"` only when state, effects, or browser APIs are needed.
- **All Firestore calls go through `/lib/firebase/*.ts`.** Never call `getDoc` / `onSnapshot` directly in a component.
- **All API route inputs/outputs are Zod-validated.** Define the schema in `/lib/schemas/`, infer the TS type, export both.
- **No `any`.** Use `unknown` + narrow, or define the type.
- **No inline magic numbers.** Crowd thresholds, wait-time constants, match-event timings all live in `/lib/constants.ts`.
- **No comments unless the logic is non-obvious.** Good naming beats comments.
- **Mock data is toggled by `NEXT_PUBLIC_MOCK_MODE=true`.** Every data-layer function checks this flag and routes to `/lib/mock/` or Firestore accordingly. This is critical — the demo runs in mock mode.
- **Tailwind only.** No CSS modules, no styled-components, no inline `style={}` except for dynamic SVG coords.
- **Imports:** absolute paths via `@/` alias. No `../../../`.

---

## Feature specs

### 1. Heatmap + Routing (`/map`)

- Render `floor-plan.svg` with POI markers overlaid from `pois.json`.
- Subscribe to `crowd_density` Firestore collection — each doc keyed by `poiId`, value 0–1.
- Color each POI/region by density: green (0–0.3), yellow (0.3–0.6), orange (0.6–0.85), red (0.85–1).
- Tap a POI → bottom sheet with: name, current density, predicted wait, "Navigate here" button.
- "Navigate here" → run Dijkstra on `graph.json` with edge weights = `baseDistance * (1 + crowdPenalty)`. Draw the path as an animated polyline over the SVG.

### 2. Virtual Queue / Ordering (`/order`)

- List concession POIs with menu (hardcoded in `/lib/mock/menus.ts`, ~4 items each).
- User picks items → places order → Firestore doc created with state `placed`.
- Admin panel (or a mock scheduler) advances state: `placed → preparing → ready → collected`.
- On `ready`, trigger an in-app toast + FCM push (best effort — toast is enough for demo).
- Show a 4-digit pickup code on the order screen.

### 3. AI Concierge (`/concierge`)

- Chat UI (reuse shadcn patterns — message bubbles, input at bottom).
- On submit, POST to `/api/concierge` with `{query, userLocation}`.
- Server: inject current venue state (all POIs + current densities + user location) into the prompt, call Claude with a Zod-defined response schema, return parsed JSON.
- Response schema: `{ poiId: string, reasoning: string, walkTimeSec: number, action: "navigate" | "order" | "info" }`.
- UI: render reasoning as a message, render a "Take me there" button that deep-links to `/map?nav=<poiId>`.

### 4. Group Coordination (`/group`)

- User creates a session → 6-char code generated → Firestore doc with `members[]`.
- Others join by entering the code.
- Each member's current POI (or last-tapped location) becomes a live pin visible to the whole group.
- "Suggest meetup" button → pick the POI that minimizes max-walk-time across the group, weighted by current crowd density. Simple brute force over all POIs is fine; <100 POIs.

### 5. Admin Panel (`/admin`)

- Not linked from anywhere. Accessible only by URL.
- Buttons: `Start match`, `Trigger halftime rush`, `Trigger goal celebration`, `Trigger 4th-quarter lull`, `Reset`.
- Each button calls `/api/simulate` which updates `crowd_density` docs according to a preset profile.
- This is the single most important piece for the live demo. Build it early, test it often.

### 6. Analytics Dashboard (`/analytics`)

- Read-only. Shows: avg wait time today, top 3 bottleneck POIs, revenue lift vs. baseline, NPS proxy.
- Numbers can be computed from mock data or hardcoded to impressive-looking values. Label the page "Operator view" so judges understand the two-sided story.

---

## Mock data strategy

- `/lib/mock/matchTimeline.ts` — exports a function that given `(matchTimeMinutes, poiType)` returns a realistic density 0–1. Halftime spikes food POIs to 0.9+; gates spike pre-game and post-game.
- `/lib/mock/menus.ts` — concession menus.
- `/lib/mock/generator.ts` — sets an interval that writes density updates to Firestore every 3s when in mock mode.
- `/public/venue/pois.json` — 15 POIs minimum: 2 gates, 6 food stalls (mix of types: burger/veg/beer/coffee/pizza/dessert), 4 restrooms, 2 merch, 1 first aid.
- `/public/venue/graph.json` — ~30 nodes connecting POIs + corridor waypoints. Hand-authored.

---

## Demo constraints

These are non-negotiable. Violating any one kills the demo:

- **Must run in `NEXT_PUBLIC_MOCK_MODE=true`** with no external dependencies except the Claude API.
- **Must work on a phone-sized viewport.** Test at 390×844 (iPhone 14).
- **Must load in under 3 seconds** on throttled 4G. Keep the bundle tight — no unused shadcn components, no giant images.
- **Admin panel must visibly change the heatmap within 2 seconds** of button press. This is the demo's money shot.
- **Concierge must never return raw LLM text to the UI.** Always parsed JSON through the Zod schema. If parsing fails, show a friendly fallback, not an error.
- **No auth walls during demo.** Google sign-in is available but optional; the app works anonymously.

---

## Windows environment notes

- Dev machine is Windows. Path is `C:\Users\HARSH\...`.
- Use `npm` (not pnpm/yarn). Python 3.14 available if needed for data prep scripts.
- Shell is PowerShell. Do not chain commands with `&&` in suggested commands — use separate lines or `;`.
- Line endings: let Next.js defaults handle it. No manual CRLF/LF fights.
- When copying shell commands, prefer cross-platform Node scripts over bash one-liners.

---

## Commands

```
npm run dev          # Start dev server on :3000
npm run build        # Production build
npm run typecheck    # tsc --noEmit — must pass with zero errors
npm run lint         # ESLint
npm run seed         # Seed Firestore with initial POI docs (when ready)
```

Always run `typecheck` and `build` before declaring a session complete.

---

## What NOT to do

- **Don't install libraries not in the stack list** without asking.
- **Don't generate the venue SVG.** It will be hand-traced in Figma and dropped into `/public/venue/`.
- **Don't write real computer-vision code.** Crowd density is simulated. The pitch says "works with existing IP cameras" — that's a roadmap claim, not a build item.
- **Don't add authentication gates.** Google sign-in is optional enhancement only.
- **Don't implement real payment processing.** Orders are mock; "Pay" is a button that succeeds.
- **Don't over-engineer state management.** React Context + Firestore realtime is enough. No Redux/Zustand/Jotai unless a specific need appears.
- **Don't refactor working code for elegance.** Ship the demo.
- **Don't touch files outside the current session's scope** without stating the change explicitly.

---

## Session workflow

Every Claude Code session follows this pattern:

1. Read this file.
2. Restate the session goal in one sentence.
3. Output a file-level plan (what will be created/modified) and wait for approval.
4. Implement.
5. Run `npm run typecheck` and `npm run build`. Fix anything that breaks.
6. Summarize what shipped + propose a conventional commit message.

If context gets long or stale, `/clear` and re-anchor on this file.

---

## Roadmap items (for the pitch, not the build)

Mention these verbally in the demo as "next up" — do NOT build them:

- Real computer-vision crowd counting from venue IP cameras.
- Ticketing partner integrations (Ticketmaster, SeatGeek).
- Wheelchair-accessible + sensory-low routing modes.
- Dynamic concession pricing during low-demand windows.
- Sponsorship/ad surfaces ("Nike popup, 2-min walk").
- Multi-venue operator platform.
