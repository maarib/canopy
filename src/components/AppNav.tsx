import type { ReactNode } from 'react'
import { Search } from 'relume-icons'
import { LEAF_SHAPES } from '../lib/leafShapes'
import { TAB_BAR_HEIGHT } from '../lib/styles'

// The app's sections. Desktop: a slim rail left of the panel. Phones: a bottom tab bar
// (the pattern Airbnb and AllTrails both use), with the sheet sitting above it.

export type Section = 'explore' | 'parks' | 'trails' | 'colours' | 'trips'

// Nav icons share Relume's outline weight (~1.7px at 24px). The selected section shows a
// filled version. Search has no solid form, so it gets a heavier stroke instead.
const STROKE = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
const svg = (children: ReactNode, viewBox = '0 0 24 24') => (
  <svg viewBox={viewBox} className="size-6" aria-hidden>
    {children}
  </svg>
)

/** Relume's bookmark silhouette (outline) and the same outer contour filled. */
const BOOKMARK_OUTER =
  'M12.0001 18.1677L7.23159 20.2077C6.66392 20.4524 6.12517 20.4065 5.61534 20.07C5.1055 19.7335 4.85059 19.2573 4.85059 18.6415V4.42898C4.85059 3.96731 5.0195 3.56706 5.35734 3.22823C5.695 2.88923 6.09384 2.71973 6.55384 2.71973H17.4463C17.908 2.71973 18.3083 2.88923 18.6471 3.22823C18.9861 3.56706 19.1556 3.96731 19.1556 4.42898V18.6415C19.1556 19.2573 18.8997 19.7335 18.3878 20.07C17.876 20.4065 17.3363 20.4524 16.7686 20.2077L12.0001 18.1677Z'
const BOOKMARK_INNER = 'M12.0001 16.3455L17.4463 18.6415V4.42898H6.55384V18.6415L12.0001 16.3455Z'
const MAPLE = LEAF_SHAPES.maples.blades[0].d

const ICONS: Record<Section, (active: boolean) => ReactNode> = {
  explore: (active) => <Search className={`size-6 ${active ? 'stroke-current stroke-[0.9]' : ''}`} />,
  parks: (active) =>
    svg(
      <>
        <path d="M2.75 19.25 9 8.75l3.75 6.1 2.6-3.85 5.9 8.25Z" {...STROKE} fill={active ? 'currentColor' : 'none'} />
        <circle cx="17" cy="5.75" r="1.9" {...STROKE} fill={active ? 'currentColor' : 'none'} />
      </>,
    ),
  trails: (active) =>
    svg(
      <>
        <path d="M12 3v18M9 21h6" {...STROKE} />
        <path d="M12 5.25h6.1l2.15 2.4-2.15 2.4H12Z" {...STROKE} fill={active ? 'currentColor' : 'none'} />
        <path d="M12 11.9H5.9l-2.15 2.4 2.15 2.4H12Z" {...STROKE} fill={active ? 'currentColor' : 'none'} />
      </>,
    ),
  colours: (active) =>
    svg(
      <>
        <path d={MAPLE} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={7} strokeLinejoin="round" />
        <path d="M50 70v24" fill="none" stroke="currentColor" strokeWidth={7} strokeLinecap="round" />
      </>,
      '0 0 100 100',
    ),
  trips: (active) =>
    svg(active ? <path d={BOOKMARK_OUTER} fill="currentColor" /> : <path d={BOOKMARK_OUTER + BOOKMARK_INNER} fill="currentColor" fillRule="evenodd" />),
}

const SECTIONS: { id: Section; path: string; label: string }[] = [
  { id: 'explore', path: '/', label: 'Explore' },
  { id: 'parks', path: '/parks', label: 'Parks' },
  { id: 'trails', path: '/trails', label: 'Trails' },
  { id: 'colours', path: '/colours', label: 'Fall colours' },
  { id: 'trips', path: '/trips', label: 'Trips' },
]

type Props = { active: Section | null; onNavigate: (path: string) => void; tripCount: number }

function Badge({ n }: { n: number }) {
  if (!n) return null
  return (
    <span className="absolute -top-1 -right-2 rounded-full bg-maple px-1.5 text-[10px] leading-4 font-semibold text-white">{n}</span>
  )
}

export function SideNav({ active, onNavigate, tripCount }: Props) {
  return (
    <nav aria-label="Sections" className="flex w-[84px] shrink-0 flex-col items-stretch gap-1 border-r border-[var(--line)] px-2 py-3">
      {SECTIONS.map((s) => {
        const on = active === s.id
        return (
          <button
            key={s.id}
            onClick={() => onNavigate(s.path)}
            aria-current={on ? 'page' : undefined}
            className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-[11px] leading-tight font-medium transition-colors ${
              on ? 'bg-[var(--surface-2)] font-semibold text-[var(--ink)]' : 'text-[var(--ink-soft)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]'
            }`}
          >
            <span className="relative">
              {ICONS[s.id](on)}
              {s.id === 'trips' && <Badge n={tripCount} />}
            </span>
            <span className="text-center">{s.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export function TabBar({ active, onNavigate, tripCount }: Props) {
  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-30 flex border-t border-[var(--line)] bg-[var(--surface)] pb-[env(safe-area-inset-bottom)]"
      style={{ height: TAB_BAR_HEIGHT }}
    >
      {SECTIONS.map((s) => {
        const on = active === s.id
        return (
          <button
            key={s.id}
            onClick={() => onNavigate(s.path)}
            aria-current={on ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium transition-colors ${
              on ? 'font-semibold text-[var(--ink)]' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
            }`}
          >
            <span className="relative">
              {ICONS[s.id](on)}
              {s.id === 'trips' && <Badge n={tripCount} />}
            </span>
            {s.label}
          </button>
        )
      })}
    </nav>
  )
}
