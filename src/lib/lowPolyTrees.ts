import type { Feature, MultiPolygon, Point, Polygon } from 'geojson'

// Low-poly trees for the isometric forest covers: one tiny glTF model per tree color, generated
// here (no files to download), instanced by Mapbox's model layer. Trees are planted on a
// deterministic jittered grid, kept to forest and parkland and out of water.

type Vec3 = [number, number, number]

class Mesh {
  positions: number[] = []
  normals: number[] = []
  /** Flat-shaded triangle, wound to face away from `center`. */
  tri(a: Vec3, b: Vec3, c: Vec3, center: Vec3) {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
    const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
    let n: Vec3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
    const m = [0, 1, 2].map((k) => (a[k] + b[k] + c[k]) / 3 - center[k])
    if (n[0] * m[0] + n[1] * m[1] + n[2] * m[2] < 0) {
      ;[b, c] = [c, b]
      n = [-n[0], -n[1], -n[2]]
    }
    const len = Math.hypot(...n) || 1
    for (const p of [a, b, c]) {
      this.positions.push(...p)
      this.normals.push(n[0] / len, n[1] / len, n[2] / len)
    }
  }
}

const ring = (r: number, y: number, sides: number, turn = 0): Vec3[] =>
  Array.from({ length: sides }, (_, i) => {
    const t = turn + (i / sides) * Math.PI * 2
    return [Math.cos(t) * r, y, Math.sin(t) * r]
  })

function trunk(m: Mesh, r: number, y0: number, y1: number) {
  const a = ring(r, y0, 6)
  const b = ring(r * 0.8, y1, 6)
  const c: Vec3 = [0, (y0 + y1) / 2, 0]
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6
    m.tri(a[i], a[j], b[j], c)
    m.tri(a[i], b[j], b[i], c)
  }
}

function cone(m: Mesh, r: number, y0: number, y1: number, turn = 0) {
  const a = ring(r, y0, 7, turn)
  const apex: Vec3 = [0, y1, 0]
  const base: Vec3 = [0, y0, 0]
  for (let i = 0; i < 7; i++) {
    const j = (i + 1) % 7
    m.tri(a[i], a[j], apex, [0, y0 + (y1 - y0) / 3, 0])
    m.tri(a[j], a[i], base, [0, y0 + 1, 0])
  }
}

/** An icosahedron with jittered vertices: the classic low-poly crown. */
function crown(m: Mesh, r: number, cy: number, squash: number, seed: number) {
  const t = (1 + Math.sqrt(5)) / 2
  const V: Vec3[] = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]]
  const F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]]
  let s = seed
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647
  const P = V.map(([x, y, z]): Vec3 => {
    const k = (r / Math.hypot(x, y, z)) * (0.88 + rnd() * 0.24)
    return [x * k, y * k * squash + cy, z * k]
  })
  for (const [a, b, c] of F) m.tri(P[a], P[b], P[c], [0, cy, 0])
}

const linear = (hex: string) =>
  [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })

/** A glTF binary with one primitive per part, each in its own flat color. */
function glb(parts: { mesh: Mesh; color: string }[]): string {
  const chunks: ArrayBufferView[] = []
  const accessors: object[] = []
  const views: object[] = []
  const primitives: object[] = []
  const materials: object[] = []
  let offset = 0
  const push = (arr: ArrayBufferView, target: number) => {
    views.push({ buffer: 0, byteOffset: offset, byteLength: arr.byteLength, target })
    chunks.push(arr)
    offset += arr.byteLength
    return views.length - 1
  }
  parts.forEach(({ mesh, color }, i) => {
    const pos = new Float32Array(mesh.positions)
    const count = pos.length / 3
    const min = [Infinity, Infinity, Infinity]
    const max = [-Infinity, -Infinity, -Infinity]
    for (let k = 0; k < pos.length; k += 3)
      for (let d = 0; d < 3; d++) {
        min[d] = Math.min(min[d], pos[k + d])
        max[d] = Math.max(max[d], pos[k + d])
      }
    // Mapbox's loader wants indexed primitives; padded to an even length to keep 4-byte alignment.
    const index = new Uint16Array(count + (count % 2)).map((_, k) => Math.min(k, count - 1))
    accessors.push({ bufferView: push(pos, 34962), componentType: 5126, count, type: 'VEC3', min, max })
    accessors.push({ bufferView: push(new Float32Array(mesh.normals), 34962), componentType: 5126, count, type: 'VEC3' })
    accessors.push({ bufferView: push(index, 34963), componentType: 5123, count, type: 'SCALAR' })
    materials.push({ pbrMetallicRoughness: { baseColorFactor: [...linear(color), 1], metallicFactor: 0, roughnessFactor: 1 } })
    primitives.push({ attributes: { POSITION: accessors.length - 3, NORMAL: accessors.length - 2 }, indices: accessors.length - 1, material: i })
  })
  const json = new TextEncoder().encode(
    JSON.stringify({ asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }], meshes: [{ primitives }], materials, accessors, bufferViews: views, buffers: [{ byteLength: offset }] }),
  )
  const jsonChunk = new Uint8Array(Math.ceil(json.length / 4) * 4).fill(0x20)
  jsonChunk.set(json)
  const total = 12 + 8 + jsonChunk.length + 8 + offset
  const out = new Uint8Array(total)
  const dv = new DataView(out.buffer)
  dv.setUint32(0, 0x46546c67, true) // "glTF"
  dv.setUint32(4, 2, true)
  dv.setUint32(8, total, true)
  dv.setUint32(12, jsonChunk.length, true)
  dv.setUint32(16, 0x4e4f534a, true) // "JSON"
  out.set(jsonChunk, 20)
  let o = 20 + jsonChunk.length
  dv.setUint32(o, offset, true)
  dv.setUint32(o + 4, 0x004e4942, true) // "BIN"
  o += 8
  for (const c of chunks) {
    out.set(new Uint8Array(c.buffer, c.byteOffset, c.byteLength), o)
    o += c.byteLength
  }
  return URL.createObjectURL(new Blob([out], { type: 'model/gltf-binary' }))
}

