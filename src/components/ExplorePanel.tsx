import { ChevronRight } from 'relume-icons'
import type { Trail } from '../lib/explore'
import { parkTitle, type ParkReport } from '../lib/ontarioParks'
import { STAGES } from '../lib/stage'
import { LIST, ROW } from '../lib/styles'
import { ExploreSearch, type SearchProps } from './ExploreSearch'
import { TrailCard } from './TrailPanel'
import { Badge } from './ui'

// The Explore panel, opened from the landing page's view switch: the same search, then discovery
// (what's peaking, short hikes).

type Props = SearchProps & {
  onSelectPark: (p: ParkReport) => void
  onSelectTrail: (t: Trail) => void
  onNavigate: (path: string) => void
}

export function ExplorePanel(props: Props) {
  const peaking = props.parks
    .filter((p) => p.main && (p.stage === 'peak' || p.stage === 'near'))
    .sort((a, b) => (b.colorChange ?? 0) - (a.colorChange ?? 0))
    .slice(0, 5)
  const popular = [...props.trails].sort((a, b) => a.lengthKm - b.lengthKm).filter((t) => t.difficulty !== 'backpacking').slice(0, 3)
  const places = new Map(props.places.map((p) => [p.id, p] as const))

  return (
    <div className="space-y-7 p-5">
      <header>
        <h2 className="text-4xl leading-none">Find your next fall adventure</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">Parks, trails, lakes and peak color across Ontario, with fall color across Canada.</p>
      </header>

      <ExploreSearch {...props} />

      {peaking.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg">Peaking now in Ontario</h3>
            <button onClick={() => props.onNavigate('/foliage')} className="text-sm font-medium text-brand hover:underline">
              All reports
            </button>
          </div>
          <ul className={`stagger ${LIST}`}>
            {peaking.map((p) => (
              <li key={p.id}>
                <button onClick={() => props.onSelectPark(p)} className={ROW}>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)]">
                    <span className="size-3.5 rounded-full" style={{ background: STAGES[p.stage].color }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{parkTitle(p)}</span>
                    <span className="text-xs text-[var(--ink-soft)]">
                      {p.colorChange ?? 0}% color · {p.dominantColor}
                    </span>
                  </span>
                  <Badge size="sm" color={STAGES[p.stage].color}>{STAGES[p.stage].label}</Badge>
                  <ChevronRight className="size-4 shrink-0 text-[var(--ink-soft)]" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {popular.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg">Short fall hikes</h3>
            <button onClick={() => props.onNavigate('/places')} className="text-sm font-medium text-brand hover:underline">
              All trails
            </button>
          </div>
          <ul className={`stagger ${LIST}`}>
            {popular.map((t) => (
              <li key={t.id}>
                <TrailCard trail={t} places={places} onClick={() => props.onSelectTrail(t)} />
              </li>
            ))}
          </ul>
        </section>
      )}

    </div>
  )
}
