// Lists every Ontario provincial park in public/data/parks-index.json, so each one can have a
// page and turn up in search, not only the parks with a fall color report. No requests: it
// reads what the other scripts already saved (the regulated boundaries for where a park is, and
// the Ontario Parks pages for its name, class, size and link). Runs after either of those does.

import { readFile, readdir, writeFile } from 'node:fs/promises'

const BOUNDARIES = new URL('../public/data/park-boundaries/', import.meta.url)
const FACILITIES = new URL('../public/data/park-facilities.json', import.meta.url)
const REPORTS = new URL('../public/data/ontario-parks.json', import.meta.url)
const OUT = new URL('../public/data/parks-index.json', import.meta.url)

const round = (n) => Math.round(n * 1e4) / 1e4
const RAD = Math.PI / 180
const km = (aLat, aLng, bLat, bLng) => 6371 * Math.hypot((bLng - aLng) * RAD * Math.cos(((aLat + bLat) / 2) * RAD), (bLat - aLat) * RAD)

/** "BON ECHO PROVINCIAL PARK (NATURAL ENVIRONMENT CLASS)" → name and class, for parks with no page. */
function fromLayerName(raw) {
  const [, name, cls] = raw.match(/^(.*?)(?:\s*\(([^)]*?)\s*CLASS\))?$/i) ?? [null, raw, null]
  const title = (s) => s.toLowerCase().replace(/(^|[\s\-(/])([a-zà-ÿ])/g, (_, a, b) => a + b.toUpperCase())
  return { name: title(name.trim()), classification: cls ? title(cls.trim()) : null }
}

/** The largest ring's bounding-box middle: for a park in several pieces, a point in the main one. */
function middle(geometry) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  let best = null
  for (const [outer] of polygons) {
    let [w, s, e, n] = [180, 90, -180, -90]
    for (const [x, y] of outer) {
      w = Math.min(w, x)
      s = Math.min(s, y)
      e = Math.max(e, x)
      n = Math.max(n, y)
    }
    const size = (e - w) * (n - s)
    if (!best || size > best.size) best = { size, lat: (s + n) / 2, lng: (w + e) / 2 }
  }
  return best
}

const facilities = JSON.parse(await readFile(FACILITIES, 'utf8')).parks
const reports = JSON.parse(await readFile(REPORTS, 'utf8')).parks

const parks = []
for (const file of (await readdir(BOUNDARIES)).filter((f) => f.endsWith('.json')).sort()) {
  const shortname = file.slice(0, -5)
  const boundary = JSON.parse(await readFile(new URL(file, BOUNDARIES), 'utf8'))
  const page = facilities[shortname]
  const layer = fromLayerName(boundary.properties.name)
  const at = middle(boundary.geometry)
  // Ontario Parks groups parks into regions only on its fall color report, so a park without
  // a report takes the region of the nearest park that has one.
  const nearest = reports.reduce((a, b) => (km(at.lat, at.lng, b.lat, b.lng) < km(at.lat, at.lng, a.lat, a.lng) ? b : a))
  parks.push({
    shortname,
    name: (page?.name ?? layer.name).replace(/\s+Provincial Park$/i, ''),
    classification: page?.classification ?? layer.classification,
    lat: round(at.lat),
    lng: round(at.lng),
    region: nearest.region,
    sizeHa: page?.sizeHa ?? null,
    established: page?.established ?? null,
    url: page?.url ?? null,
  })
}
if (parks.length < 300) throw new Error(`Only ${parks.length} parks; the boundary files may be missing`)

const body = JSON.stringify(parks)
const previous = await readFile(OUT, 'utf8').then(JSON.parse).catch(() => null)
if (previous && JSON.stringify(previous.parks) === body) {
  console.log(`No change: ${parks.length} parks`)
} else {
  await writeFile(OUT, JSON.stringify({ source: 'Ontario Ministry of Natural Resources (regulated boundaries) and Ontario Parks (park pages)', generatedAt: new Date().toISOString(), parks }))
  console.log(`Wrote ${parks.length} parks`)
}
