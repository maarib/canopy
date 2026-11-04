import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Navigate, useLocation } from 'react-router'
import { Layout, PANEL_INSET } from './app/Layout'
import { MapFilterBar } from './app/MapFilterBar'
import { Page } from './app/Page'
import { matchRoute } from './app/routes'
import { NO_PARKS, useAppData, useParkFilter } from './app/useAppData'
import { useMapState } from './app/useMapState'
import { useNavigation } from './app/useNavigation'
import { useSelection } from './app/useSelection'
import { useSheet } from './app/useSheet'
import { useTripStops } from './app/useTripStops'
import { useUrlState } from './app/useUrlState'
import { ExploreLanding, type ExploreQuery } from './components/ExploreSearch'
import type { FlyTarget } from './components/FoliageMap'
import { MapSkeleton } from './components/MapSkeleton'
import { PanelSkeleton } from './components/ui'
import { PROVINCE_BY_CODE } from './data/provinces'
import { REGIONS } from './data/regions'
import { useIsDesktop } from './hooks'
import type { FishingAccess } from './lib/fishingAccess'
import { setHoverPoint } from './lib/hoverStore'
import { pageShown } from './lib/pageTransition'
import { resultPath, type SearchResult } from './lib/search'
import { useTrips } from './lib/trips'
import { writeTree } from './lib/urlState'

// The app: which page the address asks for (app/routes, app/useSelection), the data behind it
// (app/useAppData), the filters in the URL (app/useUrlState), and the frame that holds the map
// and the panel (app/Layout). Each piece lives in app/; this file wires them together.

const NO_FISHING: FishingAccess[] = []

// The map engine (~500 KB gzipped) loads in parallel while the panels render.
const FoliageMap = lazy(() => import('./components/FoliageMap').then((m) => ({ default: m.FoliageMap })))

