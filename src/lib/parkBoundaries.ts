import type { Feature, MultiPolygon, Polygon } from 'geojson'

/** A provincial park's regulated boundary, written by scripts/build-park-boundaries.mjs. */
export type ParkBoundary = Feature<Polygon | MultiPolygon, { name: string }> & { bbox: [number, number, number, number] }

/** One file per park, named by its Ontario Parks shortname. Null when the park has no outline. */
export async function fetchParkBoundary(shortname: string): Promise<ParkBoundary | null> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/park-boundaries/${shortname}.json`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Park boundary ${res.status}`)
  // The dev server answers unknown paths with the app's HTML instead of a 404.
  if (!res.headers.get('content-type')?.includes('json')) return null
  return (await res.json()) as ParkBoundary
}
