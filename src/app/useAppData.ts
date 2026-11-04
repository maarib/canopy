import { experimental_streamedQuery as streamedQuery, useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PARK_FILTERS } from '../data/amenityIcons'
import { countByGroup, EMPTY_SIGHTINGS, readCachedSightings, reduceSightings, streamSeasonSightings, writeCachedSightings } from '../lib/inaturalist'
import { allParks, type ParkReport } from '../lib/ontarioParks'
import { parkMatches } from '../lib/parkFacilities'
import { exploreQuery, facilitiesQuery, fishingQuery, parksIndexQuery, parksQuery } from '../lib/queries'
import { TREE_GROUP_IDS } from '../data/treeGroups'
import { preloadPages } from '../pages'
import type { Route } from './routes'

/** Stable empty list, so memoized children don't re-render while parks load. */
export const NO_PARKS: ParkReport[] = []

/**
 * The app's data: fall color reports, every park, trails and places, park facilities, fishing
 * points and the season's tree sightings. Data the first screen doesn't use waits until the map
 * has drawn (`settle`), the person touches the page, or 8 s pass (for when the map can't draw,
 * e.g. without WebGL), so it doesn't compete with the map for the network. A page that needs it
 * asks for it at once.
 */
export function useAppData(route: Route, { fishingLayer }: { fishingLayer: boolean }) {
  const [settled, setSettled] = useState(false)
  const settle = useCallback(() => setSettled(true), [])
  useEffect(() => {
    if (settled) return
    const t = setTimeout(settle, 8000)
    window.addEventListener('pointerdown', settle, { once: true })
    window.addEventListener('keydown', settle, { once: true })
    return () => {
      clearTimeout(t)
      window.removeEventListener('pointerdown', settle)
      window.removeEventListener('keydown', settle)
    }
  }, [settled, settle])
  const [fishingNear, setFishingNear] = useState(false)
  /** The map is zoomed in near where fishing pins appear. */
  const nearFishing = useCallback(() => setFishingNear(true), [])

  // Sightings stream in page by page; a recent copy on the device makes reopening instant.
  const [cached] = useState(readCachedSightings)
  const sightings = useQuery({
    queryKey: ['season-sightings'],
    queryFn: streamedQuery({
      streamFn: ({ signal }) => streamSeasonSightings(14, 6, signal),
      reducer: reduceSightings,
      initialValue: EMPTY_SIGHTINGS,
      refetchMode: 'replace', // keep showing the old sightings until fresh ones are complete
    }),
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.savedAt,
    // A copy on the device shows at once; fresh sightings wait for the map, like the rest.
    enabled: settled || !!route.treeId || route.sectionPath === '/foliage',
  })
  // The pages are fetched in the background once the map is up.
  useEffect(() => {
    if (settled) preloadPages()
  }, [settled])
  useEffect(() => {
    if (sightings.data?.complete && sightings.dataUpdatedAt !== cached?.savedAt) writeCachedSightings(sightings.data)
  }, [sightings.data, sightings.dataUpdatedAt, cached?.savedAt])
  const sightingsLoading = sightings.isFetching && !sightings.data?.complete

  const parks = useQuery(parksQuery)
  // Every provincial park, for search, the Parks list, trips and park pages. Parks with a fall
  // color report come first; the map's park pins stay with those.
  const parksIndex = useQuery({ ...parksIndexQuery, enabled: settled || !!route.parkSlug || route.sectionPath === '/parks' || !!route.tripId || route.trips })
  const everyPark = useMemo(() => (parks.data && parksIndex.data ? allParks(parks.data.parks, parksIndex.data) : parks.data?.parks), [parks.data, parksIndex.data])
  const explore = useQuery({
    ...exploreQuery,
    enabled:
      settled || !!route.trailSlug || !!route.placeSlug || !!route.regionId || !!route.tripId || route.trips || route.sectionPath === '/places' || route.sectionPath === '/trails',
  })
  const facilities = useQuery({ ...facilitiesQuery, enabled: settled || !!route.parkSlug || route.sectionPath === '/parks' })

  // Flattened lookups across all explore areas.
  const exploreIndex = useMemo(() => {
    const areas = explore.data ?? []
    return {
      trails: areas.flatMap((a) => a.trails),
      places: areas.flatMap((a) => a.pois),
      trailById: new Map(areas.flatMap((a) => a.trails.map((t) => [t.id, t] as const))),
      placeById: new Map(areas.flatMap((a) => a.pois.map((p) => [p.id, p] as const))),
      areaById: new Map(areas.map((a) => [a.id, a] as const)),
    }
  }, [explore.data])

  // The largest data file (~50 KB gzipped): loaded when the layer is on and the map is zoomed in
  // near where its pins appear, or when a fishing link is opened.
  const fishing = useQuery({ ...fishingQuery, enabled: (fishingLayer && fishingNear) || !!route.fishingSlug })
  const fishingById = useMemo(() => new Map((fishing.data?.points ?? []).map((a) => [a.id, a] as const)), [fishing.data])

  const groupCounts = useMemo(() => countByGroup(sightings.data?.items ?? []), [sightings.data])
  /** How many of each tree were seen turning, for the Foliage page's grid. */
  const turningByTree = useMemo(() => {
    if (!sightings.data?.loaded) return undefined
    const counts = new Map<string, number>()
    for (const o of sightings.data.items) if (o.group && o.state === 'colored') counts.set(o.group, (counts.get(o.group) ?? 0) + 1)
    return counts
  }, [sightings.data])
  const treeColorSightings = useMemo(
    () => sightings.data?.items.filter((o) => o.state === 'colored' && TREE_GROUP_IDS.has(o.group ?? '')).length,
    [sightings.data],
  )

  return {
    settle,
    nearFishing,
    sightings,
    sightingsLoading,
    parks,
    parksIndex,
    everyPark,
    explore,
    exploreIndex,
    facilities,
    fishing,
    fishingById,
    groupCounts,
    turningByTree,
    treeColorSightings,
  }
}

