import type { ExploreQuery } from '../components/ExploreSearch'
import type { ResolveStop } from '../components/TripPanels'
import { BackButton, PanelSkeleton } from '../components/ui'
import { REGIONS } from '../data/regions'
import { setHoverPoint } from '../lib/hoverStore'
import type { SearchResult } from '../lib/search'
import { tripActions, type Trip } from '../lib/trips'
import {
  AboutPanel,
  DataSourcesPanel,
  ExplorePanel,
  FishingPanel,
  FoliagePanel,
  ParkPanel,
  ParksPanel,
  PlacePanel,
  RegionPanel,
  TrailPanel,
  TrailsPanel,
  TreePanel,
  TripPanel,
  TripsPanel,
} from '../pages'
import { NO_PARKS, type AppData, type useParkFilter } from './useAppData'
import type { Navigation } from './useNavigation'
import type { Selection } from './useSelection'
import type { UrlState } from './useUrlState'

/**
 * The panel's page for the current selection. Pages load on first use (see pages.ts); the
 * caller's Suspense shows a placeholder for one still on its way.
 */
export function Page({
  selection,
  data,
  url,
  nav,
  parkFilter,
  trips,
  resolveStop,
  openStop,
  onSearch,
  onExplore,
}: {
  selection: Selection
  data: AppData
  url: UrlState
  nav: Navigation
  parkFilter: ReturnType<typeof useParkFilter>
  trips: Trip[]
  resolveStop: ResolveStop
  openStop: (ref: string) => void
  onSearch: (r: SearchResult) => void
  onExplore: (q: ExploreQuery) => void
}) {
  const { sightings, parks, everyPark, explore, exploreIndex, facilities, groupCounts, turningByTree, treeColorSightings } = data
  const { go, goBack, goHome, openSection, selectTrail, selectPlace, selectTree, selectPark, selectRegion, openTrip } = nav
  switch (selection?.kind) {
    case 'region':
      return (
        <RegionPanel
          key={selection.region.id}
          region={selection.region}
          onBack={goBack}
          area={explore.data?.find((a) => a.regionId === selection.region.id)}
          areaLoading={explore.isPending}
          places={exploreIndex.placeById}
          onSelectTrail={selectTrail}
          onSelectPlace={selectPlace}
          onSelectTree={selectTree}
        />
      )
    case 'tree':
      return (
        <TreePanel
          key={selection.tree.id}
          tree={selection.tree}
          sightings={sightings.data?.loaded ? sightings.data.items : undefined}
          parks={parks.data?.parks ?? NO_PARKS}
          onBack={goBack}
          onSelectPark={selectPark}
          onSelectRegion={selectRegion}
        />
      )
    case 'trail':
      return (
        <TrailPanel
          key={selection.trail.id}
          trail={selection.trail}
          area={selection.area}
          places={exploreIndex.placeById}
          onBack={goBack}
          onSelectPlace={selectPlace}
          onHoverPoint={setHoverPoint}
        />
      )
    case 'fishing':
      return <FishingPanel key={selection.access.id} access={selection.access} onBack={goBack} />
    case 'place':
      return (
        <PlacePanel
          key={selection.place.id}
          place={selection.place}
          area={selection.area}
          trails={exploreIndex.trailById}
          places={exploreIndex.placeById}
          onBack={goBack}
          onSelectTrail={selectTrail}
        />
      )
    case 'trips':
      return <TripsPanel trips={trips} resolve={resolveStop} onBack={goBack} onOpen={openTrip} />
    case 'trip':
      return (
        <TripPanel
          key={selection.trip.id}
          trip={selection.trip}
          resolve={resolveStop}
          onBack={goBack}
          onOpenStop={openStop}
          onDeleted={() => go('/trips')}
        />
      )
    case 'shared-trip':
      return (
        <TripPanel
          trip={selection.trip}
          shared
          resolve={resolveStop}
          onBack={goHome}
          onOpenStop={openStop}
          onSaveCopy={() => openTrip(tripActions.importShared(selection.trip))}
        />
      )
    case 'parks':
      return (
        <ParksPanel
          parks={parkFilter.listedParks}
          activities={url.activities}
          onActivities={url.setActivities}
          countWith={parkFilter.countListedWith}
          facilitiesReady={!!facilities.data && !!parks.data}
          onSelectPark={selectPark}
        />
      )
    case 'trails':
      return (
        <TrailsPanel
          trails={exploreIndex.trails}
          places={exploreIndex.places}
          show={url.trailsShow}
          initialDifficulty={url.params.get('level')}
          onShow={url.setTrailsShow}
          onSelectTrail={selectTrail}
          onSelectPlace={selectPlace}
        />
      )
    case 'foliage':
      return (
        <FoliagePanel
          regions={REGIONS}
          parks={parks.data?.parks}
          listParks={parkFilter.filteredParks}
          activityFilter={url.activities.length ? { labels: parkFilter.activityLabels, onClear: () => url.setActivities([]) } : undefined}
          treeColorSightings={sightings.data?.loaded ? treeColorSightings : undefined}
          onSelectRegion={selectRegion}
          onSelectPark={selectPark}
          tree={url.treeFilter}
          treeCounts={groupCounts}
          onTree={url.setTreeFilter}
          turning={turningByTree}
          onSelectTree={selectTree}
        />
      )
    case 'about':
      return <AboutPanel onData={() => openSection('/sources')} />
    case 'sources':
      return <DataSourcesPanel />
    case 'park':
      return <ParkPanel key={selection.park.id} park={selection.park} onBack={goBack} />
    case 'loading':
      return <PanelSkeleton />
    case 'missing':
      return (
        <div className="space-y-3 p-5">
          <BackButton onClick={goBack} />
          <h2 className="text-3xl">Place not found</h2>
          <p className="text-sm text-[var(--ink-soft)]">This link may be out of date. Try searching for the place instead.</p>
        </div>
      )
    default:
      return (
        <ExplorePanel
          parks={everyPark ?? NO_PARKS}
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
  }
}