/** An axis-aligned box centred at (cx, cy, cz), `w` × `h` × `d`. */
function box(m: Mesh, [cx, cy, cz]: Vec3, [w, h, d]: Vec3) {
  const x = [cx - w / 2, cx + w / 2]
  const y = [cy - h / 2, cy + h / 2]
  const z = [cz - d / 2, cz + d / 2]
  const v = (i: number, j: number, k: number): Vec3 => [x[i], y[j], z[k]]
  const faces = [
    [v(0, 0, 0), v(1, 0, 0), v(1, 1, 0), v(0, 1, 0)],
    [v(0, 0, 1), v(1, 0, 1), v(1, 1, 1), v(0, 1, 1)],
    [v(0, 0, 0), v(0, 1, 0), v(0, 1, 1), v(0, 0, 1)],
    [v(1, 0, 0), v(1, 1, 0), v(1, 1, 1), v(1, 0, 1)],
    [v(0, 0, 0), v(1, 0, 0), v(1, 0, 1), v(0, 0, 1)],
    [v(0, 1, 0), v(1, 1, 0), v(1, 1, 1), v(0, 1, 1)],
  ]
  for (const [a, b, c, e] of faces) {
    m.tri(a, b, c, [cx, cy, cz])
    m.tri(a, c, e, [cx, cy, cz])
  }
}

/** A simplified maple leaf (the flag's), on both faces of the flag at depth z ± `t`. */
function mapleLeaf(m: Mesh, [cx, cy]: [number, number], size: number, z: number, t: number) {
  const outline: [number, number][] = [
    [0, 1], [0.18, 0.62], [0.42, 0.75], [0.36, 0.32], [0.8, 0.5], [0.7, 0.22], [0.95, 0.12], [0.5, -0.25], [0.55, -0.45], [0.06, -0.38], [0.06, -0.8],
    [-0.06, -0.8], [-0.06, -0.38], [-0.55, -0.45], [-0.5, -0.25], [-0.95, 0.12], [-0.7, 0.22], [-0.8, 0.5], [-0.36, 0.32], [-0.42, 0.75], [-0.18, 0.62],
  ]
  const hub: [number, number] = [cx, cy + 0.1 * size]
  for (const side of [1, -1]) {
    const zz = z + side * t
    for (let i = 0; i < outline.length; i++) {
      const [ax, ay] = outline[i]
      const [bx, by] = outline[(i + 1) % outline.length]
      m.tri([hub[0], hub[1], zz], [cx + ax * size, cy + ay * size, zz], [cx + bx * size, cy + by * size, zz], [hub[0], hub[1], zz - side])
    }
  }
}

/** How many summit shapes there are; a peak picks one by its id. */
export const SUMMITS = 4

/**
 * Rock summits with snowcaps for peaks, 1 unit in base radius (the cover scales one to fit the top
 * terrace). Each is a stack of rough rings narrowing to a blunt top: a rounded dome, a leaning
 * crag, twin summits and a broad shoulder, so peaks don't all look alike.
 */
