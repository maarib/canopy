# 🍁 Canopy

**Fall colours across Canada, and everything worth exploring in Ontario.** Canopy shows where the leaves are turning right now, when to go, and what to do when you get there: trails, waterfalls, lookouts, lakes and creeks.

**Live:** https://maarib.github.io/canopy/ · **Board:** [Canopy roadmap](https://github.com/users/maarib/projects/2) · **Issues:** [maarib/canopy/issues](https://github.com/maarib/canopy/issues)

> "Canopy" is a working title.

---

## What it does today

### Live colour map
- **Basemap:** Mapbox Standard on a globe, with autumn colours and **dusk lighting** by default. Dawn, day, night and auto are in the Layers menu.
- **Official park reports:** Ontario Parks' colour % and leaf fall % for about 64 parks, coloured by stage (mostly green → patchy → near peak → peak → past peak), refreshed daily in season.
- **Live sightings:** iNaturalist coloured-leaf and leafless sightings across Canada from the last 14 days. They're grouped into hexagons at low zoom and shown as individual dots up close.
- **Tree filter:** maples, oaks, birches, aspens & poplars, larches and more, each with its own icon.
- **More layers:** Parks Canada trails, a NASA VIIRS satellite view with a date picker, and 3D terrain.

### Park activities and facilities
- **Every park page** lists what you can do there (hiking, canoeing, fishing, biking, swimming, camping types and more) and what's on site (campsites by type with counts, comfort stations, boat launches, docks, park store, visitor centre, rentals), taken from Ontario Parks' own park pages.
- **Filter the map by activity:** the Activities button shows only the Ontario Parks that offer everything you pick (hiking, canoeing, fishing, car camping, cabins, canoe rentals, showers and more). Each option shows how many parks would remain, and the park list follows the same filter.
- **Icons:** activities and facilities use the Icons8 *Windows 11 Color* set (locked in `icons8.json`); trees keep Canopy's own leaf icons.

### Places with their own pages
- **Regions** (15, hand-picked): typical peak window, a 7-day colour outlook, trees to look for, highlights, nearby photos, plus the region's trails and waterfalls & lookouts where available.
- **Ontario provincial parks:** the official report (colour %, leaf fall %, dominant colour, viewing tips), outlook, photos, directions and booking.
- **Trails** (Algonquin Highway 60 corridor, 17 trails):
  - the track plotted on the map
  - length, estimated time, climb, high point, difficulty, and loop or point to point
  - a draggable elevation chart linked to the map
  - an **"Along the trail"** timeline of waterfalls, lookouts (photo spots), lakes, rivers and creeks, each with its km
  - Directions to trailhead, Share and GPX download
- **Waterfalls, lookouts, peaks, lakes, rivers and creeks:** each has its own icon, colour and page, with the trails that reach it.

### Trips
- **Save** any region, park, trail or place to one or more trips (bookmark button on every page).
- **Plan by day:** set a start date and number of days, then reorder stops or move them between days. Totals show trail km and time on foot, and the map shows numbered stops with the trip's trails highlighted.
- **Take it with you:** Google Maps route per day, GPX of every trail and stop, calendar (`.ics`) with one event per day, and a share link that opens a read-only copy anyone can save.
- Trips are stored on the device; no account needed.

### Getting around
- **Search:** regions, parks, trails, places and tree types, plus any town or landmark in Canada.
- **Shareable links** for every place, filter, layer and map view, with working Back and Forward and a Share button.
- **Responsive:** a side panel on desktop and a draggable bottom sheet on phones. Skeleton loading states throughout, and the app can be installed (web app manifest).

---

## How data flows

