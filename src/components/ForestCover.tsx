import { useQuery } from '@tanstack/react-query'
import type { MultiLineString } from 'geojson'
import { useEffect, useState } from 'react'
import { islandRing, outlineRings } from '../lib/diorama'
import { foliageAt, foliageKey } from '../lib/foliage'
import { COVER_BLEED, COVER_SIZE, forestCover, type CoverShape } from '../lib/forestCover'
import { fetchOntarioParks, type ParkReport } from '../lib/ontarioParks'
import { MAPBOX_TOKEN } from '../lib/mapStyle'
import { fetchParkBoundary } from '../lib/parkBoundaries'

type Props = {
  lat: number
  lng: number
  name: string
  /** A park's own report, used for its colors. */
  park?: ParkReport
  /** Draw this provincial park's boundary as the land, when it has one. */
  boundary?: string
  /** A trail's track, drawn across the land. */
  path?: MultiLineString
  /** Size of the island drawn when there's no boundary. */
  radiusKm?: number
}

/**
 * A detail page's cover: the place's shape as a floating piece of land with low-poly trees in
 * today's fall colors (lib/forestCover). A still image, inset to the page's content width.
 */
export function ForestCover({ lat, lng, name, park, boundary, path, radiusKm = 2.5 }: Props) {
  const parks = useQuery({ queryKey: ['ontario-parks'], queryFn: fetchOntarioParks })
  const outline = useQuery({
    queryKey: ['park-boundary', boundary ?? null],
    queryFn: () => fetchParkBoundary(boundary!),
    enabled: !!boundary,
    staleTime: Infinity,
  })
  const [cover, setCover] = useState<{ key: string; url: string }>()

  // Wait for the reports (colors) and the boundary (shape), so the cover is drawn once.
  const ready = (!!parks.data || parks.isError) && (!boundary || !outline.isPending)
  const { foliage, source } = foliageAt(lat, lng, parks.data?.parks ?? [], park)
  const shapeId = outline.data ? `park:${boundary}` : `island:${lat.toFixed(4)},${lng.toFixed(4)}:${radiusKm}`
  const key = `${shapeId}:${foliageKey(foliage)}`

  useEffect(() => {
    if (!ready || !MAPBOX_TOKEN) return
    const shape: CoverShape = {
      id: shapeId,
      rings: outline.data ? outlineRings(outline.data.geometry) : [islandRing([lng, lat], radiusKm, shapeId)],
      path,
    }
    const abort = new AbortController()
    forestCover(shape, foliage, abort.signal)
      .then((url) => !abort.signal.aborted && setCover({ key, url }))
      .catch(() => {})
    return () => abort.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the shape and foliage are captured by `key`
  }, [ready, key])

  if (!MAPBOX_TOKEN) return null
  const url = cover?.key === key ? cover.url : undefined
  return (
    <figure className="relative aspect-[3/2] overflow-x-clip [overflow-clip-margin:1.25rem]">
      {url ? (
        <img
          src={url}
          alt={`Illustration of ${name} as a small forested island in today's fall colors`}
          title={source}
          draggable={false}
          // Drawn with a margin all round and allowed to overflow the frame, so nothing is cropped.
          style={BLEED}
          className="pointer-events-none absolute max-w-none animate-fade-in select-none"
        />
      ) : (
        <div className="skeleton size-full rounded-2xl" aria-label="Drawing the cover" />
      )}
      <figcaption className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[9px] whitespace-nowrap text-[var(--ink-soft)]">
        © Mapbox © OpenStreetMap
      </figcaption>
    </figure>
  )
}

const pct = (n: number, of: number) => `${(n / of) * 100}%`
const BLEED = {
  left: pct(-COVER_BLEED, COVER_SIZE.width),
  top: pct(-COVER_BLEED, COVER_SIZE.height),
  width: pct(COVER_SIZE.width + 2 * COVER_BLEED, COVER_SIZE.width),
  height: pct(COVER_SIZE.height + 2 * COVER_BLEED, COVER_SIZE.height),
}
