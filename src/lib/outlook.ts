import type { FeatureCollection, Polygon } from 'geojson'
import { hexCell } from './hexbin'
import type { ParkReport } from './ontarioParks'
import { stageFor, type Stage } from './stage'

// The color outlook: a stage for every hexagon of Ontario, so the map shows at a glance where the
// color is. Only the Ontario Parks reports are measurements, so each hexagon says how it was
// worked out, and the map draws the estimates lighter:
//   report   a park report within 60 km (the same reach the covers use)
//   nearby   no report that close, so the reports within 200 km are blended by distance
//   typical  nothing within 200 km, so the usual timing for that latitude stands in

export type OutlookBasis = 'report' | 'nearby' | 'typical'
export type OutlookProps = { stage: Stage; basis: OutlookBasis }
export type OutlookGrid = { grids: Record<string, [number, number][]> }

const REPORT_KM = 60
const NEARBY_KM = 200

export async function fetchOutlookGrid(): Promise<OutlookGrid> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/outlook-grid.json`)
  if (!res.ok) throw new Error(`Outlook grid: ${res.status}`)
  return res.json()
}

function km(aLat: number, aLng: number, bLat: number, bLng: number) {
  const r = Math.PI / 180
  return Math.hypot((bLng - aLng) * r * Math.cos(((aLat + bLat) / 2) * r), (bLat - aLat) * r) * 6371
}

/**
 * The stage a forest is usually at on a date, from latitude alone. Peak falls around October 10
 * at 44°N and about four and a half days earlier for every degree north (mid-September on the
 * James Bay lowlands, mid-October by Lake Erie), in a window a week either side.
 */
export function typicalStage(lat: number, today = new Date()): Stage {
  const day = (Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.UTC(today.getFullYear(), 0, 0)) / 86_400_000
  const peak = 283 - (lat - 44) * 4.5
  const d = day - peak
  if (d < -28) return 'green'
  if (d < -14) return 'patchy'
  if (d < -7) return 'near'
  if (d <= 7) return 'peak'
  if (d <= 24) return 'past'
  return 'bare'
}

/** The stage at a point and how it was worked out. */
export function outlookAt(lat: number, lng: number, reports: ParkReport[], today = new Date()): OutlookProps {
  let color = 0
  let fall = 0
  let weight = 0
  let nearest = Infinity
  for (const p of reports) {
    const d = km(lat, lng, p.lat, p.lng)
    if (d > NEARBY_KM) continue
    nearest = Math.min(nearest, d)
    // Closer reports count for much more; the floor keeps a report on the spot from drowning out the rest.
    const w = 1 / Math.max(d, 5) ** 2
    color += (p.colorChange ?? 0) * w
    fall += (p.leafFall ?? 0) * w
    weight += w
  }
  if (!weight) return { stage: typicalStage(lat, today), basis: 'typical' }
  return { stage: stageFor(color / weight, fall / weight), basis: nearest <= REPORT_KM ? 'report' : 'nearby' }
}

/** Every hexagon of the grid at `size`, with its stage. */
export function outlookHexes(grid: OutlookGrid, size: number, reports: ParkReport[], today = new Date()): FeatureCollection<Polygon, OutlookProps> {
  return {
    type: 'FeatureCollection',
    features: (grid.grids[size] ?? []).map(([q, r]) => {
      const cell = hexCell(q, r, size)
      return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [cell.ring] }, properties: outlookAt(cell.lat, cell.lng, reports, today) }
    }),
  }
}
