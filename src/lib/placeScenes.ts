import type { Position } from 'geojson'
import polygonClipping, { type MultiPolygon as ClipMulti } from 'polygon-clipping'
import {
  bboxOf,
  centroid,
  clipHalfPlane,
  clipToHull,
  DIORAMA_SIZE_M,
  disc,
  insideRuns,
  metresToDeg,
  pathQuads,
  scaleRing,
  seeded,
  soften,
  strip,
  type Ring,
} from './diorama'
import type { PlaceKind } from './explore'
import { SUMMITS } from './lowPolyTrees'

// What a cover diorama is made of, in the normalized frame (lib/diorama): pieces of land and water
// as extruded solids, terraces trees and props stand on, where trees may grow, and lines they
// shouldn't hide. Parks and trails are one flat island; each kind of place gets its own landform.
// Water is one color and sits a little below the land, inside a low bank: the top layer's lip and
// a sliver of the earth under it.

/** Land thickness, and the soft top layer over the earth. */
export const SLAB_M = DIORAMA_SIZE_M * 0.06
const TOP_M = SLAB_M * 0.22
/** Height of one terrace step on peaks, lookouts and waterfalls. */
const TIER_M = SLAB_M * 0.95

export const COLORS = {
  land: '#a9b58a',
  earth: '#8f7656',
  olive: '#9ea47e',
  rock: '#b3ad9f',
  rockSide: '#958b7d',
  water: '#8fb9c6',
  foam: '#e3f2f5',
  wood: '#a8784b',
  path: '#e8730c',
}

/** A polygon: outer ring, then any holes. */
export type Poly = Position[][]
export type Solid = { polygon: Poly; base: number; top: number; color: string }
export type Prop = { at: Position; model: 'boulder' | 'cairn' | 'deck'; tier: number; rot: number }
export type Scene = {
  /** Outline used to frame the cover and size the forest. */
  land: Ring[]
  solids: Solid[]
  /** Ground height (m) of each terrace; trees and props stand on them. */
  tiers: number[]
  /** Where trees grow; a point takes the highest terrace whose ring contains it. */
  grow: { ring: Ring; tier: number }[]
  /** No trees here (water, clearings, the summit). */
  keepOut: Poly[]
  props: Prop[]
  /** Lines trees shouldn't hide: trees standing in front of them turn see-through. */
  watch: { line: Position[]; tier: number }[]
  /** About how many trees. */
  trees: number
  /** A point the camera should face (a lookout's cliff), so it's in front rather than hidden behind. */
  front?: Position
  /** Leave out trees standing in front of watched lines, rather than drawing them see-through. */
  clearView?: boolean
  /** One large model scaled to fit (a peak's summit): its base radius in metres, turned `turn` degrees. */
  landmark?: { at: Position; model: string; tier: number; size: number; turn: number }
  /** Trees carry snow near this point, fewer and fewer out to `radius`. */
  snow?: { at: Position; radius: number }
  /** Extra room (CSS px) above the land for something tall: a summit, a flag. */
  headroom?: number
}

const m = metresToDeg
const S = DIORAMA_SIZE_M

// ── Polygon helpers (polygon-clipping works on arrays of polygons) ───────────────────────────

// Clipping runs in local metres rounded to the centimetre: polygon-clipping loses track of edges
// with the tiny degree values of the anchor frame.
const ORIGIN: Position = [-30, 0]
const M_PER_DEG = 111320
const toLocal = (polys: Poly[]): ClipMulti =>
  polys.map((poly) => poly.map((ring) => ring.map(([x, y]) => [Math.round((x - ORIGIN[0]) * M_PER_DEG * 100) / 100, Math.round((y - ORIGIN[1]) * M_PER_DEG * 100) / 100]))) as ClipMulti
const fromLocal = (polys: ClipMulti): Poly[] => polys.map((poly) => poly.map((ring) => ring.map(([x, y]) => [ORIGIN[0] + x / M_PER_DEG, ORIGIN[1] + y / M_PER_DEG])))
const union = (polys: Poly[]): Poly[] => (polys.length ? fromLocal(polygonClipping.union(toLocal(polys))) : [])
const minus = (a: Poly[], b: Poly[]): Poly[] => (b.length ? fromLocal(polygonClipping.difference(toLocal(a), toLocal(b))) : a)
const within = (a: Poly[], b: Poly[]): Poly[] => (a.length && b.length ? fromLocal(polygonClipping.intersection(toLocal(a), toLocal(b))) : [])