let summits: Record<string, string> | undefined
export function summitModels(): Record<string, string> {
  if (summits) return summits
  summits = {}
  /** One rough cone: rings of [height, radius], leaning by `lean` per unit of height, around (ox, oz). */
  const mound = (rock: Mesh, snow: Mesh, rings: [number, number][], snowFrom: number, seed: number, lean: [number, number], [ox, oz]: [number, number], size: number) => {
    let h = seed
    const rnd = () => (h = (h * 16807) % 2147483647) / 2147483647
    const sides = 8
    const levels = rings.map(([y, radius]) =>
      Array.from({ length: sides }, (_, i): Vec3 => {
        const t = (i / sides) * Math.PI * 2
        const k = radius * (0.84 + rnd() * 0.32) * size
        return [ox + Math.cos(t) * k + lean[0] * y * size, y * size * (0.96 + rnd() * 0.08), oz + Math.sin(t) * k + lean[1] * y * size]
      }),
    )
    const top = rings[rings.length - 1][0]
    const core: Vec3 = [ox + lean[0] * top * size * 0.5, top * size * 0.45, oz + lean[1] * top * size * 0.5]
    const cap: Vec3 = [ox + lean[0] * top * size, top * size * 1.04, oz + lean[1] * top * size]
    for (let level = 0; level < levels.length; level++) {
      const mesh = level >= snowFrom ? snow : rock
      for (let i = 0; i < sides; i++) {
        const j = (i + 1) % sides
        const a = levels[level]
        if (level === levels.length - 1) mesh.tri(a[i], a[j], cap, core)
        else {
          const b = levels[level + 1]
          mesh.tri(a[i], a[j], b[j], core)
          mesh.tri(a[i], b[j], b[i], core)
        }
      }
    }
  }
  const shapes: ((rock: Mesh, snow: Mesh) => void)[] = [
    // A rounded dome.
    (rock, snow) => mound(rock, snow, [[0, 1], [0.42, 0.74], [0.74, 0.44], [0.94, 0.2]], 2, 7, [0.04, 0.02], [0, 0], 1),
    // A leaning crag, steeper on one side.
    (rock, snow) => mound(rock, snow, [[0, 1], [0.5, 0.62], [0.92, 0.34], [1.2, 0.15]], 2, 131, [0.2, -0.08], [0, 0], 1),
    // Twin summits: a main top and a lower one beside it.
    (rock, snow) => {
      mound(rock, snow, [[0, 0.82], [0.46, 0.56], [0.86, 0.3], [1.08, 0.13]], 2, 59, [-0.06, 0.04], [-0.2, 0.05], 1)
      mound(rock, snow, [[0, 0.62], [0.44, 0.42], [0.8, 0.2]], 2, 977, [0.1, 0], [0.42, -0.12], 0.78)
    },
    // A broad shoulder stepping up to a small top.
    (rock, snow) => mound(rock, snow, [[0, 1], [0.3, 0.86], [0.5, 0.52], [0.84, 0.3], [1.0, 0.14]], 3, 401, [-0.12, 0.1], [0, 0], 1),
  ]
  shapes.forEach((shape, i) => {
    const rock = new Mesh()
    const snow = new Mesh()
    shape(rock, snow)
    summits![`summit-${i}`] = glb([{ mesh: rock, color: '#a39c90' }, { mesh: snow, color: '#f4f6f7' }])
  })
  return summits
}

let props: Record<string, string> | undefined
/**
 * Props for place covers, in the trees' low-poly style and scale: a boulder (creeks and rivers),
 * a summit cairn with a flag (peaks) and a wooden viewing deck (lookouts). Built once.
 */
