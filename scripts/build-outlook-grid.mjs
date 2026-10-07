// Builds the grid of hexagons that the map's color outlook fills in: every hexagon whose centre is
// on land in Ontario, at three sizes (one per zoom band).
//
//   node scripts/build-outlook-grid.mjs
//
// Source: Natural Earth 1:50m admin-1 states and provinces, with lakes cut out (public domain).
// The hex maths must match src/lib/hexbin.ts: pointy-top hexagons in Web Mercator metres.

import { writeFileSync } from 'node:fs'

const SOURCE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces_lakes.geojson'
/** Hexagon sizes in Mercator metres (centre to corner); see hexSizeForZoom in src/lib/hexbin.ts. */
const SIZES = [90_000, 45_000, 20_000]

const R = 6378137
const SQRT3 = Math.sqrt(3)
const project = (lng, lat) => [(R * lng * Math.PI) / 180, R * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))]

const inRing = ([x, y], ring) => {
  let c = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}

const res = await fetch(SOURCE)
if (!res.ok) throw new Error(`Natural Earth: ${res.status}`)
const all = await res.json()
const ontario = all.features.find((f) => f.properties.name === 'Ontario' && f.properties.iso_a2 === 'CA')
if (!ontario) throw new Error('Ontario not found in the source')
const polygons = (ontario.geometry.type === 'Polygon' ? [ontario.geometry.coordinates] : ontario.geometry.coordinates).map((poly) => poly.map((ring) => ring.map(([lng, lat]) => project(lng, lat))))
// Inside the outer ring and outside every hole (the lakes).
const onLand = (p) => polygons.some(([outer, ...holes]) => inRing(p, outer) && !holes.some((h) => inRing(p, h)))

let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity]
for (const [outer] of polygons)
  for (const [x, y] of outer) {
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
  }

const grids = {}
for (const size of SIZES) {
  const cells = []
  const rMin = Math.floor(minY / (size * 1.5)) - 1
  const rMax = Math.ceil(maxY / (size * 1.5)) + 1
  for (let r = rMin; r <= rMax; r++) {
    const qMin = Math.floor(minX / (size * SQRT3) - r / 2) - 1
    const qMax = Math.ceil(maxX / (size * SQRT3) - r / 2) + 1
    for (let q = qMin; q <= qMax; q++) if (onLand([size * SQRT3 * (q + r / 2), size * 1.5 * r])) cells.push([q, r])
  }
  grids[size] = cells
  console.log(`  ${size / 1000} km: ${cells.length} hexagons`)
}

writeFileSync(new URL('../public/data/outlook-grid.json', import.meta.url), JSON.stringify({ source: 'Natural Earth 1:50m admin-1 (public domain)', grids }))
console.log('  → public/data/outlook-grid.json')
