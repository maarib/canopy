import type { TreeIconId } from '../data/treeIcons'

// Tree icons on a 100×100 grid, in a two-colour style: smooth, chunky leaf blades in each
// tree's fall colour, with the stem, stalk and veins drawn on top in one dark ink colour.
// Shapes follow each group's main Ontario species (see docs/CHANGELOG.md for sources):
// e.g. sugar maple's rounded U-shaped sinuses, shagbark hickory's five leaflets, white ash's seven.

type Pt = [number, number]
type Stroke = { d: string; width: number }

export type LeafShape = {
  /** Filled shapes: 'leaf' uses the tree's fall colour, 'accent' a second colour (fruit), 'ink' the stem colour. */
  blades: { d: string; tone?: 'leaf' | 'accent' | 'ink' }[]
  /** Strokes in the leaf colour (larch needles). */
  needles?: Stroke[]
  /** Stem, stalk and veins, in the ink colour, drawn on top. */
  ink: Stroke[]
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

/** Chaikin corner cutting: rounds sharp points (closed shape). */
function soften(pts: Pt[], passes = 2, amount = 0.25): Pt[] {
  let out = pts
  for (let p = 0; p < passes; p++) {
    const next: Pt[] = []
    for (let i = 0; i < out.length; i++) {
      const a = out[i]
      const b = out[(i + 1) % out.length]
      next.push([a[0] + (b[0] - a[0]) * amount, a[1] + (b[1] - a[1]) * amount])
      next.push([a[0] + (b[0] - a[0]) * (1 - amount), a[1] + (b[1] - a[1]) * (1 - amount)])
    }
    out = next
  }
  return out
}

const line = (pts: Pt[]) => `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}`
const curve = (a: Pt, c: Pt, b: Pt) => `M${f(a[0])} ${f(a[1])}Q${f(c[0])} ${f(c[1])} ${f(b[0])} ${f(b[1])}`
const circle = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`

const STEM = 6.4
const VEIN = 4.6

/** Stem from below the leaf, straight up into the midrib, with a slight curve at the foot. */
const stemInto = (top: number, foot = 95, bend = 4): Stroke => ({
  d: `M${50 + bend} ${foot}Q50 ${foot - 6} 50 ${foot - 16}L50 ${top}`,
  width: STEM,
})

/** Mirrored side veins from the midrib out toward the edge. */
const pairs = (rows: [y: number, reach: number, rise: number][], width = VEIN): Stroke[] =>
  rows.flatMap(([y, reach, rise]) => [
    { d: curve([50, y], [50 + reach * 0.45, y - rise * 0.2], [50 + reach, y - rise]), width },
    { d: curve([50, y], [50 - reach * 0.45, y - rise * 0.2], [50 - reach, y - rise]), width },
  ])

// ── Outline builders ────────────────────────────────────────────────────────────

type Profile = (t: number) => number

/** Outline from the tip (top, t = 0) to the base (t = 1) with a half-width profile per side. */
function pinnate(top: number, bottom: number, right: Profile, left: Profile = right, samples = 140, cx = 50): Pt[] {
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

/** Ovate body: zero at both ends, widest at `peak` (0..1 from the tip); `round` < 1 fills it out. */
const ovate = (w: number, peak: number, round = 1) => (t: number) => {
  const k = Math.log(0.5) / Math.log(peak)
  return w * Math.sin(Math.PI * t ** k) ** round
}

/** Soft rounded teeth along a profile (none near the tip and base). */
const teeth = (body: Profile, count: number, depth: number, from = 0.12, to = 0.86): Profile => (t) =>
  body(t) * (1 - (t > from && t < to ? depth * (0.5 - 0.5 * Math.cos(2 * Math.PI * count * t)) : 0))

type Lobe = { at: number; len: number; width: number }

/** Radius around a centre with Gaussian lobes; -90° is up. Notch pulls in at the stem. */
function palmate(c: Pt, core: number, lobes: Lobe[], notch = 6, samples = 240): Pt[] {
  const pts: Pt[] = []
  for (let i = 0; i < samples; i++) {
    const deg = -90 + (i / samples) * 360
    let r = core
    for (const l of lobes) {
      const d = ((deg - l.at + 540) % 360) - 180
      r += l.len * Math.exp(-((d / l.width) ** 2))
    }
    const dn = ((deg - 90 + 540) % 360) - 180
    r -= notch * Math.exp(-((dn / 14) ** 2))
    pts.push([c[0] + Math.cos(rad(deg)) * r, c[1] + Math.sin(rad(deg)) * r])
  }
  return pts
}

/** A leaflet from `base`, pointing at `angle` (degrees, -90 = up). */
function leaflet(base: Pt, angle: number, len: number, width: number, peak = 0.5): Pt[] {
  const outline = pinnate(0, len, ovate(width, peak, 0.85), ovate(width, peak, 0.85), 48, 0)
  const a = rad(angle + 90)
  return outline.map(([x, y]) => {
    const yy = y - len
    return [base[0] + x * Math.cos(a) - yy * Math.sin(a), base[1] + x * Math.sin(a) + yy * Math.cos(a)]
  })
}

const toward = (from: Pt, angle: number, dist: number): Pt => [from[0] + Math.cos(rad(angle)) * dist, from[1] + Math.sin(rad(angle)) * dist]

// ── The set ─────────────────────────────────────────────────────────────────────

function maple(): LeafShape {
  // Sugar maple: three big lobes and two small lower ones, rounded U-shaped sinuses,
  // a few soft secondary points. Hand-placed right half, mirrored, then rounded.
  const right: Pt[] = [
    [50, 4],
    [56, 13],
    [63, 11],
    [61, 23],
    [57.5, 33],
    [67, 26],
    [75, 18],
    [77.5, 27],
    [94, 26],
    [86, 38],
    [90, 46],
    [78, 48],
    [72, 52],
    [80, 61],
    [67, 61],
    [58, 64],
    [53, 70],
  ]
  const left = right.map(([x, y]): Pt => [100 - x, y]).reverse()
  return {
    blades: [{ d: smooth(soften([...right, ...left.slice(0, -1)], 3, 0.24)) }],
    ink: [stemInto(22), ...pairs([[52, 22, 16]]), ...pairs([[60, 18, 4]], VEIN - 0.6)],
  }
}

function oak(): LeafShape {
  // White oak: rounded finger-like lobes with deep sinuses; left and right offset so the
  // lobes alternate. Hand-placed right side, left side mirrored and shifted down, then rounded.
  const right: Pt[] = [
    [50, 4],
    [58, 6],
    [65, 13],
    [60, 21],
    [71, 22],
    [79, 30],
    [70, 38],
    [61, 39],
    [75, 44],
    [83, 53],
    [74, 61],
    [62, 59],
    [71, 66],
    [68, 73],
    [57, 75],
    [53, 79],
  ]
  const left = right
    .slice(1)
    .map(([x, y]): Pt => [100 - x, Math.min(79, y + 4)])
    .reverse()
  return {
    blades: [{ d: smooth(soften([...right, ...left], 3, 0.24)) }],
    ink: [
      stemInto(14),
      { d: curve([50, 36], [62, 34], [74, 30]), width: VEIN },
      { d: curve([50, 58], [64, 56], [77, 53]), width: VEIN },
      { d: curve([50, 42], [38, 40], [26, 34]), width: VEIN },
      { d: curve([50, 63], [37, 61], [24, 57]), width: VEIN },
    ],
  }
}

function birch(): LeafShape {
  // Paper birch: oval-triangular, widest low down, drawn-out tip, soft double teeth.
  const body = teeth(ovate(27, 0.66, 0.9), 7, 0.06)
  return {
    blades: [{ d: smooth(pinnate(4, 76, body)) }],
    ink: [stemInto(22), ...pairs([[40, 13, 8], [53, 17, 8], [65, 16, 7]])],
  }
}

function aspen(): LeafShape {
  // Trembling aspen: nearly round, short point, fine rounded teeth, long leaf stalk.
  const body = teeth(ovate(30, 0.58, 0.55), 8, 0.035, 0.15, 0.9)
  return {
    blades: [{ d: smooth(pinnate(6, 66, body)) }],
    ink: [stemInto(20, 96, 3), ...pairs([[38, 16, 7], [50, 18, 6]])],
  }
}

function larch(): LeafShape {
  // Tamarack: a soft tuft of needles (they grow in bundles of 10–20) from a short spur.
  const spur: Pt = [50, 60]
  const needles: Stroke[] = Array.from({ length: 11 }, (_, i) => {
    const a = -90 + (i - 5) * 14
    const len = 42 - Math.abs(i - 5) * 2.4
    const tip = toward(spur, a, len)
    const mid: Pt = [(spur[0] + tip[0]) / 2 + (i - 5) * 0.8, (spur[1] + tip[1]) / 2]
    return { d: curve(spur, mid, tip), width: 5.6 }
  })
  return {
    blades: [{ d: circle(50, 61, 6.5), tone: 'ink' }],
    needles,
    ink: [stemInto(62)],
  }
}

function ash(): LeafShape {
  // White ash: compound, usually seven leaflets in pairs plus one at the tip.
  const blades = [{ d: smooth(leaflet([50, 28], -90, 24, 9)) }]
  for (const [y, len, angle] of [
    [32, 24, -22],
    [51, 24, -18],
    [70, 21, -14],
  ] as [number, number, number][]) {
    blades.push({ d: smooth(leaflet([50, y], angle, len, 8)) }, { d: smooth(leaflet([50, y], -180 - angle, len, 8)) })
  }
  return { blades, ink: [stemInto(12)] }
}

function beech(): LeafShape {
  // American beech: elliptical, many straight parallel veins each ending in a small tooth.
  const veinRows = 5
  const body = (t: number) =>
    ovate(22, 0.5, 0.8)(t) * (1 - (t > 0.14 && t < 0.86 ? 0.05 * (0.5 - 0.5 * Math.cos((2 * Math.PI * veinRows * (t - 0.14)) / 0.72)) : 0))
  const rows: [number, number, number][] = Array.from({ length: veinRows }, (_, k) => {
    const t = 0.24 + (k / (veinRows - 1)) * 0.56
    return [5 + t * 72 + 7, ovate(22, 0.5, 0.8)(t) * 0.78, 9]
  })
  return {
    blades: [{ d: smooth(pinnate(5, 77, body)) }],
    ink: [stemInto(16), ...pairs(rows, VEIN - 0.8)],
  }
}

function hickory(): LeafShape {
  // Shagbark hickory: compound, almost always five leaflets; the top three are largest.
  // Leaflets are widest toward their tips and start just off the stalk, so each reads separately.
  const off = (y: number, a: number, d = 3.5) => toward([50, y], a, d)
  return {
    blades: [
      { d: smooth(leaflet([50, 40], -90, 36, 10, 0.45)) },
      { d: smooth(leaflet(off(48, -38), -38, 32, 9, 0.42)) },
      { d: smooth(leaflet(off(48, -142), -142, 32, 9, 0.42)) },
      { d: smooth(leaflet(off(68, -24), -24, 22, 7, 0.42)) },
      { d: smooth(leaflet(off(68, -156), -156, 22, 7, 0.42)) },
    ],
    ink: [stemInto(18)],
  }
}

function basswood(): LeafShape {
  // American basswood (elms & basswoods): heart-shaped, lopsided base, short tip.
  const c: Pt = [50, 46]
  const lobes: Lobe[] = [
    { at: -90, len: 21, width: 26 },
    { at: -25, len: 13, width: 42 },
    { at: -155, len: 11, width: 42 },
    { at: 40, len: 10, width: 30 },
    { at: 145, len: 12, width: 30 },
  ]
  return {
    blades: [{ d: smooth(palmate(c, 21, lobes, 10)) }],
    ink: [stemInto(20), { d: curve([50, 60], [58, 52], [68, 38]), width: VEIN }, { d: curve([50, 60], [42, 52], [32, 38]), width: VEIN }],
  }
}

function cherries(): LeafShape {
  // Black cherry: dark fruit on long stalks, with an oval leaf turning red-orange.
  return {
    blades: [
      { d: smooth(leaflet([55, 18], -24, 32, 11)) },
      { d: circle(31, 75, 16), tone: 'accent' },
      { d: circle(69, 79, 16), tone: 'accent' },
    ],
    ink: [
      { d: curve([33, 60], [36, 32], [55, 17]), width: 5 },
      { d: curve([67, 64], [64, 34], [55, 17]), width: 5 },
      { d: line([[58, 15], [75, 7]]), width: 3.6 },
    ],
  }
}

function alder(): LeafShape {
  // Speckled alder: egg-shaped with a short pointed tip, shallow double teeth.
  const body = teeth(ovate(27, 0.44, 0.7), 8, 0.05, 0.14, 0.84)
  return {
    blades: [{ d: smooth(pinnate(5, 74, body)) }],
    ink: [stemInto(18), ...pairs([[36, 16, 8], [49, 19, 8], [61, 17, 7]])],
  }
}

function ginkgo(): LeafShape {
  // Ginkgo: a fan with a notch at the top (biloba = two lobes), narrowing to the stalk.
  const hub: Pt = [50, 70]
  const spread = 52
  const outer: Pt[] = []
  for (let i = 0; i <= 60; i++) {
    const d = -spread + (i / 60) * 2 * spread
    const notch = 12 * Math.exp(-((d / 6) ** 2))
    const r = 52 - notch - 8 * (Math.abs(d) / spread) ** 3
    outer.push([hub[0] + Math.sin(rad(d)) * r, hub[1] - Math.cos(rad(d)) * r])
  }
  const sideIn = (from: Pt, s: 1 | -1): Pt[] =>
    [0.3, 0.6, 0.85].map((k) => [hub[0] + (from[0] - hub[0]) * (1 - k) + s * 3 * Math.sin(Math.PI * k), hub[1] + (from[1] - hub[1]) * (1 - k)])
  const pts: Pt[] = [...outer, ...sideIn(outer[outer.length - 1], -1), [51.5, 71], [48.5, 71], ...sideIn(outer[0], 1).reverse()]
  return {
    blades: [{ d: smooth(soften(pts, 1, 0.2)) }],
    ink: [stemInto(66, 96, 3)],
  }
}

function sumac(): LeafShape {
  // Staghorn sumac (sumacs, shrubs & vines): compound, many slim lance-shaped leaflets.
  const blades = [{ d: smooth(leaflet([50, 22], -90, 20, 6.5, 0.45)) }]
  for (const y of [27, 41, 55, 69]) {
    blades.push({ d: smooth(leaflet([50, y], -24, 24, 6.2, 0.45)) }, { d: smooth(leaflet([50, y], -156, 24, 6.2, 0.45)) })
  }
  return { blades, ink: [stemInto(10)] }
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
  shrubs: sumac(),
}

/** Each group's fall colour (leaf) and, for fruit, a second colour. */
export const LEAF_COLOURS: Record<TreeIconId, { leaf: string; accent?: string }> = {
  maples: { leaf: '#e2602a' }, // sugar maple: yellow, burnt orange and red together
  oaks: { leaf: '#9c3a22' }, // red oak: dark red to russet
  birches: { leaf: '#f2c230' }, // paper birch: bright yellow
  aspens: { leaf: '#f0a92a' }, // trembling aspen: gold
  larches: { leaf: '#d99a2b' }, // tamarack: bright gold
  ashes: { leaf: '#7e2f5d' }, // white ash: purple to maroon
  beeches: { leaf: '#b8772f' }, // American beech: golden bronze
  hickories: { leaf: '#d4a21f' }, // shagbark hickory: golden yellow
  elms: { leaf: '#e3b43a' }, // basswood: deep yellow with orange hints
  cherries: { leaf: '#e05a2b', accent: '#a11d2b' }, // black cherry: red-orange leaves, dark fruit
  alders: { leaf: '#86893f' }, // speckled alder: stays dull green to brown
  'other-trees': { leaf: '#f4c21b' }, // ginkgo: golden yellow
  shrubs: { leaf: '#d42a1f' }, // staghorn sumac: brilliant scarlet
}
