# Accessibility

StadiumIQ is a venue app. Real users include fans with visual impairments, motion sensitivities, slow-thumb mobility, and non-English primary languages. Every decision on this page is made with those fans in mind — not as a compliance checkbox.

Target: **WCAG 2.2 AA** for the critical fan surfaces (`/map`, `/concierge`, `/order`). The operator dashboard (`/analytics`) and admin panel (`/admin`) are internal surfaces and held to AA where practical, but not the primary audit focus.

---

## What we got right

### Semantic landmarks and live regions

Every screen uses a single `<main>`. Dynamic content regions are labeled:

| Surface | Role | Element |
|---|---|---|
| Concierge conversation | `log` + `aria-live="polite"` + `aria-relevant="additions"` | `app/(app)/concierge/page.tsx` — message list |
| Concierge "Thinking…" | `status` + `aria-live="polite"` | same file, loading indicator |
| Order status card | `status` + `aria-live="polite"` + `aria-label={"Order {code} at {poi} is {state}"}` | `components/order/OrderStatusCard.tsx` |
| Route overlay SVG | `role="img"` + `aria-label="Crowd-weighted path through N segments..."` | `components/map/RouteOverlay.tsx` |

### Named controls — no icon-only buttons without labels

- Concierge send: `<Button aria-label={loading ? "Sending question" : "Send question"}>`.
- Concierge input: wrapped in a `<form role="search">` with an explicit `<label for="concierge-input" className="sr-only">`.
- Order quantity steppers: each has an `aria-label` like "Add one Burger".

### Reduced-motion compliance

`useReducedMotion` is consulted in every animated component. When the user has `prefers-reduced-motion: reduce`:

- Heatmap POI fill transitions drop from 400ms ease-out to 0ms.
- Route polyline `pathLength` animation is suppressed.
- Framer Motion's `<motion.div>` containers still render, but their `transition={{ duration: 0 }}` effectively disables the animation.

We kept the React state changes identical so the *result* of an animation (color change, path appearing) is still communicated — we just remove the motion.

### Color contrast and non-color signaling

- Density color scale is backed up by semantic text: "Low / Moderate / High / Critical" labels + `XX%` numeric density. Color-blind users see the same information.
- The density legend on `/map` has icon-free text labels with at least 4.5:1 contrast against the slate-950 background.
- Interactive slate-700 borders on touchable cards hit 3:1 contrast (WCAG AA for non-text UI).

### Keyboard

- Tab order is source order. No custom `tabindex` games.
- Enter submits the concierge composer (`onKeyDown` handler in `ComposerBar.tsx`).
- Escape closes the POI detail sheet via shadcn's `Sheet` primitive defaults.
- Focus is returned to the input after concierge send.

### Viewport + responsive

- Primary target is 390×844 (iPhone 14). Everything must fit without horizontal scrolling at that size.
- Text scales with user zoom up to 200% without clipping — we use `clamp()` for the hero numbers in order status.

---

## Where we fall short (honest list)

### 1. Heatmap SVG is visual-first

The `/map` heatmap is primarily a visual tool. We mitigate by:
- Every POI has a `<title>` element exposing the name + density to screen readers.
- The bottom sheet (keyboard-accessible) is the canonical way to interact with a POI; tapping the SVG is a convenience, not a requirement.

**Known gap:** A screen-reader-only *list* view of POIs with their current density + nav buttons would be a stronger alternate path. Tracked as a follow-up.

### 2. Admin panel is not translated

The `/admin` surface is in English only because it's an internal demo tool. Fan surfaces use plain-English copy that lands well in machine translation; a full i18n pass is roadmap.

### 3. Motion remains in the pickup-code reveal

Order state transitions animate the pickup code with a spring. Reduced-motion users get a cross-fade instead of the bounce, but the code still appears. We chose not to remove the animation entirely because the state transition is the critical signal — it just has to be non-distracting.

---

## How it's tested

- **Automated ARIA assertions** in `tests/components/OrderStatusCard.test.tsx` and `tests/components/ChatMessage.test.tsx` pin the accessible names and roles.
- **Playwright locators** in `e2e/*.spec.ts` address elements by `getByRole` / `getByLabel`, not CSS — so if an a11y attribute regresses, the E2E suite breaks.
- **Manual audit (pre-submission):** full keyboard-only walkthrough of the fan flow + VoiceOver pass on iOS.

Not automated (yet): axe-core or Pa11y in CI. Candidate for a Tier C follow-up.

---

## What a11y would look like in production

Two things we'd add before GA:
1. **Live captions on the concierge voice-input** (once we add it) using the Web Speech API.
2. **Ticket-integrated accessibility profile** — a fan's stored preferences (reduced motion, high contrast, accessible routing) could come through the ticketing partner SSO and pre-configure the app.

Both are roadmap items, not demo items.
