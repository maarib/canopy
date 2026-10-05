import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { fetchLeafObservations } from '../lib/inaturalist'
import { Skeleton } from './ui'

export function NearbyPhotos({ lat, lng, radiusKm = 75 }: { lat: number; lng: number; radiusKm?: number }) {
  const photos = useQuery({
    queryKey: ['nearby-photos', lat.toFixed(2), lng.toFixed(2), radiusKm],
    queryFn: ({ signal }) => fetchLeafObservations({ days: 21, perPage: 12, near: { lat, lng, radiusKm }, signal }).then((r) => r.items),
  })

  return (
    <section>
      <h3 className="mb-2 text-lg">Recent color sightings nearby</h3>
      {photos.isPending && (
        <div className="grid grid-cols-3 gap-1.5" role="status" aria-label="Loading photos">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      )}
      {photos.data?.length === 0 && (
        <p className="text-sm text-[var(--ink-soft)]">
          No colored-leaf observations within {radiusKm} km in the last 3 weeks.
        </p>
      )}
      <div className="grid grid-cols-3 gap-1.5">
        {photos.data?.map(
          (o) =>
            o.photoUrl && (
              <a key={o.id} href={o.url} target="_blank" rel="noreferrer" className="group relative block aspect-square overflow-hidden rounded-lg">
                {/* The caption under the photo names it, so the image itself is decorative. */}
                <Photo src={o.photoUrl} alt="" />
                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 px-1.5 pt-4 pb-1 text-[11px] text-white">
                  {o.species}
                </span>
              </a>
            ),
        )}
      </div>
      {!!photos.data?.length && (
        <p className="mt-1.5 text-[11px] text-[var(--ink-soft)]">Photos from iNaturalist observers (CC licences, tap for credit).</p>
      )}
    </section>
  )
}

/** Shimmers until the image has decoded, then fades in, so the grid never jumps. */
function Photo({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <>
      {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        width={240}
        height={240}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`size-full object-cover transition duration-300 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  )
}