/** Chaikin smoothing: rounds every bend of a line, keeping its ends. */
function smooth(line: Position[], rounds = 3): Position[] {
  let pts = line
  for (let r = 0; r < rounds && pts.length > 2; r++) {
    const out: Position[] = [pts[0]]
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i]
      const [bx, by] = pts[i + 1]
      out.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75])
    }
    out.push(pts[pts.length - 1])
    pts = out
  }
  return pts
}

/** Drops points closer than `gap` to the last one kept (keeping the end). */
function thin(line: Position[], gap: number): Position[] {
  const out = [line[0]]
  for (const p of line.slice(1, -1)) if (Math.hypot(p[0] - out[out.length - 1][0], p[1] - out[out.length - 1][1]) >= gap) out.push(p)
  out.push(line[line.length - 1])
  return out
}

/** A smooth band `width` wide along each line: its segments joined with round elbows. */
function ribbon(lines: Position[][], width: number): Poly[] {
  const parts: Poly[] = []
  for (const line of lines.map((l) => thin(smooth(l), width / 3)))
    for (let i = 0; i < line.length; i++) {
      parts.push([disc(line[i], width / 2, 10)])
      if (i < line.length - 1) {
        const len = Math.hypot(line[i + 1][0] - line[i][0], line[i + 1][1] - line[i][1])
        if (len) parts.push([strip(line[i], unit(line[i], line[i + 1]), len, width)])
      }
    }
  return union(parts)
}

/** How far the banks are cut down, and how far below the land the water's surface sits. */
const BANK_M = TOP_M * 2
const WATER_DROP_M = TOP_M * 1.25
/** The water's surface on a terrace `top` high. */
const waterLevel = (top: number) => top - WATER_DROP_M

/**
 * A piece of land `top` high with `water` cut into it: solid earth below the cut, then earth and
 * the top layer around the water, which fills the cut up to a little below the banks.
 */
function terrace(rings: Ring[], top: number, water: Poly[], cap = COLORS.land, side = COLORS.earth): Solid[] {
  const ground = rings.map((r): Poly => [r])
  const banks = minus(ground, water)
  const bed = top - BANK_M
  return [
    ...ground.map((polygon) => ({ polygon, base: 0, top: water.length ? bed : top - TOP_M, color: side })),
    ...(water.length ? banks.map((polygon) => ({ polygon, base: bed, top: top - TOP_M, color: side })) : []),
    ...banks.map((polygon) => ({ polygon, base: top - TOP_M, top, color: cap })),
    ...water.map((polygon) => ({ polygon, base: bed, top: waterLevel(top), color: COLORS.water })),
  ]
}

/** Parks, regions and trails: one flat island, its lakes, and a trail's track. */
export function islandScene(land: Ring[], lakes: Ring[], path?: Position[][]): Scene {
  const water = union(lakes.map((r) => [r]))
  const quads = (w: number) => (path ? pathQuads({ type: 'MultiLineString', coordinates: path }, (p) => p, w) : [])
  return {
    land,
    solids: [...terrace(land, SLAB_M, water), ...quads(m(S / 45)).map((r) => ({ polygon: [r], base: SLAB_M, top: SLAB_M + 3, color: COLORS.path }))],
    tiers: [SLAB_M],
    grow: land.map((ring) => ({ ring, tier: 0 })),
    // Trees keep well clear of the path, so it shows between the crowns.
    keepOut: [...water, ...quads(m(S / 8)).map((r) => [r])],
    props: [],
    watch: (path ?? []).map((line) => ({ line, tier: 0 })),
    trees: path ? 150 : 320,
  }
}

/** Unit vector from a to b. */
function unit(a: Position, b: Position): Position {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
  return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]
}

/** Where `p` sits along the nearest segment of `lines`: that point and the flow direction there. */
function nearestOnCourse(lines: Position[][], p: Position) {
  let best = { d: Infinity, at: p, dir: [1, 0] as Position, line: lines[0], i: 1 }
  for (const line of lines)
    for (let i = 1; i < line.length; i++) {
      const a = line[i - 1]
      const b = line[i]
      const dx = b[0] - a[0]
      const dy = b[1] - a[1]
      const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)))
      const at: Position = [a[0] + dx * t, a[1] + dy * t]
      const d = Math.hypot(p[0] - at[0], p[1] - at[1])
      if (d < best.d) best = { d, at, dir: unit(a, b), line, i }
    }
  return best
}

