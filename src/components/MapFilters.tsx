import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { FilterList } from 'relume-icons'
import { usePresence } from '../hooks'
import { Segmented } from './ui'

export type FilterTab = { id: string; label: string; active: number; content: ReactNode }

/**
 * A menu button on the map: Filters (trees, park activities) narrows what the map shows; Layers
 * changes how it looks; a round info button opens the legend. With several tabs, each shows how many of its options are set and the
 * button shows the total; a single tab shows its content without tabs.
 */
export function MapFilters({ tabs, label = 'Filters', icon = <FilterList className="size-5" />, iconOnly }: { tabs: FilterTab[]; label?: string; icon?: ReactNode; /** A round button with no text; `label` still names it. */ iconOnly?: boolean }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState(tabs[0].id)
  const [place, setPlace] = useState<CSSProperties>()
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const total = tabs.reduce((n, t) => n + t.active, 0)
  const presence = usePresence(open)

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
        aria-label={total ? `Map ${label.toLowerCase()}: ${total} set` : `Map ${label.toLowerCase()}`}
        className={`flex h-[42px] items-center justify-center gap-1.5 rounded-full border ${iconOnly ? 'w-[42px]' : 'px-3.5'} text-sm font-medium shadow-md transition-colors ${
          total
            ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
            : `border-[var(--line)] hover:bg-[var(--surface-2)] ${open ? 'bg-[var(--surface-2)]' : 'bg-[var(--surface)]'}`
        }`}
      >
        {icon}
        {!iconOnly && label}
        {total > 0 && <span className="rounded-full bg-[var(--surface)] px-1.5 text-xs leading-5 text-[var(--ink)]">{total}</span>}
      </button>

      {presence.mounted && (
        <div
          style={place}
          className={`fixed z-40 origin-top-left ${presence.closing ? 'pointer-events-none animate-pop-out' : 'animate-pop-in'} flex max-h-[min(72vh,600px)] flex-col rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-xl`}
        >
          {tabs.length > 1 && <Segmented
            className="m-2"
            value={current.id}
            onChange={setTab}
            options={tabs.map((t) => ({
              id: t.id,
              label: (
                <>
                  {t.label}
                  {t.active > 0 && <span className="rounded-full bg-brand px-1.5 text-[10px] leading-4 text-white">{t.active}</span>}
                </>
              ),
            }))}
          />}
          <div key={current.id} role={tabs.length > 1 ? 'tabpanel' : undefined} className={`min-h-0 animate-fade-in overflow-y-auto px-2 pb-3 ${tabs.length > 1 ? '' : 'pt-3'}`}>
            {current.content}
          </div>
        </div>
      )}
    </div>
  )
}
