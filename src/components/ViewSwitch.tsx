import type { SnapPoint } from './BottomSheet'
import { ViewIcon } from './ui'

const VIEWS: { snap: SnapPoint; icon: 'map' | 'split' | 'panel'; label: string }[] = [
  { snap: 'peek', icon: 'map', label: 'Map' },
  { snap: 'half', icon: 'split', label: 'Map and panel' },
  { snap: 'full', icon: 'panel', label: 'Panel' },
]

/** Always on screen, in the header: the map alone, the map with the panel, or the panel alone. */
export function ViewSwitch({ view, onChange }: { view: SnapPoint; onChange: (v: SnapPoint) => void }) {
  return (
    <div role="radiogroup" aria-label="View" className="flex gap-0.5 rounded-full border border-[var(--line)] bg-[var(--surface)] p-1">
      {VIEWS.map((v) => (
        <button
          key={v.snap}
          role="radio"
          aria-checked={view === v.snap}
          aria-label={v.label}
          title={v.label}
          onClick={() => onChange(v.snap)}
          className={`flex items-center justify-center rounded-full transition-colors active:scale-[0.97] h-8 w-9 ${
            view === v.snap ? 'bg-brand text-white' : 'text-[var(--ink-soft)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]'
          }`}
        >
          <ViewIcon view={v.icon} />
        </button>
      ))}
    </div>
  )
}
