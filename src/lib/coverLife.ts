// Small life on a live cover (lib/liveCover): a few white gulls that cross overhead, a canoe on
// open water, a deer in a clearing, and trees that lean when the land is turned. All in the
// covers' own low-poly style, generated here like the trees. Loaded only when a cover comes alive.

import type { Position } from 'geojson'
import type { ExpressionSpecification, Map as MapboxMap } from 'mapbox-gl'
import { bboxOf, insideRing, metresToDeg, type Ring } from './diorama'
import type { Scenery } from './forestCover'
import { box, crown, glb, Mesh, type Vec3 } from './lowPolyTrees'
import { COLORS } from './placeScenes'

const TREE_TIERS = 4
const DEG_M = 1 / metresToDeg(1)

let models: Record<string, string> | undefined
function lifeModels() {
  if (models) return models
  // A white gull flying toward +x: a spindle of a body, a short neck and head, a yellow bill, and
  // two-part wings with dark tips, drawn on both sides. `beat` is the wingtip's height.
  const gull = (beat: number) => {
    const body = new Mesh()
    const dark = new Mesh()
    const pale = new Mesh()
    const wings = new Mesh()
    const bill = new Mesh()
    for (const [bx, bz] of [[0, 0]]) {
      const at = (x: number, y: number, z: number): Vec3 => [bx + x, y, bz + z]
      // Body: a five-sided spindle from chest to tail.
      const hoop = [0, 1, 2, 3, 4].map((i) => at(0.1, Math.sin((i / 5) * Math.PI * 2) * 0.5, Math.cos((i / 5) * Math.PI * 2) * 0.62))
      for (let i = 0; i < 5; i++) {
        body.tri(hoop[i], hoop[(i + 1) % 5], at(-2.3, 0.12, 0), at(0, 0, 0))
        pale.tri(hoop[i], hoop[(i + 1) % 5], at(1.5, 0.05, 0), at(0, 0, 0))
      }
      box(pale, at(1.75, 0.2, 0), [0.9, 0.42, 0.42])
      box(pale, at(2.3, 0.3, 0), [0.6, 0.5, 0.48])
      box(bill, at(2.85, 0.24, 0), [0.55, 0.16, 0.18])
      for (const side of [1, -1]) {
        const a = at(0.9, 0.3, side * 0.45)
        const b = at(-0.9, 0.3, side * 0.45)
        const c = at(0.5, 0.3 + beat * 0.45, side * 2.3)
        const d = at(-1, 0.3 + beat * 0.45, side * 2.2)
        const e = at(-0.9, 0.3 + beat, side * 4.1)
        for (const [mesh, p, q, r] of [[wings, a, b, d], [wings, a, d, c], [dark, c, d, e]] as const) {
          mesh.tri(p, q, r, at(0, -9, 0))
          mesh.tri(p, q, r, at(0, 9, 0))
        }
      }
    }
    return glb([{ mesh: body, color: '#f1eee8' }, { mesh: pale, color: '#ffffff' }, { mesh: wings, color: '#dcd8d0' }, { mesh: dark, color: '#3a3531' }, { mesh: bill, color: '#e9b824' }])
  }

  // A canoe pointing toward +x, with one paddler.
  const hull = new Mesh()
  box(hull, [0, 0.55, 0], [6.4, 1.1, 2])
  for (const end of [1, -1]) {
    const tip: Vec3 = [end * 5.2, 1.25, 0]
    const corners: Vec3[] = [[end * 3.2, 0, 1], [end * 3.2, 0, -1], [end * 3.2, 1.1, -1], [end * 3.2, 1.1, 1]]
    for (let i = 0; i < 4; i++) hull.tri(corners[i], corners[(i + 1) % 4], tip, [end * 3.2, 0.55, 0])
  }
  const paddler = new Mesh()
  box(paddler, [-0.6, 1.9, 0], [1, 1.9, 1.1])
  const head = new Mesh()
  crown(head, 0.62, 3.4, 1, 7)
  const paddle = new Mesh()
  box(paddle, [0.3, 1.7, 1.25], [0.2, 3, 0.2])
  box(paddle, [0.3, 0.3, 1.25], [0.25, 0.9, 0.6])

  // A white-tailed buck facing +x.
  const coat = new Mesh()
  box(coat, [0, 3.7, 0], [4.6, 1.9, 1.6])
  box(coat, [2.5, 5.1, 0], [0.95, 2.3, 0.95])
  box(coat, [3.3, 6.3, 0], [1.8, 0.95, 0.95])
  const dark = new Mesh()
  for (const [lx, lz] of [[1.7, 0.5], [1.7, -0.5], [-1.7, 0.5], [-1.7, -0.5]]) box(dark, [lx, 1.4, lz], [0.45, 2.8, 0.45])
  for (const side of [0.42, -0.42]) {
    box(dark, [2.8, 7.5, side], [0.2, 1.6, 0.2])
    box(dark, [3.2, 7.8, side * 1.4], [0.9, 0.2, 0.2])
  }
  const tail = new Mesh()
  box(tail, [-2.45, 4.3, 0], [0.4, 0.7, 0.6])

  models = {
    // The map draws one copy of a model however many layers ask for it, so each of the five birds
    // gets its own copies of the three wing positions.
    ...Object.fromEntries([2.6, 0.4, -2].flatMap((beat, k) => [0, 1, 2, 3, 4].map((bird) => [`life-gull-${bird}-${k}`, gull(beat)]))),
    'life-canoe': glb([{ mesh: hull, color: '#c8102e' }, { mesh: paddler, color: '#3f5a4a' }, { mesh: head, color: '#e8c9a0' }, { mesh: paddle, color: COLORS.wood }]),
    'life-deer': glb([{ mesh: coat, color: COLORS.wood }, { mesh: dark, color: '#7a5434' }, { mesh: tail, color: '#f3efe6' }]),
  }
  return models
}

