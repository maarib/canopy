import type { Trail } from '../lib/explore'
import { type ParkReport } from '../lib/ontarioParks'
import { LIST } from '../lib/styles'
import { ExploreSearch, type SearchProps } from './ExploreSearch'
import { ParkRow } from './rows'
import { TrailCard } from './TrailPanel'

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
                <ParkRow park={p} onClick={() => props.onSelectPark(p)} />
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
