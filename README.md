# 🍁 Canopy

**Fall colors across Canada, and everything worth exploring in Ontario.** Canopy shows where the leaves are turning right now, when to go, and what to do when you get there: trails, waterfalls, lookouts, lakes and creeks.

**Live:** https://maarib.github.io/canopy/ · **Board:** [Canopy roadmap](https://github.com/users/maarib/projects/2) · **Issues:** [maarib/canopy/issues](https://github.com/maarib/canopy/issues)

> "Canopy" is a working title.

---

## What it does today

### Search-first home and sections
- **Explore (home)** is the landing page: the map takes the screen, with a search card over its lower edge. Type a park, trail, lake or town, or pick **Where** (province; Ontario has everything, other provinces have fall color) and **Looking for** (everything, fall colors with a tree dropdown, parks, trails, lakes & waterfalls). On phones the card starts as the search box alone, and a button reveals the two fields. Under it are three quick links (Peaking now, Easy trails, Waterfalls & lookouts) that open the panel on that list. Choosing a place from the search opens the panel on its page. Explore's own panel opens from the view switch.
- **Sections:** Explore, **Parks** (search, region and activity filters, sort by color or A–Z), **Places** (`/places`: trails with a difficulty filter, plus waterfalls, lookouts, lakes, peaks, rivers and creeks), **Foliage** (three tabs: trees, each leading to its own page; official fall color reports; when each region peaks) and **Trips**. A slim rail on the left on desktop; a bottom tab bar on phones. The map stays alongside every section.
- **Three views**, switched from a control in the header (in the middle on desktop, beside the account menu on phones): the map alone, the map with the panel, or the panel alone. On desktop, opening a place always shows the map with the panel, so the map can fly to it. On phones the view you chose stays put: a place opened from the full panel stays in the full panel, with a Show on map button in its top bar. Moving between pages keeps the full panel if that's the view in use; About and Data sources always open as the full panel on phones. On phones the three views are the sheet's three heights, and a double tap on its grabber opens the full panel.
- **Three buttons on the map:** Filters (Trees and park Activities), Layers (map style, light and layers) and a round info button that opens the color legend.
- **Account menu** (avatar, top right): trips, About, Data sources, feedback, and a **Theme** switch (light, dark, or match the device; the choice is kept on the device). Accounts aren't built yet, so trips are saved on the device and accounts are marked as coming soon.
- **About** (`/about`) tells how Canopy came to be, and **Data sources** (`/sources`) lists every source with what it provides, its licence and how often it refreshes. The footer has the copyright on the left and About, Data sources and maaribs.com on the right, and sits at the bottom of the panel even on short pages.