const withModels = new WeakSet<MapboxMap>()

/** The point inside `outer` (and outside `holes`) farthest from every point in `avoid`, on a coarse grid. */
function roomiest(outer: Ring, holes: Ring[], avoid: Position[], inset: number): { at: Position; room: number } | undefined {
  const [w, s, e, n] = bboxOf([outer])
  const inside = (p: Position) => insideRing(p, outer) && !holes.some((h) => insideRing(p, h))
  let best: { at: Position; room: number } | undefined
  const N = 22
  for (let i = 1; i < N; i++)
    for (let j = 1; j < N; j++) {
      const p: Position = [w + ((e - w) * i) / N, s + ((n - s) * j) / N]
      if (!inside(p) || ![[inset, 0], [-inset, 0], [0, inset], [0, -inset]].every(([dx, dy]) => inside([p[0] + dx, p[1] + dy]))) continue
      let room = Infinity
      for (const a of avoid) room = Math.min(room, Math.hypot(a[0] - p[0], a[1] - p[1]))
      if (!best || room > best.room) best = { at: p, room }
    }
  return best
}

const ringArea = (r: Ring) => {
  let a = 0
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1])
  return Math.abs(a / 2)
}

export type Life = {
  /**
   * Advance by `dt` ms. `lean` tilts the trees, in degrees. While `fresh`, a new flock sets out
   * after each one leaves; otherwise the one in the air finishes its pass and no more follow.
   */
  frame: (dt: number, fresh: boolean, lean: number) => void
  /** True while a flock is crossing. */
  busy: () => boolean
  /** Something touched the land: the birds hurry on for a moment. */
  startle: () => void
  remove: () => void
}

/**
 * Adds the animals to a staged scene. Nothing here outlives `remove`. When `calm` (reduced
 * motion), the deer and canoe are there but nothing moves and no birds fly.
 */
