import type { AmenityIcon } from '../data/amenityIcons'

// Ontario's public fishing access points (Ministry of Natural Resources, via Land Information
// Ontario; the data behind Fish ON-Line). Snapshot written by scripts/build-fishing-access.mjs.

export type AccessType = 'launch' | 'shore' | 'pier'

export type FishingAccess = {
  id: string
  lng: number
  lat: number
  type: AccessType
  name: string | null
  parking: boolean | null
  fee: boolean | null
  accessible: boolean | null
  surface: string | null
  ownership: string | null
  verified: number | null
  url: string | null
}

type Row = [string, number, number, AccessType, string | null, boolean | null, boolean | null, boolean | null, string | null, string | null, number | null, string | null]

export const ACCESS_TYPES: Record<AccessType, { label: string; plural: string }> = {
  launch: { label: 'Boat launch', plural: 'Boat launches' },
  shore: { label: 'Shoreline access', plural: 'Shoreline access' },
  pier: { label: 'Dock or pier', plural: 'Docks and piers' },
}

export const ACCESS_ICONS: Record<AccessType, AmenityIcon> = { launch: 'boat-launch', shore: 'fishing', pier: 'dock' }

export const FISH_ONLINE = 'https://www.lioapplications.lrc.gov.on.ca/fishonline/Index.html?viewer=FishONLine.FishONLine&locale=en-CA'

export async function fetchFishingAccess(): Promise<{ fetchedAt: string; points: FishingAccess[] }> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/fishing-access.json`)
  if (!res.ok) throw new Error(`Fishing access ${res.status}`)
  const data = (await res.json()) as { fetchedAt: string; points: Row[] }
  return {
    fetchedAt: data.fetchedAt,
    points: data.points.map(([id, lng, lat, type, name, parking, fee, accessible, surface, ownership, verified, url]) => ({
      id, lng, lat, type, name, parking, fee, accessible, surface, ownership, verified, url,
    })),
  }
}

export const accessTitle = (a: FishingAccess) => a.name ?? ACCESS_TYPES[a.type].label

const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** /fishing/103604474-brigham-lake-access-point */
export const fishingPath = (a: FishingAccess) => `/fishing/${a.id}-${slugify(accessTitle(a))}`
export const fishingIdFromSlug = (slug: string) => slug.split('-')[0]
