import { REGIONS } from '../data/regions'
import type { Foliage, Hue } from './lowPolyTrees'
import type { ParkReport } from './ontarioParks'
import { peakPhase, type PeakPhase } from './peak'

// The tree colors a forest cover is drawn with. Live where possible: the nearest Ontario Parks
// report gives how much has turned and fallen, and its dominant color. Elsewhere, the nearest
// region's typical peak window stands in.

/** Reports farther away than this don't speak for a place. */
const REPORT_RADIUS_KM = 60
/** Share of conifers in the mixed forests the covers show. */
const CONIFER = 0.3

export type FoliageSource = { foliage: Foliage; source: string }

function km(aLat: number, aLng: number, bLat: number, bLng: number) {
  const r = Math.PI / 180
  const x = (bLng - aLng) * r * Math.cos(((aLat + bLat) / 2) * r)
  const y = (bLat - aLat) * r
  return Math.hypot(x, y) * 6371
}

/** Fall hues weighted toward the report's dominant color ("Yellow/Orange" favors both). */
function hues(dominant: string): Record<Hue, number> {
  const d = dominant.toLowerCase()
  return { red: d.includes('red') ? 3 : 1, orange: d.includes('orange') ? 3 : 1, yellow: d.includes('yellow') ? 3 : 1 }
}

export function foliageFromReport(colorChange: number | null, leafFall: number | null, dominant: string): Foliage {
  const green = Math.min(1, Math.max(0, 1 - (colorChange ?? 0) / 100))
  const bare = Math.min(1 - green, Math.max(0, (leafFall ?? 0) / 100))
  return { green, bare, hues: hues(dominant), conifer: CONIFER }
}

/** Typical color change and leaf fall for each phase of a region's peak window. */
const PHASE_MIX: Record<PeakPhase, [number, number]> = { early: [10, 0], approaching: [40, 5], peak: [85, 15], past: [90, 65] }

export function foliageAt(lat: number, lng: number, parks: ParkReport[], own?: ParkReport): FoliageSource {
  const nearest = own ?? parks.reduce<ParkReport | undefined>((best, p) => (!best || km(lat, lng, p.lat, p.lng) < km(lat, lng, best.lat, best.lng) ? p : best), undefined)
  if (nearest && (own || km(lat, lng, nearest.lat, nearest.lng) <= REPORT_RADIUS_KM)) {
    return {
      foliage: foliageFromReport(nearest.colorChange, nearest.leafFall, nearest.dominantColor),
      source: `Ontario Parks report for ${nearest.name}: ${nearest.colorChange ?? 0}% color, ${nearest.leafFall ?? 0}% fallen`,
    }
  }
  const region = REGIONS.reduce((best, r) => (km(lat, lng, r.lat, r.lng) < km(lat, lng, best.lat, best.lng) ? r : best))
  const phase = peakPhase(region)
  const [color, fall] = PHASE_MIX[phase]
  return { foliage: foliageFromReport(color, fall, 'Red/Orange/Yellow'), source: `Typical for ${region.name} at this time of year` }
}

/** A short key for caching a drawn cover. */
export const foliageKey = (f: Foliage) => [f.green, f.bare, f.hues.red, f.hues.orange, f.hues.yellow].map((n) => n.toFixed(2)).join(',')
