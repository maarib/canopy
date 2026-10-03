import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { FilterList } from 'relume-icons'

export type FilterTab = { id: string; label: string; active: number; content: ReactNode }

/**
 * One Filters button on the map for everything that narrows or changes what the map shows:
 * trees, park activities, layers. Tabs keep it compact; each tab shows how many of its
 * options are set, and the button shows the total.
 */
export function MapFilters({ tabs }: { tabs: FilterTab[] }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState(tabs[0].id)
  const [place, setPlace] = useState<CSSProperties>()
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const total = tabs.reduce((n, t) => n + t.active, 0)

  // Anchor to the viewport: below the button, left-aligned to it, never past either edge.
  const openMenu = () => {
    const r = button.current!.getBoundingClientRect()
    const width = Math.min(340, window.innerWidth - 24)
    setPlace({ top: r.bottom + 8, left: Math.max(12, Math.min(r.left, window.innerWidth - width - 12)), width })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
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

  const current = tabs.find((t) => t.id === tab) ?? tabs[0]
  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-expanded={open}
        aria-label={total ? `Map filters: ${total} set` : 'Map filters'}
        className={`flex h-[42px] items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors ${
          total
            ? 'border border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)] shadow-md'
            : `glass hover:brightness-105 ${open ? 'brightness-105' : ''}`
        }`}
      >
        <FilterList className="size-5" />
        Filters
        {total > 0 && <span className="rounded-full bg-[var(--surface)] px-1.5 text-xs leading-5 text-[var(--ink)]">{total}</span>}
      </button>

      {open && (
        <div
          style={place}
          className="fixed z-40 flex max-h-[min(72vh,600px)] flex-col rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-xl"
        >
          <div role="tablist" className="m-2 flex gap-1 rounded-full bg-[var(--surface-2)] p-1 text-sm">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={t.id === current.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-1 items-center justify-center gap-1 rounded-full px-2 py-1.5 font-medium transition ${
                  t.id === current.id ? 'bg-[var(--surface)] shadow-sm' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
                }`}
              >
                {t.label}
                {t.active > 0 && <span className="rounded-full bg-maple px-1.5 text-[10px] leading-4 text-white">{t.active}</span>}
              </button>
            ))}
          </div>
          <div role="tabpanel" className="min-h-0 overflow-y-auto px-2 pb-3">
            {current.content}
          </div>
        </div>
      )}
    </div>
  )
}
