# Explore Ontario: trails, waterfalls, lookouts, lakes and creeks

_Design and research notes for turning Canopy into a one-stop shop for exploring Ontario._
Last updated: 2026-10-01 · Related: [PRD](PRD.md) · [PLAN](PLAN.md)

## The job

> "I'm planning a trip to Algonquin. Show me the trails, and for any trail, show me the track on the map and everything worth stopping for along it: lookouts for photos, waterfalls, creeks and lakes."

The planning loop: **area → trails and places → trail detail (track + stops) → place detail → go.**

## What we learned from other apps

| App | Pattern | What Canopy does with it |
|---|---|---|
| **AllTrails** | Trail page: length, est. time, elevation gain and route type up top; interactive elevation chart you drag to see the point on the map; waypoints (trailheads, attractions); geotagged photos along the route; recent conditions with timestamps | ✅ Stats row, draggable elevation chart linked to a map marker, "Along the trail" timeline with km, GPX download. Next: photos pinned along the route, condition reports. |
| **Tripadvisor** | Every attraction has its own page with a strong identity, "things to do nearby", and how to get there | ✅ Every waterfall, lookout, peak, lake, river and creek has its own page, icon and color, plus "Reach it on" (the trails that pass it), directions and weather. Next: "nearby" rail, rankings. |
| **Airbnb** | Split list + map; map pins that stay in sync with the list; wishlists for collaborative planning; neighbourhood guides | ✅ Region page lists trails and photo spots over the map. Next: desktop split view, **wishlists → trips** (save trails and places, share a plan), area guides. |

Sources: [AllTrails trail page update](https://www.alltrails.com/press/alltrails-reveals-major-update) · [AllTrails map layers](https://support.alltrails.com/hc/en-us/articles/37228180990228-AllTrails-map-types-overlays-and-extras) · [Baymard: split-view search results](https://baymard.com/blog/accommodations-split-view) · [Airbnb map platform](https://adamshutsa.com/map-platform/) · [Airbnb UX observations](https://takuma-kakehi.medium.com/airbnb-ux-design-observations-49d191807294)

## Identity system

Each kind of place has a label, color, icon and page template (`src/lib/explore.ts`, `src/components/PlaceIcon.tsx`).

| Kind | Color | Icon | Page highlights |
|---|---|---|---|
| Trail / trailhead | spruce `#2f5d3a` | signpost | Track on map, stats, elevation chart, along-the-trail timeline, GPX |
| Waterfall | blue `#2b7bbf` | falls | Photo spot, trails that reach it |
| Lookout | amber `#d9821e` | camera | **Photo spot**, best light tips |
| Peak | brown `#8a5a3c` | mountain | Elevation, photo spot |
| Lake | teal `#2a8a8f` | waves | Trails along the shore |
| River / creek | blue `#4a90b8` / `#5ba6c9` | winding line | Trails that cross or follow it |

Provincial parks keep their color-stage identity (official report pages).

## Data

Built per area by `scripts/build-explore.mjs` → `public/data/explore/<area>.json`, refreshed weekly by CI.

| What | Source | Licence |
|---|---|---|
| Trails (name, description, uses, length, operator) | [Ontario Trail Network](https://data.ontario.ca/dataset/ontario-trail-network), MNRF (5,760 off-road segments province-wide) | Open Government Licence – Ontario |
| Trailheads | OTN access points (853) | OGL – Ontario |
| Waterfalls, lookouts, peaks, lakes, creeks, rivers | OpenStreetMap via Overpass | ODbL |
| Elevation profiles | Mapzen Terrarium tiles (AWS Open Data) | Public |
| Provincial park boundaries (next) | [Provincial Park Regulated](https://geohub.lio.gov.on.ca/), 347 parks, names in English, French, Ojibwe and Cree | OGL – Ontario |

Per trail the script computes length, loop vs point-to-point (official geometry stops short at parking lots, so a gap ≤ 20% of length counts as a loop), elevation gain/loss, difficulty (`km + gain/100`), a relaxed-pace time estimate (4 km/h + 1 h per 600 m), and every place within a threshold of the route with its km (falls 250 m, lookouts 200 m, lakes 120 m, creeks 40 m).

**Adding an area:** add it to `AREAS` in the script, run `npm run data:explore <id>`, add the id to `AREA_IDS` in `src/lib/explore.ts`.

### Known gaps
- Many lookouts are unnamed in OSM ("Lookout on Booth's Rock Trail"). Curated names and photos would help.
- Some famous stops aren't mapped as viewpoints (e.g. Track and Tower's lookout). Add curated waypoints per area.
- Overpass is often overloaded (504s), so the script retries across three mirrors with backoff. It's fine for CI but not for live use.

## Roadmap

1. **More areas:** Killarney, Bon Echo, Frontenac, Arrowhead, Muskoka, Bruce Peninsula, Lake Superior, Algoma Highlands, then province-wide trails as PMTiles.
2. **Smaller parks:** conservation areas and municipal parks (OSM `leisure=nature_reserve|park`, Conservation Ontario).
3. **Park pages from official boundaries** for all 347 provincial parks, with their trails and places.
4. **Trips (Airbnb wishlists):** save trails and places, order them by day, share a plan, export GPX/ICS.
5. **Photos along the route:** iNaturalist and Wikimedia Commons geotagged photos pinned on the track.
6. **Conditions and reviews:** dated community reports (mud, closures, color).
7. **3D flyover** of a trail using Mapbox terrain.
