// Gathers the stops people make around a day outdoors (groceries, places to eat, gas, beer and
// wine, outfitters) into public/data/nearby-stops.json. Source: OpenStreetMap through the
// Overpass API, ODbL. Only stops that are among the closest to a park, trail or place Canopy
// lists are kept, so the file stays small and a page can find its own nearest by distance.
// Opening hours are not kept: too few stops have them. Runs monthly via
// .github/workflows/nearby-stops.yml.

import { readFile, writeFile } from 'node:fs/promises'

const OVERPASS = 'https://overpass-api.de/api/interpreter'
const OUT = new URL('../public/data/nearby-stops.json', import.meta.url)
const UA = 'CanopyFallColors/0.1 (+https://github.com/maarib/canopy)'
const ONTARIO = 'area["ISO3166-2"="CA-ON"]->.on;'

/** Kind → OpenStreetMap tag → the word shown on the row. */
const KINDS = {
  groceries: { 'shop=supermarket': 'Supermarket', 'shop=convenience': 'Convenience store', 'shop=general': 'General store', 'shop=greengrocer': 'Produce' },
  eat: { 'amenity=restaurant': 'Restaurant', 'amenity=cafe': 'Café', 'amenity=fast_food': 'Quick bites', 'amenity=pub': 'Pub', 'amenity=bar': 'Bar' },
  gas: { 'amenity=fuel': 'Gas station' },
  alcohol: { 'shop=alcohol': 'Beer, wine and spirits' },
  outfitter: { 'shop=outdoor': 'Outfitter' },
}

/** Fewer named stops than this across Ontario means the answer was cut short; nothing is written. */
const AT_LEAST = { groceries: 4000, eat: 20000, gas: 2500, alcohol: 800, outfitter: 80 }

// These three match NearbyStops.tsx: a page shows up to SHOWN of a kind within REACH_KM, or
// failing that the single closest within FAR_KM. KEPT leaves a spare for each.
const REACH_KM = 40
const FAR_KM = 120
const KEPT = 4

/** How far a settlement's name reaches, by its size. A stop further than 1.5× this has no town. */
const TOWN_REACH_KM = { city: 10, town: 6, village: 4, hamlet: 2.5 }

// Corrections to what OpenStreetMap has.
/** Tagged as places to eat, but not open to the public. */
const SKIP = new Set(['Camp Arowhon'])
/** Settlement names as they are written locally. */
const TOWN_NAMES = { 'Mishibikwadinaang/ Michipicoten': 'Michipicoten', 'Perth Road Village': 'Perth Road' }
/** A shop's own name says what it is better than a loose tag does. */
const typeFor = (name, type) => (/general store/i.test(name) ? 'General store' : type)

const round = (n) => Math.round(n * 1e5) / 1e5
const RAD = Math.PI / 180
const km = (aLat, aLng, bLat, bLng) => 6371 * Math.hypot((bLng - aLng) * RAD * Math.cos(((aLat + bLat) / 2) * RAD), (bLat - aLat) * RAD)

async function overpass(query) {
  let last
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const res = await fetch(OVERPASS, {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(400_000),
      })
      if (!res.ok) throw new Error(`Overpass responded ${res.status}`)
      const json = await res.json()
      // A request that ran out of time or memory still answers 200, with part of the data.
      if (json.remark) throw new Error(`Overpass: ${json.remark}`)
      return json.elements
    } catch (err) {
      last = err
      await new Promise((r) => setTimeout(r, 15_000 * (attempt + 1)))
    }
  }
  throw last
}

const tagFilters = (tags) => Object.keys(tags).map((t) => `nwr[${t.replace('=', '="')}"][name](area.on);`).join('')

