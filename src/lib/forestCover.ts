import type { Feature, MultiLineString, Polygon, Position } from 'geojson'
import type { GeoJSONSource, Map as MapboxMap, StyleSpecification } from 'mapbox-gl'
import { bboxOf, DIORAMA_SIZE_M, insideRing, metresToDeg, normalizer, pathQuads, simplify, type Ring } from './diorama'
import { foliageKey } from './foliage'
import { modelExpression, plantTrees, treeModels, type Foliage, type TreePoint } from './lowPolyTrees'
import { MAPBOX_TOKEN } from './mapStyle'

// Cover images for detail pages: the shape of a place as a floating piece of land in soft
// colors, with low-poly trees in today's fall colors scattered across it, seen isometrically.
// One hidden map renders every cover in turn on a blank, transparent style and stays alive, so a
// whole visit costs a single Mapbox map load. Each finished cover is a still image.

/** The cover's frame in CSS pixels (3:2), drawn at the screen's pixel ratio. */
export const COVER_SIZE = { width: 400, height: 267 }
/**
 * Extra canvas around the frame, so treetops and land reaching past it are drawn rather than cut
 * off; the page lets the image overflow the frame by the same amount.
 */
export const COVER_BLEED = 48
const CANVAS = { width: COVER_SIZE.width + 2 * COVER_BLEED, height: COVER_SIZE.height + 2 * COVER_BLEED }
const VIEW = { pitch: 55, bearing: -35 }

/** Land thickness: a soft top layer over earth. */
const SLAB_M = DIORAMA_SIZE_M * 0.06
const TOP_M = SLAB_M * 0.22
const COLORS = { top: '#a9b58a', earth: '#8f7656', water: '#9fbcc4', path: '#e8730c' }
/**
 * About this many trees cover a diorama, whatever the place's real size: few and big, a caricature
 * of a forest rather than a survey of it.
 */
const TREE_COUNT = 320
/** Opacity of trees standing in front of a trail. */
const FADED_OPACITY = 0.3
/** Trails get a sparser forest, so the path shows clearly. */
const TRAIL_TREE_COUNT = 150

export type CoverShape = {
  /** Stable id: the same shape always draws the same island and trees. */
  id: string
  /** Outer rings in lng/lat: a park's boundary, or an island around the place. */
  rings: Ring[]
  /** A trail's track, drawn across the land. */
  path?: MultiLineString
}

const BLANK: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [],
  lights: [
    { id: 'ambient', type: 'ambient', properties: { color: '#ffffff', intensity: 0.72 } },
    { id: 'sun', type: 'directional', properties: { color: '#fff6e8', intensity: 0.5, direction: [215, 42], 'cast-shadows': true, 'shadow-intensity': 0.35 } },
  ],
}

const polygons = (rings: Ring[]): Feature<Polygon>[] => rings.map((r) => ({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [r] } }))
const collection = (features: Feature[]) => ({ type: 'FeatureCollection' as const, features })

let ready: Promise<MapboxMap> | undefined

