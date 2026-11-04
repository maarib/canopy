import { matchPath } from 'react-router'

// Which page the address asks for. Each id or slug is set only on its own kind of page.

const SECTIONS = ['/parks', '/places', '/trails', '/foliage', '/about', '/sources'] as const
export type SectionPath = (typeof SECTIONS)[number]

export type Route = {
  regionId?: string
  treeId?: string
  parkSlug?: string
  trailSlug?: string
  placeSlug?: string
  fishingSlug?: string
  /** A section's list page (Places also answers at its old address, /trails). */
  sectionPath?: SectionPath
  /** The Trips list. */
  trips: boolean
  /** One trip, or `shared` for a trip opened from a link. */
  tripId?: string
  /** False for an address the app has no page for. */
  known: boolean
}

export function matchRoute(pathname: string): Route {
  const param = (pattern: string, name: string) => matchPath(pattern, pathname)?.params[name]
  const route: Route = {
    regionId: param('/region/:id', 'id'),
    treeId: param('/tree/:id', 'id'),
    parkSlug: param('/park/:slug', 'slug'),
    trailSlug: param('/trail/:slug', 'slug'),
    placeSlug: param('/place/:slug', 'slug'),
    fishingSlug: param('/fishing/:slug', 'slug'),
    sectionPath: SECTIONS.find((p) => pathname === p),
    trips: !!matchPath('/trips', pathname),
    tripId: param('/trip/:id', 'id'),
    known: true,
  }
  route.known =
    pathname === '/' ||
    !!(route.regionId || route.treeId || route.parkSlug || route.trailSlug || route.placeSlug || route.fishingSlug || route.sectionPath || route.trips || route.tripId)
  return route
}
