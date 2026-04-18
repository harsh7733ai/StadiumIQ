# StadiumIQ — Live URL Demo Checklist

Run every item against the **deployed Vercel URL**, not localhost.  
Check off each item before going on stage.

---

## Pre-demo browser setup

Open six tabs on the live URL before you walk on stage:

| Tab | URL |
|-----|-----|
| 1 | `/` (landing page) |
| 2 | `/map` |
| 3 | `/concierge` (fresh, chips visible) |
| 4 | `/admin` |
| 5 | `/order?poi=food-beer` |
| 6 | `/analytics` |

---

## Smoke tests

### Landing & navigation
- [ ] `/` loads — hero visible, tagline renders, glow effect present
- [ ] NavBar "Open app →" link navigates to `/map`
- [ ] `/not-found` renders on-brand 404 (visit any garbage URL to test)

### Map & heatmap
- [ ] `/map` loads, POI circles visible on SVG floor plan
- [ ] POI circles are colored (green/yellow/orange/red) — not all white
- [ ] User marker (blue dot) visible near centre of map
- [ ] Tapping/clicking a POI opens bottom sheet with name + wait time
- [ ] "Navigate here" button draws an animated route polyline
- [ ] ETA appears in bottom sheet after route draws
- [ ] "Clear route" removes the polyline

### Admin → heatmap propagation (THE MONEY SHOT)
- [ ] Open `/admin` in Tab 4, open `/map` in Tab 2 side-by-side (or alternate tabs)
- [ ] Click **"Halftime rush"** in admin
- [ ] Within **2 seconds** food POI circles on `/map` turn red/orange
- [ ] Click **"Reset"** — circles return to low-density green/yellow

### Concierge
- [ ] `/concierge` loads with greeting message and quick-reply chips
- [ ] Clicking a chip auto-submits the question
- [ ] Typing "shortest beer line right now" returns a structured recommendation in **<6s**
- [ ] Response shows reasoning text + recommended POI name
- [ ] "Take me there" button is visible on recommendation cards
- [ ] Clicking "Take me there" navigates to `/map?nav=<poiId>` with route pre-drawn

### Ordering
- [ ] `/order?poi=food-beer` shows menu items with prices
- [ ] Tapping "Add" increments cart
- [ ] "Place order" button submits and shows 4-digit pickup code
- [ ] Order status shows "Placed" state
- [ ] In `/admin`, order appears in Active Orders section
- [ ] Clicking "Advance" in admin walks state: Placed → Preparing → Ready
- [ ] When state reaches **Ready**, in-app toast fires on the order page

### Analytics
- [ ] `/analytics` loads with 4 KPI cards (Avg Wait, Revenue Lift, Fan NPS, Active Fans)
- [ ] Wait-time area chart renders with data points
- [ ] Top Bottlenecks list shows 3 POIs with colored bars
- [ ] Concession Mix bars sum to 100%
- [ ] After "Halftime rush" in admin, KPIs refresh within ~3s

### Mobile viewport
- [ ] Resize browser to **390×844** (iPhone 14) or use DevTools device mode
- [ ] Bottom tab bar visible: Map / Concierge / Order / Profile
- [ ] All four tab pages are usable at mobile width
- [ ] No horizontal overflow on any page

### Performance
- [ ] Lighthouse mobile audit on `/` scores **≥ 85 Performance**
- [ ] `/map` first meaningful paint < 3s on throttled 4G (DevTools Network: Slow 4G)

---

## Known acceptable issues (non-blocking)
- `/group` page is a stub — not part of demo script
- Concierge may take 4–6s on first call (cold Lambda + Claude API); subsequent calls are faster
- Lighthouse score may dip slightly if Anthropic API is slow during audit

---

## If something breaks on stage

| Problem | Recovery |
|---------|---------|
| Heatmap not updating | Refresh `/map` tab — MockSimulationBoot will restart |
| Concierge timeout | Refresh `/concierge`, try again once — usually a cold start |
| Order state lost | Place a new order, advance it fresh |
| Vercel down / wifi dead | Play `docs/demo-backup.mp4` |
