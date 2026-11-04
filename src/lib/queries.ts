import { queryOptions } from '@tanstack/react-query'
import { fetchExploreAreas } from './explore'
import { fetchFishingAccess } from './fishingAccess'
import { fetchOntarioParks, fetchParksIndex } from './ontarioParks'
import { fetchParkBoundary } from './parkBoundaries'
import { fetchParkFacilities } from './parkFacilities'

// The app's shared data, defined once so the app, its pages and link warming (lib/warm) ask for
// the same thing under the same key.

export const parksQuery = queryOptions({ queryKey: ['ontario-parks'], queryFn: fetchOntarioParks })
export const parksIndexQuery = queryOptions({ queryKey: ['parks-index'], queryFn: fetchParksIndex, staleTime: Infinity })
export const exploreQuery = queryOptions({ queryKey: ['explore'], queryFn: fetchExploreAreas, staleTime: Infinity })
export const facilitiesQuery = queryOptions({ queryKey: ['park-facilities'], queryFn: fetchParkFacilities, staleTime: Infinity })
export const fishingQuery = queryOptions({ queryKey: ['fishing-access'], queryFn: fetchFishingAccess, staleTime: Infinity })
export const parkBoundaryQuery = (shortname: string | null) =>
  queryOptions({ queryKey: ['park-boundary', shortname], queryFn: () => fetchParkBoundary(shortname!), enabled: !!shortname, staleTime: Infinity })
