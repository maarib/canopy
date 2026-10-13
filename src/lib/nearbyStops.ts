import type { PackIcon } from '../data/amenityIcons'

// Where to buy food, eat and fill up near a park, trail or place. The stops come from
// OpenStreetMap (scripts/build-nearby-stops.mjs keeps the ones closest to each page's place);
// a page finds its own nearest by distance. No hours are shown: each row opens the stop in
// Google Maps, which keeps them current.

export type StopKind = 'groceries' | 'eat' | 'gas' | 'alcohol' | 'outfitter'
export type Stop = { name: string; kind: StopKind; type: string; town?: string; lat: number; lng: number }
export type NearStop = Stop & { km: number }

export const STOP_KINDS: { id: StopKind; title: string; icon: PackIcon }[] = [
  { id: 'groceries', title: 'Groceries and supplies', icon: 'park-store' },
  { id: 'eat', title: 'Places to eat', icon: 'food' },
  { id: 'gas', title: 'Gas', icon: 'gas' },
  { id: 'alcohol', title: 'Beer, wine and spirits', icon: 'liquor' },
  { id: 'outfitter', title: 'Outfitters', icon: 'outfitter' },
]

// These three match scripts/build-nearby-stops.mjs.
/** How far a stop can be and still count as nearby. */
export const REACH_KM = 40
/** With nothing of a kind in reach, the single closest within this is shown instead. */
export const FAR_KM = 120
/** Rows shown for each kind. */
const SHOWN = 3

export async function fetchNearbyStops(): Promise<Stop[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/nearby-stops.json`)
  if (!res.ok) throw new Error(`Nearby stops responded ${res.status}`)
  return (await res.json()).stops
}

const RAD = Math.PI / 180
const km = (aLat: number, aLng: number, bLat: number, bLng: number) => 6371 * Math.hypot((bLng - aLng) * RAD * Math.cos(((aLat + bLat) / 2) * RAD), (bLat - aLat) * RAD)

/** The stops to show for a point, by kind, closest first. Kinds with nothing are left out. */
export function stopsNear(stops: Stop[], lat: number, lng: number): { kind: (typeof STOP_KINDS)[number]; stops: NearStop[] }[] {
  const near = stops
    .filter((s) => Math.abs(s.lat - lat) < 1.2)
    .map((s) => ({ ...s, km: km(lat, lng, s.lat, s.lng) }))
    .filter((s) => s.km <= FAR_KM)
    .sort((a, b) => a.km - b.km)
  return STOP_KINDS.map((kind) => {
    const all = near.filter((s) => s.kind === kind.id)
    const within = all.filter((s) => s.km <= REACH_KM).slice(0, SHOWN)
    return { kind, stops: within.length ? within : all.slice(0, 1) }
  }).filter((g) => g.stops.length)
}

/** The stop in Google Maps, for hours, reviews and directions. */
export const stopMapsUrl = (s: Stop) => `https://www.google.com/maps/search/${encodeURIComponent(s.name)}/@${s.lat},${s.lng},15z`

export const stopDistance = (d: number) => (d < 10 ? `${d.toFixed(1)} km` : `${Math.round(d)} km`)
