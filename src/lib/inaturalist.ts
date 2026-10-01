// iNaturalist observations annotated "Leaves: Colored Leaves".
// Controlled term 36 = Leaves; value 39 = Colored Leaves, 40 = No Live Leaves.
// Uses API v2 with `fields`, so each page is ~160 KB instead of ~9 MB on v1.
// Docs: https://api.inaturalist.org/v2/docs/

import { groupFor } from '../data/treeGroups'

const API = 'https://api.inaturalist.org/v2/observations'
const FIELDS = [
  'id',
  'location',
  'observed_on',
  'place_guess',
  'uri',
  'taxon.id',
  'taxon.name',
  'taxon.preferred_common_name',
  'taxon.ancestor_ids',
  'photos.url',
  'photos.attribution',
].join(',')
const CANADA_PLACE_ID = 6712
const LEAVES_TERM = 36
const PAGE_SIZE = 200 // v2 maximum
export const COLORED_LEAVES = 39
export const NO_LIVE_LEAVES = 40

export type LeafState = 'colored' | 'bare'

export type LeafObservation = {
  id: number
  state: LeafState
  taxonId: number | null
  /** Tree group id from src/data/treeGroups.ts, or null for other plants. */
  group: string | null
  lat: number
  lng: number
  species: string
  scientificName: string
  observedOn: string
  placeGuess: string
  photoUrl: string | null
  photoAttribution: string | null
  url: string
}

type RawObservation = {
  id: number
  location: string | null
  observed_on: string | null
  place_guess: string | null
  uri: string
  taxon?: { id: number; name: string; preferred_common_name?: string; ancestor_ids?: number[] }
  photos?: { url: string; attribution: string }[]
}

export type ObservationQuery = {
  days?: number
  leafState?: typeof COLORED_LEAVES | typeof NO_LIVE_LEAVES
  near?: { lat: number; lng: number; radiusKm: number }
  perPage?: number
  page?: number
  signal?: AbortSignal
}

export async function fetchLeafObservations({
  days = 14,
  leafState = COLORED_LEAVES,
  near,
  perPage = PAGE_SIZE,
  page = 1,
  signal,
}: ObservationQuery = {}): Promise<{ total: number; items: LeafObservation[] }> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)
  const params = new URLSearchParams({
    term_id: String(LEAVES_TERM),
    term_value_id: String(leafState),
    iconic_taxa: 'Plantae',
    d1: since,
    photos: 'true',
    geo: 'true',
    order_by: 'observed_on',
    per_page: String(perPage),
    page: String(page),
    fields: FIELDS,
  })
  if (near) {
    params.set('lat', String(near.lat))
    params.set('lng', String(near.lng))
    params.set('radius', String(near.radiusKm))
  } else {
    params.set('place_id', String(CANADA_PLACE_ID))
  }

  const res = await fetch(`${API}?${params}`, { signal })
  if (!res.ok) throw new Error(`iNaturalist ${res.status}`)
  const { results, total_results } = (await res.json()) as { results: RawObservation[]; total_results: number }

  const items = results.flatMap((o): LeafObservation[] => {
    if (!o.location) return []
    const [lat, lng] = o.location.split(',').map(Number)
    const photo = o.photos?.[0]
    return [
      {
        id: o.id,
        state: leafState === NO_LIVE_LEAVES ? 'bare' : 'colored',
        taxonId: o.taxon?.id ?? null,
        group: groupFor(o.taxon?.ancestor_ids ?? []),
        lat,
        lng,
        species: o.taxon?.preferred_common_name ?? o.taxon?.name ?? 'Unknown plant',
        scientificName: o.taxon?.name ?? '',
        observedOn: o.observed_on ?? '',
        placeGuess: o.place_guess ?? '',
        photoUrl: photo ? photo.url.replace('/square.', '/medium.') : null,
        photoAttribution: photo?.attribution ?? null,
        url: o.uri,
      },
    ]
  })
  return { total: total_results, items }
}

// ── Season sightings: streamed page by page ──────────────────

export type SeasonSightings = {
  items: LeafObservation[]
  coloredTotal: number
  bareTotal: number
  /** Pages loaded vs expected, for a progress bar. */
  loaded: number
  expected: number
  complete: boolean
}

export const EMPTY_SIGHTINGS: SeasonSightings = { items: [], coloredTotal: 0, bareTotal: 0, loaded: 0, expected: 2, complete: false }

type Chunk = {
  items: LeafObservation[]
  /** How many API pages this chunk represents. */
  pages: number
  coloredTotal?: number
  bareTotal?: number
  expected?: number
  complete?: boolean
}

export function reduceSightings(acc: SeasonSightings, chunk: Chunk): SeasonSightings {
  return {
    items: chunk.items.length ? [...acc.items, ...chunk.items] : acc.items,
    coloredTotal: chunk.coloredTotal ?? acc.coloredTotal,
    bareTotal: chunk.bareTotal ?? acc.bareTotal,
    loaded: acc.loaded + chunk.pages,
    expected: chunk.expected ?? acc.expected,
    complete: chunk.complete ?? false,
  }
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Every coloured-leaf and leafless sighting in Canada over the last `days`. The first page of
 * each arrives together so the map fills in fast; the rest follow politely (~1 request/second,
 * as iNaturalist asks) and are yielded one page at a time.
 */
export async function* streamSeasonSightings(days = 14, maxPages = 6, signal?: AbortSignal): AsyncGenerator<Chunk> {
  const [colored, bare] = await Promise.all([
    fetchLeafObservations({ days, leafState: COLORED_LEAVES, signal }),
    fetchLeafObservations({ days, leafState: NO_LIVE_LEAVES, signal }),
  ])
  const pagesFor = (total: number) => Math.min(maxPages, Math.max(1, Math.ceil(total / PAGE_SIZE)))
  const coloredPages = pagesFor(colored.total)
  const barePages = pagesFor(bare.total)
  const expected = coloredPages + barePages
  yield { items: [...colored.items, ...bare.items], pages: 2, coloredTotal: colored.total, bareTotal: bare.total, expected }

  const rest: [typeof COLORED_LEAVES | typeof NO_LIVE_LEAVES, number][] = [
    ...Array.from({ length: coloredPages - 1 }, (_, i) => [COLORED_LEAVES, i + 2] as [typeof COLORED_LEAVES, number]),
    ...Array.from({ length: barePages - 1 }, (_, i) => [NO_LIVE_LEAVES, i + 2] as [typeof NO_LIVE_LEAVES, number]),
  ]
  for (const [leafState, page] of rest) {
    await pause(700)
    const batch = await fetchLeafObservations({ days, leafState, page, signal })
    yield { items: batch.items, pages: 1 }
  }
  yield { items: [], pages: 0, complete: true }
}

// ── Device cache: makes reopening the app instant ────────────

const CACHE_KEY = 'canopy:sightings:v2'
const CACHE_MAX_AGE = 30 * 60_000

export function readCachedSightings(): { data: SeasonSightings; savedAt: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw) as { data: SeasonSightings; savedAt: number }
    return Date.now() - cached.savedAt < CACHE_MAX_AGE && cached.data.complete ? cached : null
  } catch {
    return null
  }
}

export function writeCachedSightings(data: SeasonSightings) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, savedAt: Date.now() }))
  } catch {
    // Storage full or blocked (private mode): the app works without the cache.
  }
}

export function countByGroup(items: LeafObservation[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const o of items) if (o.group) counts.set(o.group, (counts.get(o.group) ?? 0) + 1)
  return counts
}
