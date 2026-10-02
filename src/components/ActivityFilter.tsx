import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Check, FilterList } from 'relume-icons'
import { PARK_FILTER_GROUPS } from '../data/amenityIcons'
import { AmenityIcon } from './ParkAmenities'

/**
 * Filter Ontario Parks pins by what you can do there. Selections combine (a park must offer
 * all of them). `countWith(ids)` returns how many parks match a set of filters, so each row
 * shows how many parks would remain if you added it.
 */
export function ActivityFilter({
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
  const [open, setOpen] = useState(false)
  const [place, setPlace] = useState<CSSProperties>()
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)

  // The button sits left of Layers, so anchor the menu to the viewport: below the button,
  // right-aligned to it where there's room, never past either screen edge.
  const openMenu = () => {
    const r = button.current!.getBoundingClientRect()
    const width = Math.min(320, window.innerWidth - 24)
    const right = Math.min(window.innerWidth - r.right, window.innerWidth - width - 12)
    setPlace({ top: r.bottom + 8, right: Math.max(12, right), width })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    // The menu is placed from the button's position when it opens; close rather than drift on resize.
    const onResize = () => setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  const active = value.length > 0

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-expanded={open}
        aria-label={active ? `Park activities: ${value.length} selected` : 'Filter parks by activity'}
        className={`flex h-[42px] items-center gap-1.5 rounded-full border px-3 text-sm font-medium shadow-md transition-colors ${
          active
            ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
            : `border-[var(--line)] hover:bg-[var(--surface-2)] ${open ? 'bg-[var(--surface-2)]' : 'bg-[var(--surface)]'}`
        }`}
      >
        <FilterList className="size-5" />
        <span className="hidden sm:inline">Activities</span>
        {active && <span className="rounded-full bg-[var(--surface)] px-1.5 text-xs leading-5 text-[var(--ink)]">{value.length}</span>}
      </button>

      {open && (
        <div
          style={place}
          className="fixed z-40 flex max-h-[min(70vh,560px)] flex-col rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-xl"
        >
          <div className="flex items-baseline justify-between gap-2 border-b border-[var(--line)] px-4 pt-3 pb-2">
            <div>
              <p className="text-sm font-semibold">Ontario Parks with…</p>
              <p className="text-xs text-[var(--ink-soft)]" aria-live="polite">
                {!ready ? 'Loading park facilities…' : active ? `${countWith(value)} parks offer all of these` : 'Pick one or more'}
              </p>
            </div>
            {active && (
              <button onClick={() => onChange([])} className="rounded-full px-2 py-1 text-xs font-medium text-maple transition-colors hover:bg-maple/10">
                Clear
              </button>
            )}
          </div>
          <div className="overflow-y-auto px-2 pb-2">
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
        </div>
      )}
    </div>
  )
}