export function addLife(stage: Scenery, calm: boolean): Life {
  const { map, scene, scale } = stage
  if (!withModels.has(map)) {
    for (const [id, url] of Object.entries(lifeModels())) map.addModel(id, url)
    withModels.add(map)
  }
  const [w, s, e, n] = bboxOf(scene.land)
  const middle: Position = [(w + e) / 2, (s + n) / 2]
  const top = Math.max(...scene.tiers)

  const layers: string[] = []
  const sources: string[] = []
  const add = (id: string, at: Position, model: string, k: number, layer = model) => {
    if (!sources.includes(`life-${id}`)) {
      map.addSource(`life-${id}`, { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Point', coordinates: at }, properties: {} } })
      sources.push(`life-${id}`)
    }
    map.addLayer({ id: layer, type: 'model', source: `life-${id}`, layout: { 'model-id': model }, paint: { 'model-scale': [k, k, k], 'model-cast-shadows': true, 'model-receive-shadows': true } })
    // Moved every frame: the map's usual 300 ms easing between values would leave each animal
    // trailing behind itself, and a wing position gone before it had arrived.
    for (const name of ['model-translation-transition', 'model-rotation-transition', 'model-opacity-transition', 'model-scale-transition']) map.setPaintProperty(layer, name as never, { duration: 0, delay: 0 } as never)
    layers.push(layer)
  }
  const move = (layer: string, east: number, north: number, up: number, heading: number) => {
    // The model layer counts its second axis southward.
    map.setPaintProperty(layer, 'model-translation', [east, -north, up])
    map.setPaintProperty(layer, 'model-rotation', [0, 0, heading])
  }

  // The birds cross above the treetops. Each bird has one layer per wing position, shown in turn.
  const BEATS = [0, 1, 2, 1]
  /** Places in the V, in the bird's own lengths: ahead of the leader, and to its right. */
  const SLOTS = [[0, 0], [-4.2, 3.1], [-4.4, -3], [-8.5, 6.3], [-8.8, -5.9]]
  const BIRD = scale * 0.85
  const wing = (bird: number, beat: number) => `life-bird-${bird}-${beat}`
  for (let bird = 0; bird < SLOTS.length; bird++) for (let beat = 0; beat < 3; beat++) add(`bird-${bird}`, middle, `life-gull-${bird}-${beat}`, BIRD, wing(bird, beat))
  // Each pass comes in from out of view, curves across the land and leaves; then, after a pause,
  // another comes from somewhere else, three to five birds at a time. Distances in metres from the
  // middle of the land. Now and then the last bird falls behind and has to hurry to catch up.
  type Pass = { from: Position; via: Position; to: Position; ms: number; up: number; begun: number; birds: number; straggler: boolean; phase: number[] }
  const reach = Math.max(e - w, n - s) * DEG_M
  const newPass = (now: number, wait: number): Pass => {
    const a = Math.random() * Math.PI * 2
    const b = a + Math.PI + (Math.random() - 0.5) * 1.7
    const bend = (Math.random() - 0.5) * reach * 0.9
    const out = reach * 1.05
    return {
      from: [Math.cos(a) * out, Math.sin(a) * out],
      via: [Math.cos(a + Math.PI / 2) * bend, Math.sin(a + Math.PI / 2) * bend],
      to: [Math.cos(b) * out, Math.sin(b) * out],
      ms: 9000 + Math.random() * 4000,
      up: top + scale * (16 + Math.random() * 9),
      begun: now + wait,
      birds: 3 + Math.floor(Math.random() * 3),
      straggler: Math.random() < 0.4,
      phase: SLOTS.map(() => Math.random() * 4),
    }
  }
  /**
   * How far (in bird lengths) the straggler trails its place at `t` of the pass: it drifts back
   * over the first stretch, then sprints, overshoots its place a little and drops back into it.
   */
  const lag = (t: number) => {
    const drift = Math.max(0, Math.min(1, (t - 0.12) / 0.3))
    const sprint = Math.max(0, Math.min(1, (t - 0.44) / 0.2))
    const back = 1 + 2.4 * (sprint - 1) ** 3 + 1.4 * (sprint - 1) ** 2
    return 13 * drift * drift * (3 - 2 * drift) * (1 - back)
  }
  let pass: Pass | undefined
  let flockShown = false

  // A canoe on the largest stretch of open water, if there is room to paddle.
  const lakes = scene.solids.filter((x) => x.color === COLORS.water).sort((a, b) => ringArea(b.polygon[0]) - ringArea(a.polygon[0]))
  const lake = lakes[0]
  const open = lake && roomiest(lake.polygon[0], lake.polygon.slice(1), lake.polygon.flat(), 0)
  // Not on a waterfall's pool, and only where the canoe has a few lengths of water around it.
  const CANOE = 0.6
  const half = 5.2 * scale * CANOE
  const paddleM = open ? (open.room * DEG_M - half) * 0.6 : 0
  const canoe = open && scene.tiers.length === 1 && paddleM > half * 0.5 ? { r: paddleM, up: lake.top } : undefined
  // The deer and the canoe are set down into the scene as it comes alive, one after the other:
  // each drops in from a little above, growing from nothing, overshoots its size and settles.
  type Arrival = { layer: string; k: number; at: number; place: (drop: number) => void; done?: boolean }
  const arrivals: Arrival[] = []
  const ARRIVE_MS = 520
  const arrive = (a: Arrival, now: number) => {
    const u = Math.max(0, Math.min(1, (now - a.at) / ARRIVE_MS))
    // Back-out easing: past full size at about two thirds of the way, then back to it.
    const size = u ? a.k * (1 + 2.70158 * (u - 1) ** 3 + 1.70158 * (u - 1) ** 2) : a.k * 0.001
    map.setPaintProperty(a.layer, 'model-scale', [size, size, size])
    a.place((1 - u) ** 2 * 14 * scale)
    a.done = u >= 1
  }

  let canoeDrop = 0
  const paddle = (t: number) => {
    if (canoe) move('life-canoe', Math.cos(t) * canoe.r, Math.sin(t) * canoe.r * 0.7, canoe.up + 0.5 + canoeDrop, (-Math.atan2(Math.cos(t) * 0.7, -Math.sin(t)) * 180) / Math.PI)
  }
  if (canoe) {
    add('canoe', open!.at, 'life-canoe', scale * CANOE)
    arrivals.push({ layer: 'life-canoe', k: scale * CANOE, at: 480, place: (drop) => (canoeDrop = drop) })
  }
  paddle(0)

  // A deer in the widest gap between the trees (often beside the trail), off the water.
  const ground = scene.grow.filter((g) => g.tier === 0).sort((a, b) => ringArea(b.ring) - ringArea(a.ring))[0]
  const gap =
    ground &&
    roomiest(
      ground.ring,
      lakes.map((l) => l.polygon[0]),
      [...stage.trees.map((t) => t.geometry.coordinates), ...lakes.flatMap((l) => l.polygon[0])],
      metresToDeg(6 * scale),
    )
  if (gap) {
    add('deer', gap.at, 'life-deer', scale)
    // Side-on to the middle of the land.
    const facing = (Math.atan2(gap.at[1] - middle[1], gap.at[0] - middle[0]) * 180) / Math.PI + 90
    const stand = (drop: number) => move('life-deer', 0, 0, scene.tiers[0] + drop, facing)
    stand(0)
    arrivals.push({ layer: 'life-deer', k: scale, at: 220, place: stand })
  }
  // With reduced motion they are simply there.
  if (!calm) for (const a of arrivals) arrive(a, 0)

  let leaning = 0
  let startled = 0
  /** Time the animals have been moving, in ms: it stands still while the cover sleeps. */
  let now = 0
  let flying = false
  const tilt = (deg: number) =>
    ['match', ['get', 'rot'], ...[1, 2, 3, 4, 5, 6, 7].flatMap((k) => [k, ['literal', [k % 2 ? deg : -deg * 0.7, k % 3 ? 0 : deg * 0.5, k * 45]]]), ['literal', [-deg * 0.7, deg * 0.5, 0]]] as ExpressionSpecification
  const leanTrees = (deg: number) => {
    if (Math.abs(deg - leaning) < 0.04) return
    leaning = deg
    for (let tier = 0; tier < TREE_TIERS; tier++) for (const id of [`trees-${tier}`, `trees-faded-${tier}`]) map.setPaintProperty(id, 'model-rotation', tilt(deg))
  }

  // Until the first flock sets out, every bird waits below the land.
  for (let bird = 0; bird < SLOTS.length; bird++) for (let k = 0; k < 3; k++) move(wing(bird, k), 0, 0, -1e6, 0)

  return {
    startle: () => (startled = 1),
    busy: () => flying,
    frame(dt, fresh, lean) {
      leanTrees(lean)
      if (calm) return
      now += dt
      for (const a of arrivals) if (!a.done) arrive(a, now)
      paddle(now / 9000)
      startled *= 0.985 ** (dt / 16)
      if (!pass && fresh) pass = newPass(now, 600)
      // Startled birds hurry: the pass is brought forward in time.
      if (pass) pass.begun -= dt * startled * 1.6
      let t = pass ? (now - pass.begun) / pass.ms : -1
      if (pass && t >= 1) {
        pass = fresh ? newPass(now, 2500 + Math.random() * 5000) : undefined
        t = -1
      }
      flying = !!pass && t > 0
      if (flying && pass) {
        // Fading in and out at the ends of a pass, so they never pop at the frame's edge.
        const fade = Math.max(0.02, Math.min(1, t * 9, (1 - t) * 9))
        const { from, via, to } = pass
        const at = (k: number) => (1 - t) ** 2 * from[k] + 2 * t * (1 - t) * via[k] + t * t * to[k]
        const going = (k: number) => 2 * (1 - t) * (via[k] - from[k]) + 2 * t * (to[k] - via[k])
        const course = Math.atan2(going(1), going(0))
        const heading = (-course * 180) / Math.PI
        const [fx, fy] = [Math.cos(course), Math.sin(course)]
        for (let bird = 0; bird < SLOTS.length; bird++) {
          const last = bird === pass.birds - 1
          const behind = pass.straggler && last ? lag(t) : 0
          // The straggler beats its wings twice as fast while it is making up ground.
          const hurry = pass.straggler && last && t > 0.44 && t < 0.66
          const ahead = (SLOTS[bird][0] - behind) * BIRD
          const right = SLOTS[bird][1] * BIRD
          const up = pass.up + Math.sin(now / 700 + bird) * scale * 0.8 + startled * scale * 6
          const beat = BEATS[Math.floor(now / ((hurry ? 80 : 170) - 60 * startled) + pass.phase[bird]) % BEATS.length]
          // One wing position shows at a time; the others wait far below the land. (Hiding a layer
          // and showing it again takes the map a moment, too long for a wingbeat.)
          for (let k = 0; k < 3; k++) {
            const here = bird < pass.birds && k === beat
            move(wing(bird, k), at(0) + fx * ahead + fy * right, at(1) + fy * ahead - fx * right, here ? up : -1e6, heading)
            if (here) map.setPaintProperty(wing(bird, k), 'model-opacity', fade)
          }
        }
        flockShown = true
      } else if (flockShown) {
        // Between passes every bird waits below the land.
        flockShown = false
        for (let bird = 0; bird < SLOTS.length; bird++) for (let k = 0; k < 3; k++) move(wing(bird, k), 0, 0, -1e6, 0)
      }
    },
    remove() {
      leanTrees(0)
      for (const id of layers) if (map.getLayer(id)) map.removeLayer(id)
      for (const id of sources) if (map.getSource(id)) map.removeSource(id)
    },
  }
}
