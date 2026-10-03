import type { Position } from 'geojson'
import {
  bboxOf,
  centroid,
  clipHalfPlane,
  clipToHull,
  DIORAMA_SIZE_M,
  disc,
  insideRing,
  insideRuns,
  metresToDeg,
  pathQuads,
  scaleRing,
  seeded,
  strip,
  type Ring,
} from './diorama'
import type { PlaceKind } from './explore'

// What a cover diorama is made of, in the normalized frame (lib/diorama): pieces of land and water
// as extruded solids, terraces trees and props stand on, where trees may grow, and lines they
// shouldn't hide. Parks and trails are one flat island; each kind of place gets its own landform.

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
  summit: '#cbc5b8',
  water: '#9fbcc4',
  foam: '#e3f2f5',
  wood: '#a8784b',
  path: '#e8730c',
}

export type Solid = { ring: Ring; base: number; top: number; color: string }
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
  keepOut: Ring[]
  props: Prop[]
  /** Lines trees shouldn't hide: trees standing in front of them turn see-through. */
  watch: { line: Position[]; tier: number }[]
  /** About how many trees. */
  trees: number
  /** A point the camera should face (a lookout's cliff), so it's in front rather than hidden behind. */
  front?: Position
  /** Leave out trees standing in front of watched lines, rather than drawing them see-through. */
  clearView?: boolean
}

const m = metresToDeg
const S = DIORAMA_SIZE_M

/** A piece of land: earth up to the soft top layer. */
const slab = (ring: Ring, top: number, cap = COLORS.land, side = COLORS.earth): Solid[] => [
  { ring, base: 0, top: top - TOP_M, color: side },
  { ring, base: top - TOP_M, top, color: cap },
]
const water = (ring: Ring, at: number, color = COLORS.water): Solid => ({ ring, base: at, top: at + 1.5, color })

/** Parks, regions and trails: one flat island, its lakes, and a trail's track. */
export function islandScene(land: Ring[], lakes: Ring[], path?: Position[][]): Scene {
  return {
    land,
    solids: [
      ...land.flatMap((r) => slab(r, SLAB_M)),
      ...lakes.map((r) => water(r, SLAB_M)),
      ...(path ? pathQuads({ type: 'MultiLineString', coordinates: path }, (p) => p, m(S / 45)).map((r) => ({ ring: r, base: SLAB_M, top: SLAB_M + 3, color: COLORS.path })) : []),
    ],
    tiers: [SLAB_M],
    grow: land.map((ring) => ({ ring, tier: 0 })),
    // Trees keep well clear of the path, so it shows between the crowns.
    keepOut: [...lakes, ...(path ? pathQuads({ type: 'MultiLineString', coordinates: path }, (p) => p, m(S / 8)) : [])],
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
  let best = { d: Infinity, at: p, dir: [1, 0] as Position }
  for (const line of lines)
    for (let i = 1; i < line.length; i++) {
      const a = line[i - 1]
      const b = line[i]
      const dx = b[0] - a[0]
      const dy = b[1] - a[1]
      const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)))
      const at: Position = [a[0] + dx * t, a[1] + dy * t]
      const d = Math.hypot(p[0] - at[0], p[1] - at[1])
      if (d < best.d) best = { d, at, dir: unit(a, b) }
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

const streamQuads = (runs: Position[][], width: number) => pathQuads({ type: 'MultiLineString', coordinates: runs }, (p) => p, width)

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
  const pts = runs.flat()
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

export function placeScene(p: PlaceInput): Scene {
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
      return peakScene(p)
    case 'viewpoint':
      return lookoutScene(p, rnd)
  }
}

/** A ring of forest around the lake's real outline, with a small dock. */
function lakeScene({ island, water: lakes }: PlaceInput): Scene {
  const shapes = lakes.map((r) => clipToHull(r, island)).filter((r) => r.length >= 4)
  const solids = [...slab(island, SLAB_M), ...shapes.map((r) => water(r, SLAB_M))]
  // The dock reaches into the lake from its southern shore, and the camera faces that shore.
  const main = shapes.sort((a, b) => b.length - a.length)[0]
  const watch: Scene['watch'] = []
  let front: Position | undefined
  if (main) {
    const shore = main.reduce((lo, q) => (q[1] < lo[1] ? q : lo))
    const into = unit(shore, centroid(main))
    const start: Position = [shore[0] - into[0] * m(S / 60), shore[1] - into[1] * m(S / 60)]
    solids.push({ ring: strip(start, into, m(S / 9), m(S / 45)), base: SLAB_M, top: SLAB_M + 6, color: COLORS.wood })
    watch.push({ line: [start, [start[0] + into[0] * m(S / 9), start[1] + into[1] * m(S / 9)]], tier: 0 })
    front = start
  }
  return { land: [island], solids, tiers: [SLAB_M], grow: [{ ring: island, tier: 0 }], keepOut: [...shapes, ...(front ? [disc(front, m(S / 14))] : [])], props: [], watch, trees: 230, front }
}

