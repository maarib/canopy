import { useQuery } from '@tanstack/react-query'
import { Skeleton } from './ui'
import { colourOutlook, fetchForecast, weatherEmoji, type ColourOutlook } from '../lib/weather'

const OUTLOOK_DOT: Record<ColourOutlook, { label: string; cls: string } | null> = {
  vivid: { label: 'Vivid colour', cls: 'bg-maple' },
  'leaf-drop': { label: 'Leaf-drop risk', cls: 'bg-bark dark:bg-[#a08672]' },
  frost: { label: 'Hard frost', cls: 'bg-sky-500' },
  neutral: null,
}

export function ForecastStrip({ lat, lng }: { lat: number; lng: number }) {
  const forecast = useQuery({
    queryKey: ['forecast', lat.toFixed(2), lng.toFixed(2)],
    queryFn: () => fetchForecast(lat, lng),
  })

  return (
    <section>
      <h3 className="mb-2 text-lg">7-day colour outlook</h3>
      {forecast.isPending && (
        <div className="grid grid-cols-7 gap-1" role="status" aria-label="Loading forecast">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-[92px]" />
          ))}
        </div>
      )}
      {forecast.isError && (
        <p className="flex items-center gap-2 text-sm">
          <span className="text-[var(--ink-soft)]">Couldn’t load the forecast.</span>
          <button onClick={() => forecast.refetch()} className="rounded-full px-2 py-0.5 text-maple transition-colors hover:bg-maple/10">
            Try again
          </button>
        </p>
      )}
      {forecast.data && (
        <ol className="grid grid-cols-7 gap-1 text-center text-xs">
          {forecast.data.map((d) => {
            const outlook = OUTLOOK_DOT[colourOutlook(d)]
            return (
              <li key={d.date} className="rounded-lg bg-[var(--surface-2)] px-0.5 py-2" title={outlook?.label}>
                <div className="text-[var(--ink-soft)]">
                  {new Date(`${d.date}T12:00`).toLocaleDateString('en-CA', { weekday: 'short' })}
                </div>
                <div className="my-1 text-base">{weatherEmoji(d.weatherCode)}</div>
                <div className="font-medium">{Math.round(d.tMax)}°</div>
                <div className="text-[var(--ink-soft)]">{Math.round(d.tMin)}°</div>
                <div className={`mx-auto mt-1 size-1.5 rounded-full ${outlook?.cls ?? ''}`} />
              </li>
            )
          })}
        </ol>
      )}
      <p className="mt-2 text-xs text-[var(--ink-soft)]">
        <span className="mr-1 inline-block size-1.5 rounded-full bg-maple align-middle" /> cool nights and dry days, the best reds
        <span className="mr-1 ml-3 inline-block size-1.5 rounded-full bg-bark align-middle dark:bg-[#a08672]" /> wind or heavy rain
      </p>
    </section>
  )
}
