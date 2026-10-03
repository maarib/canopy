import type { Map as MapboxMap } from 'mapbox-gl'
import { foliageKey } from './foliage'
import { modelExpression, plantTrees, treeModels, type Foliage } from './lowPolyTrees'
import { basemapConfig, MAPBOX_DEM, MAPBOX_STYLE, MAPBOX_TOKEN } from './mapStyle'

// Cover images for detail pages: an isometric snapshot of the forest around a place, drawn with
// low-poly trees in today's colors over the Bark & spruce basemap. One hidden map renders every
// cover in turn and stays alive, so a whole visit costs a single Mapbox map load. Each finished
// cover is a still image: it never moves or responds to the pointer.

/** Cover size in CSS pixels (16:9), drawn at the screen's pixel ratio. */
export const COVER_SIZE = { width: 400, height: 225 }
const VIEW = { zoom: 14.3, pitch: 55, bearing: -35 }
/** Trees are drawn larger than life so the forest reads at this zoom; spacing keeps it dense. */
const TREE_SCALE = 5.5
const TREE_SPACING_M = 34

let ready: Promise<MapboxMap> | undefined

function coverMap(): Promise<MapboxMap> {
  ready ??= import('mapbox-gl').then(({ default: mapboxgl }) => {
    const container = document.createElement('div')
    container.setAttribute('aria-hidden', 'true')
    Object.assign(container.style, { position: 'fixed', left: '-10000px', top: '0', width: `${COVER_SIZE.width}px`, height: `${COVER_SIZE.height}px`, pointerEvents: 'none' })
    document.body.append(container)
    const map = new mapboxgl.Map({
      container,
      accessToken: MAPBOX_TOKEN,
      style: MAPBOX_STYLE,
      config: {
        basemap: { ...basemapConfig('ink', 'day'), showPlaceLabels: false, showRoadLabels: false, showAdminBoundaries: false, show3dObjects: false },
      },
      projection: 'mercator',
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: true,
      fadeDuration: 0,
      center: [-78.43, 45.575],
      ...VIEW,
    })
    return new Promise<MapboxMap>((resolve, reject) => {
      map.once('error', (e) => reject(e.error))
      map.once('load', () => {
        map.setTerrain({ source: 'cover-dem', exaggeration: 1.5 })
        map.setCamera({ 'camera-projection': 'orthographic' })
        resolve(map)
      })
      map.on('style.load', () => {
        map.addSource('cover-dem', { type: 'raster-dem', url: MAPBOX_DEM, tileSize: 512 })
        // Invisible layers so Mapbox fetches the forest, parkland and water we plant against.
        map.addSource('lc', { type: 'vector', url: 'mapbox://mapbox.mapbox-terrain-v2' })
        map.addSource('streets', { type: 'vector', url: 'mapbox://mapbox.mapbox-streets-v8' })
        map.addLayer({ id: 'lc-probe', type: 'fill', source: 'lc', 'source-layer': 'landcover', paint: { 'fill-opacity': 0 } })
        map.addLayer({ id: 'landuse-probe', type: 'fill', source: 'streets', 'source-layer': 'landuse', paint: { 'fill-opacity': 0 } })
        map.addLayer({ id: 'water-probe', type: 'fill', source: 'streets', 'source-layer': 'water', paint: { 'fill-opacity': 0 } })
        for (const [id, url] of Object.entries(treeModels())) map.addModel(id, url)
        map.addSource('trees', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
        map.addLayer({
          id: 'trees',
          type: 'model',
          source: 'trees',
          slot: 'middle',
          paint: { 'model-scale': [TREE_SCALE, TREE_SCALE, TREE_SCALE], 'model-cast-shadows': true, 'model-receive-shadows': true },
        })
      })
    })
  })
  return ready
}

/** Resolves when every tile and model in view has loaded and drawn, or after `ms` regardless. */
function settled(map: MapboxMap, ms = 10_000) {
  return new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms)
    map.once('idle', () => {
      clearTimeout(t)
      resolve()
    })
    map.triggerRepaint()
  })
}

async function draw(lng: number, lat: number, foliage: Foliage): Promise<string> {
  const map = await coverMap()
  map.jumpTo({ center: [lng, lat], ...VIEW })
  await settled(map)

  const b = map.getBounds()!
  const padX = (b.getEast() - b.getWest()) * 0.15
  const padY = (b.getNorth() - b.getSouth()) * 0.15
  const bounds: [number, number, number, number] = [b.getWest() - padX, b.getSouth() - padY, b.getEast() + padX, b.getNorth() + padY]
  const water = map.querySourceFeatures('streets', { sourceLayer: 'water' })
  const forest = [
    ...map.querySourceFeatures('lc', { sourceLayer: 'landcover', filter: ['in', ['get', 'class'], ['literal', ['wood', 'scrub']]] }),
    ...map.querySourceFeatures('streets', { sourceLayer: 'landuse', filter: ['in', ['get', 'class'], ['literal', ['park', 'wood', 'scrub', 'grass', 'cemetery']]] }),
  ]
  let trees = plantTrees(bounds, TREE_SPACING_M, forest, water)
  // Places with little mapped forest (towns, shorelines) still get a wooded cover: trees on all dry land.
  if (trees.length < 80) {
    const [w, s, e, n] = bounds
    const all = { geometry: { type: 'Polygon', coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] } }
    trees = plantTrees(bounds, TREE_SPACING_M, [all], water)
  }
  map.setLayoutProperty('trees', 'model-id', modelExpression(foliage) as never)
  ;(map.getSource('trees') as import('mapbox-gl').GeoJSONSource).setData({ type: 'FeatureCollection', features: trees })
  await settled(map)

  const blob = await new Promise<Blob | null>((resolve) => map.getCanvas().toBlob(resolve, 'image/webp', 0.9))
  if (!blob) throw new Error('Cover could not be captured')
  return URL.createObjectURL(blob)
}

const done = new Map<string, Promise<string>>()
let queue: Promise<unknown> = Promise.resolve()

/**
 * The cover for a place, drawn once per place and foliage mix and then kept for the visit.
 * Covers are drawn one at a time; a request aborted while it waits is skipped.
 */
export function forestCover(lng: number, lat: number, foliage: Foliage, signal: AbortSignal): Promise<string> {
  const key = `${lng.toFixed(4)},${lat.toFixed(4)}:${foliageKey(foliage)}`
  const hit = done.get(key)
  if (hit) return hit
  const job = queue.then(() => {
    if (signal.aborted) throw new DOMException('Cover no longer needed', 'AbortError')
    return draw(lng, lat, foliage)
  })
  queue = job.catch(() => {})
  job.then(
    () => done.set(key, job),
    () => {},
  )
  return job
}
