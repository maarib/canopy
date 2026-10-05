// Mapbox Standard basemap, configured for Canopy: a choice of looks (theme, color overrides or a
// custom color grade), fewer labels, and a light preset.
// Config reference: https://docs.mapbox.com/map-styles/standard/guides/

import { gradeData, type GradeId } from './colorGrades'

export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
export const MAPBOX_STYLE = 'mapbox://styles/mapbox/standard'
export const MAPBOX_DEM = 'mapbox://mapbox.mapbox-terrain-dem-v1'

export const LIGHT_PRESETS = ['dawn', 'day', 'dusk', 'night'] as const
export type LightPreset = (typeof LIGHT_PRESETS)[number]
/** 'auto' follows the system color scheme (night in dark mode, day otherwise). */
export type LightSetting = LightPreset | 'auto'

/** Dawn: warm, low light that suits fall color. 'auto' is still on offer under Layers. */
export const DEFAULT_LIGHT: LightSetting = 'dawn'

export function resolveLight(setting: LightSetting, dark: boolean): LightPreset {
  return setting === 'auto' ? (dark ? 'night' : 'day') : setting
}

type Config = Record<string, string | number | boolean>

/** Labels Canopy hides on every look: shop and transit clutter. */
const QUIET: Config = { showPointOfInterestLabels: false, showTransitLabels: false, showPedestrianRoads: false }
/** Warm land, olive greenspace and slate water: the palette Canopy's map launched with. */
const WARM: Config = { colorLand: '#efe6d6', colorGreenspace: '#d8d6ae', colorWater: '#a7c2cb' }
const grade = (id: GradeId): Config => ({ theme: 'custom', 'theme-data': gradeData(id), ...WARM })

export type MapStyleId = 'monochrome' | 'paper' | 'classic' | 'autumn' | 'ink' | 'riso' | 'standard' | 'satellite'

export type MapStyle = {
  id: MapStyleId
  label: string
  /** Land, greenspace, water and road colors for the picker's preview. */
  swatch: [string, string, string, string]
  url: string
  config: () => Config
}

export const MAP_STYLES: MapStyle[] = [
  { id: 'monochrome', label: 'Monochrome', swatch: ['#efefef', '#dcdcdc', '#c7c9cc', '#ffffff'], url: MAPBOX_STYLE, config: () => ({ theme: 'monochrome' }) },
  {
    id: 'paper',
    label: 'Paper',
    swatch: ['#f6f1ea', '#dcdcb2', '#9dbcc6', '#d8b48a'],
    url: MAPBOX_STYLE,
    config: () => ({
      colorLand: '#f6f1ea',
      colorGreenspace: '#dcdcb2',
      colorWater: '#9dbcc6',
      colorRoads: '#efe4d4',
      colorTrunks: '#e2cfb4',
      colorMotorways: '#d8b48a',
      roadsBrightness: 0.2,
      colorBuildings: '#efe4d4',
      colorPlaceLabels: '#3b2f2a',
      colorRoadLabels: '#6f625a',
      colorAdminBoundaries: '#c8102e',
    }),
  },
  { id: 'classic', label: 'Faded', swatch: ['#ece6dc', '#d6d3b4', '#b3c6cc', '#f4f0ea'], url: MAPBOX_STYLE, config: () => ({ theme: 'faded', ...WARM }) },
  { id: 'autumn', label: 'Autumn film', swatch: ['#f1e2c4', '#cbb978', '#a9b7b2', '#f6e9d0'], url: MAPBOX_STYLE, config: () => grade('autumn') },
  { id: 'ink', label: 'Bark & spruce', swatch: ['#e9dfca', '#2f5d3a', '#6f8a6a', '#fffdf9'], url: MAPBOX_STYLE, config: () => grade('ink') },
  { id: 'riso', label: 'Riso print', swatch: ['#efe0c2', '#e8730c', '#7a3b2e', '#fbf6ee'], url: MAPBOX_STYLE, config: () => grade('riso') },
  { id: 'standard', label: 'Standard', swatch: ['#f4efec', '#bfe8b4', '#99d6ff', '#ffffff'], url: MAPBOX_STYLE, config: () => ({}) },
  { id: 'satellite', label: 'Satellite', swatch: ['#4a5236', '#2f3d26', '#1f3340', '#c9c2b0'], url: 'mapbox://styles/mapbox/standard-satellite', config: () => ({}) },
]

export const DEFAULT_MAP_STYLE: MapStyleId = 'satellite'
export const mapStyleById = (id: MapStyleId) => MAP_STYLES.find((s) => s.id === id) ?? MAP_STYLES[0]

/** The `basemap` config for a look under a light preset. */
export function basemapConfig(id: MapStyleId, light: LightPreset): Config {
  // Standard Satellite has no theme, colors or 3D objects to set.
  if (id === 'satellite') return { ...QUIET, lightPreset: light }
  return { ...mapStyleById(id).config(), ...QUIET, lightPreset: light, show3dObjects: true }
}

// The chosen look is a personal preference, so it's kept on this device rather than in shared links.
const STYLE_KEY = 'canopy:map-style'
export function readMapStyle(): MapStyleId {
  try {
    const v = localStorage.getItem(STYLE_KEY)
    return MAP_STYLES.some((s) => s.id === v) ? (v as MapStyleId) : DEFAULT_MAP_STYLE
  } catch {
    return DEFAULT_MAP_STYLE
  }
}
export function writeMapStyle(id: MapStyleId) {
  try {
    if (id === DEFAULT_MAP_STYLE) localStorage.removeItem(STYLE_KEY)
    else localStorage.setItem(STYLE_KEY, id)
  } catch {
    // Storage blocked (private window): the choice lasts for this visit only.
  }
}

/** NASA GIBS daily VIIRS true-color mosaic for a given date (YYYY-MM-DD). */
export const satelliteTiles = (date: string) =>
  `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_NOAA20_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`

/** Local calendar date as YYYY-MM-DD, `offsetDays` from today. */
export function localDate(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
