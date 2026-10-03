import type { Region } from './regions'

export type ProvinceCode = Region['province']

/**
 * Provinces in the search's "Where". Ontario has the full experience (parks, trails, fishing);
 * the others have fall color regions and sightings for now. Bounds frame the southern band
 * where the color is, as [west, south, east, north].
 */
export const PROVINCES: { code: ProvinceCode; name: string; full: boolean; bounds: [number, number, number, number] }[] = [
  { code: 'ON', name: 'Ontario', full: true, bounds: [-91, 41.7, -74.3, 50] },
  { code: 'QC', name: 'Quebec', full: false, bounds: [-79.5, 45, -64, 50.5] },
  { code: 'NS', name: 'Nova Scotia', full: false, bounds: [-66.4, 43.4, -59.7, 47.1] },
  { code: 'NB', name: 'New Brunswick', full: false, bounds: [-69.1, 44.6, -63.7, 48.1] },
  { code: 'PE', name: 'Prince Edward Island', full: false, bounds: [-64.5, 45.9, -61.9, 47.1] },
  { code: 'MB', name: 'Manitoba', full: false, bounds: [-102, 49, -95, 54] },
  { code: 'AB', name: 'Alberta', full: false, bounds: [-120, 49, -110, 54.5] },
  { code: 'BC', name: 'British Columbia', full: false, bounds: [-128, 48.3, -114, 53] },
]

export const PROVINCE_BY_CODE = new Map(PROVINCES.map((p) => [p.code, p] as const))
