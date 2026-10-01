import type { Region } from '../data/regions'
import { directionsUrl, formatWindow, PHASE_STYLE, peakPhase } from '../lib/peak'
import { ForecastStrip } from './ForecastStrip'
import { NearbyPhotos } from './NearbyPhotos'
import { CalendarToday, LocationOn, Star } from 'relume-icons'
import { treeIconFor } from '../data/treeIcons'
import { TreeIcon } from './TreeIcon'
import { BackButton, Badge, LinkButton, ShareButton } from './ui'

export function RegionPanel({ region, onBack }: { region: Region; onBack: () => void }) {
  const phase = PHASE_STYLE[peakPhase(region)]

  return (
    <div className="space-y-6 p-5">
      <BackButton onClick={onBack} />

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

      <ForecastStrip lat={region.lat} lng={region.lng} />

      <section>
        <h3 className="mb-2 text-lg">Trees to look for</h3>
        <ul className="flex flex-wrap gap-1.5">
          {region.species.map((s) => {
            const icon = treeIconFor(s)
            return (
              <li key={s} className="flex items-center gap-1.5 rounded-full border border-[var(--line)] px-2.5 py-1 text-sm">
                {icon && <TreeIcon id={icon} className="size-4 text-pumpkin" />}
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

      <NearbyPhotos lat={region.lat} lng={region.lng} />

      <section className="flex flex-wrap gap-2">
        <LinkButton primary href={directionsUrl(region.lat, region.lng)} icon={<LocationOn className="size-4" />}>
          Directions
        </LinkButton>
        <ShareButton title={`${region.name} fall colours · Canopy`} />
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
    </div>
  )
}
