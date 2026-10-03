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

// ── Scene geometry (place covers: terraces, streams, waterfalls) ───────────────────────────

/** Sutherland–Hodgman: the part of `ring` on the kept side of the line through `a` and `b` (left side). */
export function clipHalfPlane(ring: Ring, a: Position, b: Position): Ring {
  const side = (p: Position) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
  const cross = (p: Position, q: Position): Position => {
    const t = side(p) / (side(p) - side(q))
    return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]
  }
  const pts = ring.slice(0, -1)
  const out: Ring = []
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length]
    const pin = side(p) >= 0
    const qin = side(q) >= 0
    if (pin) out.push(p)
    if (pin !== qin) out.push(cross(p, q))
  })
  return out.length >= 3 ? [...out, out[0]] : []
}

/** Convex hull (monotone chain), closed. */
export function convexHull(ring: Ring): Ring {
  const pts = [...ring].sort((p, q) => p[0] - q[0] || p[1] - q[1])
  const turn = (o: Position, a: Position, b: Position) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const half = (list: Position[]) => {
    const h: Position[] = []
    for (const p of list) {
      while (h.length >= 2 && turn(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop()
      h.push(p)
    }
    return h.slice(0, -1)
  }
  const hull = [...half(pts), ...half([...pts].reverse())]
  return [...hull, hull[0]]
}

/** `ring` clipped to the convex hull of `clip` (close enough for our nearly convex islands). */
export function clipToHull(ring: Ring, clip: Ring): Ring {
  const hull = convexHull(clip)
  // Hull from monotone chain is counter-clockwise, so the inside is to the left of each edge.
  let out = ring
  for (let i = 0; i < hull.length - 1 && out.length; i++) out = clipHalfPlane(out, hull[i], hull[i + 1])
  return out
}

/** Stretches of `lines` inside `ring`, densified to `step` so they end close to its edge. */
export function insideRuns(lines: Position[][], ring: Ring, step: number): Position[][] {
  const runs: Position[][] = []
  for (const line of lines) {
    let run: Position[] = []
    for (let i = 0; i < line.length; i++) {
      const pts: Position[] = [line[i]]
      if (i < line.length - 1) {
        const [ax, ay] = line[i]
        const [bx, by] = line[i + 1]
        const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step))
        for (let k = 1; k < n; k++) pts.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n])
      }
      for (const p of pts) {
        if (insideRing(p, ring)) run.push(p)
        else if (run.length) {
          if (run.length > 1) runs.push(run)
          run = []
        }
      }
    }
    if (run.length > 1) runs.push(run)
  }
  return runs
}

export const centroid = (ring: Ring): Position => {
  const pts = ring.slice(0, -1)
  return [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length]
}

/** `ring` scaled by `k` about `about` and turned by `deg`. */
export function scaleRing(ring: Ring, about: Position, k: number, deg = 0): Ring {
  const c = Math.cos((deg * Math.PI) / 180)
  const s = Math.sin((deg * Math.PI) / 180)
  return ring.map(([x, y]) => {
    const dx = (x - about[0]) * k
    const dy = (y - about[1]) * k
    return [about[0] + dx * c - dy * s, about[1] + dx * s + dy * c]
  })
}

/** A small rough disc of radius `r` (pools, clearings). */
export function disc(at: Position, r: number, sides = 9): Ring {
  const ring: Ring = Array.from({ length: sides }, (_, i) => {
    const t = (i / sides) * Math.PI * 2
    const k = 1 + 0.12 * Math.sin(3 * t + 1)
    return [at[0] + Math.cos(t) * r * k, at[1] + Math.sin(t) * r * k]
  })
  return [...ring, ring[0]]
}

/** A rectangle from `a` along unit direction `d`, `length` long and `width` wide. */
export function strip(a: Position, d: Position, length: number, width: number): Ring {
  const n = [-d[1] * (width / 2), d[0] * (width / 2)]
  const b = [a[0] + d[0] * length, a[1] + d[1] * length]
  return [[a[0] + n[0], a[1] + n[1]], [b[0] + n[0], b[1] + n[1]], [b[0] - n[0], b[1] - n[1]], [a[0] - n[0], a[1] - n[1]], [a[0] + n[0], a[1] + n[1]]]
}

/** Seeded random numbers in [0, 1), the same for the same seed. */
export function seeded(seed: string) {
  let h = 2166136261
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}