export function propModels(): Record<string, string> {
  if (props) return props
  const boulder = new Mesh()
  crown(boulder, 2.6, 1.2, 0.62, 4242)
  const stones = new Mesh()
  crown(stones, 2.6, 1.6, 0.62, 11)
  crown(stones, 1.9, 3.7, 0.62, 23)
  crown(stones, 1.3, 5.3, 0.7, 37)
  const pole = new Mesh()
  box(pole, [0, 5.5, 0], [0.35, 11, 0.35])
  const flag = new Mesh()
  box(flag, [1.7, 9.6, 0], [3.4, 2, 0.15])
  // The deck is drawn larger than life, like the trees, so it reads as the place's landmark.
  const k = 1.7
  const posts = new Mesh()
  for (const [px, pz] of [[-5.4, -3.4], [5.4, -3.4], [-5.4, 3.4], [5.4, 3.4]]) box(posts, [px * k, 2.3 * k, pz * k], [0.7 * k, 4.6 * k, 0.7 * k])
  const deck = new Mesh()
  box(deck, [0, 4.8 * k, 0], [12 * k, 0.6 * k, 7.8 * k])
  const rails = new Mesh()
  for (const [px, pz] of [[-5.7, -3.7], [0, -3.7], [5.7, -3.7], [-5.7, 3.7], [0, 3.7], [5.7, 3.7], [-5.7, 0], [5.7, 0]]) box(rails, [px * k, 5.8 * k, pz * k], [0.3 * k, 1.6 * k, 0.3 * k])
  box(rails, [0, 6.5 * k, -3.7 * k], [11.7 * k, 0.3 * k, 0.3 * k])
  box(rails, [0, 6.5 * k, 3.7 * k], [11.7 * k, 0.3 * k, 0.3 * k])
  box(rails, [-5.7 * k, 6.5 * k, 0], [0.3 * k, 0.3 * k, 7.7 * k])
  box(rails, [5.7 * k, 6.5 * k, 0], [0.3 * k, 0.3 * k, 7.7 * k])
  // A flagpole on the front corner flying the Canadian flag: red, white, red, and a red maple leaf.
  const flagpole = new Mesh()
  const px = 5.7 * k
  const pz = 3.7 * k
  const deckTop = 5.1 * k
  box(flagpole, [px, deckTop + 8, pz], [0.45, 16, 0.45])
  const fw = 8.4
  const fh = fw / 2
  const fy = deckTop + 13.6
  const red = new Mesh()
  const white = new Mesh()
  // The cloth hangs in strips: it sags away from the pole and ripples more toward its free end.
  const STRIPS = 12
  const cloth = (u: number): Vec3 => [px + 0.3 + u * fw * 0.9, fy - fh * 0.3 * u * u, pz + Math.sin(u * Math.PI * 1.7) * fh * 0.22 * (0.25 + u)]
  for (let i = 0; i < STRIPS; i++) {
    const [a, b] = [cloth(i / STRIPS), cloth((i + 1) / STRIPS)]
    const mid = (i + 0.5) / STRIPS
    const mesh = mid < 0.25 || mid > 0.75 ? red : white
    const corner = (p: Vec3, up: number, side: number): Vec3 => [p[0], p[1] + (up * fh) / 2, p[2] + side * 0.07]
    for (const side of [1, -1]) {
      const behind: Vec3 = [(a[0] + b[0]) / 2, a[1], (a[2] + b[2]) / 2 - side]
      mesh.tri(corner(a, 1, side), corner(b, 1, side), corner(b, -1, side), behind)
      mesh.tri(corner(a, 1, side), corner(b, -1, side), corner(a, -1, side), behind)
    }
  }
  const [lx, ly, lz] = cloth(0.5)
  mapleLeaf(red, [lx, ly], fh * 0.36, lz, 0.16)
  props = {
    boulder: glb([{ mesh: boulder, color: '#9b968d' }]),
    cairn: glb([{ mesh: stones, color: '#a39e95' }, { mesh: pole, color: '#5a4334' }, { mesh: flag, color: '#c8102e' }]),
    deck: glb([
      { mesh: posts, color: '#7a5434' },
      { mesh: deck, color: '#a8784b' },
      { mesh: rails, color: '#8a5f3a' },
      { mesh: flagpole, color: '#d9d4cc' },
      { mesh: red, color: '#d52b1e' },
      { mesh: white, color: '#ffffff' },
    ]),
  }
  return props
}

/** Leaf colors: summer green, the three fall colors, and bare branches. */
export const CROWNS = { green: '#6f8f3a', yellow: '#e9b824', orange: '#e8730c', red: '#c8102e', bare: '#8b7d70' } as const
export type Hue = 'yellow' | 'orange' | 'red'

