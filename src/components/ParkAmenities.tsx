import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { amenityIconUrl, type AmenityIcon } from '../data/amenityIcons'
import { amenitiesFor, fetchParkFacilities, type Amenity } from '../lib/parkFacilities'
import { Skeleton } from './ui'

export function AmenityIcon({ icon, size = 24, className = '' }: { icon: AmenityIcon; size?: number; className?: string }) {
  return (
    <img
      src={amenityIconUrl(icon, size)}
      width={size}
      height={size}
      alt=""
      loading="lazy"
      decoding="async"
      className={`shrink-0 ${className}`}
    />
  )
}

const ACTIVITY_PREVIEW = 8

function Tile({ a }: { a: Amenity }) {
  return (
    <li className="flex items-center gap-2.5 rounded-xl bg-[var(--surface-2)] px-2.5 py-2 text-sm">
      <AmenityIcon icon={a.icon} />
      <span className="min-w-0 flex-1 leading-tight">{a.label}</span>
      {a.count != null && a.count > 1 && <span className="text-xs tabular-nums text-[var(--ink-soft)]">{a.count.toLocaleString('en-CA')}</span>}
    </li>
  )
}

function Group({ title, items }: { title: string; items: Amenity[] }) {
  if (!items.length) return null
  return (
    <div>
      <h4 className="mb-1.5 text-xs font-semibold tracking-wide text-[var(--ink-soft)] uppercase">{title}</h4>
      <ul className="grid grid-cols-2 gap-1.5">
        {items.map((a) => (
          <Tile key={a.key} a={a} />
        ))}
      </ul>
    </div>
  )
}

/** Activities and facilities from the park's Ontario Parks page. */
export function ParkAmenities({ shortname }: { shortname: string }) {
  const feed = useQuery({ queryKey: ['park-facilities'], queryFn: fetchParkFacilities, staleTime: Infinity })
  const [allActivities, setAllActivities] = useState(false)

  if (feed.isPending)
    return (
      <section role="status" aria-label="Loading activities and facilities" className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-2 gap-1.5">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-10 rounded-xl" />
          ))}
        </div>
      </section>
    )
  const park = feed.data && amenitiesFor(feed.data, shortname)
  if (!park) return null

  const activities = allActivities ? park.activities : park.activities.slice(0, ACTIVITY_PREVIEW)
  const hidden = park.activities.length - activities.length
  return (
    <>
      {park.activities.length > 0 && (
        <section>
          <h3 className="mb-2 text-lg">Things to do</h3>
          <ul className="flex flex-wrap gap-1.5">
            {activities.map((a) => (
              <li key={a.key} className="flex items-center gap-1.5 rounded-full border border-[var(--line)] py-1 pr-3 pl-1.5 text-sm">
                <AmenityIcon icon={a.icon} size={20} />
                {a.label}
              </li>
            ))}
            {(hidden > 0 || allActivities) && park.activities.length > ACTIVITY_PREVIEW && (
              <li>
                <button
                  onClick={() => setAllActivities(!allActivities)}
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-maple transition-colors hover:bg-maple/10"
                >
                  {allActivities ? 'Show fewer' : `Show ${hidden} more`}
                </button>
              </li>
            )}
          </ul>
        </section>
      )}

      {(park.camping.length > 0 || park.amenities.length > 0 || park.rentals.length > 0) && (
        <section className="space-y-4">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-lg">Facilities</h3>
            {park.campsites != null && (
              <span className="text-sm text-[var(--ink-soft)]">{park.campsites.toLocaleString('en-CA')} campsites</span>
            )}
          </div>
          <Group title="Camping" items={park.camping} />
          <Group title="On site" items={park.amenities} />
          <Group title="Rentals" items={park.rentals} />
          <p className="text-[11px] text-[var(--ink-soft)]">
            Some facilities are seasonal or limited to parts of the park. Icons by{' '}
            <a href="https://icons8.com" target="_blank" rel="noreferrer" className="underline decoration-[var(--line)] underline-offset-2 transition-colors hover:text-[var(--ink)] hover:decoration-current">
              Icons8
            </a>
            .
          </p>
        </section>
      )}
    </>
  )
}
