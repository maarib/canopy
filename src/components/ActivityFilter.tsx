import { Check } from 'relume-icons'
import { PARK_FILTER_GROUPS } from '../data/amenityIcons'
import { AmenityIcon } from './ParkAmenities'

/**
 * Filter Ontario Parks by what you can do there. Selections combine (a park must offer all of
 * them). `countWith(ids)` returns how many parks match a set of filters, so each row shows how
 * many parks would remain if you added it; rows that would leave none are disabled.
 * Used in the map's Filters menu and on the Parks page.
 */
export function ActivityOptions({
  value,
  onChange,
  countWith,
  ready,
}: {
  value: string[]
  onChange: (ids: string[]) => void
  countWith: (ids: string[]) => number
  ready: boolean
}) {
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  const active = value.length > 0

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 px-2 pb-1">
        <p className="text-xs text-[var(--ink-soft)]" aria-live="polite">
          {!ready ? 'Loading park facilities…' : active ? `${countWith(value)} Ontario Parks offer all of these` : 'Ontario Parks that offer…'}
        </p>
        {active && (
          <button onClick={() => onChange([])} className="rounded-full px-2 py-1 text-xs font-medium text-maple transition-colors hover:bg-maple/10">
            Clear
          </button>
        )}
      </div>
      {PARK_FILTER_GROUPS.map((g) => (
        <section key={g.title} className="pt-2">
          <h3 className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-[var(--ink-soft)] uppercase">{g.title}</h3>
          <ul>
            {g.filters.map((f) => {
              const on = value.includes(f.id)
              const n = ready ? countWith(on ? value : [...value, f.id]) : null
              const empty = n === 0 && !on
              return (
                <li key={f.id}>
                  <button
                    role="menuitemcheckbox"
                    aria-checked={on}
                    disabled={empty}
                    onClick={() => toggle(f.id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                      on ? 'bg-maple/10 font-medium' : 'hover:bg-[var(--surface-2)]'
                    } disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent`}
                  >
                    <AmenityIcon icon={f.icon} size={22} />
                    <span className="min-w-0 flex-1">{f.label}</span>
                    {n != null && <span className="text-xs tabular-nums text-[var(--ink-soft)]">{n}</span>}
                    <span
                      aria-hidden
                      className={`flex size-4 items-center justify-center rounded border ${on ? 'border-maple bg-maple text-white' : 'border-[var(--line)]'}`}
                    >
                      {on && <Check className="size-3" />}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
