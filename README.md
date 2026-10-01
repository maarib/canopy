# 🍁 Canopy

Track fall colours and leaf drop across Canada: every tree species, every park, live conditions, and when and where to go.

> Working title.
> - **[docs/PRD.md](docs/PRD.md)**: product requirements, user journeys, design patterns and release plan
> - **[docs/PLAN.md](docs/PLAN.md)**: technical plan, data sources and architecture
> - **[Issues](https://github.com/maarib/canopy/issues)** and **[milestones](https://github.com/maarib/canopy/milestones)**: every design and dev task

## What works today (Milestone 1)
- **Live map**: Mapbox Standard on a globe with autumn colours and dusk lighting (dawn/day/night too), hillshade, optional 3D terrain
- **Official reports**: Ontario Parks colour % and leaf-fall % for ~65 parks, refreshed daily by a GitHub Action
- **Crowd sightings**: iNaturalist coloured-leaf observations, grouped into hexes and filterable by tree type (maples, oaks, birches, aspens, larches…)
- **Trails**: Parks Canada official trails when zoomed in
- **Satellite**: NASA VIIRS daily true-colour imagery with a date picker
- **Region and park panels**: 7-day colour outlook, trees to look for, nearby photos, directions and booking links
- **Responsive**: side panel on desktop, draggable bottom sheet on mobile

## Getting started
```bash
npm install
cp .env.example .env.local   # add your Mapbox token
npm run dev
```

The map needs a free [Mapbox](https://account.mapbox.com/access-tokens/) public token (`pk.…`). Copy `.env.example` to `.env.local` and set `VITE_MAPBOX_TOKEN`. Everything else uses free, open services.

Refresh the Ontario Parks snapshot locally with `npm run data:ontario-parks` (CI does this daily in season).

## Stack
Vite · React 19 · TypeScript · Tailwind v4 · TanStack Query · Mapbox GL JS (`react-map-gl`) · Mapbox Standard style

## Data credits
- Basemap: © [Mapbox](https://www.mapbox.com/about/maps/) · © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
- Observations and photos: [iNaturalist](https://www.inaturalist.org) contributors (individual CC licences)
- Weather: [Open-Meteo](https://open-meteo.com) (CC BY 4.0, non-commercial free tier)
- Park reports: [Ontario Parks Fall Colour Report](https://www.ontarioparks.ca/fallcolour)
- Trails: [Parks Canada](https://open.canada.ca/data/en/dataset/64a90e8d-5bc0-4027-8645-b5881b4068d4) (Open Government Licence – Canada)
- Satellite imagery: [NASA GIBS](https://www.earthdata.nasa.gov/gibs) · Terrain: Mapzen / AWS Open Data
- Typical peak windows: provincial tourism and park guidance (approximate)