### Live color map
- **Basemap:** a flat (Mercator) map, **Satellite at dawn** by default. The **Layers** button (next to Filters) offers eight map styles: Monochrome, Paper (Canopy's own palette), Faded, three custom color grades (Autumn film, Bark & spruce, Riso print), Mapbox Standard and Satellite. The choice is remembered on the device. Light is dawn by default; auto (day, or night in dark mode), day, dusk and night are under Layers, directly below the map styles.
- **Trees:** the Foliage page's first tab lists the 13 kinds of tree (and shrubs) people look for, each with its leaf, its fall colors and how many were seen turning in the last two weeks. Each has its own page (`/tree/maples`): the color it turns, when, how to recognise it, where it grows, the parks with the most seen turning nearby, the regions known for it and recent photos. While a tree's page is open, the map shows only that tree's sightings.
- **Color outlook:** a layer under Layers covers all of Ontario with hexagons, each filled with its color stage, to show at a glance where the color is. It is off until you turn it on. A hexagon is solid where an Ontario Parks report is within 60 km and lighter where it is an estimate: a blend of the reports within 200 km, or beyond that the usual timing for its latitude. The legend says which is which.
- **Official park reports:** Ontario Parks' color % and leaf fall % for about 64 parks, colored by stage (mostly green → patchy → near peak → peak → past peak), refreshed daily in season.
- **Live sightings:** iNaturalist colored-leaf and leafless sightings across Canada from the last 14 days. They're grouped into hexagons at low zoom and shown as individual dots up close.
- **Tree filter:** maples, oaks, birches, aspens & poplars, larches and more, each with its own icon (Filters → Trees, or the Foliage page).
- **More layers:** Parks Canada trails, a NASA VIIRS satellite view with a date picker, and 3D terrain.

### Park activities and facilities
- **Every park page** lists what you can do there (hiking, canoeing, fishing, biking, swimming, camping types and more) and what's on site (campsites by type with counts, comfort stations, boat launches, docks, park store, visitor centre, rentals), taken from Ontario Parks' own park pages.
- **Filter the map by activity:** Filters → Activities (or the Parks page) shows only the Ontario Parks that offer everything you pick (hiking, canoeing, fishing, car camping, cabins, canoe rentals, showers and more). Each option shows how many parks would remain, and the park list follows the same filter.
- **Park boundaries:** opening a park outlines its regulated boundary on the map (a red-and-white dashed edge over a light wash, islands and separate parcels included) and fits the map to the whole park. Outlines come from the Ministry of Natural Resources for all 347 provincial parks.
- **Icons:** activities and facilities use the Icons8 *Windows 11 Color* set (locked in `icons8.json`); trees keep Canopy's own leaf icons. Where the set has no icon, Canopy composes one from two of its icons (main plus corner badge: mountain biking, rock climbing, disc golf, whitewater, snowmobiling, cidery) or draws one in its style (kayaking, paddleboarding, in `public/icons/`).

### Fishing access
- **2,427 public fishing access points** across Ontario (boat launches, shoreline access, docks and piers) from the Ministry of Natural Resources, the data behind Fish ON-Line. They appear on the map from zoom 8; overlapping pins thin out automatically, named sites first.
- **Each point has its own page** (`/fishing/:id`) with parking, fee, surface, owner and accessibility where known, the 7-day weather forecast, directions, and links to Fish ON-Line (species and stocking) and Ontario's fishing regulations.
- **Layers → Fishing access** turns them off.

### Places with their own pages
- **Island covers:** every region, park, trail, place and fishing page opens with an illustrated cover. The place's shape floats as a piece of land in soft colors, seen isometrically, with big low-poly trees in today's fall colors.
  - A park uses its official boundary, islands included, with its corners rounded.
  - Other places get an organic island; a trail's island hugs its track, which winds through a sparser forest; trees standing in front of it turn see-through so the whole path shows.
  - Real lakes inside the shape are cut in.
  - **Places have their own landforms**, built from their real OpenStreetMap shapes:
    - waterfalls: two terraces split by a cliff across the real stream, which pours over it into a plunge pool, seen from downstream so the falling water faces you;
    - lookouts: terraces crowding into a cliff, turned to face you, with a wooden viewing deck on the bare rocky top;
    - peaks: terraces rising to a rocky summit with a cairn and flag;
    - lakes: the real outline in a ring of forest, with a dock facing you;
    - rivers and creeks: the real course winding across the island from edge to edge, rivers wide, creeks narrow with rocks.
  - **Covers turn.** A cover opens as a still image with its far and near edges softly out of focus, like a photo of a miniature. Rest the mouse on it, tap it, or drag it sideways and the 3D scene itself takes the still's place:
    - drag to turn it (it coasts when let go), double-click to turn it back, or use the left and right arrow keys and Home;
    - trees lean against the turn and settle; a tap makes them shiver;
    - three to five white gulls cross overhead from time to time (now and then one falls behind and hurries to catch up), a canoe paddles on lakes with room for it, and a deer stands in the widest clearing;
    - the 3D is only loaded and run for people who reach for a cover. It rests when scrolled out of view and about half a minute after it was last touched, and with reduced motion set nothing moves but the land under the hand.
  - The colors come from the nearest Ontario Parks report within 60 km (how much has turned and fallen, and the dominant color), otherwise from the nearest region's typical peak window.
  - **Pre-drawn:** covers for every fall-report park, region, trail and place are drawn at deploy time in that day's colors and served as plain images (up to about 70 KB each), so those pages show their cover instantly with no map work. Anything else is drawn in the browser once per visit by a single hidden map.
  - **Thumbnails:** park, trail and place list rows show a 4 KB island thumbnail when a pre-drawn one exists, and their usual icon otherwise. Lists never draw covers themselves.
- **Regions** (15, hand-picked): typical peak window, a 7-day weather forecast, trees to look for, highlights, nearby photos, plus the region's trails and waterfalls & lookouts where available.
- **Ontario provincial parks:** the official report (color %, leaf fall %, dominant color, viewing tips), outlook, photos, directions and booking.
- **Trails** (Algonquin Highway 60 corridor, 17 trails):
  - the track plotted on the map
  - length, estimated time, climb, high point, difficulty, and loop or point to point
  - a draggable elevation chart linked to the map
  - an **"Along the trail"** timeline of waterfalls, lookouts (photo spots), lakes, rivers and creeks, each with its km
  - Directions to trailhead, Share and GPX download
- **Waterfalls, lookouts, peaks, lakes, rivers and creeks:** each has its own icon, color and page, with the trails that reach it.

### Trips
- **Save** any region, park, trail or place to one or more trips (bookmark button on every page).
- **Plan by day:** set a start date and number of days, then reorder stops or move them between days. Totals show trail km and time on foot, and the map shows numbered stops with the trip's trails highlighted.
- **Take it with you:** Google Maps route per day, GPX of every trail and stop, calendar (`.ics`) with one event per day, and a share link that opens a read-only copy anyone can save.
- Trips are stored on the device; no account needed.

### Getting around
- **Search:** regions, parks, trails, places and tree types, plus any town or landmark in Canada.
- **Shareable links** for every place, filter, layer and map view, with working Back and Forward and a Share button.
- **Responsive:** a panel floating over the map's left side on desktop and a draggable bottom sheet on phones (a full page with square corners at its tallest). Skeleton loading states throughout, and the app can be installed (web app manifest).

---

## How data flows

| Data | How it arrives | Freshness |
|---|---|---|
| Ontario Parks reports | Snapshot `public/data/ontario-parks.json`, built by `scripts/scrape-ontario-parks.mjs` | Daily, Sept–Nov (GitHub Action) |
| Park activities and facilities | Snapshot `public/data/park-facilities.json`, built by `scripts/scrape-park-facilities.mjs` from all ~340 Ontario Parks park pages (1 s between requests) | Weekly (GitHub Action) |
| Provincial park boundaries | One file per park in `public/data/park-boundaries/<shortname>.json`, built by `scripts/build-park-boundaries.mjs` from the Land Information Ontario layer; a park page loads only its own outline | Monthly (GitHub Action) |
| Cover images | Drawn at deploy time by `scripts/build-covers.mjs` into `dist/covers/` (not committed): the app's own cover code in headless Chromium, for every fall-report park, region and trail. Only covers whose shape or colors changed are redrawn; the rest come from the previous deploy (GitHub Actions cache) | Every deploy |
| Fishing access points | Snapshot `public/data/fishing-access.json`, built by `scripts/build-fishing-access.mjs` from the Land Information Ontario layer (public points only) | Monthly (GitHub Action) |
| Trails and places (Explore) | Snapshot `public/data/explore/<area>.json`, built by `scripts/build-explore.mjs` | Weekly (GitHub Action) |
| iNaturalist sightings | Live from API v2 (only the fields used), streamed page by page; cached on the device for 30 min | Live, last 14 days |
| Nearby photos | Live from iNaturalist | Live |
| 7-day weather forecast | Live from Open-Meteo | Live |
| Parks Canada trails | Live from Parks Canada's ArcGIS service when zoomed in | Live (updated weekly by Parks Canada) |
| Satellite imagery | NASA GIBS tiles for the chosen date | Daily |
| Town search | Photon geocoder (OpenStreetMap) | Live |
| Regions, tree groups, icons | In the code | Fixed |

The deploy workflow republishes the site after each data refresh.

---

## Tech stack

- **App:** Vite · React 19 · TypeScript · Tailwind CSS v4
- **Data fetching:** TanStack Query, including streamed queries for sightings
- **Routing:** React Router
- **Map:** Mapbox GL JS v3 through `react-map-gl`, using the Mapbox Standard style
- **Type:** Londrina Solid (headings) and Livvic (body)
- **Icons:** [`relume-icons`](https://www.npmjs.com/package/relume-icons) (MIT) for controls, plus custom tree and place icons
- **Hosting:** GitHub Pages via GitHub Actions; CI runs lint and build

## Getting started

Node 24+ and a Mapbox public token (`pk.…`) are required.

```bash
npm install
cp .env.example .env.local   # set VITE_MAPBOX_TOKEN
npm run dev
```

| Script | What it does |
|---|---|
| `npm run dev` | Dev server at http://localhost:5173 (tree and place icon preview at `/?icons`) |
| `npm run build` | Type-check and production build |
| `npm run lint` | oxlint |
| `npm run data:ontario-parks` | Refresh the Ontario Parks snapshot |
| `npm run data:explore [area]` | Rebuild trails and places (all areas, or one) |
| `npm run data:fishing` | Refresh fishing access points |
| `npm run data:park-boundaries` | Refresh provincial park boundaries |
| `npm run data:outlook-grid` | Rebuild the grid of Ontario hexagons for the color outlook (only needed if the hexagon sizes change) |
| `npm run covers [out] [--reuse dir]` | Pre-draw cover images (default `dist/covers`); `--reuse` copies unchanged covers from a previous run |
| `npm run data:park-facilities [slug…]` | Refresh park activities and facilities (all parks, or the ones named) |

**Deploys:** the Pages build reads `VITE_MAPBOX_TOKEN` from a repository variable and serves the app under `/canopy/` (`BASE_PATH`).

## Project structure

```
src/
  App.tsx              routes → selection → panels + map
  components/          map (FoliageMap), landing page and search (ExploreSearch), panels
                       (Explore, Parks, Places, Foliage, Trips, Region, Park, Trail, Place,
                       Fishing), covers (ForestCover), bottom sheet, shared controls (ui)
  data/                regions, tree groups, tree icon ids, amenity icons (Icons8 ids)
  lib/                 data clients (iNaturalist, Ontario Parks, explore, trails, weather),
                       URL state, search, map style, hexbins, stages, cover drawing
                       (forestCover, placeScenes, diorama, lowPolyTrees)
scripts/               data builders (Ontario Parks reports, facilities and boundaries,
                       explore areas) and the cover pre-renderer
public/data/           built data snapshots
docs/                  PRD, technical plan, Explore design, change log
.github/workflows/     CI, deploy, daily parks data, weekly explore data
```

## Documentation

| Doc | What's in it |
|---|---|
| [docs/PRD.md](docs/PRD.md) | Product requirements: problem, users, journeys, competitive scan, design patterns, requirements with status, release plan |
| [docs/PLAN.md](docs/PLAN.md) | Original technical plan and data-source research |
| [docs/EXPLORE.md](docs/EXPLORE.md) | Trails and places: research (AllTrails, Tripadvisor, Airbnb), identity system, data pipeline, roadmap |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Every change: before, after and why, with measurements |
| [docs/RETROS.md](docs/RETROS.md) | Retrospectives: what went well, what didn't, and what to change |

## What's next

The next releases (v1.5.2 onward) are planned in [docs/PRD.md §11](docs/PRD.md#11-release-plan) and tracked by the [`next`](https://github.com/maarib/canopy/issues?q=is%3Aissue+is%3Aopen+label%3Anext) label: more of Ontario's trails and places, a page for every provincial park, a locate button, ranked "best right now" lists, accessibility follow-ups and Québec's color reports.

## Releases

Each release is a git tag and a [GitHub Release](https://github.com/maarib/canopy/releases); the About page shows the live version. Minor versions (1.1, 1.2) bring new features, patch versions (1.1.1) only fixes, and a major version (2.0) a fundamental change. The version lives in `package.json`, and [docs/CHANGELOG.md](docs/CHANGELOG.md) groups changes by release.

| Version | What's in it |
|---|---|
| [v1.5.1](https://github.com/maarib/canopy/releases/tag/v1.5.1) | Mapbox's logo is no longer cut off on live covers |
| [v1.5](https://github.com/maarib/canopy/releases/tag/v1.5.0) | Covers you can turn by hand, with tilt-shift, birds, a canoe and a deer; a color outlook layer across Ontario; trees on the Foliage page with a page for each; fixes to park, waterfall and stream covers |
| [v1.4](https://github.com/maarib/canopy/releases/tag/v1.4.0) | A floating panel on desktop, phones that keep the view you chose, a Show on map button, and fixes to menu positions and scrolling |
| [v1.3](https://github.com/maarib/canopy/releases/tag/v1.3.0) | Explore as a map-first landing page, the Places section, menu-pill filters, satellite at dawn by default, an accessibility and load-size pass |
| [v1.2](https://github.com/maarib/canopy/releases/tag/v1.2.0) | Island covers for places, three views, orange brand color, new logo, About and Data sources pages, the nine missing activity icons |
| [v1.1](https://github.com/maarib/canopy/releases/tag/v1.1.0) | Pre-drawn covers and island thumbnails in lists |
| [v1.0](https://github.com/maarib/canopy/releases/tag/v1.0.0) | The first release |

## Roadmap

Tracked as epics and milestones on the [project board](https://github.com/users/maarib/projects/2):
- **Trips:** account sync, booking links for every park system (#48), trip suggestions
- **Explore Ontario:** more areas (Killarney, Bon Echo, Frontenac, Arrowhead, Bruce Peninsula), pages for all 347 provincial parks, smaller parks and conservation areas
- **When to go:** historical peak dates from satellite data, a forecast model and a season timeline
- **Community:** color reports with photos
- **Launch readiness:** French, accessibility, offline use, notifications and SEO

## Known limitations

- Trail and place pages cover the Algonquin Highway 60 corridor only so far.
- Official color reports are Ontario-only. Other provinces rely on sightings and typical windows.
- Hexagons show where color is being *reported*, not a percentage of trees changed (see [#29](https://github.com/maarib/canopy/issues/29)).
- The Mapbox account is on demo access: it can't be charged, but usage caps are low. Moving to standard access before launch is [#79](https://github.com/maarib/canopy/issues/79).
- The 7-day weather forecast uses Open-Meteo's free tier, which is for non-commercial use. A switch to Environment Canada GeoMet is planned ([#36](https://github.com/maarib/canopy/issues/36)).

## Data credits

- **Basemap:** © [Mapbox](https://www.mapbox.com/about/maps/) · © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
- **Park reports:** [Ontario Parks Fall Colour Report](https://www.ontarioparks.ca/fallcolour)
- **Park activities and facilities:** [Ontario Parks](https://www.ontarioparks.ca) park pages
- **Provincial park boundaries:** [Ontario Ministry of Natural Resources](https://data.ontario.ca/dataset/provincial-park-regulated), Open Government Licence – Ontario
- **Fishing access points:** [Ontario Ministry of Natural Resources](https://data.ontario.ca/dataset/fishing-access-points) (Fish ON-Line), Open Government Licence – Ontario
- **Activity and facility icons:** [Icons8](https://icons8.com) (Windows 11 Color)
- **Trails (Ontario):** [Ontario Trail Network](https://data.ontario.ca/dataset/ontario-trail-network), Ministry of Natural Resources, Open Government Licence – Ontario
- **Trails (national parks):** [Parks Canada](https://open.canada.ca/data/en/dataset/64a90e8d-5bc0-4027-8645-b5881b4068d4), Open Government Licence – Canada
- **Waterfalls, lookouts, lakes, creeks:** © OpenStreetMap contributors (ODbL)
- **Sightings and photos:** [iNaturalist](https://www.inaturalist.org) observers (individual CC licences)
- **Weather:** [Open-Meteo](https://open-meteo.com) (CC BY 4.0)
- **Satellite imagery:** [NASA GIBS](https://www.earthdata.nasa.gov/gibs) · **Elevation:** Mapzen Terrarium / AWS Open Data
- **Town search:** [Photon](https://photon.komoot.io) (OpenStreetMap)
