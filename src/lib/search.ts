import { REGIONS } from '../data/regions'
import { TREE_GROUPS } from '../data/treeGroups'
import { parkTitle, type ParkReport } from './ontarioParks'

export type SearchResult =
  | { kind: 'region'; id: string; label: string; detail: string }
  | { kind: 'park'; park: ParkReport; label: string; detail: string }
  | { kind: 'tree'; id: string; label: string; detail: string }
  | { kind: 'place'; id: string; label: string; detail: string; lat: number; lng: number; zoom: number }

/** Lowercase, strip accents (Québec → quebec) and punctuation. */
export const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .trim()

/** 3 = label starts with query, 2 = a word starts with it, 1 = contains it, 0 = no match. */
function score(query: string, text: string): number {
  const t = normalize(text)
  if (t.startsWith(query)) return 3
  if (t.split(' ').some((w) => w.startsWith(query))) return 2
  return t.includes(query) ? 1 : 0
}

export function searchLocal(rawQuery: string, parks: ParkReport[], limit = 7): SearchResult[] {
  const q = normalize(rawQuery)
  if (!q) return []
  const scored: [number, SearchResult][] = []

  for (const r of REGIONS) {
    const s = Math.max(score(q, r.name), score(q, r.highlights.join(' ')) && 1)
    if (s) scored.push([s + 0.3, { kind: 'region', id: r.id, label: r.name, detail: `${r.province} · Region` }])
  }
  for (const p of parks.filter((p) => p.main)) {
    const s = score(q, parkTitle(p))
    if (s) scored.push([s + 0.2, { kind: 'park', park: p, label: parkTitle(p), detail: `ON · Provincial park · ${p.colourChange ?? 0}% colour` }])
  }
  for (const g of TREE_GROUPS) {
    const s = score(q, g.label)
    if (s) scored.push([s + 0.1, { kind: 'tree', id: g.id, label: g.label, detail: 'Show on map' }])
  }
  return scored
    .sort((a, b) => b[0] - a[0] || a[1].label.localeCompare(b[1].label))
    .slice(0, limit)
    .map(([, r]) => r)
}

// Photon: free OpenStreetMap geocoder (fair use; we debounce and require 3+ characters).
const PHOTON = 'https://photon.komoot.io/api/'
const CANADA_BBOX = '-141,41.6,-52.6,83.2'

const ZOOM_BY_TYPE: Record<string, number> = { city: 10, town: 11, village: 12, hamlet: 12, state: 6, county: 8 }
const PROVINCE_ABBR: Record<string, string> = {
  Ontario: 'ON', Quebec: 'QC', Québec: 'QC', 'Nova Scotia': 'NS', 'New Brunswick': 'NB', 'Prince Edward Island': 'PE',
  'Newfoundland and Labrador': 'NL', Manitoba: 'MB', Saskatchewan: 'SK', Alberta: 'AB', 'British Columbia': 'BC',
  Yukon: 'YT', 'Northwest Territories': 'NT', Nunavut: 'NU',
}

type PhotonFeature = {
  geometry: { coordinates: [number, number] }
  properties: { osm_id: number; name?: string; city?: string; state?: string; country?: string; osm_value?: string; type?: string }
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q: query, limit: '6', lang: 'en', bbox: CANADA_BBOX })
  const res = await fetch(`${PHOTON}?${params}`, { signal })
  if (!res.ok) throw new Error(`Photon ${res.status}`)
  const { features } = (await res.json()) as { features: PhotonFeature[] }
  const seen = new Set<string>()
  return features.flatMap((f): SearchResult[] => {
    const p = f.properties
    if (!p.name || (p.country && p.country !== 'Canada')) return []
    const province = p.state ? (PROVINCE_ABBR[p.state] ?? p.state) : ''
    const key = `${p.name}|${province}`
    if (seen.has(key)) return [] // Photon often returns a town's boundary and its centre point
    seen.add(key)
    const kind = (p.osm_value ?? p.type ?? 'place').replace(/_/g, ' ')
    const [lng, lat] = f.geometry.coordinates
    return [
      {
        kind: 'place',
        id: String(p.osm_id),
        label: p.name,
        detail: [kind.charAt(0).toUpperCase() + kind.slice(1), p.city !== p.name ? p.city : '', province].filter(Boolean).join(' · '),
        lat,
        lng,
        zoom: ZOOM_BY_TYPE[p.osm_value ?? ''] ?? 12,
      },
    ]
  })
}
