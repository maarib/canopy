import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, FilterList, KeyboardArrowDown, Search } from 'relume-icons'
import { PROVINCES, PROVINCE_BY_CODE, type ProvinceCode } from '../data/provinces'
import type { TreeIconId } from '../data/treeIcons'
import { usePresence } from '../hooks'
import { PLACE_KINDS, type Place, type Trail } from '../lib/explore'
import type { ParkReport } from '../lib/ontarioParks'
import { STAGES } from '../lib/stage'
import type { SearchResult } from '../lib/search'
import { treeOptions, type TreeFilterValue } from '../lib/treeOptions'
import { PlaceIcon } from './PlaceIcon'
import { SearchBox } from './SearchBox'
import { TreeIcon } from './TreeIcon'

// Explore is a search, Airbnb-style: type a name, or pick where (province) and what you're after.
// The same card is the landing page (over the map, with quick links under it) and the top of the
// Explore panel. Over the map it sits at the bottom of the screen, so its lists open upward.

export type LookingFor = 'everything' | 'colors' | 'parks' | 'trails' | 'places'

const WHAT: { id: LookingFor; label: string; hint: string; icon: ReactNode; ontarioOnly?: boolean }[] = [
  { id: 'everything', label: 'Everything', hint: 'Show it all on the map', icon: <Search className="size-5" /> },
  { id: 'colors', label: 'Fall colors', hint: 'Peak timing, reports and tree sightings', icon: <TreeIcon id="maples" className="size-5" /> },
  { id: 'parks', label: 'Parks', hint: 'Provincial parks with color reports', icon: <PlaceIcon kind="peak" className="size-5" />, ontarioOnly: true },
  { id: 'trails', label: 'Trails', hint: 'Day hikes and backpacking routes', icon: <PlaceIcon kind="trail" className="size-5" />, ontarioOnly: true },
  { id: 'places', label: 'Lakes & waterfalls', hint: 'Falls, lookouts, lakes and peaks', icon: <PlaceIcon kind="waterfall" className="size-5" />, ontarioOnly: true },
]

export type ExploreQuery = { province: ProvinceCode; what: LookingFor; tree: TreeFilterValue }

export type SearchProps = {
  parks: ParkReport[]
  trails: Trail[]
  places: Place[]
  treeCounts: Map<string, number>
  onSearchSelect: (r: SearchResult) => void
  onSubmit: (q: ExploreQuery) => void
}

