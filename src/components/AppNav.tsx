import type { ReactNode } from 'react'
import { Bookmark, Search } from 'relume-icons'
import { PlaceIcon } from './PlaceIcon'
import { TreeIcon } from './TreeIcon'
import { TAB_BAR_HEIGHT } from '../lib/styles'

// The app's sections. Desktop: a slim rail left of the panel. Phones: a bottom tab bar
// (the pattern Airbnb and AllTrails both use), with the sheet sitting above it.

export type Section = 'explore' | 'parks' | 'trails' | 'colours' | 'trips'

const SECTIONS: { id: Section; path: string; label: string; icon: (active: boolean) => ReactNode }[] = [
  { id: 'explore', path: '/', label: 'Explore', icon: () => <Search className="size-6" /> },
  { id: 'parks', path: '/parks', label: 'Parks', icon: () => <PlaceIcon kind="peak" className="size-6" /> },
  { id: 'trails', path: '/trails', label: 'Trails', icon: () => <PlaceIcon kind="trail" className="size-6" /> },
  { id: 'colours', path: '/colours', label: 'Fall colours', icon: () => <TreeIcon id="maples" tone="mono" className="size-6" /> },
  { id: 'trips', path: '/trips', label: 'Trips', icon: () => <Bookmark className="size-6" /> },
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
              on ? 'bg-[var(--surface-2)] text-[var(--ink)]' : 'text-[var(--ink-soft)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]'
            }`}
          >
            <span className="relative">
              {s.icon(on)}
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
              on ? 'text-maple' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
            }`}
          >
            <span className="relative">
              {s.icon(on)}
              {s.id === 'trips' && <Badge n={tripCount} />}
            </span>
            {s.label}
          </button>
        )
      })}
    </nav>
  )
}
