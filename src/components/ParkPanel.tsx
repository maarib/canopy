import { parkTitle, type ParkReport } from '../lib/ontarioParks'
import { ForestCover } from './ForestCover'
import { parkCover } from '../lib/coverSpec'
import { directionsUrl } from '../lib/peak'
import { STAGES } from '../lib/stage'
import { ForecastStrip } from './ForecastStrip'
import { NearbyPhotos } from './NearbyPhotos'
import { NearbyStops } from './NearbyStops'
import { ParkAmenities } from './ParkAmenities'
import { SaveButton } from './SaveButton'
import { LocationOn, Schedule } from 'relume-icons'
import { BackButton, Badge, LinkButton, MoreLinks, ShareButton, Meter } from './ui'

export function ParkPanel({ park, onBack }: { park: ParkReport; onBack: () => void }) {
  const stage = STAGES[park.stage]
  const reported = park.reportedAt
    ? new Date(park.reportedAt).toLocaleDateString('en-CA', { month: 'long', day: 'numeric' })
    : null

  return (
    <div className="space-y-6 p-5">
      <BackButton onClick={onBack} />

      <ForestCover spec={parkCover(park)} name={parkTitle(park)} />

      <header>
        <p className="text-xs font-medium tracking-wide text-[var(--ink-soft)] uppercase">
          ON · {park.region} · {park.classification && !park.report ? `${park.classification} park` : 'Provincial park'}
        </p>
        <h2 className="text-3xl leading-tight">{parkTitle(park)}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          {park.report && <Badge color={stage.color}>{stage.label}</Badge>}
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
          Get Directions
        </LinkButton>
        <SaveButton stopRef={`park:${park.id}`} name={parkTitle(park)} />
        <ShareButton title={`${parkTitle(park)} fall colors · Canopy`} />
      </section>
      <MoreLinks
        links={[
          // Parks with a report are the ones Ontario Parks runs with campgrounds and gates.
          ...(park.report ? [{ label: 'Reserve a site', href: 'https://reservations.ontarioparks.ca/' }] : []),
          ...(park.url ? [{ label: 'Ontario Parks page', href: park.url }] : []),
        ]}
      />

      {park.report ? (
        <section className="space-y-3">
          <Meter label="Color change" value={park.colorChange} color={stage.color} />
          <Meter label="Leaf fall" value={park.leafFall} color={STAGES.past.color} />
          <p className="text-sm">
            <span className="text-[var(--ink-soft)]">Dominant color:</span> <strong>{park.dominantColor}</strong>
          </p>
        </section>
      ) : (
        <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
          No fall color report for this park.
        </p>
      )}

      <ForecastStrip lat={park.lat} lng={park.lng} />

      {park.viewing && (
        <section>
          <h3 className="mb-1 text-lg">Best viewing</h3>
          <p className="text-sm leading-relaxed">{park.viewing}</p>
        </section>
      )}

      <ParkAmenities shortname={park.shortname} />

      <NearbyStops lat={park.lat} lng={park.lng} />

      <NearbyPhotos lat={park.lat} lng={park.lng} radiusKm={40} />
    </div>
  )
}
