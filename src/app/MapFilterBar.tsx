import { Layers } from 'relume-icons'
import { ActivityOptions } from '../components/ActivityFilter'
import type { MapLayers } from '../components/FoliageMap'
import { LayerOptions, Legend, TreeOptions } from '../components/MapControls'
import { MapFilters } from '../components/MapFilters'
import { InfoIcon } from '../components/ui'
import { DEFAULT_LAYERS } from '../lib/urlState'
import type { UrlState } from './useUrlState'

/** The pills over the map's top left: Filters (trees and park activities), Layers and Legend. */
export function MapFilterBar({
  url,
  treeCounts,
  countParksWith,
  facilitiesReady,
  floatingPanel,
}: {
  url: UrlState
  treeCounts: Map<string, number>
  countParksWith: (ids: string[]) => number
  facilitiesReady: boolean
  /** Desktop, map with panel: the pills move right of the floating panel. */
  floatingPanel: boolean
}) {
  const treeCount = url.treeFilter === 'trees' ? 0 : 1
  const layerCount = (Object.keys(DEFAULT_LAYERS) as (keyof MapLayers)[]).filter((k) => url.layers[k] !== DEFAULT_LAYERS[k]).length
  return (
    <div className={`pointer-events-none absolute top-0 p-3 transition-[left] duration-200 ${floatingPanel ? 'left-[432px]' : 'left-0'}`}>
      <div className="pointer-events-auto flex gap-2">
        <MapFilters
          tabs={[
            { id: 'trees', label: 'Trees', active: treeCount, content: <TreeOptions counts={treeCounts} value={url.treeFilter} onChange={url.setTreeFilter} /> },
            {
              id: 'activities',
              label: 'Activities',
              active: url.activities.length,
              content: <ActivityOptions value={url.activities} onChange={url.setActivities} countWith={countParksWith} ready={facilitiesReady} />,
            },
          ]}
        />
        <MapFilters
          label="Layers"
          icon={<Layers className="size-5" />}
          tabs={[
            {
              id: 'layers',
              label: 'Layers',
              active: layerCount,
              content: (
                <LayerOptions
                  layers={url.layers}
                  onChange={url.setLayers}
                  satelliteDate={url.satelliteDate}
                  onSatelliteDate={url.setSatelliteDate}
                  light={url.light}
                  onLight={url.setLight}
                  mapStyle={url.mapStyle}
                  onMapStyle={url.chooseMapStyle}
                />
              ),
            },
          ]}
        />
        <MapFilters label="Legend" iconOnly icon={<InfoIcon className="size-5" />} tabs={[{ id: 'legend', label: 'Legend', active: 0, content: <Legend /> }]} />
      </div>
    </div>
  )
}