/** A gently winding line across the island through `c`, for places whose stream isn't mapped. */
function madeUpCourse(island: Ring, c: Position, rnd: () => number): Position[][] {
  const a = rnd() * Math.PI
  const d: Position = [Math.cos(a), Math.sin(a)]
  const n: Position = [-d[1], d[0]]
  const [w, s, e, nn] = bboxOf([island])
  const reach = Math.max(e - w, nn - s)
  const line: Position[] = []
  for (let k = -12; k <= 12; k++) {
    const t = (k / 12) * reach
    const wave = Math.sin(k * 0.55 + rnd() * 0.3) * reach * 0.06
    line.push([c[0] + d[0] * t + n[0] * wave, c[1] + d[1] * t + n[1] * wave])
  }
  return [line]
}

/** A point beside the island's centre, at right angles to the longest stretch of stream. */
function sideOn(island: Ring, runs: Position[][]): Position | undefined {
  const run = runs.reduce<Position[] | undefined>((a, r) => (!a || r.length > a.length ? r : a), undefined)
  if (!run) return undefined
  const d = unit(run[0], run[run.length - 1])
  const c = centroid(island)
  return [c[0] - d[1], c[1] + d[0]]
}

/** Boulders along a stream's banks (and a few in it). */
function boulders(runs: Position[][], width: number, count: number, rnd: () => number, tier = 0, inStream = 0): Prop[] {
  const pts = runs.map((r) => smooth(r)).flat()
  const out: Prop[] = []
  for (let i = 0; i < count && pts.length > 2; i++) {
    const k = Math.min(pts.length - 2, Math.floor(rnd() * (pts.length - 1)))
    const d = unit(pts[k], pts[k + 1])
    const side = i < inStream ? (rnd() - 0.5) * 0.4 : (rnd() < 0.5 ? -1 : 1) * (0.75 + rnd() * 0.6)
    out.push({ at: [pts[k][0] - d[1] * width * side, pts[k][1] + d[0] * width * side], model: 'boulder', tier, rot: Math.floor(rnd() * 8) })
  }
  return out
}

export type PlaceInput = {
  kind: PlaceKind
  /** The island, normalized. */
  island: Ring
  /** The place itself, normalized. */
  focus: Position
  /** Its real water outline (lakes, wide rivers) and course (streams), normalized. */
  water: Ring[]
  course: Position[][]
  seed: string
}

/** How far corners of land and shorelines are rounded. */
const ROUND_M = S / 9

export function placeScene(input: PlaceInput): Scene {
  // Every landform is built on a rounded island, and lakes keep a soft shoreline.
  const p = { ...input, island: soften(input.island, m(ROUND_M)), water: input.water.map((r) => soften(r, m(ROUND_M / 3))) }
  const rnd = seeded(p.seed)
  switch (p.kind) {
    case 'lake':
      return lakeScene(p)
    case 'river':
    case 'creek':
      return streamScene(p, rnd)
    case 'waterfall':
      return waterfallScene(p, rnd)
    case 'peak':
      return peakScene(p, rnd)
    case 'viewpoint':
      return lookoutScene(p, rnd)
  }
}

/** A ring of forest around the lake's real outline, with a small dock facing the camera. */
function lakeScene({ island, water: lakes }: PlaceInput): Scene {
  const shapes = lakes.map((r) => clipToHull(r, island)).filter((r) => r.length >= 4)
  const water = within(union(shapes.map((r) => [r])), [[island]])
  const solids = terrace([island], SLAB_M, water)
  // The dock reaches into the lake from its southern shore, and the camera faces that shore.
  const main = [...shapes].sort((a, b) => b.length - a.length)[0]
  const watch: Scene['watch'] = []
  let front: Position | undefined
  if (main) {
    const shore = main.reduce((lo, q) => (q[1] < lo[1] ? q : lo))
    const into = unit(shore, centroid(main))
    const start: Position = [shore[0] - into[0] * m(S / 60), shore[1] - into[1] * m(S / 60)]
    solids.push({ polygon: [strip(start, into, m(S / 9), m(S / 45))], base: waterLevel(SLAB_M), top: SLAB_M + 4, color: COLORS.wood })
    watch.push({ line: [start, [start[0] + into[0] * m(S / 9), start[1] + into[1] * m(S / 9)]], tier: 0 })
    front = start
  }
  return { land: [island], solids, tiers: [SLAB_M], grow: [{ ring: island, tier: 0 }], keepOut: [...water, ...(front ? [[disc(front, m(S / 14))]] : [])], props: [], watch, trees: 230, front }
}

