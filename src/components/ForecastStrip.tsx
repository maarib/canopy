import { useQuery } from '@tanstack/react-query'
import { Skeleton } from './ui'
import { fetchForecast, weatherEmoji } from '../lib/weather'

export function ForecastStrip({ lat, lng }: { lat: number; lng: number }) {
  const forecast = useQuery({
    queryKey: ['forecast', lat.toFixed(2), lng.toFixed(2)],
    queryFn: () => fetchForecast(lat, lng),
  })

  return (
    <section>
      <h3 className="mb-2 text-lg">7-day weather forecast</h3>
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
          <button onClick={() => forecast.refetch()} className="rounded-full px-2 py-0.5 text-brand transition-colors hover:bg-brand/10">
            Try again
          </button>
        </p>
      )}
      {forecast.data && (
        <ol className="grid grid-cols-7 gap-1 text-center text-xs">
          {forecast.data.map((d) => (
              <li key={d.date} className="rounded-lg bg-[var(--surface-2)] px-0.5 py-2">
                <div className="text-[var(--ink-soft)]">
                  {new Date(`${d.date}T12:00`).toLocaleDateString('en-CA', { weekday: 'short' })}
                </div>
                <div className="my-1 text-base">{weatherEmoji(d.weatherCode)}</div>
                <div className="font-medium">{Math.round(d.tMax)}°</div>
                <div className="text-[var(--ink-soft)]">{Math.round(d.tMin)}°</div>
              </li>
          ))}
        </ol>
      )}
    </section>
  )
}