export default function App() {
  const isDesktop = useIsDesktop()
  const location = useLocation()
  const route = matchRoute(location.pathname)
  const url = useUrlState()
  const data = useAppData(route, { fishingLayer: url.layers.fishing })
  const trips = useTrips()
  const nav = useNavigation()
  const { resolveStop, openStop } = useTripStops(data.everyPark, data.exploreIndex, nav.go)
  const { selection, selectionKey, section } = useSelection(route, data, trips, url.params.get('t'))
  const [sheet, setSheet] = useSheet(selection, selectionKey, isDesktop)
  const [focus, setFocus] = useState<FlyTarget>(null)
  const parkFilter = useParkFilter(data, url.activities, selection?.kind === 'park' ? selection.park.id : null)
  const map = useMapState({ selection, selectionKey, data, layers: url.layers, treeFilter: url.treeFilter, resolveStop })

  // A page transition (phones) takes its picture of the new page once it is in place.
  useLayoutEffect(pageShown, [selectionKey])
  // A hover point from a previous trail's chart shouldn't linger.
  useEffect(() => setHoverPoint(null), [selectionKey])

  function onSearch(r: SearchResult) {
    const path = resultPath(r)
    if (path) nav.go(path)
    else if (r.kind === 'place') {
      if (selection) nav.goHome()
      setFocus({ id: `${r.id}:${Date.now()}`, lng: r.lng, lat: r.lat, zoom: r.zoom })
      // The map is what answers this search.
      setSheet('peek')
    }
  }

  const exploreSeq = useRef(0)
  /** The Explore search: frame the province on the map, then open the section that fits. */
  function onExplore(q: ExploreQuery) {
    const { bounds } = PROVINCE_BY_CODE.get(q.province)!
    exploreSeq.current += 1 // a new id each time, so searching the same province again re-frames it
    setFocus({ id: `province:${q.province}:${exploreSeq.current}`, lng: (bounds[0] + bounds[2]) / 2, lat: (bounds[1] + bounds[3]) / 2, zoom: 6, bounds })
    if (q.what === 'colors') nav.openSection('/foliage', (p) => writeTree(p, q.tree))
    else if (q.what === 'parks') nav.openSection('/parks')
    else if (q.what === 'trails') nav.openSection('/places')
    else if (q.what === 'places') nav.openSection('/places?show=waterfall')
    else setSheet('peek')
  }

  // Unknown paths go home rather than showing a blank page.
  if (!route.known) return <Navigate to={{ pathname: '/', search: location.search }} replace />

  const { sightings, parks, everyPark, exploreIndex, facilities, fishing, groupCounts } = data
  /** Explore with the panel closed: the search and quick links sit over the map. */
  const landing = selection === null && sheet === 'peek'
  // On the landing page the panel is closed and Explore's page is not needed yet, so it is not
  // rendered (or fetched). Every other page stays mounted while hidden, to keep its state.
  const panel = landing ? null : (
    <Suspense fallback={<PanelSkeleton />}>
      <Page
        selection={selection}
        data={data}
        url={url}
        nav={nav}
        parkFilter={parkFilter}
        trips={trips}
        resolveStop={resolveStop}
        openStop={openStop}
        onSearch={onSearch}
        onExplore={onExplore}
      />
    </Suspense>
  )
  /** Desktop, map with panel: the panel floats over the map's left side. */
  const floatingPanel = isDesktop && sheet === 'half'
  const onPlace = ['region', 'park', 'trail', 'place', 'fishing', 'tree'].includes(selection?.kind ?? '')

  return (
    <Layout
      isDesktop={isDesktop}
      sheet={sheet}
      onSheet={setSheet}
      pageKey={selectionKey}
      section={section}
      tripCount={trips.length}
      sightingsProgress={data.sightingsLoading ? (sightings.data?.loaded ?? 0) / (sightings.data?.expected || 1) : null}
      panel={panel}
      showOnMap={!isDesktop && sheet === 'full' && onPlace ? () => setSheet('half') : null}
      landing={landing}
      floatingPanel={floatingPanel}
      onHome={nav.goHome}
      onNavigate={nav.openSection}
    >
      <Suspense fallback={<MapSkeleton />}>
        <FoliageMap
          onReady={data.settle}
          onFishingNear={data.nearFishing}
          regions={REGIONS}
          parks={parkFilter.filteredParks ?? NO_PARKS}
          reports={parks.data?.parks ?? NO_PARKS}
          sightings={map.mapSightings}
          layers={map.mapLayers}
          satelliteDate={url.satelliteDate}
          light={url.light}
          target={map.target}
          focus={focus}
          panelInset={floatingPanel ? PANEL_INSET : 0}
          bottomInset={landing ? (isDesktop ? 230 : 150) : 0}
          initialView={url.initialView}
          onViewChange={map.onViewChange}
          parkBoundary={map.parkBoundary}
          mapStyle={url.mapStyle}
          selectedId={selection?.kind === 'park' ? selection.park.id : selection?.kind === 'region' ? selection.region.id : null}
          onSelectRegion={nav.selectRegion}
          onSelectPark={nav.selectPark}
          explore={exploreIndex}
          selectedTrail={selection?.kind === 'trail' ? selection.trail : null}
          selectedPlace={selection?.kind === 'place' ? selection.place : null}
          onSelectTrail={nav.selectTrail}
          onSelectPlace={nav.selectPlace}
          trip={map.tripOnMap}
          onSelectTripStop={openStop}
          fishing={fishing.data?.points ?? NO_FISHING}
          selectedFishing={selection?.kind === 'fishing' ? selection.access : null}
          onSelectFishing={nav.selectFishing}
        />
      </Suspense>

      <MapFilterBar url={url} treeCounts={groupCounts} countParksWith={parkFilter.countParksWith} facilitiesReady={!!facilities.data && !!parks.data} floatingPanel={floatingPanel} />

      {landing && (
        <ExploreLanding
          compact={!isDesktop}
          parks={everyPark ?? NO_PARKS}
          trails={exploreIndex.trails}
          places={exploreIndex.places}
          treeCounts={groupCounts}
          onSearchSelect={onSearch}
          onSubmit={onExplore}
          onNavigate={nav.openSection}
        />
      )}
    </Layout>
  )
}
