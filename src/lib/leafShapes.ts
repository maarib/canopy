import type { TreeIconId } from '../data/treeIcons'

// Organic leaf silhouettes for the tree icons, drawn on a 100×100 grid.
// Outlines are generated from a few botanical parameters and smoothed with a closed
// Catmull–Rom spline, which gives the soft, hand-cut lobe tips of the reference style.
// Each leaf also has vein lines, which the "veined" icon variant cuts out of the fill.

type Pt = [number, number]
export type LeafShape = {
  /** Filled outline(s): SVG path data. */
  fill: string
  /** Stem as a stroke (path data + width), drawn with round caps. */
  stem?: { d: string; width: number }
  /** Vein lines for the veined variant: path data and stroke width. */
  veins: { d: string; width: number }[]
}

const f = (n: number) => +n.toFixed(2)
const rad = (deg: number) => (deg * Math.PI) / 180

/** Closed Catmull–Rom spline through the points, as cubic Bézier path data. */
function smooth(pts: Pt[], tension = 1): string {
  const n = pts.length
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % n]
    const p3 = pts[(i + 2) % n]
    const c1: Pt = [p1[0] + ((p2[0] - p0[0]) / 6) * tension, p1[1] + ((p2[1] - p0[1]) / 6) * tension]
    const c2: Pt = [p2[0] - ((p3[0] - p1[0]) / 6) * tension, p2[1] - ((p3[1] - p1[1]) / 6) * tension]
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`
  }
  return d + 'Z'
}

/** Chaikin corner cutting: softens sharp points before smoothing (closed shape). */
function soften(pts: Pt[], amount = 0.22): Pt[] {
  const out: Pt[] = []
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    out.push([a[0] + (b[0] - a[0]) * amount, a[1] + (b[1] - a[1]) * amount])
    out.push([a[0] + (b[0] - a[0]) * (1 - amount), a[1] + (b[1] - a[1]) * (1 - amount)])
  }
  return out
}

const line = (pts: Pt[]) => `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}`
const curve = (a: Pt, c: Pt, b: Pt) => `M${f(a[0])} ${f(a[1])}Q${f(c[0])} ${f(c[1])} ${f(b[0])} ${f(b[1])}`

// ── Palmate leaves: radius around a centre, with lobes at given angles ──────────

type Lobe = { at: number; len: number; width: number; teeth?: number }

/**
 * Angles in degrees, screen space: -90 = up. `core` is the radius between lobes;
 * each lobe adds a Gaussian bump; the stem notch pulls the outline in at the bottom.
 */
function palmate(c: Pt, core: number, lobes: Lobe[], { notch = 6, wobble = 0.35, samples = 220 } = {}): Pt[] {
  const pts: Pt[] = []
  for (let i = 0; i < samples; i++) {
    const deg = -90 + (i / samples) * 360
    let r = core
    for (const l of lobes) {
      const d = ((deg - l.at + 540) % 360) - 180
      const g = Math.exp(-((d / l.width) ** 2))
      r += l.len * g
      // Teeth: small bumps on the outer part of each lobe.
      if (l.teeth) r += Math.max(0, Math.sin(rad(d) * l.teeth * 6)) * l.len * 0.11 * g ** 0.5 * (g > 0.25 ? 1 : 0)
    }
    // Stem notch at the bottom (90°).
    const dn = ((deg - 90 + 540) % 360) - 180
    r -= notch * Math.exp(-((dn / 12) ** 2))
    // A touch of irregularity so it doesn't look machine-made.
    r += wobble * Math.sin(rad(deg) * 7 + 1.3)
    pts.push([c[0] + Math.cos(rad(deg)) * r, c[1] + Math.sin(rad(deg)) * r])
  }
  return pts
}

const tipOf = (c: Pt, core: number, l: Lobe, frac = 0.82): Pt => [
  c[0] + Math.cos(rad(l.at)) * (core + l.len) * frac,
  c[1] + Math.sin(rad(l.at)) * (core + l.len) * frac,
]

// ── Pinnate (feather-veined) leaves: half-width along the midrib ───────────────

type Profile = (t: number) => number

/** Outline from the tip (top, t = 0) to the base (t = 1); halfWidth may differ per side. */
function pinnate(top: number, bottom: number, right: Profile, left: Profile = right, samples = 120, cx = 50): Pt[] {
  const r: Pt[] = []
  const l: Pt[] = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const y = top + t * (bottom - top)
    r.push([cx + right(t), y])
    l.push([cx - left(t), y])
  }
  return [...r, ...l.reverse().slice(1, -1)]
}

/** Ovate body: zero at both ends, widest at `peak` (0..1 from the tip). */
const ovate = (w: number, peak: number, round = 1) => (t: number) => {
  const k = Math.log(0.5) / Math.log(peak)
  return w * Math.sin(Math.PI * t ** k) ** round
}

// ── Leaflets for compound leaves ────────────────────────────────────────────────

/** A lanceolate leaflet from `base`, pointing at `angle`, as outline points. */
function leaflet(base: Pt, angle: number, len: number, width: number, samples = 40): Pt[] {
  const outline = pinnate(0, len, ovate(width, 0.45, 0.9), ovate(width, 0.45, 0.9), samples, 0)
  const a = rad(angle + 90) // pinnate() points down the y axis; rotate so the tip points at `angle`
  return outline.map(([x, y]) => {
    const yy = y - len // tip at -len, base at 0
    return [base[0] + x * Math.cos(a) - yy * Math.sin(a), base[1] + x * Math.sin(a) + yy * Math.cos(a)]
  })
}

const veinsFromBase = (base: Pt, tips: Pt[], width = 2.2) =>
  tips.map((tip) => ({ d: curve(base, [(base[0] + tip[0]) / 2 + (tip[1] - base[1]) * 0.06, (base[1] + tip[1]) / 2], tip), width }))

// ── The set ─────────────────────────────────────────────────────────────────────

function maple(): LeafShape {
  // Sugar maple, hand-placed (right half; mirrored): three big lobes with secondary points,
  // two small lower lobes, deep rounded sinuses.
  const right: Pt[] = [
    [50, 5],
    [55, 15],
    [62, 12],
    [59.5, 24],
    [57, 34],
    [66, 27],
    [74, 17],
    [76.5, 27.5],
    [93, 26],
    [85, 37],
    [89, 45],
    [77, 47.5],
    [71, 52],
    [79, 61],
    [67, 61.5],
    [58, 64],
    [53.5, 69],
  ]
  const left = right.map(([x, y]): Pt => [100 - x, y]).reverse()
  return {
    fill: smooth(soften(soften([...right, ...left.slice(0, -1)], 0.2), 0.2), 1),
    stem: { d: curve([50, 64], [50, 82], [55, 95]), width: 4.6 },
    veins: veinsFromBase([50, 64], [
      [50, 16],
      [84, 29],
      [16, 29],
      [72, 57],
      [28, 57],
    ]),
  }
}

function shrub(): LeafShape {
  // Deeply cut and star-like, with pointed lobes; stands for sumacs, shrubs and vines.
  const c: Pt = [50, 52]
  const core = 11
  const lobes: Lobe[] = [-90, -90 - 50, -90 + 50, -90 - 100, -90 + 100, -90 - 145, -90 + 145].map((at, i) => ({
    at,
    len: [36, 32, 32, 25, 25, 14, 14][i],
    width: [12, 12, 12, 11, 11, 10, 10][i],
  }))
  return {
    fill: smooth(palmate(c, core, lobes, { notch: 3, wobble: 0.25 })),
    stem: { d: curve([50, 60], [49, 80], [53, 95]), width: 4.4 },
    veins: veinsFromBase([50, 58], lobes.slice(0, 5).map((l) => tipOf(c, core, l, 0.76)), 2),
  }
}

function oak(): LeafShape {
  const lobes = 4
  const body = ovate(27, 0.55, 0.75)
  // Big rounded lobes with deep sinuses, alternating sides like a real oak.
  const side = (phase: number) => (t: number) =>
    body(t) * (0.42 + 0.58 * Math.abs(Math.sin(Math.PI * (t * lobes + phase))) ** 0.45) * (t > 0.92 ? 1 - (t - 0.92) * 4 : 1)
  const tips: Pt[] = []
  for (let k = 0; k < 4; k++) {
    const t = (k + 0.5) / lobes
    tips.push([50 + body(t) * 0.75, 6 + t * 70], [50 - body(t + 0.08) * 0.75, 6 + (t + 0.08) * 70])
  }
  return {
    fill: smooth(pinnate(6, 76, side(0.15), side(0.62))),
    stem: { d: curve([50, 74], [50, 86], [54, 95]), width: 4.4 },
    veins: [{ d: line([[50, 12], [50, 72]]), width: 2.4 }, ...tips.map((tip) => ({ d: curve([50, tip[1] + 6], [(50 + tip[0]) / 2, tip[1] + 3], tip), width: 1.8 }))],
  }
}

function toothed(w: number, peak: number, teeth: number, depth: number, round = 1) {
  const body = ovate(w, peak, round)
  return (t: number) => body(t) * (1 - depth * (0.5 - 0.5 * Math.cos(2 * Math.PI * teeth * t)) * Math.min(1, t * 6) * (t > 0.85 ? 0 : 1))
}

function sideVeins(top: number, bottom: number, body: Profile, count: number, spread = 0.72): { d: string; width: number }[] {
  // Midrib starts below the tip so it doesn't split a narrow point.
  const veins = [{ d: line([[50, top + 13], [50, bottom - 2]]), width: 2.4 }]
  // Side veins from a quarter of the way down, so none crowd the narrow tip.
  for (let k = 0; k < count; k++) {
    const t = 0.26 + (k / Math.max(1, count - 1)) * 0.56
    const y = top + t * (bottom - top)
    for (const s of [1, -1]) {
      const x = 50 + s * body(t) * spread
      veins.push({ d: curve([50, y + 7], [50 + s * body(t) * 0.35, y + 4], [x, y - 2]), width: 1.7 })
    }
  }
  return veins
}

function birch(): LeafShape {
  // Ovate with a drawn-out tip and a toothed margin; widest near the base.
  const body = toothed(25, 0.66, 9, 0.09)
  return {
    fill: smooth(pinnate(5, 76, body, toothed(25, 0.66, 9, 0.09))),
    stem: { d: curve([50, 74], [50, 86], [53, 95]), width: 4.2 },
    veins: sideVeins(5, 76, ovate(25, 0.66), 5),
  }
}

function beech(): LeafShape {
  // Narrow ellipse, gently wavy edge, many straight parallel veins.
  const body = (t: number) => ovate(19, 0.5, 0.85)(t) * (1 - 0.05 * (0.5 - 0.5 * Math.cos(2 * Math.PI * 7 * t)) * (t > 0.88 ? 0 : 1))
  return {
    fill: smooth(pinnate(5, 78, body)),
    stem: { d: curve([50, 76], [50, 87], [52, 95]), width: 4 },
    veins: sideVeins(5, 78, ovate(19, 0.5, 0.85), 7, 0.8),
  }
}

function aspen(): LeafShape {
  // Nearly round with a short point and soft rounded teeth (reference: bottom-middle).
  const body = (t: number) => ovate(31, 0.6, 0.62)(t) * (1 - 0.035 * (0.5 - 0.5 * Math.cos(2 * Math.PI * 8 * t)) * (t > 0.12 && t < 0.9 ? 1 : 0))
  return {
    fill: smooth(pinnate(8, 76, body)),
    stem: { d: curve([50, 74], [49, 86], [52, 95]), width: 4.2 },
    veins: [
      { d: line([[50, 16], [50, 72]]), width: 2.4 },
      ...[0.35, 0.55, 0.72].flatMap((t) => [1, -1].map((s) => ({ d: curve([50, 8 + t * 68 + 8], [50 + s * 10, 8 + t * 68 + 4], [50 + s * 24 * Math.sin(Math.PI * t), 8 + t * 68 - 4]), width: 1.7 }))),
    ],
  }
}

function basswood(): LeafShape {
  // Heart-shaped with a lopsided base and fine teeth (elms & basswoods).
  const c: Pt = [50, 50]
  const lobes: Lobe[] = [
    { at: -90, len: 22, width: 30 },
    { at: -20, len: 14, width: 40 },
    { at: -160, len: 12, width: 40 },
    { at: 40, len: 9, width: 26 },
    { at: 145, len: 11, width: 26 },
  ]
  const outline = palmate(c, 20, lobes, { notch: 9, wobble: 0.2 }).map(([x, y], i, all): Pt => {
    // fine teeth all round, except at the stem notch
    const a = (i / all.length) * 2 * Math.PI
    const k = 1 + 0.025 * Math.sin(a * 26)
    return [c[0] + (x - c[0]) * k, c[1] + (y - c[1]) * k]
  })
  return {
    fill: smooth(outline),
    stem: { d: curve([50, 66], [51, 84], [55, 95]), width: 4.2 },
    veins: veinsFromBase([50, 66], [
      [50, 18],
      [72, 34],
      [28, 36],
      [68, 58],
      [32, 59],
    ]),
  }
}

function alder(): LeafShape {
  // Egg-shaped, widest above the middle with a rounded (slightly notched) tip, toothed edge.
  const c: Pt = [50, 42]
  const pts: Pt[] = []
  for (let i = 0; i < 160; i++) {
    const a = (i / 160) * 2 * Math.PI - Math.PI / 2 // start at the top
    const down = Math.max(0, Math.sin(a)) // 0 at top, 1 at bottom
    const rx = 27 * (1 - 0.42 * down ** 1.6)
    const ry = a > 0 && a < Math.PI ? 34 : 30
    const notch = 2.2 * Math.exp(-(((a + Math.PI / 2) / 0.12) ** 2))
    const teeth = 1 + 0.024 * Math.sin(a * 18) * (down < 0.85 ? 1 : 0)
    pts.push([c[0] + Math.cos(a) * rx * teeth, c[1] + Math.sin(a) * (ry - notch) * teeth])
  }
  return {
    fill: smooth(pts),
    stem: { d: curve([50, 74], [50, 86], [53, 95]), width: 4.2 },
    veins: sideVeins(10, 76, (t) => 26 * Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 0.6, 5),
  }
}

function hickory(): LeafShape {
  // Compound: five slim leaflets on short stalks, spreading from the top of the stem.
  const hub: Pt = [50, 64]
  const spec: [number, number, number][] = [
    [-90, 44, 9.5],
    [-90 - 44, 38, 9],
    [-90 + 44, 38, 9],
    [-90 - 98, 26, 7.5],
    [-90 + 98, 26, 7.5],
  ]
  const baseOf = (a: number): Pt => [hub[0] + Math.cos(rad(a)) * 5, hub[1] + Math.sin(rad(a)) * 5]
  return {
    fill: spec.map(([a, len, w]) => smooth(leaflet(baseOf(a), a, len, w))).join(''),
    stem: {
      d: [curve([50, 62], [50, 82], [55, 95]), ...spec.map(([a]) => line([hub, baseOf(a)]))].join(''),
      width: 4,
    },
    veins: spec.map(([a, len]) => {
      const b = baseOf(a)
      const at = (k: number): Pt => [b[0] + Math.cos(rad(a)) * len * k, b[1] + Math.sin(rad(a)) * len * k]
      return { d: line([at(0.22), at(0.8)]), width: 1.8 }
    }),
  }
}

function ash(): LeafShape {
  // Compound and pinnate: paired leaflets along a central stalk, plus one at the tip.
  const leaflets: Pt[][] = [leaflet([50, 30], -90, 26, 8)]
  const veins: { d: string; width: number }[] = [{ d: line([[50, 8], [50, 88]]), width: 2.4 }]
  for (const [y, len] of [
    [38, 25],
    [56, 24],
    [74, 21],
  ] as [number, number][]) {
    for (const s of [1, -1]) {
      const angle = s === 1 ? -35 : -145
      leaflets.push(leaflet([50, y], angle, len, 7.5))
    }
  }
  return {
    fill: leaflets.map((l) => smooth(l)).join(''),
    stem: { d: curve([50, 30], [50, 70], [52, 96]), width: 3.6 },
    veins,
  }
}

function ginkgo(): LeafShape {
  // Fan with a wavy outer edge and a central notch, narrowing to the stem (reference: bottom-right).
  const hub: Pt = [50, 70]
  const spread = 50
  const outer: Pt[] = []
  for (let i = 0; i <= 60; i++) {
    const d = -spread + (i / 60) * 2 * spread
    const notch = 10 * Math.exp(-((d / 5) ** 2))
    const r = 50 - notch + 1.6 * Math.sin(rad(d) * 13) - 9 * (Math.abs(d) / spread) ** 3
    outer.push([hub[0] + Math.sin(rad(d)) * r, hub[1] - Math.cos(rad(d)) * r])
  }
  // Concave sides curving in to the stem.
  const side = (from: Pt, s: 1 | -1): Pt[] =>
    [0.25, 0.5, 0.75].map((k) => [hub[0] + (from[0] - hub[0]) * (1 - k) + s * 4 * Math.sin(Math.PI * k), hub[1] + (from[1] - hub[1]) * (1 - k)])
  const right = outer[outer.length - 1]
  const left = outer[0]
  const pts: Pt[] = [...outer, ...side(right, -1), [hub[0] + 2, hub[1]], [hub[0] - 2, hub[1]], ...side(left, 1).reverse()]
  return {
    fill: smooth(pts, 0.9),
    stem: { d: curve([50, 68], [49, 83], [52, 96]), width: 4.2 },
    veins: [-40, -22, -8, 8, 22, 40].map((d) => ({
      d: line([
        [hub[0], hub[1] - 6],
        [hub[0] + Math.sin(rad(d)) * 42, hub[1] - Math.cos(rad(d)) * 42],
      ]),
      width: 1.6,
    })),
  }
}

function larch(): LeafShape {
  // A tuft of soft needles from a short spur.
  const base: Pt = [50, 62]
  const needles = Array.from({ length: 11 }, (_, i) => {
    const a = -90 + (i - 5) * 13
    const len = 40 - Math.abs(i - 5) * 2.2
    const bend = (i - 5) * 0.9
    const tip: Pt = [base[0] + Math.cos(rad(a)) * len, base[1] + Math.sin(rad(a)) * len]
    const mid: Pt = [(base[0] + tip[0]) / 2 + bend, (base[1] + tip[1]) / 2]
    return curve(base, mid, tip)
  })
  return {
    // Needles are strokes; the "fill" is the spur knob.
    fill: `M44 62a6 5.5 0 1 0 12 0a6 5.5 0 1 0-12 0Z`,
    stem: { d: curve([50, 64], [50, 82], [54, 95]), width: 4.6 },
    veins: needles.map((d) => ({ d, width: 3.6 })),
  }
}

function cherries(): LeafShape {
  const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`
  const leaf = smooth(leaflet([56, 16], -18, 28, 9))
  return {
    fill: circle(33, 76, 15) + circle(68, 79, 15) + leaf,
    stem: { d: `${curve([35, 62], [38, 34], [56, 16])}${curve([66, 65], [64, 36], [56, 16])}`, width: 3.6 },
    veins: [],
  }
}

export const LEAF_SHAPES: Record<TreeIconId, LeafShape> = {
  maples: maple(),
  oaks: oak(),
  birches: birch(),
  aspens: aspen(),
  larches: larch(),
  ashes: ash(),
  beeches: beech(),
  hickories: hickory(),
  elms: basswood(),
  cherries: cherries(),
  alders: alder(),
  'other-trees': ginkgo(),
  shrubs: shrub(),
}

/** Needle and fruit icons draw their "veins" as visible strokes rather than cut-outs. */
export const STROKE_ONLY: ReadonlySet<TreeIconId> = new Set(['larches'])
