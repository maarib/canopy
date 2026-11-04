import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import type { FlyTarget, MapLayers, MapView } from '../components/FoliageMap'
import type { TreeFilterValue } from '../components/MapControls'
import type { ResolveStop } from '../components/TripPanels'
import { TREE_GROUP_IDS } from '../data/treeGroups'
import { useThrottledWhile } from '../hooks'
import { parkBoundaryQuery } from '../lib/queries'
import { formatMapView } from '../lib/urlState'
import type { AppData } from './useAppData'
import type { Selection } from './useSelection'

/** What the map draws for the page on screen, and where it flies. */
export function useMapState({
  selection,
  selectionKey,
  data,
  layers,
  treeFilter,
  resolveStop,
}: {
  selection: Selection
  selectionKey: string
  data: AppData
  layers: MapLayers
  treeFilter: TreeFilterValue
  resolveStop: ResolveStop
}) {
  const { sightings, sightingsLoading } = data
  const openTree = selection?.kind === 'tree' ? selection.tree.id : null
  const visibleSightings = useMemo(
    () =>
      (sightings.data?.items ?? []).filter((o) =>
        // A tree's own page shows that tree's turning leaves, whatever the filter says.
        openTree ? o.group === openTree && o.state === 'colored' : treeFilter === 'all' ? true : treeFilter === 'trees' ? TREE_GROUP_IDS.has(o.group ?? '') : o.group === treeFilter,
      ),
    [sightings.data, treeFilter, openTree],
  )
  // While sightings stream in, refresh the map's hexagons at most every 1.5 s rather than per page.
  const mapSightings = useThrottledWhile(visibleSightings, sightingsLoading, 1500)
  // What the map draws. On a tree's page it is about where that tree is: its sightings by area,
  // without the outlook. Otherwise, with the outlook on, the sightings' hexagons step aside, since
  // both color the same ground.
  const mapLayers = useMemo(
    () => (openTree ? { ...layers, hexes: true, sightings: true, outlook: false } : layers.outlook ? { ...layers, hexes: false } : layers),
    [layers, openTree],
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

  // The open park's regulated boundary, outlined on the map.
  const parkShortname = selection?.kind === 'park' ? selection.park.shortname : null
  const boundary = useQuery(parkBoundaryQuery(parkShortname))
  const parkBoundary = parkShortname ? (boundary.data ?? null) : null
  const boundaryPending = !!parkShortname && boundary.isPending

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
      // Wait for the outline so the map moves once, then fit the whole park.
      if (boundaryPending) return { id: `park:${id}:waiting`, lng, lat, zoom: 10, wait: true }
      return { id: `park:${id}`, lng, lat, zoom: 10, bounds: parkBoundary?.bbox }
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
  }, [selection, tripOnMap, boundaryPending, parkBoundary])

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

  return { mapSightings, mapLayers, tripOnMap, parkBoundary, target, onViewChange }
}