// 1. Every named stop in Ontario, one request per kind (places to eat are by far the largest).
const stops = []
for (const [kind, tags] of Object.entries(KINDS)) {
  const elements = await overpass(`[out:json][timeout:300];${ONTARIO}(${tagFilters(tags)});out center tags;`)
  const seen = []
  for (const e of elements) {
    const lat = e.lat ?? e.center?.lat
    const lng = e.lon ?? e.center?.lon
    const name = e.tags?.name?.trim()
    if (lat == null || !name || SKIP.has(name)) continue
    const tag = Object.keys(tags).find((t) => e.tags[t.split('=')[0]] === t.split('=')[1])
    if (!tag) continue
    // The same shop is often mapped twice, as a point and as its building.
    if (seen.some((s) => s.name === name && km(s.lat, s.lng, lat, lng) < 0.3)) continue
    const stop = { name, kind, type: typeFor(name, tags[tag]), lat: round(lat), lng: round(lng) }
    seen.push(stop)
    stops.push(stop)
  }
  if (seen.length < AT_LEAST[kind]) throw new Error(`Only ${seen.length} ${kind} stops came back; expected at least ${AT_LEAST[kind]}`)
  console.log(`${kind}: ${seen.length}`)
}

// 2. The parks, trails and places a page can be opened for.
const parks = JSON.parse(await readFile(new URL('../public/data/ontario-parks.json', import.meta.url), 'utf8')).parks
const everyPark = JSON.parse(await readFile(new URL('../public/data/parks-index.json', import.meta.url), 'utf8')).parks
const explore = JSON.parse(await readFile(new URL('../public/data/explore/algonquin.json', import.meta.url), 'utf8'))
const anchors = [
  ...parks.map((p) => [p.lat, p.lng]),
  ...everyPark.map((p) => [p.lat, p.lng]),
  ...explore.pois.map((p) => [p.lat, p.lng]),
  ...explore.trails.map((t) => [t.trailhead[1], t.trailhead[0]]),
]

// 3. Keep the stops a page could show: the closest few of each kind, or the one beyond reach.
const kept = new Set()
for (const [lat, lng] of anchors) {
  for (const kind of Object.keys(KINDS)) {
    const near = stops
      .filter((s) => s.kind === kind && Math.abs(s.lat - lat) < 1.2)
      .map((s) => ({ s, d: km(lat, lng, s.lat, s.lng) }))
      .filter((x) => x.d <= FAR_KM)
      .sort((a, b) => a.d - b.d)
    const within = near.filter((x) => x.d <= REACH_KM).slice(0, KEPT)
    for (const x of within.length ? within : near.slice(0, 1)) kept.add(x.s)
  }
}

// 4. Name the town each kept stop is in: the nearest settlement, larger ones reaching further.
const towns = (await overpass(`[out:json][timeout:300];${ONTARIO}node[place~"^(city|town|village|hamlet)$"][name](area.on);out;`)).map((e) => ({
  name: TOWN_NAMES[e.tags.name] ?? e.tags.name,
  lat: e.lat,
  lng: e.lon,
  reach: TOWN_REACH_KM[e.tags.place],
}))
for (const s of kept) {
  let best = null
  for (const t of towns) {
    if (Math.abs(t.lat - s.lat) > 0.2) continue
    const score = km(s.lat, s.lng, t.lat, t.lng) / t.reach
    if (score <= 1.5 && (!best || score < best.score)) best = { score, name: t.name }
  }
  if (best) s.town = best.name
}

const list = [...kept].sort((a, b) => a.kind.localeCompare(b.kind) || a.lat - b.lat || a.lng - b.lng || a.name.localeCompare(b.name))
const body = JSON.stringify(list)

// Leave the file alone when nothing changed, so the monthly run makes no empty commit.
const previous = await readFile(OUT, 'utf8').then(JSON.parse).catch(() => null)
if (previous && JSON.stringify(previous.stops) === body) {
  console.log(`No change: ${list.length} stops`)
} else {
  await writeFile(OUT, JSON.stringify({ source: 'OpenStreetMap contributors (ODbL)', generatedAt: new Date().toISOString(), stops: list }))
  console.log(`Wrote ${list.length} stops near ${anchors.length} parks, trails and places`)
}
