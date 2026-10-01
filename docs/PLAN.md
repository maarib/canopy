# Canopy — Product & Technical Plan

_A responsive web app for tracking fall colours and leaf drop across Canada: every tree species, every park, live conditions, and when and where to go._

Last updated: 2026-09-30

---

## 1. Product vision

Fall-colour info in Canada is scattered. Ontario Parks publishes per-park reports, Bonjour Québec runs a weekly regional map, Nova Scotia publishes a PDF, and most of the country has nothing. Canopy brings it together into one map-first experience:

- **Where are the colours right now?** A live, Canada-wide map showing % colour change and % leaf fall.
- **What's changing?** Tracking by species (sugar maple, red maple, aspen, birch, tamarack, larch, oak, and others).
- **When should I go?** A peak-timing forecast per region, plus weather and climate context.
- **What should I see there?** Trails, lookouts, waterfalls, lakes and scenic drives, with photos.
- **How do I get there?** Hand-offs to Google Maps directions, AllTrails, Parks Canada, Ontario Parks and Sépaq reservations.

### Core user stories
1. As a leaf-peeper, I open the map and see which regions are near peak this week.
2. I tap a region or park and see the colour %, dominant colours, species turning, recent photos, a 7-day forecast, and the best trails to walk.
3. I filter the map by species (e.g. "show me where the larches are gold").
4. I check "best time to visit" for a park I want to go to next year (historical peak windows plus climate normals).
5. I save spots, plan a weekend loop, and open directions or a booking site with one tap.
6. I submit my own colour report with a photo, which feeds the map for everyone.

---

## 2. Data sources (researched and verified)

✅ = queried live from this machine on 2026-09-30.

### 2.1 Leaf status and colour progression

