import type { QueryClient } from '@tanstack/react-query'
import { preloadPage, type PageName } from '../pages'
import { exploreQuery, facilitiesQuery, parkBoundaryQuery, parksIndexQuery, parksQuery } from './queries'

// Warming a page before it is opened: when a link to it is under the pointer, touched or
// focused, its code and the data it waits on start loading, so the page is ready on the click.
// Anything already loaded is left alone.

/** The first part of a path, and the page that shows it. */
const PAGES: Record<string, PageName> = {
  park: 'park',
  region: 'region',
  trail: 'trail',
  place: 'place',
  tree: 'tree',
  fishing: 'fishing',
  trip: 'trips',
  trips: 'trips',
  parks: 'sections',
  places: 'sections',
  trails: 'sections',
  foliage: 'foliage',
}

type Warm = (client: QueryClient) => unknown
const parks: Warm = (c) => Promise.all([c.prefetchQuery(parksQuery), c.prefetchQuery(parksIndexQuery)])
const facilities: Warm = (c) => c.prefetchQuery(facilitiesQuery)
const explore: Warm = (c) => c.prefetchQuery(exploreQuery)

/** The data a page can't show itself without, matching what the app asks for on that page. */
const DATA: Record<string, Warm[]> = {
  park: [parks, facilities],
  parks: [parks, facilities],
  region: [explore],
  trail: [explore],
  place: [explore],
  places: [explore],
  trails: [explore],
  trip: [parks, explore],
  trips: [parks, explore],
}

/** `boundary`: a park's shortname, so its outline is ready for the map too. */
export function warmPath(client: QueryClient, pathname: string, boundary?: string) {
  const first = pathname.split('/')[1] ?? ''
  const page = PAGES[first]
  if (page) preloadPage(page)
  for (const warm of DATA[first] ?? []) void warm(client)
  if (boundary) void client.prefetchQuery(parkBoundaryQuery(boundary))
}
