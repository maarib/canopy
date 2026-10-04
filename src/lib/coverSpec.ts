import type { MultiLineString, Position } from 'geojson'
import type { Region } from '../data/regions'
import { bboxOf, islandRing, outlineRings } from './diorama'
import type { Place, Trail } from './explore'
import type { FishingAccess } from './fishingAccess'
import { foliageAt, foliageKey, type FoliageSource } from './foliage'
import type { CoverShape } from './forestCover'
import type { ParkReport } from './ontarioParks'
import type { ParkBoundary } from './parkBoundaries'

// What a page's cover shows, shared by the app and the deploy-time pre-render
// (scripts/covers), so both arrive at the same shape and the same cover key.

export type CoverSpec = {
  lat: number
  lng: number
  /** Draw this provincial park's boundary as the land, when it has one. */
  boundary?: string
  /** A trail's track, drawn across the land. */
  path?: MultiLineString
  /** Size of the island drawn when there's no boundary. */
  radiusKm: number
  /** A park's own report, used for its colors. */
  park?: ParkReport
  /** A place: its landform and real water (lib/placeScenes). */
  place?: { id: string; kind: Place['kind']; water: Position[][]; course: Position[][] }
}

export const parkCover = (p: ParkReport): CoverSpec => ({ lat: p.lat, lng: p.lng, boundary: p.shortname, radiusKm: 2.5, park: p })
export const regionCover = (r: Region): CoverSpec => ({ lat: r.lat, lng: r.lng, boundary: r.id.replace(/-/g, ''), radiusKm: 18 })
/** Island size for each kind of place, in km; a lake's island is sized to the lake instead. */
const PLACE_RADIUS_KM: Record<Place['kind'], number> = { waterfall: 0.45, viewpoint: 0.7, peak: 0.9, lake: 1, river: 1, creek: 0.6 }

export function placeCover(p: Place): CoverSpec {
  const place = { id: p.id, kind: p.kind, water: p.water ?? [], course: p.course ?? [] }
  if (p.kind === 'lake' && p.water?.length) {
    // An island a little wider than the lake, centred on it.
    const [w, s, e, n] = bboxOf(p.water)
    const lat = (s + n) / 2
    const halfDiagKm = Math.hypot((e - w) * 111.32 * Math.cos((lat * Math.PI) / 180), (n - s) * 111.32) / 2
    return { lat, lng: (w + e) / 2, radiusKm: Math.max(0.3, halfDiagKm * 1.3), place }
  }
  return { lat: p.lat, lng: p.lng, radiusKm: PLACE_RADIUS_KM[p.kind], place }
}
export const fishingCover = (a: FishingAccess): CoverSpec => ({ lat: a.lat, lng: a.lng, radiusKm: 2 })

/** A trail's cover: an island around the whole track, a little wider than it. */
export function trailCover(t: Trail): CoverSpec {
  const [w, s, e, n] = t.bbox
  const lat = (s + n) / 2
  const halfDiagKm = Math.hypot((e - w) * 111.32 * Math.cos((lat * Math.PI) / 180), (n - s) * 111.32) / 2
  return { lat, lng: (w + e) / 2, radiusKm: Math.max(0.3, halfDiagKm * 1.3), path: t.geometry }
}

const islandId = (s: CoverSpec) =>
  s.place ? `place:${s.place.id}` : `island:${s.lat.toFixed(4)},${s.lng.toFixed(4)}:${s.radiusKm.toFixed(2)}`

/** The id of the shape a cover draws: the park boundary when one loaded, else an island. */
export const shapeId = (s: CoverSpec, outline: ParkBoundary | null) => (outline && s.boundary ? `park:${s.boundary}` : islandId(s))

export function coverShape(s: CoverSpec, outline: ParkBoundary | null): CoverShape {
  const id = shapeId(s, outline)
  return {
    id,
    rings: outline ? outlineRings(outline.geometry) : [islandRing([s.lng, s.lat], s.radiusKm, id)],
    path: s.path,
    place: s.place && { kind: s.place.kind, focus: [s.lng, s.lat], water: s.place.water, course: s.place.course },
  }
}

/** The ids a spec's cover may be stored under, before knowing whether its boundary exists. */
export const shapeIds = (s: CoverSpec) => (s.boundary ? [`park:${s.boundary}`, islandId(s)] : [islandId(s)])

export function coverFoliage(s: CoverSpec, parks: ParkReport[]): FoliageSource {
  return foliageAt(s.lat, s.lng, parks, s.park)
}

/** Key of one drawn cover: its shape in its colors. */
export const coverKey = (id: string, f: FoliageSource['foliage']) => `${id}|${foliageKey(f)}`
