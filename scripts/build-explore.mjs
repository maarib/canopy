// Builds public/data/explore/<area>.json: trails with elevation profiles and the
// waterfalls, lookouts, lakes and creeks along them, for each area in AREAS.
//
// Sources
//   Trails + trailheads: Ontario Trail Network (MNRF, Open Government Licence – Ontario)
//   Waterfalls, lookouts, peaks, lakes, creeks: OpenStreetMap via Overpass (ODbL)
//   Elevation: Mapzen Terrarium tiles on AWS Open Data
//
// Usage: node scripts/build-explore.mjs [areaId]

import { mkdir, writeFile } from 'node:fs/promises'
import { PNG } from 'pngjs'

const AREAS = [
  {
    id: 'algonquin',
    name: 'Algonquin · Highway 60 corridor',
    regionId: 'algonquin',
    // south, west, north, east
    bbox: [45.35, -78.95, 45.75, -77.9],
  },
]

const UA = 'CanopyFallColours/0.1 (+https://github.com/maarib/canopy)'
const OTN = 'https://ws.lioservices.lrc.gov.on.ca/arcgis2/rest/services/LIO_OPEN_DATA/LIO_Open04/MapServer'
const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]
const TERRARIUM = (z, x, y) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`

// Distances within which a place counts as "along the trail".
const NEAR = { waterfall: 250, viewpoint: 200, peak: 250, lake: 120, creek: 40 }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ── Fetching ─────────────────────────────────────────────────

async function overpass(query) {
  const body = new URLSearchParams({ data: `[out:json][timeout:90];${query}` })
  for (let attempt = 1; attempt <= 4; attempt++) {
    for (const endpoint of OVERPASS) {
      try {
        const res = await fetch(endpoint, { method: 'POST', body, headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(120_000) })
        if (res.ok) return (await res.json()).elements
        console.warn(`  overpass ${res.status} from ${new URL(endpoint).host}`)
      } catch (e) {
        console.warn(`  overpass error from ${new URL(endpoint).host}: ${e.message}`)
      }
    }
    await sleep(10_000 * attempt) // the public servers are often busy; back off
  }
  throw new Error('Overpass unavailable after retries')
}

async function otn(layer, [s, w, n, e], where = '1=1') {
  const params = new URLSearchParams({
    where,
    geometry: `${w},${s},${e},${n}`,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    outSR: '4326',
    geometryPrecision: '6',
    f: 'geojson',
  })
  const res = await fetch(`${OTN}/${layer}/query?${params}`, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`OTN ${layer}: ${res.status}`)
  return (await res.json()).features
}

// ── Geometry (local metres; fine at park scale) ──────────────

const R = 6371008.8
const rad = (d) => (d * Math.PI) / 180
function haversine([lng1, lat1], [lng2, lat2]) {
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}
function projector(lat0) {
  const kx = Math.cos(rad(lat0)) * 111_320
  const ky = 110_540
  return ([lng, lat]) => [lng * kx, lat * ky]
}
/** Distance in metres from point p to segment ab (all projected). */
function segDist([px, py], [ax, ay], [bx, by]) {
  const dx = bx - ax
  const dy = by - ay
  const t = dx || dy ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))) : 0
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

/** Join MultiLineString parts end-to-end where they touch (≤ 40 m), longest chain first. */
function chainParts(parts) {
  const remaining = parts.map((p) => [...p])
  const chains = []
  while (remaining.length) {
    let chain = remaining.shift()
    let grew = true
    while (grew) {
      grew = false
      for (let i = 0; i < remaining.length; i++) {
        const p = remaining[i]
        const [start, end] = [chain[0], chain[chain.length - 1]]
        let joined = null
        if (haversine(end, p[0]) < 40) joined = [...chain, ...p.slice(1)]
        else if (haversine(end, p[p.length - 1]) < 40) joined = [...chain, ...[...p].reverse().slice(1)]
        else if (haversine(start, p[p.length - 1]) < 40) joined = [...p, ...chain.slice(1)]
        else if (haversine(start, p[0]) < 40) joined = [...[...p].reverse(), ...chain.slice(1)]
        if (joined) {
          chain = joined
          remaining.splice(i, 1)
          grew = true
          break
        }
      }
    }
    chains.push(chain)
  }
  return chains.sort((a, b) => lineLength(b) - lineLength(a))
}
const lineLength = (line) => line.reduce((sum, p, i) => (i ? sum + haversine(line[i - 1], p) : 0), 0)

/** Points every `step` metres along a line, each with its distance from the start. */
function resample(line, step) {
  const out = [{ p: line[0], d: 0 }]
  let carried = 0
  let total = 0
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1]
    const b = line[i]
    const seg = haversine(a, b)
    let t = step - carried
    while (t <= seg) {
      const f = t / seg
      out.push({ p: [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f], d: total + t })
      t += step
    }
    carried = seg - (t - step)
    total += seg
  }
  const last = line[line.length - 1]
  if (out[out.length - 1].d < total) out.push({ p: last, d: total })
  return out
}

/** Douglas–Peucker in projected metres. */
function simplify(line, tolerance, proj) {
  if (line.length < 3) return line
  const pts = line.map(proj)
  const keep = new Uint8Array(line.length)
  keep[0] = keep[line.length - 1] = 1
  const stack = [[0, line.length - 1]]
  while (stack.length) {
    const [i, j] = stack.pop()
    let max = 0
    let idx = -1
    for (let k = i + 1; k < j; k++) {
      const d = segDist(pts[k], pts[i], pts[j])
      if (d > max) [max, idx] = [d, k]
    }
    if (max > tolerance) {
      keep[idx] = 1
      stack.push([i, idx], [idx, j])
    }
  }
  return line.filter((_, k) => keep[k]).map(([x, y]) => [+x.toFixed(5), +y.toFixed(5)])
}

// ── Elevation ────────────────────────────────────────────────

const tileCache = new Map()
async function terrainTile(z, x, y) {
  const key = `${z}/${x}/${y}`
  if (!tileCache.has(key))
    tileCache.set(
      key,
      fetch(TERRARIUM(z, x, y), { headers: { 'User-Agent': UA } })
        .then((r) => r.arrayBuffer())
        .then((buf) => PNG.sync.read(Buffer.from(buf))),
    )
  return tileCache.get(key)
}
async function elevationAt([lng, lat], z = 13) {
  const n = 2 ** z
  const xf = ((lng + 180) / 360) * n
  const yf = ((1 - Math.log(Math.tan(rad(lat)) + 1 / Math.cos(rad(lat))) / Math.PI) / 2) * n
  const [x, y] = [Math.floor(xf), Math.floor(yf)]
  const png = await terrainTile(z, x, y)
  const px = Math.min(255, Math.floor((xf - x) * 256))
  const py = Math.min(255, Math.floor((yf - y) * 256))
  const i = (py * 256 + px) * 4
  return png.data[i] * 256 + png.data[i + 1] + png.data[i + 2] / 256 - 32768
}

// ── Classification ───────────────────────────────────────────

function difficulty(km, gain) {
  if (km > 30) return 'backpacking'
  const effort = km + gain / 100 // ~100 m of climbing ≈ 1 km of walking
  return effort < 5 ? 'easy' : effort < 12 ? 'moderate' : 'hard'
}
/** Naismith-style estimate for a relaxed walking pace (4 km/h + 1 h per 600 m up). */
const durationHours = (km, gain) => +(km / 4 + gain / 600).toFixed(1)

const isHikeable = (uses = '') => /hiking|walking/i.test(uses)

// ── Build one area ───────────────────────────────────────────

async function buildArea(area) {
  const [s, w, n, e] = area.bbox
  const bb = `${s},${w},${n},${e}`
  const proj = projector((s + n) / 2)
  console.log(`\n▸ ${area.name}`)

  const [trailFeatures, accessPoints] = await Promise.all([
    otn(19, area.bbox, "ON_ROAD_FLG='No'"),
    otn(20, area.bbox),
  ])
  const trailsRaw = trailFeatures.filter(
    (f) => isHikeable(f.properties.PERMITTED_USES) && !/access point/i.test(f.properties.TRAIL_NAME ?? ''),
  )
  console.log(`  ${trailsRaw.length} hikeable trails, ${accessPoints.length} access points`)

  const points = await overpass(
    `(node["waterway"="waterfall"](${bb});node["tourism"="viewpoint"](${bb});node["natural"="peak"]["name"](${bb}););out body;`,
  )
  await sleep(2000)
  const lakes = await overpass(`(way["natural"="water"]["name"](${bb});relation["natural"="water"]["name"](${bb}););out tags geom;`)
  await sleep(2000)
  const creeks = await overpass(`way["waterway"~"^(stream|river)$"]["name"](${bb});out tags geom;`)
  console.log(`  ${points.length} points, ${lakes.length} lakes, ${creeks.length} creek/river ways`)

  // Projected outlines for distance checks.
  const lakeShapes = lakes.map((l) => {
    const rings =
      l.type === 'way' ? [l.geometry ?? []] : (l.members ?? []).filter((m) => m.geometry).map((m) => m.geometry)
    const coords = rings.map((r) => r.map((g) => proj([g.lon, g.lat])))
    const flat = coords.flat()
    const xs = flat.map((p) => p[0])
    const ys = flat.map((p) => p[1])
    const ll = rings.flat()
    return {
      el: l,
      rings: coords,
      box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)],
      center: ll.length
        ? [+((Math.min(...ll.map((g) => g.lon)) + Math.max(...ll.map((g) => g.lon))) / 2).toFixed(5), +((Math.min(...ll.map((g) => g.lat)) + Math.max(...ll.map((g) => g.lat))) / 2).toFixed(5)]
        : null,
    }
  })
  const creekShapes = creeks.map((c) => ({ el: c, line: (c.geometry ?? []).map((g) => proj([g.lon, g.lat])) }))

  const pois = new Map()
  const poiId = (kind, el) => `${kind}-${el.type[0]}${el.id}`
  function addPoi(kind, el, name, lngLat, extra = {}) {
    const id = poiId(kind, el)
    if (!pois.has(id))
      pois.set(id, {
        id,
        kind,
        name,
        lng: lngLat[0],
        lat: lngLat[1],
        osm: `https://www.openstreetmap.org/${el.type}/${el.id}`,
        ...extra,
      })
    return id
  }

  // Waterfalls, lookouts and peaks are mapped whether or not a trail passes them.
  const kindOf = (t) => (t.waterway === 'waterfall' ? 'waterfall' : t.tourism === 'viewpoint' ? 'viewpoint' : 'peak')
  const pointPois = points.map((p) => {
    const kind = kindOf(p.tags)
    const xy = proj([p.lon, p.lat])
    let name = p.tags.name
    if (!name && kind === 'waterfall') {
      // Name unnamed falls after the creek they're on.
      const creek = creekShapes.find((c) => c.line.some((q, i) => i && segDist(xy, c.line[i - 1], q) < 80))
      name = creek ? `Falls on ${creek.el.tags.name}` : null
    }
    return { p, kind, xy, name, ele: p.tags.ele ? Number(p.tags.ele) : null }
  })
  // OSM often has two nodes for one lookout or falls; keep one, preferring a named one.
  pointPois.sort((a, b) => Number(!!b.p.tags.name) - Number(!!a.p.tags.name))
  for (let i = pointPois.length - 1; i >= 0; i--) {
    const a = pointPois[i]
    const dup = pointPois.findIndex(
      (b, j) =>
        j < i &&
        b.kind === a.kind &&
        (Math.hypot(a.xy[0] - b.xy[0], a.xy[1] - b.xy[1]) < 120 ||
          (a.name && a.name === b.name && Math.hypot(a.xy[0] - b.xy[0], a.xy[1] - b.xy[1]) < 600)),
    )
    if (dup !== -1) pointPois.splice(i, 1)
  }

  const trails = []
  for (const f of trailsRaw) {
    const props = f.properties
    const parts = f.geometry.type === 'LineString' ? [f.geometry.coordinates] : f.geometry.coordinates
    const chains = chainParts(parts)
    const main = chains[0]
    const lengthM = chains.reduce((sum, c) => sum + lineLength(c), 0)
    const km = lengthM / 1000
    // Official geometry often stops short at the parking lot, so loops have a small gap.
    const gap = haversine(main[0], main[main.length - 1])
    const loop = gap < 150 || (lengthM > 1000 && gap <= Math.min(1200, 0.2 * lengthM))

    // Elevation every ~40 m along the main line (max ~400 samples).
    const step = Math.max(40, lineLength(main) / 400)
    const samples = resample(main, step)
    const elev = []
    for (const s of samples) elev.push(await elevationAt(s.p))
    // Light smoothing, then count only climbs/drops beyond 3 m to ignore DEM noise.
    const smooth = elev.map((_, i) => (elev[Math.max(0, i - 1)] + elev[i] + elev[Math.min(elev.length - 1, i + 1)]) / 3)
    let gain = 0
    let loss = 0
    let ref = smooth[0]
    for (const v of smooth) {
      if (v - ref > 3) [gain, ref] = [gain + v - ref, v]
      else if (ref - v > 3) [loss, ref] = [loss + ref - v, v]
    }
    const every = Math.max(1, Math.ceil(samples.length / 120))
    const profile = samples
      .filter((_, i) => i % every === 0 || i === samples.length - 1)
      .map((s, i, arr) => {
        const idx = samples.indexOf(s)
        return [+(s.d / 1000).toFixed(2), Math.round(smooth[idx]), +s.p[0].toFixed(5), +s.p[1].toFixed(5)]
      })

    // Places along the trail, with where along it they are.
    const sampleXY = samples.map((s) => ({ ...s, xy: proj(s.p) }))
    const nearestAlong = (xy) => {
      let best = { m: Infinity, d: 0 }
      for (const s of sampleXY) {
        const m = Math.hypot(xy[0] - s.xy[0], xy[1] - s.xy[1])
        if (m < best.m) best = { m, d: s.d }
      }
      return best
    }
    const along = []
    for (const pp of pointPois) {
      const { m, d } = nearestAlong(pp.xy)
      if (m <= NEAR[pp.kind]) {
        const name = pp.name ?? (pp.kind === 'viewpoint' ? `Lookout on ${props.TRAIL_NAME}` : pp.kind === 'waterfall' ? 'Unnamed waterfall' : 'Unnamed peak')
        const id = addPoi(pp.kind, pp.p, name, [pp.p.lon, pp.p.lat], { ele: pp.ele })
        along.push({ poi: id, km: +(d / 1000).toFixed(1), offM: Math.round(m) })
      }
    }
    for (const lake of lakeShapes) {
      const [x0, y0, x1, y1] = lake.box
      let firstD = null
      for (const s of sampleXY) {
        const [x, y] = s.xy
        if (x < x0 - NEAR.lake || x > x1 + NEAR.lake || y < y0 - NEAR.lake || y > y1 + NEAR.lake) continue
        const close = lake.rings.some((r) => r.some((q, i) => i && segDist(s.xy, r[i - 1], q) <= NEAR.lake))
        if (close) {
          firstD = s.d
          break
        }
      }
      if (firstD !== null && lake.center) {
        // Wide rivers are mapped as water areas too; classify by name.
        const nm = lake.el.tags.name
        const kind = /\briver\b/i.test(nm) ? 'river' : /\b(creek|brook)\b/i.test(nm) ? 'creek' : 'lake'
        const id = addPoi(kind, lake.el, nm, lake.center)
        if (!along.some((a) => a.poi === id)) along.push({ poi: id, km: +(firstD / 1000).toFixed(1), offM: 0 })
      }
    }
    const creekSeen = new Set()
    for (const creek of creekShapes) {
      const name = creek.el.tags.name
      if (creekSeen.has(name)) continue
      for (const s of sampleXY) {
        if (creek.line.some((q, i) => i && segDist(s.xy, creek.line[i - 1], q) <= NEAR.creek)) {
          const mid = creek.el.geometry[Math.floor(creek.el.geometry.length / 2)]
          const kind = creek.el.tags.waterway === 'river' ? 'river' : 'creek'
          const id = addPoi(kind, creek.el, name, [+mid.lon.toFixed(5), +mid.lat.toFixed(5)])
          along.push({ poi: id, km: +(s.d / 1000).toFixed(1), offM: 0 })
          creekSeen.add(name)
          break
        }
      }
    }
    along.sort((a, b) => a.km - b.km)
    // One entry per named body of water (a river can be both a water area and a line).
    const seenWater = new Set()
    for (let i = 0; i < along.length; i++) {
      const { kind, name } = pois.get(along[i].poi)
      if (!['lake', 'river', 'creek'].includes(kind)) continue
      if (seenWater.has(name)) along.splice(i--, 1)
      else seenWater.add(name)
    }

    // Trailhead: nearest OTN access point to the start (within 400 m), else the start itself.
    const start = main[0]
    const access = accessPoints
      .map((a) => ({ a, m: haversine(start, a.geometry.coordinates) }))
      .sort((x, y) => x.m - y.m)[0]
    const trailhead = access && access.m < 400 ? access.a.geometry.coordinates.map((v) => +v.toFixed(5)) : start.map((v) => +v.toFixed(5))

    const all = chains.flat()
    trails.push({
      id: `otn-${props.OGF_ID}`,
      name: props.TRAIL_NAME,
      description: props.DESCRIPTION?.trim() || null,
      uses: props.PERMITTED_USES,
      association: props.TRAIL_ASSOCIATION,
      website: props.TRAIL_ASSOCIATION_WEBSITE ? `https://${props.TRAIL_ASSOCIATION_WEBSITE.replace(/^https?:\/\//, '')}` : null,
      lengthKm: +km.toFixed(1),
      loop,
      difficulty: difficulty(km, gain),
      durationH: km <= 30 ? durationHours(km, gain) : null,
      gainM: Math.round(gain),
      lossM: Math.round(loss),
      minEleM: Math.round(Math.min(...smooth)),
      maxEleM: Math.round(Math.max(...smooth)),
      trailhead,
      bbox: [
        +Math.min(...all.map((p) => p[0])).toFixed(5),
        +Math.min(...all.map((p) => p[1])).toFixed(5),
        +Math.max(...all.map((p) => p[0])).toFixed(5),
        +Math.max(...all.map((p) => p[1])).toFixed(5),
      ],
      geometry: { type: 'MultiLineString', coordinates: chains.map((c) => simplify(c, 6, proj)) },
      profile,
      along,
    })
    console.log(`  ✓ ${props.TRAIL_NAME}: ${km.toFixed(1)} km, +${Math.round(gain)} m, ${along.length} places along`)
  }

  // Map every named waterfall/lookout/peak in the area, not just those on trails.
  for (const pp of pointPois) if (pp.name) addPoi(pp.kind, pp.p, pp.name, [pp.p.lon, pp.p.lat], { ele: pp.ele })

  // Which trails reach each place, for place pages.
  const poiList = [...pois.values()].map((p) => ({
    ...p,
    trails: trails.filter((t) => t.along.some((a) => a.poi === p.id)).map((t) => t.id),
  }))

  trails.sort((a, b) => a.lengthKm - b.lengthKm)
  const out = {
    id: area.id,
    name: area.name,
    regionId: area.regionId,
    bbox: area.bbox,
    generatedAt: new Date().toISOString(),
    sources: {
      trails: 'Ontario Trail Network, Ontario Ministry of Natural Resources (Open Government Licence – Ontario)',
      places: '© OpenStreetMap contributors (ODbL)',
      elevation: 'Mapzen Terrarium via AWS Open Data',
    },
    trails,
    pois: poiList,
  }
  await mkdir(new URL('../public/data/explore/', import.meta.url), { recursive: true })
  const file = new URL(`../public/data/explore/${area.id}.json`, import.meta.url)
  await writeFile(file, JSON.stringify(out) + '\n')
  console.log(`  → ${trails.length} trails, ${poiList.length} places written to public/data/explore/${area.id}.json`)
}

const only = process.argv[2]
for (const area of AREAS.filter((a) => !only || a.id === only)) await buildArea(area)
