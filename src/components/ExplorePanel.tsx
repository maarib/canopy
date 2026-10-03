import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronRight, KeyboardArrowDown, Search } from 'relume-icons'
import { PROVINCES, PROVINCE_BY_CODE, type ProvinceCode } from '../data/provinces'
import type { TreeIconId } from '../data/treeIcons'
import { PLACE_KINDS, type Place, type Trail } from '../lib/explore'
import { parkTitle, type ParkReport } from '../lib/ontarioParks'
import type { SearchResult } from '../lib/search'
import { STAGES } from '../lib/stage'
import { LIST, ROW } from '../lib/styles'
import { treeOptions, type TreeFilterValue } from '../lib/treeOptions'
import { PlaceIcon } from './PlaceIcon'
import { SearchBox } from './SearchBox'
import { TrailCard } from './TrailPanel'
import { TreeIcon } from './TreeIcon'

// The home page is a search, Airbnb-style: pick where (province) and what you're after, or
// type a name. Discovery (what's peaking, popular trails) sits underneath as secondary help.

export type LookingFor = 'everything' | 'colours' | 'parks' | 'trails' | 'places'

const WHAT: { id: LookingFor; label: string; hint: string; icon: ReactNode; ontarioOnly?: boolean }[] = [
  { id: 'everything', label: 'Everything', hint: 'Show it all on the map', icon: <Search className="size-5" /> },
  { id: 'colours', label: 'Fall colours', hint: 'Peak timing, reports and tree sightings', icon: <TreeIcon id="maples" className="size-5" /> },
  { id: 'parks', label: 'Parks', hint: 'Provincial parks with colour reports', icon: <PlaceIcon kind="peak" className="size-5" />, ontarioOnly: true },
  { id: 'trails', label: 'Trails', hint: 'Day hikes and backpacking routes', icon: <PlaceIcon kind="trail" className="size-5" />, ontarioOnly: true },
  { id: 'places', label: 'Lakes & waterfalls', hint: 'Falls, lookouts, lakes and peaks', icon: <PlaceIcon kind="waterfall" className="size-5" />, ontarioOnly: true },
]

export type ExploreQuery = { province: ProvinceCode; what: LookingFor; tree: TreeFilterValue }

type Props = {
  parks: ParkReport[]
  trails: Trail[]
  places: Place[]
  treeCounts: Map<string, number>
  onSearchSelect: (r: SearchResult) => void
  onSubmit: (q: ExploreQuery) => void
  onSelectPark: (p: ParkReport) => void
  onSelectTrail: (t: Trail) => void
  onNavigate: (path: string) => void
}

