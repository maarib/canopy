import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { matchPath, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router'
import { ProgressActivity } from 'relume-icons'
import { BottomSheet, type SnapPoint } from './components/BottomSheet'
import { FoliageMap, type FlyTarget, type MapLayers, type MapView } from './components/FoliageMap'
import { HomePanel } from './components/HomePanel'
import { LayerControl, Legend, TreeFilter, type TreeFilterValue } from './components/MapControls'
import { ParkPanel } from './components/ParkPanel'
import { RegionPanel } from './components/RegionPanel'
import { SearchBox } from './components/SearchBox'
import { BackButton } from './components/ui'
import { REGIONS, type Region } from './data/regions'
import { TREE_GROUP_IDS } from './data/treeGroups'
import { useIsDesktop } from './hooks'
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
    return null
  }, [regionMatch?.params.id, parkMatch?.params.slug, parks.data, parks.isError]) // eslint-disable-line react-hooks/exhaustive-deps

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
  const selectRegion = (r: Region) => go(regionPath(r.id))
  const selectPark = (p: ParkReport) => go(parkPath(p))

  const selectionKey =
    selection?.kind === 'region' ? `region:${selection.region.id}` : selection?.kind === 'park' ? `park:${selection.park.id}` : 'home'

  // Open the sheet halfway whenever a place is shown; collapse it at home.
  // (Adjusting state during render when the key changes, per React's guidance.)
  const [sheetFor, setSheetFor] = useState(selectionKey)
  if (sheetFor !== selectionKey) {
    setSheetFor(selectionKey)
    setSheet(selectionKey === 'home' ? 'peek' : 'half')
  }

  // Tab titles make shared links and history readable.
  useEffect(() => {
    const name =
      selection?.kind === 'region' ? selection.region.name : selection?.kind === 'park' ? parkTitle(selection.park) : null
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
    return null
  }, [selection])

  // Unknown paths go home rather than showing a blank page.
  if (!regionMatch && !parkMatch && location.pathname !== '/') return <Navigate to={{ pathname: '/', search: location.search }} replace />

  const panel =
    selection?.kind === 'region' ? (
      <RegionPanel key={selection.region.id} region={selection.region} onBack={goHome} />
    ) : selection?.kind === 'park' ? (
      <ParkPanel key={selection.park.id} park={selection.park} onBack={goHome} />
    ) : selection?.kind === 'loading' ? (
      <p className="flex items-center gap-2 p-5 text-sm text-[var(--ink-soft)]">
        <ProgressActivity className="size-4 animate-spin" /> Loading park…
      </p>
    ) : selection?.kind === 'missing' ? (
      <div className="space-y-3 p-5">
        <BackButton onClick={goHome} />
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
          />

          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-2 p-3 pr-14">
            <div className="pointer-events-auto flex items-start gap-2 md:max-w-xl">
              <div className="min-w-0 flex-1">
                <SearchBox parks={parks.data?.parks ?? []} onSelect={onSearch} />
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
