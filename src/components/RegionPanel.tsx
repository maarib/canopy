import type { Region } from '../data/regions'
import { ForestCover } from './ForestCover'
import { regionCover } from '../lib/coverSpec'
import { directionsUrl, formatWindow, PHASE_STYLE, peakPhase } from '../lib/peak'
import { ForecastStrip } from './ForecastStrip'
import { NearbyPhotos } from './NearbyPhotos'
import { CalendarToday, LocationOn, Star } from 'relume-icons'
import { treeIconFor } from '../data/treeIcons'
import { isPhotoSpot, PLACE_KINDS, type ExploreArea, type Place, type Trail } from '../lib/explore'
import { PlaceIcon } from './PlaceIcon'
import { SaveButton } from './SaveButton'
import { TrailCard } from './TrailPanel'
import { TreeIcon } from './TreeIcon'
import { BackButton, Badge, LinkButton, ShareButton, Skeleton } from './ui'

type Props = {
  region: Region
  onBack: () => void
  /** Trails and places for this region, when an explore area covers it. */
  area?: ExploreArea
  areaLoading?: boolean
  places: Map<string, Place>
  onSelectTrail: (t: Trail) => void
  onSelectPlace: (p: Place) => void
}

export function RegionPanel({ region, onBack, area, areaLoading, places, onSelectTrail, onSelectPlace }: Props) {
  const photoSpots = (area?.pois ?? []).filter((p) => isPhotoSpot(p.kind) && !/^(Lookout on|Unnamed)/.test(p.name))
  const dayHikes = (area?.trails ?? []).filter((t) => t.difficulty !== 'backpacking')
  const backpacking = (area?.trails ?? []).filter((t) => t.difficulty === 'backpacking')
  const phase = PHASE_STYLE[peakPhase(region)]

  return (
    <div className="space-y-6 p-5">
      <BackButton onClick={onBack} />

      <ForestCover spec={regionCover(region)} name={region.name} />

      <header>
        <p className="text-xs font-medium tracking-wide text-[var(--ink-soft)] uppercase">{region.province} · Region</p>
        <h2 className="text-3xl leading-tight">{region.name}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <Badge color={phase.color}>{phase.label}</Badge>
          <span className="flex items-center gap-1 text-[var(--ink-soft)]">
            <CalendarToday className="size-4" />
            Typical peak {formatWindow(region)}
          </span>
        </div>
      </header>

      <section aria-label="Actions" className="-mt-2 flex flex-wrap gap-2">
        <LinkButton primary href={directionsUrl(region.lat, region.lng)} icon={<LocationOn className="size-4" />}>
          Get directions
        </LinkButton>
        <SaveButton stopRef={`region:${region.id}`} name={region.name} />
        <ShareButton title={`${region.name} fall colors · Canopy`} />
        {region.links.map((l) => (
          <LinkButton
            key={l.url}
            href={l.url}
            external
            icon={/book|reserv/i.test(l.label) ? <CalendarToday className="size-4" /> : undefined}
          >
            {l.label}
          </LinkButton>
        ))}
      </section>

      <ForecastStrip lat={region.lat} lng={region.lng} />

      <section>
        <h3 className="mb-2 text-lg">Trees to look for</h3>
        <ul className="flex flex-wrap gap-1.5">
          {region.species.map((s) => {
            const icon = treeIconFor(s)
            return (
              <li key={s} className="flex items-center gap-1.5 rounded-full border border-[var(--line)] px-2.5 py-1 text-sm">
                {icon && <TreeIcon id={icon} className="size-[18px]" />}
                {s}
              </li>
            )
          })}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-lg">Don’t miss</h3>
        <ul className="space-y-1 text-sm">
          {region.highlights.map((h) => (
            <li key={h} className="flex items-center gap-2">
              <Star className="size-4 shrink-0 text-pumpkin" />
              {h}
            </li>
          ))}
        </ul>
      </section>

      {areaLoading && (
        <section role="status" aria-label="Loading trails">
          <h3 className="mb-2 text-lg">Trails</h3>
          <ul className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <li key={i} className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl" />
                <span className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {area && (
        <section>
          <h3 className="text-lg">Trails</h3>
          <p className="mb-1 text-xs text-[var(--ink-soft)]">
            {dayHikes.length} day hikes{backpacking.length ? ` · ${backpacking.length} backpacking` : ''} · tap one to see its route and
            what's along it
          </p>
          <ul className="divide-y divide-[var(--line)]">
            {[...dayHikes, ...backpacking].map((t) => (
              <li key={t.id}>
                <TrailCard trail={t} places={places} onClick={() => onSelectTrail(t)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {photoSpots.length > 0 && (
        <section>
          <h3 className="mb-2 text-lg">Waterfalls & lookouts</h3>
          <ul className="flex flex-wrap gap-1.5">
            {photoSpots.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => onSelectPlace(p)}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--line)] py-1 pr-3 pl-1 text-sm hover:bg-[var(--surface-2)]"
                >
                  <span
                    className="flex size-6 items-center justify-center rounded-full text-white"
                    style={{ background: PLACE_KINDS[p.kind].color }}
                  >
                    <PlaceIcon kind={p.kind} className="size-3.5" />
                  </span>
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <NearbyPhotos lat={region.lat} lng={region.lng} />

    </div>
  )
}
