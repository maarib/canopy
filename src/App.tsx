import { experimental_streamedQuery as streamedQuery, useQuery } from '@tanstack/react-query'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { matchPath, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router'
import { ProgressActivity } from 'relume-icons'
import { BottomSheet, type SnapPoint } from './components/BottomSheet'
import type { FlyTarget, MapLayers, MapView } from './components/FoliageMap'
import { MapSkeleton } from './components/MapSkeleton'
import { ActivityOptions } from './components/ActivityFilter'
import { AccountMenu } from './components/AccountMenu'
import { SideNav, TabBar, type Section } from './components/AppNav'
import { TAB_BAR_HEIGHT } from './lib/styles'
import { FoliagePanel } from './components/FoliagePanel'
import { ExplorePanel, type ExploreQuery } from './components/ExplorePanel'
import { LayerOptions, Legend, TreeOptions, type TreeFilterValue } from './components/MapControls'
import { MapFilters } from './components/MapFilters'
import { AboutPanel, ParksPanel, TrailsPanel } from './components/SectionPanels'
import { PROVINCE_BY_CODE } from './data/provinces'
import { DEFAULT_LAYERS } from './lib/urlState'
import { PARK_FILTERS } from './data/amenityIcons'
import { fetchParkFacilities, parkMatches } from './lib/parkFacilities'
import { ParkPanel } from './components/ParkPanel'
import { FishingPanel } from './components/FishingPanel'
import { PlacePanel } from './components/PlacePanel'
import { SiteFooter } from './components/SiteFooter'
import { accessTitle, fetchFishingAccess, fishingIdFromSlug, fishingPath, type FishingAccess } from './lib/fishingAccess'
import { TrailPanel } from './components/TrailPanel'
import { TripPanel, TripsPanel, type StopInfo } from './components/TripPanels'
import { PlaceIcon } from './components/PlaceIcon'
import { TreeIcon } from './components/TreeIcon'
import { RegionPanel } from './components/RegionPanel'
import { BackButton, PanelSkeleton, ProgressBar } from './components/ui'
import { REGIONS, signatureTree, type Region } from './data/regions'
import { TREE_GROUP_IDS } from './data/treeGroups'
import { useIsDesktop, useThrottledWhile } from './hooks'
import {
  fetchExploreAreas,
  placeIdFromSlug,
  placePath,
  trailIdFromSlug,
  trailPath,
  formatDuration,
  PLACE_KINDS,
  type PlaceKind,
  type ExploreArea,
  type Place,
  type Trail,
} from './lib/explore'
import { setHoverPoint } from './lib/hoverStore'
import {
  countByGroup,
  EMPTY_SIGHTINGS,
  readCachedSightings,
  reduceSightings,
  streamSeasonSightings,
  writeCachedSightings,
} from './lib/inaturalist'
import { fetchOntarioParks, parkTitle, type ParkReport } from './lib/ontarioParks'
import type { LightSetting } from './lib/mapStyle'
import { PHASE_STYLE, peakPhase } from './lib/peak'
import { STAGES } from './lib/stage'
import { decodeTrip, tripActions, useTrips, type SharedTrip, type StopRef, type Trip } from './lib/trips'
import type { SearchResult } from './lib/search'
import {
  formatMapView,
  parkIdFromSlug,
  parkPath,
  readDate,
  readLayers,
  readLight,
  readActivities,
  readMapView,
  readTree,
  regionPath,
  writeActivities,
  writeLayers,
  writeLight,
  writeTree,
} from './lib/urlState'

/** Stable empty list, so memoized children don't re-render while parks load. */
const NO_PARKS: ParkReport[] = []
const NO_FISHING: FishingAccess[] = []

// The map engine (~500 KB gzipped) loads in parallel while the panels render.
const FoliageMap = lazy(() => import('./components/FoliageMap').then((m) => ({ default: m.FoliageMap })))

type Selection =
  | { kind: 'region'; region: Region }
  | { kind: 'park'; park: ParkReport }
  | { kind: 'loading' }
  | { kind: 'trail'; trail: Trail; area: ExploreArea }
  | { kind: 'place'; place: Place; area: ExploreArea }
  | { kind: 'fishing'; access: FishingAccess }
  | { kind: 'parks' }
  | { kind: 'trails' }
  | { kind: 'foliage' }
  | { kind: 'about' }
  | { kind: 'trips' }
  | { kind: 'trip'; trip: Trip }
  | { kind: 'shared-trip'; trip: SharedTrip }
  | { kind: 'missing' }
  | null

export default function App() {
  const isDesktop = useIsDesktop()
  const location = useLocation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  // Phones open on Explore's search, so the sheet starts half open.
  const [sheet, setSheet] = useState<SnapPoint>('half')
  const [focus, setFocus] = useState<FlyTarget>(null)

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
  })
  useEffect(() => {
    if (sightings.data?.complete && sightings.dataUpdatedAt !== cached?.savedAt) writeCachedSightings(sightings.data)
  }, [sightings.data, sightings.dataUpdatedAt, cached?.savedAt])
  const sightingsLoading = sightings.isFetching && !sightings.data?.complete
  const parks = useQuery({ queryKey: ['ontario-parks'], queryFn: fetchOntarioParks })
  const explore = useQuery({ queryKey: ['explore'], queryFn: fetchExploreAreas, staleTime: Infinity })
  const facilities = useQuery({ queryKey: ['park-facilities'], queryFn: fetchParkFacilities, staleTime: Infinity })

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

  // ── URL state ──────────────────────────────────────────────
  const treeFilter = readTree(params)
  const activityParam = params.get('do') ?? ''
  const activities = useMemo(() => readActivities(new URLSearchParams({ do: activityParam })), [activityParam])
  const layers = useMemo(() => readLayers(params), [params])
  const satelliteDate = readDate(params)
  const light = readLight(params)
  const [initialView] = useState(() => readMapView(params))

  /** Update query params in place (no new history entry for filter tweaks). */
  const updateParams = useCallback(
    (fn: (p: URLSearchParams) => void) =>
      setParams(
        () => {
          // Start from the live URL: the map view is written straight to history (see onViewChange).
          const next = new URLSearchParams(window.location.search)
          fn(next)
          return next
        },
        { replace: true },
      ),
    [setParams],
  )
  const setTreeFilter = (v: TreeFilterValue) => updateParams((p) => writeTree(p, v))
  const setActivities = (ids: string[]) => updateParams((p) => writeActivities(p, ids))
  const setLayers = (l: MapLayers) => updateParams((p) => writeLayers(p, l))
  const setSatelliteDate = (d: string) => updateParams((p) => p.set('date', d))
  const setLight = (l: LightSetting) => updateParams((p) => writeLight(p, l))

  const regionMatch = matchPath('/region/:id', location.pathname)
  const parkMatch = matchPath('/park/:slug', location.pathname)
  const trailMatch = matchPath('/trail/:slug', location.pathname)
  const placeMatch = matchPath('/place/:slug', location.pathname)
  const fishingMatch = matchPath('/fishing/:slug', location.pathname)
  const sectionPath = (['/parks', '/trails', '/foliage', '/about'] as const).find((p) => location.pathname === p)
  // Loaded only when the layer is on or a fishing link is opened (~50 KB gzipped).
  const fishing = useQuery({
    queryKey: ['fishing-access'],
    queryFn: fetchFishingAccess,
    staleTime: Infinity,
    enabled: layers.fishing || !!fishingMatch,
  })
  const fishingById = useMemo(() => new Map((fishing.data?.points ?? []).map((a) => [a.id, a] as const)), [fishing.data])
  const tripsMatch = matchPath('/trips', location.pathname)
  const tripMatch = matchPath('/trip/:id', location.pathname)
  const trips = useTrips()
  const onTripsPage = !!tripsMatch
  const selection: Selection = useMemo(() => {
    if (onTripsPage) return { kind: 'trips' }
    if (sectionPath) return { kind: sectionPath.slice(1) as 'parks' | 'trails' | 'foliage' | 'about' }
    if (tripMatch) {
      if (tripMatch.params.id === 'shared') {
        const shared = decodeTrip(params.get('t') ?? '')
        return shared ? { kind: 'shared-trip', trip: shared } : { kind: 'missing' }
      }
      const trip = trips.find((t) => t.id === tripMatch.params.id)
      return trip ? { kind: 'trip', trip } : { kind: 'missing' }
    }
    if (regionMatch) {
      const region = REGIONS.find((r) => r.id === regionMatch.params.id)
      return region ? { kind: 'region', region } : { kind: 'missing' }
    }
    if (parkMatch) {
      if (!parks.data) return parks.isError ? { kind: 'missing' } : { kind: 'loading' }
      const id = parkIdFromSlug(parkMatch.params.slug ?? '')
      const park = parks.data.parks.find((p) => p.id === id)
      return park ? { kind: 'park', park } : { kind: 'missing' }
    }
    if (fishingMatch) {
      if (!fishing.data) return fishing.isError ? { kind: 'missing' } : { kind: 'loading' }
      const access = fishingById.get(fishingIdFromSlug(fishingMatch.params.slug ?? ''))
      return access ? { kind: 'fishing', access } : { kind: 'missing' }
    }
    if (trailMatch || placeMatch) {
      if (!explore.data) return explore.isError ? { kind: 'missing' } : { kind: 'loading' }
      if (trailMatch) {
        const trail = exploreIndex.trailById.get(trailIdFromSlug(trailMatch.params.slug ?? ''))
        return trail ? { kind: 'trail', trail, area: exploreIndex.areaById.get(trail.areaId)! } : { kind: 'missing' }
      }
      const place = exploreIndex.placeById.get(placeIdFromSlug(placeMatch!.params.slug ?? ''))
      return place ? { kind: 'place', place, area: exploreIndex.areaById.get(place.areaId)! } : { kind: 'missing' }
    }
    return null
  }, [regionMatch?.params.id, parkMatch?.params.slug, trailMatch?.params.slug, placeMatch?.params.slug, fishingMatch?.params.slug, sectionPath, fishing.data, fishing.isError, fishingById, onTripsPage, tripMatch?.params.id, trips, params, parks.data, parks.isError, explore.data, explore.isError, exploreIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Turn a saved trip stop back into something to draw, list and open. */
  const resolveStop = useCallback(
    (ref: StopRef): StopInfo | null => {
      const [kind, id] = ref.split(/:(.+)/) as [StopInfo['kind'], string]
      if (kind === 'region') {
        const r = REGIONS.find((x) => x.id === id)
        if (!r) return null
        const color = PHASE_STYLE[peakPhase(r)].color
        return { ref, kind, name: r.name, lng: r.lng, lat: r.lat, color, icon: <TreeIcon id={signatureTree(r)} tone="mono" className="size-4" />, detail: `${r.province} · Region` }
      }
      if (kind === 'park') {
        const p = parks.data?.parks.find((x) => x.id === id)
        if (!p) return null
        return { ref, kind, name: parkTitle(p), lng: p.lng, lat: p.lat, color: STAGES[p.stage].color, icon: <TreeIcon id="maples" tone="mono" className="size-4" />, detail: `Provincial park · ${p.colorChange ?? 0}% color` }
      }
      if (kind === 'trail') {
        const t = exploreIndex.trailById.get(id)
        if (!t) return null
        return { ref, kind, name: t.name, lng: t.trailhead[0], lat: t.trailhead[1], color: PLACE_KINDS.trail.color, icon: <PlaceIcon kind="trail" className="size-4" />, detail: `Trail · ${t.lengthKm} km · ${formatDuration(t.durationH)}`, trail: t }
      }
      const pl = exploreIndex.placeById.get(id)
      if (!pl) return null
      return { ref, kind: 'place', name: pl.name, lng: pl.lng, lat: pl.lat, color: PLACE_KINDS[pl.kind].color, icon: <PlaceIcon kind={pl.kind} className="size-4" />, detail: PLACE_KINDS[pl.kind].label }
    },
    [parks.data, exploreIndex],
  )

  /** Navigate to a place (new history entry), keeping filters and layers. */
  // Stable callbacks, so the memoized map doesn't re-render when the app does.
  const go = useCallback(
    (pathname: string) => {
      const next = new URLSearchParams(window.location.search)
      next.delete('map') // the place decides the view
      next.delete('t') // a shared trip's payload belongs only to /trip/shared
      navigate({ pathname, search: next.toString() })
    },
    [navigate],
  )
  const goHome = useCallback(() => go('/'), [go])
  /** Back to wherever the user came from inside the app (e.g. region → trail → back), else home. */
  const goBack = useCallback(
    () => ((window.history.state as { idx?: number } | null)?.idx ? navigate(-1) : goHome()),
    [navigate, goHome],
  )
  const selectTrail = useCallback((t: Trail) => go(trailPath(t)), [go])
  const selectPlace = useCallback((p: Place) => go(placePath(p)), [go])
  const selectFishing = useCallback((a: FishingAccess) => go(fishingPath(a)), [go])
  const selectRegion = useCallback((r: Region) => go(regionPath(r.id)), [go])
  const selectPark = useCallback((p: ParkReport) => go(parkPath(p)), [go])
  const openTrip = useCallback((t: Trip) => go(`/trip/${t.id}`), [go])
  const openStop = useCallback(
    (ref: string) => {
      const [kind, id] = ref.split(/:(.+)/)
      if (kind === 'region') return go(regionPath(id))
      if (kind === 'park') {
        const p = parks.data?.parks.find((x) => x.id === id)
        return p && go(parkPath(p))
      }
      if (kind === 'trail') {
        const t = exploreIndex.trailById.get(id)
        return t && go(trailPath(t))
      }
      const pl = exploreIndex.placeById.get(id)
      return pl && go(placePath(pl))
    },
    [go, parks.data, exploreIndex],
  )

  const selectionKey =
    selection?.kind === 'region'
      ? `region:${selection.region.id}`
      : selection?.kind === 'park'
        ? `park:${selection.park.id}`
        : selection?.kind === 'trail'
          ? `trail:${selection.trail.id}`
          : selection?.kind === 'place'
            ? `place:${selection.place.id}`
            : selection?.kind === 'fishing'
              ? `fishing:${selection.access.id}`
            : selection?.kind === 'parks' || selection?.kind === 'trails' || selection?.kind === 'foliage' || selection?.kind === 'about'
              ? selection.kind
            : selection?.kind === 'trips'
              ? 'trips'
              : selection?.kind === 'trip'
                ? `trip:${selection.trip.id}`
                : selection?.kind === 'shared-trip'
                  ? 'shared-trip'
                  : 'home'

  // Open the sheet halfway whenever the page changes, so its content (search, list, place) shows.
  // (Adjusting state during render when the key changes, per React's guidance.)
  const [sheetFor, setSheetFor] = useState(selectionKey)
  if (sheetFor !== selectionKey) {
    setSheetFor(selectionKey)
    setSheet('half')
  }

  // Tab titles make shared links and history readable.
  useEffect(() => {
    const name =
      selection?.kind === 'region'
        ? selection.region.name
        : selection?.kind === 'park'
          ? parkTitle(selection.park)
          : selection?.kind === 'trail'
            ? selection.trail.name
            : selection?.kind === 'place'
              ? selection.place.name
              : selection?.kind === 'fishing'
                ? accessTitle(selection.access)
              : selection?.kind === 'parks'
                ? 'Parks'
              : selection?.kind === 'trails'
                ? 'Trails'
              : selection?.kind === 'foliage'
                ? 'Foliage'
              : selection?.kind === 'about'
                ? 'About'
              : selection?.kind === 'trips'
                ? 'Trips'
                : selection?.kind === 'trip' || selection?.kind === 'shared-trip'
                  ? selection.trip.name
                  : null
    document.title = name ? `${name} · Canopy` : 'Canopy · Fall colors across Canada'
  }, [selection])

  // Written straight to history rather than through the router, so panning the map doesn't
  // re-render the whole app on every move. Keeps the router's state object intact.
  const onViewChange = useCallback(
    (view: MapView) => {
      // Lists keep the map where you left it; detail pages fly to their place.
      if (!['home', 'parks', 'trails', 'foliage'].includes(selectionKey)) return
      const url = new URL(window.location.href)
      url.searchParams.set('map', formatMapView(view))
      window.history.replaceState(window.history.state, '', url)
    },
    [selectionKey],
  )

  // A hover point from a previous trail's chart shouldn't linger.
  useEffect(() => setHoverPoint(null), [selectionKey])

  function onSearch(r: SearchResult) {
    if (r.kind === 'region') go(regionPath(r.id))
    else if (r.kind === 'park') go(parkPath(r.park))
    else if (r.kind === 'tree') updateParams((p) => writeTree(p, r.id))
    else if (r.kind === 'trail') go(trailPath(r.trail))
    else if (r.kind === 'explore-place') go(placePath(r.place))
    else {
      if (selection) goHome()
      setFocus({ id: `${r.id}:${Date.now()}`, lng: r.lng, lat: r.lat, zoom: r.zoom })
      setSheet('peek')
    }
  }

  const exploreSeq = useRef(0)
  /** The Explore search: frame the province on the map, then open the section that fits. */
  function onExplore(q: ExploreQuery) {
    const { bounds } = PROVINCE_BY_CODE.get(q.province)!
    exploreSeq.current += 1 // a new id each time, so searching the same province again re-frames it
    setFocus({ id: `province:${q.province}:${exploreSeq.current}`, lng: (bounds[0] + bounds[2]) / 2, lat: (bounds[1] + bounds[3]) / 2, zoom: 6, bounds })
    if (q.what === 'colors') openSection('/foliage', (p) => writeTree(p, q.tree))
    else if (q.what === 'parks') openSection('/parks')
    else if (q.what === 'trails') openSection('/trails')
    else if (q.what === 'places') openSection('/trails?show=waterfall')
    else setSheet('peek')
  }

  /** Which nav item a page belongs to. */
  const section: Section | null =
    selection === null || selection.kind === 'fishing'
      ? 'explore'
      : selection.kind === 'parks' || selection.kind === 'park'
        ? 'parks'
        : selection.kind === 'trails' || selection.kind === 'trail' || selection.kind === 'place'
          ? 'trails'
          : selection.kind === 'foliage' || selection.kind === 'region'
            ? 'foliage'
            : selection.kind === 'trips' || selection.kind === 'trip' || selection.kind === 'shared-trip'
              ? 'trips'
              : null
  /** Sections keep filters and layers in the URL, like the rest of the app. */
  const openSection = useCallback(
    (path: string, change?: (p: URLSearchParams) => void) => {
      const [pathname, query] = path.split('?')
      const next = new URLSearchParams(window.location.search)
      next.delete('show')
      next.delete('t')
      new URLSearchParams(query).forEach((v, k) => next.set(k, v))
      change?.(next)
      navigate({ pathname, search: next.toString() ? `?${next}` : '' })
    },
    [navigate],
  )
  const trailsShow = (() => {
    const s = params.get('show')
    return s && s in PLACE_KINDS && s !== 'trail' && s !== 'trailhead' ? (s as PlaceKind) : 'trails'
  })()

  // ── Derived data ───────────────────────────────────────────
  const groupCounts = useMemo(() => countByGroup(sightings.data?.items ?? []), [sightings.data])

  // ── Park activity filter ───────────────────────────────────
  /** How many parks (not report locations) offer all of `ids`. */
  const countParksWith = useCallback(
    (ids: string[]) => {
      if (!parks.data || !facilities.data) return 0
      const feed = facilities.data
      return new Set(parks.data.parks.filter((p) => parkMatches(feed, p.shortname, ids)).map((p) => p.shortname)).size
    },
    [parks.data, facilities.data],
  )
  const selectedParkId = selection?.kind === 'park' ? selection.park.id : null
  /** Report locations matching the filter; the open park stays on the map either way. */
  const filteredParks = useMemo(() => {
    const all = parks.data?.parks
    if (!all || !activities.length || !facilities.data) return all
    const feed = facilities.data
    return all.filter((p) => p.id === selectedParkId || parkMatches(feed, p.shortname, activities))
  }, [parks.data, facilities.data, activities, selectedParkId])
  const activityLabels = activities.map((id) => PARK_FILTERS.get(id)!.label)
  const visibleSightings = useMemo(
    () =>
      (sightings.data?.items ?? []).filter((o) =>
        treeFilter === 'all' ? true : treeFilter === 'trees' ? TREE_GROUP_IDS.has(o.group ?? '') : o.group === treeFilter,
      ),
    [sightings.data, treeFilter],
  )
  // While sightings stream in, refresh the map's hexagons at most every 1.5 s rather than per page.
  const mapSightings = useThrottledWhile(visibleSightings, sightingsLoading, 1500)
  const treeColorSightings = useMemo(
    () => sightings.data?.items.filter((o) => o.state === 'colored' && TREE_GROUP_IDS.has(o.group ?? '')).length,
    [sightings.data],
  )

  // The trip on screen, resolved for the map: numbered stops and its trails.
  const tripOnMap = useMemo(() => {
    if (selection?.kind !== 'trip' && selection?.kind !== 'shared-trip') return null
    const t = selection.trip
    const ordered = Array.from({ length: t.days }, (_, d) => t.items.filter((i) => i.day === d + 1)).flat()
    const stops = ordered.flatMap((i) => resolveStop(i.ref) ?? [])
    return {
      stops: stops.map((s, k) => ({ ref: s.ref, n: k + 1, lng: s.lng, lat: s.lat, color: s.color, name: s.name })),
      trails: stops.flatMap((s) => (s.trail ? [s.trail] : [])),
    }
  }, [selection, resolveStop])

  const target: FlyTarget = useMemo(() => {
    if (tripOnMap?.stops.length) {
      const pts = [
        ...tripOnMap.stops.map((s) => [s.lng, s.lat]),
        ...tripOnMap.trails.flatMap((t) => [
          [t.bbox[0], t.bbox[1]],
          [t.bbox[2], t.bbox[3]],
        ]),
      ]
      const lngs = pts.map((p) => p[0])
      const lats = pts.map((p) => p[1])
      const [w, s, e, n] = [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)]
      // Pad single-stop trips so the fit isn't a pinpoint.
      const pad = Math.max(0.01, (e - w) * 0.05)
      const key = tripOnMap.stops.map((x) => x.ref).join()
      return { id: `trip:${key}`, lng: (w + e) / 2, lat: (s + n) / 2, zoom: 11, bounds: [w - pad, s - pad, e + pad, n + pad] }
    }
    if (selection?.kind === 'region') {
      const { id, lng, lat } = selection.region
      return { id: `region:${id}`, lng, lat, zoom: 8 }
    }
    if (selection?.kind === 'park') {
      const { id, lng, lat } = selection.park
      return { id: `park:${id}`, lng, lat, zoom: 10 }
    }
    if (selection?.kind === 'trail') {
      const { id, trailhead, bbox } = selection.trail
      return { id: `trail:${id}`, lng: trailhead[0], lat: trailhead[1], zoom: 13, bounds: bbox }
    }
    if (selection?.kind === 'place') {
      const { id, lng, lat } = selection.place
      return { id: `place:${id}`, lng, lat, zoom: 14 }
    }
    if (selection?.kind === 'fishing') {
      const { id, lng, lat } = selection.access
      return { id: `fishing:${id}`, lng, lat, zoom: 13 }
    }
    return null
  }, [selection, tripOnMap])

  // Unknown paths go home rather than showing a blank page.
  if (!regionMatch && !parkMatch && !trailMatch && !placeMatch && !fishingMatch && !sectionPath && !tripsMatch && !tripMatch && location.pathname !== '/') return <Navigate to={{ pathname: '/', search: location.search }} replace />

  const panel =
    selection?.kind === 'region' ? (
      <RegionPanel
        key={selection.region.id}
        region={selection.region}
        onBack={goBack}
        area={explore.data?.find((a) => a.regionId === selection.region.id)}
        areaLoading={explore.isPending}
        places={exploreIndex.placeById}
        onSelectTrail={selectTrail}
        onSelectPlace={selectPlace}
      />
    ) : selection?.kind === 'trail' ? (
      <TrailPanel
        key={selection.trail.id}
        trail={selection.trail}
        area={selection.area}
        places={exploreIndex.placeById}
        onBack={goBack}
        onSelectPlace={selectPlace}
        onHoverPoint={setHoverPoint}
      />
    ) : selection?.kind === 'fishing' ? (
      <FishingPanel key={selection.access.id} access={selection.access} onBack={goBack} />
    ) : selection?.kind === 'place' ? (
      <PlacePanel
        key={selection.place.id}
        place={selection.place}
        area={selection.area}
        trails={exploreIndex.trailById}
        places={exploreIndex.placeById}
        onBack={goBack}
        onSelectTrail={selectTrail}
      />
    ) : selection?.kind === 'trips' ? (
      <TripsPanel trips={trips} resolve={resolveStop} onBack={goBack} onOpen={openTrip} />
    ) : selection?.kind === 'trip' ? (
      <TripPanel
        key={selection.trip.id}
        trip={selection.trip}
        resolve={resolveStop}
        onBack={goBack}
        onOpenStop={openStop}
        onDeleted={() => go('/trips')}
      />
    ) : selection?.kind === 'shared-trip' ? (
      <TripPanel
        trip={selection.trip}
        shared
        resolve={resolveStop}
        onBack={goHome}
        onOpenStop={openStop}
        onSaveCopy={() => openTrip(tripActions.importShared(selection.trip))}
      />
    ) : selection?.kind === 'parks' ? (
      <ParksPanel
        parks={filteredParks}
        activities={activities}
        onActivities={setActivities}
        countWith={countParksWith}
        facilitiesReady={!!facilities.data && !!parks.data}
        onSelectPark={selectPark}
      />
    ) : selection?.kind === 'trails' ? (
      <TrailsPanel
        trails={exploreIndex.trails}
        places={exploreIndex.places}
        show={trailsShow}
        onShow={(v) => updateParams((p) => (v === 'trails' ? p.delete('show') : p.set('show', v)))}
        onSelectTrail={selectTrail}
        onSelectPlace={selectPlace}
      />
    ) : selection?.kind === 'foliage' ? (
      <FoliagePanel
        regions={REGIONS}
        parks={parks.data?.parks}
        listParks={filteredParks}
        activityFilter={activities.length ? { labels: activityLabels, onClear: () => setActivities([]) } : undefined}
        parksFetchedAt={parks.data?.fetchedAt}
        treeColorSightings={sightings.data?.loaded ? treeColorSightings : undefined}
        onSelectRegion={selectRegion}
        onSelectPark={selectPark}
        tree={treeFilter}
        treeCounts={groupCounts}
        onTree={setTreeFilter}
      />
    ) : selection?.kind === 'about' ? (
      <AboutPanel />
    ) : selection?.kind === 'park' ? (
      <ParkPanel key={selection.park.id} park={selection.park} onBack={goBack} />
    ) : selection?.kind === 'loading' ? (
      <PanelSkeleton />
    ) : selection?.kind === 'missing' ? (
      <div className="space-y-3 p-5">
        <BackButton onClick={goBack} />
        <h2 className="text-3xl">Place not found</h2>
        <p className="text-sm text-[var(--ink-soft)]">This link may be out of date. Try searching for the place instead.</p>
      </div>
    ) : (
      <ExplorePanel
        parks={parks.data?.parks ?? NO_PARKS}
        trails={exploreIndex.trails}
        places={exploreIndex.places}
        treeCounts={groupCounts}
        onSearchSelect={onSearch}
        onSubmit={onExplore}
        onSelectPark={selectPark}
        onSelectTrail={selectTrail}
        onNavigate={openSection}
      />
    )

  const footer = <SiteFooter onAbout={() => openSection('/about')} />
  const treeCount = treeFilter === 'trees' ? 0 : 1
  const layerCount = (Object.keys(DEFAULT_LAYERS) as (keyof MapLayers)[]).filter((k) => layers[k] !== DEFAULT_LAYERS[k]).length

  return (
    <div className="flex h-full flex-col">
      <header className="relative z-30 flex items-center gap-2 border-b border-[var(--line)] bg-[var(--surface)] px-5 py-2.5">
        <button onClick={goHome} className="flex items-center gap-2" aria-label="Canopy home">
          <TreeIcon id="maples" className="size-7" />
          <h1 className="text-2xl leading-none font-black tracking-wide">Canopy</h1>
        </button>
        <span className="hidden text-sm text-[var(--ink-soft)] sm:inline">Explore Ontario's outdoors</span>
        <div className="ml-auto flex items-center gap-3">
          {sightingsLoading && (
            <span className="flex items-center gap-1.5 text-xs text-[var(--ink-soft)]">
              <ProgressActivity className="size-4 animate-spin" />
              <span className="hidden sm:inline">Loading live sightings…</span>
            </span>
          )}
          <AccountMenu tripCount={trips.length} onNavigate={openSection} />
        </div>
        {sightingsLoading && (
          <div className="absolute inset-x-0 -bottom-px">
            <ProgressBar value={(sightings.data?.loaded ?? 0) / (sightings.data?.expected || 1)} label="Loading live sightings" />
          </div>
        )}
      </header>

      <main className="relative flex min-h-0 flex-1">
        {isDesktop && (
          <>
            <SideNav active={section} onNavigate={openSection} tripCount={trips.length} />
            <aside className="w-[420px] shrink-0 overflow-y-auto border-r border-[var(--line)]">
              {panel}
              {footer}
            </aside>
          </>
        )}

        <div className="relative min-w-0 flex-1" style={isDesktop ? undefined : { marginBottom: TAB_BAR_HEIGHT }}>
          <Suspense fallback={<MapSkeleton />}>
          <FoliageMap
            regions={REGIONS}
            parks={filteredParks ?? NO_PARKS}
            sightings={mapSightings}
            layers={layers}
            satelliteDate={satelliteDate}
            light={light}
            target={target}
            focus={focus}
            initialView={initialView}
            onViewChange={onViewChange}
            selectedId={selection?.kind === 'park' ? selection.park.id : selection?.kind === 'region' ? selection.region.id : null}
            onSelectRegion={selectRegion}
            onSelectPark={selectPark}
            explore={exploreIndex}
            selectedTrail={selection?.kind === 'trail' ? selection.trail : null}
            selectedPlace={selection?.kind === 'place' ? selection.place : null}
            onSelectTrail={selectTrail}
            onSelectPlace={selectPlace}
            trip={tripOnMap}
            onSelectTripStop={openStop}
            fishing={fishing.data?.points ?? NO_FISHING}
            selectedFishing={selection?.kind === 'fishing' ? selection.access : null}
            onSelectFishing={selectFishing}
          />
          </Suspense>

          <div className="pointer-events-none absolute top-0 left-0 p-3">
            <div className="pointer-events-auto">
              <MapFilters
                tabs={[
                  { id: 'trees', label: 'Trees', active: treeCount, content: <TreeOptions counts={groupCounts} value={treeFilter} onChange={setTreeFilter} /> },
                  {
                    id: 'activities',
                    label: 'Activities',
                    active: activities.length,
                    content: <ActivityOptions value={activities} onChange={setActivities} countWith={countParksWith} ready={!!facilities.data && !!parks.data} />,
                  },
                  {
                    id: 'layers',
                    label: 'Layers',
                    active: layerCount,
                    content: (
                      <LayerOptions
                        layers={layers}
                        onChange={setLayers}
                        satelliteDate={satelliteDate}
                        onSatelliteDate={setSatelliteDate}
                        light={light}
                        onLight={setLight}
                      />
                    ),
                  },
                ]}
              />
            </div>
          </div>

          {isDesktop && (
            <div className="glass absolute bottom-3 left-3 w-64 rounded-2xl p-3">
              <Legend />
            </div>
          )}
        </div>

        {!isDesktop && (
          <>
            <BottomSheet snap={sheet} onSnap={setSheet} contentKey={selectionKey} bottomOffset={TAB_BAR_HEIGHT}>
              {panel}
              {footer}
            </BottomSheet>
            <TabBar active={section} onNavigate={openSection} tripCount={trips.length} />
          </>
        )}
      </main>
    </div>
  )
}
