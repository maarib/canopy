import type { MultiLineString } from 'geojson'
import type { Region } from '../data/regions'
import { islandRing, outlineRings } from './diorama'
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
}

export const parkCover = (p: ParkReport): CoverSpec => ({ lat: p.lat, lng: p.lng, boundary: p.shortname, radiusKm: 2.5, park: p })
export const regionCover = (r: Region): CoverSpec => ({ lat: r.lat, lng: r.lng, boundary: r.id.replace(/-/g, ''), radiusKm: 18 })
export const placeCover = (p: Place): CoverSpec => ({ lat: p.lat, lng: p.lng, radiusKm: p.kind === 'lake' ? 3.5 : 2 })
export const fishingCover = (a: FishingAccess): CoverSpec => ({ lat: a.lat, lng: a.lng, radiusKm: 2 })

/** A trail's cover: an island around the whole track, a little wider than it. */
export function trailCover(t: Trail): CoverSpec {
  const [w, s, e, n] = t.bbox
  const lat = (s + n) / 2
  const halfDiagKm = Math.hypot((e - w) * 111.32 * Math.cos((lat * Math.PI) / 180), (n - s) * 111.32) / 2
  return { lat, lng: (w + e) / 2, radiusKm: Math.max(0.3, halfDiagKm * 1.3), path: t.geometry }
}

const islandId = (s: CoverSpec) => `island:${s.lat.toFixed(4)},${s.lng.toFixed(4)}:${s.radiusKm.toFixed(2)}`

/** The id of the shape a cover draws: the park boundary when one loaded, else an island. */
export const shapeId = (s: CoverSpec, outline: ParkBoundary | null) => (outline && s.boundary ? `park:${s.boundary}` : islandId(s))

export function coverShape(s: CoverSpec, outline: ParkBoundary | null): CoverShape {
  const id = shapeId(s, outline)
  return { id, rings: outline ? outlineRings(outline.geometry) : [islandRing([s.lng, s.lat], s.radiusKm, id)], path: s.path }
}

/** The ids a spec's cover may be stored under, before knowing whether its boundary exists. */
export const shapeIds = (s: CoverSpec) => (s.boundary ? [`park:${s.boundary}`, islandId(s)] : [islandId(s)])

export function coverFoliage(s: CoverSpec, parks: ParkReport[]): FoliageSource {
  return foliageAt(s.lat, s.lng, parks, s.park)
}

/** Key of one drawn cover: its shape in its colors. */
export const coverKey = (id: string, f: FoliageSource['foliage']) => `${id}|${foliageKey(f)}`
