import { useState } from 'react'
import { ChevronRight } from 'relume-icons'
import { signatureTree, type Region } from '../data/regions'
import { TreeIcon } from './TreeIcon'
import { parkTitle, type ParkReport } from '../lib/ontarioParks'
import { formatWindow, PHASE_STYLE, peakPhase, type PeakPhase } from '../lib/peak'
import { STAGE_ORDER, STAGES } from '../lib/stage'
import { ROW } from '../lib/styles'
import { Badge, Segmented, Skeleton } from './ui'
import { TreePicker } from './TreePicker'
import type { TreeFilterValue } from './MapControls'

type Tab = 'reports' | 'regions'
const PHASE_ORDER: PeakPhase[] = ['peak', 'approaching', 'early', 'past']

type Props = {
  regions: Region[]
  parks: ParkReport[] | undefined
  /** Parks after the activity filter (the summary above always counts every park). */
  listParks: ParkReport[] | undefined
  activityFilter?: { labels: string[]; onClear: () => void }
  parksFetchedAt: string | undefined
  treeColorSightings: number | undefined
  onSelectRegion: (r: Region) => void
  onSelectPark: (p: ParkReport) => void
  /** Which trees' sightings the map shows; a dropdown rather than every tree at once. */
  tree: TreeFilterValue
  treeCounts: Map<string, number>
  onTree: (v: TreeFilterValue) => void
}

/** Foliage: official fall color reports, when each region peaks, and which trees are showing. */
export function FoliagePanel(props: Props) {
  const [tab, setTab] = useState<Tab>('reports')

  return (
    <div className="p-5">
      <header className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-3xl leading-tight">Foliage</h2>
          <p className="text-sm text-[var(--ink-soft)]">Fall color reports, peak timing and live tree sightings</p>
        </div>
        <TreePicker value={props.tree} counts={props.treeCounts} onChange={props.onTree} />
      </header>
      <SightingsSummary treeColorSightings={props.treeColorSightings} parks={props.parks} />

      <Segmented
        className="mb-2"
        value={tab}
        onChange={setTab}
        options={[
          { id: 'reports', label: 'Park reports' },
          { id: 'regions', label: 'When to go' },
        ]}
      />

      <div key={tab} className="animate-fade-in">
      {tab === 'reports' ? (
        <>
          {props.activityFilter && (
            <div className="mb-2 flex items-center gap-2 rounded-xl bg-[var(--surface-2)] px-3 py-2 text-sm">
              <span className="min-w-0 flex-1">
                Parks with <strong className="font-semibold">{props.activityFilter.labels.join(', ')}</strong>
              </span>
              <button
                onClick={props.activityFilter.onClear}
                className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-brand transition-colors hover:bg-brand/10"
              >
                Clear
              </button>
            </div>
          )}
          <ParkList parks={props.listParks} fetchedAt={props.parksFetchedAt} onSelect={props.onSelectPark} filtered={!!props.activityFilter} />
        </>
      ) : (
        <RegionList regions={props.regions} onSelect={props.onSelectRegion} />
      )}
      </div>
    </div>
  )
}

function SightingsSummary({ treeColorSightings, parks }: Pick<Props, 'treeColorSightings' | 'parks'>) {
  const atPeak = parks?.filter((p) => p.main && p.stage === 'peak').length
  return (
    <div className="mb-4 grid grid-cols-2 gap-2">
      <Stat value={atPeak} label="Ontario parks at peak" dot={STAGES.peak.color} />
      <Stat value={treeColorSightings} label="trees seen turning in the last 14 days" dot="#e8730c" />
    </div>
  )
}

function Stat({ value, label, dot }: { value: number | undefined; label: string; dot: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-2)] px-3 py-2.5">
      <div className="flex items-center gap-1.5 font-display text-3xl leading-none">
        <span className="size-2 rounded-full" style={{ background: dot }} />
        {value === undefined ? <Skeleton className="h-7 w-12" /> : value.toLocaleString('en-CA')}
      </div>
      <div className="text-xs text-[var(--ink-soft)]">{label}</div>
    </div>
  )
}

export function ParkList({
  parks,
  fetchedAt,
  onSelect,
  filtered,
}: {
  parks: ParkReport[] | undefined
  fetchedAt: string | undefined
  onSelect: (p: ParkReport) => void
  filtered: boolean
}) {
  if (!parks)
    return (
      <ul className="space-y-3 py-2" role="status" aria-label="Loading reports">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="flex items-center gap-3">
            <Skeleton className="size-3 rounded-full" />
            <span className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </span>
          </li>
        ))}
      </ul>
    )
  const sorted = parks
    .filter((p) => p.main)
    .sort(
      (a, b) =>
        STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage) || (b.colorChange ?? 0) - (a.colorChange ?? 0),
    )
  return (
    <>
      {filtered && !sorted.length && (
        <p className="py-6 text-center text-sm text-[var(--ink-soft)]">No reporting park offers all of these. Try removing one.</p>
      )}
      <ul className="stagger divide-y divide-[var(--line)]">
        {sorted.map((p) => {
          const stage = STAGES[p.stage]
          return (
            <li key={p.id}>
              <button onClick={() => onSelect(p)} className={ROW}>
                <span className="size-3 shrink-0 rounded-full" style={{ background: stage.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{parkTitle(p)}</span>
                  <span className="text-xs text-[var(--ink-soft)]">
                    {p.colorChange ?? 0}% color · {p.leafFall ?? 0}% fallen · {p.dominantColor}
                  </span>
                </span>
                <Badge size="sm" color={stage.color}>{stage.label}</Badge>
                <ChevronRight className="size-4 shrink-0 text-[var(--ink-soft)]" />
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-[11px] text-[var(--ink-soft)]">
        Source:{' '}
        <a href="https://www.ontarioparks.ca/fallcolour" target="_blank" rel="noreferrer" className="underline decoration-[var(--line)] underline-offset-2 transition-colors hover:text-[var(--ink)] hover:decoration-current">
          Ontario Parks Fall Colour Report
        </a>
        {fetchedAt && ` · updated ${new Date(fetchedAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}`}. Other
        provinces coming soon.
      </p>
    </>
  )
}

function RegionList({ regions, onSelect }: { regions: Region[]; onSelect: (r: Region) => void }) {
  const sorted = [...regions].sort((a, b) => PHASE_ORDER.indexOf(peakPhase(a)) - PHASE_ORDER.indexOf(peakPhase(b)))
  return (
    <>
      <ul className="stagger divide-y divide-[var(--line)]">
        {sorted.map((r) => {
          const phase = PHASE_STYLE[peakPhase(r)]
          return (
            <li key={r.id}>
              <button onClick={() => onSelect(r)} className={ROW}>
                <TreeIcon id={signatureTree(r)} className="size-6 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{r.name}</span>
                  <span className="text-xs text-[var(--ink-soft)]">
                    {r.province} · peak {formatWindow(r)}
                  </span>
                </span>
                <Badge size="sm" color={phase.color}>{phase.label}</Badge>
                <ChevronRight className="size-4 shrink-0 text-[var(--ink-soft)]" />
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-[11px] text-[var(--ink-soft)]">
        Typical peak windows are approximate, based on past seasons.
      </p>
    </>
  )
}
