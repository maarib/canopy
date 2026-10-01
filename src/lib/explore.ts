import type { MultiLineString } from 'geojson'

// Trails and places along them, built per area by scripts/build-explore.mjs.

export type PlaceKind = 'waterfall' | 'viewpoint' | 'peak' | 'lake' | 'river' | 'creek'
export type Difficulty = 'easy' | 'moderate' | 'hard' | 'backpacking'

export type AlongEntry = { poi: string; km: number; offM: number }

export type Trail = {
  id: string
  name: string
  description: string | null
  uses: string
  association: string | null
  website: string | null
  lengthKm: number
  loop: boolean
  difficulty: Difficulty
  durationH: number | null
  gainM: number
  lossM: number
  minEleM: number
  maxEleM: number
  trailhead: [number, number]
  bbox: [number, number, number, number]
  geometry: MultiLineString
  /** [km, elevation m, lng, lat] */
  profile: [number, number, number, number][]
  along: AlongEntry[]
  areaId: string
}

export type Place = {
  id: string
  kind: PlaceKind
  name: string
  lng: number
  lat: number
  osm: string
  ele?: number | null
  trails: string[]
  areaId: string
}

export type ExploreArea = {
  id: string
  name: string
  regionId: string
  generatedAt: string
  sources: Record<string, string>
  trails: Trail[]
  pois: Place[]
}

/** Areas with built data. Add an id here after running `npm run data:explore <id>`. */
export const AREA_IDS = ['algonquin'] as const

export async function fetchExploreAreas(): Promise<ExploreArea[]> {
  return Promise.all(
    AREA_IDS.map(async (id) => {
      const res = await fetch(`${import.meta.env.BASE_URL}data/explore/${id}.json`)
      if (!res.ok) throw new Error(`Explore data ${id}: ${res.status}`)
      const area = (await res.json()) as Omit<ExploreArea, 'trails' | 'pois'> & { trails: Trail[]; pois: Place[] }
      return {
        ...area,
        trails: area.trails.map((t) => ({ ...t, areaId: id })),
        pois: area.pois.map((p) => ({ ...p, areaId: id })),
      }
    }),
  )
}

// ── Identity: every kind of place has its own label, colour and icon ──

export const PLACE_KINDS: Record<PlaceKind | 'trail' | 'trailhead', { label: string; plural: string; color: string }> = {
  trail: { label: 'Trail', plural: 'Trails', color: '#2f5d3a' },
  trailhead: { label: 'Trailhead', plural: 'Trailheads', color: '#2f5d3a' },
  waterfall: { label: 'Waterfall', plural: 'Waterfalls', color: '#2b7bbf' },
  viewpoint: { label: 'Lookout', plural: 'Lookouts', color: '#d9821e' },
  peak: { label: 'Peak', plural: 'Peaks', color: '#8a5a3c' },
  lake: { label: 'Lake', plural: 'Lakes', color: '#2a8a8f' },
  river: { label: 'River', plural: 'Rivers', color: '#4a90b8' },
  creek: { label: 'Creek', plural: 'Creeks', color: '#5ba6c9' },
}

/** Lookouts, waterfalls and peaks are where people stop for photos. */
export const isPhotoSpot = (kind: PlaceKind) => kind === 'viewpoint' || kind === 'waterfall' || kind === 'peak'

export const DIFFICULTY: Record<Difficulty, { label: string; color: string }> = {
  easy: { label: 'Easy', color: '#3f7d3b' },
  moderate: { label: 'Moderate', color: '#d9821e' },
  hard: { label: 'Hard', color: '#c8102e' },
  backpacking: { label: 'Backpacking', color: '#5b4a40' },
}

export function formatDuration(hours: number | null): string {
  if (hours === null) return 'Multi-day'
  if (hours < 1) return `${Math.max(15, Math.round((hours * 60) / 15) * 15)} min`
  const h = Math.floor(hours)
  const m = Math.round(((hours - h) * 60) / 15) * 15
  return m === 60 ? `${h + 1}h` : m ? `${h}h ${m}m` : `${h}h`
}

// ── URLs ──

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const trailPath = (t: Trail) => `/trail/${t.id}-${slugify(t.name.replace(/\btrail\b/i, ''))}`
export const placePath = (p: Place) => `/place/${p.id}-${slugify(p.name)}`
export const trailIdFromSlug = (slug: string) => slug.match(/^otn-\d+/)?.[0] ?? ''
export const placeIdFromSlug = (slug: string) => slug.match(/^[a-z]+-[nwr]\d+/)?.[0] ?? ''

// ── GPX export ──

const esc = (s: string) => s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`)

export function trailGpx(trail: Trail, places: Place[]): string {
  const segs = trail.geometry.coordinates
    .map((line) => `<trkseg>${line.map(([lng, lat]) => `<trkpt lat="${lat}" lon="${lng}"/>`).join('')}</trkseg>`)
    .join('')
  const wpts = [
    `<wpt lat="${trail.trailhead[1]}" lon="${trail.trailhead[0]}"><name>Trailhead</name></wpt>`,
    ...places.map((p) => `<wpt lat="${p.lat}" lon="${p.lng}"><name>${esc(p.name)}</name><type>${p.kind}</type></wpt>`),
  ].join('')
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Canopy" xmlns="http://www.topografix.com/GPX/1/1">
<metadata><name>${esc(trail.name)}</name></metadata>${wpts}<trk><name>${esc(trail.name)}</name>${segs}</trk></gpx>`
}

export function downloadFile(filename: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }))
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
