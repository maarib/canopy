import type { Feature, MultiLineString, Position } from 'geojson'
import type { ExpressionSpecification, GeoJSONSource, Map as MapboxMap, StyleSpecification } from 'mapbox-gl'
import { COVER_BLEED, COVER_SIZE } from './coverFrame'
import { bboxOf, DIORAMA_SIZE_M, insideRing, metresToDeg, normalizer, simplify, soften, type Ring } from './diorama'
import type { PlaceKind } from './explore'
import { foliageKey } from './foliage'
import { modelExpression, plantTrees, propModels, summitModels, treeModels, type Foliage, type TreePoint } from './lowPolyTrees'
import { MAPBOX_TOKEN } from './mapStyle'
import { islandScene, placeScene, type Scene } from './placeScenes'

// Cover images for detail pages: the shape of a place as a floating piece of land in soft
// colors, with low-poly trees in today's fall colors scattered across it, seen isometrically.
// One hidden map renders every cover in turn on a blank, transparent style and stays alive, so a
// whole visit costs a single Mapbox map load. Each finished cover is a still image.

export { COVER_BLEED, COVER_SIZE }
const CANVAS = { width: COVER_SIZE.width + 2 * COVER_BLEED, height: COVER_SIZE.height + 2 * COVER_BLEED }
const VIEW = { pitch: 55, bearing: -35 }

/** Terraces a scene may have (peaks have the most). */
const MAX_TIERS = 4
/** Opacity of trees standing in front of a trail, a stream or a lookout's deck. */
const FADED_OPACITY = 0.3

export type CoverShape = {
  /** Stable id: the same shape always draws the same island and trees. */
  id: string
  /** Outer rings in lng/lat: a park's boundary, or an island around the place. */
  rings: Ring[]
  /** A trail's track, drawn across the land. */
  path?: MultiLineString
  /** A place (waterfall, lookout, lake, peak, river, creek): its landform and real water. */
  place?: { kind: PlaceKind; focus: Position; water: Ring[]; course: Position[][] }
}

const BLANK: StyleSpecification = {
  version: 8,
  // Changes apply at once. With the usual 300 ms easing the map keeps redrawing for that long after
  // every change, at the screen's full rate: wasted on a still, and several times the work on a
  // live cover, where something changes many times a second.
  transition: { duration: 0, delay: 0 },
  sources: {},
  layers: [],
  lights: [
    { id: 'ambient', type: 'ambient', properties: { color: '#ffffff', intensity: 0.72 } },
    { id: 'sun', type: 'directional', properties: { color: '#fff6e8', intensity: 0.5, direction: [215, 42], 'cast-shadows': true, 'shadow-intensity': 0.35 } },
  ],
}

const collection = (features: Feature[]) => ({ type: 'FeatureCollection' as const, features })

let ready: Promise<MapboxMap> | undefined

