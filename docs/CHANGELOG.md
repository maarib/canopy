# Canopy: change log and decision record

What changed, what was there before, what it changed to, and why. Newest first. Each entry links the commit or pull request that made the change. Research behind the product lives in [PRD.md](PRD.md), [PLAN.md](PLAN.md) and [EXPLORE.md](EXPLORE.md).

| Date | Change | Ref |
|---|---|---|
| 2026-10-02 | [Park activities and facilities](#2026-10-02-park-activities-and-facilities) | Park facilities PR |
| 2026-10-01 | [Two-colour leaf icon set](#2026-10-01-two-colour-leaf-icon-set) | [#99](https://github.com/maarib/canopy/pull/99) |
| 2026-10-01 | [Usability: cursors, hover states, action copy](#2026-10-01-usability-cursors-hover-states-action-copy) | [#98](https://github.com/maarib/canopy/pull/98) |
| 2026-10-01 | [Trips: save, plan by day, share](#2026-10-01-trips-save-plan-by-day-share) | [#97](https://github.com/maarib/canopy/pull/97) |
| 2026-10-01 | [Performance and loading states](#2026-10-01-performance-and-loading-states) | [#81](https://github.com/maarib/canopy/pull/81) |
| 2026-10-01 | [Explore Ontario: trail and place pages](#2026-10-01-explore-ontario-trail-and-place-pages) | [#80](https://github.com/maarib/canopy/pull/80) |
| 2026-10-01 | [Map engine: MapLibre + OpenFreeMap → Mapbox](#2026-10-01-map-engine-maplibre--openfreemap--mapbox) | [#78](https://github.com/maarib/canopy/pull/78) |
| 2026-10-01 | [Shareable links, search, maple icon fix](#2026-10-01-shareable-links-search-maple-icon-fix) | [#77](https://github.com/maarib/canopy/pull/77) |
| 2026-10-01 | [Tree icon set and GitHub Pages deploy](#2026-10-01-tree-icon-set-and-github-pages-deploy) | [#76](https://github.com/maarib/canopy/pull/76) |
| 2026-09-30 | [Relume icons for UI controls](#2026-09-30-relume-icons-for-ui-controls) | `e0e1e38` |
| 2026-09-30 | [Typography: Inter → Londrina Solid + Livvic](#2026-09-30-typography-inter--londrina-solid--livvic) | `276a210` |
| 2026-09-30 | [Product requirements and project tracking](#2026-09-30-product-requirements-and-project-tracking) | `74ed32b` |
| 2026-09-30 | [Milestone 1: the live colour map](#2026-09-30-milestone-1-the-live-colour-map) | `2d0dfdc` |
| 2026-09-30 | [Map engine: Google Maps → MapLibre + OpenFreeMap](#2026-09-30-map-engine-google-maps--maplibre--openfreemap) | `34c03de` |
| 2026-09-30 | [Initial scaffold and research](#2026-09-30-initial-scaffold-and-research) | `6d75d8e` |

---

## 2026-10-02 · Park activities and facilities

**Ref:** Park facilities PR

**Before.** A park page showed the fall colour report (colour change, leaf fall, best viewing), the forecast, nearby photos and links. Nothing said what you could do at the park or what was there: campsites, washrooms, boat launches, rentals.

**Research.** Candidate sources for activities, facilities and other map markers, checked on 2026-10-02:

| Source | What it offers | Access | Used here |
|---|---|---|---|
| Ontario Parks park pages | About 30 activities and 48 facilities per park, with counts and "Not available" flags, across all ~340 parks listed in the site map | No API; HTML pages. `robots.txt` allows crawling with a 1 s delay | Yes |
| OpenStreetMap (Overpass) | Ontario counts: 377 orchards (25 tagged apple), 1,246 boat launches, 4,759 campsites, 3,898 toilets, 1,877 beaches, 1,067 waterfalls, 333 wineries/cideries/breweries, 334 lighthouses, 28 mazes | API, ODbL | Later |
| Fish ON-Line / Fishing access points (MNRF) | 3,731 access points (shore, dock, boat launch) with parking and fee attributes; species and stocking for 20,000+ lakes | Download, OGL-Ontario | Later |
| Parks Canada open data | Facilities, campsites, trails, points of interest for national parks and historic sites | Download, OGL-Canada | Later |
| eBird API 2.0 | Birding hotspots for CA-ON | API, free key | Later |
| Canadian Geographical Names | Official names for falls, rapids, lakes, creeks | API | Later |
| Ontario Apple Growers | Pick-your-own farms and cideries | Website only, no API | Later (curated) |

Ontario Parks came first because every park already on the map gains the data, and it is the richest per-park source.

**After.**
- **Scraper.** `scripts/scrape-park-facilities.mjs` reads the park list from the Ontario Parks site map, fetches each park page one second apart, and reads the `park-icon` images under the Facilities and Activities headings. The icon file name is the key (`boat_launches`, with `_inactive` when not offered) and the tooltip holds the label and count. It also records the park classification, year established and size. Output: `public/data/park-facilities.json` (340 parks, 134 KB; 33 activity and 47 facility types). The file is only rewritten when something changed.
- **Weekly refresh.** `.github/workflows/park-facilities.yml` runs it on Mondays and commits changes.
- **Park panel.** A new *Things to do* section lists activities as icon chips, ordered for fall visits (hiking and paddling first, winter activities last, with the first eight shown). A *Facilities* section groups what's on site into Camping (site types with counts), On site and Rentals, with the total campsite count.
- **Icons.** Activities and facilities use Icons8 *Windows 11 Color* (pack `fluent`), locked in `icons8.json` with every chosen icon id. Tree and leaf icons stay Canopy's own. `src/data/amenityIcons.ts` maps each Ontario Parks key to a label and icon; keys we haven't mapped fall back to Ontario Parks' own label. Icons load as PNG from the Icons8 CDN with an attribution link.
- **Icon gaps.** Windows 11 Color has no kayak, canoe, paddleboard, whitewater, mountain bike, rock climbing, disc golf, snowmobile, toboggan or cidery icon. Stand-ins until they're drawn: paddling uses the dinghy, mountain biking the bicycle, rock climbing a mountain, disc golf the playground, snowmobiling and tobogganing a winter icon.
- **Only real activity icons.** The operating-dates legend under Activities reuses smaller icons; the scraper reads only the full-size (`icon_size_2`) ones, so a legend "Camping" icon isn't mistaken for an activity.

**Why.** "What can I do there?" is the next question after "Is it at peak?", and the answer decides the trip: whether there's a trail, a canoe rental or a campsite with power.

---

## 2026-10-01 · Two-colour leaf icon set

**Ref:** [#99](https://github.com/maarib/canopy/pull/99)

**Before.** Thirteen minimal, geometric tree icons on a 24×24 grid, built from circles, ellipses and straight slits and tinted with a single colour. They were crisp but mechanical, and several were hard to tell apart (birch, aspen and elm were all similar ovals).

**Reference.** A flat, two-colour leaf illustration:
- smooth, rounded silhouettes
- the leaf filled in its own colour
- the stem and veins drawn as rounded strokes in a single dark ink

No shapes were traced or copied. Every leaf is drawn from scratch so the project owns the set outright (the repository is public).

**After.**
- **Two colours per icon.** Each leaf is filled with its tree's typical fall colour; the stem and main veins use one ink colour from the `--leaf-ink` token (dark navy `#2d3550` in light mode, warm off-white `#f1e8dd` in dark mode). Cherries add a second fill for the fruit.
- **Botanical shapes.** Each silhouette follows the tree's real leaf structure (lobing, margin, tip, base and leaf arrangement), checked against field-guide descriptions and photographs:

  | Group | Shape | Fall colour |
  |---|---|---|
  | Maples | sugar maple: five lobes, rounded sinuses, a few large points | orange-red `#e2602a` |
  | Oaks | white oak: rounded lobes, alternating sides | russet `#9c3a22` |
  | Birches | ovate, toothed, drawn-out tip | bright yellow `#f2c230` |
  | Aspens & poplars | nearly round, fine teeth, long flat stem | golden `#f0a92a` |
  | Larches | needle tuft on a short spur | gold `#d99a2b` |
  | Ashes | pinnate compound, terminal leaflet plus three pairs | purple (white ash) `#7e2f5d` |
  | Beeches | ellipse with straight, parallel side veins | bronze `#b8772f` |
  | Hickories & walnuts | five leaflets, widest toward the tip | golden `#d4a21f` |
  | Elms & basswoods | lopsided heart | pale yellow `#e3b43a` |
  | Cherries & serviceberries | leaf with a pair of cherries | orange `#e05a2b`, fruit `#a11d2b` |
  | Alders & hornbeams | egg-shaped, toothed, pointed tip | olive (alders hold green late) `#86893f` |
  | Ginkgo & more | fan with a central notch | butter yellow `#f4c21b` |
  | Sumacs, shrubs & vines | pinnate, narrow leaflets | scarlet `#d42a1f` |

- **How the shapes are built.** `src/lib/leafShapes.ts` generates each outline from parameters (Gaussian lobes for palmate leaves, a width profile along the midrib for pinnate leaves, individual leaflets for compound leaves), rounds corners with Chaikin corner cutting and smooths the result with a closed Catmull–Rom spline. The maple and oak outlines are hand-placed points smoothed the same way.
- **One component, two tones.** `<TreeIcon>` draws the two-colour version by default. `tone="mono"` draws everything in `currentColor` for places where the icon sits on a coloured background (trip stop avatars).
- **Where they appear.**
  - **Map pins:** a coloured leaf on a white disc; the disc's ring shows the region's peak phase.
  - **Tree filter chips:** the icon carries its own colour; the active chip switches the ink to stay visible.
  - **Region lists, "Trees to look for" and the map loading state:** use the coloured icons directly.
  - **Header logo:** now rendered inline, so its ink follows the app's light/dark theme.
  - **Favicon:** regenerated from the new maple; its ink switches with the system colour scheme.
- **Dev preview:** `/?icons` shows the set at 96, 48, 24 and 16 px and in the single-colour tone.

**Why.** A fall-colour app should show fall colour: each tree's icon now tells you what its leaves turn, as well as what they look like. The shapes are also easier to tell apart at chip and pin sizes.

---

## 2026-10-01 · Usability: cursors, hover states, action copy

**Ref:** [#98](https://github.com/maarib/canopy/pull/98)

**Before.**
- **Cursor:** Tailwind v4 resets `<button>` to the default arrow cursor, so most clickable controls showed an arrow. Only links showed the hand.
- **Hover:**
  - list rows (park reports, regions, trails, trips) only faded slightly on hover
  - home tabs, the Layers button, light options, inline links and the sheet handle had no hover state
  - there was no consistent keyboard focus indicator
- **Copy:** several actions were terse or ambiguous: "Book", "Park page", "Park info", "GPX", "Calendar", "Route", "New", "Reach it on", "Keep typing…", "Save a copy".

**After.**
- **Cursor:**
  - one base rule gives the hand cursor to buttons, links, tabs, options, radios, menu items, selects, checkboxes, date inputs and labels wrapping inputs
  - disabled controls show "not-allowed"
  - 106 of 107 interactive elements on the home screen now show the hand. The exception is Mapbox's compass, which keeps its grab cursor because it's dragged to rotate the map.
- **Focus:** a visible focus ring in the brand colour for keyboard users.
- **Hover and press:**
  - list rows get a full-width rounded highlight on hover and a darker press state (shared `ROW` style)
  - pill buttons scale down slightly when pressed
  - primary buttons brighten on hover
  - inactive tabs, the Layers button (also shown as active while open), light options, inline links, the day Directions link and the sheet handle all respond on hover
- **Copy:**

  | Before | After |
  |---|---|
  | Directions | Get directions |
  | Book | Reserve a site |
  | Park page | Ontario Parks page |
  | Park info | Official trail info |
  | OpenStreetMap | View on OpenStreetMap |
  | GPX | Download GPX |
  | Calendar | Add to calendar |
  | Route | Directions (announced as "Directions for Day N") |
  | New | Create trip |
  | Save a copy | Save to my trips |
  | Reach it on | Trails that reach it |
  | Official reports (tab) | Park reports |
  | Search parks, towns, trees… | Search parks, trails, towns… |
  | Keep typing… | Keep typing to search towns and landmarks |
  | No places found for "x" | No matches for "x". Try a park, trail, town or tree. |
  | Drag along the chart to follow the trail on the map | Hover or drag across the chart to see that spot on the map |
  | Free day. Move a stop here with its day picker. | Nothing planned yet. Move a stop here from its day menu. |
  | Someone shared this trip with you. | This trip was shared with you. Save it to make changes. |
  | Visible when zoomed in | Shown when you zoom in |
  | x colour · y bare (map popup) | x turning · y leafless |

- **Error recovery:** the forecast shows "Try again" when it fails to load.
- **Visible hints:** trips without a start date say "Set a start date to add this trip to your calendar." (previously only a hover tooltip, which phones never show).

**Why.** Clickable things should look and feel clickable. Action labels should say what will happen.

---

## 2026-10-01 · Trips: save, plan by day, share

**Ref:** [#97](https://github.com/maarib/canopy/pull/97) · Issues #46, #47, #26 · Epic #91

**Before.**
- No way to save anything. Planning a visit meant keeping a list elsewhere.
- Directions, GPX and Share existed only for single places.

**Research.**
- **Airbnb wishlists:** save from anywhere into named lists, share a list, plan together.
- **AllTrails lists:** saved trails grouped for a trip, with exports.
- **Google Maps:** multi-stop directions links.

**After.**
- **Save** (bookmark) on every region, park, trail and place page. The first save creates "My trip"; after that a menu lets you tick trips or create a new one.
- **Trips list** (`/trips`), opened from the header button with a count.
- **Trip page** (`/trip/:id`):
  - editable name, start date and days (1–14)
  - stops grouped by day, with move up/down, a day picker and remove
  - totals: number of trails, km, and estimated time on foot
  - on the map: numbered stop pins and every trip trail highlighted
- **Hand-offs:**
  - **Route:** Google Maps directions through each day's stops, starting from the user's location
  - **GPX:** every trail's track plus a waypoint per stop
  - **Calendar (`.ics`):** one all-day event per day, listing its stops
  - **Share trip:** a self-contained link (`/trip/shared?t=…`) that opens a read-only copy with "Save a copy"

**Decisions and why.**
- **Stored on the device** (`localStorage`, synced across tabs), so trips work without an account. Account sync comes with #55.
- **The whole trip is encoded in the share link** (base64url JSON of names and stop references), so sharing needs no server. Links stay valid as long as the referenced places exist; stops that no longer resolve are hidden with a note.
- **Input from shared links is validated:** names are capped at 80 characters, days at 1–14, and stop references must match `region|park|trail|place:<id>`. Malformed links show "Place not found".

---

## 2026-10-01 · Performance and loading states

**Ref:** [#81](https://github.com/maarib/canopy/pull/81)

**Before.** Measured on a production build served locally:
- iNaturalist sightings came from API **v1**, which returns full observation records: **9.3 MB per page** of 200 observations (9,317,933 bytes measured), about 45 MB per app open across 5 pages.
- Parsing each page blocked the main thread for 55–98 ms: 11 long tasks, **803 ms** in total on a cold start.
- Nothing appeared until all pages had arrived (~4.2 s).
- Every map pan wrote the map view through the router, which re-rendered the whole app. Dragging along the elevation chart also re-rendered the whole app on every pointer move.
- The Mapbox engine (517 KB gzipped) was part of the initial load.
- Loading states were plain "Loading…" text or empty space.

**After.**

| | Before | After |
|---|---|---|
| Sightings per page | 9.3 MB (v1) | 159 KB (v2 with `fields`) |
| Sightings per cold open | ~45 MB | ~0.8 MB |
| Sightings on a repeat open within 30 min | ~45 MB | 0 (device cache) |
| Main-thread long tasks, cold start | 803 ms | 377 ms (map engine start-up) |
| First sightings on the map | after all pages (~4.2 s) | after the first pages (~0.9 s) |
| 30 elevation-chart pointer moves | 30 whole-app renders | 11 ms total; only the map dot re-renders |

- **iNaturalist API v2 with `fields`** requests only the 11 fields the app uses. Nearby-photo queries dropped to ~8 KB.
- **Streaming.** The first page of coloured and of leafless sightings load in parallel and render immediately; the rest follow one page at a time, ~1 request/second as iNaturalist asks (TanStack Query `streamedQuery`).
- **Device cache.** Completed sightings are kept in `localStorage` for 30 minutes. Refreshes keep showing the old data until new data is complete.
- **Lazy map engine.** `FoliageMap` and Mapbox load as their own chunks in parallel with the panels. The map is memoized with stable callbacks.
- **Map view is written with `history.replaceState`**, not the router, so panning doesn't re-render the app. Only user-driven or search-driven moves are recorded, so a freshly opened home page keeps a clean URL.
- **Elevation hover lives in a small external store** (`useSyncExternalStore`).
- **Preconnect** to Mapbox and iNaturalist.
- **Loading states:**
  - a map placeholder until the first frame
  - a header progress bar while sightings stream
  - skeletons for the forecast, nearby photos (with fade-in), home stats, park list, tree chips, region trail lists and loading place pages
  - reduced-motion users get static skeletons

**Why.** The app felt laggy, especially on phones. The download size was the dominant cost, and the remaining jank came from avoidable re-renders.

---

## 2026-10-01 · Explore Ontario: trail and place pages

**Ref:** [#80](https://github.com/maarib/canopy/pull/80) · Design notes: [EXPLORE.md](EXPLORE.md)

**Before.**
- Trails were a single Parks Canada layer (national parks only), drawn as lines with no pages.
- Waterfalls, lookouts, lakes and creeks weren't in the app.
- Region pages listed a few hand-written highlights.

**Research.**
- **AllTrails:** trail pages lead with length, time, gain and route type. A draggable elevation chart is linked to the map, waypoints sit along the route, and condition reports are dated.
- **Tripadvisor:** every attraction gets its own page, with "nearby" suggestions and directions.
- **Airbnb:** split list + map, and wishlists for planning together.

**Data sources.**

| Source | Coverage | Licence |
|---|---|---|
| Ontario Trail Network (MNRF) | 5,760 off-road segments, 853 access points | Open Government Licence – Ontario |
| OpenStreetMap via Overpass | Waterfalls, lookouts, peaks, lakes, rivers, creeks | ODbL |
| Mapzen Terrarium tiles (AWS Open Data) | Elevation | Public |
| Provincial Park Regulated (MNRF) | 347 parks; not used yet | Open Government Licence – Ontario |

MNRF's separate Trail Segment dataset requires a request form, so it isn't used.

**After.**
- **A build-time data pipeline** (`scripts/build-explore.mjs`) writes one file per area. For each trail it computes:
  - length, elevation gain and loss, and a profile
  - loop vs point to point
  - difficulty and a relaxed-pace time estimate
  - every waterfall, lookout, peak, lake, river and creek along it, with its km
- **First area: the Algonquin Highway 60 corridor** (17 hikeable trails, 62 places, ~119 KB). CI rebuilds it weekly.
- **Trail pages** (`/trail/:id`):
  - the track plotted on the map
  - stats, difficulty and loop status
  - a draggable elevation chart that moves a marker on the map
  - an "Along the trail" timeline
  - the official description, colour outlook and photos
  - Directions to trailhead, Share and GPX
- **Place pages** (`/place/:id`): each kind has its own label, colour and icon (waterfall, lookout/"photo spot", peak, lake, river, creek). Each shows tips and the trails that reach it.
- **Map:** trails drawn and tappable, with trailhead and photo-spot pins. Region pages list trails and waterfalls & lookouts, and search finds trails and places.

**Decisions and why.**
- **Build time, not live queries.** Public Overpass servers frequently returned 504s and one query hung for over 3 minutes during development, too unreliable for page loads. The script retries across three mirrors with backoff.
- **Loop detection** allows a start–end gap up to 20% of the trail length (max 1.2 km). Official geometry often stops short at the parking lot; a strict 150 m rule marked loops such as Track and Tower and Booth's Rock as point to point.
- **"Along the trail" thresholds:** falls 250 m, lookouts 200 m, peaks 250 m, lakes 120 m, creeks 40 m.
- **Fixes during build:**
  - The first points query omitted coordinates (`out tags`), so no waterfalls or lookouts matched; it now uses `out body`.
  - Duplicate OSM nodes within 120 m are merged.
  - Water areas named "River"/"Creek" are classified as rivers and creeks.
  - Duplicate rivers are removed, but distinct unnamed lookouts are kept.
- **Validation** against Algonquin Park's published lengths:

  | Trail | Computed | Published |
  |---|---|---|
  | Booth's Rock | 5.1 km | 5.1 km |
  | Centennial Ridges | 10.7 km | 10.4 km |
  | Track and Tower | 8.0 km | 7.5 km |

  15 of 17 trails are detected as loops.

**Known gaps.**
- Many OSM lookouts are unnamed.
- Some well-known stops aren't mapped as viewpoints, e.g. Track and Tower's lookout over Cache Lake.
- Only Algonquin is built so far.

---

## 2026-10-01 · Map engine: MapLibre + OpenFreeMap → Mapbox

**Ref:** [#78](https://github.com/maarib/canopy/pull/78)

**Before.** MapLibre GL 6 with OpenFreeMap vector styles, recoloured at runtime with an autumn palette, plus Terrarium hillshade and terrain. Free, no key.

**After.**
- **Mapbox GL JS v3 with the Mapbox Standard style**, configured at runtime:
  - faded theme
  - autumn land, greenspace and water colours
  - point-of-interest and transit labels and pedestrian paths hidden
  - 3D trees and landmarks
  - globe at low zoom
- **Light presets** (dawn, day, dusk, night, auto) in the Layers menu, saved in the URL. **Dusk is the default.**
- **Layers placed in Standard's slots** (`bottom`, `middle`, `top`). Emissive strength keeps data colours true under every light preset.
- **Terrain** comes from the Mapbox DEM.
- **The token** is read from `VITE_MAPBOX_TOKEN` (a repository variable for Pages builds).
- **Park report headers** show only a clock and the date; "Official report" remains as screen-reader text.

**Why.** A more polished map (globe, atmosphere, lighting, better 3D terrain). The same token also unlocks Isochrone (the drive-time filter, EXP-3), Directions, Search and Static Images (share images, PLAT-9).

**Trade-offs.**
- **A larger engine:** the Mapbox chunk is 1,861,680 bytes raw / 517 KB gzipped, against 1,062,985 bytes raw for MapLibre.
- **A proprietary licence.**
- **The account is on Mapbox demo access**, which can't be charged but has low usage caps. Its single default token can't be URL-restricted or rotated, so moving to standard access before launch is tracked in [#79](https://github.com/maarib/canopy/issues/79).
- The MapLibre version remains in history at `937eb75`.

---

## 2026-10-01 · Shareable links, search, maple icon fix

**Ref:** [#77](https://github.com/maarib/canopy/pull/77)

**Before.** Selection lived in component state, so links always opened the home view, and there was no search.

**After.**
- **React Router routes:** `/region/:id`, `/park/:id-slug` (later `/trail/:id`, `/place/:id`).
- **Query parameters** carry the tree filter, layers, satellite date and map view, with defaults omitted.
- **Navigation:** deep links fly to the place, Back/Forward work, unknown paths redirect home, and stale links show "Place not found". Tab titles name the place.
- **A Share button** uses the native share sheet, or copies the link.
- **Search** is a keyboard-accessible combobox:
  - instant local results for regions, parks and tree types
  - towns and landmarks in Canada from the Photon geocoder (OSM), debounced, 3+ characters
- **The maple icon** was rebuilt as an exactly symmetric shape. The previous path's halves didn't mirror, which left a kinked top lobe and an off-centre stem.

**Fixes.**
- A deep link could arrive before the map engine finished loading, so the fly-to never ran. It now re-runs on map load.
- Camera padding set for one view carried over to the next. It is now set on every move, so the mobile sheet never hides the target.

---

## 2026-10-01 · Tree icon set and GitHub Pages deploy

**Ref:** [#76](https://github.com/maarib/canopy/pull/76)

**Before.**
- A single detailed maple leaf served as the logo, favicon and every region pin.
- Tree filter chips used coloured dots.
- The site was not deployed.

**After.**
- **Thirteen minimal tree icons**, one per tree group: maples, oaks, birches, aspens & poplars, larches, ashes, beeches, hickories & walnuts, elms & basswoods, cherries, alders & hornbeams, ginkgo & more, shrubs & vines.
- **A new minimal maple** for the logo and favicon.
- **Region pins show each region's signature tree** (e.g. larch for Banff, aspen for Riding Mountain), and the icons appear in tree chips and lists.
- **A dev-only icon preview** at `/?icons`, excluded from production builds.
- **GitHub Pages deployment** on every push to `main`, after the daily data job, or on demand, with the base path `/canopy/`.

**Fix.** Production builds rendered a blank map: MapLibre builds its worker URL at runtime, so the bundler left the worker out. The worker was bundled explicitly with `?worker&url` and `setWorkerUrl`.

**Why.** Every tree looked like a maple, and the app had no public URL.

---

## 2026-09-30 · Relume icons for UI controls

**Ref:** `e0e1e38`

**Before.** Hand-drawn SVG and text glyphs for controls (←, ↗).

**After.**
- **The `relume-icons` package** (MIT, 60 rounded icons) for:
  - Layers, Back and Directions
  - Book (calendar) and external links
  - schedule, list chevrons, highlights and the loading spinner
- **Weather keeps its emoji.**
- **Only used icons ship**; unused icons are tree-shaken from the bundle (verified).

**Why.** A consistent icon language. The npm package is MIT-licensed, which also permits a public repository; Relume's website library licence forbids redistribution. Relume has no outdoor icons, so place icons are custom (D-05).

---

## 2026-09-30 · Typography: Inter → Londrina Solid + Livvic

**Ref:** `276a210`

**Before.** Inter for everything.

**After.**
- **Londrina Solid** for display titles and headings (400; 900 for the wordmark).
- **Livvic** for body text, labels and captions (400–700, italic 400).
- Only the weights in use are loaded.
- Map labels keep the map style's own fonts.

**Why.** Brand direction.

---

## 2026-09-30 · Product requirements and project tracking

**Ref:** `74ed32b`, `0bd266d`

- **[PRD.md](PRD.md):** problem, goals, personas, journeys, a competitive scan, a design pattern library, about 70 requirements and a release plan.
- **GitHub tracking:**
  - 75 issues across milestones M2–M6 and Backlog
  - labels by type, priority and area
  - a project board with Track and Priority fields
- **Research sources:** AllTrails, SmokyMountains.com, Leaf Peepr, Ontario Parks, Bonjour Québec, Windy, Google/Apple Maps and Airbnb (listed in the PRD). Mobbin screen references need a paid plan, so collecting them is design task D-01.

---

## 2026-09-30 · Milestone 1: the live colour map

**Ref:** `2d0dfdc`

**Before.** A map with 15 region pins and a single layer of sightings dots.

**After.**
- **Map style:** an autumn-tinted basemap (light/dark), hillshade and optional 3D terrain.
- **Official reports:** an Ontario Parks scraper writes `public/data/ontario-parks.json` (70 report locations, 64 park-level) and runs daily in season.
- **Report pages:** park reports are drawn by colour stage, each with a park page showing colour %, leaf fall %, dominant colour and viewing tips.
- **Sightings:** iNaturalist sightings are grouped into zoom-adaptive hexagons, then individual dots when zoomed in.
- **A tree filter** groups observations by genus.
- **Other layers:** Parks Canada trails when zoomed in, and a NASA GIBS VIIRS satellite layer with a date picker.
- **Mobile:** a bottom sheet with three snap points, plus a web app manifest.

**Decisions and why.**
- **Scrape Ontario Parks.** It has no API, but its report page embeds the data as a JSON array, which is read directly.
- **Group by tree genus.** The raw most-common "species" in coloured-leaf sightings were often not trees (fireweed, poison ivy, roses).
- **Fixes:**
  - The hex opacity expression nested `zoom` inside another expression, which Mapbox/MapLibre reject; the layer failed, and so did the layers ordered after it.
  - The satellite default date used UTC, which in Eastern evenings meant "today", before that day's pass was complete. It now uses yesterday in local time.

**Caveat.** iNaturalist's leaf annotation is mostly used for coloured leaves (766 coloured vs 64 leafless in Canada over 14 days at the time). Hexagons therefore show where colour is being reported, not a percentage of change. A real percentage needs green-leaf counts per area (issue #29).

---

## 2026-09-30 · Map engine: Google Maps → MapLibre + OpenFreeMap

**Ref:** `34c03de`

**Before.** Google Maps JavaScript API through `@vis.gl/react-google-maps`, chosen because Google's terms require Places content (photos, ratings) to be shown on a Google map.

**After.** MapLibre GL with OpenFreeMap basemaps: free, no key or billing account.

**Why.** Google Maps needs an API key on a Cloud project with billing enabled. The free stack gave a working map without that setup. Places photos and ratings were dropped from the plan; iNaturalist, Wikimedia Commons, OpenStreetMap and Parks Canada are used instead.

---

## 2026-09-30 · Initial scaffold and research

**Ref:** `6d75d8e`

- **Data sources researched and verified live** ([PLAN.md §2](PLAN.md)):
  - iNaturalist phenology annotations
  - Ontario Parks and other provincial reports
  - NASA GIBS and VIIRS/MODIS phenology
  - Natural Resources Canada species maps (SCANFI)
  - Open-Meteo and Environment Canada GeoMet weather
  - Parks Canada trails and OpenStreetMap
  - Google Maps Platform APIs and pricing
- **App:** Vite, React 19, TypeScript, Tailwind v4 and TanStack Query. 15 curated regions with typical peak windows, live coloured-leaf sightings, and a region panel with a 7-day colour outlook (vivid / leaf-drop / frost) from Open-Meteo.
- **CI:** lint and build on pushes to `main` and on pull requests.
