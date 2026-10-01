// Mapbox Standard basemap, configured for Canopy: faded theme so our data leads,
// warm autumn land/greenspace/water, fewer labels, and a light preset.
// Config reference: https://docs.mapbox.com/map-styles/standard/guides/

export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined
export const MAPBOX_STYLE = 'mapbox://styles/mapbox/standard'
export const MAPBOX_DEM = 'mapbox://mapbox.mapbox-terrain-dem-v1'

export const LIGHT_PRESETS = ['dawn', 'day', 'dusk', 'night'] as const
export type LightPreset = (typeof LIGHT_PRESETS)[number]
/** 'auto' follows the system colour scheme (night in dark mode, day otherwise). */
export type LightSetting = LightPreset | 'auto'

export function resolveLight(setting: LightSetting, dark: boolean): LightPreset {
  return setting === 'auto' ? (dark ? 'night' : 'day') : setting
}

export function standardConfig(light: LightPreset): Record<string, string | boolean> {
  return {
    theme: 'faded',
    lightPreset: light,
    colorLand: '#efe6d6',
    colorGreenspace: '#d8d6ae',
    colorWater: '#a7c2cb',
    showPointOfInterestLabels: false,
    showTransitLabels: false,
    showPedestrianRoads: false,
    show3dObjects: true,
  }
}

/** NASA GIBS daily VIIRS true-colour mosaic for a given date (YYYY-MM-DD). */
export const satelliteTiles = (date: string) =>
  `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_NOAA20_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`

/** Local calendar date as YYYY-MM-DD, `offsetDays` from today. */
export function localDate(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
