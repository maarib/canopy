# 🍁 Canopy

Track fall colours and leaf drop across Canada: every tree species, every park, live conditions, and when and where to go.

> Working title. See **[docs/PLAN.md](docs/PLAN.md)** for the full product and technical plan: data sources, Google Maps strategy, architecture and roadmap.

## What works today (Milestone 0)
- Free map of Canada (MapLibre + OpenFreeMap, no API key) with curated fall-colour regions, coloured by where they are in their typical peak window
- Live **iNaturalist** "Colored Leaves" observations across Canada (last 14 days)
- Region panel with a 7-day **Open-Meteo** forecast and a *colour outlook* (vivid reds / leaf-drop risk / frost), species to look for, highlights, nearby leaf photos, and directions/booking links
- Responsive: split view on desktop, stacked on mobile

## Getting started
```bash
npm install
npm run dev
```

No API keys needed. Everything runs on free, open services.

## Stack
Vite · React 19 · TypeScript · Tailwind v4 · TanStack Query · MapLibre GL (`react-map-gl`) · OpenFreeMap basemaps

## Data credits
- Basemap: [OpenFreeMap](https://openfreemap.org) · © [OpenMapTiles](https://openmaptiles.org) · data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
- Observations and photos: [iNaturalist](https://www.inaturalist.org) contributors (individual CC licences)
- Weather: [Open-Meteo](https://open-meteo.com) (CC BY 4.0, non-commercial free tier)
- Typical peak windows: provincial tourism and park guidance (approximate)
