import type { Region } from '../data/regions'
import { directionsUrl, formatWindow, PHASE_STYLE, peakPhase } from '../lib/peak'
import { ForecastStrip } from './ForecastStrip'
import { NearbyPhotos } from './NearbyPhotos'
import { BackButton, Badge, LinkButton } from './ui'

export function RegionPanel({ region, onBack }: { region: Region; onBack: () => void }) {
  const phase = PHASE_STYLE[peakPhase(region)]

  return (
    <div className="space-y-6 p-5">
      <BackButton onClick={onBack} />

      <header>
        <p className="text-xs font-medium tracking-wide text-[var(--ink-soft)] uppercase">{region.province} · Region</p>
        <h2 className="text-2xl font-bold">{region.name}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <Badge color={phase.color}>{phase.label}</Badge>
          <span className="text-[var(--ink-soft)]">Typical peak {formatWindow(region)}</span>
        </div>
      </header>

      <ForecastStrip lat={region.lat} lng={region.lng} />

      <section>
        <h3 className="mb-2 text-sm font-semibold">Trees to look for</h3>
        <ul className="flex flex-wrap gap-1.5">
          {region.species.map((s) => (
            <li key={s} className="rounded-full border border-[var(--line)] px-2.5 py-0.5 text-sm">
              {s}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Don’t miss</h3>
        <ul className="list-inside list-disc space-y-0.5 text-sm">
          {region.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </section>

      <NearbyPhotos lat={region.lat} lng={region.lng} />

      <section className="flex flex-wrap gap-2">
        <LinkButton primary href={directionsUrl(region.lat, region.lng)}>
          Directions
        </LinkButton>
        {region.links.map((l) => (
          <LinkButton key={l.url} href={l.url}>
            {l.label} ↗
          </LinkButton>
        ))}
      </section>
    </div>
  )
}
