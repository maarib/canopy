import type { FeatureCollection, LineString, MultiLineString } from 'geojson'

// Parks Canada official trails (national parks, historic sites, marine areas).
// https://open.canada.ca/data/en/dataset/64a90e8d-5bc0-4027-8645-b5881b4068d4
const TRAILS_URL =
  'https://services2.arcgis.com/wCOMu5IS7YdSyPNx/arcgis/rest/services/vw_Trails_Sentiers_APCA_V2_FGP/FeatureServer/0/query'

export type TrailProps = { name: string | null }
export type Bounds = [west: number, south: number, east: number, north: number]

export async function fetchParksCanadaTrails(
  [w, s, e, n]: Bounds,
): Promise<FeatureCollection<LineString | MultiLineString, TrailProps>> {
  const params = new URLSearchParams({
    where: '1=1',
    geometry: `${w},${s},${e},${n}`,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'Label_e_5k_less',
    outSR: '4326',
    geometryPrecision: '5',
    f: 'geojson',
  })
  const res = await fetch(`${TRAILS_URL}?${params}`)
  if (!res.ok) throw new Error(`Parks Canada trails ${res.status}`)
  const data = await res.json()
  return {
    type: 'FeatureCollection',
    features: data.features.map((f: { geometry: LineString | MultiLineString; properties: { Label_e_5k_less: string | null } }) => ({
      type: 'Feature',
      geometry: f.geometry,
      properties: { name: f.properties.Label_e_5k_less },
    })),
  }
}

/** Snap bounds outward to a 0.5° grid so small pans reuse the cached query. */
export function snapBounds([w, s, e, n]: Bounds): Bounds {
  const step = 0.5
  return [Math.floor(w / step) * step, Math.floor(s / step) * step, Math.ceil(e / step) * step, Math.ceil(n / step) * step]
}