/** The stream's real course winding across the forest, smooth; rivers wide, creeks narrow and rocky. */
function streamScene({ kind, island, focus, water: areas, course }: PlaceInput, rnd: () => number): Scene {
  const width = m(kind === 'river' ? S / 11 : S / 17)
  const lines = course.length ? course : areas.length ? [] : madeUpCourse(island, focus, rnd)
  const runs = insideRuns(lines, island, width / 3)
  const shapes = areas.map((r) => clipToHull(r, island)).filter((r) => r.length >= 4)
  const water = within(union([...ribbon(runs, width), ...shapes.map((r): Poly => [r])]), [[island]])
  return {
    land: [island],
    solids: terrace([island], SLAB_M, water),
    tiers: [SLAB_M],
    grow: [{ ring: island, tier: 0 }],
    keepOut: [...water, ...ribbon(runs, width * (kind === 'river' ? 2.4 : 3.4))],
    props: boulders(runs, width, kind === 'river' ? 6 : 10, rnd, 0, kind === 'creek' ? 4 : 0),
    watch: runs.map((line) => ({ line, tier: 0 })),
    trees: kind === 'river' ? 160 : 130,
    // Seen from the side, the stream runs across the view, with an open bank in front of it.
    front: sideOn(island, runs),
    clearView: true,
  }
}

/**
 * Two terraces split by a cliff across the stream at the falls: the stream runs along the upper
 * terrace, pours over the cliff as a broad white sheet into a plunge pool, and carries on below.
 * OpenStreetMap draws streams in the direction they flow, so the upper side is upstream.
 */
function waterfallScene({ island, focus, course }: PlaceInput, rnd: () => number): Scene {
  const width = m(S / 11)
  const lines = course.length ? course : madeUpCourse(island, focus, rnd)
  const { at: fall, dir, line: main, i: seg } = nearestOnCourse(lines, focus)
  const across: Position = [-dir[1], dir[0]]
  // The cliff line through the falls; the upper terrace is on the upstream side (left of a→b). It
  // stands a little inside the island's edge, so the lower terrace shows as a ledge all around it.
  const a: Position = [fall[0] - across[0], fall[1] - across[1]]
  const b: Position = [fall[0] + across[0], fall[1] + across[1]]
  const cut = clipHalfPlane(scaleRing(island, centroid(island), 0.95), a, b)
  const upper = cut.length ? soften(cut, m(S / 14)) : cut
  const low = SLAB_M
  const high = SLAB_M + TIER_M * 1.4
  // A winding stream can cross the cliff line more than once. Each side is folded back over the
  // line where it strays, so the water above the falls stays on the upper terrace and the water
  // below stays on the lower one.
  const along = (q: Position) => (q[0] - fall[0]) * dir[0] + (q[1] - fall[1]) * dir[1]
  const keepTo = (side: 1 | -1) => (q: Position): Position => {
    const t = along(q)
    return t * side < 0 ? [q[0] - 2 * t * dir[0], q[1] - 2 * t * dir[1]] : q
  }
  const others = lines.filter((l) => l !== main)
  const above = insideRuns([[...main.slice(0, seg).map(keepTo(-1)), fall], ...others.flatMap((l) => runsWhere(l, (q) => along(q) < 0))], upper.length ? upper : island, width / 3)
  const below = insideRuns([[fall, ...main.slice(seg).map(keepTo(1))], ...others.flatMap((l) => runsWhere(l, (q) => along(q) >= 0))], island, width / 3)
  const runs = [...above, ...below]
  const poolAt: Position = [fall[0] + dir[0] * width * 1.1, fall[1] + dir[1] * width * 1.1]
  const pool: Poly = [disc(poolAt, width * 1.25, 12)]
  const upperWater = upper.length ? within(ribbon(above, width), [[upper]]) : []
  const lowerWater = within(union([...ribbon(below, width), pool]), [[island]])
  return {
    land: [island],
    solids: [
      ...terrace([island], low, lowerWater),
      ...(upper.length ? terrace([upper], high, upperWater) : []),
      // The falling water, from the lip of the cliff down into the pool, as wide as the stream.
      { polygon: [strip([fall[0] - dir[0] * width * 0.1, fall[1] - dir[1] * width * 0.1], dir, width * 0.3, width * 1.05)], base: waterLevel(low), top: waterLevel(high) + 1, color: COLORS.foam },
      { polygon: [disc([fall[0] + dir[0] * width * 0.45, fall[1] + dir[1] * width * 0.45], width * 0.5, 9)], base: waterLevel(low), top: waterLevel(low) + 1.2, color: COLORS.foam },
    ],
    tiers: [low, high],
    grow: [{ ring: island, tier: 0 }, ...(upper.length ? [{ ring: upper, tier: 1 }] : [])],
    keepOut: [pool, ...ribbon(runs, width * 2.6), [strip([fall[0] - across[0] * width * 1.6, fall[1] - across[1] * width * 1.6], across, width * 3.2, width * 1.4)]],
    props: [...boulders(below, width, 4, rnd, 0), ...boulders(above, width, 3, rnd, 1)],
    watch: [...above.map((line) => ({ line, tier: 1 })), ...below.map((line) => ({ line, tier: 0 })), { line: [fall, poolAt], tier: 0 }],
    trees: 150,
  }
}

