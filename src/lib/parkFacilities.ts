import { PARK_ACTIVITIES, PARK_FACILITIES, type AmenityIcon } from '../data/amenityIcons'

/** A facility key, or [key, count] when Ontario Parks lists a count. */
type RawFacility = string | [string, number]

export type ParkFacilitiesFeed = {
  source: string
  fetchedAt: string
  labels: { facilities: Record<string, string>; activities: Record<string, string> }
  parks: Record<
    string,
    {
      name: string | null
      classification: string | null
      established: number | null
      sizeHa: number | null
      url: string
      facilities: RawFacility[]
      activities: string[]
    }
  >
}

export type Amenity = { key: string; label: string; icon: AmenityIcon; count: number | null }

export type ParkAmenities = {
  classification: string | null
  established: number | null
  sizeHa: number | null
  campsites: number | null
  activities: Amenity[]
  camping: Amenity[]
  rentals: Amenity[]
  amenities: Amenity[]
}

/** Weekly snapshot written by scripts/scrape-park-facilities.mjs. */
export async function fetchParkFacilities(): Promise<ParkFacilitiesFeed> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/park-facilities.json`)
  if (!res.ok) throw new Error(`Park facilities ${res.status}`)
  return res.json()
}

const ACTIVITY_ORDER = Object.keys(PARK_ACTIVITIES)
const rank = (key: string) => (ACTIVITY_ORDER.indexOf(key) + 1 || ACTIVITY_ORDER.length + 1)

/** Ontario Parks' "Rentals - Motorboat" → "Motorboat" */
const rentalLabel = (label: string) => label.replace(/^Rentals?\s*-\s*/i, '')

export function amenitiesFor(feed: ParkFacilitiesFeed, shortname: string): ParkAmenities | null {
  const park = feed.parks[shortname]
  if (!park) return null

  const activities = park.activities
    // "Camping" on its own duplicates the specific camping activities.
    .filter((key) => key !== 'campsites' || !park.activities.some((k) => k.startsWith('camping_')))
    .map((key) => {
      const known = PARK_ACTIVITIES[key]
      return { key, label: known?.label ?? feed.labels.activities[key] ?? key, icon: known?.icon ?? 'info', count: null }
    })
    // PARK_ACTIVITIES is ordered for fall visits (hiking and paddling first, winter last).
    .sort((a, b) => rank(a.key) - rank(b.key))

  const out: ParkAmenities = {
    classification: park.classification,
    established: park.established,
    sizeHa: park.sizeHa,
    campsites: null,
    activities,
    camping: [],
    rentals: [],
    amenities: [],
  }
  for (const raw of park.facilities) {
    const [key, count] = typeof raw === 'string' ? [raw, null] : raw
    if (key === 'campsites') {
      out.campsites = count
      continue
    }
    const known = PARK_FACILITIES[key]
    const label = feed.labels.facilities[key] ?? key
    if (known) out[known.group ?? 'amenities'].push({ key, label: known.label, icon: known.icon, count })
    else if (key.startsWith('rental_')) out.rentals.push({ key, label: rentalLabel(label), icon: 'rentals', count })
    else out.amenities.push({ key, label, icon: 'info', count })
  }
  return out
}