let models: Record<string, string> | undefined
/** Model ids → object URLs: a conifer and each deciduous color, in two sizes. Built once. */
export function treeModels(): Record<string, string> {
  if (models) return models
  models = {}
  for (const [sz, k] of [['s', 0.8], ['l', 1.15]] as const) {
    const conifer = new Mesh()
    const coniferTrunk = new Mesh()
    trunk(coniferTrunk, 0.45 * k, 0, 2.5 * k)
    cone(conifer, 3.3 * k, 1.8 * k, 8.5 * k)
    cone(conifer, 2.5 * k, 5 * k, 12 * k, 0.4)
    models[`conifer-${sz}`] = glb([{ mesh: coniferTrunk, color: '#4a3a2e' }, { mesh: conifer, color: '#2f5d3a' }])
    // High on a peak: the same conifer with snow resting on its boughs.
    const snow = new Mesh()
    cone(snow, 2.3 * k, 5.4 * k, 8.7 * k)
    cone(snow, 1.6 * k, 9.4 * k, 12.2 * k, 0.4)
    models[`snowy-${sz}`] = glb([{ mesh: coniferTrunk, color: '#4a3a2e' }, { mesh: conifer, color: '#2f5d3a' }, { mesh: snow, color: '#f3f6f8' }])
    for (const [hue, color] of Object.entries(CROWNS)) {
      const leaves = new Mesh()
      const stem = new Mesh()
      const bare = hue === 'bare'
      trunk(stem, 0.55 * k, 0, 5 * k)
      crown(leaves, (bare ? 2.6 : 3.8) * k, 7.2 * k, bare ? 1.15 : 0.95, hue.length * 977 + (sz === 's' ? 13 : 71))
      models[`dec-${hue}-${sz}`] = glb([{ mesh: stem, color: '#5a4334' }, { mesh: leaves, color }])
    }
  }
  return models
}

/** How a forest looks right now: shares of deciduous trees still green and already bare, the fall hues, and conifers. */
export type Foliage = { green: number; bare: number; hues: Record<Hue, number>; conifer: number }

/** `model-id` for a foliage mix: each tree's fixed random numbers pick its model. */
export function modelExpression(f: Foliage) {
  const total = f.hues.red + f.hues.orange + f.hues.yellow || 1
  const red = f.hues.red / total
  const orange = red + f.hues.orange / total
  return [
    'concat',
    [
      'case',
      ['==', ['get', 'snow'], true], 'snowy',
      ['<', ['get', 'c'], f.conifer], 'conifer',
      ['<', ['get', 'r'], f.green], 'dec-green',
      ['>', ['get', 'r'], 1 - f.bare], 'dec-bare',
      ['<', ['get', 'q'], red], 'dec-red',
      ['<', ['get', 'q'], orange], 'dec-orange',
      'dec-yellow',
    ],
    '-',
    ['get', 'sz'],
  ]
}

function hash(i: number, j: number, k: number) {
  let x = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(k, 2246822519)
  x = Math.imul(x ^ (x >>> 13), 1274126177)
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296
}

type Area = { rings: number[][][]; bb: [number, number, number, number] }

function areas(features: { geometry: unknown }[]): Area[] {
  const out: Area[] = []
  for (const f of features) {
    const g = f.geometry as Polygon | MultiPolygon
    const list = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []
    for (const rings of list) {
      let [w, s, e, n] = [180, 90, -180, -90]
      for (const [x, y] of rings[0]) {
        w = Math.min(w, x)
        e = Math.max(e, x)
        s = Math.min(s, y)
        n = Math.max(n, y)
      }
      out.push({ rings, bb: [w, s, e, n] })
    }
  }
  return out
}

function inside([x, y]: number[], a: Area) {
  if (x < a.bb[0] || x > a.bb[2] || y < a.bb[1] || y > a.bb[3]) return false
  let c = false
  for (const r of a.rings)
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i]
      const [xj, yj] = r[j]
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
    }
  return c
}

export type TreePoint = Feature<Point, { c: number; r: number; q: number; sz: 's' | 'l' }>

/**
 * Trees on a jittered grid `spacing` metres apart inside `bounds` [w, s, e, n]: in `forest`
 * polygons and never in `water`. The same place always gets the same trees.
 */
export function plantTrees(bounds: [number, number, number, number], spacing: number, forest: { geometry: unknown }[], water: { geometry: unknown }[]): TreePoint[] {
  const [w, s, e, n] = bounds
  const lat = (s + n) / 2
  const dLat = spacing / 111320
  const dLng = spacing / (111320 * Math.cos((lat * Math.PI) / 180))
  const wood = areas(forest)
  const lakes = areas(water)
  const k = Math.round(spacing)
  const trees: TreePoint[] = []
  for (let i = Math.floor(w / dLng); i <= Math.ceil(e / dLng); i++)
    for (let j = Math.floor(s / dLat); j <= Math.ceil(n / dLat); j++) {
      const pt = [(i + hash(i, j, k)) * dLng, (j + hash(j, i, k + 1)) * dLat]
      if (!wood.some((a) => inside(pt, a)) || lakes.some((a) => inside(pt, a))) continue
      trees.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: pt },
        properties: { c: hash(i, j, 3), r: hash(i, j, 7), q: hash(i, j, 11), sz: hash(i, j, 5) < 0.5 ? 's' : 'l' },
      })
    }
  return trees
}