function coverMap(): Promise<MapboxMap> {
  ready ??= import('mapbox-gl').then(({ default: mapboxgl }) => {
    const container = document.createElement('div')
    container.setAttribute('aria-hidden', 'true')
    Object.assign(container.style, { position: 'fixed', left: '-10000px', top: '0', width: `${CANVAS.width}px`, height: `${CANVAS.height}px`, pointerEvents: 'none' })
    document.body.append(container)
    const map = new mapboxgl.Map({
      container,
      accessToken: MAPBOX_TOKEN,
      style: BLANK,
      projection: 'mercator',
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: true,
      fadeDuration: 0,
      center: [-30, 0],
      zoom: 12,
      ...VIEW,
    })
    return new Promise<MapboxMap>((resolve, reject) => {
      map.once('error', (e) => reject(e.error))
      map.once('load', () => {
        map.setCamera({ 'camera-projection': 'orthographic' })
        // Real lakes, read where the place is; hidden except while reading them.
        map.addSource('streets', { type: 'vector', url: 'mapbox://mapbox.mapbox-streets-v8' })
        map.addLayer({ id: 'water-probe', type: 'fill', source: 'streets', 'source-layer': 'water', layout: { visibility: 'none' }, paint: { 'fill-opacity': 0 } })
        for (const id of ['earth', 'top', 'water', 'path'] as const) map.addSource(id, { type: 'geojson', data: collection([]) })
        const slab = (id: string, base: number, height: number, color: string) =>
          map.addLayer({ id, type: 'fill-extrusion', source: id, paint: { 'fill-extrusion-color': color, 'fill-extrusion-base': base, 'fill-extrusion-height': height } })
        slab('earth', 0, SLAB_M - TOP_M, COLORS.earth)
        slab('top', SLAB_M - TOP_M, SLAB_M, COLORS.top)
        slab('water', SLAB_M, SLAB_M + 1.5, COLORS.water)
        slab('path', SLAB_M, SLAB_M + 3, COLORS.path)
        for (const [id, url] of Object.entries(treeModels())) map.addModel(id, url)
        map.addSource('trees', { type: 'geojson', data: collection([]) })
        // Trees standing in front of a trail are drawn see-through, so the path shows behind them.
        // (Mapbox can't vary model opacity per feature from GeoJSON, hence two layers.)
        map.addLayer({ id: 'trees', type: 'model', source: 'trees', filter: ['!', ['get', 'fade']], paint: { 'model-translation': [0, 0, SLAB_M], 'model-cast-shadows': true, 'model-receive-shadows': true } })
        map.addLayer({ id: 'trees-faded', type: 'model', source: 'trees', filter: ['get', 'fade'], paint: { 'model-translation': [0, 0, SLAB_M], 'model-opacity': FADED_OPACITY, 'model-cast-shadows': false } })
        resolve(map)
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

/** Lakes lying wholly inside the shape, read from Mapbox Streets at the real place. */
async function lakesWithin(map: MapboxMap, rings: Ring[]): Promise<Ring[]> {
  const [w, s, e, n] = bboxOf(rings)
  map.setCamera({ 'camera-projection': 'perspective' })
  map.jumpTo({ pitch: 0, bearing: 0 })
  map.fitBounds([[w, s], [e, n]], { padding: 10, duration: 0 })
  map.setLayoutProperty('water-probe', 'visibility', 'visible')
  await settled(map)
  const lakes = map
    .querySourceFeatures('streets', { sourceLayer: 'water' })
    .flatMap((f) => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates[0]] : f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates.map((p) => p[0]) : []))
    .filter((lake) => lake.every((p) => rings.some((r) => insideRing(p, r))))
  map.setLayoutProperty('water-probe', 'visibility', 'none')
  return lakes
}

function ringArea(r: Ring) {
  let a = 0
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1])
  return Math.abs(a / 2)
}

/** Screen-space box of the land's vertices under the current camera. */
function extent(map: MapboxMap, land: Ring[]) {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity]
  for (const r of land)
    for (const p of r) {
      const { x, y } = map.project(p as [number, number])
      x0 = Math.min(x0, x)
      x1 = Math.max(x1, x)
      y0 = Math.min(y0, y)
      y1 = Math.max(y1, y)
    }
  return { x0, y0, x1, y1 }
}

/**
 * Turns the land to the angle where it fills the wide frame best, centres it, and zooms until it
 * fills the frame (measured on screen, with room left for the trees on top).
 */
function fill(map: MapboxMap, land: Ring[]) {
  const [w, s, e, n] = bboxOf(land)
  // The land fills the frame, leaving room for the credit line below; trees may rise past it.
  const room = { width: COVER_SIZE.width - 24, height: COVER_SIZE.height - 56 }
  map.jumpTo({ center: [(w + e) / 2, (s + n) / 2], zoom: 12, ...VIEW })
  let best = { bearing: VIEW.bearing, ratio: 0 }
  for (let bearing = -80; bearing <= 80; bearing += 10) {
    map.jumpTo({ bearing })
    const b = extent(map, land)
    const ratio = Math.min(room.width / (b.x1 - b.x0), room.height / (b.y1 - b.y0))
    if (ratio > best.ratio) best = { bearing, ratio }
  }
  map.jumpTo({ bearing: best.bearing })
  for (let i = 0; i < 3; i++) {
    const b = extent(map, land)
    const ratio = Math.min(room.width / (b.x1 - b.x0), room.height / (b.y1 - b.y0))
    // Nudge the centre up a little: the land's edge adds depth below it.
    const centre = map.unproject([(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2 + 2])
    map.jumpTo({ center: centre, zoom: map.getZoom() + Math.log2(ratio) })
  }
}

/**
 * Trees whose on-screen silhouette covers part of the trail behind them. A tree is a box from its
 * base up to its top, as wide as its crown; the trail is sampled along its length, and a sample
 * counts when it falls inside the box and lies farther back (higher on screen) than the tree's base.
 */
function blockingTrees(map: MapboxMap, trees: TreePoint[], lines: Position[][], scale: number): Set<number> {
  const at = (p: Position) => map.project(p as [number, number])
  // Screen pixels per metre across, and how tall a metre stands, under this camera.
  const o = at([-30, 0])
  const east = at([-30 + metresToDeg(100), 0])
  const north = at([-30, metresToDeg(100)])
  const across = Math.hypot(east.x - o.x, north.x - o.x) / 100
  const upright = across * Math.sin((VIEW.pitch * Math.PI) / 180)
  const crown = 4.6 * scale * across
  const height = 13 * scale * upright

  const samples: { x: number; y: number }[] = []
  const step = metresToDeg(DIORAMA_SIZE_M / 300)
  for (const line of lines)
    for (let i = 1; i < line.length; i++) {
      const [ax, ay] = line[i - 1]
      const [bx, by] = line[i]
      const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step))
      for (let k = 0; k <= n; k++) samples.push(at([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]))
    }

  const out = new Set<number>()
  trees.forEach((t, i) => {
    const b = at(t.geometry.coordinates)
    if (samples.some((p) => Math.abs(p.x - b.x) < crown && p.y < b.y - 2 && p.y > b.y - height)) out.add(i)
  })
  return out
}

async function draw(shape: CoverShape, foliage: Foliage): Promise<string> {
  const map = await coverMap()
  const lakes = await lakesWithin(map, shape.rings)

  // Move to the anchor at a fixed size, then simplify to chunky facets.
  const to = normalizer(shape.rings)
  const facet = metresToDeg(DIORAMA_SIZE_M / 90)
  const land = shape.rings.map((r) => simplify(r.map(to), facet))
  const water = lakes.map((r) => simplify(r.map(to), facet / 2)).filter((r) => r.length >= 4)
  const path = shape.path ? pathQuads(shape.path, to, metresToDeg(DIORAMA_SIZE_M / 45)) : []
  // Trees keep well clear of the path, so it shows between the crowns.
  const clearing = shape.path ? pathQuads(shape.path, to, metresToDeg(DIORAMA_SIZE_M / 8)) : []

  // True land area (shoelace, in m² on the equator anchor) sets the spacing for a steady tree count.
  const landArea = land.reduce((a, r) => a + ringArea(r), 0) * 111320 ** 2
  const spacing = Math.sqrt(landArea / (shape.path ? TRAIL_TREE_COUNT : TREE_COUNT))
  const keepOut = [...water, ...clearing].map((r) => ({ geometry: { type: 'Polygon', coordinates: [r] } }))
  const trees = plantTrees(bboxOf(land), spacing, polygons(land), keepOut)
  // Crowns a little wider than the spacing, so the canopy reads as one forest.
  const scale = (spacing * 1.35) / 7.6

  ;(map.getSource('earth') as GeoJSONSource).setData(collection(polygons(land)))
  ;(map.getSource('top') as GeoJSONSource).setData(collection(polygons(land)))
  ;(map.getSource('water') as GeoJSONSource).setData(collection(polygons(water)))
  ;(map.getSource('path') as GeoJSONSource).setData(collection(polygons(path)))
  for (const id of ['trees', 'trees-faded']) {
    map.setLayoutProperty(id, 'model-id', modelExpression(foliage) as never)
    map.setPaintProperty(id, 'model-scale', [scale, scale, scale])
  }

  map.setCamera({ 'camera-projection': 'orthographic' })
  fill(map, land)
  const faded = shape.path ? blockingTrees(map, trees, shape.path.coordinates.map((l) => l.map(to)), scale) : new Set<number>()
  ;(map.getSource('trees') as GeoJSONSource).setData(collection(trees.map((t, i) => ({ ...t, properties: { ...t.properties, fade: faded.has(i) } }))))
  await settled(map)

  const blob = await new Promise<Blob | null>((resolve) => map.getCanvas().toBlob(resolve, 'image/webp', 0.92))
  if (!blob) throw new Error('Cover could not be captured')
  return URL.createObjectURL(blob)
}

const done = new Map<string, Promise<string>>()
let queue: Promise<unknown> = Promise.resolve()

/**
 * The cover for a shape, drawn once per shape and foliage mix and then kept for the visit.
 * Covers are drawn one at a time; a request aborted while it waits is skipped.
 */
export function forestCover(shape: CoverShape, foliage: Foliage, signal: AbortSignal): Promise<string> {
  const key = `${shape.id}:${foliageKey(foliage)}`
  const hit = done.get(key)
  if (hit) return hit
  const job = queue.then(() => {
    if (signal.aborted) throw new DOMException('Cover no longer needed', 'AbortError')
    return draw(shape, foliage)
  })
  queue = job.catch(() => {})
  job.then(
    () => done.set(key, job),
    () => {},
  )
  return job
}
