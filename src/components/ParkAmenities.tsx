import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { AMENITY_ICONS, COMPOSED_ICONS, icons8Url, type AmenityIcon as AmenityIconId } from '../data/amenityIcons'
import { amenitiesFor, fetchParkFacilities, type Amenity } from '../lib/parkFacilities'
import { LIST } from '../lib/styles'
import { InfoRow, Skeleton } from './ui'

/** A place, activity or facility icon: one pack icon, a composed pair, or one drawn for Canopy. */
export function AmenityIcon({ icon, size = 24, className = '' }: { icon: AmenityIconId; size?: number; className?: string }) {
  const img = (src: string, px: number, cls = '') => <img src={src} width={px} height={px} alt="" loading="lazy" decoding="async" className={cls} />
  if (icon in COMPOSED_ICONS) {
    const { main, badge } = COMPOSED_ICONS[icon as keyof typeof COMPOSED_ICONS]
    const b = Math.round(size * 0.62)
    // The badge sits on the lower right with a thin halo, as in the pack's own composed icons.
    return (
      <span className={`relative inline-block shrink-0 ${className}`} style={{ width: size, height: size }}>
        {img(icons8Url(main, size), size)}
        {img(icons8Url(badge, b), b, 'absolute -right-[12%] -bottom-[12%] drop-shadow-[0_0_1px_var(--surface)]')}
      </span>
    )
  }
  const src = icon in AMENITY_ICONS ? icons8Url(AMENITY_ICONS[icon as keyof typeof AMENITY_ICONS], size) : `${import.meta.env.BASE_URL}icons/${icon}.svg`
  return img(src, size, `shrink-0 ${className}`)
}

const PREVIEW = 6

function Rows({ items, limit }: { items: Amenity[]; limit?: number }) {
  const [all, setAll] = useState(false)
  const shown = all || !limit ? items : items.slice(0, limit)
  const hidden = items.length - shown.length
  return (
    <>
      <ul className={`stagger ${LIST}`}>
        {shown.map((a) => (
          <InfoRow
            key={a.key}
            icon={<AmenityIcon icon={a.icon} size={26} />}
            label={a.label}
            value={a.count != null && a.count > 1 ? a.count.toLocaleString('en-CA') : undefined}
          />
        ))}
      </ul>
      {limit && items.length > limit && (
        <button
          onClick={() => setAll(!all)}
          className="mt-1 rounded-full px-3 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-brand/10"
        >
          {all ? 'Show fewer' : `Show ${hidden} more`}
        </button>
      )}
    </>
  )
}

function Group({ title, items }: { title: string; items: Amenity[] }) {
  if (!items.length) return null
  return (
    <div>
      <h4 className="text-xs font-semibold tracking-wide text-[var(--ink-soft)] uppercase">{title}</h4>
      <Rows items={items} />
    </div>
  )
}

/** Activities and facilities from the park's Ontario Parks page. */
export function ParkAmenities({ shortname }: { shortname: string }) {
  const feed = useQuery({ queryKey: ['park-facilities'], queryFn: fetchParkFacilities, staleTime: Infinity })

  if (feed.isPending)
    return (
      <section role="status" aria-label="Loading activities and facilities" className="space-y-2">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex min-h-14 items-center gap-3">
            <Skeleton className="size-10 rounded-xl" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </section>
    )
  const park = feed.data && amenitiesFor(feed.data, shortname)
  if (!park) return null

  return (
    <>
      {park.activities.length > 0 && (
        <section>
          <h3 className="text-lg">Things to do</h3>
          <Rows items={park.activities} limit={PREVIEW} />
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
          <p className="text-[11px] text-[var(--ink-soft)]">Some facilities are seasonal or limited to parts of the park.</p>
        </section>
      )}
    </>
  )
}
