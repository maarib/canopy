// Pulls Ontario's fishing access points (boat launches, shoreline access, docks and piers)
// into public/data/fishing-access.json. Source: Ministry of Natural Resources "Fishing Access
// Point" layer on Land Information Ontario, the data behind Fish ON-Line. Open Government
// Licence – Ontario. Only points the ministry marks for public display (VISIBILITY_IND = Yes)
// are kept. Runs monthly via .github/workflows/fishing-access.yml.

import { readFile, writeFile } from 'node:fs/promises'

const LAYER = 'https://ws.lioservices.lrc.gov.on.ca/arcgis2/rest/services/LIO_OPEN_DATA/LIO_Open07/MapServer/15'
const OUT = new URL('../public/data/fishing-access.json', import.meta.url)
const UA = 'CanopyFallColors/0.1 (+https://github.com/maarib/canopy)'
const PAGE = 2000

const FIELDS = [
  'OBJECTID',
  'OGF_ID',
  'FISHING_ACCESS_POINT_TYPE',
  'SITE_NAME',
  'PARKING_PRESENCE_FLG',
  'USER_FEE_FLG',
  'ACCESSIBILITY_FLG',
  'MATERIAL_TYPE',
  'SITE_OWNERSHIP_TYPE',
  'SITE_LAST_VERIFICATION_DATE',
  'ADDITIONAL_INFORMATION_URL',
]

const TYPES = { 'Boat Launch': 'launch', 'Shoreline Access': 'shore', 'Enhanced Shoreline Access': 'pier' }
/** Yes/No/Unknown → true/false/null */
const flag = (v) => (v === 'Yes' ? true : v === 'No' ? false : null)
const known = (v) => (v && v !== 'Unknown' ? v : null)
const round = (n) => Math.round(n * 1e5) / 1e5
/** Drop internal ids: "Woodchuck Bay Access Point-keap005" → "Woodchuck Bay Access Point", "Ml-8" → null. */
function cleanName(raw) {
  const name = raw?.trim().replace(/\s*-\s*[a-z]{2,6}\d{2,}$/i, '')
  return name && !/^[A-Z][a-z]-\d+$/.test(name) ? name : null
}

async function page(offset) {
  const q = new URLSearchParams({
    where: "VISIBILITY_IND = 'Yes'",
    outFields: FIELDS.join(','),
    outSR: '4326',
    orderByFields: 'OBJECTID',
    resultOffset: String(offset),
    resultRecordCount: String(PAGE),
    f: 'json',
  })
  const res = await fetch(`${LAYER}/query?${q}`, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(60_000) })
  if (!res.ok) throw new Error(`LIO responded ${res.status}`)
  const json = await res.json()
  if (json.error) throw new Error(`LIO error: ${json.error.message}`)
  return json.features
}

const features = []
for (let offset = 0; ; offset += PAGE) {
  const batch = await page(offset)
  features.push(...batch)
  if (batch.length < PAGE) break
}
if (features.length < 1000) throw new Error(`Only ${features.length} access points; the layer may have changed`)

// One row per point keeps the file small: [id, lng, lat, type, name, parking, fee, accessible,
// surface, ownership, verified year, link]. Unknown values are null.
const points = features
  .filter((f) => f.geometry && Number.isFinite(f.geometry.x))
  .map(({ attributes: a, geometry: g }) => {
    const name = cleanName(a.SITE_NAME)
    const verified = a.SITE_LAST_VERIFICATION_DATE ? new Date(a.SITE_LAST_VERIFICATION_DATE).getUTCFullYear() : null
    const url = /^https?:\/\//.test(a.ADDITIONAL_INFORMATION_URL ?? '') ? a.ADDITIONAL_INFORMATION_URL.trim() : null
    return [
      String(a.OGF_ID ?? a.OBJECTID),
      round(g.x),
      round(g.y),
      TYPES[a.FISHING_ACCESS_POINT_TYPE] ?? 'launch',
      name,
      flag(a.PARKING_PRESENCE_FLG),
      flag(a.USER_FEE_FLG),
      flag(a.ACCESSIBILITY_FLG),
      known(a.MATERIAL_TYPE),
      known(a.SITE_OWNERSHIP_TYPE),
      verified,
      url,
    ]
  })
  .sort((a, b) => a[0].localeCompare(b[0]))

// Leave the file untouched when nothing changed, so the scheduled job only commits real updates.
const previous = await readFile(OUT, 'utf8').then(JSON.parse).catch(() => null)
if (previous && JSON.stringify(previous.points) === JSON.stringify(points)) {
  console.log(`No changes across ${points.length} access points`)
} else {
  await writeFile(OUT, JSON.stringify({ source: LAYER, fetchedAt: new Date().toISOString(), points }) + '\n')
  console.log(`Wrote ${points.length} access points`)
}
