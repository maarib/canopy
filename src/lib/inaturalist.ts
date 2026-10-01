// iNaturalist observations annotated "Leaves: Colored Leaves".
// Controlled term 36 = Leaves; value 39 = Colored Leaves, 40 = No Live Leaves.
// Docs: https://api.inaturalist.org/v1/docs/

import { groupFor } from '../data/treeGroups'

const API = 'https://api.inaturalist.org/v1/observations'
const CANADA_PLACE_ID = 6712
const LEAVES_TERM = 36
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
  photos: { url: string; attribution: string }[]
}

export type ObservationQuery = {
  days?: number
  leafState?: typeof COLORED_LEAVES | typeof NO_LIVE_LEAVES
  near?: { lat: number; lng: number; radiusKm: number }
  perPage?: number
  page?: number
}

export async function fetchLeafObservations({
  days = 14,
  leafState = COLORED_LEAVES,
  near,
  perPage = 200,
  page = 1,
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
  })
  if (near) {
    params.set('lat', String(near.lat))
    params.set('lng', String(near.lng))
    params.set('radius', String(near.radiusKm))
  } else {
    params.set('place_id', String(CANADA_PLACE_ID))
  }

  const res = await fetch(`${API}?${params}`)
  if (!res.ok) throw new Error(`iNaturalist ${res.status}`)
  const { results, total_results } = (await res.json()) as { results: RawObservation[]; total_results: number }

  const items = results.flatMap((o): LeafObservation[] => {
    if (!o.location) return []
    const [lat, lng] = o.location.split(',').map(Number)
    const photo = o.photos[0]
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

/**
 * Every coloured-leaf and leafless sighting in Canada over the last `days`,
 * paging politely (iNat asks for about 1 request/second).
 */
export async function fetchSeasonSightings(days = 14, maxPages = 6) {
  const items: LeafObservation[] = []
  let coloredTotal = 0
  let bareTotal = 0
  for (const leafState of [COLORED_LEAVES, NO_LIVE_LEAVES] as const) {
    for (let page = 1; page <= maxPages; page++) {
      if (page > 1) await new Promise((r) => setTimeout(r, 1000))
      const batch = await fetchLeafObservations({ days, leafState, page })
      items.push(...batch.items)
      if (leafState === COLORED_LEAVES) coloredTotal = batch.total
      else bareTotal = batch.total
      if (page * 200 >= batch.total) break
    }
  }
  return { items, coloredTotal, bareTotal }
}

export function countByGroup(items: LeafObservation[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const o of items) if (o.group) counts.set(o.group, (counts.get(o.group) ?? 0) + 1)
  return counts
}
