import type { Feature, FeatureCollection, Polygon } from 'geojson'

// Pointy-top hex binning in Web Mercator metres, so hexes look regular on the map.
const R = 6378137
const SQRT3 = Math.sqrt(3)

const project = (lng: number, lat: number): [number, number] => [
  (R * lng * Math.PI) / 180,
  R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)),
]
const unproject = (x: number, y: number): [number, number] => [
  (x / R) * (180 / Math.PI),
  (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * (180 / Math.PI),
]

function hexRound(q: number, r: number): [number, number] {
  const s = -q - r
  let rq = Math.round(q)
  let rr = Math.round(r)
  const rs = Math.round(s)
  const dq = Math.abs(rq - q)
  const dr = Math.abs(rr - r)
  const ds = Math.abs(rs - s)
  if (dq > dr && dq > ds) rq = -rr - rs
  else if (dr > ds) rr = -rq - rs
  return [rq, rr]
}

export type HexPoint = { lng: number; lat: number }

/**
 * Groups points into hexes of `size` metres (centre-to-corner, in Mercator units).
 * `summarize` turns each hex's points into the feature's properties.
 */
export function hexbin<P extends HexPoint, Props extends Record<string, unknown>>(
  points: P[],
  size: number,
  summarize: (points: P[]) => Props,
): FeatureCollection<Polygon, Props> {
  const bins = new Map<string, { q: number; r: number; points: P[] }>()
  for (const p of points) {
    const [x, y] = project(p.lng, p.lat)
    const [q, r] = hexRound(((SQRT3 / 3) * x - y / 3) / size, ((2 / 3) * y) / size)
    const key = `${q},${r}`
    const bin = bins.get(key) ?? { q, r, points: [] }
    bin.points.push(p)
    bins.set(key, bin)
  }

  const features: Feature<Polygon, Props>[] = []
  for (const [key, { q, r, points: pts }] of bins)
    features.push({ type: 'Feature', id: key, geometry: { type: 'Polygon', coordinates: [hexCell(q, r, size).ring] }, properties: summarize(pts) })
  return { type: 'FeatureCollection', features }
}

/** The hexagon at axial coordinates (q, r): its outline and its centre. */
export function hexCell(q: number, r: number, size: number) {
  const cx = size * SQRT3 * (q + r / 2)
  const cy = size * 1.5 * r
  const ring = Array.from({ length: 7 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * (i % 6) - 30)
    return unproject(cx + size * Math.cos(angle), cy + size * Math.sin(angle))
  })
  const [lng, lat] = unproject(cx, cy)
  return { ring, lng, lat }
}

/** Hex size by zoom, so hexes stay a readable size on screen. */
export function hexSizeForZoom(zoom: number): number {
  if (zoom < 4.5) return 90_000
  if (zoom < 6) return 45_000
  if (zoom < 7.5) return 20_000
  return 8_000
}
