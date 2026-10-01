import { parkTitle, type ParkReport } from '../lib/ontarioParks'
import { directionsUrl } from '../lib/peak'
import { STAGES } from '../lib/stage'
import { ForecastStrip } from './ForecastStrip'
import { NearbyPhotos } from './NearbyPhotos'
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

      <section className="space-y-3">
        <Meter label="Colour change" value={park.colourChange} color={stage.color} />
        <Meter label="Leaf fall" value={park.leafFall} color={STAGES.past.color} />
        <p className="text-sm">
          <span className="text-[var(--ink-soft)]">Dominant colour:</span> <strong>{park.dominantColour}</strong>
        </p>
      </section>

      {park.viewing && (
        <section>
          <h3 className="mb-1 text-lg">Best viewing</h3>
          <p className="text-sm leading-relaxed">{park.viewing}</p>
        </section>
      )}

      <ForecastStrip lat={park.lat} lng={park.lng} />
      <NearbyPhotos lat={park.lat} lng={park.lng} radiusKm={40} />

      <section className="flex flex-wrap gap-2">
        <LinkButton primary href={directionsUrl(park.lat, park.lng)} icon={<LocationOn className="size-4" />}>
          Directions
        </LinkButton>
        <ShareButton title={`${parkTitle(park)} fall colours · Canopy`} />
        <LinkButton href="https://reservations.ontarioparks.ca/" icon={<CalendarToday className="size-4" />} external>
          Book
        </LinkButton>
        <LinkButton href={park.url} external>
          Park page
        </LinkButton>
      </section>

      <p className="text-[11px] text-[var(--ink-soft)]">
        Colour data from the{' '}
        <a href="https://www.ontarioparks.ca/fallcolour" target="_blank" rel="noreferrer" className="underline">
          Ontario Parks Fall Colour Report
        </a>
        .
      </p>
    </div>
  )
}
