import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, FilterList, KeyboardArrowDown, Search } from 'relume-icons'
import { PROVINCES, PROVINCE_BY_CODE, type ProvinceCode } from '../data/provinces'
import type { TreeIconId } from '../data/treeIcons'
import { usePresence } from '../hooks'
import { formatDuration, PLACE_KINDS, type Place, type Trail } from '../lib/explore'
import { parkTitle, type ParkReport } from '../lib/ontarioParks'
import { STAGE_ORDER, STAGES } from '../lib/stage'
import type { SearchResult } from '../lib/search'
import { treeOptions, type TreeFilterValue } from '../lib/treeOptions'
import { PlaceIcon, type PlaceIconId } from './PlaceIcon'
import { SearchBox } from './SearchBox'
import { TreeIcon } from './TreeIcon'
import { Badge } from './ui'

// Explore is a search, Airbnb-style: type a name, or pick where (province) and what you're after.
// The same card is the landing page (over the map, with short lists under it) and the top of the
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
export function ExploreSearch({ up, compact, ...props }: SearchProps & { up?: boolean; compact?: boolean }) {
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
            <SearchBox parks={props.parks} trails={props.trails} places={props.places} onSelect={props.onSearchSelect} up={up} />
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

type ListProps = {
  onSelectPark: (p: ParkReport) => void
  onSelectTrail: (t: Trail) => void
  onSelectPlace: (p: Place) => void
  onNavigate: (path: string) => void
}

/** One short list on the landing page: a title, a link to the full list, and up to three rows. */
function ShortList({ title, all, onAll, children }: { title: string; all: string; onAll: () => void; children: ReactNode }) {
  return (
    <section className="pointer-events-auto w-[78%] max-w-xs shrink-0 snap-start rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-2 shadow-md md:w-auto md:max-w-none md:min-w-0 md:flex-1">
      <div className="flex items-baseline justify-between px-2 pt-1 pb-0.5">
        <h3 className="text-base">{title}</h3>
        <button onClick={onAll} className="text-xs font-medium text-brand hover:underline">
          {all}
        </button>
      </div>
      <ul>{children}</ul>
    </section>
  )
}

function ShortRow({ icon, name, detail, badge, onClick }: { icon: ReactNode; name: string; detail: string; badge?: ReactNode; onClick: () => void }) {
  return (
    <li>
      <button onClick={onClick} className="flex w-full items-center gap-2.5 rounded-2xl px-2 py-1.5 text-left transition-colors hover:bg-[var(--surface-2)]">
        {icon}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{name}</span>
          <span className="block truncate text-xs text-[var(--ink-soft)]">{detail}</span>
        </span>
        {badge}
      </button>
    </li>
  )
}

const tile = (kind: PlaceIconId, color: string) => (
  <span className="flex size-7 shrink-0 items-center justify-center rounded-full text-white" style={{ background: color }}>
    <PlaceIcon kind={kind} className="size-4" />
  </span>
)

/** Three short lists under the landing page's search: what's peaking, easy trails, and photo spots. */
function LandingLists({ parks, trails, places, onSelectPark, onSelectTrail, onSelectPlace, onNavigate }: Pick<SearchProps, 'parks' | 'trails' | 'places'> & ListProps) {
  const peaking = parks
    .filter((p) => p.main && (p.stage === 'peak' || p.stage === 'near'))
    .sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage) || (b.colorChange ?? 0) - (a.colorChange ?? 0))
    .slice(0, 3)
  const easy = trails.filter((t) => t.difficulty === 'easy').sort((a, b) => a.lengthKm - b.lengthKm).slice(0, 3)
  // Named waterfalls and lookouts, the ones on the most trails first.
  const spots = places
    .filter((p) => (p.kind === 'waterfall' || p.kind === 'viewpoint') && !/^(Lookout on|Lookout$|Falls on|Unnamed)/.test(p.name))
    .sort((a, b) => b.trails.length - a.trails.length || a.name.localeCompare(b.name))
    .slice(0, 3)
  if (!peaking.length && !easy.length && !spots.length) return null
  return (
    // A row of three on desktop; on phones it scrolls sideways, edge to edge.
    <div className="-mx-3 mt-3 flex snap-x gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] md:mx-auto md:max-w-4xl md:overflow-visible md:px-0">
      {peaking.length > 0 && (
        <ShortList title="Peaking now" all="All parks" onAll={() => onNavigate('/parks')}>
          {peaking.map((p) => (
            <ShortRow
              key={p.id}
              icon={<span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)]"><span className="size-3 rounded-full" style={{ background: STAGES[p.stage].color }} /></span>}
              name={parkTitle(p)}
              detail={`${p.region} · ${p.colorChange ?? 0}% color`}
              badge={<Badge size="sm" color={STAGES[p.stage].color}>{STAGES[p.stage].label}</Badge>}
              onClick={() => onSelectPark(p)}
            />
          ))}
        </ShortList>
      )}
      {easy.length > 0 && (
        <ShortList title="Easy trails" all="All trails" onAll={() => onNavigate('/places')}>
          {easy.map((t) => (
            <ShortRow key={t.id} icon={tile('trail', PLACE_KINDS.trail.color)} name={t.name} detail={`${t.lengthKm} km · ${formatDuration(t.durationH)}`} onClick={() => onSelectTrail(t)} />
          ))}
        </ShortList>
      )}
      {spots.length > 0 && (
        <ShortList title="Waterfalls & lookouts" all="All waterfalls" onAll={() => onNavigate('/places?show=waterfall')}>
          {spots.map((p) => (
            <ShortRow
              key={p.id}
              icon={tile(p.kind, PLACE_KINDS[p.kind].color)}
              name={p.name}
              detail={`${PLACE_KINDS[p.kind].label}${p.trails.length ? ` · on ${p.trails.length} trail${p.trails.length > 1 ? 's' : ''}` : ''}`}
              onClick={() => onSelectPlace(p)}
            />
          ))}
        </ShortList>
      )}
    </div>
  )
}

/**
 * The landing page: the map takes the screen, and the search sits over its lower edge with three
 * short lists under it. Only the cards take clicks; the map stays draggable between them.
 */
export function ExploreLanding({ compact, onSelectPark, onSelectTrail, onSelectPlace, onNavigate, ...search }: SearchProps & ListProps & { compact: boolean }) {
  return (
    <div className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 animate-fade-in px-3 ${compact ? 'pb-10' : 'pb-20'}`}>
      <div className="pointer-events-auto mx-auto max-w-xl">
        <ExploreSearch {...search} up compact={compact} />
      </div>
      <LandingLists parks={search.parks} trails={search.trails} places={search.places} onSelectPark={onSelectPark} onSelectTrail={onSelectTrail} onSelectPlace={onSelectPlace} onNavigate={onNavigate} />
    </div>
  )
}
