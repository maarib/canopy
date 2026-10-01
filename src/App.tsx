import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { BottomSheet, type SnapPoint } from './components/BottomSheet'
import { FoliageMap, type FlyTarget, type MapLayers } from './components/FoliageMap'
import { HomePanel } from './components/HomePanel'
import { LayerControl, Legend, TreeFilter, type TreeFilterValue } from './components/MapControls'
import { ParkPanel } from './components/ParkPanel'
import { RegionPanel } from './components/RegionPanel'
import { REGIONS, type Region } from './data/regions'
import { TREE_GROUP_IDS } from './data/treeGroups'
import { useIsDesktop } from './hooks'
import { countByGroup, fetchSeasonSightings } from './lib/inaturalist'
import { localDate } from './lib/mapStyle'
import { fetchOntarioParks, type ParkReport } from './lib/ontarioParks'

type Selection = { kind: 'region'; region: Region } | { kind: 'park'; park: ParkReport } | null


export default function App() {
  const isDesktop = useIsDesktop()
  const [selection, setSelection] = useState<Selection>(null)
  const [treeFilter, setTreeFilter] = useState<TreeFilterValue>('trees')
  const [sheet, setSheet] = useState<SnapPoint>('peek')
  const [satelliteDate, setSatelliteDate] = useState(() => localDate(-1)) // today's satellite pass is often incomplete
  const [layers, setLayers] = useState<MapLayers>({
    reports: true,
    hexes: true,
    sightings: true,
    trails: true,
    satellite: false,
    terrain3d: false,
  })

  const sightings = useQuery({ queryKey: ['season-sightings'], queryFn: () => fetchSeasonSightings() })
  const parks = useQuery({ queryKey: ['ontario-parks'], queryFn: fetchOntarioParks })

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

  const select = (next: Selection) => {
    setSelection(next)
    setSheet(next ? 'half' : 'peek')
  }

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

  const panel =
    selection?.kind === 'region' ? (
      <RegionPanel key={selection.region.id} region={selection.region} onBack={() => select(null)} />
    ) : selection?.kind === 'park' ? (
      <ParkPanel key={selection.park.id} park={selection.park} onBack={() => select(null)} />
    ) : (
      <HomePanel
        regions={REGIONS}
        parks={parks.data?.parks}
        parksFetchedAt={parks.data?.fetchedAt}
        treeColourSightings={treeColourSightings}
        onSelectRegion={(region) => select({ kind: 'region', region })}
        onSelectPark={(park) => select({ kind: 'park', park })}
      />
    )

  return (
    <div className="flex h-full flex-col">
      <header className="z-30 flex items-center gap-2 border-b border-[var(--line)] bg-[var(--surface)] px-5 py-3">
        <img src="/favicon.svg" alt="" className="size-6" />
        <h1 className="text-2xl leading-none font-black tracking-wide">Canopy</h1>
        <span className="hidden text-sm text-[var(--ink-soft)] sm:inline">Fall colours across Canada</span>
        {sightings.isFetching && (
          <span className="ml-auto text-xs text-[var(--ink-soft)]">Loading live sightings…</span>
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
            target={target}
            selectedId={selection?.kind === 'park' ? selection.park.id : selection?.kind === 'region' ? selection.region.id : null}
            onSelectRegion={(region) => select({ kind: 'region', region })}
            onSelectPark={(park) => select({ kind: 'park', park })}
          />

          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-2 p-3 pr-14">
            <div className="pointer-events-auto">
              <TreeFilter counts={groupCounts} value={treeFilter} onChange={setTreeFilter} />
            </div>
            <div className="pointer-events-auto self-start">
              <LayerControl
                layers={layers}
                onChange={setLayers}
                satelliteDate={satelliteDate}
                onSatelliteDate={setSatelliteDate}
              />
            </div>
          </div>

          {isDesktop && (
            <div className="absolute bottom-3 left-3 w-64 rounded-2xl border border-[var(--line)] bg-[var(--surface)]/95 p-3 shadow-lg backdrop-blur">
              <Legend />
            </div>
          )}
        </div>

        {!isDesktop && (
          <BottomSheet
            snap={sheet}
            onSnap={setSheet}
            contentKey={selection?.kind === 'region' ? selection.region.id : selection?.kind === 'park' ? selection.park.id : 'home'}
          >
            {panel}
          </BottomSheet>
        )}
      </main>
    </div>
  )
}