export type AppData = ReturnType<typeof useAppData>
export type ExploreIndex = AppData['exploreIndex']

/**
 * The park activity filter (?do=), applied to the map's report locations and to the Parks list.
 * The open park stays on the map either way.
 */
export function useParkFilter({ parks, everyPark, facilities }: AppData, activities: string[], selectedParkId: string | null) {
  /** How many parks (not report locations) offer all of `ids`. */
  const countParksWith = useCallback(
    (ids: string[]) => {
      if (!parks.data || !facilities.data) return 0
      const feed = facilities.data
      return new Set(parks.data.parks.filter((p) => parkMatches(feed, p.shortname, ids)).map((p) => p.shortname)).size
    },
    [parks.data, facilities.data],
  )
  /** The same count over every park, for the Parks list. */
  const countListedWith = useCallback(
    (ids: string[]) => {
      if (!everyPark || !facilities.data) return 0
      const feed = facilities.data
      return new Set(everyPark.filter((p) => parkMatches(feed, p.shortname, ids)).map((p) => p.shortname)).size
    },
    [everyPark, facilities.data],
  )
  /** Report locations matching the filter; the open park stays on the map either way. */
  const filteredParks = useMemo(() => {
    const all = parks.data?.parks
    if (!all || !activities.length || !facilities.data) return all
    const feed = facilities.data
    return all.filter((p) => p.id === selectedParkId || parkMatches(feed, p.shortname, activities))
  }, [parks.data, facilities.data, activities, selectedParkId])
  /** The Parks list: every park, narrowed the same way. */
  const listedParks = useMemo(() => {
    if (!everyPark || !activities.length || !facilities.data) return everyPark
    const feed = facilities.data
    return everyPark.filter((p) => parkMatches(feed, p.shortname, activities))
  }, [everyPark, facilities.data, activities])
  const activityLabels = activities.map((id) => PARK_FILTERS.get(id)!.label)
  return { countParksWith, countListedWith, filteredParks, listedParks, activityLabels }
}
