import { lazy } from 'react'

// The app's pages, each loaded when it is first opened. A visit starts on the map with a search
// card, so none of them is needed for the first paint. Once the browser is idle they are fetched
// in the background (see `preloadPages`), so opening one does not wait on the network.

const load = {
  explore: () => import('./components/ExplorePanel'),
  sections: () => import('./components/SectionPanels'),
  foliage: () => import('./components/FoliagePanel'),
  trips: () => import('./components/TripPanels'),
  region: () => import('./components/RegionPanel'),
  park: () => import('./components/ParkPanel'),
  trail: () => import('./components/TrailPanel'),
  place: () => import('./components/PlacePanel'),
  fishing: () => import('./components/FishingPanel'),
  tree: () => import('./components/TreePanel'),
}

export const ExplorePanel = lazy(() => load.explore().then((m) => ({ default: m.ExplorePanel })))
export const ParksPanel = lazy(() => load.sections().then((m) => ({ default: m.ParksPanel })))
export const TrailsPanel = lazy(() => load.sections().then((m) => ({ default: m.TrailsPanel })))
export const AboutPanel = lazy(() => load.sections().then((m) => ({ default: m.AboutPanel })))
export const DataSourcesPanel = lazy(() => load.sections().then((m) => ({ default: m.DataSourcesPanel })))
export const FoliagePanel = lazy(() => load.foliage().then((m) => ({ default: m.FoliagePanel })))
export const TripsPanel = lazy(() => load.trips().then((m) => ({ default: m.TripsPanel })))
export const TripPanel = lazy(() => load.trips().then((m) => ({ default: m.TripPanel })))
export const RegionPanel = lazy(() => load.region().then((m) => ({ default: m.RegionPanel })))
export const ParkPanel = lazy(() => load.park().then((m) => ({ default: m.ParkPanel })))
export const TrailPanel = lazy(() => load.trail().then((m) => ({ default: m.TrailPanel })))
export const PlacePanel = lazy(() => load.place().then((m) => ({ default: m.PlacePanel })))
export const FishingPanel = lazy(() => load.fishing().then((m) => ({ default: m.FishingPanel })))
export const TreePanel = lazy(() => load.tree().then((m) => ({ default: m.TreePanel })))

/**
 * Fetches every page in the background once the browser has nothing better to do. Skipped for
 * people who have asked their browser to save data; their pages load when opened.
 */
export function preloadPages() {
  if ((navigator as { connection?: { saveData?: boolean } }).connection?.saveData) return
  const go = () => {
    for (const fetchPage of Object.values(load)) void fetchPage().catch(() => {})
  }
  if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 4000 })
  else setTimeout(go, 2000)
}
