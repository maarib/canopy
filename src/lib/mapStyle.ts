import type { StyleSpecification } from 'maplibre-gl'

// OpenFreeMap basemaps (free, no key), re-tinted with an autumn palette.
const BASE = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
}

type Palette = Record<'background' | 'water' | 'wood' | 'park' | 'residential' | 'boundary', string>

const PALETTE: Record<'light' | 'dark', Palette> = {
  light: {
    background: '#f3ede3',
    water: '#bccfd4',
    wood: '#e4dcc8',
    park: '#dfe1cc',
    residential: '#ece4d8',
    boundary: '#b6a594',
  },
  dark: {
    background: '#16120f',
    water: '#0e1a1f',
    wood: '#211a14',
    park: '#1e2117',
    residential: '#1b1612',
    boundary: '#4d4036',
  },
}

function tint(style: StyleSpecification, p: Palette): StyleSpecification {
  const layers = style.layers.map((layer) => {
    const id = layer.id
    const set = (prop: string, color: string) => ({ ...layer, paint: { ...layer.paint, [prop]: color } }) as typeof layer
    if (id === 'background') return set('background-color', p.background)
    if (id === 'water') return set('fill-color', p.water)
    if (id === 'waterway') return set('line-color', p.water)
    if (id === 'landcover_wood') return set('fill-color', p.wood)
    if (id === 'park' || id === 'landuse_park') return set('fill-color', p.park)
    if (id === 'landuse_residential') return set('fill-color', p.residential)
    if (id.startsWith('boundary')) return set('line-color', p.boundary)
    return layer
  })
  return { ...style, layers }
}

const cache = new Map<string, Promise<StyleSpecification>>()

export function loadAutumnStyle(scheme: 'light' | 'dark'): Promise<StyleSpecification> {
  let style = cache.get(scheme)
  if (!style) {
    style = fetch(BASE[scheme])
      .then((r) => r.json() as Promise<StyleSpecification>)
      .then((s) => tint(s, PALETTE[scheme]))
    cache.set(scheme, style)
  }
  return style
}

/** First symbol (label) layer, so our data layers sit under place names. */
export function firstLabelLayerId(style: StyleSpecification): string | undefined {
  return style.layers.find((l) => l.type === 'symbol')?.id
}

export const TERRAIN_TILES = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'

/** NASA GIBS daily VIIRS true-colour mosaic for a given date (YYYY-MM-DD). */
export const satelliteTiles = (date: string) =>
  `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_NOAA20_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`

/** Local calendar date as YYYY-MM-DD, `offsetDays` from today. */
export function localDate(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