/** A labelled field that opens a list below it, like Airbnb's search segments. */
function Field({ label, value, icon, up, children }: { label: string; value: string; icon?: ReactNode; /** Open the list above the row. */ up?: boolean; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false)
  const presence = usePresence(open)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return (
    // Not `relative`: the list anchors to the row around the fields, so it spans the whole card.
    <div ref={root} className="min-w-0 flex-1">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left transition-colors hover:bg-[var(--surface-2)] ${open ? 'bg-[var(--surface-2)]' : ''}`}
      >
        {icon}
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold tracking-wide text-[var(--ink-soft)] uppercase">{label}</span>
          <span className="block truncate text-sm font-medium">{value}</span>
        </span>
        <KeyboardArrowDown className={`size-4 shrink-0 text-[var(--ink-soft)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {presence.mounted && (
        <div
          role="listbox"
          className={`absolute inset-x-0 z-30 max-h-80 ${up ? 'bottom-full mb-1 origin-bottom' : 'top-full mt-1 origin-top'} ${presence.closing ? 'pointer-events-none animate-pop-out' : 'animate-pop-in'} overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-xl`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

function Option({ selected, disabled, onClick, icon, label, hint }: { selected: boolean; disabled?: boolean; onClick: () => void; icon?: ReactNode; label: string; hint?: string }) {
  return (
    <button
      role="option"
      aria-selected={selected}
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left text-sm transition-colors ${
        selected ? 'bg-brand/10' : 'hover:bg-[var(--surface-2)]'
      } disabled:cursor-default disabled:opacity-45 disabled:hover:bg-transparent`}
    >
      {icon && <span className="flex size-6 shrink-0 items-center justify-center text-[var(--ink-soft)]">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className={`block ${selected ? 'font-semibold' : 'font-medium'}`}>{label}</span>
        {hint && <span className="block text-xs text-[var(--ink-soft)]">{hint}</span>}
      </span>
      {selected && <Check className="size-4 shrink-0 text-brand" />}
    </button>
  )
}

/**
 * The search card. `up` opens its lists above it (when it sits at the bottom of the screen);
 * `compact` starts with only the search box, and a button reveals Where and Looking for.
 */
export function ExploreSearch({ up, compact, autoFocus, ...props }: SearchProps & { up?: boolean; compact?: boolean; autoFocus?: boolean }) {
  const [province, setProvince] = useState<ProvinceCode>('ON')
  const [what, setWhat] = useState<LookingFor>('everything')
  const [tree, setTree] = useState<TreeFilterValue>('trees')
  const [expanded, setExpanded] = useState(false)
  const full = PROVINCE_BY_CODE.get(province)!.full
  const whatItem = WHAT.find((w) => w.id === what)!
  const trees = treeOptions(props.treeCounts)
  const treeItem = trees.find((t) => t.id === tree) ?? trees[0]
  const showFields = !compact || expanded
  return (
      <section aria-label="Search" className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-2 shadow-md">
        <div className="flex items-center gap-1.5 p-1">
          <div className="min-w-0 flex-1">
            <SearchBox parks={props.parks} trails={props.trails} places={props.places} onSelect={props.onSearchSelect} up={up} autoFocus={autoFocus} />
          </div>
          {compact && (
            <button
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-label="Where and what to look for"
              className={`flex size-[42px] shrink-0 items-center justify-center rounded-full border border-[var(--line)] transition-colors hover:bg-[var(--surface-2)] ${expanded ? 'bg-[var(--surface-2)]' : ''}`}
            >
              <FilterList className="size-5" />
            </button>
          )}
        </div>
        {showFields && (
          <>
        <div className="relative mt-1 flex gap-1 border-t border-[var(--line)] pt-1">
          <Field up={up} label="Where" value={PROVINCE_BY_CODE.get(province)!.name}>
            {(close) =>
              PROVINCES.map((p) => (
                <Option
                  key={p.code}
                  selected={p.code === province}
                  label={p.name}
                  hint={p.full ? 'Parks, trails, fishing and fall color' : 'Fall color regions and sightings'}
                  onClick={() => {
                    setProvince(p.code)
                    if (!p.full && WHAT.find((w) => w.id === what)?.ontarioOnly) setWhat('colors')
                    close()
                  }}
                />
              ))
            }
          </Field>
          <span className="my-2 w-px bg-[var(--line)]" />
          <Field up={up} label="Looking for" value={whatItem.label}>
            {(close) =>
              WHAT.map((w) => (
                <Option
                  key={w.id}
                  selected={w.id === what}
                  disabled={w.ontarioOnly && !full}
                  icon={w.icon}
                  label={w.label}
                  hint={w.ontarioOnly && !full ? 'Ontario only for now' : w.hint}
                  onClick={() => {
                    setWhat(w.id)
                    close()
                  }}
                />
              ))
            }
          </Field>
        </div>
        {what === 'colors' && (
          <div className="relative flex border-t border-[var(--line)] pt-1">
            <Field
              up={up}
              label="Trees"
              value={treeItem.label}
              icon={treeItem.icon ? <TreeIcon id={treeItem.icon as TreeIconId} className="size-6 shrink-0" /> : undefined}
            >
              {(close) =>
                trees.map((t) => (
                  <Option
                    key={t.id}
                    selected={t.id === tree}
                    icon={t.icon ? <TreeIcon id={t.icon} className="size-5" /> : <TreeIcon id="maples" tone="mono" className="size-4" />}
                    label={t.label}
                    hint={t.n ? `${t.n} seen turning, last 14 days` : undefined}
                    onClick={() => {
                      setTree(t.id)
                      close()
                    }}
                  />
                ))
              }
            </Field>
          </div>
        )}
        <button
          onClick={() => props.onSubmit({ province, what, tree })}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.99]"
        >
          <Search className="size-5" />
          {what === 'everything' ? `Explore ${PROVINCE_BY_CODE.get(province)!.name}` : `Show ${whatItem.label.toLowerCase()}`}
        </button>
          </>
        )}
      </section>
  )
}

const QUICK: { label: string; path: string; icon: ReactNode; color: string }[] = [
  { label: 'Peaking now', path: '/parks', icon: <TreeIcon id="maples" tone="mono" className="size-4" />, color: STAGES.peak.color },
  { label: 'Easy trails', path: '/places?level=easy', icon: <PlaceIcon kind="trail" className="size-4" />, color: PLACE_KINDS.trail.color },
  { label: 'Waterfalls & lookouts', path: '/places?show=waterfall', icon: <PlaceIcon kind="waterfall" className="size-4" />, color: PLACE_KINDS.waterfall.color },
]

/** Quick links under the landing page's search: each opens the panel on a ready-made list. */
function QuickLinks({ onNavigate, compact }: { onNavigate: (path: string) => void; compact: boolean }) {
  return (
    // Centred on desktop; on phones the row scrolls sideways, edge to edge.
    <nav aria-label="Quick lists" className={`pointer-events-auto mt-3 flex gap-2 ${compact ? '-mx-3 overflow-x-auto px-3 pb-1 [scrollbar-width:none]' : 'justify-center'}`}>
      {QUICK.map((q) => (
        <button
          key={q.path}
          onClick={() => onNavigate(q.path)}
          className="flex shrink-0 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] py-1 pr-3.5 pl-1 text-sm shadow-md transition-colors hover:bg-[var(--surface-2)] active:scale-[0.97]"
        >
          <span className="flex size-7 items-center justify-center rounded-full text-white" style={{ background: q.color }}>
            {q.icon}
          </span>
          {q.label}
        </button>
      ))}
    </nav>
  )
}

/**
 * The landing page: the map takes the screen, and the search sits over its lower edge with quick
 * links under it. Only the card and links take clicks; the map stays draggable around them.
 */
export function ExploreLanding({ compact, onNavigate, ...search }: SearchProps & { compact: boolean; onNavigate: (path: string) => void }) {
  return (
    <div className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 animate-fade-in px-3 ${compact ? 'pb-10' : 'pb-8'}`}>
      <div className="pointer-events-auto mx-auto max-w-xl">
        <ExploreSearch {...search} up compact={compact} autoFocus />
      </div>
      <QuickLinks onNavigate={onNavigate} compact={compact} />
    </div>
  )
}
