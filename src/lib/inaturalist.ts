// iNaturalist observations annotated "Leaves: Colored Leaves".
// Controlled term 36 = Leaves; value 39 = Colored Leaves, 40 = No Live Leaves.
// Docs: https://api.inaturalist.org/v1/docs/

const API = 'https://api.inaturalist.org/v1/observations'
const CANADA_PLACE_ID = 6712
const LEAVES_TERM = 36
export const COLORED_LEAVES = 39
export const NO_LIVE_LEAVES = 40

export type LeafObservation = {
  id: number
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
  taxon?: { name: string; preferred_common_name?: string }
  photos: { url: string; attribution: string }[]
}

export type ObservationQuery = {
  days?: number
  leafState?: typeof COLORED_LEAVES | typeof NO_LIVE_LEAVES
  near?: { lat: number; lng: number; radiusKm: number }
  perPage?: number
}

export async function fetchLeafObservations({
  days = 14,
  leafState = COLORED_LEAVES,
  near,
  perPage = 200,
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

  const items = results.flatMap((o) => {
    if (!o.location) return []
    const [lat, lng] = o.location.split(',').map(Number)
    const photo = o.photos[0]
    return [
      {
        id: o.id,
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
