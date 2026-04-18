# StadiumIQ — Demo Script
**Target runtime: 3 minutes**  
**Rehearse 3× before presenting: once slowly, once at pace, once with a deliberate mistake.**

---

## Pre-demo setup (do this 10 min before)

1. Open browser in full-screen, hide bookmarks bar
2. Set DevTools device mode to iPhone 14 (390×844) OR present on a real phone
3. Open exactly these 6 tabs on the **live Vercel URL**:

| Tab | URL | Purpose |
|-----|-----|---------|
| 1 | `https://stadiumiq.vercel.app/` | Landing — first thing judges see |
| 2 | `https://stadiumiq.vercel.app/map` | Heatmap demo |
| 3 | `https://stadiumiq.vercel.app/concierge` | AI concierge |
| 4 | `https://stadiumiq.vercel.app/admin` | Pre-loaded, stay hidden until needed |
| 5 | `https://stadiumiq.vercel.app/order?poi=food-beer` | Order flow |
| 6 | `https://stadiumiq.vercel.app/analytics` | Operator view |

4. On Tab 4 (`/admin`), click **"Reset"** once to put crowd back to baseline
5. On Tab 3 (`/concierge`), clear any previous messages (refresh the tab)
6. Test wifi — open Tab 2 and verify POIs are colored

---

## The Script

---

### HOOK — 20 seconds

*[Screen: Tab 1 — Landing page]*

> "42,000 people. One stadium. The average fan spends **23 minutes** of a 3-hour event standing in lines — not watching the game. That's a broken experience, and it's a solved problem. Here's what matchday looks like with StadiumIQ."

*[Click "Open app →" — navigates to /map]*

---

### SCENE 1: The Fan Experience — 90 seconds

*[Screen: Tab 2 — `/map`]*

> "This is what a fan sees when they sit down. Live crowd density across the entire venue — every food stand, restroom, gate — color-coded in real time. Green means go. Red means avoid."

*[Point to the colored POI circles. Pause 2s.]*

> "Right now we're pre-game — everything is calm. But let me fast-forward to halftime."

*[Switch to Tab 4 — `/admin`. Keep it quick.]*

> "This is the admin panel — not visible to fans. One button."

*[Click "Halftime rush"]*

*[Immediately switch back to Tab 2 — `/map`]*

> "Watch the map."

*[Wait 2s — POIs turn red/orange. Let it land.]*

> "That's 500ms round-trip from server state to every connected client. Now normally a fan would just walk into the longest line. We built something smarter."

*[Switch to Tab 3 — `/concierge`]*

> "Our AI concierge. It has real-time access to live crowd density across every POI."

*[Type or click the chip: "Shortest beer line right now"]*

*[Wait for response — ~4s]*

> "It's not keyword matching. It's reasoning over live data. It knows Gate North is packed, it knows the west-side stand has a 45-second wait, and it picks the best option with an explanation."

*[Point to the recommendation card and reasoning text]*

> "And then—"

*[Click "Take me there"]*

*[Screen auto-navigates to `/map` with route drawn]*

> "It drops a route that actively **avoids the congestion** it just warned you about. Crowd-weighted Dijkstra on a 40-node venue graph, recalculates every time densities change."

---

### SCENE 2: Skip the Line — 30 seconds

*[Switch to Tab 5 — `/order?poi=food-beer`]*

> "Fan decides what to order. Picks items, places the order."

*[Tap "Add" on two items, click "Place order"]*

*[Pickup code appears]*

> "Four-digit pickup code. They walk to the stand when it's ready — no physical queue."

*[Switch to Tab 4 — `/admin`, show Active Orders section]*

> "Staff side — orders come in here. One tap advances the state."

*[Click "Advance" once — Preparing]*

> "Kitchen's on it."

*[Switch back to Tab 5 — show "Preparing" state]*

---

### SCENE 3: The Operator View — 30 seconds

*[Switch to Tab 6 — `/analytics`]*

> "This is the other half of the product. Venue operators get a live intelligence layer."

*[Point to the KPI cards]*

> "Average wait reduction — 38% versus no-app baseline. Revenue lift — because shorter queues mean more transactions. Fan NPS proxy."

*[Point to the bottleneck list]*

> "Top bottlenecks update live. Operators can redeploy staff in real time instead of guessing at half-time."

> "Fans use the app free. Venues pay for the platform. SaaS per venue, per season."

---

### CLOSE — 20 seconds

*[Back to Tab 1 — Landing page or stay on Analytics]*

> "TAM: 2,000-plus large venues globally — stadiums, arenas, convention centres. We're starting with tier-one football stadiums in South Asia."

> "Next up: real computer-vision crowd counting from existing IP cameras, Ticketmaster and SeatGeek integrations, and accessibility routing for wheelchair users."

> "That's StadiumIQ — the AI copilot for every seat in the house."

*[Stop. Don't fill silence.]*

---

## Timing guide

| Section | Target | Hard limit |
|---------|--------|------------|
| Hook | 20s | 25s |
| Scene 1 | 90s | 105s |
| Scene 2 | 30s | 40s |
| Scene 3 | 30s | 40s |
| Close | 20s | 25s |
| **Total** | **3m 10s** | **3m 55s** |

---

## Recovery plays

| What breaks | What you say | What you do |
|-------------|-------------|-------------|
| Concierge is slow (>6s) | "The AI is thinking — it's reading live crowd data from across the whole venue..." | Wait. It will respond. |
| Heatmap doesn't update | "Let me bring up the map on a fresh tab..." | Open new `/map` tab |
| Order toast doesn't fire | Skip it — say "the fan gets a push notification when it's ready" | Move on |
| Wifi drops entirely | "I'll play the recorded run — same product, recorded 10 minutes ago." | Play `docs/demo-backup.mp4` |
| Tab crashes | Reopen the URL from address bar | Takes 3s, looks intentional if you're calm |

---

## Rehearsal log

| Run | Date | Time | Notes |
|-----|------|------|-------|
| 1 (slow read) | | | |
| 2 (full pace) | | | |
| 3 (disruption drill) | | | |
