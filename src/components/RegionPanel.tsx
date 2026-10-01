import { useQuery } from '@tanstack/react-query'
import type { Region } from '../data/regions'
import { fetchLeafObservations } from '../lib/inaturalist'
import { directionsUrl, formatWindow, PHASE_STYLE, peakPhase } from '../lib/peak'
import { colourOutlook, fetchForecast, weatherEmoji, type ColourOutlook } from '../lib/weather'

const OUTLOOK: Record<ColourOutlook, { label: string; cls: string } | null> = {
  vivid: { label: 'Vivid colour', cls: 'bg-maple/10 text-maple' },
  'leaf-drop': { label: 'Leaf-drop risk', cls: 'bg-bark/10 text-[var(--ink-soft)]' },
  frost: { label: 'Hard frost', cls: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' },
  neutral: null,
}

export function RegionPanel({ region, onBack }: { region: Region; onBack: () => void }) {
  const phase = PHASE_STYLE[peakPhase(region)]
  const forecast = useQuery({
    queryKey: ['forecast', region.id],
    queryFn: () => fetchForecast(region.lat, region.lng),
  })
  const photos = useQuery({
    queryKey: ['observations', region.id],
    queryFn: () =>
      fetchLeafObservations({ days: 21, perPage: 12, near: { lat: region.lat, lng: region.lng, radiusKm: 75 } }).then((r) => r.items),
  })

  return (
    <div className="space-y-6 p-5">
      <button onClick={onBack} className="text-sm text-[var(--ink-soft)] hover:text-[var(--ink)]">
        ← All regions
      </button>

      <header>
        <p className="text-xs font-medium tracking-wide text-[var(--ink-soft)] uppercase">{region.province}</p>
        <h2 className="text-2xl font-bold">{region.name}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full px-2.5 py-0.5 font-medium text-white" style={{ background: phase.color }}>
            {phase.label}
          </span>
          <span className="text-[var(--ink-soft)]">Typical peak {formatWindow(region)}</span>
        </div>
      </header>

      <section>
        <h3 className="mb-2 text-sm font-semibold">7-day colour outlook</h3>
        {forecast.isPending && <p className="text-sm text-[var(--ink-soft)]">Loading forecast…</p>}
        {forecast.isError && <p className="text-sm text-maple">Couldn’t load the forecast.</p>}
        {forecast.data && (
          <ol className="grid grid-cols-7 gap-1 text-center text-xs">
            {forecast.data.map((d) => {
              const outlook = OUTLOOK[colourOutlook(d)]
              return (
                <li key={d.date} className="rounded-lg bg-[var(--surface-2)] px-0.5 py-2" title={outlook?.label}>
                  <div className="text-[var(--ink-soft)]">
                    {new Date(`${d.date}T12:00`).toLocaleDateString('en-CA', { weekday: 'short' })}
                  </div>
                  <div className="my-1 text-base">{weatherEmoji(d.weatherCode)}</div>
                  <div className="font-medium">{Math.round(d.tMax)}°</div>
                  <div className="text-[var(--ink-soft)]">{Math.round(d.tMin)}°</div>
                  {outlook && <div className={`mx-auto mt-1 size-1.5 rounded-full ${dotFor(outlook.cls)}`} />}
                </li>
              )
            })}
          </ol>
        )}
        <p className="mt-2 text-xs text-[var(--ink-soft)]">
          <span className="mr-1 inline-block size-1.5 rounded-full bg-maple align-middle" /> cool nights and dry days, the best reds
          <span className="mr-1 ml-3 inline-block size-1.5 rounded-full bg-bark align-middle" /> wind or heavy rain
        </p>
      </section>

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

      <section>
        <h3 className="mb-2 text-sm font-semibold">Recent colour sightings nearby</h3>
        {photos.isPending && <p className="text-sm text-[var(--ink-soft)]">Loading photos…</p>}
        {photos.data?.length === 0 && (
          <p className="text-sm text-[var(--ink-soft)]">No coloured-leaf observations within 75 km in the last 3 weeks.</p>
        )}
        <div className="grid grid-cols-3 gap-1.5">
          {photos.data?.map(
            (o) =>
              o.photoUrl && (
                <a key={o.id} href={o.url} target="_blank" rel="noreferrer" className="group relative block aspect-square overflow-hidden rounded-lg">
                  <img src={o.photoUrl} alt={o.species} loading="lazy" className="size-full object-cover transition group-hover:scale-105" />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 px-1.5 pt-4 pb-1 text-[11px] text-white">
                    {o.species}
                  </span>
                </a>
              ),
          )}
        </div>
        <p className="mt-1.5 text-[11px] text-[var(--ink-soft)]">Photos from iNaturalist observers (CC licences, tap for credit).</p>
      </section>

      <section className="flex flex-wrap gap-2">
        <a href={directionsUrl(region.lat, region.lng)} target="_blank" rel="noreferrer" className="rounded-full bg-maple px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          Directions
        </a>
        {region.links.map((l) => (
          <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="rounded-full border border-[var(--line)] px-4 py-2 text-sm hover:bg-[var(--surface-2)]">
            {l.label} ↗
          </a>
        ))}
      </section>
    </div>
  )
}

function dotFor(cls: string) {
  if (cls.includes('maple')) return 'bg-maple'
  if (cls.includes('sky')) return 'bg-sky-500'
  return 'bg-bark'
}
