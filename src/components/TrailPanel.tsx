import { ChevronRight, LocationOn } from 'relume-icons'
import { CoverThumb, ForestCover } from './ForestCover'
import { trailCover } from '../lib/coverSpec'
import {
  DIFFICULTY,
  downloadFile,
  formatDuration,
  isPhotoSpot,
  PLACE_KINDS,
  trailGpx,
  type ExploreArea,
  type Place,
  type Trail,
} from '../lib/explore'
import { directionsUrl } from '../lib/peak'
import { ROW } from '../lib/styles'
import { ElevationChart } from './ElevationChart'
import { ForecastStrip } from './ForecastStrip'
import { NearbyPhotos } from './NearbyPhotos'
import { PlaceIcon } from './PlaceIcon'
import { SaveButton } from './SaveButton'
import { BackButton, Badge, LinkButton, MoreLinks, ShareButton } from './ui'

type Props = {
  trail: Trail
  area: ExploreArea
  places: Map<string, Place>
  onBack: () => void
  onSelectPlace: (p: Place) => void
  onHoverPoint: (p: [number, number] | null) => void
}

export function TrailPanel({ trail, area, places, onBack, onSelectPlace, onHoverPoint }: Props) {
  const difficulty = DIFFICULTY[trail.difficulty]
  const along = trail.along.flatMap((a) => {
    const place = places.get(a.poi)
    return place ? [{ ...a, place }] : []
  })
  const photoSpots = along.filter((a) => isPhotoSpot(a.place.kind))

  return (
    <div className="space-y-6 p-5">
      <BackButton onClick={onBack} />

      <ForestCover spec={trailCover(trail)} name={trail.name} />

      <header>
        <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-[var(--ink-soft)] uppercase">
          <PlaceIcon kind="trail" className="size-3.5" />
          Trail · {trail.association ?? area.name}
        </p>
        <h2 className="text-3xl leading-tight">{trail.name}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <Badge color={difficulty.color}>{difficulty.label}</Badge>
          <span className="text-[var(--ink-soft)]">{trail.loop ? 'Loop' : 'Point to point'}</span>
          {photoSpots.length > 0 && (
            <span className="text-[var(--ink-soft)]">
              · {photoSpots.length} photo spot{photoSpots.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </header>

      <section aria-label="Actions" className="-mt-2 flex flex-wrap gap-2">
        <LinkButton primary href={directionsUrl(trail.trailhead[1], trail.trailhead[0])} icon={<LocationOn className="size-4" />}>
          Get directions
        </LinkButton>
        <SaveButton stopRef={`trail:${trail.id}`} name={trail.name} />
        <ShareButton title={`${trail.name} · Canopy`} />
      </section>
      <MoreLinks
        links={[
          { label: 'Download GPX', onClick: () => downloadFile(`${trail.name.replace(/[^\w]+/g, '-')}.gpx`, trailGpx(trail, along.map((a) => a.place)), 'application/gpx+xml') },
          ...(trail.website ? [{ label: 'Official trail info', href: trail.website }] : []),
        ]}
      />

      <dl className="grid grid-cols-4 gap-2 text-center">
        {[
          ['Length', `${trail.lengthKm} km`],
          ['Est. time', formatDuration(trail.durationH)],
          ['Climb', `${trail.gainM} m`],
          ['Highest', `${trail.maxEleM} m`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-[var(--surface-2)] px-1 py-2.5">
            <dd className="font-display text-xl leading-none">{value}</dd>
            <dt className="mt-1 text-[11px] text-[var(--ink-soft)]">{label}</dt>
          </div>
        ))}
      </dl>

      <ForecastStrip lat={trail.trailhead[1]} lng={trail.trailhead[0]} />

      <section>
        <h3 className="mb-2 text-lg">Elevation</h3>
        <ElevationChart trail={trail} places={places} onHover={onHoverPoint} />
      </section>

      <section>
        <h3 className="mb-2 text-lg">Along the trail</h3>
        <ol className="relative">
          <TimelineRow
            icon={<PlaceIcon kind="trailhead" className="size-4" />}
            color={PLACE_KINDS.trailhead.color}
            title="Trailhead"
            detail="km 0 · start here"
            first
          />
          {along.map(({ place, km, offM }) => (
            <TimelineRow
              key={place.id}
              icon={<PlaceIcon kind={place.kind} className="size-4" />}
              color={PLACE_KINDS[place.kind].color}
              title={place.name}
              detail={`km ${km} · ${PLACE_KINDS[place.kind].label}${isPhotoSpot(place.kind) ? ' · photo spot' : ''}${offM > 60 ? ` · ${offM} m off trail` : ''}`}
              onClick={() => onSelectPlace(place)}
            />
          ))}
          <TimelineRow
            icon={<PlaceIcon kind="trailhead" className="size-4" />}
            color={PLACE_KINDS.trailhead.color}
            title={trail.loop ? 'Back at the trailhead' : 'End of trail'}
            detail={`km ${trail.lengthKm}`}
            last
          />
        </ol>
        {along.length === 0 && (
          <p className="mt-2 text-sm text-[var(--ink-soft)]">No mapped waterfalls, lookouts or lakes along this trail yet.</p>
        )}
      </section>

      {trail.description && (
        <section>
          <h3 className="mb-1 text-lg">About</h3>
          <p className="text-sm leading-relaxed">{trail.description}</p>
          <p className="mt-2 text-xs text-[var(--ink-soft)]">Allowed: {trail.uses}</p>
        </section>
      )}

      <NearbyPhotos lat={trail.trailhead[1]} lng={trail.trailhead[0]} radiusKm={Math.max(3, Math.round(trail.lengthKm / 2))} />

      <p className="text-[11px] leading-relaxed text-[var(--ink-soft)]">
        Trail: Ontario Trail Network (Open Government Licence – Ontario). Places © OpenStreetMap contributors. Elevation:
        Terrarium/AWS. Times are estimates for a relaxed pace.
      </p>
    </div>
  )
}

function TimelineRow({
  icon,
  color,
  title,
  detail,
  onClick,
  first,
  last,
}: {
  icon: React.ReactNode
  color: string
  title: string
  detail: string
  onClick?: () => void
  first?: boolean
  last?: boolean
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <li className="relative flex">
      {/* the trail line */}
      <span
        aria-hidden
        className="absolute left-[15px] w-0.5 bg-[var(--line)]"
        style={{ top: first ? 16 : 0, bottom: last ? 'calc(100% - 16px)' : 0 }}
      />
      <Tag
        onClick={onClick}
        className={`relative flex w-full items-center gap-3 py-1.5 text-left ${onClick ? 'rounded-lg hover:bg-[var(--surface-2)]' : ''}`}
      >
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 bg-[var(--surface)]"
          style={{ color, borderColor: color }}
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{title}</span>
          <span className="block truncate text-xs text-[var(--ink-soft)]">{detail}</span>
        </span>
        {onClick && <ChevronRight className="size-4 shrink-0 text-[var(--ink-soft)]" />}
      </Tag>
    </li>
  )
}

/** Compact card for trail lists (region pages, place pages). */
export function TrailCard({ trail, places, onClick }: { trail: Trail; places: Map<string, Place>; onClick: () => void }) {
  const difficulty = DIFFICULTY[trail.difficulty]
  const kinds = [...new Set(trail.along.map((a) => places.get(a.poi)?.kind).filter(Boolean))] as Place['kind'][]
  return (
    <button onClick={onClick} className={ROW}>
      <CoverThumb
        spec={trailCover(trail)}
        fallback={
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: PLACE_KINDS.trail.color }}>
            <PlaceIcon kind="trail" className="size-5" />
          </span>
        }
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{trail.name}</span>
        <span className="flex items-center gap-1.5 text-xs text-[var(--ink-soft)]">
          {/* The color is a dot; the word stays in the text color, which reads in both themes. */}
          <span className="flex items-center gap-1 font-medium text-[var(--ink)]">
            <span className="size-2 rounded-full" style={{ background: difficulty.color }} />
            {difficulty.label}
          </span>
          · {trail.lengthKm} km · {formatDuration(trail.durationH)}
          {kinds.slice(0, 4).map((k) => (
            <span key={k} style={{ color: PLACE_KINDS[k].color }} title={PLACE_KINDS[k].plural}>
              <PlaceIcon kind={k} className="size-3.5" />
            </span>
          ))}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-[var(--ink-soft)]" />
    </button>
  )
}
