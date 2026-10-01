import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { matchPath, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router'
import { ProgressActivity } from 'relume-icons'
import { BottomSheet, type SnapPoint } from './components/BottomSheet'
import { FoliageMap, type FlyTarget, type MapLayers, type MapView } from './components/FoliageMap'
import { HomePanel } from './components/HomePanel'
import { LayerControl, Legend, TreeFilter, type TreeFilterValue } from './components/MapControls'
import { ParkPanel } from './components/ParkPanel'
import { PlacePanel } from './components/PlacePanel'
import { TrailPanel } from './components/TrailPanel'
import { RegionPanel } from './components/RegionPanel'
import { SearchBox } from './components/SearchBox'
import { BackButton } from './components/ui'
import { REGIONS, type Region } from './data/regions'
import { TREE_GROUP_IDS } from './data/treeGroups'
import { useIsDesktop } from './hooks'
import {
  fetchExploreAreas,
  placeIdFromSlug,
  placePath,
  trailIdFromSlug,
  trailPath,
  type ExploreArea,
  type Place,
  type Trail,
} from './lib/explore'
import { countByGroup, fetchSeasonSightings } from './lib/inaturalist'
import { fetchOntarioParks, parkTitle, type ParkReport } from './lib/ontarioParks'
import type { LightSetting } from './lib/mapStyle'
import type { SearchResult } from './lib/search'
import {
  formatMapView,
  parkIdFromSlug,
  parkPath,
  readDate,
  readLayers,
  readLight,
  readMapView,
  readTree,
  regionPath,
  writeLayers,
  writeLight,
  writeTree,
} from './lib/urlState'

type Selection =
  | { kind: 'region'; region: Region }
  | { kind: 'park'; park: ParkReport }
  | { kind: 'loading' }
  | { kind: 'trail'; trail: Trail; area: ExploreArea }
  | { kind: 'place'; place: Place; area: ExploreArea }
  | { kind: 'missing' }
  | null

export default function App() {
  const isDesktop = useIsDesktop()
  const location = useLocation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [sheet, setSheet] = useState<SnapPoint>('peek')
  const [focus, setFocus] = useState<FlyTarget>(null)

  const sightings = useQuery({ queryKey: ['season-sightings'], queryFn: () => fetchSeasonSightings() })
  const parks = useQuery({ queryKey: ['ontario-parks'], queryFn: fetchOntarioParks })
  const explore = useQuery({ queryKey: ['explore'], queryFn: fetchExploreAreas, staleTime: Infinity })
  const [hoverPoint, setHoverPoint] = useState<[number, number] | null>(null)

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
  const layers = useMemo(() => readLayers(params), [params])
  const satelliteDate = readDate(params)
  const light = readLight(params)
  const [initialView] = useState(() => readMapView(params))

  /** Update query params in place (no new history entry for filter tweaks). */
  const updateParams = useCallback(
    (fn: (p: URLSearchParams) => void) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          fn(next)
          return next
        },
        { replace: true },
      ),
    [setParams],
  )
  const setTreeFilter = (v: TreeFilterValue) => updateParams((p) => writeTree(p, v))
  const setLayers = (l: MapLayers) => updateParams((p) => writeLayers(p, l))
  const setSatelliteDate = (d: string) => updateParams((p) => p.set('date', d))
  const setLight = (l: LightSetting) => updateParams((p) => writeLight(p, l))

  const regionMatch = matchPath('/region/:id', location.pathname)
  const parkMatch = matchPath('/park/:slug', location.pathname)
  const trailMatch = matchPath('/trail/:slug', location.pathname)
  const placeMatch = matchPath('/place/:slug', location.pathname)
  const selection: Selection = useMemo(() => {
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
  }, [regionMatch?.params.id, parkMatch?.params.slug, trailMatch?.params.slug, placeMatch?.params.slug, parks.data, parks.isError, explore.data, explore.isError, exploreIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Navigate to a place (new history entry), keeping filters and layers. */
  const go = useCallback(
    (pathname: string) => {
      const next = new URLSearchParams(params)
      next.delete('map') // the place decides the view
      navigate({ pathname, search: next.toString() })
    },
    [navigate, params],
  )
  const goHome = () => go('/')
  /** Back to wherever the user came from inside the app (e.g. region → trail → back), else home. */
  const goBack = () => ((window.history.state as { idx?: number } | null)?.idx ? navigate(-1) : goHome())
  const selectTrail = (t: Trail) => go(trailPath(t))
  const selectPlace = (p: Place) => go(placePath(p))
  const selectRegion = (r: Region) => go(regionPath(r.id))
  const selectPark = (p: ParkReport) => go(parkPath(p))

  const selectionKey =
    selection?.kind === 'region'
      ? `region:${selection.region.id}`
      : selection?.kind === 'park'
        ? `park:${selection.park.id}`
        : selection?.kind === 'trail'
          ? `trail:${selection.trail.id}`
          : selection?.kind === 'place'
            ? `place:${selection.place.id}`
            : 'home'

  // Open the sheet halfway whenever a place is shown; collapse it at home.
  // (Adjusting state during render when the key changes, per React's guidance.)
  const [sheetFor, setSheetFor] = useState(selectionKey)
  if (sheetFor !== selectionKey) {
    setSheetFor(selectionKey)
    setSheet(selectionKey === 'home' ? 'peek' : 'half')
    setHoverPoint(null)
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
              : null
    document.title = name ? `${name} · Canopy` : 'Canopy · Fall colours across Canada'
  }, [selection])

  const onViewChange = useCallback(
    (view: MapView) => {
      if (selectionKey !== 'home') return
      updateParams((p) => p.set('map', formatMapView(view)))
    },
    [selectionKey, updateParams],
  )

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

  // ── Derived data ───────────────────────────────────────────
  const groupCounts = useMemo(() => countByGroup(sightings.data?.items ?? []), [sightings.data])
  const visibleSightings = useMemo(
    () =>
      (sightings.data?.items ?? []).filter((o) =>
        treeFilter === 'all' ? true : treeFilter === 'trees' ? TREE_GROUP_IDS.has(o.group ?? '') : o.group === treeFilter,
      ),
    [sightings.data, treeFilter],
  )
  const treeColourSightings = useMemo(
    () => sightings.data?.items.filter((o) => o.state === 'colored' && TREE_GROUP_IDS.has(o.group ?? '')).length,
    [sightings.data],
  )

  const target: FlyTarget = useMemo(() => {
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
    return null
  }, [selection])

  // Unknown paths go home rather than showing a blank page.
  if (!regionMatch && !parkMatch && !trailMatch && !placeMatch && location.pathname !== '/') return <Navigate to={{ pathname: '/', search: location.search }} replace />

  const panel =
    selection?.kind === 'region' ? (
      <RegionPanel
        key={selection.region.id}
        region={selection.region}
        onBack={goBack}
        area={explore.data?.find((a) => a.regionId === selection.region.id)}
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
    ) : selection?.kind === 'park' ? (
      <ParkPanel key={selection.park.id} park={selection.park} onBack={goBack} />
    ) : selection?.kind === 'loading' ? (
      <p className="flex items-center gap-2 p-5 text-sm text-[var(--ink-soft)]">
        <ProgressActivity className="size-4 animate-spin" /> Loading…
      </p>
    ) : selection?.kind === 'missing' ? (
      <div className="space-y-3 p-5">
        <BackButton onClick={goBack} />
        <h2 className="text-3xl">Place not found</h2>
        <p className="text-sm text-[var(--ink-soft)]">This link may be out of date. Try searching for the place instead.</p>
      </div>
    ) : (
      <HomePanel
        regions={REGIONS}
        parks={parks.data?.parks}
        parksFetchedAt={parks.data?.fetchedAt}
        treeColourSightings={treeColourSightings}
        onSelectRegion={selectRegion}
        onSelectPark={selectPark}
      />
    )

  return (
    <div className="flex h-full flex-col">
      <header className="z-30 flex items-center gap-2 border-b border-[var(--line)] bg-[var(--surface)] px-5 py-3">
        <button onClick={goHome} className="flex items-center gap-2" aria-label="Canopy home">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-6" />
          <h1 className="text-2xl leading-none font-black tracking-wide">Canopy</h1>
        </button>
        <span className="hidden text-sm text-[var(--ink-soft)] sm:inline">Fall colours across Canada</span>
        {sightings.isFetching && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-[var(--ink-soft)]">
            <ProgressActivity className="size-4 animate-spin" />
            <span className="hidden sm:inline">Loading live sightings…</span>
          </span>
        )}
      </header>

      <main className="relative flex min-h-0 flex-1">
        {isDesktop && (
          <aside className="w-[420px] shrink-0 overflow-y-auto border-r border-[var(--line)]">{panel}</aside>
        )}

        <div className="relative min-w-0 flex-1">
          <FoliageMap
            regions={REGIONS}
            parks={parks.data?.parks ?? []}
            sightings={visibleSightings}
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
            hoverPoint={hoverPoint}
            onSelectTrail={selectTrail}
            onSelectPlace={selectPlace}
          />

          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-2 p-3 pr-14">
            <div className="pointer-events-auto flex items-start gap-2 md:max-w-xl">
              <div className="min-w-0 flex-1">
                <SearchBox
                  parks={parks.data?.parks ?? []}
                  trails={exploreIndex.trails}
                  places={exploreIndex.places}
                  onSelect={onSearch}
                />
              </div>
              <LayerControl
                layers={layers}
                onChange={setLayers}
                satelliteDate={satelliteDate}
                onSatelliteDate={setSatelliteDate}
                light={light}
                onLight={setLight}
              />
            </div>
            <div className="pointer-events-auto">
              <TreeFilter counts={groupCounts} value={treeFilter} onChange={setTreeFilter} />
            </div>
          </div>

          {isDesktop && (
            <div className="absolute bottom-3 left-3 w-64 rounded-2xl border border-[var(--line)] bg-[var(--surface)]/95 p-3 shadow-lg backdrop-blur">
              <Legend />
            </div>
          )}
        </div>

        {!isDesktop && (
          <BottomSheet snap={sheet} onSnap={setSheet} contentKey={selectionKey}>
            {panel}
          </BottomSheet>
        )}
      </main>
    </div>
  )
}
