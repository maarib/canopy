import { LocationOn } from 'relume-icons'
import { ACCESS_ICONS, ACCESS_TYPES, accessTitle, FISH_ONLINE, type AccessType, type FishingAccess } from '../lib/fishingAccess'
import { directionsUrl } from '../lib/peak'
import { ForecastStrip } from './ForecastStrip'
import { AmenityIcon } from './ParkAmenities'
import { BackButton, LinkButton, ShareButton } from './ui'

const REGULATIONS = 'https://www.ontario.ca/document/ontario-fishing-regulations-summary'

const BLURB: Record<AccessType, string> = {
  launch: 'A public place to put a boat or canoe in the water. Fall is a quiet season on the water, with colour on the shoreline and fewer boats.',
  shore: 'Fish from the shore here. Fall brings cooling water and active fish, and the shoreline colours peak with the surrounding forest.',
  pier: 'A dock or pier for fishing from or tying up. Fall brings cooling water and active fish.',
}

const yesNo = (v: boolean | null, yes: string, no: string) => (v === null ? null : v ? yes : no)

export function FishingPanel({ access, onBack }: { access: FishingAccess; onBack: () => void }) {
  const type = ACCESS_TYPES[access.type]
  const facts = [
    ['Parking', yesNo(access.parking, 'Yes', 'None')],
    ['Fee', yesNo(access.fee, 'Fee charged', 'Free')],
    ['Wheelchair access', yesNo(access.accessible, 'Yes', 'No')],
    ['Surface', access.surface],
    ['Owner', access.ownership],
    ['Last checked', access.verified ? String(access.verified) : null],
  ].filter((f): f is [string, string] => f[1] !== null)

  return (
    <div className="space-y-6 p-5">
      <BackButton onClick={onBack} />

      <header className="flex items-start gap-4">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-2)]">
          <AmenityIcon icon={ACCESS_ICONS[access.type]} size={40} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-[#1f6f74] uppercase dark:text-[#7cc7cc]">{type.label} · Fishing access</p>
          <h2 className="text-3xl leading-tight">{accessTitle(access)}</h2>
        </div>
      </header>

      <p className="text-sm leading-relaxed">{BLURB[access.type]}</p>

      {facts.length > 0 && (
        <dl className="grid grid-cols-2 gap-1.5 text-sm">
          {facts.map(([label, value]) => (
            <div key={label} className="rounded-xl bg-[var(--surface-2)] px-3 py-2">
              <dt className="text-xs text-[var(--ink-soft)]">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <ForecastStrip lat={access.lat} lng={access.lng} />

      <section className="space-y-1.5 text-sm">
        <h3 className="text-lg">Before you go</h3>
        <p className="text-[var(--ink-soft)]">
          Most Ontario residents aged 18–64 need an outdoors card and fishing licence. Seasons, sanctuaries and catch limits vary by zone
          and lake.
        </p>
      </section>

      <section className="flex flex-wrap gap-2">
        <LinkButton primary href={directionsUrl(access.lat, access.lng)} icon={<LocationOn className="size-4" />}>
          Get directions
        </LinkButton>
        <ShareButton title={`${accessTitle(access)} · Canopy`} />
        <LinkButton href={FISH_ONLINE} external>
          Fish species & stocking
        </LinkButton>
        <LinkButton href={REGULATIONS} external>
          Fishing regulations
        </LinkButton>
        {access.url && (
          <LinkButton href={access.url} external>
            More info
          </LinkButton>
        )}
      </section>

      <p className="text-[11px] text-[var(--ink-soft)]">
        Access point data: Ontario Ministry of Natural Resources (Fish ON-Line), Open Government Licence – Ontario. Details can change;
        check local signs.
      </p>
    </div>
  )
}
