# 🍁 Canopy

Track fall colours and leaf drop across Canada: every tree species, every park, live conditions, and when and where to go.

> Working title. See **[docs/PLAN.md](docs/PLAN.md)** for the full product and technical plan: data sources, Google Maps strategy, architecture and roadmap.

## What works today (Milestone 0)
- Google Map of Canada with curated fall-colour regions, coloured by where they are in their typical peak window
- Live **iNaturalist** "Colored Leaves" observations across Canada (last 14 days)
- Region panel with a 7-day **Open-Meteo** forecast and a *colour outlook* (vivid reds / leaf-drop risk / frost), species to look for, highlights, nearby leaf photos, and directions/booking links
- Responsive: split view on desktop, stacked on mobile

## Getting started
```bash
npm install
cp .env.example .env.local   # add your Google Maps key
npm run dev
```

The panel (regions, forecast, photos) works without a key; the map needs `VITE_GOOGLE_MAPS_API_KEY` with the **Maps JavaScript API** enabled.

## Stack
Vite · React 19 · TypeScript · Tailwind v4 · TanStack Query · `@vis.gl/react-google-maps`

## Data credits
- Observations and photos: [iNaturalist](https://www.inaturalist.org) contributors (individual CC licences)
- Weather: [Open-Meteo](https://open-meteo.com) (CC BY 4.0, non-commercial free tier)
- Typical peak windows: provincial tourism and park guidance (approximate)