| Data | How it arrives | Freshness |
|---|---|---|
| Ontario Parks reports | Snapshot `public/data/ontario-parks.json`, built by `scripts/scrape-ontario-parks.mjs` | Daily, Sept–Nov (GitHub Action) |
| Park activities and facilities | Snapshot `public/data/park-facilities.json`, built by `scripts/scrape-park-facilities.mjs` from all ~340 Ontario Parks park pages (1 s between requests) | Weekly (GitHub Action) |
| Trails and places (Explore) | Snapshot `public/data/explore/<area>.json`, built by `scripts/build-explore.mjs` | Weekly (GitHub Action) |
| iNaturalist sightings | Live from API v2 (only the fields used), streamed page by page; cached on the device for 30 min | Live, last 14 days |
| Nearby photos | Live from iNaturalist | Live |
| 7-day outlook | Live from Open-Meteo | Live |
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
| `npm run data:park-facilities [slug…]` | Refresh park activities and facilities (all parks, or the ones named) |

**Deploys:** the Pages build reads `VITE_MAPBOX_TOKEN` from a repository variable and serves the app under `/canopy/` (`BASE_PATH`).

## Project structure

```
src/
  App.tsx              routes → selection → panels + map
  components/          map (FoliageMap), panels (Home, Region, Park, Trail, Place),
                       search, bottom sheet, elevation chart, icons, skeletons
  data/                regions, tree groups, tree icon ids, amenity icons (Icons8 ids)
  lib/                 data clients (iNaturalist, Ontario Parks, explore, trails, weather),
                       URL state, search, map style, hexbins, stages
scripts/               data builders (Ontario Parks reports and facilities, explore areas)
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

## Roadmap

Tracked as epics and milestones on the [project board](https://github.com/users/maarib/projects/2):
- **Trips:** account sync, booking links for every park system (#48), trip suggestions
- **Explore Ontario:** more areas (Killarney, Bon Echo, Frontenac, Arrowhead, Bruce Peninsula), pages for all 347 provincial parks, smaller parks and conservation areas
- **When to go:** historical peak dates from satellite data, a forecast model and a season timeline
- **Community:** colour reports with photos
- **Launch readiness:** French, accessibility, offline use, notifications and SEO

## Known limitations

- Trail and place pages cover the Algonquin Highway 60 corridor only so far.
- Official colour reports are Ontario-only. Other provinces rely on sightings and typical windows.
- Hexagons show where colour is being *reported*, not a percentage of trees changed (see [#29](https://github.com/maarib/canopy/issues/29)).
- The Mapbox account is on demo access: it can't be charged, but usage caps are low. Moving to standard access before launch is [#79](https://github.com/maarib/canopy/issues/79).
- The 7-day outlook uses Open-Meteo's free tier, which is for non-commercial use. A switch to Environment Canada GeoMet is planned ([#36](https://github.com/maarib/canopy/issues/36)).

## Data credits

- **Basemap:** © [Mapbox](https://www.mapbox.com/about/maps/) · © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
- **Park reports:** [Ontario Parks Fall Colour Report](https://www.ontarioparks.ca/fallcolour)
- **Park activities and facilities:** [Ontario Parks](https://www.ontarioparks.ca) park pages
- **Activity and facility icons:** [Icons8](https://icons8.com) (Windows 11 Color)
- **Trails (Ontario):** [Ontario Trail Network](https://data.ontario.ca/dataset/ontario-trail-network), Ministry of Natural Resources, Open Government Licence – Ontario
- **Trails (national parks):** [Parks Canada](https://open.canada.ca/data/en/dataset/64a90e8d-5bc0-4027-8645-b5881b4068d4), Open Government Licence – Canada
- **Waterfalls, lookouts, lakes, creeks:** © OpenStreetMap contributors (ODbL)
- **Sightings and photos:** [iNaturalist](https://www.inaturalist.org) observers (individual CC licences)
- **Weather:** [Open-Meteo](https://open-meteo.com) (CC BY 4.0)
- **Satellite imagery:** [NASA GIBS](https://www.earthdata.nasa.gov/gibs) · **Elevation:** Mapzen Terrarium / AWS Open Data
- **Town search:** [Photon](https://photon.komoot.io) (OpenStreetMap)