/** Consecutive stretches of `line` where `keep` holds. */
function runsWhere(line: Position[], keep: (p: Position) => boolean): Position[][] {
  const out: Position[][] = []
  let run: Position[] = []
  for (const q of line) {
    if (keep(q)) run.push(q)
    else {
      if (run.length > 1) out.push(run)
      run = []
    }
  }
  if (run.length > 1) out.push(run)
  return out
}

/**
 * Terraces climbing to a rock summit with a snowcap, one of a few shapes and turned its own way so
 * no two peaks match. Forest low down, olive scrub higher, and snow on the trees near the top.
 */
function peakScene({ island }: PlaceInput, rnd: () => number): Scene {
  const c = centroid(island)
  const rings = [0, 1, 2].map((k) => (k ? scaleRing(island, c, 1 - k * 0.24, k * 9) : island))
  const tops = rings.map((_, k) => SLAB_M + k * TIER_M * 1.5)
  const caps = [COLORS.land, COLORS.land, COLORS.olive]
  const sides = [COLORS.earth, COLORS.rockSide, COLORS.rockSide]
  const top = rings[2]
  const topC = centroid(top)
  // The summit fills most of the top terrace (its radius in metres on the anchor).
  const radius = (top.slice(0, -1).reduce((a, q) => a + Math.hypot(q[0] - topC[0], q[1] - topC[1]), 0) / (top.length - 1)) * 0.74
  return {
    land: [island],
    solids: rings.flatMap((r, k) => terrace([r], tops[k], [], caps[k], sides[k])),
    tiers: tops,
    grow: rings.map((ring, k) => ({ ring, tier: k })),
    keepOut: [[disc(topC, radius * 0.96, 12)]],
    props: [],
    watch: [],
    trees: 230,
    landmark: { at: topC, model: `summit-${Math.floor(rnd() * SUMMITS)}`, tier: 2, size: radius * 111320, turn: Math.floor(rnd() * 360) },
    snow: { at: topC, radius: radius * 2.5 },
    headroom: 45,
  }
}

/** Terraces that crowd into a cliff on one side, with a wooden viewing deck and flag at its edge. */
function lookoutScene({ island }: PlaceInput, rnd: () => number): Scene {
  const c = centroid(island)
  const ring = island.slice(0, -1)
  const edge = ring[Math.floor(rnd() * ring.length)]
  const pivot: Position = [c[0] + (edge[0] - c[0]) * 0.86, c[1] + (edge[1] - c[1]) * 0.86]
  const rings = [0, 1, 2].map((k) => (k ? scaleRing(island, pivot, 1 - k * 0.27) : island))
  const tops = rings.map((_, k) => SLAB_M + k * TIER_M * 2)
  const top = rings[2]
  const topC = centroid(top)
  const deckAt: Position = [topC[0] + (pivot[0] - topC[0]) * 0.55, topC[1] + (pivot[1] - topC[1]) * 0.55]
  const facing = (Math.atan2(pivot[1] - topC[1], pivot[0] - topC[0]) * 180) / Math.PI
  return {
    land: [island],
    solids: rings.flatMap((r, k) => terrace([r], tops[k], [], k === 2 ? COLORS.rock : COLORS.land, k ? COLORS.rockSide : COLORS.earth)),
    tiers: tops,
    // The rocky top stays bare around the deck.
    grow: rings.slice(0, 2).map((ring, k) => ({ ring, tier: k })),
    keepOut: [[top]],
    props: [{ at: deckAt, model: 'deck', tier: 2, rot: Math.round(((90 - facing + 360) % 360) / 45) % 8 }],
    watch: [{ line: [deckAt, [deckAt[0] + 1e-9, deckAt[1]]], tier: 2 }],
    trees: 180,
    front: pivot,
    headroom: 40,
  }
}
