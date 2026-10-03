// Pulls the regulated boundary of every Ontario provincial park into
// public/data/park-boundaries/<shortname>.json, one small file per park so a park page loads only
// its own outline. Source: Ministry of Natural Resources "Provincial Park Regulated" layer on Land
// Information Ontario. Open Government Licence – Ontario. Files are named by the Ontario Parks
// shortname (the slug in ontarioparks.ca/park/<shortname>), the key Canopy uses for parks.
// Runs monthly via .github/workflows/park-boundaries.yml.

import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'

const LAYER = 'https://ws.lioservices.lrc.gov.on.ca/arcgis2/rest/services/LIO_OPEN_DATA/LIO_Open03/MapServer/4'
const DIR = new URL('../public/data/park-boundaries/', import.meta.url)
const UA = 'CanopyFallColors/0.1 (+https://github.com/maarib/canopy)'

/** Layer names that differ from the Ontario Parks shortname. */
const ALIASES = {
  'AMABLE DU FOND': 'amabledufondriver',
  'CHAPLEAU-NEMEGOSENDA RIVERS': 'chapleaunemegosendariver',
  'LAKE ON THE MOUNTAIN PICNIC GROUNDS': 'lakeonthemountain',
  'LARDER RIVER': 'larderriverwaterway',
  'QUEEN ELIZABETH II WILDLANDS': 'queenelizabeth2wildlands',
  'QUEEN ELIZABETH THE QUEEN MOTHER MNIDOO MNISING': 'queenelizabeththequeenmothermnidoomnissing',
}
const slug = (name) => ALIASES[name] ?? name.normalize('NFD').toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * Simplified by the server: about 5 m for parks under 1,000 ha, 20 m for the rest. Plenty for
 * an outline seen at the zoom that fits the park, and it keeps the largest file under 200 KB.
 */
async function query(where, offset) {
  const q = new URLSearchParams({
    where,
    outFields: 'COMMON_SHORT_NAME,PROTECTED_AREA_NAME_ENG',
    outSR: '4326',
    maxAllowableOffset: String(offset),
    geometryPrecision: '5',
    f: 'geojson',
  })
  const res = await fetch(`${LAYER}/query?${q}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(120_000) })
  if (!res.ok) throw new Error(`LIO responded ${res.status}`)
  const json = await res.json()
  if (json.error) throw new Error(`LIO error: ${json.error.message}`)
  return json.features
}

const features = [...(await query('REGULATED_AREA < 1000', 0.00005)), ...(await query('REGULATED_AREA >= 1000 OR REGULATED_AREA IS NULL', 0.0002))]
if (features.length < 300) throw new Error(`Only ${features.length} parks; the layer may have changed`)

function bbox(geometry) {
  let [w, s, e, n] = [180, 90, -180, -90]
  const rings = geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat()
  for (const ring of rings)
    for (const [x, y] of ring) {
      w = Math.min(w, x)
      s = Math.min(s, y)
      e = Math.max(e, x)
      n = Math.max(n, y)
    }
  return [w, s, e, n]
}

await mkdir(DIR, { recursive: true })
const written = new Set()
let changed = 0
for (const f of features) {
  if (!f.geometry) continue
  const id = slug(f.properties.COMMON_SHORT_NAME.trim().replace(/\s+/g, ' '))
  const name = f.properties.PROTECTED_AREA_NAME_ENG.trim()
  const body = JSON.stringify({ type: 'Feature', bbox: bbox(f.geometry), properties: { name }, geometry: f.geometry }) + '\n'
  const file = new URL(`${id}.json`, DIR)
  written.add(`${id}.json`)
  // Only rewrite files whose outline changed, so the scheduled job commits real updates only.
  if ((await readFile(file, 'utf8').catch(() => null)) === body) continue
  await writeFile(file, body)
  changed++
}
// Parks removed from the layer.
for (const old of await readdir(DIR)) if (!written.has(old)) await rm(new URL(old, DIR))

const parks = JSON.parse(await readFile(new URL('../public/data/park-facilities.json', import.meta.url), 'utf8')).parks
const missing = Object.keys(parks).filter((s) => !written.has(`${s}.json`))
console.log(`${written.size} boundaries, ${changed} changed${missing.length ? `; no boundary for ${missing.join(', ')}` : ''}`)
