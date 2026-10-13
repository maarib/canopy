import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { ChevronRight } from 'relume-icons'
import { fetchNearbyStops, REACH_KM, stopDistance, stopMapsUrl, stopsNear } from '../lib/nearbyStops'
import { ICON_TILE, LIST, ROW } from '../lib/styles'
import { AmenityIcon } from './ParkAmenities'
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
        <p className="text-sm leading-relaxed text-[var(--ink-soft)]">Nothing on the map for a long way. Stock up and fill the tank before you set out.</p>
      ) : (
        groups.map(({ kind, stops }) => (
          <div key={kind.id}>
            <h4 className="text-xs font-semibold tracking-wide text-[var(--ink-soft)] uppercase">{kind.title}</h4>
            <ul className={LIST}>
              {stops.map((s) => (
                <li key={`${s.name}-${s.lat}-${s.lng}`}>
                  <a href={stopMapsUrl(s)} target="_blank" rel="noreferrer" className={ROW}>
                    <span className={`${ICON_TILE} bg-[var(--surface-2)]`}>
                      <AmenityIcon icon={kind.icon} size={26} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{s.name}</span>
                      <span className="block truncate text-xs text-[var(--ink-soft)]">{s.town ? `${s.type} · ${s.town}` : s.type}</span>
                    </span>
                    <span className="shrink-0 text-sm tabular-nums text-[var(--ink-soft)]">{stopDistance(s.km)}</span>
                    <ChevronRight className="size-4 shrink-0 text-[var(--ink-soft)]" />
                    <span className="sr-only">Opens in Google Maps</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
      <p className="text-[11px] text-[var(--ink-soft)]">
        Distances are in a straight line; a stop further than {REACH_KM} km is shown only when nothing is closer. Each row opens in Google Maps for hours and directions. Stops from ©{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline decoration-[var(--line)] underline-offset-2 transition-colors hover:text-[var(--ink)] hover:decoration-current">
          OpenStreetMap
        </a>{' '}
        contributors.
      </p>
    </section>
  )
}
