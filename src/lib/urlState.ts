import type { MapLayers } from '../components/FoliageMap'
import type { TreeFilterValue } from '../components/MapControls'
import { PARK_FILTERS } from '../data/amenityIcons'
import type { ParkReport } from './ontarioParks'
import { DEFAULT_LIGHT, LIGHT_PRESETS, localDate, type LightSetting } from './mapStyle'

// Everything that makes a view shareable lives in the URL:
//   path   /region/:id · /park/:id-slug
//   query  tree=maples · do=hiking,canoe-rental · layers=reports,hexes,… · date=YYYY-MM-DD · map=lat,lng,zoom
// Defaults are omitted so links stay short.

export const DEFAULT_LAYERS: MapLayers = {
  reports: true,
  // Off until asked for, under Layers.
  outlook: false,
  hexes: true,
  sightings: true,
  trails: true,
  satellite: false,
  terrain3d: false,
  fishing: true,
}
const LAYER_KEYS = Object.keys(DEFAULT_LAYERS) as (keyof MapLayers)[]

export function readLayers(params: URLSearchParams): MapLayers {
  const raw = params.get('layers')
  if (raw === null) return DEFAULT_LAYERS
  const on = new Set(raw.split(','))
  return Object.fromEntries(LAYER_KEYS.map((k) => [k, on.has(k)])) as MapLayers
}

export function writeLayers(params: URLSearchParams, layers: MapLayers) {
  const isDefault = LAYER_KEYS.every((k) => layers[k] === DEFAULT_LAYERS[k])
  if (isDefault) params.delete('layers')
  else params.set('layers', LAYER_KEYS.filter((k) => layers[k]).join(','))
}

export const readTree = (params: URLSearchParams): TreeFilterValue => params.get('tree') ?? 'trees'
export function writeTree(params: URLSearchParams, tree: TreeFilterValue) {
  if (tree === 'trees') params.delete('tree')
  else params.set('tree', tree)
}

export const readLight = (params: URLSearchParams): LightSetting => {
  const l = params.get('light')
  return l === 'auto' || (LIGHT_PRESETS as readonly string[]).includes(l ?? '') ? (l as LightSetting) : DEFAULT_LIGHT
}
export function writeLight(params: URLSearchParams, light: LightSetting) {
  if (light === DEFAULT_LIGHT) params.delete('light')
  else params.set('light', light)
}

/** Yesterday by default: today's satellite pass is often incomplete. */
export const readDate = (params: URLSearchParams) => {
  const d = params.get('date')
  return d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : localDate(-1)
}

export type MapView = { lat: number; lng: number; zoom: number }

export function readMapView(params: URLSearchParams): MapView | null {
  const [lat, lng, zoom] = (params.get('map') ?? '').split(',').map(Number)
  if (![lat, lng, zoom].every(Number.isFinite)) return null
  return { lat, lng, zoom }
}
export const formatMapView = ({ lat, lng, zoom }: MapView) => `${lat.toFixed(4)},${lng.toFixed(4)},${zoom.toFixed(2)}`

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const parkPath = (p: ParkReport) => `/park/${p.id}-${slugify(p.location && !p.main ? `${p.name} ${p.location}` : p.name)}`
export const regionPath = (id: string) => `/region/${id}`
export const parkIdFromSlug = (slug: string) => slug.split('-')[0]

/** Park activity filters: do=hiking,canoe-rental */
export const readActivities = (params: URLSearchParams): string[] =>
  (params.get('do') ?? '').split(',').filter((id) => PARK_FILTERS.has(id))
export function writeActivities(params: URLSearchParams, ids: string[]) {
  if (ids.length) params.set('do', ids.join(','))
  else params.delete('do')
}