function coverMap(): Promise<MapboxMap> {
  ready ??= import('mapbox-gl').then(({ default: mapboxgl }) => {
    const container = document.createElement('div')
    container.setAttribute('aria-hidden', 'true')
    container.inert = true // nothing in the hidden map can take focus
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
      // Style errors (a bad expression, a model that won't load) otherwise pass silently.
      if (import.meta.env.DEV) map.on('error', (e) => console.warn('cover map:', e.error?.message))
      map.once('load', () => {
        map.setCamera({ 'camera-projection': 'orthographic' })
        // Real lakes, read where the place is; hidden except while reading them.
        map.addSource('streets', { type: 'vector', url: 'mapbox://mapbox.mapbox-streets-v8' })
        map.addLayer({ id: 'water-probe', type: 'fill', source: 'streets', 'source-layer': 'water', layout: { visibility: 'none' }, paint: { 'fill-opacity': 0 } })
        // Every piece of land and water is one extrusion, carrying its own base, top and color.
        map.addSource('solids', { type: 'geojson', data: collection([]) })
        map.addLayer({
          id: 'solids',
          type: 'fill-extrusion',
          source: 'solids',
          paint: { 'fill-extrusion-color': ['get', 'color'], 'fill-extrusion-base': ['get', 'base'], 'fill-extrusion-height': ['get', 'top'] },
        })
        for (const [id, url] of Object.entries({ ...treeModels(), ...propModels(), ...summitModels() })) map.addModel(id, url)
        map.addSource('trees', { type: 'geojson', data: collection([]) })
        map.addSource('props', { type: 'geojson', data: collection([]) })
        map.addSource('landmark', { type: 'geojson', data: collection([]) })
        // A scene's one large model (a peak's summit), scaled to fit its terrace.
        map.addLayer({ id: 'landmark', type: 'model', source: 'landmark', layout: { 'model-id': ['get', 'model'] }, paint: { 'model-cast-shadows': true, 'model-receive-shadows': true } })
        // Mapbox can't vary a model's height or opacity per feature from GeoJSON, so each terrace gets
        // its own layers at a fixed height, and trees standing in front of a path, stream or deck
        // (drawn see-through so it shows behind them) get their own too.
        for (let tier = 0; tier < MAX_TIERS; tier++) {
          const on: ExpressionSpecification = ['==', ['get', 'tier'], tier]
          const shadows = { 'model-cast-shadows': true, 'model-receive-shadows': true }
          map.addLayer({ id: `trees-${tier}`, type: 'model', source: 'trees', filter: ['all', on, ['!', ['get', 'fade']]], paint: shadows })
          map.addLayer({ id: `trees-faded-${tier}`, type: 'model', source: 'trees', filter: ['all', on, ['get', 'fade']], paint: { 'model-opacity': FADED_OPACITY, 'model-cast-shadows': false } })
          map.addLayer({ id: `props-${tier}`, type: 'model', source: 'props', filter: on, layout: { 'model-id': ['get', 'model'] }, paint: shadows })
        }
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
function fill(map: MapboxMap, land: Ring[], front?: Position, headroom = 0) {
  const [w, s, e, n] = bboxOf(land)
  // The land fills the frame, leaving room for the credit line below and anything tall above;
  // trees may rise past it.
  const room = { width: COVER_SIZE.width - 24, height: COVER_SIZE.height - 56 - headroom }
  const centre = [(w + e) / 2, (s + n) / 2]
  map.jumpTo({ center: centre as [number, number], zoom: 12, ...VIEW })
  let best = { bearing: VIEW.bearing, ratio: 0 }
  if (front) {
    // Turn so `front` is nearest the viewer, at the bottom of the frame.
    best.bearing = (Math.atan2(front[0] - centre[0], front[1] - centre[1]) * 180) / Math.PI - 180
  } else
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
  // Then move the land down to make the headroom.
  if (headroom) {
    const canvas = map.getContainer()
    map.jumpTo({ center: map.unproject([canvas.clientWidth / 2, canvas.clientHeight / 2 - headroom / 2]) })
  }
}

/**
 * Trees whose on-screen silhouette covers part of a watched line behind them. A tree is a box from
 * its base up to its top, as wide as its crown; each line is sampled along its length, and a sample
 * counts when it falls inside the box and lies farther back (higher on screen) than the tree's
 * base. Terrace heights lift both on screen.
 */
function blockingTrees(map: MapboxMap, trees: (TreePoint & { properties: { tier: number } })[], watch: Scene['watch'], tiers: number[], scale: number): Set<number> {
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
  for (const { line, tier } of watch) {
    const lift = tiers[tier] * upright
    for (let i = 0; i < line.length; i++) {
      const [ax, ay] = line[i]
      const [bx, by] = line[Math.min(i + 1, line.length - 1)]
      const n = i < line.length - 1 ? Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step)) : 1
      for (let k = 0; k < n; k++) {
        const p = at([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n])
        samples.push({ x: p.x, y: p.y - lift })
      }
    }
  }

  const out = new Set<number>()
  trees.forEach((t, i) => {
    const b = at(t.geometry.coordinates)
    const y = b.y - tiers[t.properties.tier] * upright
    if (samples.some((p) => Math.abs(p.x - b.x) < crown && p.y < y - 2 && p.y > y - height)) out.add(i)
  })
  return out
}

/** Turned `rot` eighths of a turn. */
const BY_ROT = ['match', ['get', 'rot'], ...[1, 2, 3, 4, 5, 6, 7].flatMap((k) => [k, ['literal', [0, 0, k * 45]]]), ['literal', [0, 0, 0]]]

/** A scene set up on the cover map: what is needed to show it from another side. */
export type Scenery = {
  map: MapboxMap
  /** The scene as placed on the cover map: its land, water and terraces. */
  scene: Scene
  trees: (TreePoint & { properties: { tier: number } })[]
  watch: Scene['watch']
  tiers: number[]
  scale: number
  clearView: boolean
  /** Which trees are see-through (or left out) now, to skip the work when a turn changes none. */
  blocking?: string
}

/**
 * Shows a scene's trees for the camera's current angle: those standing in front of a trail, stream
 * or deck from here are drawn see-through, or left out where the scene asks for a clear view.
 */
export function showTrees(stage: Scenery) {
  const { map, trees, clearView } = stage
  const blocking = blockingTrees(map, trees, stage.watch, stage.tiers, stage.scale)
  const key = [...blocking].join()
  if (key === stage.blocking) return
  stage.blocking = key
  const shown = clearView ? trees.filter((_, i) => !blocking.has(i)) : trees
  ;(map.getSource('trees') as GeoJSONSource).setData(collection(shown.map((t, i) => ({ ...t, properties: { ...t.properties, fade: !clearView && blocking.has(i) } }))))
}

/** The scene the cover map holds now, and the view it was framed in: its still was just taken from it. */
let onStage: { key: string; scenery: Scenery; view: { center: [number, number]; zoom: number; bearing: number } } | undefined
const sceneKey = (shape: CoverShape, foliage: Foliage) => `${shape.id}:${foliageKey(foliage)}`

/** Sets a shape up on the cover map, framed as its cover, and waits until it has drawn. */
async function compose(shape: CoverShape, foliage: Foliage): Promise<Scenery> {
  onStage = undefined
  const map = await coverMap()

  // Move to the anchor at a fixed size, then simplify to chunky facets.
  const to = normalizer(shape.rings)
  const facet = metresToDeg(DIORAMA_SIZE_M / 90)
  // A park's boundary is full of survey corners; every corner is rounded, as on the place covers.
  const land = shape.rings.map((r) => soften(simplify(r.map(to), facet), metresToDeg(DIORAMA_SIZE_M / 12)))
  let scene: Scene
  if (shape.place) {
    const { kind, focus, water, course } = shape.place
    scene = placeScene({
      kind,
      island: land[0],
      focus: to(focus),
      water: water.map((r) => simplify(r.map(to), facet / 3)).filter((r) => r.length >= 4),
      course: course.map((line) => line.map(to)),
      seed: shape.id,
    })
  } else {
    const lakes = await lakesWithin(map, shape.rings)
    scene = islandScene(
      land,
      lakes.map((r) => simplify(r.map(to), facet / 2)).filter((r) => r.length >= 4).map((r) => soften(r, metresToDeg(DIORAMA_SIZE_M / 40))),
      shape.path?.coordinates.map((line) => line.map(to)),
    )
  }

  // True land area (shoelace, in m² on the equator anchor) sets the spacing for a steady tree count.
  const landArea = scene.land.reduce((a, r) => a + ringArea(r), 0) * 111320 ** 2
  const spacing = Math.sqrt(landArea / scene.trees)
  const polygon = (coordinates: Position[][]) => ({ geometry: { type: 'Polygon', coordinates } })
  const trees = plantTrees(bboxOf(scene.land), spacing, scene.grow.map((g) => polygon([g.ring])), scene.keepOut.map(polygon)).map((t) => {
    const [x, y] = t.geometry.coordinates
    const tier = scene.grow.reduce((top, g) => (g.tier > top && insideRing([x, y], g.ring) ? g.tier : top), 0)
    // Snow thins out with distance from the summit: certain beside it, rare at the snowline.
    const snowChance = scene.snow ? 1.15 * (1 - Math.hypot(x - scene.snow.at[0], y - scene.snow.at[1]) / scene.snow.radius) : 0
    return {
      ...t,
      properties: { ...t.properties, tier, rot: Math.floor(((t.properties.r * 97) % 1) * 8), snow: (t.properties.r * 53) % 1 < snowChance },
    }
  })
  // Crowns a little wider than the spacing, so the canopy reads as one forest.
  const scale = (spacing * 1.35) / 7.6

  const feature = (geometry: Feature['geometry'], properties: Record<string, unknown>): Feature => ({ type: 'Feature', geometry, properties })
  ;(map.getSource('solids') as GeoJSONSource).setData(
    collection(scene.solids.map((s) => feature({ type: 'Polygon', coordinates: s.polygon }, { base: s.base, top: s.top, color: s.color }))),
  )
  ;(map.getSource('props') as GeoJSONSource).setData(
    collection(scene.props.map((p) => feature({ type: 'Point', coordinates: p.at }, { model: p.model, tier: p.tier, rot: p.rot }))),
  )
  for (let tier = 0; tier < MAX_TIERS; tier++)
    for (const id of [`trees-${tier}`, `trees-faded-${tier}`, `props-${tier}`]) {
      if (!id.startsWith('props')) map.setLayoutProperty(id, 'model-id', modelExpression(foliage) as never)
      map.setLayoutProperty(id, 'visibility', tier < scene.tiers.length ? 'visible' : 'none')
      map.setPaintProperty(id, 'model-scale', [scale, scale, scale])
      map.setPaintProperty(id, 'model-translation', [0, 0, scene.tiers[tier] ?? 0])
      map.setPaintProperty(id, 'model-rotation', BY_ROT as never)
    }

  const { landmark } = scene
  ;(map.getSource('landmark') as GeoJSONSource).setData(collection(landmark ? [feature({ type: 'Point', coordinates: landmark.at }, { model: landmark.model })] : []))
  if (landmark) {
    map.setPaintProperty('landmark', 'model-scale', [landmark.size, landmark.size, landmark.size])
    map.setPaintProperty('landmark', 'model-rotation', [0, 0, landmark.turn])
    map.setPaintProperty('landmark', 'model-translation', [0, 0, scene.tiers[landmark.tier]])
  }

  map.setCamera({ 'camera-projection': 'orthographic' })
  fill(map, scene.land, scene.front, scene.headroom)
  const stage: Scenery = { map, scene, trees, watch: scene.watch, tiers: scene.tiers, scale, clearView: !!scene.clearView }
  showTrees(stage)
  await settled(map)
  const { lng, lat } = map.getCenter()
  onStage = { key: sceneKey(shape, foliage), scenery: stage, view: { center: [lng, lat], zoom: map.getZoom(), bearing: map.getBearing() } }
  return stage
}

/** The scene already on the cover map, back in the view its still was taken from. */
function restage({ scenery, view }: NonNullable<typeof onStage>): Scenery {
  scenery.map.jumpTo(view)
  scenery.blocking = undefined
  showTrees(scenery)
  return scenery
}

async function draw(shape: CoverShape, foliage: Foliage): Promise<string> {
  const { map } = await compose(shape, foliage)
  const blob = await new Promise<Blob | null>((resolve) => map.getCanvas().toBlob(resolve, 'image/webp', 0.92))
  if (!blob) throw new Error('Cover could not be captured')
  return URL.createObjectURL(blob)
}

/** Stills drawn this visit, least recently shown first. */
const done = new Map<string, Promise<string>>()
/**
 * How many stills are kept. Past this, the one shown longest ago is let go and its image freed;
 * going back to its page draws it again. A still is about 50 kB, and a page shows one at a time.
 */
const KEEP_STILLS = 12
let queue: Promise<unknown> = Promise.resolve()

function keep(key: string, still: Promise<string>) {
  // Set again so it counts as the most recent.
  done.delete(key)
  done.set(key, still)
  for (const [oldest, old] of done) {
    if (done.size <= KEEP_STILLS) break
    done.delete(oldest)
    old.then(URL.revokeObjectURL, () => {})
  }
}

/**
 * The cover for a shape, drawn once per shape and foliage mix and then kept for a while (see
 * `KEEP_STILLS`). Covers are drawn one at a time; a request aborted while it waits is skipped.
 */
export function forestCover(shape: CoverShape, foliage: Foliage, signal: AbortSignal): Promise<string> {
  const key = sceneKey(shape, foliage)
  const hit = done.get(key)
  if (hit) {
    keep(key, hit)
    return hit
  }
  const job = queue.then(() => {
    if (signal.aborted) throw new DOMException('Cover no longer needed', 'AbortError')
    return draw(shape, foliage)
  })
  queue = job.catch(() => {})
  job.then(
    () => keep(key, job),
    () => {},
  )
  return job
}

/** A scene held on the cover map for a live cover, until it is released. */
export type Staged = Scenery & {
  /** Puts the map back out of sight and lets the next cover be drawn. */
  release: () => void
}

const OFFSTAGE = { position: 'fixed', left: '-10000px', top: '0', transform: '', pointerEvents: 'none', cursor: '', touchAction: '' }

/**
 * Sets a shape up on the cover map and keeps it there, for showing the scene itself rather than a
 * picture of it. Takes its turn with the covers being drawn, and no other cover is drawn until it
 * is released: there is one cover map, and a live cover has it on the page.
 */
export function stageCover(shape: CoverShape, foliage: Foliage, signal: AbortSignal): Promise<Staged> {
  let free = () => {}
  const held = new Promise<void>((resolve) => (free = resolve))
  const job = queue.then(async (): Promise<Staged> => {
    if (signal.aborted) throw new DOMException('Cover no longer needed', 'AbortError')
    // A page that has just drawn its own still left this very scene on the map: no need to build it again.
    const scenery = onStage?.key === sceneKey(shape, foliage) ? restage(onStage) : await compose(shape, foliage)
    const release = () => {
      const box = scenery.map.getContainer()
      Object.assign(box.style, OFFSTAGE)
      box.inert = true
      document.body.append(box)
      free()
    }
    return { ...scenery, release }
  })
  queue = job.then(
    () => held,
    () => {},
  )
  return job
}
