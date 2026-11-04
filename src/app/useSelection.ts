import { useEffect, useMemo } from 'react'
import type { Section } from '../components/AppNav'
import { REGIONS, type Region } from '../data/regions'
import { TREE_BY_ID, type TreeInfo } from '../data/trees'
import { placeIdFromSlug, trailIdFromSlug, type ExploreArea, type Place, type Trail } from '../lib/explore'
import { accessTitle, fishingIdFromSlug, type FishingAccess } from '../lib/fishingAccess'
import { parkTitle, type ParkReport } from '../lib/ontarioParks'
import { decodeTrip, type SharedTrip, type Trip } from '../lib/trips'
import { parkIdFromSlug } from '../lib/urlState'
import type { AppData } from './useAppData'
import type { Route } from './routes'

/** What the page shows: a place, a section's list, a trip, or (null) Explore. */
export type Selection =
  | { kind: 'region'; region: Region }
  | { kind: 'tree'; tree: TreeInfo }
  | { kind: 'park'; park: ParkReport }
  | { kind: 'loading' }
  | { kind: 'trail'; trail: Trail; area: ExploreArea }
  | { kind: 'place'; place: Place; area: ExploreArea }
  | { kind: 'fishing'; access: FishingAccess }
  | { kind: 'parks' }
  | { kind: 'trails' }
  | { kind: 'foliage' }
  | { kind: 'about' }
  | { kind: 'sources' }
  | { kind: 'trips' }
  | { kind: 'trip'; trip: Trip }
  | { kind: 'shared-trip'; trip: SharedTrip }
  | { kind: 'missing' }
  | null

/** Resolves the route against the app's data: the page to show, and a key that changes with it. */
export function useSelection(route: Route, data: AppData, trips: Trip[], sharedTrip: string | null) {
  const { parks, parksIndex, everyPark, explore, exploreIndex, fishing, fishingById } = data
  const { regionId, treeId, parkSlug, trailSlug, placeSlug, fishingSlug, sectionPath, tripId } = route
  const onTripsPage = route.trips
  const selection: Selection = useMemo(() => {
    if (onTripsPage) return { kind: 'trips' }
    // Places lives at /places; /trails is its old address and still works.
    if (sectionPath) return { kind: (sectionPath === '/places' ? 'trails' : sectionPath.slice(1)) as 'parks' | 'trails' | 'foliage' | 'about' | 'sources' }
    if (tripId) {
      if (tripId === 'shared') {
        const shared = decodeTrip(sharedTrip ?? '')
        return shared ? { kind: 'shared-trip', trip: shared } : { kind: 'missing' }
      }
      const trip = trips.find((t) => t.id === tripId)
      return trip ? { kind: 'trip', trip } : { kind: 'missing' }
    }
    if (treeId) {
      const tree = TREE_BY_ID.get(treeId)
      return tree ? { kind: 'tree', tree } : { kind: 'missing' }
    }
    if (regionId) {
      const region = REGIONS.find((r) => r.id === regionId)
      return region ? { kind: 'region', region } : { kind: 'missing' }
    }
    if (parkSlug) {
      if (!parks.data) return parks.isError ? { kind: 'missing' } : { kind: 'loading' }
      const id = parkIdFromSlug(parkSlug)
      const park = everyPark?.find((p) => p.id === id)
      if (park) return { kind: 'park', park }
      // Not a report location: it may be one of the other parks, once that list has arrived.
      return parksIndex.isPending ? { kind: 'loading' } : { kind: 'missing' }
    }
    if (fishingSlug) {
      if (!fishing.data) return fishing.isError ? { kind: 'missing' } : { kind: 'loading' }
      const access = fishingById.get(fishingIdFromSlug(fishingSlug))
      return access ? { kind: 'fishing', access } : { kind: 'missing' }
    }
    if (trailSlug || placeSlug) {
      if (!explore.data) return explore.isError ? { kind: 'missing' } : { kind: 'loading' }
      if (trailSlug) {
        const trail = exploreIndex.trailById.get(trailIdFromSlug(trailSlug))
        return trail ? { kind: 'trail', trail, area: exploreIndex.areaById.get(trail.areaId)! } : { kind: 'missing' }
      }
      const place = exploreIndex.placeById.get(placeIdFromSlug(placeSlug!))
      return place ? { kind: 'place', place, area: exploreIndex.areaById.get(place.areaId)! } : { kind: 'missing' }
    }
    return null
  }, [regionId, treeId, parkSlug, trailSlug, placeSlug, fishingSlug, sectionPath, fishing.data, fishing.isError, fishingById, onTripsPage, tripId, trips, sharedTrip, parks.data, parks.isError, everyPark, parksIndex.isPending, explore.data, explore.isError, exploreIndex])

  const selectionKey = keyOf(selection)

  // Tab titles make shared links and history readable.
  useEffect(() => {
    const name = titleOf(selection)
    document.title = name ? `${name} · Canopy` : 'Canopy · Fall colors across Canada'
  }, [selection])

  return { selection, selectionKey, section: sectionOf(selection) }
}

/** Changes whenever the page does: a new place, list or trip. */
function keyOf(selection: Selection): string {
  switch (selection?.kind) {
    case 'region':
      return `region:${selection.region.id}`
    case 'tree':
      return `tree:${selection.tree.id}`
    case 'park':
      return `park:${selection.park.id}`
    case 'trail':
      return `trail:${selection.trail.id}`
    case 'place':
      return `place:${selection.place.id}`
    case 'fishing':
      return `fishing:${selection.access.id}`
    case 'parks':
    case 'trails':
    case 'foliage':
    case 'about':
    case 'sources':
    case 'trips':
    case 'shared-trip':
      return selection.kind
    case 'trip':
      return `trip:${selection.trip.id}`
    default:
      // Explore, and a page still loading or not found.
      return 'home'
  }
}

/** The page's name, for the tab title. */
function titleOf(selection: Selection): string | null {
  switch (selection?.kind) {
    case 'region':
      return selection.region.name
    case 'tree':
      return selection.tree.name
    case 'park':
      return parkTitle(selection.park)
    case 'trail':
      return selection.trail.name
    case 'place':
      return selection.place.name
    case 'fishing':
      return accessTitle(selection.access)
    case 'parks':
      return 'Parks'
    case 'trails':
      return 'Places'
    case 'foliage':
      return 'Foliage'
    case 'about':
      return 'About'
    case 'sources':
      return 'Data sources'
    case 'trips':
      return 'Trips'
    case 'trip':
    case 'shared-trip':
      return selection.trip.name
    default:
      return null
  }
}

/** Which nav item a page belongs to. */
function sectionOf(selection: Selection): Section | null {
  if (selection === null || selection.kind === 'fishing') return 'explore'
  if (selection.kind === 'parks' || selection.kind === 'park') return 'parks'
  if (selection.kind === 'trails' || selection.kind === 'trail' || selection.kind === 'place') return 'trails'
  if (selection.kind === 'foliage' || selection.kind === 'region' || selection.kind === 'tree') return 'foliage'
  if (selection.kind === 'trips' || selection.kind === 'trip' || selection.kind === 'shared-trip') return 'trips'
  return null
}
