// Pulls the Ontario Parks fall colour report into public/data/ontario-parks.json.
// The report page embeds its data as `var data = [...]`; we read that array
// rather than parsing HTML. Runs daily via .github/workflows/ontario-parks.yml.
// Source: https://www.ontarioparks.ca/fallcolour (please credit Ontario Parks).

import { writeFile } from 'node:fs/promises'

const SOURCE = 'https://www.ontarioparks.ca/fallcolour'
const OUT = new URL('../public/data/ontario-parks.json', import.meta.url)

function extractArray(html) {
  const marker = html.indexOf('var data = [')
  if (marker === -1) throw new Error('Could not find `var data = [` on the report page')
  const start = html.indexOf('[', marker)
  let depth = 0
  let inString = false
  for (let i = start; i < html.length; i++) {
    const c = html[i]
    if (inString) {
      if (c === '\\') i++
      else if (c === '"') inString = false
    } else if (c === '"') inString = true
    else if (c === '[') depth++
    else if (c === ']' && --depth === 0) return JSON.parse(html.slice(start, i + 1))
  }
  throw new Error('Unterminated data array')
}

const toNumber = (v) => (v === null || v === undefined || v === '' ? null : Number(v))

const res = await fetch(SOURCE, { headers: { 'User-Agent': 'CanopyFallColours/0.1 (+https://github.com/maarib/canopy)' } })
if (!res.ok) throw new Error(`Ontario Parks responded ${res.status}`)
const raw = extractArray(await res.text())

const parks = raw
  .filter((p) => p.lat && p.lng && p.reporting === 'yes')
  .map((p) => ({
    id: String(p.id),
    name: p.park_name,
    shortname: p.shortname,
    location: p.location_name && p.location_name !== 'empty' ? p.location_name : null,
    main: p.main_marker === 'yes',
    region: p.region,
    dominantColour: p.dominant_colour,
    colourChange: toNumber(p.colour_change),
    leafFall: toNumber(p.leaf_fall),
    viewing: p.viewing,
    reportedAt: p.report_date ? new Date(Number(p.report_date) * 1000).toISOString() : null,
    closingDate: p.closing_date || null,
    lat: Number(p.lat),
    lng: Number(p.lng),
    url: `https://www.ontarioparks.ca/park/${p.shortname}`,
  }))

if (parks.length < 10) throw new Error(`Only ${parks.length} parks parsed; page format may have changed`)

await writeFile(OUT, JSON.stringify({ source: SOURCE, fetchedAt: new Date().toISOString(), parks }, null, 1) + '\n')
console.log(`Wrote ${parks.length} park reports`)
