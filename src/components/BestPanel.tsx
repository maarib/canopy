import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { daysFor, fetchForecasts, rankParks, type When } from '../lib/bestNow'
import { locate, LOCATION_HELP, useLocation } from '../lib/location'
import type { ParkReport } from '../lib/ontarioParks'
import { isListed } from '../lib/ontarioParks'
import { LIST } from '../lib/styles'
import { ParkRow } from './rows'
import { LocateIcon, MenuButton, MenuOption, Segmented, Skeleton } from './ui'

// "Best right now" and "Best this weekend" (/best): Ontario's parks with a fall color report,
// ranked by color, the forecast for those days and, once located, distance. Each row says why.

const WHEN: { id: When; label: string }[] = [
  { id: 'now', label: 'Right Now' },
  { id: 'weekend', label: 'This Weekend' },
]

/** Straight-line limits; "Any distance" until the person is located. */
const REACH = [100, 200, 400] as const

export function BestPanel({ parks, onSelectPark }: { parks: ParkReport[] | undefined; onSelectPark: (p: ParkReport) => void }) {
  const [when, setWhen] = useState<When>('now')
  const [reach, setReach] = useState<number | null>(null)
  const here = useLocation()
  const origin = here.status === 'on' ? here : null

  const reported = useMemo(() => (parks ?? []).filter((p) => p.report && isListed(p)), [parks])
  // One request for every park's week; it covers both lists. Refreshed after an hour.
  const forecasts = useQuery({
    queryKey: ['best-forecasts', reported.map((p) => p.id).join()],
    queryFn: () => fetchForecasts(reported),
    enabled: reported.length > 0,
    staleTime: 60 * 60 * 1000,
  })
  const byPark = useMemo(() => (forecasts.data ? new Map(reported.map((p, i) => [p.id, forecasts.data[i] ?? []])) : null), [forecasts.data, reported])

  const ranked = useMemo(() => {
    const all = rankParks(reported, byPark, when, origin)
    return reach && origin ? all.filter((r) => r.km != null && r.km <= reach) : all
  }, [reported, byPark, when, origin, reach])

  const days = daysFor(when)
  const dayNames = days.map((d) => d.name[0].toUpperCase() + d.name.slice(1)).join(' and ')

  return (
    <div className="space-y-4 p-5">
      <header>
        <h2 className="text-3xl leading-tight">{when === 'now' ? 'Best right now' : 'Best this weekend'}</h2>
        <p className="text-sm text-[var(--ink-soft)]">
          Ontario's parks with a fall color report, ranked by their color, the forecast for {dayNames.toLowerCase()}
          {origin ? ' and how far they are from you' : ''}.
        </p>
      </header>

      <Segmented options={WHEN} value={when} onChange={setWhen} label="When" />

      <div className="flex flex-wrap items-center gap-1.5">
        {origin ? (
          <MenuButton label="Distance" value={reach ? `Within ${reach} km` : undefined} active={!!reach}>
            {(close) => (
              <>
                <MenuOption selected={!reach} label="Any distance" onClick={() => (setReach(null), close())} />
                {REACH.map((km) => (
                  <MenuOption key={km} selected={reach === km} label={`Within ${km} km`} onClick={() => (setReach(km), close())} />
                ))}
              </>
            )}
          </MenuButton>
        ) : (
          <button
            onClick={locate}
            disabled={here.status === 'asking'}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-3 py-1.5 text-sm transition-colors hover:bg-[var(--surface-2)] disabled:opacity-60"
          >
            <LocateIcon className="size-4" />
            {here.status === 'asking' ? 'Finding You…' : 'Rank by Distance Too'}
          </button>
        )}
      </div>
      {(here.status === 'denied' || here.status === 'unavailable') && <p role="status" className="text-sm text-[var(--ink-soft)]">{LOCATION_HELP[here.status]}</p>}
      {forecasts.isError && <p className="text-sm text-[var(--ink-soft)]">The forecast could not be loaded, so this ranking uses color alone.</p>}

      {!parks || forecasts.isPending ? (
        <div role="status" aria-label="Ranking parks" className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex min-h-14 items-center gap-3">
              <Skeleton className="size-10 rounded-xl" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : ranked.length === 0 ? (
        <p className="text-sm text-[var(--ink-soft)]">No park with a color report is within {reach} km of you.</p>
      ) : (
        <ol className={`stagger ${LIST}`}>
          {ranked.map(({ park, reasons }) => (
            <li key={park.id}>
              <ParkRow park={park} detail={reasons.length ? reasons.join(' · ') : park.region} onClick={() => onSelectPark(park)} />
            </li>
          ))}
        </ol>
      )}

      <p className="text-[11px] leading-relaxed text-[var(--ink-soft)]">
        Color from the Ontario Parks Fall Colour Report; forecast from Open-Meteo. Heavy rain or strong wind counts against a park, since it strips leaves. Distances are in a straight line.
      </p>
    </div>
  )
}
