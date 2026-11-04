import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import type { MapLayers } from '../components/FoliageMap'
import type { TreeFilterValue } from '../components/MapControls'
import { PLACE_KINDS, type PlaceKind } from '../lib/explore'
import { readMapStyle, writeMapStyle, type LightSetting, type MapStyleId } from '../lib/mapStyle'
import {
  readActivities,
  readDate,
  readLayers,
  readLight,
  readMapView,
  readTree,
  writeActivities,
  writeLayers,
  writeLight,
  writeTree,
} from '../lib/urlState'

/** The filters, layers and settings kept in the URL (see lib/urlState), and the map's look. */
export function useUrlState() {
  const [params, setParams] = useSearchParams()
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
  const [mapStyle, setMapStyle] = useState<MapStyleId>(readMapStyle)

  /** Places' tab (from ?show=): trails, or a kind of place. */
  const trailsShow: 'trails' | PlaceKind = (() => {
    const s = params.get('show')
    return s && s in PLACE_KINDS && s !== 'trail' && s !== 'trailhead' ? (s as PlaceKind) : 'trails'
  })()

  return {
    params,
    updateParams,
    treeFilter,
    setTreeFilter: (v: TreeFilterValue) => updateParams((p) => writeTree(p, v)),
    activities,
    setActivities: (ids: string[]) => updateParams((p) => writeActivities(p, ids)),
    layers,
    setLayers: (l: MapLayers) => updateParams((p) => writeLayers(p, l)),
    satelliteDate,
    setSatelliteDate: (d: string) => updateParams((p) => p.set('date', d)),
    light,
    setLight: (l: LightSetting) => updateParams((p) => writeLight(p, l)),
    initialView,
    mapStyle,
    chooseMapStyle: (id: MapStyleId) => {
      setMapStyle(id)
      writeMapStyle(id)
    },
    trailsShow,
    setTrailsShow: (v: 'trails' | PlaceKind) => updateParams((p) => (v === 'trails' ? p.delete('show') : p.set('show', v))),
  }
}

export type UrlState = ReturnType<typeof useUrlState>
