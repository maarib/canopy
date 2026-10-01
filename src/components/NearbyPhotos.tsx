import { useQuery } from '@tanstack/react-query'
import { fetchLeafObservations } from '../lib/inaturalist'

export function NearbyPhotos({ lat, lng, radiusKm = 75 }: { lat: number; lng: number; radiusKm?: number }) {
  const photos = useQuery({
    queryKey: ['nearby-photos', lat.toFixed(2), lng.toFixed(2), radiusKm],
    queryFn: () => fetchLeafObservations({ days: 21, perPage: 12, near: { lat, lng, radiusKm } }).then((r) => r.items),
  })

  return (
    <section>
      <h3 className="mb-2 text-lg">Recent colour sightings nearby</h3>
      {photos.isPending && <p className="text-sm text-[var(--ink-soft)]">Loading photos…</p>}
      {photos.data?.length === 0 && (
        <p className="text-sm text-[var(--ink-soft)]">
          No coloured-leaf observations within {radiusKm} km in the last 3 weeks.
        </p>
      )}
      <div className="grid grid-cols-3 gap-1.5">
        {photos.data?.map(
          (o) =>
            o.photoUrl && (
              <a key={o.id} href={o.url} target="_blank" rel="noreferrer" className="group relative block aspect-square overflow-hidden rounded-lg">
                <img src={o.photoUrl} alt={o.species} loading="lazy" className="size-full object-cover transition group-hover:scale-105" />
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
