import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { fetchNearbyStops, stopDistance, stopMapsUrl, stopsNear } from '../lib/nearbyStops'
import { ICON_TILE, LIST, ROW_BESIDE } from '../lib/styles'
import { stopRefFor } from '../lib/trips'
import { AmenityIcon } from './ParkAmenities'
import { SaveButton } from './SaveButton'
import { Skeleton } from './ui'

/** Groceries, places to eat, gas, beer and wine, and outfitters near a point. */
export function NearbyStops({ lat, lng }: { lat: number; lng: number }) {
  const feed = useQuery({ queryKey: ['nearby-stops'], queryFn: fetchNearbyStops, staleTime: Infinity })
  const groups = useMemo(() => (feed.data ? stopsNear(feed.data, lat, lng) : []), [feed.data, lat, lng])

  if (feed.isPending)
    return (
      <section role="status" aria-label="Loading nearby stops" className="space-y-2">
        <Skeleton className="h-5 w-24" />
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex min-h-14 items-center gap-3">
            <Skeleton className="size-10 rounded-xl" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </section>
    )
  // The page is complete without this list, so a failed load leaves it out.
  if (feed.isError) return null

  return (
    <section className="space-y-3">
      <h3 className="text-lg">Nearby</h3>
      {groups.length === 0 ? (
        <p className="text-sm leading-relaxed text-[var(--ink-soft)]">Nothing nearby.</p>
      ) : (
        groups.map(({ kind, stops }) => (
          <div key={kind.id}>
            <h4 className="text-xs font-semibold tracking-wide text-[var(--ink-soft)] uppercase">{kind.title}</h4>
            <ul className={LIST}>
              {stops.map((s) => (
                <li key={`${s.name}-${s.lat}-${s.lng}`} className="flex items-center gap-2">
                  <a href={stopMapsUrl(s)} target="_blank" rel="noreferrer" className={ROW_BESIDE}>
                    <span className={`${ICON_TILE} bg-[var(--surface-2)]`}>
                      <AmenityIcon icon={kind.icon} size={26} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{s.name}</span>
                      <span className="block truncate text-xs text-[var(--ink-soft)]">{s.town ? `${s.type} · ${s.town}` : s.type}</span>
                    </span>
                    <span className="shrink-0 text-sm tabular-nums text-[var(--ink-soft)]">{stopDistance(s.km)}</span>
                    <span className="sr-only">Opens in Google Maps</span>
                  </a>
                  <SaveButton compact stopRef={stopRefFor(s)} name={s.name} />
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  )
}
