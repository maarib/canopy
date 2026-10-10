# Canopy: change log and decision record

What changed, what was there before, what it changed to, and why. Newest first. Each entry links the commit or pull request that made the change. Research behind the product lives in [PRD.md](PRD.md), [PLAN.md](PLAN.md) and [EXPLORE.md](EXPLORE.md).

## Releases

Each release is a git tag and a GitHub Release. The live site is always the latest; earlier releases can be checked out from their tags.

| Version | Date | What's in it |
|---|---|---|
| Unreleased | | Stills drawn in the browser no longer pile up ([#138](https://github.com/maarib/canopy/pull/138)) |
| Unreleased | | Pages load on demand ([#137](https://github.com/maarib/canopy/pull/137)) |
| [v1.5.2](https://github.com/maarib/canopy/releases/tag/v1.5.2) | 2026-10-09 | Light, dark or match the device, from the account menu ([#132](https://github.com/maarib/canopy/pull/132)); phone tab bar of icons only ([#133](https://github.com/maarib/canopy/pull/133)); buttons in title case, and the Trips form stacked on phones ([#134](https://github.com/maarib/canopy/pull/134)) |
| [v1.5.1](https://github.com/maarib/canopy/releases/tag/v1.5.1) | 2026-10-08 | Mapbox logo no longer cut off on live covers ([#129](https://github.com/maarib/canopy/pull/129)) |
| [v1.5](https://github.com/maarib/canopy/releases/tag/v1.5.0) | 2026-10-08 | Covers that turn, with tilt-shift and a little wildlife ([#125](https://github.com/maarib/canopy/pull/125)); cover fixes for parks, waterfalls and streams ([#123](https://github.com/maarib/canopy/pull/123)); trees on the Foliage page, and a page for each ([#122](https://github.com/maarib/canopy/pull/122)); color outlook across Ontario ([#121](https://github.com/maarib/canopy/pull/121)) |
| [v1.4](https://github.com/maarib/canopy/releases/tag/v1.4.0) | 2026-10-04 | Floating panel on desktop ([#118](https://github.com/maarib/canopy/pull/118)); filter menus open under their pill; phones keep their view ([#116](https://github.com/maarib/canopy/pull/116)) |
| [v1.3](https://github.com/maarib/canopy/releases/tag/v1.3.0) | 2026-10-04 | Explore as a map-first landing page; Places section; filter and sort menus; satellite at dawn by default; accessibility and load-size pass ([#115](https://github.com/maarib/canopy/pull/115)) |
| [v1.2](https://github.com/maarib/canopy/releases/tag/v1.2.0) | 2026-10-04 | Three views, orange brand color and new logo ([#114](https://github.com/maarib/canopy/pull/114)); About and Data sources as separate pages ([#112](https://github.com/maarib/canopy/pull/112), [#113](https://github.com/maarib/canopy/pull/113)); island covers for places ([#111](https://github.com/maarib/canopy/pull/111)); icons for the nine missing activities ([#110](https://github.com/maarib/canopy/pull/110)) |
| [v1.1](https://github.com/maarib/canopy/releases/tag/v1.1.0) | 2026-10-03 | Pre-drawn covers and island thumbnails in lists ([#109](https://github.com/maarib/canopy/pull/109)) |
| [v1.0](https://github.com/maarib/canopy/releases/tag/v1.0.0) | 2026-10-03 | The first release: everything up to [#108](https://github.com/maarib/canopy/pull/108) |

## All changes

| Date | Change | Ref |
|---|---|---|
| 2026-10-09 | [Stills drawn in the browser no longer pile up](#2026-10-09-stills-drawn-in-the-browser-no-longer-pile-up) | [#138](https://github.com/maarib/canopy/pull/138) |
| 2026-10-09 | [Pages load on demand](#2026-10-09-pages-load-on-demand) | [#137](https://github.com/maarib/canopy/pull/137) |
| 2026-10-09 | [Buttons in title case; Trips form stacks on phones](#2026-10-09-buttons-in-title-case-trips-form-stacks-on-phones) | [#134](https://github.com/maarib/canopy/pull/134) |
| 2026-10-09 | [Phone tab bar: icons only, gathered in the middle](#2026-10-09-phone-tab-bar-icons-only-gathered-in-the-middle) | [#133](https://github.com/maarib/canopy/pull/133) |
| 2026-10-09 | [Light, dark or match the device, from the account menu](#2026-10-09-light-dark-or-match-the-device-from-the-account-menu) | [#132](https://github.com/maarib/canopy/pull/132) |
| 2026-10-08 | [Mapbox logo no longer cut off on live covers](#2026-10-08-mapbox-logo-no-longer-cut-off-on-live-covers) | [#129](https://github.com/maarib/canopy/pull/129) |
| 2026-10-08 | [Covers that turn, with tilt-shift and a little wildlife](#2026-10-08-covers-that-turn-with-tilt-shift-and-a-little-wildlife) | [#125](https://github.com/maarib/canopy/pull/125) |
| 2026-10-08 | [Cover fixes: rounded park outlines, waterfalls that face you, streams that cross the island](#2026-10-08-cover-fixes-rounded-park-outlines-waterfalls-that-face-you-streams-that-cross-the-island) | [#123](https://github.com/maarib/canopy/pull/123) |
| 2026-10-06 | [Trees on the Foliage page, and a page for each](#2026-10-06-trees-on-the-foliage-page-and-a-page-for-each) | [#122](https://github.com/maarib/canopy/pull/122) |
| 2026-10-06 | [Color outlook across Ontario](#2026-10-06-color-outlook-across-ontario) | [#121](https://github.com/maarib/canopy/pull/121) |
| 2026-10-04 | [Floating panel on desktop](#2026-10-04-floating-panel-on-desktop) | [#118](https://github.com/maarib/canopy/pull/118) |
| 2026-10-04 | [Filter menus open under their pill; phones keep their view](#2026-10-04-filter-menus-open-under-their-pill-phones-keep-their-view) | [#116](https://github.com/maarib/canopy/pull/116) |
| 2026-10-04 | [Explore landing page, Places, filter menus and a satellite default](#2026-10-04-explore-landing-page-places-filter-menus-and-a-satellite-default) | [#115](https://github.com/maarib/canopy/pull/115) |
| 2026-10-04 | [Three views, orange brand color, new logo and navigation polish](#2026-10-04-three-views-orange-brand-color-new-logo-and-navigation-polish) | [#114](https://github.com/maarib/canopy/pull/114) |
| 2026-10-03 | [About and Data sources pages, footer at the bottom, legend in Layers](#2026-10-03-about-and-data-sources-pages-footer-at-the-bottom-legend-in-layers) | [#112](https://github.com/maarib/canopy/pull/112) |
| 2026-10-03 | [Island covers for waterfalls, lookouts, peaks, lakes, rivers and creeks](#2026-10-03-island-covers-for-waterfalls-lookouts-peaks-lakes-rivers-and-creeks) | [#111](https://github.com/maarib/canopy/pull/111) |
| 2026-10-03 | [Icons for the nine missing activities](#2026-10-03-icons-for-the-nine-missing-activities) | [#110](https://github.com/maarib/canopy/pull/110) |
| 2026-10-03 | [Pre-drawn covers and list thumbnails](#2026-10-03-pre-drawn-covers-and-list-thumbnails) | [#109](https://github.com/maarib/canopy/pull/109) |
| 2026-10-03 | [Map styles, Layers button and forest covers](#2026-10-03-map-styles-layers-button-and-forest-covers) | [#108](https://github.com/maarib/canopy/pull/108) |
| 2026-10-03 | [Park boundaries](#2026-10-03-park-boundaries) | [#107](https://github.com/maarib/canopy/pull/107) |
| 2026-10-03 | [Motion across panels, menus and the map](#2026-10-03-motion-across-panels-menus-and-the-map) | [#106](https://github.com/maarib/canopy/pull/106) |
| 2026-10-03 | [Map performance and floating pins](#2026-10-03-map-performance-and-floating-pins) | [#105](https://github.com/maarib/canopy/pull/105) |
| 2026-10-03 | [Search-first home, sections and account menu](#2026-10-03-search-first-home-sections-and-account-menu) | [#104](https://github.com/maarib/canopy/pull/104) |
| 2026-10-02 | [Detail page layout, list rows, footer](#2026-10-02-detail-page-layout-list-rows-footer) | [#103](https://github.com/maarib/canopy/pull/103) |
| 2026-10-02 | [Fishing access points](#2026-10-02-fishing-access-points) | [#102](https://github.com/maarib/canopy/pull/102) |
| 2026-10-02 | [Filter parks by activity](#2026-10-02-filter-parks-by-activity) | [#101](https://github.com/maarib/canopy/pull/101) |
| 2026-10-02 | [Park activities and facilities](#2026-10-02-park-activities-and-facilities) | [#100](https://github.com/maarib/canopy/pull/100) |
| 2026-10-01 | [Two-color leaf icon set](#2026-10-01-two-color-leaf-icon-set) | [#99](https://github.com/maarib/canopy/pull/99) |
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
| 2026-09-30 | [Milestone 1: the live color map](#2026-09-30-milestone-1-the-live-color-map) | `2d0dfdc` |
| 2026-09-30 | [Map engine: Google Maps → MapLibre + OpenFreeMap](#2026-09-30-map-engine-google-maps--maplibre--openfreemap) | `34c03de` |
| 2026-09-30 | [Initial scaffold and research](#2026-09-30-initial-scaffold-and-research) | `6d75d8e` |

---

## Unreleased

### 2026-10-09 · Stills drawn in the browser no longer pile up

**Ref:** [#138](https://github.com/maarib/canopy/pull/138)

**Before.** Every cover drawn in the browser (one with no pre-drawn image) was kept in memory for the rest of the visit and never released.

**After.** The twelve most recently shown are kept. Past that, the one shown longest ago is released; going back to its page draws it again. A still is about 50 kB, so this is a small saving that only shows on long visits.

**How.** `forestCover()` in `src/lib/forestCover.ts` keeps its stills in order of last use and revokes the oldest one's image URL.
### 2026-10-09 · Pages load on demand

**Ref:** [#137](https://github.com/maarib/canopy/pull/137)

**Before.** The code for every page (Parks, Places, Foliage, Trips, About, Data sources and each kind of detail page) was part of the first download, although a visit starts on the map with a search card.

**After.**
- Each page's code is fetched when the page is first opened. The first download of app code is 141 kB compressed where it was 158 kB (11% less); the map engine is unchanged.
- Once the first screen is up and the browser is idle, the pages are fetched in the background, so opening one does not wait on the network. This is skipped for people who have asked their browser to save data.
- A page opened before its code has arrived shows the usual loading placeholder.
- On the landing page the closed panel is no longer rendered at all. Every other page still stays in place while the panel is hidden, so a list keeps its search and filters.

**How.** `src/pages.ts` (new) declares the pages with `lazy` and holds `preloadPages`; `src/App.tsx` wraps the panel in `Suspense`.

## v1.5.2

### 2026-10-09 · Buttons in title case; Trips form stacks on phones

**Ref:** [#134](https://github.com/maarib/canopy/pull/134)

**Before.**
- Button labels were in sentence case: "Get directions", "Create trip".
- On phones, the Trips page squeezed the new-trip field and the Create trip button onto one line.

**After.**
- **Buttons are in title case:** Get Directions, Show on Map, Create Trip, Save to My Trips, Add to Calendar, Delete Trip, Share Trip, Link Copied, Try Again, Show Fewer and Show 5 More.
- **Trips on phones:** the new-trip field sits above a full-width Create Trip button. From tablet width up they stay side by side.
- Unchanged, still in sentence case: menu items, tabs, filter pills and their options, the Explore quick links, and text links such as "Reserve a site" and "All reports".

**How.** Label text in the page components, `ui.tsx` and `TripPanels.tsx`; the form in `TripPanels.tsx` stacks below the `md` breakpoint.
### 2026-10-09 · Phone tab bar: icons only, gathered in the middle

**Ref:** [#133](https://github.com/maarib/canopy/pull/133)

**Before.** On phones the five sections were spread across the full width of the bottom tab bar, each an icon over a text label. The section in view was marked only by a filled icon and bolder label.

**After.**
- The five tabs sit together in the middle of the bar, 56 px wide with a small gap between them.
- The text labels are gone. Each tab keeps its name for screen readers and as a tooltip.
- The section in view sits in a filled, fully rounded pill, the same fill the desktop rail uses for its selected section.
- The bar is the same height, and the desktop rail is unchanged.

**How.** `TabBar` in `src/components/AppNav.tsx`.
### 2026-10-09 · Light, dark or match the device, from the account menu

**Ref:** [#132](https://github.com/maarib/canopy/pull/132)

**Before.** Canopy was light or dark according to the device's setting, with no way to choose.

**After.**
- The account menu has a **Theme** row with a three-way switch: light, dark, or match the device. It uses the same switch as the header's views.
- The choice is kept on the device and applied before the page first paints, so a chosen theme never flashes the other one on load.
- With "match the device" (the default) the app still follows the device, including when the device changes while the app is open.
- The map follows the theme in force where it used to follow the device: the Auto light setting, hillshade, and trail colors and labels.

**How.**
- `src/lib/theme.ts` (new) holds the setting, saves it and sets `data-theme` on the page's root; a short script in `index.html` sets it before the app loads.
- `src/index.css` keys the dark colors and Tailwind's `dark:` classes off `data-theme`, and still follows the device on a page where nothing has set a theme.
- `src/components/AccountMenu.tsx` has the row; `ThemeIcon` in `ui.tsx` draws the sun, moon and half-filled circle.
- `usePrefersDark` is replaced by `useDark` from `theme.ts`.

**Why.** A device's setting is not always what someone wants for this app, and there was no way to choose.

## v1.5.1

### 2026-10-08 · Mapbox logo no longer cut off on live covers

**Ref:** [#129](https://github.com/maarib/canopy/pull/129)

**Before.** On a live cover, the left 4 px of Mapbox's logo was cut off. The logo carries a negative margin that hangs it 4 px outside its box, and the cover's frame clips anything past its sides.

**After.** The logo sits fully inside the frame, flush with its left edge, and stays level with the credit pills.

**How.** `src/lib/liveCover.ts` clears the logo's own margin as well as its wrapper's while the cover is live, and puts both back when it ends.

## v1.5

### 2026-10-08 · Covers that turn, with tilt-shift and a little wildlife

**Ref:** [#125](https://github.com/maarib/canopy/pull/125)

**Before.** Every detail page's cover was a still image of a 3D scene.

**After.**
- **Tilt-shift:** the far and near edges of every cover are softly out of focus (3 px at the edge, fading toward the middle), on the still and on the live scene. Thumbnails in lists are unchanged.
- **Covers turn.** Reaching for a cover (the mouse resting on it for a quarter of a second, a tap, a sideways drag, or an arrow key) swaps the still for the scene it was taken from, at the same angle and size:
  - drag sideways to turn it, and it coasts when let go; double-click or Home turns it back; the left and right arrow keys turn it 20° at a time;
  - trees standing in front of a trail, stream or deck are worked out again for every angle;
  - a small icon in the cover's top right corner (an arrow looping round, the common mark for a 360° view) says it can be turned.
- **Trees respond:** they lean against the turn and swing back to rest; a tap makes them shiver.
- **Wildlife:**
  - three to five white gulls cross overhead, each pass from a different side, with a few seconds between passes. About four passes in ten, the last bird falls behind, then beats its wings twice as fast to catch up;
  - a canoe paddles a slow loop where a lake or river has open water with room for it (not on a waterfall's pool);
  - a deer stands in the widest gap between the trees, which on a trail is usually beside the path;
  - as a cover comes alive the deer and the canoe fade into the scene, one after the other;
  - a tap hurries the birds along.
- **Kept light:**
  - nothing 3D is loaded or run until someone reaches for a cover; vertical scrolling over a cover on a phone does not count;
  - the animation stops while the cover is out of view, and about 30 seconds after it was last touched (a flock in the air finishes its pass first);
  - with reduced motion set, there are no birds, lean or coasting, and the canoe and deer are simply there and stay still;
  - devices reporting 2 GB of memory or less keep the still.

**How.**
- `src/lib/forestCover.ts` splits drawing a cover into setting the scene up and taking its picture. `stageCover` sets a scene up and holds the one cover map until released, so no still is drawn on it meanwhile.
- `src/lib/liveCover.ts` (new) lays the map over the still and handles turning, the lean and when to sleep. `src/lib/coverLife.ts` (new) builds the gull, canoe and deer models and moves them. Both load only when a cover goes live (about 9 kB).
- `src/components/ForestCover.tsx` draws the tilt-shift bands; `src/components/useLiveCover.ts` (new) decides when a cover has been reached for and brings it to life.
- A page that has just drawn its own still leaves that scene on the cover map, so going live reuses it and does not build it again (about 0.45 s to live in a test, down from 0.8 to 1.3 s).
- The cover map applies changes at once. With Mapbox's usual 300 ms easing it kept redrawing for that long after each change; without it, drawing twelve waterfall stills took 7 s where it took 30 s, and the images are identical pixel for pixel.
- Between flocks only the canoe moves, so the scene is updated ten times a second, not sixty. On a lake cover that cut drawing by about 15% over a 24-second sample.
- A live Mapbox map must show Mapbox's logo, so it appears in the cover's corner while the cover is live, over the tilt-shift so it stays sharp.
- The cover's credit is now two pills, © Mapbox and © OpenStreetMap, at the cover's bottom right, where it was one pill in the middle. The logo sits at the bottom left, its middle level with the pills'.

**Why.** The covers were already 3D scenes that nobody could touch. Turning one is a small delight that costs nothing until someone asks for it.

**Limits.**
- A cover keeps the still's size at every angle, so long shapes run past the frame's edge when turned.
- The canoe and deer appear only once a cover is live; they are not in the stills or thumbnails.
- On dense park covers the deer is mostly hidden by the canopy.
- Mapbox counts a map load each time a map is created, so a visit in which a cover is brought to life uses two map loads, not one.
- Checked in desktop and phone-sized Chromium, not yet on a real phone.

### 2026-10-08 · Cover fixes: rounded park outlines, waterfalls that face you, streams that cross the island

**Ref:** [#123](https://github.com/maarib/canopy/pull/123)

**Before.**
- Parks and regions drawn from an official boundary kept every survey corner, so their land had sharp, jagged edges. The rounding added with the place covers ([#111](https://github.com/maarib/canopy/pull/111)) only applied to places.
- Waterfalls were shown from whichever side filled the frame best, so on some the falling water was hidden behind its own cliff. Where a winding stream crossed the cliff line more than once, the extra stretch was folded back onto the upper terrace and ran along the cliff's edge without falling. Some upper streams stopped a short way behind the falls.
- Creeks and rivers whose mapped course begins or ends inside the island stopped dead in the forest, and short disconnected scraps of stream were drawn as well. Creeks were narrow enough that their boulders hid most of the water.

**After.**
- **Parks and regions:** every corner of a boundary is rounded, and so are the shores of lakes inside it.
- **Waterfalls:**
  - always seen from downstream and a little to one side, so the falling water faces the viewer;
  - the stream meets the cliff in one place, at the falls: it comes straight to the lip and leaves straight from the plunge pool;
  - a stream that would cross the cliff line again is cut where it turns back, and carries straight on to the island's edge;
  - side streams join only below the falls, clear of the cliff.
- **Creeks and rivers:**
  - a course that begins or ends on the island carries straight on to its edge;
  - pieces shorter than three stream widths are left out (the longest always stays);
  - creeks are a little wider, with seven boulders (two in the water) where there were ten (four in the water).

**How.**
- `src/lib/forestCover.ts` rounds the land and lake rings of parks, regions and trails with `soften`, as `placeScene` already did for places.
- `src/lib/placeScenes.ts`: `waterfallScene` takes the stream's direction over a stretch either side of the falls (one kinked segment no longer turns the cliff), builds the upper and lower stream from that, and sets `front` so the camera faces the falls; `streamScene` filters and extends its runs.

**Why.** The covers are the first thing on every detail page, and these were the ones that looked broken.

**Limits.** Where a stream is carried on to the edge it runs dead straight, which shows on a few covers (Mud Creek, North Madawaska River). The cut-and-extend rule draws the stream's direction from the real course but not its exact path near the falls. Every cover is redrawn on the next deploy, because the drawing code changed.

### 2026-10-06 · Trees on the Foliage page, and a page for each

**Ref:** [#122](https://github.com/maarib/canopy/pull/122)

**Before.** The Foliage page was two numbers, the park reports and the regions' peak windows. Trees appeared only as a filter for the map's sightings.

**After.**
- **The Foliage page starts with the trees:** Trees is the first of three tabs (Trees, Park reports, When to go). It lists the 13 groups (maples, oaks, birches and so on, with shrubs and vines last), each row showing its leaf, its fall colors and how many were seen turning in the last two weeks, busiest first.
- **Each tree has a page** (`/tree/maples`):
  - the color it turns, when, how to recognise it, where it grows and the species found in Ontario;
  - **Turning now:** how many were seen in the last two weeks, and the five parks with the most within 40 km, each with its color stage;
  - the regions known for it, and up to nine recent photos from iNaturalist.
- While a tree's page is open, the map shows only that tree's turning leaves, grouped by area, whatever the tree filter is set to.
- **One row per kind of thing, everywhere.** A park, region, place or tree now looks the same wherever it is listed: its island cover (or leaf) on the left, its name and a line of detail, a badge where it has a status, and a chevron. Before, a park had its cover in Parks but a colored dot in Foliage and Explore; regions had a leaf icon; a region's waterfalls and lookouts were chips. Only the line of detail varies by page.
- A tree in the search opens its page (it used to set the map's filter), and "Trees to look for" on a region page links to them. On phones the page has Show on map in its top bar.

**How.**
- `src/data/trees.ts` (new) holds the write-up for each tree, keyed to the tree groups in `treeGroups.ts`. Each group's write-up was checked against the genera it covers on iNaturalist.
- `src/components/TreePanel.tsx` (new) is the page; `FoliagePanel.tsx` gains the Trees tab.
- `src/components/rows.tsx` (new) holds `ParkRow`, `RegionRow`, `PlaceRow` and `TreeRow`, used by Parks, Places, Foliage, Explore, region pages and tree pages. Trails already shared `TrailCard`.
- `src/App.tsx` adds the `/tree/:id` route and, on a tree's page, overrides the sightings filter and the map's layers.

**Why.** People look for a tree before they look for a report: "where are the maples red?". The journey can now start from the leaf.

**Limits.** Timing in the write-ups is typical for southern and central Ontario, not a forecast. "Turning now" depends on where iNaturalist observers happen to be, so busy areas near cities are over-represented.
### 2026-10-06 · Color outlook across Ontario

**Ref:** [#121](https://github.com/maarib/canopy/pull/121)

**Before.** The map's hexagons only appeared where people had reported turning leaves in the last 14 days, so most of Ontario was blank and the map couldn't say where the color was.

**After.**
- **Color outlook**, a new layer under Layers, covers all of Ontario with hexagons, each filled with its color stage (mostly green, patchy, near peak, peak, past peak, bare). It is off until asked for, so the map opens as it did before; turning it on is kept in the link.
- **How each one is worked out**, and how solid it is drawn:
  - an Ontario Parks report within 60 km: the reports within 200 km blended by distance, drawn solid;
  - no report within 60 km but some within 200 km: the same blend, drawn lighter;
  - nothing within 200 km: the usual stage for that latitude on today's date, drawn lightest.
- The legend explains the lighter shades. The outlook fades as you zoom in, where park pins and sightings take over.
- While the outlook is on, the sightings' hexagons step aside, since both color the same ground.
- **The Layers menu is grouped**, with a divider between groups: fall color (color outlook, park reports, color sightings, individual sightings), places (Parks Canada trails, fishing access), the daily satellite image, and 3D terrain on its own. The other layers' defaults are unchanged.
- On the landing page, the search box starts focused, each time Explore opens, so you can type straight away.
- On the landing page, Ontario is framed above the search card on desktop and phones. On phones it was framed for a half-open sheet the landing page no longer has.

**How.**
- `scripts/build-outlook-grid.mjs` takes Ontario's outline, with the Great Lakes cut out, from Natural Earth (public domain) and writes every hexagon whose centre is on land to `public/data/outlook-grid.json`: 118, 462 and 2,360 hexagons at the three sizes the map uses by zoom (32 kB).
- `src/lib/outlook.ts` gives each hexagon a stage from the park reports, weighting each by the inverse square of its distance. The latitude fallback puts peak around October 10 at 44°N and four and a half days earlier per degree north.
- `FoliageMap` draws the hexagons as one fill layer and takes `bottomInset` so the first view clears the search card.

**Why.** One tap should answer "where is the color?" for the whole province. Only about 64 places report it, so the rest is an estimate; the map says so, and shows it only when asked.

**Limits.** The estimate knows nothing about elevation, lakeshores or this year's weather. Much of northern Ontario has no report within 200 km and shows the latitude estimate. A measured surface needs satellite data (#30, #32).

## v1.4

### 2026-10-04 · Floating panel on desktop

**Ref:** [#118](https://github.com/maarib/canopy/pull/118)

**Before.** On desktop, the panel was a full-height column between the navigation rail and the map, and the map started at its right edge.

**After.**
- In the map-with-panel view, the map runs the full width beside the navigation rail and the panel floats over its left side as a rounded card: level with the Filters buttons at the top, with the same 12 px gap at its left and bottom, so the map shows around it.
- Filters, Layers and the legend button sit just to the right of the panel, and the Mapbox logo moves out from under it.
- Places are framed in the visible part of the map, to the right of the panel.
- The map no longer changes size when the panel opens or closes, so there is nothing to redraw. The full-panel view is unchanged: the panel is the page.

**How.** In `src/App.tsx` the panel is positioned over the map (`absolute`) in the split view instead of taking a column. `FoliageMap` takes `panelInset` (432 px: the panel plus its gap) and adds it to the left padding of every camera move. A `panel-floating` class on the map's wrapper shifts the Mapbox logo.

**Why.** The landing page made the map one continuous surface with cards floating on it; the panel now follows the same idea.


### 2026-10-04 · Filter menus open under their pill; phones keep their view

**Ref:** [#116](https://github.com/maarib/canopy/pull/116)

**Before.**
- The Region, Activities, Sort and Difficulty menus opened in the wrong place: offset from their pill by wherever the panel sat on screen and however far it was scrolled.
- On phones, opening a place from the full panel dropped the sheet to half height to show the map, in the middle of reading.
- On phones, About and Data sources opened at half height, over a map that has nothing to do with them.

**After.**
- Each menu opens 6 px under its pill, left edges aligned, at any scroll position, on desktop and phones.
- **Phones keep the view you chose.** Opening a place from the full panel stays in the full panel, and from the map with the panel stays there. The map still moves to the place underneath. Only the map alone opens the panel, so a tapped pin shows its page. Desktop is unchanged: opening a place shows the map with the panel.
- **Show on map:** a place's page in the full panel on phones has a button in its top bar that brings the map back, already on the place.
- On phones, About and Data sources open as the full panel, from a link inside the app or a direct one.
- **A new page starts at the top.** On desktop the panel kept its scroll position when the page changed, so a page opened from the bottom of another appeared scrolled down. It now resets on every page change, as the phone sheet already did.

**How.**
- The menu is positioned against the screen (`position: fixed`), but it was drawn inside the panel. The panel's entrance animation moves it with a transform, and an element with a transform becomes the reference box for anything fixed inside it. `MenuButton` in `src/components/ui.tsx` now draws its menu at the top of the page through a portal.
- `src/App.tsx` decides the view on a page change by screen size, and passes a `ShowOnMap` callback (a React context) that the detail pages' top bar (`BackButton`) reads.

## v1.3

### 2026-10-04 · Explore landing page, Places, filter menus and a satellite default

**Ref:** [#115](https://github.com/maarib/canopy/pull/115)

**Before.**
- Explore opened with its panel beside the map (half the screen on phones): a heading, the search card, parks peaking now, short fall hikes and three place links.
- The map was a globe in Monochrome, with light following the system. Zoomed out, the globe showed as a disc with empty corners, most of all on phones. The map only followed the window's size, so it was left cut off or stretched when the panel opened or closed.
- Detail pages put every link in the same row of buttons as directions, save and share.
- The forecast was the "7-day color outlook", with a colored dot per day and a legend, low on the park page.
- Parks had an Activities toggle that opened an inline box, and two sort chips. Trails had a row of difficulty chips.
- The third section was called Trails, and Foliage used the detailed maple icon.

**After.**
- **Explore** opens on the map alone, on desktop and phones. A search card sits bottom-centre over the map, with three quick links under it: Peaking now (Parks, best color first), Easy trails (Places, with Difficulty set to Easy) and Waterfalls & lookouts. Each opens the panel on that list. On phones the card starts as the search box alone, a button reveals Where and Looking for, and the links scroll sideways. The sheet is hidden on the landing page. Results and field lists open upward.
  - Choosing a park, trail or place from the search opens the map with the panel on that page. A town from the search, or "Explore Ontario", moves the map and stays on the landing page.
  - Returning to Explore from any page shows the landing page again. Its panel (the same search, parks peaking now, short fall hikes) opens from the view switch.
- **Map:** flat (Mercator) rather than a globe, **Satellite at dawn** by default; the other styles and lights are still under Layers. The map follows its own box, so it fills its space after any view change.
- **View switch:** in the middle of the header on desktop (it no longer floats over the map), beside the account menu on phones. On phones the full panel has square top corners, as a page under the header; the other two heights keep the rounded card.
- **Detail pages:** Get directions (the same label everywhere), Save and Share are the main buttons. Every other link (reserve a site, the park's page, GPX download, official trail info, fishing regulations, OpenStreetMap) sits in one compact row of text links under them, below a divider.
- **Forecast:** renamed "7-day weather forecast", without the color dots and legend. It sits in the same place on every detail page: right after the page's summary (buttons, links and key figures), before everything else. The Foliage page's sightings figure is labelled "Trees seen turning".
- **Filters and sorts are menu pills**, the standard control from here on: a pill that opens a menu, shows the current choice after its label, and fills in when a filter is set.
  - Parks: Region (new), Activities and Sort (Best color, A–Z). Ontario Parks spells two regions both ways ("Northeast", "Northeastern"); the filter treats each pair as one.
  - Places: Difficulty for trails.
- **Navigation:** Trails is now **Places** (`/places`; `/trails` still works) with a pin icon. Foliage uses Canopy's own leaf, upright.

- **Lighter first load:** the code that draws a cover in the browser (about 19 kB gzipped) now loads only when a cover has to be drawn; most are pre-drawn images. The main script went from 174 kB to 155 kB gzipped.
- **Accessibility audit** (axe-core, WCAG 2.1 A/AA and best practices; eleven pages, light and dark, desktop and phone sizes). Fixed:
  - Stage and difficulty badges used white text on every fill, down to 2.1:1 on yellow. A badge now picks white or dark ink by contrast with its fill.
  - Colored text for a trail's difficulty and for the kind label above trail and place titles fell to 2.3:1 in dark mode. The difficulty is now a colored dot beside the word; the kind labels use the soft text color.
  - Map markers were announced as an image called "Map marker", hiding the button inside. The button now carries the name.
  - The hidden map that draws covers could take keyboard focus; it is now inert.
  - The cover's loading placeholder had a label without a role; nearby photos repeated their caption as alt text.
  - Still open: white text on the orange primary button is 3.25:1 (AA asks for 4.5:1 at that size).
- **About** gains an Accessibility section: what is in place (contrast, color never the only signal, keyboard, screen-reader names, reduced motion, light and dark), how it was checked, and what is still open. **Data sources** lists its design credits as rows, like the sources.

**How.**
- `src/components/ExploreSearch.tsx` (new) holds the search card and the landing page; `ExplorePanel.tsx` reuses the card. `SearchBox` and the card's fields take `up` to open above.
- `src/components/ui.tsx` adds `MenuButton` and `MenuOption` (the menu is anchored to the viewport, so a scrolling row never clips it) and `MoreLinks`.
- `src/App.tsx` starts on the map-only view at `/`, returns to it whenever the page becomes Explore, and draws the landing over the map in that view.
- `src/components/FoliageMap.tsx` sets `projection="mercator"` and resizes the map from a `ResizeObserver` on its container.
- `src/lib/mapStyle.ts`: the default style is `satellite` and the default light `dawn`.
- `src/lib/coverFrame.ts` (new) holds the cover's frame size, so `ForestCover.tsx` can import `lib/forestCover` on demand. `inkOn` in `src/lib/styles.ts` picks a badge's text color.

**Why.** The map is what sets Canopy apart, and the old Explore hid half of it behind a form. One kind of filter control is easier to learn than three. Links that leave Canopy shouldn't compete with the three things people do most on a place's page.

## v1.2

### 2026-10-04 · Three views, orange brand color, new logo and navigation polish

**Ref:** [#114](https://github.com/maarib/canopy/pull/114)

**Before.**
- The view was fixed on desktop (a 420 px panel beside the map). On phones the sheet had three heights, but its tallest left a strip of map, and every page change reset it to half.
- The logo was the detailed two-color maple from the tree icons.
- The accent color was maple red (`#c8102e`), the same red that means "peak" in the data.
- The header avatar was a solid light disc; the menu said "Guest", used a question mark for About and ended with "Sign in or create account · Coming soon".
- The color legend sat at the bottom of the Layers menu.
- In lists, a park's or region's stage was colored text.
- The footer ran left to right with dots between items, and maaribs.com was styled differently from the other links.

**After.**
- **Three views:** the map alone, the map with the panel, or the panel alone (the map hidden). A three-button control is always on screen: floating at the bottom centre on desktop, in the header on phones, where the sheet and tab bar leave no free spot at the bottom.
  - Opening a place always shows the map with the panel, and the map flies to it, as before.
  - In the full panel, moving between pages stays in the full panel.
  - On phones the views are the sheet's three heights; the tallest now covers the map up to the header. A double tap on the grabber opens the full panel.
  - On desktop the full panel keeps its content in a centred column.
- **Logo:** a plain one-color maple leaf, tilted slightly in the header. The favicon matches.
- **Brand color:** a vibrant orange (`#f2600c`) for buttons, links, hover and selected states, focus rings, counters and the progress bar. Red remains only where it is data: the peak stage, hard trails, dense sightings and the park boundary.
- **Account menu:** the avatar uses the same quiet fill as in the open menu; the name is Maarib; About has an info icon; the last row reads "Accounts coming soon".
- **Legend:** a round info button beside Layers opens the color stage and sightings legend in its own menu; it is no longer inside Layers.
- **Stage labels in lists** are a label inside a fill, as on detail pages (parks, regions, Explore, Foliage).
- **Footer:** "© Canopy 2026" on the left; About, Data sources and maaribs.com ↗ on the right, with no dots and one link style.

**How.**
- `src/App.tsx` treats the sheet's snap point as the view on every screen size and adds `ViewSwitch`. The map stays mounted while hidden. A page change sets the split view unless the full panel is in use and the page isn't a place.
- `src/components/BottomSheet.tsx`: the full height reaches the header; a second tap within 350 ms opens the full panel.
- `src/index.css` replaces `--color-maple` with `--color-brand`; the `*-maple` classes became `*-brand`. `index.html` and the manifest's theme color follow.
- `src/components/ui.tsx` adds `Logo`, `InfoIcon` and `ViewIcon` (the icon pack has no info or view icons) and a small size for `Badge`.
- `src/components/MapFilters.tsx` gains an icon-only button.

**Why.** Sometimes the map is the point and sometimes the list is; the view should be the user's choice and stay put. Orange separates the brand from the red that carries meaning in the data.


### 2026-10-03 · About and Data sources pages, footer at the bottom, legend in Layers

**Ref:** [#112](https://github.com/maarib/canopy/pull/112)

**Before.**
- One page, "About & data sources", held a two-sentence description, the source list and the design credits.
- In the source list, a name long enough to wrap ("Ontario Ministry of Natural Resources") left its ↗ arrow floating beside the two lines instead of after the last word.
- The footer followed the content, so on a short page it sat partway up the panel.
- On desktop, a color legend floated over the map's bottom-left corner, repeating the one in the Layers menu.
- In the Layers menu, Light sat below the list of layers, far from Map style.

**After.**
- **About** (`/about`) tells the story of Canopy in the first person: made to plan the maker's own trips, and grown into what it is today. It links to Data sources and keeps the version line.
- **Data sources** (`/sources`) lists every source with what it provides, its licence and how often it refreshes, followed by the design credits. The arrow now follows the last word of a source's name, however it wraps.
- The footer links to both pages, as does the account menu, and sits at the bottom of the panel when the page is shorter than the panel (desktop side panel and mobile sheet).
- The floating legend is gone from the map; the legend stays at the bottom of the Layers menu.
- In the Layers menu, Light is directly below Map style, above the list of layers.

**How.**
- `src/components/SectionPanels.tsx` splits `AboutPanel` and adds `DataSourcesPanel`; the source link is inline with a non-breaking space before the arrow.
- `src/App.tsx` adds the `/sources` route (not `/data`, which is the folder of data files on the site, so a direct link there would never reach the app) and drops the map legend. The panel wrapper is a column at least as tall as its scroller, and `SiteFooter` takes the remaining space above it (`mt-auto`).
- `src/components/MapControls.tsx` moves the Light control.

**Why.** The story and the source list serve different readers, and each is easier to find on its own page. The footer, legend and Light changes remove small distractions.

### 2026-10-03 · Island covers for waterfalls, lookouts, peaks, lakes, rivers and creeks

**Ref:** [#111](https://github.com/maarib/canopy/pull/111)

**Before.** Every place got the same flat, round island of trees. Nothing showed whether it was a waterfall or a peak, and lakes and streams didn't appear unless a lake happened to sit wholly inside the circle.

**After.** Each kind of place has its own landform, built from its real shape where OpenStreetMap has one. The style, palette and live tree colors match the park and trail islands.
- **Waterfalls:** two terraces split by a cliff across the stream the falls are on. The upper terrace stands a little inside the island's edge, so the lower one shows as a ledge around it. The broad stream crosses the upper terrace, pours over the cliff as a wide white sheet into a plunge pool, and winds on below past boulders. OpenStreetMap draws streams in the direction they flow, so the upper terrace is always upstream.
- **Lookouts:** terraces that crowd into a cliff on one side, with a wooden viewing deck on the bare rocky top. A Canadian flag hangs from its pole, sagging and rippling toward its free end. The camera turns so the cliff and deck face you.
- **Peaks:** terraces climbing from forest to olive scrub, topped by a blunt rock summit with a snowcap. There are four summit shapes (a rounded dome, a leaning crag, twin summits, a broad shoulder); each peak gets one by its id and turns it its own way, so no two match. Snow on the trees thins out with distance from the summit: certain beside it, rare at the snowline.
- **Lakes:** the lake's real outline in a ring of forest, with a small dock on the shore. The camera faces the dock.
- **Rivers and creeks:** the real course as one smooth ribbon (smoothed, with rounded bends) winding across the island; rivers wide, creeks narrow with rocks in and beside them. The camera turns so the stream runs across the view, and trees in front of it are left out.
- **Water with depth:** water is one color and sits a little below the land, inside a low bank that shows the top layer's lip and a sliver of the earth under it. Park and trail lakes too.
- **Soft outlines:** every place's island, its terraces and its lake shores have rounded corners instead of facets.
- **Clear water:** trees standing in front of the falls or a lookout's deck turn see-through, as on trail covers.
- **Everywhere:** all 62 places are pre-drawn at deploy time, and the place lists on the Trails page show their island thumbnails.

**How.**
- **Data.** `scripts/build-explore.mjs` keeps each place's real geometry:
  - lake outlines;
  - river and creek courses near the place, including the named stream for rivers mapped as water areas;
  - for waterfalls, the stream they sit on (an extra Overpass query finds streams within 150 m of each fall, named or not).
  
  Every waterfall, river and creek now has its course.
- **Scenes.** `src/lib/placeScenes.ts` builds a scene for each kind: pieces of land and water as solids (each with its own base, top and color), terraces, where trees grow, where they don't, props, and lines trees shouldn't hide. Parks and trails use the same scene format.
- **Geometry.** `src/lib/diorama.ts` adds half-plane and hull clipping, stream trimming, scaled terrace rings, corner rounding and seeded randomness.
- **Water.** Water is cut into the land with `polygon-clipping` (MIT), working in local metres for precision. Streams are Chaikin-smoothed and drawn as one band with round elbows. A waterfall's stream can cross its cliff line more than once; each side is folded back over the line where it strays, so the water stays on its own terrace.
- **Models.** `src/lib/lowPolyTrees.ts` adds, in the trees' style: a boulder, a wooden deck with a Canadian flag (cloth in twelve strips, with the maple leaf following its sag and ripple), snowy conifers, and four snow-capped rock summits that the cover scales to the top terrace.
- **Renderer.** `src/lib/forestCover.ts` draws any scene with one extrusion layer for all land and water (polygons with holes). Mapbox can't vary a model's height per feature from GeoJSON, so trees and props get one layer per terrace at a fixed height. Trees and props also turn to one of eight angles for variety. A scene can name a point to face the camera and ask for headroom above tall things.
- **Pre-render.** `scripts/build-covers.mjs` draws places too, and takes `--only <prefix>` to draw a subset while checking.

**Why.** The cover should say what a place is at a glance, and its real shape is what makes it that place.
### 2026-10-03 · Icons for the nine missing activities

**Ref:** [#110](https://github.com/maarib/canopy/pull/110)

**Before.** Nine activities had no icon in the Icons8 *Windows 11 Color* pack, so they borrowed a neighbour's:
- mountain biking showed the plain bicycle; whitewater paddling, kayak rentals and paddleboard rentals the canoe;
- rock climbing the mountain; disc golf the playground;
- snowmobiling and tobogganing the snowflake;
- cideries had nothing.

**After.** Each has its own icon, still in the same pack's style:
- **Composed from two pack icons** (a main icon with a small corner badge, the pack's own pattern, as in its "Bike Parking" and "Jet Ski Rental"):
  - mountain biking: bicycle + mountain;
  - rock climbing: mountain + ladder;
  - disc golf: golf bag + disc;
  - whitewater: waves + dinghy;
  - snowmobiling: motorcycle + snowflake;
  - cidery: apple + keg (ready for the orchard and cidery markers).
- **Another pack icon:** tobogganing uses "Winter Landscape", a snowy hill, so it no longer shares the snowflake with winter activities.
- **Drawn for Canopy** in the pack's palette, gradients and proportions, where nothing fits: kayaking (`public/icons/kayaking.svg`) and stand-up paddleboarding (`public/icons/sup.svg`). They're Canopy's own artwork, not edits of Icons8 files.

**How.**
- `src/data/amenityIcons.ts` adds `COMPOSED_ICONS` and `DRAWN_ICONS` beside the single pack icons.
- `AmenityIcon` (in `ParkAmenities.tsx`) renders all three kinds. A composed icon's badge is 62% of the icon's size, on the lower right with a thin halo.
- Map pins still take single pack icons only (`PackIcon`).
- `icons8.json` replaces its `gaps` list with `composed` and `drawn` entries.

**Note.** Ontario Parks currently lists no kayak, paddleboard, canoe or bike rentals on any park page. The kayak and paddleboard icons are mapped and will show when that data appears.

**Why.** Every activity should be recognisable at a glance, and the icons should keep one visual language.

---

## v1.1

### 2026-10-03 · Pre-drawn covers and list thumbnails

**Ref:** [#109](https://github.com/maarib/canopy/pull/109)

**Before.** Every cover was drawn in the visitor's browser by a hidden map: a few seconds of shimmer on first view, and GPU work while the visitor was using the app. Lists showed plain icons.

**After.**
- **Pre-drawn at deploy time.** Covers for every fall-report park (70), region (15) and trail (17) are drawn during the deploy, in that day's colors, and served as plain WebP images (up to about 70 KB). Those pages show their cover as soon as the image loads, with no map, models or WebGL in the browser. Any other cover (places, fishing spots), or one whose colors changed since the deploy, is still drawn in the browser as before.
- **Island thumbnails in lists.** Park list rows and trail rows (the Trails page and region pages) show a 96 px island thumbnail (about 4 KB, lazy-loaded) in place of their icon tile, at the same 40 px tile size. Lists only ever use pre-drawn thumbnails and fall back to their usual icon, so scrolling never triggers drawing.

**How.**
- `src/lib/coverSpec.ts` holds what each page's cover shows (shape, track, island size) and its key (shape plus foliage mix), shared by the app and the pre-render so both agree.
- `scripts/build-covers.mjs` starts Vite and opens `scripts/covers/render.html` in headless Chromium (software WebGL, 2× pixel ratio). The page draws each cover with the app's own `forestCover` and makes a thumbnail. The script writes `dist/covers/<shape>-<hash>.webp`, `…-thumb.webp` and `index.json` (15 KB).
- **Incremental:** with `--reuse`, covers whose key is unchanged are copied from the previous run instead of drawn. A fingerprint of the drawing code (`version.txt`) invalidates everything when the drawing changes. A full run of 101 covers took 3 min 20 s locally; an unchanged run took 2 s.
- **Deploy:** `.github/workflows/deploy.yml` installs Chromium, restores the previous covers from the Actions cache, runs the script after the build, and saves the new set back to the cache. The step may fail without failing the deploy; the app then draws covers itself. Covers are never committed, so the repo doesn't grow daily.
- `src/lib/coverIndex.ts` loads the index once; `ForestCover` uses a matching pre-drawn cover and otherwise draws; `CoverThumb` shows thumbnails in rows.

**Why.** A fast, smooth app comes first. Drawing ahead of time takes the work off visitors' devices for the pages people open most, and makes the covers usable in lists.

---

## v1.0

### 2026-10-03 · Map styles, Layers button and forest covers

**Ref:** [#108](https://github.com/maarib/canopy/pull/108)

**Before.**
- The map had one look: Standard's faded theme with warm land colors under dusk light.
- Layers was a tab inside the Filters menu.
- Detail pages started with the place's name; nothing showed the place's shape or what its forest looks like right now.

**After.**
- **Eight map styles**, picked from small map previews under Layers:
  - Monochrome (the new default);
  - Paper (every basemap color from Canopy's tokens);
  - Faded (the previous look);
  - three custom color grades: Autumn film, Bark & spruce, Riso print;
  - Mapbox Standard and Standard Satellite.
  
  The choice is kept on the device (`canopy:map-style`), not in shared links. The grades are 3D lookup tables generated in the browser (`src/lib/colorGrades.ts`) and applied through Standard's custom theme, so pins and data layers keep their true colors.
- **Light follows the system by default** (day, or night in dark mode) instead of dusk. Monochrome reads best in daylight.
- **Layers has its own button** next to Filters. It now holds the map style, light, data layers and the legend, which change how the map looks. Filters keeps Trees and Activities, which narrow what it shows. The old satellite layer is now labelled "Daily satellite image" so it isn't confused with the Satellite style.
- **Island covers on every detail page** (region, park, trail, place, fishing), above the name, at full content width in a 3:2 frame with no background of their own:
  - **Shape:** the place's shape as a floating piece of land, seen isometrically: a muted sage top over a darker earth edge. A park uses its regulated boundary (main parcel plus islands at least 2% its size). Other places get an organic island seeded by their location; a trail's island hugs its track, which is drawn across it in orange with a clearing either side and a sparser forest (about 150 trees) so the path stays visible. Trees standing in front of the path, as seen from the camera, are drawn at 30% opacity (a second model layer, since Mapbox can't vary model opacity per feature from GeoJSON).
  - **Water:** lakes lying wholly inside the shape are read from Mapbox Streets at the real place and cut in, in soft blue.
  - **Normalized:** every shape is moved to the same spot, scaled to 3 km across and simplified to chunky facets, so trees and land thickness look the same whether it's a lookout or Algonquin.
  - **Framing:** the camera tries rotations in 10° steps and keeps the one where the shape fills the wide frame best, then zooms to fill it.
  - **A caricature, not a survey:** about 320 big low-poly trees whatever the size.
  - **Live colors:** the nearest Ontario Parks report within 60 km sets the share of trees still green, colored and bare, and its dominant color weights red, orange and yellow. A park uses its own report. Elsewhere the nearest region's typical peak window stands in. The source is in the image's tooltip.
  - **Never cropped:** the cover is drawn with a 48 px margin around its frame and allowed to overflow it, so treetops rising past the frame stay visible. Only sideways overflow is clipped, at the panel's padding, so the panel never scrolls sideways.
  - **Credit:** a small centered "© Mapbox © OpenStreetMap" pill sits under the island.

- **Detail page top bar.** The plain "← Back" link at the top of each detail and trip page is now a slim bar pinned to the top of the panel, with a round back button. It's clear at the top of the page, so the cover shows through. Once you scroll, it turns solid with a hairline border and the page's name fades into it once the heading has scrolled under it (`BackButton` in `ui.tsx`).

**How.**
- `src/lib/lowPolyTrees.ts` generates the tree models as tiny glTF files in the browser: a conifer and a leafy tree in each color, in two sizes. It also plants trees on a jittered grid, so the same place always gets the same trees.
- `src/lib/diorama.ts` builds the shapes: park outlines, seeded islands, normalizing, Douglas–Peucker simplification and the path quads.
- `src/lib/forestCover.ts` keeps one hidden, non-interactive map on a blank, transparent style with its own lights, so a whole visit costs a single Mapbox map load. The land is two fill-extrusions, the lakes and path sit on top, and the trees are a model layer raised onto the land. It draws one cover at a time, captures it as a WebP image with transparency and caches it for the visit. A cover no longer needed is skipped.
- `src/lib/foliage.ts` turns reports into tree mixes.
- `src/components/ForestCover.tsx` picks each page's shape, shows a shimmer while drawing, then fades the still image in.

**Why.** The default basemap looked generic. A quieter map lets the data lead, and the choice of styles lets people pick their own. The covers show at a glance the shape of a place and its colors today, in Canopy's own illustrated style.

---

### 2026-10-03 · Park boundaries

**Ref:** [#107](https://github.com/maarib/canopy/pull/107)

**Before.** A park page flew the map to the park's report point at a fixed zoom. Nothing showed where the park began or ended, so a small park like Awenda and one the size of Algonquin looked the same: a dot.

**After.** Opening a park outlines its regulated boundary and fits the map to it.
- **Style:** a red-and-white dashed edge (Canopy's maple red over a white casing) around a light 7% maple wash, drawn under the pins. Islands and separate parcels are included (Awenda's Giant's Tomb Island, for example).
- **One move:** the map waits for the outline (a single small file), then fits the whole park in one move, above the half-open sheet on phones. If a park has no outline, it flies to the report point as before. Every park page fits the whole park, including parks whose only report comes from one spot inside them (Algonquin's is the Art Gallery).
- **Back** clears the outline.

**Source.** Ontario Ministry of Natural Resources "Provincial Park Regulated" layer on Land Information Ontario (`LIO_Open03/MapServer/4`). Open Government Licence – Ontario. Checked 2026-10-03: 347 parks, matched to Ontario Parks shortnames by name (six differ and are mapped by hand, and accents are dropped). All 340 parks in the facilities data and all 69 parks in the fall report have an outline.

**How.**
- **Build script** `scripts/build-park-boundaries.mjs` asks the service for GeoJSON, simplified by the server: about 5 m for parks under 1,000 ha and 20 m for larger ones. It writes one file per park to `public/data/park-boundaries/<shortname>.json` with the outline and its bounding box (4.4 MB in all; 10 KB typical, 190 KB for the largest). A file is only rewritten when its outline changed, and outlines for parks dropped from the layer are removed. Refreshed monthly by `.github/workflows/park-boundaries.yml`.
- **App:** `src/lib/parkBoundaries.ts` loads the open park's file. The map draws it as a fill and two lines in the `middle` slot, below the park dots and pins.
- **Fix:** clearing Standard's default terrain fires a style event itself, so the handler now ignores re-entry instead of being able to loop.

**Why.** Knowing a park's extent answers "is this lake or trail inside the park?" and shows how big a place is before you go. It's the outline people expect from Google Maps.

---

### 2026-10-03 · Motion across panels, menus and the map

**Ref:** [#106](https://github.com/maarib/canopy/pull/106)

**Before.** Pages, menus and dropdowns appeared and disappeared instantly; tab selections jumped; list rows popped in all at once. The bottom sheet was the only animated surface.

**After.** One small motion vocabulary in `src/index.css`, quick and quiet, with every animation and transition reduced to 1 ms when the system asks for reduced motion.
- **Easing:** `--ease-out-soft` for most things; `--ease-spring` (a hint of overshoot) only for small accents.
- **Menus and dropdowns** (map Filters, account menu, Explore's Where / Looking for / Trees, tree picker, Save to a trip, search suggestions) scale and fade in from their anchor (170 ms) and fade out on close (120 ms). `usePresence` keeps them mounted for the exit.
- **Pages:** the panel content eases up into place whenever the page or place changes (260 ms); tab content fades.
- **Lists** (parks, trails, places, reports, regions, activities and facilities, Explore) rise in with a short stagger (25 ms apart, capped at the tenth row).
- **Segmented tabs** (Park reports / When to go, Filters tabs, map light) share a `Segmented` control whose selected pill slides between options.
- **Navigation:** the selected section's icon pops as it fills; nav items and chips press down slightly.
- **Bottom sheet:** a gentler spring when it snaps (380 ms).
- **Map pins** spring up as they appear (280 ms).

**Why.** Motion shows where things come from and where they went, so the app feels connected rather than swapping screens.

---

### 2026-10-03 · Map performance and floating pins

**Ref:** [#105](https://github.com/maarib/canopy/pull/105)

**Before.** Panning and zooming could stutter, most on slower devices. Measured on the development machine with a scripted fly-and-zoom: 59 fps, worst frames 34–50 ms. Three causes:
- **3D terrain was always on.** Mapbox Standard enables terrain between zoom 6 and 13.7 by default, even with Canopy's 3D toggle off. Draping every layer over the terrain mesh is the most expensive thing the map draws.
- **Pins were DOM markers.** Region, trailhead and place pins were React components positioned by the browser on every frame: 15 markers (158 elements) zoomed out, 58 (446 elements) at zoom 9+.
- **Streamed sightings rebuilt the map per page.** Each page of iNaturalist results re-binned the hexagons and re-uploaded the map data.

**After.**
- **Terrain off unless 3D is chosen.** Cleared whenever the style changes (Standard re-applies it after load and config changes). The hillshade keeps the relief.
- **Lighter pins.** Every pin is drawn once onto a canvas at each size it's shown (regions 24/32/44 px, trailheads and places 28/44, fishing 24/34; `src/lib/mapPins.ts`).
  - Region, trailhead and place pins are markers holding a single pre-drawn image: 2 elements per pin instead of a nested SVG (zoom 9+: 116 elements, down from 446).
  - Fishing access (2,400 points) stays a GPU symbol layer, with its images added before the layer needs them.
  - Region and place pins were first tried as GPU symbols too, but Mapbox's icon atlas rendered some of them as noise or with another pin's artwork, and below 1× scale raster icons garbled; markers avoid the atlas entirely.
- **Sightings throttled while streaming.** The map receives new sightings at most every 1.5 s during loading, then immediately once complete (`useThrottledWhile`).
- **Pin lists keyed on zoom thresholds** (9 and 9.5) rather than the exact zoom, so they aren't rebuilt after every move.
- **Result** (same script): 60 fps, worst frame 19 ms, no frames over 50 ms, no long tasks.

**Pin design.** Every pin type now shares one base: the same white border and a soft shadow on the ground beneath, so pins read as floating. Region pins show their peak phase as a small dot on the edge (the ring colour used to). Park report dots get the same white border and a matching soft shadow; the selected park is drawn larger instead of with a dark border.

---

### 2026-10-03 · Search-first home, sections and account menu

**Ref:** [#104](https://github.com/maarib/canopy/pull/104)

**Before.**
- Everything started on the map. The home panel showed color stats with Park reports / When to go tabs; the search box, an Activities button, a Layers button and a row of every tree group sat on top of the map.
- No navigation between kinds of things (parks, trails, color); Trips was a header button.
- The footer listed every data source and licence inline.

**Research.** Airbnb's and AllTrails' current web home pages (checked 2026-10-03):
- *Airbnb:* the page is built around one search pill split into Where / When / Who with a single search button; category tabs with icons above it; discovery carousels below. Top right: a profile avatar and a menu (your things first, then help, then account and sign-in).
- *AllTrails:* a hero with one search ("city, park or trail name") and three quick actions under it (create a trip, custom route, nearby trails), then "Local favourites" cards. Browsing is organised by place (country, region, park) and by thing (trails, points of interest). The footer groups links into a few columns; its region pages pair a ranked list with a map.
- Both use a bottom tab bar on phones for their main sections.

**After.**
- **Explore (home) is a search.** A heading and a search card: the existing park/trail/lake/town search, then **Where** (province; Ontario first, other provinces offer fall color only) and **Looking for** (Everything, Fall colors, Parks, Trails, Lakes & waterfalls). Choosing Fall colors adds a **Trees** dropdown instead of showing every tree up front. The button frames the province on the map and opens the matching section. Below: parks peaking now, short fall hikes, and quick links to waterfalls, lookouts and lakes.
- **Sections.** Explore, Parks, Trails, Foliage and Trips. Desktop: a slim rail left of the panel. Phones: a bottom tab bar; the sheet sits above it and opens half way on every page. Detail pages highlight their section (a park under Parks, a trail or waterfall under Trails, a region under Foliage).
  - **Parks** (`/parks`): find by name, activity filter inline, sort by best color or A–Z.
  - **Trails** (`/trails`): trails by difficulty (shortest first) and tabs for waterfalls, lookouts, lakes, peaks, rivers and creeks (`?show=`).
  - **Foliage** (`/foliage`): the previous home content (stats, Park reports / When to go) with a tree dropdown.
- **One Filters button on the map** replaces the tree chip row, the Activities button and the Layers button, with Trees, Activities and Layers tabs and a count of what's set.
- **Account menu.** Avatar and dropdown at the top right: a guest card ("your trips are saved on this device"), Trips, About & data sources, Send feedback, and "Sign in or create account" marked as coming soon, since Canopy has no accounts yet.
- **Footer** is one line: © Canopy, About & data sources, maaribs.com. The full credits moved to **About** (`/about`) as a table of source, what it provides, licence and refresh rate.
- **Fixes along the way.** On the globe at low zoom Mapbox's `getBounds()` can throw (`Invalid LngLat (NaN, NaN)`) when the viewport corners fall off the planet; the map now skips bounds there instead of erroring. Map padding on phones accounts for the tab bar once.
- **Unchanged:** colors, type, icons, chips, rows and every detail page.

**Why.** Canopy is meant to be a one-stop shop for nature lovers, and people arrive with an intent ("somewhere with color and a canoe this weekend"). Starting from a search and giving parks, trails and color their own places makes that intent the first step, while the map stays one glance away.

---

### 2026-10-02 · Detail page layout, list rows, footer

**Ref:** [#103](https://github.com/maarib/canopy/pull/103)

**Before.**
- On region, park, trail, place and fishing pages, the action buttons (directions, save, share, booking and source links) sat at the bottom, below the forecast and photos.
- Park activities were small chips and facilities were two-column tiles, each a different size from the app's other lists. Tappable rows set their own padding (`py-2.5` or `py-3`), so row heights varied slightly.
- No footer: data credits were scattered across panels.

**After.**
- **Actions first.** On every detail page the buttons sit directly under the status line (color stage and report date, or the type line), so directions and save are reachable without scrolling. The Save menu now opens downward to fit its new position.
- **One row style.** `src/lib/styles.ts` defines the app's row: at least 56 px tall with a 40 px icon tile (`ROW` for tappable rows, `INFO_ROW` for facts, `ICON_TILE`, `LIST`). A shared `InfoRow` component renders icon, label and a right-aligned value. Park activities and facilities and fishing access facts now use full-width rows (activities show six, then "Show more"); park, region, trail and trip lists use the same height.
- **Footer** at the end of every panel: © Canopy, a link to maaribs.com, and credits for every source (Ontario Parks, iNaturalist, Ontario Ministry of Natural Resources, Parks Canada, NASA GIBS, Open-Meteo, OpenStreetMap contributors, Mapbox) with their licences, and Icons8 for icons.

**Why.** Actions are what people come to a detail page for. Taller rows are easier to scan and tap, and one size everywhere makes the app feel consistent. The footer puts attribution in one predictable place.

---

### 2026-10-02 · Fishing access points

**Ref:** [#102](https://github.com/maarib/canopy/pull/102)

**Before.** The map showed park reports, regions, sightings, trails and explore places (waterfalls, lookouts, lakes) in a few areas. Nowhere to put a boat or a line in the water was marked.

**Source.** Ontario Ministry of Natural Resources "Fishing Access Point" layer on Land Information Ontario (`LIO_Open07/MapServer/15`), the data behind Fish ON-Line. Open Government Licence – Ontario. Checked 2026-10-02:
- 3,731 points: 3,446 boat launches, 231 shoreline access, 54 enhanced shoreline access (dock or pier).
- 1,304 are flagged `VISIBILITY_IND = No` (not for public display) and are left out, leaving **2,427**.
- Attributes are sparse. Among the public points, parking is known for 42%, ownership for 40%, fee for 32%, surface for 31% and wheelchair access for 14%. Photo links point to internal government file shares and comments are internal notes, so neither is used.
- Names are present for most public points; internal suffixes (`-keap005`) and bare codes (`Ml-8`) are stripped.

**After.**
- **Build script** `scripts/build-fishing-access.mjs` pages through the service (2,000 at a time) and writes `public/data/fishing-access.json` as compact rows (241 KB, about 50 KB gzipped). Refreshed monthly by `.github/workflows/fishing-access.yml`; the file is only rewritten when a point changed.
- **Map layer.** A Mapbox symbol layer from zoom 8, so 2,400 points cost nothing at country scale. Each pin is drawn once on a canvas when the map loads (white disc, teal ring, Windows 11 Color icon: boat launch, fishing rod or wharf). Overlapping pins are hidden automatically, named sites first. The selected point is drawn larger on top. The data loads only while the layer is on or a fishing link is opened. *Layers → Fishing access* toggles it.
- **Access point page** (`/fishing/:id-name`): type, name, and only the attributes that are known (parking, fee, wheelchair access, surface, owner, year last checked), the 7-day outlook (wind matters on the water), licence reminder, directions, share, and links to Fish ON-Line (species, stocking, depth charts) and the Ontario fishing regulations summary.

**Why.** Fall is prime fishing season in Ontario and a paddle on a lake is one of the best ways to see shoreline color. Launches and shore access answer "where can I get on the water near the color?"

---

### 2026-10-02 · Filter parks by activity

**Ref:** [#101](https://github.com/maarib/canopy/pull/101)

**Before.** Park activities and facilities were only visible inside each park's panel. To find a park with canoe rentals and hiking, you had to open parks one by one.

**After.**
- **Activities button** next to Layers opens a menu of 22 filters in three groups: Activities (hiking, canoeing, fishing, biking, mountain biking, swimming, boating, overnight hiking, horseback riding, Discovery Program, dark-sky viewing), Stay (car camping, backcountry camping, cabins and yurts, electrical sites, showers) and On site (canoe and bike rentals, visitor centre, park store, dog beach, all-terrain wheelchairs).
- **Filters combine.** A park must offer everything selected. Each option shows how many parks would remain if you added it; options that would leave none are disabled, so the map never goes empty by accident.
- **Map and list follow the filter.** Ontario Parks pins and the Park reports list show only matching parks, with a "Parks with …" banner and a Clear button. The park you have open stays on the map. Regions, sightings and the "parks at peak" count are not filtered.
- **Shareable.** The selection lives in the URL (`?do=hiking,canoe-rental`), like the tree filter and layers.
- **Data.** Uses the weekly Ontario Parks snapshot from #100 (`public/data/park-facilities.json`); filter definitions live in `src/data/amenityIcons.ts` (`PARK_FILTER_GROUPS`).

**Why.** Planning starts from what you want to do. "Where can I rent a canoe and hike this weekend while the colors peak?" is now one tap instead of a dozen park pages.

---

### 2026-10-02 · Park activities and facilities

**Ref:** [#100](https://github.com/maarib/canopy/pull/100)

**Before.** A park page showed the fall color report (color change, leaf fall, best viewing), the forecast, nearby photos and links. Nothing said what you could do at the park or what was there: campsites, washrooms, boat launches, rentals.

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

### 2026-10-01 · Two-color leaf icon set

**Ref:** [#99](https://github.com/maarib/canopy/pull/99)

**Before.** Thirteen minimal, geometric tree icons on a 24×24 grid, built from circles, ellipses and straight slits and tinted with a single color. They were crisp but mechanical, and several were hard to tell apart (birch, aspen and elm were all similar ovals).

**Reference.** A flat, two-color leaf illustration:
- smooth, rounded silhouettes
- the leaf filled in its own color
- the stem and veins drawn as rounded strokes in a single dark ink

No shapes were traced or copied. Every leaf is drawn from scratch so the project owns the set outright (the repository is public).

**After.**
- **Two colors per icon.** Each leaf is filled with its tree's typical fall color; the stem and main veins use one ink color from the `--leaf-ink` token (dark navy `#2d3550` in light mode, warm off-white `#f1e8dd` in dark mode). Cherries add a second fill for the fruit.
- **Botanical shapes.** Each silhouette follows the tree's real leaf structure (lobing, margin, tip, base and leaf arrangement), checked against field-guide descriptions and photographs:

  | Group | Shape | Fall color |
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
- **One component, two tones.** `<TreeIcon>` draws the two-color version by default. `tone="mono"` draws everything in `currentColor` for places where the icon sits on a colored background (trip stop avatars).
- **Where they appear.**
  - **Map pins:** a colored leaf on a white disc; the disc's ring shows the region's peak phase.
  - **Tree filter chips:** the icon carries its own color; the active chip switches the ink to stay visible.
  - **Region lists, "Trees to look for" and the map loading state:** use the colored icons directly.
  - **Header logo:** now rendered inline, so its ink follows the app's light/dark theme.
  - **Favicon:** regenerated from the new maple; its ink switches with the system color scheme.
- **Dev preview:** `/?icons` shows the set at 96, 48, 24 and 16 px and in the single-color tone.

**Why.** A fall-color app should show fall color: each tree's icon now tells you what its leaves turn, as well as what they look like. The shapes are also easier to tell apart at chip and pin sizes.

---

### 2026-10-01 · Usability: cursors, hover states, action copy

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
- **Focus:** a visible focus ring in the brand color for keyboard users.
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
  | x color · y bare (map popup) | x turning · y leafless |

- **Error recovery:** the forecast shows "Try again" when it fails to load.
- **Visible hints:** trips without a start date say "Set a start date to add this trip to your calendar." (previously only a hover tooltip, which phones never show).

**Why.** Clickable things should look and feel clickable. Action labels should say what will happen.

---

### 2026-10-01 · Trips: save, plan by day, share

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

### 2026-10-01 · Performance and loading states

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
- **Streaming.** The first page of colored and of leafless sightings load in parallel and render immediately; the rest follow one page at a time, ~1 request/second as iNaturalist asks (TanStack Query `streamedQuery`).
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

### 2026-10-01 · Explore Ontario: trail and place pages

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
  - the official description, color outlook and photos
  - Directions to trailhead, Share and GPX
- **Place pages** (`/place/:id`): each kind has its own label, color and icon (waterfall, lookout/"photo spot", peak, lake, river, creek). Each shows tips and the trails that reach it.
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

### 2026-10-01 · Map engine: MapLibre + OpenFreeMap → Mapbox

**Ref:** [#78](https://github.com/maarib/canopy/pull/78)

**Before.** MapLibre GL 6 with OpenFreeMap vector styles, recolored at runtime with an autumn palette, plus Terrarium hillshade and terrain. Free, no key.

**After.**
- **Mapbox GL JS v3 with the Mapbox Standard style**, configured at runtime:
  - faded theme
  - autumn land, greenspace and water colors
  - point-of-interest and transit labels and pedestrian paths hidden
  - 3D trees and landmarks
  - globe at low zoom
- **Light presets** (dawn, day, dusk, night, auto) in the Layers menu, saved in the URL. **Dusk is the default.**
- **Layers placed in Standard's slots** (`bottom`, `middle`, `top`). Emissive strength keeps data colors true under every light preset.
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

### 2026-10-01 · Shareable links, search, maple icon fix

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

### 2026-10-01 · Tree icon set and GitHub Pages deploy

**Ref:** [#76](https://github.com/maarib/canopy/pull/76)

**Before.**
- A single detailed maple leaf served as the logo, favicon and every region pin.
- Tree filter chips used colored dots.
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

### 2026-09-30 · Relume icons for UI controls

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

### 2026-09-30 · Typography: Inter → Londrina Solid + Livvic

**Ref:** `276a210`

**Before.** Inter for everything.

**After.**
- **Londrina Solid** for display titles and headings (400; 900 for the wordmark).
- **Livvic** for body text, labels and captions (400–700, italic 400).
- Only the weights in use are loaded.
- Map labels keep the map style's own fonts.

**Why.** Brand direction.

---

### 2026-09-30 · Product requirements and project tracking

**Ref:** `74ed32b`, `0bd266d`

- **[PRD.md](PRD.md):** problem, goals, personas, journeys, a competitive scan, a design pattern library, about 70 requirements and a release plan.
- **GitHub tracking:**
  - 75 issues across milestones M2–M6 and Backlog
  - labels by type, priority and area
  - a project board with Track and Priority fields
- **Research sources:** AllTrails, SmokyMountains.com, Leaf Peepr, Ontario Parks, Bonjour Québec, Windy, Google/Apple Maps and Airbnb (listed in the PRD). Mobbin screen references need a paid plan, so collecting them is design task D-01.

---

### 2026-09-30 · Milestone 1: the live color map

**Ref:** `2d0dfdc`

**Before.** A map with 15 region pins and a single layer of sightings dots.

**After.**
- **Map style:** an autumn-tinted basemap (light/dark), hillshade and optional 3D terrain.
- **Official reports:** an Ontario Parks scraper writes `public/data/ontario-parks.json` (70 report locations, 64 park-level) and runs daily in season.
- **Report pages:** park reports are drawn by color stage, each with a park page showing color %, leaf fall %, dominant color and viewing tips.
- **Sightings:** iNaturalist sightings are grouped into zoom-adaptive hexagons, then individual dots when zoomed in.
- **A tree filter** groups observations by genus.
- **Other layers:** Parks Canada trails when zoomed in, and a NASA GIBS VIIRS satellite layer with a date picker.
- **Mobile:** a bottom sheet with three snap points, plus a web app manifest.

**Decisions and why.**
- **Scrape Ontario Parks.** It has no API, but its report page embeds the data as a JSON array, which is read directly.
- **Group by tree genus.** The raw most-common "species" in colored-leaf sightings were often not trees (fireweed, poison ivy, roses).
- **Fixes:**
  - The hex opacity expression nested `zoom` inside another expression, which Mapbox/MapLibre reject; the layer failed, and so did the layers ordered after it.
  - The satellite default date used UTC, which in Eastern evenings meant "today", before that day's pass was complete. It now uses yesterday in local time.

**Caveat.** iNaturalist's leaf annotation is mostly used for colored leaves (766 colored vs 64 leafless in Canada over 14 days at the time). Hexagons therefore show where color is being reported, not a percentage of change. A real percentage needs green-leaf counts per area (issue #29).

---

### 2026-09-30 · Map engine: Google Maps → MapLibre + OpenFreeMap

**Ref:** `34c03de`

**Before.** Google Maps JavaScript API through `@vis.gl/react-google-maps`, chosen because Google's terms require Places content (photos, ratings) to be shown on a Google map.

**After.** MapLibre GL with OpenFreeMap basemaps: free, no key or billing account.

**Why.** Google Maps needs an API key on a Cloud project with billing enabled. The free stack gave a working map without that setup. Places photos and ratings were dropped from the plan; iNaturalist, Wikimedia Commons, OpenStreetMap and Parks Canada are used instead.

---

### 2026-09-30 · Initial scaffold and research

**Ref:** `6d75d8e`

- **Data sources researched and verified live** ([PLAN.md §2](PLAN.md)):
  - iNaturalist phenology annotations
  - Ontario Parks and other provincial reports
  - NASA GIBS and VIIRS/MODIS phenology
  - Natural Resources Canada species maps (SCANFI)
  - Open-Meteo and Environment Canada GeoMet weather
  - Parks Canada trails and OpenStreetMap
  - Google Maps Platform APIs and pricing
- **App:** Vite, React 19, TypeScript, Tailwind v4 and TanStack Query. 15 curated regions with typical peak windows, live colored-leaf sightings, and a region panel with a 7-day color outlook (vivid / leaf-drop / frost) from Open-Meteo.
- **CI:** lint and build on pushes to `main` and on pull requests.
