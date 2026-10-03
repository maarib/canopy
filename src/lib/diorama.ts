import type { MultiLineString, MultiPolygon, Polygon, Position } from 'geojson'

// Geometry for the cover dioramas: the shape of a place as a floating piece of land. A park uses
// its regulated boundary; anything else gets an organic island around it. Shapes are moved to a
// fixed spot and scaled to one size, so every cover has the same tree size and land thickness,
// and simplified to chunky facets so the edge reads low-poly.

export type Ring = Position[]

/** Every diorama is this many metres across its longest side once normalized. */
export const DIORAMA_SIZE_M = 3000
/** Where normalized dioramas are drawn: open ocean, so nothing else is ever there. */
const ANCHOR: [number, number] = [-30, 0]
const M_PER_DEG = 111320

/** Shoelace area in the ring's own units (absolute). */
function area(ring: Ring) {
  let a = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) a += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1])
  return Math.abs(a / 2)
}

/** Outer rings of a park outline: the main parcel and any piece at least 2% its size (islands). */
export function outlineRings(geometry: Polygon | MultiPolygon): Ring[] {
  const polys = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  const outers = polys.map((p) => p[0]).sort((a, b) => area(b) - area(a))
  return outers.filter((r) => area(r) >= area(outers[0]) * 0.02).slice(0, 8)
}

/** A soft, irregular island of about `radiusKm` around a point, the same for the same seed. */
export function islandRing([lng, lat]: [number, number], radiusKm: number, seed: string): Ring {
  let h = 0
  for (const c of seed) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0
  const phase = [1, 2, 3].map((k) => ((h >>> (k * 7)) % 628) / 100)
  const ring: Ring = []
  for (let i = 0; i < 40; i++) {
    const t = (i / 40) * Math.PI * 2
    const r = radiusKm * 1000 * (1 + 0.16 * Math.sin(2 * t + phase[0]) + 0.1 * Math.sin(3 * t + phase[1]) + 0.06 * Math.sin(5 * t + phase[2]))
    ring.push([lng + (Math.cos(t) * r) / (M_PER_DEG * Math.cos((lat * Math.PI) / 180)), lat + (Math.sin(t) * r) / M_PER_DEG])
  }
  ring.push(ring[0])
  return ring
}

export function bboxOf(rings: Ring[]): [number, number, number, number] {
  let [w, s, e, n] = [Infinity, Infinity, -Infinity, -Infinity]
  for (const r of rings)
    for (const [x, y] of r) {
      w = Math.min(w, x)
      e = Math.max(e, x)
      s = Math.min(s, y)
      n = Math.max(n, y)
    }
  return [w, s, e, n]
}

/** Moves and scales lng/lat rings so the shape is DIORAMA_SIZE_M across, centred on the anchor. */
export function normalizer(rings: Ring[]) {
  const [w, s, e, n] = bboxOf(rings)
  const lat0 = (s + n) / 2
  const lng0 = (w + e) / 2
  const cos0 = Math.cos((lat0 * Math.PI) / 180)
  const k = DIORAMA_SIZE_M / Math.max((e - w) * cos0 * M_PER_DEG, (n - s) * M_PER_DEG)
  return (p: Position): Position => [ANCHOR[0] + ((p[0] - lng0) * cos0 * M_PER_DEG * k) / M_PER_DEG, ANCHOR[1] + ((p[1] - lat0) * M_PER_DEG * k) / M_PER_DEG]
}

/** Douglas–Peucker on a closed ring, in its own units. */
export function simplify(ring: Ring, tolerance: number): Ring {
  if (ring.length < 8) return ring
  const keep = new Uint8Array(ring.length)
  keep[0] = keep[ring.length - 1] = 1
  const stack: [number, number][] = [[0, ring.length - 1]]
  // Split a closed ring at its farthest point first, so the line test has two distinct ends.
  let far = 0
  let best = -1
  for (let i = 1; i < ring.length - 1; i++) {
    const d = Math.hypot(ring[i][0] - ring[0][0], ring[i][1] - ring[0][1])
    if (d > best) [best, far] = [d, i]
  }
  keep[far] = 1
  stack.pop()
  stack.push([0, far], [far, ring.length - 1])
  while (stack.length) {
    const [a, b] = stack.pop()!
    const [ax, ay] = ring[a]
    const [bx, by] = ring[b]
    const len = Math.hypot(bx - ax, by - ay) || 1
    let max = 0
    let idx = -1
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((by - ay) * ring[i][0] - (bx - ax) * ring[i][1] + bx * ay - by * ax) / len
      if (d > max) [max, idx] = [d, i]
    }
    if (idx > 0 && max > tolerance) {
      keep[idx] = 1
      stack.push([a, idx], [idx, b])
    }
  }
  const out = ring.filter((_, i) => keep[i])
  return out.length >= 4 ? out : ring
}

export function insideRing([x, y]: Position, ring: Ring) {
  let c = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}

/** A trail's track as thin quads (one per segment), `width` wide in the same units. */
export function pathQuads(path: MultiLineString, map: (p: Position) => Position, width: number): Ring[] {
  const quads: Ring[] = []
  for (const line of path.coordinates) {
    const pts = line.map(map)
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1]
      const [bx, by] = pts[i]
      const len = Math.hypot(bx - ax, by - ay)
      if (!len) continue
      const nx = (-(by - ay) / len) * (width / 2)
      const ny = ((bx - ax) / len) * (width / 2)
      quads.push([[ax + nx, ay + ny], [bx + nx, by + ny], [bx - nx, by - ny], [ax - nx, ay - ny], [ax + nx, ay + ny]])
    }
  }
  return quads
}

/** Degrees on the anchor that equal `m` metres (the anchor is on the equator). */
export const metresToDeg = (m: number) => m / M_PER_DEG
