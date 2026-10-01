# 🍁 Canopy

Track fall colours and leaf drop across Canada: every tree species, every park, live conditions, and when and where to go.

> Working title. See **[docs/PLAN.md](docs/PLAN.md)** for the full product and technical plan: data sources, Google Maps strategy, architecture and roadmap.

## What works today (Milestone 1)
- **Live map**: autumn-tinted free basemap (light/dark), hillshade, optional 3D terrain
- **Official reports**: Ontario Parks colour % and leaf-fall % for ~65 parks, refreshed daily by a GitHub Action
- **Crowd sightings**: iNaturalist coloured-leaf observations, grouped into hexes and filterable by tree type (maples, oaks, birches, aspens, larches…)
- **Trails**: Parks Canada official trails when zoomed in
- **Satellite**: NASA VIIRS daily true-colour imagery with a date picker
- **Region and park panels**: 7-day colour outlook, trees to look for, nearby photos, directions and booking links
- **Responsive**: side panel on desktop, draggable bottom sheet on mobile

## Getting started
```bash
npm install
npm run dev
```

No API keys needed. Everything runs on free, open services.

Refresh the Ontario Parks snapshot locally with `npm run data:ontario-parks` (CI does this daily in season).

## Stack
Vite · React 19 · TypeScript · Tailwind v4 · TanStack Query · MapLibre GL (`react-map-gl`) · OpenFreeMap basemaps

## Data credits
- Basemap: [OpenFreeMap](https://openfreemap.org) · © [OpenMapTiles](https://openmaptiles.org) · data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
- Observations and photos: [iNaturalist](https://www.inaturalist.org) contributors (individual CC licences)
- Weather: [Open-Meteo](https://open-meteo.com) (CC BY 4.0, non-commercial free tier)
- Park reports: [Ontario Parks Fall Colour Report](https://www.ontarioparks.ca/fallcolour)
- Trails: [Parks Canada](https://open.canada.ca/data/en/dataset/64a90e8d-5bc0-4027-8645-b5881b4068d4) (Open Government Licence – Canada)
- Satellite imagery: [NASA GIBS](https://www.earthdata.nasa.gov/gibs) · Terrain: Mapzen / AWS Open Data
- Typical peak windows: provincial tourism and park guidance (approximate)