/** A labelled field that opens a list below it, like Airbnb's search segments. */
function Field({ label, value, icon, children }: { label: string; value: string; icon?: ReactNode; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false)
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
      {open && (
        <div
          role="listbox"
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-80 overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-xl"
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
        selected ? 'bg-maple/10' : 'hover:bg-[var(--surface-2)]'
      } disabled:cursor-default disabled:opacity-45 disabled:hover:bg-transparent`}
    >
      {icon && <span className="flex size-6 shrink-0 items-center justify-center text-[var(--ink-soft)]">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className={`block ${selected ? 'font-semibold' : 'font-medium'}`}>{label}</span>
        {hint && <span className="block text-xs text-[var(--ink-soft)]">{hint}</span>}
      </span>
      {selected && <Check className="size-4 shrink-0 text-maple" />}
    </button>
  )
}

export function ExplorePanel(props: Props) {
  const [province, setProvince] = useState<ProvinceCode>('ON')
  const [what, setWhat] = useState<LookingFor>('everything')
  const [tree, setTree] = useState<TreeFilterValue>('trees')
  const full = PROVINCE_BY_CODE.get(province)!.full
  const whatItem = WHAT.find((w) => w.id === what)!
  const trees = treeOptions(props.treeCounts)
  const treeItem = trees.find((t) => t.id === tree) ?? trees[0]

  const peaking = props.parks
    .filter((p) => p.main && (p.stage === 'peak' || p.stage === 'near'))
    .sort((a, b) => (b.colourChange ?? 0) - (a.colourChange ?? 0))
    .slice(0, 5)
  const popular = [...props.trails].sort((a, b) => a.lengthKm - b.lengthKm).filter((t) => t.difficulty !== 'backpacking').slice(0, 3)
  const places = new Map(props.places.map((p) => [p.id, p] as const))

  return (
    <div className="space-y-7 p-5">
      <header>
        <h2 className="text-4xl leading-none">Find your next fall adventure</h2>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">Parks, trails, lakes and peak colour across Ontario, with fall colour across Canada.</p>
      </header>

      <section aria-label="Search" className="rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-2 shadow-md">
        <div className="p-1">
          <SearchBox parks={props.parks} trails={props.trails} places={props.places} onSelect={props.onSearchSelect} />
        </div>
        <div className="relative mt-1 flex gap-1 border-t border-[var(--line)] pt-1">
          <Field label="Where" value={PROVINCE_BY_CODE.get(province)!.name}>
            {(close) =>
              PROVINCES.map((p) => (
                <Option
                  key={p.code}
                  selected={p.code === province}
                  label={p.name}
                  hint={p.full ? 'Parks, trails, fishing and fall colour' : 'Fall colour regions and sightings'}
                  onClick={() => {
                    setProvince(p.code)
                    if (!p.full && WHAT.find((w) => w.id === what)?.ontarioOnly) setWhat('colours')
                    close()
                  }}
                />
              ))
            }
          </Field>
          <span className="my-2 w-px bg-[var(--line)]" />
          <Field label="Looking for" value={whatItem.label}>
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
        {what === 'colours' && (
          <div className="relative flex border-t border-[var(--line)] pt-1">
            <Field
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
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-maple px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 active:scale-[0.99]"
        >
          <Search className="size-5" />
          {what === 'everything' ? `Explore ${PROVINCE_BY_CODE.get(province)!.name}` : `Show ${whatItem.label.toLowerCase()}`}
        </button>
      </section>

      {peaking.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg">Peaking now in Ontario</h3>
            <button onClick={() => props.onNavigate('/colours')} className="text-sm font-medium text-maple hover:underline">
              All reports
            </button>
          </div>
          <ul className={LIST}>
            {peaking.map((p) => (
              <li key={p.id}>
                <button onClick={() => props.onSelectPark(p)} className={ROW}>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)]">
                    <span className="size-3.5 rounded-full" style={{ background: STAGES[p.stage].color }} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{parkTitle(p)}</span>
                    <span className="text-xs text-[var(--ink-soft)]">
                      {p.colourChange ?? 0}% colour · {p.dominantColour}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-medium" style={{ color: STAGES[p.stage].color }}>
                    {STAGES[p.stage].label}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-[var(--ink-soft)]" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {popular.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg">Short fall hikes</h3>
            <button onClick={() => props.onNavigate('/trails')} className="text-sm font-medium text-maple hover:underline">
              All trails
            </button>
          </div>
          <ul className={LIST}>
            {popular.map((t) => (
              <li key={t.id}>
                <TrailCard trail={t} places={places} onClick={() => props.onSelectTrail(t)} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-wrap gap-1.5" aria-label="Browse">
        {(['waterfall', 'viewpoint', 'lake'] as const).map((k) => (
          <button
            key={k}
            onClick={() => props.onNavigate(`/trails?show=${k}`)}
            className="flex items-center gap-1.5 rounded-full border border-[var(--line)] py-1 pr-3 pl-1 text-sm transition-colors hover:bg-[var(--surface-2)]"
          >
            <span className="flex size-6 items-center justify-center rounded-full text-white" style={{ background: PLACE_KINDS[k].color }}>
              <PlaceIcon kind={k} className="size-3.5" />
            </span>
            {PLACE_KINDS[k].plural}
          </button>
        ))}
      </section>
    </div>
  )
}
