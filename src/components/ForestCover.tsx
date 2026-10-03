import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { foliageAt } from '../lib/foliage'
import { forestCover } from '../lib/forestCover'
import { fetchOntarioParks, type ParkReport } from '../lib/ontarioParks'
import { MAPBOX_TOKEN } from '../lib/mapStyle'

/**
 * A detail page's cover: an isometric snapshot of the forest around the place in today's colors
 * (lib/forestCover). A still image, inset to the page's content width.
 */
export function ForestCover({ lat, lng, name, park }: { lat: number; lng: number; name: string; park?: ParkReport }) {
  const parks = useQuery({ queryKey: ['ontario-parks'], queryFn: fetchOntarioParks })
  const [cover, setCover] = useState<{ key: string; url: string }>()
  // Wait for the park reports (cached by the app), so the first drawing already has live colors.
  const ready = !!parks.data || parks.isError
  const { foliage, source } = foliageAt(lat, lng, parks.data?.parks ?? [], park)
  const key = `${lat},${lng}`

  useEffect(() => {
    if (!ready || !MAPBOX_TOKEN) return
    const abort = new AbortController()
    forestCover(lng, lat, foliage, abort.signal)
      .then((url) => !abort.signal.aborted && setCover({ key, url }))
      .catch(() => {})
    return () => abort.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- foliage is derived from these
  }, [ready, lat, lng, foliageMix(foliage)])

  if (!MAPBOX_TOKEN) return null
  const url = cover?.key === key ? cover.url : undefined
  return (
    <figure className="relative aspect-video overflow-hidden rounded-2xl bg-[var(--surface-2)]">
      {url ? (
        <img
          src={url}
          alt={`Illustrated forest around ${name} in today's fall colors`}
          title={source}
          draggable={false}
          className="size-full animate-fade-in object-cover select-none"
        />
      ) : (
        <div className="skeleton size-full rounded-none" aria-label="Drawing the forest cover" />
      )}
      <figcaption className="pointer-events-none absolute right-2 bottom-1.5 text-[9px] text-[#2a211c]/60">© Mapbox © OpenStreetMap</figcaption>
    </figure>
  )
}

const foliageMix = (f: ReturnType<typeof foliageAt>['foliage']) => [f.green, f.bare, f.hues.red, f.hues.orange, f.hues.yellow].join()