| Source | What it gives us | Access | Notes |
|---|---|---|---|
| ✅ **iNaturalist API** | Geotagged plant observations with a phenology annotation: `term_id=36` (Leaves) → `39 Colored Leaves`, `40 No Live Leaves`, `38 Green Leaves`. Includes species, photos and date. `place_id=6712` = Canada. | Free, no key, ~60 req/min guideline | **The backbone signal.** 799 coloured-leaf observations in Canada since Sept 15 this year. Gives us species-level, photo-backed ground truth. Photos are CC-licensed per observation, so show attribution. |
| **Ontario Parks Fall Colour Report** ([ontarioparks.ca/fallcolour](https://www.ontarioparks.ca/fallcolour)) | Per park: report date, dominant colour, colour change %, leaf fall %, best viewing text (~67 parks) | HTML only, no API | Scrape on a schedule (server-side, cache, credit the source). Ask Ontario Parks for a data-sharing agreement before launch. |
| **Algonquin Park Fall Colour Report** | Detailed canopy-level updates | HTML | Scrape or link out. |
| **Bonjour Québec colour map** | Region-by-region stage, updated every Thursday | HTML/JS map | Scrape region stage, or link out. |
| **Tourism Nova Scotia / NB / PEI / BC** | Mostly editorial: typical windows, top spots | PDF/blog | Use to seed curated "typical peak window" data. |
| **NASA GIBS** (VIIRS/MODIS true colour, daily) | Daily satellite imagery tiles, WMTS | ✅ Free, no key | Lets users see the real colour of the land from orbit. Clouds are a problem, so offer a "last clear day" date picker. |
| **VIIRS VNP22Q2 / MODIS MCD12Q2 Land Surface Phenology** | Per-pixel senescence onset dates (yearly, 500 m) | NASA Earthdata (free login) | Offline pipeline: compute **historical median peak date** per grid cell → the "when to go" model. |
| **User reports** (our own) | Colour %, leaf-fall %, photo, species | Our backend | Crowd-sourced. Moderation needed. |

**Colour-status model (v1):** For each region or grid cell, blend (a) official reports when fresh (≤7 days), (b) the iNaturalist coloured-vs-green ratio over the last 10 days, (c) user reports, and (d) the historical satellite peak date adjusted by this season's temperature anomaly. Output: `colourChangePct`, `leafFallPct`, `stage` (green → patchy → near peak → peak → past peak → bare), and a confidence score. Always show the source and how fresh it is.

### 2.2 Tree species

| Source | Use |
|---|---|
| **SCANFI** (Spatialized Canadian National Forest Inventory, 30 m, NRCan) | Species composition rasters → "which species dominate here" for each region. Pre-process into vector tiles or region summaries. |
| **Tree Species 2019** / **Long-term Tree Species 1984–2022** (NRCan, open.canada.ca) | Leading-species maps → species filter layer. |
| **iNaturalist taxa API** | Species metadata, common names (EN/FR), photos, and the observations behind each species' colour status. |
| Curated content | Per-species "turns colour" profile: typical colour (red, orange, yellow, gold), relative timing (early: red maple, birch, larch; late: oak, beech), plus ID tips. |

### 2.3 Weather and climate

| Source | Use | Access |
|---|---|---|
| ✅ **Open-Meteo** | Forecast (16-day), historical reanalysis back to 1940, hourly | Free for non-commercial use, no key. **Paid plan required if the app is commercial.** |
| ✅ **MSC GeoMet / api.weather.gc.ca** (Environment Canada) | Official Canadian forecasts, climate normals (90k+ records), daily/hourly climate stations, radar WMS layers | Free, anonymous, OGC API. Fine for commercial use. |
| **Google Maps Weather API** | Current conditions, 240 h hourly, 10-day daily | Paid (Essentials SKU with a free monthly cap). Nice if we go all-Google. |
| **Google Air Quality / Pollen APIs** | Wildfire smoke and AQ are big in fall | Paid; optional. |

**Why weather matters for leaves:** cold nights (<7 °C) plus sunny days give the brightest reds. Frost and wind storms strip trees fast. We'll show a **"Colour outlook"** that flags good red-colour weather and "leaf-drop risk" (wind gusts >50 km/h or heavy rain).

### 2.4 Trails and points of interest

| Source | What | Access |
|---|---|---|
| ✅ **Parks Canada Trails (APCA)** | 1,349 official trails in national parks/historic sites, as line geometry, bilingual names | Free ArcGIS FeatureServer / GeoJSON, updated weekly |
| **Parks Canada places** dataset | Park boundaries and locations | open.canada.ca |
| **OpenStreetMap via Overpass API** | Hiking routes (`route=hiking`), paths, `waterway=waterfall`, `tourism=viewpoint`, lakes, scenic drives | Free (ODbL, attribution required). Same raw source AllTrails builds on. |
| **Waymarked Trails API** | Pre-assembled hiking route relations with elevation | Free, open-source |
| **Google Places API (New)** | Ratings, photos, hours and reviews for parks, `hiking_area`, tourist attractions, waterfalls | Paid per field tier, 10k free/month per Essentials SKU |
| **Provincial open data** (Ontario GeoHub, Données Québec, BC Data Catalogue) | Provincial park boundaries and trails | Free |

### 2.5 Images

1. **iNaturalist observation photos**: species-accurate and current (CC licences, attribute).
2. **Google Places photos**: high-quality and plentiful, but must be shown with Google attribution and only alongside a Google map.
3. **Wikimedia Commons geosearch** (`list=geosearch`, namespace 6): free and good for landmarks.
4. **Flickr API** `photos.search` with bbox + `tags=autumn,fall`: lots of fall photography (check licences).
5. **User uploads.**
6. *Unsplash* only for marketing and hero imagery, since it isn't location-accurate.

### 2.6 Trip-planning hand-offs (leverage, don't rebuild)

None of AllTrails, Parks Canada, Ontario Parks or Sépaq offer public APIs for routing or booking. **Deep links** are the reliable, ToS-safe way to integrate:

- **Google Maps URLs** (free, no key): `https://www.google.com/maps/dir/?api=1&destination=lat,lng&travelmode=driving`. Multi-stop trips use `waypoints=`.
- **AllTrails**: link to a search/explore URL for the park; no public API.
- **Parks Canada Reservation Service**, **Ontario Parks Reservations**, **Sépaq**, **BC Parks**: deep link to each park's booking page (curated URL per park).
- **Export**: GPX for trails (from OSM/Parks Canada geometry) and `.ics` for planned dates.
- **Google Maps Aerial View API**: cinematic flyover video of a landmark on the park page.

---

## 3. Maps: what looks amazing and what we can use

### Inspiration
- **Felt**: soft, muted basemap with data in front. Our foliage layer is the hero.
- **Windy / Ventusky**: animated WebGL weather fields. Use for an animated "colour wave" moving south through the season.
- **onX / AllTrails / FATMAP**: 3D terrain plus trail lines. Good for park detail views.
- **Mapbox Standard / globe showcases**: globe at low zoom, smooth transition to terrain.
- **Airbnb**: clean, quiet map UI. Cards and bottom sheets over a calm map.
- **Existing foliage trackers**: SmokyMountains.com's US prediction map is the famous one. Ontario Parks uses leaf icons on a map; Bonjour Québec uses a colour-coded regional map. **Nobody does a good Canada-wide one.** That's our gap.

### Google Maps Platform: what's useful
| API | Use in Canopy | Pricing note (post-March 2025 model) |
|---|---|---|
| **Maps JavaScript API** (vector map + cloud styling) via `@vis.gl/react-google-maps` | Main 2D map with a custom autumn style | Essentials: ~10k free loads/month |
| **3D Maps / `<Map3D>`** (photorealistic, `Map3DElement`) | Park and lookout "fly-to" in photorealistic 3D. This is the wow moment. | Enterprise SKU, ~1k free/month, so lazy-load on demand only |
| **deck.gl `GoogleMapsOverlay`** | WebGL heatmaps/hexbins for colour status, animated colour wave | Free (library) |
| **Places API (New)** | Nearby `park`, `hiking_area`, `tourist_attraction`; photos and ratings | Price depends on fields requested. Use field masks aggressively. |
| **Aerial View API** | Flyover videos for landmarks | Limited US-first coverage. Check Canada availability per address. |
| **Weather / Air Quality / Pollen** | Optional alternatives to Open-Meteo/ECCC | Paid |
| **Routes API** | Scenic-drive loops, drive times between spots | Paid; v2 |

⚠️ **Licensing constraint:** Google's Service Specific Terms say Places content (and Directions) **must not be used in conjunction with a non-Google map**. If we show Google Places data (photos, ratings), the map has to be a Google map.

### Decision (updated 2026-10-01): Mapbox GL JS + Mapbox Standard ✅
- **Now:** Mapbox GL JS v3 (`react-map-gl/mapbox`) with the **Mapbox Standard** style, configured at runtime (`src/lib/mapStyle.ts`): faded theme, autumn land/greenspace/water colours, fewer labels, 3D trees and landmarks, a globe at low zoom, and a light preset (**dusk** by default; dawn/day/night/auto in the Layers menu).
- Data layers use Standard **slots** (`bottom` for hillshade/satellite, `middle` for our data, `top` for trail labels) and `*-emissive-strength: 1` so colours stay true under every light preset.
- Terrain and hillshade come from Mapbox's DEM (`mapbox.mapbox-terrain-dem-v1`).
- Same token unlocks Isochrone (drive-time filter, EXP-3), Directions, Search Box/Geocoding and Static Images (share images, PLAT-9).
- **Cost:** 50k web map loads/month free. Token is a URL-restricted public `pk.` token in `VITE_MAPBOX_TOKEN` (repo variable for Pages builds).
- **Trade-offs:** ~517 KB gzipped engine (vs ~280 KB MapLibre); proprietary licence. The previous free stack (MapLibre + OpenFreeMap) is in git history (`937eb75`) if we ever need to switch back.
- **Google Places content still can't go on this map** (Google's licence terms). Use iNaturalist, Wikimedia Commons, OSM and Parks Canada for photos and POIs.

---

## 4. Architecture

```
┌──────────────────────────── Web app (Vite + React + TS) ────────────────────────────┐
│  React Router · TanStack Query · Tailwind v4 · Mapbox GL (react-map-gl) · deck.gl   │
│  Views: Map (home) · Region/Park detail · Species · Trip planner · Report           │
└───────────────┬────────────────────────────────────────────┬────────────────────────┘
                │ client-safe, CORS-OK APIs                  │ our API
  iNaturalist · Open-Meteo · GeoMet · GIBS tiles             │
                                                            ▼
                         ┌──────────── Edge API (Cloudflare Workers) ───────────┐
                         │ /status  /regions/:id  /reports  /places proxy       │
                         │ KV/D1 cache · R2 for user photos · Cron triggers     │
                         └───────┬───────────────────────────────┬──────────────┘
                                 │ cron (hourly/daily)           │
              scrapers: Ontario Parks, Algonquin, Bonjour Québec │
              iNat aggregation → per-region colour index         │
                                                                 ▼
                         Offline pipeline (Python, run yearly/seasonally):
                         VIIRS/MODIS phenology → historical peak dates per cell
                         SCANFI species rasters → species-per-region summaries
                         Parks Canada + OSM trails → PMTiles / GeoJSON
```

- **Frontend:** Vite + React 19 + TypeScript, Tailwind v4, TanStack Query (caching and staleness for every source), React Router.
- **Backend:** Cloudflare Workers + D1 (SQLite) + KV + R2 + Cron Triggers. Cheap, global, and good for scheduled scraping and API key proxying (keeps the Places key server-side).
- **Auth (v2):** for saved trips and reports.
- **PWA:** installable, offline-cached trail data for patchy park signal.

### Core data model
```ts
Region   { id, name, province, geometry, typicalPeak: {start, end}, dominantSpecies[], links{} }
Status   { regionId, date, colourChangePct, leafFallPct, stage, dominantColours[], confidence, sources[] }
Species  { taxonId, nameEn, nameFr, fallColour, timing: 'early'|'mid'|'late' }
Trail    { id, name, geometry, lengthKm, source, parkId, scenicScore }
Report   { id, userId, location, colourChangePct, leafFallPct, speciesIds[], photoUrl, createdAt }
```

---

## 5. UX outline (mobile-first)

- **Home = map.** Desktop has a left panel; mobile has a draggable bottom sheet. Top: a season timeline scrubber (Sept → Nov) that animates the colour wave, with "Today" highlighted.
- **Layers toggle:** Colour status · Leaf fall · Species · Satellite (GIBS) · Trails · Weather.
- **Region/park sheet:** big colour-stage badge, % bars, "Peak expected: Oct 3–10", photos carousel, 7-day forecast with a colour-outlook chip, top trails, waterfalls/lookouts nearby, a "Fly over in 3D" button, and Directions / Book / AllTrails buttons.
- **Species page:** where it's turning now, typical colours, ID tips, recent photos.
- **Report flow:** photo → auto-locate → two sliders (colour %, leaf fall %) → species chips → submit.
- **Visual language:** warm autumn palette (maple red, pumpkin orange, birch gold, spruce green, slate). Calm basemap. Light and dark themes.

---

## 6. Roadmap

### Milestone 0 — Foundations (this commit)
- [x] Vite + React + TS + Tailwind + MapLibre/OpenFreeMap scaffold (React Router added when we add routes)
- [x] Live iNaturalist "Colored Leaves" observations across Canada on the map
- [x] Curated regions with typical peak windows
- [x] Region panel with Open-Meteo 7-day forecast plus colour outlook
- [x] CI (lint/build) on GitHub Actions

### Milestone 1 — The live map (MVP) ✅ 2026-09-30
- [x] Autumn-tinted OpenFreeMap style (light + dark), hillshade, optional 3D terrain (AWS Terrarium DEM)
- [x] Colour-sighting hexbins from iNaturalist (zoom-adaptive, client-side, no deps) + individual sightings when zoomed in
- [x] Tree filter: iNat observations grouped into maples, oaks, birches, aspens, larches and more via genus ancestors (`src/data/treeGroups.ts`)
- [x] Ontario Parks report → `public/data/ontario-parks.json`, refreshed daily by a GitHub Action (no backend needed yet)
- [x] Official park layer coloured by stage, park detail panel (colour %, leaf fall %, viewing tips, forecast, photos, booking)
- [x] Parks Canada trails layer (bbox-queried from ArcGIS at zoom ≥ 9, cached per 0.5° tile)
- [x] NASA GIBS VIIRS true-colour satellite layer with a date picker
- [x] Mobile bottom sheet (peek / half / full), desktop side panel, layers popover + legend
- [x] Web app manifest (installable). Service worker / offline still to do.

**Learned along the way**
- iNat's "Leaves" annotation is mostly used for coloured leaves (766 vs 64 leafless in 14 days), so hexes show *where colour is being seen*, not % change. Real % change needs green-leaf counts too: use iNat's UTFGrid tiles or the `/observations` count endpoint per cell (Milestone 2).
- Raw iNat top species are often non-trees (fireweed, poison ivy), hence the genus-based tree groups.

### Milestone 2 — When to go
- VIIRS/MODIS historical peak pipeline → typical peak per cell
- Season timeline scrubber + animated colour wave
- ECCC climate normals + temperature anomaly → peak forecast
- Bonjour Québec + Algonquin ingestion

### Milestone 3 — Explore and plan
- Places (New) nearby lookouts, waterfalls, lakes, hiking areas (server-proxied, field-masked)
- OSM Overpass waterfalls and viewpoints layer
- `<Map3D>` flyovers, Aerial View where available
- Trip planner: saved spots → Google Maps multi-stop link, GPX and .ics export, booking deep links

### Milestone 4 — Community
- Accounts, user colour reports with photos (R2), moderation
- Notifications: "Algonquin just hit peak"
- Bilingual EN/FR

---

## 7. Risks and open questions
- **Scraping official reports**: fragile and a terms question. Build parsers defensively, credit sources, and reach out to Ontario Parks, Sépaq and Tourism NS for data partnerships.
- **Open-Meteo is non-commercial on the free tier.** Use ECCC GeoMet for commercial launch or pay for Open-Meteo.
- **Google costs:** Map3D and Places Pro fields add up. Lazy-load 3D, cache Places server-side within ToS limits, and use field masks.
- **iNat data is spiky** (lots in the south, sparse in the north). Weight by confidence and fall back to satellite or historical data.
- **Name:** "Canopy" is a working title.

---

## Sources
- [Ontario Parks fall colour report](https://www.ontarioparks.ca/fallcolour) · [Algonquin report](https://www.algonquinpark.on.ca/visit/general_park_info/fall-colour-report.php) · [Bonjour Québec fall](https://www.bonjourquebec.com/en-ca/explore/seasons/fall) · [Tourism NS fall colours](https://novascotia.com/blog/fall-colours-in-nova-scotia-when-to-go-and-what-to-look-for/)
- [iNaturalist phenology annotations](https://www.inaturalist.org/blog/96054-enabling-research-on-flowers-fruits-and-leaves) · [Using iNat phenology data](https://www.inaturalist.org/posts/34467-using-inaturalist-phenology-data)
- [MSC GeoMet docs](https://eccc-msc.github.io/open-data/msc-geomet/readme_en/) · [api.weather.gc.ca](https://api.weather.gc.ca/) · [Open-Meteo](https://open-meteo.com/)
- [NASA GIBS API](https://nasa-gibs.github.io/gibs-api-docs/access-basics/) · [VIIRS phenology VNP22Q2](https://www.earthdata.nasa.gov/data/catalog/lpcloud-vnp22q2-002)
- [SCANFI](https://open.canada.ca/data/en/dataset/18e6a919-53fd-41ce-b4e2-44a9707c52dc) · [Tree Species 2019](https://open.canada.ca/data/en/dataset/fcdcf0e7-fe84-46f0-9b39-5078341e9133)
- [Parks Canada Trails APCA](https://ouvert.canada.ca/data/dataset/64a90e8d-5bc0-4027-8645-b5881b4068d4) · [Waymarked Trails API](https://github.com/waymarkedtrails/waymarkedtrails-api) · [AllTrails on OSM data](https://support.alltrails.com/hc/en-us/articles/360019246411-OSM-derivative-database-derivation-methodology)
- [Google Maps pricing](https://developers.google.com/maps/billing-and-pricing/pricing) · [Map Tiles billing](https://developers.google.com/maps/documentation/tile/usage-and-billing) · [Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms) · [Environment APIs](https://developers.google.com/maps/environment) · [react-google-maps Map3D](https://visgl.github.io/react-google-maps/docs/api-reference/components/map-3d)
- [Felt: how to design a beautiful map](https://felt.com/blog/how-to-design-a-beautiful-map) · [Mapbox gallery](https://www.mapbox.com/gallery) · [MapLibre vs Mapbox 2026](https://js-maps.com/maplibre-gl-js-vs-mapbox-gl-js-the-2026-developers-guide-to-choosing-your-webgl-map-engine/)
- [Parks Canada reservations](https://www.parks.canada.ca/voyage-travel/reserve) · [Ontario Parks reservations](https://reservations.ontarioparks.ca/)
