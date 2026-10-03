import { parkTitle, type ParkReport } from '../lib/ontarioParks'
import { ForestCover } from './ForestCover'
import { directionsUrl } from '../lib/peak'
import { STAGES } from '../lib/stage'
import { ForecastStrip } from './ForecastStrip'
import { NearbyPhotos } from './NearbyPhotos'
import { ParkAmenities } from './ParkAmenities'
import { SaveButton } from './SaveButton'
import { CalendarToday, LocationOn, Schedule } from 'relume-icons'
import { BackButton, Badge, LinkButton, ShareButton, Meter } from './ui'

export function ParkPanel({ park, onBack }: { park: ParkReport; onBack: () => void }) {
  const stage = STAGES[park.stage]
  const reported = park.reportedAt
    ? new Date(park.reportedAt).toLocaleDateString('en-CA', { month: 'long', day: 'numeric' })
    : null

  return (
    <div className="space-y-6 p-5">
      <BackButton onClick={onBack} />

      <ForestCover lat={park.lat} lng={park.lng} name={parkTitle(park)} park={park} boundary={park.shortname} />

      <header>
        <p className="text-xs font-medium tracking-wide text-[var(--ink-soft)] uppercase">
          ON · {park.region} · Provincial park
        </p>
        <h2 className="text-3xl leading-tight">{parkTitle(park)}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <Badge color={stage.color}>{stage.label}</Badge>
          {reported && (
            <span className="flex items-center gap-1 text-[var(--ink-soft)]" title="Official report date">
              <Schedule className="size-4" />
              <span className="sr-only">Official report, </span>
              {reported}
            </span>
          )}
        </div>
      </header>

      <section aria-label="Actions" className="-mt-2 flex flex-wrap gap-2">
        <LinkButton primary href={directionsUrl(park.lat, park.lng)} icon={<LocationOn className="size-4" />}>
          Get directions
        </LinkButton>
        <SaveButton stopRef={`park:${park.id}`} name={parkTitle(park)} />
        <ShareButton title={`${parkTitle(park)} fall colors · Canopy`} />
        <LinkButton href="https://reservations.ontarioparks.ca/" icon={<CalendarToday className="size-4" />} external>
          Reserve a site
        </LinkButton>
        <LinkButton href={park.url} external>
          Ontario Parks page
        </LinkButton>
      </section>

      <section className="space-y-3">
        <Meter label="Color change" value={park.colorChange} color={stage.color} />
        <Meter label="Leaf fall" value={park.leafFall} color={STAGES.past.color} />
        <p className="text-sm">
          <span className="text-[var(--ink-soft)]">Dominant color:</span> <strong>{park.dominantColor}</strong>
        </p>
      </section>

      {park.viewing && (
        <section>
          <h3 className="mb-1 text-lg">Best viewing</h3>
          <p className="text-sm leading-relaxed">{park.viewing}</p>
        </section>
      )}

      <ParkAmenities shortname={park.shortname} />

      <ForecastStrip lat={park.lat} lng={park.lng} />
      <NearbyPhotos lat={park.lat} lng={park.lng} radiusKm={40} />

      <p className="text-[11px] text-[var(--ink-soft)]">
        Color data from the{' '}
        <a href="https://www.ontarioparks.ca/fallcolour" target="_blank" rel="noreferrer" className="underline decoration-[var(--line)] underline-offset-2 transition-colors hover:text-[var(--ink)] hover:decoration-current">
          Ontario Parks Fall Colour Report
        </a>
        .
      </p>
    </div>
  )
}
