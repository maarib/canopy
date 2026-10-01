# Canopy: Product Requirements Document

| | |
|---|---|
| **Product** | Canopy: fall colours across Canada (responsive web app / PWA) |
| **Owner** | @maarib |
| **Status** | Draft v1 · 2026-09-30 |
| **Related** | [Technical plan](PLAN.md) · [GitHub issues](https://github.com/maarib/canopy/issues) |

---

## 1. Summary

Every fall, millions of Canadians and visitors try to answer the same three questions: **Where are the colours right now? When will they peak where I want to go? What should I do when I get there?** The answers are scattered across provincial park reports, tourism PDFs, social media and guesswork, and most of the country isn't covered by anyone.

Canopy is one map-first app that answers all three for all of Canada. It covers every tree type, every park and the trails, with live conditions, forecasts and a trip plan you can take with you.

**What exists today (Milestones 0–1):** live map, Ontario Parks official reports (daily), iNaturalist colour sightings with a tree-type filter, Parks Canada trails, satellite and 3D terrain, region/park pages with a 7-day colour outlook, and a responsive bottom sheet.

---

## 2. Problem

| Pain | Evidence |
|---|---|
| **Data is fragmented by province** | Ontario Parks publishes per-park %s; Bonjour Québec a weekly regional map; Nova Scotia a PDF; most provinces nothing. |
| **"Peak" is a moving target** | Peak varies by 2–3 weeks year to year with temperature and rain. Static "best time to visit" articles are often wrong. |
| **Timing and planning are separate jobs** | People find colour in one place, check weather in another, find trails in AllTrails, then book on a park site. |
| **No national picture** | The best-known US tool (SmokyMountains.com's prediction map) is US-only. Nothing equivalent exists for Canada. |
| **Trees ≠ "foliage"** | Larch gold in the Rockies (mid-Sept), aspens on the Prairies, sugar maples in Ontario/Québec and blueberry barrens in Nova Scotia peak at different times. Nobody lets you track by tree. |

---

## 3. Goals, non-goals and success metrics

### Goals
1. **Answer "where is it colourful now?" in under 5 seconds** on any device.
2. **Predict peak timing per area** with a stated confidence and a "best week to go" recommendation.
3. **Turn a colourful place into a plan:** trails, viewpoints, waterfalls, weather, directions and booking within 2 taps.
4. **Cover all of Canada** by combining official, crowd and satellite sources, and be transparent about which is which.
5. **Build a community of reporters** who keep the map fresh.

### Non-goals (for now)
- Turn-by-turn navigation or GPS track recording (hand off to Google Maps / AllTrails).
- Our own campsite booking (deep link to Parks Canada, Ontario Parks, Sépaq, BC Parks…).
- Native iOS/Android apps (a PWA first; revisit after season 1).
- Non-foliage seasons (spring bloom, winter) are a later expansion.

### Success metrics (season 2027, Sept 1 – Nov 15)
| Metric | Target |
|---|---|
| Weekly active users at peak (early Oct) | 25k |
| Map → place page tap-through | ≥ 40% of sessions |
| Place page → outbound action (directions / book / trail) | ≥ 20% |
| Saved places per returning user | ≥ 3 |
| Community colour reports / week at peak | 1,000+ |
| % of populated Canada (by area) with a status ≤ 7 days old | ≥ 80% |
| Peak forecast error (median, vs official reports) | ≤ 5 days |
| Core Web Vitals (mobile, p75) | LCP < 2.5 s, INP < 200 ms, CLS < 0.1 |

---

## 4. Users

| Persona | Who | Primary job | Key needs |
|---|---|---|---|
| **The weekend planner** (primary) | 28–55, drives 1–4 h from a city (Toronto, Montréal, Ottawa, Halifax, Calgary, Vancouver) | "Pick the best weekend and place for colour" | Peak forecast, drive time, weather, crowds, trails, booking |
| **The spontaneous local** | Lives near colour, decides same day | "Is it good near me today?" | Near-me status, today's weather, short walks, photos |
| **The visitor** | Out-of-province or international tourist planning weeks ahead | "When should I come and where should I go?" | Historical peak windows, regions overview, itineraries, EN/FR |
| **The photographer** | Hobbyist/pro chasing light and colour | "Where's peak + good light + good weather this week?" | Satellite view, viewpoints, sunrise/sunset, cloud forecast, recent photos |
| **The naturalist / contributor** | Tree enthusiast, iNat user, park staff | "Share what I'm seeing; learn trees" | Fast reporting, species ID help, recognition |

---

## 5. Key user journeys

1. **Glance:** open app → map centred on my area → colour stages visible → tap a hotspot → see status, photos and outlook. *(P0)*
2. **Plan a weekend:** set "this weekend" + "within 3 h of me" → ranked list of places near peak with good weather → open a park → pick 2 trails + a lookout → save to a trip → get directions/booking. *(P0/P1)*
3. **When to visit:** pick a region → see typical peak window, this year's forecast and a week-by-week chart → set an alert. *(P1)*
4. **Follow a tree:** filter "Larches" → see where they're gold now → species page with ID tips and best places. *(P1)*
5. **Report:** at a spot → "Report colour" → photo → auto location → two sliders (colour %, leaf fall %) → tree chips → submit in under 30 s. *(P1)*
6. **Get told:** follow places → get "Algonquin is at peak" or "wind storm Friday: go before" notifications. *(P2)*

---

## 6. Competitive landscape

| Product | What they do well | Gap we fill |
|---|---|---|
| **SmokyMountains.com foliage map** (US) | Week-by-week prediction slider by county. Iconic, viral every year. | US-only; no live ground truth, trails or planning. → *We borrow the time slider and add live data.* |
| **Leaf Peepr** (Yankee Magazine, New England) | Community reports with photos and ratings | Regional; dated UX. → *Our reporting flow.* |
| **ExploreFall** | Simple prediction map | US-only, no depth |
| **Ontario Parks Fall Colour Report** | Authoritative %s per park, viewing tips | Ontario only; basic map. → *Our ingested data.* |
| **Bonjour Québec colour map** | Weekly regional stages | Québec only; not mobile-first |
| **AllTrails** | Trail discovery, conditions, photos, offline maps, lists | No colour/peak intelligence. → *Hand off to them; borrow trail card and conditions patterns.* |
| **Windy / Ventusky** | Beautiful animated weather layers and timeline | Not foliage-aware. → *Timeline scrubber and layer UX.* |
| **Google / Apple Maps** | Place cards, bottom sheets, directions | Not seasonal. → *Sheet and place-card patterns; directions hand-off.* |

**Positioning:** *"The fall colour forecast for Canada: live, local, and ready to plan."*

---

## 7. Design direction and pattern library

> Mobbin's MCP connection requires a paid Mobbin plan, so these references come from public product knowledge. Design task **D-01** covers collecting Mobbin screen references for each pattern once access is available.

| Pattern | Inspiration | How Canopy uses it |
|---|---|---|
| **Persistent, resizable bottom sheet** (peek / half / full) over a live map | Google Maps, Apple Maps, AllTrails | ✅ Built. Add a search bar in the sheet header (Apple Maps style) and keep context while expanded. |
| **Place card** (hero photo, status chips, quick actions row: Directions · Save · Share · Book) | Google Maps place sheet, AllTrails trail card | Park/region/trail pages lead with the colour stage chip plus a quick-action row. |
| **Filter chips over the map** | Google Maps category chips, Airbnb | ✅ Tree filter. Add "This weekend", "Near me", "Peak only", drive time. |
| **Layer picker with thumbnails** | Apple Maps, AllTrails, Gaia | Upgrade the Layers popover into a sheet with map-type thumbnails (Standard / Satellite / Terrain) and overlay toggles. |
| **Timeline scrubber** for time-based data | Windy, Ventusky, SmokyMountains slider | Season scrubber Sept → Nov: animate history and forecast. **Signature interaction.** |
| **Split list + map (desktop)** | Airbnb web, Zillow | Desktop Explore: ranked list on the left, map syncs on hover. |
| **Conditions module** | AllTrails conditions, Apple Weather, Carrot | "Colour outlook" card: 7-day strip, frost/wind alerts, sunrise/sunset, AQ/smoke. |
| **Collections / lists** | AllTrails lists, Google Maps saved lists, Pinterest | "Trips": saved places grouped into an itinerary with an order and day labels. |
| **Lightweight UGC submission** | Leaf Peepr, Waze report, iNaturalist | Under-30-second report flow with sliders and chips; photo optional. |
| **Story-style photo feed** | Instagram stories, AllTrails photos | "Colour now" feed per region: recent photos, swipeable. |
| **Onboarding with personalization** | Duolingo, AllTrails | 3 steps: home area → favourite trees → notification opt-in. Skippable. |
| **Map styling** | Felt, Mapbox Standard, onX | Calm warm basemap; data is the hero; 3D terrain for mountain parks. |

### Visual language
- **Palette:** maple `#c8102e`, pumpkin `#e8730c`, birch `#e9b824`, spruce `#2f5d3a`, bark `#3b2f2a`, mist `#f6f1ea`. The stage scale runs green → gold → orange → red → brown and stays colour-blind safe (checked with simulators; paired with labels/icons).
- **Type:** **Londrina Solid** for display titles and headings (400; 900 for the wordmark) and **Livvic** for everything else: body, labels, captions (400–700).
- **Icons:** [Relume icons](https://www.npmjs.com/package/relume-icons) (MIT, rounded outline style, tree-shaken) for UI controls and actions. Weather keeps its emoji, and the maple-leaf pins stay as the brand mark. The package has 60 icons and no outdoor/POI set, so POI icons (waterfall, lookout, trailhead…) are custom (D-05).
- **Motion:** sheet springs, fly-to camera moves, and a falling-leaf micro-animation reserved for "peak" moments only.
- **Tone:** warm, local, precise. "Algonquin is at peak, about 90% colour. Go before Friday's wind."

---

## 8. Information architecture

**Mobile (tab bar):** `Map` · `Explore` · `Trips` · `Report` (centre action) · `Me`
**Desktop:** top nav with the same destinations; Map/Explore use a split layout.

| Screen | Purpose |
|---|---|
| **Map (home)** | Live colour map, filters, layers, timeline scrubber, sheet with context |
| **Explore** | Ranked "best now / this weekend" list with filters (drive time, tree type, activity) |
| **Region page** | Overview: stage, forecast, typical window, top parks/trails/viewpoints, photos, weather |
| **Park page** | Official report, colour outlook, trails, POIs, booking, photos |
| **Trail page** | Map preview, length/elevation, scenic score, colour along the trail, AllTrails link, GPX |
| **POI page** | Waterfall / lookout / lake / scenic drive with photos and best time of day |
| **Tree type page** | Colour, timing, ID tips, where it's turning now |
| **Trips** | Saved places → itinerary → directions/export/share |
| **Report flow** | Photo → location → sliders → trees → submit |
| **Me** | Account, followed places, notifications, my reports, settings (units, language, theme) |

---

## 9. Requirements

Priority: **P0** = must for season-2027 launch · **P1** = should · **P2** = later.
Status: ✅ done · 🟡 partial · ⬜ not started.

### 9.1 Live colour map
| ID | Requirement | P | Status |
|---|---|---|---|
| MAP-1 | Map of Canada with official reports styled by colour stage | P0 | ✅ |
| MAP-2 | Crowd sightings (iNat + ours) as hexes that turn into points when zoomed in | P0 | ✅ |
| MAP-3 | Tree-type filter | P0 | ✅ |
| MAP-4 | Layers sheet with map-type thumbnails + overlays (satellite, terrain, trails, weather, smoke) | P1 | 🟡 |
| MAP-5 | **Season timeline scrubber** (history → today → forecast), animated playback | P0 | ⬜ |
| MAP-6 | Unified **colour status surface**: a continuous % colour / % fallen field from blended sources, with confidence | P0 | ⬜ |
| MAP-7 | "Near me" locate button and first-load centring on the user's region (with permission) | P0 | ⬜ |
| MAP-8 | Search places (parks, towns, trails) with autocomplete | P0 | ⬜ |
| MAP-9 | Map performance: 60 fps pan on mid-range phones; vector data in PMTiles for national layers | P1 | ⬜ |

### 9.2 Data coverage and status model
| ID | Requirement | P | Status |
|---|---|---|---|
| DATA-1 | Ontario Parks daily ingest | P0 | ✅ |
| DATA-2 | Québec (Bonjour Québec regional stages, Sépaq parks) ingest | P0 | ⬜ |
| DATA-3 | Atlantic (NS, NB, PEI, NL) + Prairies + BC sources or curated weekly updates | P1 | ⬜ |
| DATA-4 | iNat green/coloured/bare **counts per grid cell** (UTFGrid or count queries) for a real % | P0 | ⬜ |
| DATA-5 | Historical peak dates per cell from VIIRS/MODIS phenology (2012–2025) | P0 | ⬜ |
| DATA-6 | Forecast model: historical peak ± temperature anomaly (ECCC/Open-Meteo) → peak date + confidence | P0 | ⬜ |
| DATA-7 | Tree species distribution per region from SCANFI/NFI | P1 | ⬜ |
| DATA-8 | Freshness and source labels on every status ("Official · 2 days ago", "12 sightings this week") | P0 | 🟡 |
| DATA-9 | Data-health monitoring (failed scrapes, stale sources) with alerts | P1 | ⬜ |
| DATA-10 | Data partnerships outreach (Ontario Parks, Sépaq, Tourism NS, Parks Canada) | P1 | ⬜ |

### 9.3 When to go
| ID | Requirement | P | Status |
|---|---|---|---|
| WHEN-1 | Per-place typical peak window (historical) | P0 | 🟡 curated |
| WHEN-2 | This year's forecast peak + "best week to go" badge | P0 | ⬜ |
| WHEN-3 | Week-by-week colour curve chart per place (history band + this year) | P1 | ⬜ |
| WHEN-4 | "Plan a future trip": pick dates → best places for those dates | P1 | ⬜ |

### 9.4 Places: regions, parks, trails, points of interest
| ID | Requirement | P | Status |
|---|---|---|---|
| PLACE-1 | Region and park pages with status, outlook, photos, links | P0 | ✅ |
| PLACE-2 | Quick-action row: Directions · Save · Share · Book · AllTrails | P0 | 🟡 |
| PLACE-3 | Trail pages from Parks Canada + OSM (length, elevation profile, scenic/colour score) | P0 | ⬜ |
| PLACE-4 | POIs: waterfalls, lookouts, lakes, scenic drives (OSM Overpass + curated) | P0 | ⬜ |
| PLACE-5 | Curated content: "Top 5 things to do in X this fall" per region (editorial) | P1 | ⬜ |
| PLACE-6 | Expand seed regions from 15 → 60+ covering every province | P0 | ⬜ |
| PLACE-7 | Crowd/busyness hints (weekend vs weekday) where data exists | P2 | ⬜ |

### 9.5 Trees and species
| ID | Requirement | P | Status |
|---|---|---|---|
| TREE-1 | Tree type pages (colours, timing, ID tips, photos, where turning now) | P1 | ⬜ |
| TREE-2 | "What tree is this?" helper linking to iNat ID | P2 | ⬜ |
| TREE-3 | Species mix per region ("Mostly sugar maple + yellow birch") | P1 | ⬜ |

### 9.6 Weather and climate
| ID | Requirement | P | Status |
|---|---|---|---|
| WX-1 | 7-day colour outlook (vivid / leaf-drop / frost) | P0 | ✅ |
| WX-2 | Switch weather source to ECCC GeoMet for commercial safety (Open-Meteo fallback) | P0 | ⬜ |
| WX-3 | Leaf-drop risk alerts (wind gusts, heavy rain) on place pages and map | P1 | ⬜ |
| WX-4 | Sunrise/sunset, golden hour, cloud cover (photographer mode) | P1 | ⬜ |
| WX-5 | Wildfire smoke / AQHI overlay and warnings | P1 | ⬜ |
| WX-6 | Climate context: this season vs normal (temperature anomaly) | P2 | ⬜ |

### 9.7 Discovery and Explore
| ID | Requirement | P | Status |
|---|---|---|---|
| EXP-1 | Ranked "Best right now" and "Best this weekend" lists | P0 | ⬜ |
| EXP-2 | Filters: drive time from me, tree type, activity (walk/hike/drive/paddle), accessibility | P0 | ⬜ |
| EXP-3 | Drive-time isochrones (OpenRouteService / Valhalla) | P1 | ⬜ |
| EXP-4 | Desktop split list + map, hover sync | P1 | ⬜ |

### 9.8 Trips and planning
| ID | Requirement | P | Status |
|---|---|---|---|
| TRIP-1 | Save places/trails/POIs (works signed-out, local; syncs when signed in) | P0 | ⬜ |
| TRIP-2 | Trips: group saves, order stops, day labels, notes | P1 | ⬜ |
| TRIP-3 | Multi-stop Google Maps directions link | P0 | ⬜ |
| TRIP-4 | Export: GPX (trails), .ics (dates), shareable trip link | P1 | ⬜ |
| TRIP-5 | Booking deep links for every park system (Parks Canada, Ontario Parks, Sépaq, BC Parks, NS, NB…) | P0 | 🟡 |
| TRIP-6 | AllTrails / Google Maps / Apple Maps hand-off buttons | P0 | 🟡 |

### 9.9 Community
| ID | Requirement | P | Status |
|---|---|---|---|
| COM-1 | Report flow: photo (optional), location, colour %, leaf fall %, trees, note | P0 | ⬜ |
| COM-2 | Photo storage, EXIF location/time, image resizing, content moderation | P0 | ⬜ |
| COM-3 | Report weighting: freshness, reporter reputation, agreement with neighbours | P1 | ⬜ |
| COM-4 | "Colour now" photo feed per region | P1 | ⬜ |
| COM-5 | Reporter profile, badges, streaks | P2 | ⬜ |
| COM-6 | Optional cross-post to iNaturalist | P2 | ⬜ |

### 9.10 Notifications
| ID | Requirement | P | Status |
|---|---|---|---|
| NOTIF-1 | Follow a place → alert when it reaches near-peak/peak | P1 | ⬜ |
| NOTIF-2 | Weather-risk alert for followed places ("Wind Friday, go Thursday") | P1 | ⬜ |
| NOTIF-3 | Weekly fall digest email | P2 | ⬜ |
| NOTIF-4 | Web push (PWA) | P1 | ⬜ |

### 9.11 Accounts and platform
| ID | Requirement | P | Status |
|---|---|---|---|
| PLAT-1 | Routing with shareable URLs for every place, filter and map state | P0 | ⬜ |
| PLAT-2 | Accounts (email magic link + Google/Apple) | P1 | ⬜ |
| PLAT-3 | Backend API (Cloudflare Workers + D1 + R2 + KV) for reports, saves, cached data | P0 | ⬜ |
| PLAT-4 | PWA: service worker, offline park/trail pages, install prompt | P1 | 🟡 manifest |
| PLAT-5 | Bilingual EN/FR, including place names and content | P0 | ⬜ |
| PLAT-6 | Accessibility WCAG 2.1 AA (keyboard map, screen-reader place lists, contrast) | P0 | ⬜ |
| PLAT-7 | Privacy-friendly analytics (Plausible/Umami) + event plan | P0 | ⬜ |
| PLAT-8 | Error monitoring (Sentry) | P0 | ⬜ |
| PLAT-9 | SEO: prerendered region/park pages, OG images ("Algonquin: Peak · Oct 2") | P1 | ⬜ |
| PLAT-10 | Hosting + CI/CD + preview deploys (Cloudflare Pages) | P0 | 🟡 CI |

---

## 10. Analytics event plan (privacy-first, no personal data)

`map_view`, `layer_toggle{layer}`, `tree_filter{group}`, `timeline_scrub{date}`, `place_open{type,id}`, `outbound{kind: directions|book|alltrails|park_site}`, `save{type}`, `trip_create`, `report_start`, `report_submit{has_photo}`, `notif_optin`, `search{has_results}`.

---

## 11. Release plan

| Milestone | Theme | Target | Highlights |
|---|---|---|---|
| **M0–M1** ✅ | Foundations + live map | Sep 30 2026 | Done |
| **M2** | Season-now quick wins | **Oct 15 2026** (peak still on in QC/Maritimes/S. ON) | URL routing, search, near me, Québec data, deploy publicly, analytics, quick-action row |
| **M3** | When to go | Feb 2027 | Historical peaks (VIIRS), forecast model, timeline scrubber, best-week badges, curves, 60+ regions |
| **M4** | Places and trips | Apr 2027 | Trail and POI pages, Explore lists, saves/trips, exports, booking links everywhere |
| **M5** | Community and accounts | Jun 2027 | Backend, accounts, report flow, moderation, photo feed |
| **M6** | Launch readiness | Aug 2027 | EN/FR, a11y audit, PWA offline, notifications, SEO, perf, data partnerships |
| **Launch** | Season 2027 | **Sep 1 2027** | Press push around larch/early peak (mid-Sept) |

Design runs about one milestone ahead of development (see the `design` label).

---

## 12. Risks and open questions

| Risk / question | Mitigation |
|---|---|
| Scraped sources change format or object | Defensive parsers, monitoring (DATA-9), partnership outreach (DATA-10), clear attribution |
| Sparse data in the North/Prairies | Satellite + model fallback with low-confidence styling; targeted community prompts |
| Forecast credibility | Show confidence, validate against official reports, publish methodology |
| Open-Meteo is non-commercial on the free tier | Move to ECCC GeoMet (WX-2) |
| UGC abuse / unsafe locations | Moderation queue, rate limits, no exact home locations, report-abuse |
| Monetization | Later: optional Pro (offline packs, advanced alerts), tourism-board partnerships. Never sell location data. |
| Name/brand ("Canopy" is a working title) | Trademark check before launch (D-02) |
| Mobbin references blocked (paid plan) | Upgrade, or collect references manually (D-01) |

---

## Sources
- [PetaPixel: best fall foliage maps 2026](https://petapixel.com/best-fall-foliage-maps/) · [KOA: leaf-peeping apps](https://koa.com/blog/leaf-peeping-apps/) · [Leaf Peepr](https://johnnyjet.com/leaf-peepr-leaf-peeping-app/) · [Parade: SmokyMountains foliage map](https://parade.com/travel/best-fall-foliage-maps)
- [AllTrails App Store listing](https://apps.apple.com/au/app/alltrails-hike-bike-run/id405075943) · [AllTrails Peak review](https://localsinsider.com/apps/alltrails-biggest-outdoor-app-and-its-new-peak-tier-review/) · [AllTrails vs Gaia vs onX](https://www.hikepod.com/blog/best-hiking-apps-2026-alltrails-vs-gaia-gps-vs-onx)
- [NN/G: bottom sheets](https://www.nngroup.com/articles/bottom-sheet/) · [Google vs Apple Maps UX](https://medium.com/ux-splash/user-experience-google-maps-versus-apple-maps-part-1-36efbc395643) · [Mobbin: maps & navigation](https://mobbin.com/explore/mobile/app-categories/maps-navigation)
- Data sources: see [PLAN.md §2](PLAN.md#2-data-sources-researched-and-verified)