/** The stream's real course winding across the forest; rivers wide, creeks narrow and rocky. */
function streamScene({ kind, island, focus, water: areas, course }: PlaceInput, rnd: () => number): Scene {
  const width = m(kind === 'river' ? S / 12 : S / 20)
  const lines = course.length ? course : areas.length ? [] : madeUpCourse(island, focus, rnd)
  const runs = insideRuns(lines, island, width / 3)
  const shapes = areas.map((r) => clipToHull(r, island)).filter((r) => r.length >= 4)
  return {
    land: [island],
    solids: [...slab(island, SLAB_M), ...shapes.map((r) => water(r, SLAB_M)), ...streamQuads(runs, width).map((r) => water(r, SLAB_M))],
    tiers: [SLAB_M],
    grow: [{ ring: island, tier: 0 }],
    keepOut: [...shapes, ...streamQuads(runs, width * (kind === 'river' ? 3 : 5))],
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
 * terrace, pours over the cliff as a white sheet into a plunge pool, and carries on below.
 * OpenStreetMap draws streams in the direction they flow, so the upper side is upstream.
 */
function waterfallScene({ island, focus, course }: PlaceInput, rnd: () => number): Scene {
  const width = m(S / 18)
  const lines = course.length ? course : madeUpCourse(island, focus, rnd)
  const { at: fall, dir } = nearestOnCourse(lines, focus)
  const across: Position = [-dir[1], dir[0]]
  // The cliff line through the falls; the upper terrace is on the upstream side (left of a→b).
  const a: Position = [fall[0] - across[0], fall[1] - across[1]]
  const b: Position = [fall[0] + across[0], fall[1] + across[1]]
  const upper = clipHalfPlane(island, a, b)
  const low = SLAB_M
  const high = SLAB_M + TIER_M * 1.4
  const runs = insideRuns(lines, island, width / 3)
  const upstream = (q: Position) => (q[0] - fall[0]) * dir[0] + (q[1] - fall[1]) * dir[1] < 0
  const split = (side: boolean) => runs.flatMap((r) => runsWhere(r, (q) => upstream(q) === side))
  const above = split(true)
  const below = split(false)
  const pool = disc([fall[0] + dir[0] * width * 1.3, fall[1] + dir[1] * width * 1.3], width * 1.35)
  return {
    land: [island],
    solids: [
      ...slab(island, low),
      ...(upper.length ? slab(upper, high) : []),
      ...streamQuads(above, width).map((r) => water(r, high)),
      ...streamQuads(below, width).map((r) => water(r, low)),
      water(pool, low),
      // The falling water, from the lip of the cliff down into the pool.
      { ring: strip([fall[0] - dir[0] * width * 0.1, fall[1] - dir[1] * width * 0.1], dir, width * 0.35, width * 1.1), base: low, top: high + 1.5, color: COLORS.foam },
      water(disc([fall[0] + dir[0] * width * 0.7, fall[1] + dir[1] * width * 0.7], width * 0.55, 7), low + 0.5, COLORS.foam),
    ],
    tiers: [low, high],
    grow: [
      { ring: island, tier: 0 },
      ...(upper.length ? [{ ring: upper, tier: 1 }] : []),
    ],
    keepOut: [pool, ...streamQuads(runs, width * 4.5), strip([fall[0] - across[0] * width * 2, fall[1] - across[1] * width * 2], across, width * 4, width * 1.6)],
    props: [...boulders(below, width, 4, rnd, 0), ...boulders(above, width, 3, rnd, 1)],
    watch: [...above.map((line) => ({ line, tier: 1 })), ...below.map((line) => ({ line, tier: 0 })), { line: [fall, [fall[0] + dir[0] * width * 2, fall[1] + dir[1] * width * 2]], tier: 0 }],
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

/** Terraces rising to the summit: forest low down, olive scrub, then bare rock and a cairn. */
function peakScene({ island, focus }: PlaceInput): Scene {
  const c = centroid(island)
  const rings = [0, 1, 2, 3].map((k) => (k ? scaleRing(island, c, 1 - k * 0.21, k * 9) : island))
  const tops = rings.map((_, k) => SLAB_M + k * TIER_M * 1.7)
  const caps = [COLORS.land, COLORS.land, COLORS.olive, COLORS.summit]
  const sides = [COLORS.earth, COLORS.rockSide, COLORS.rockSide, COLORS.rockSide]
  return {
    land: [island],
    solids: rings.flatMap((r, k) => slab(r, tops[k], caps[k], sides[k])),
    tiers: tops,
    grow: rings.slice(0, 3).map((ring, k) => ({ ring, tier: k })),
    keepOut: [rings[3]],
    props: [{ at: insideRing(focus, rings[3]) ? focus : c, model: 'cairn', tier: 3, rot: 2 }],
    watch: [],
    trees: 220,
  }
}

/** Terraces that crowd into a cliff on one side, with a wooden viewing deck at its edge. */
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
    solids: rings.flatMap((r, k) => slab(r, tops[k], k === 2 ? COLORS.rock : COLORS.land, k ? COLORS.rockSide : COLORS.earth)),
    tiers: tops,
    // The rocky top stays bare around the deck.
    grow: rings.slice(0, 2).map((ring, k) => ({ ring, tier: k })),
    keepOut: [top],
    props: [{ at: deckAt, model: 'deck', tier: 2, rot: Math.round(((90 - facing + 360) % 360) / 45) % 8 }],
    watch: [{ line: [deckAt, [deckAt[0] + 1e-9, deckAt[1]]], tier: 2 }],
    trees: 180,
    front: pivot,
  }
}
