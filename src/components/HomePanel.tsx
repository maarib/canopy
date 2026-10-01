import { useState } from 'react'
import type { Region } from '../data/regions'
import { parkTitle, type ParkReport } from '../lib/ontarioParks'
import { formatWindow, PHASE_STYLE, peakPhase, type PeakPhase } from '../lib/peak'
import { STAGE_ORDER, STAGES } from '../lib/stage'

type Tab = 'reports' | 'regions'
const PHASE_ORDER: PeakPhase[] = ['peak', 'approaching', 'early', 'past']

type Props = {
  regions: Region[]
  parks: ParkReport[] | undefined
  parksFetchedAt: string | undefined
  treeColourSightings: number | undefined
  onSelectRegion: (r: Region) => void
  onSelectPark: (p: ParkReport) => void
}

export function HomePanel(props: Props) {
  const [tab, setTab] = useState<Tab>('reports')

  return (
    <div className="p-5">
      <SightingsSummary treeColourSightings={props.treeColourSightings} parks={props.parks} />

      <div role="tablist" className="mb-2 flex gap-1 rounded-full bg-[var(--surface-2)] p-1 text-sm">
        {(
          [
            ['reports', 'Official reports'],
            ['regions', 'When to go'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex-1 rounded-full px-3 py-1.5 font-medium transition ${
              tab === id ? 'bg-[var(--surface)] shadow-sm' : 'text-[var(--ink-soft)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'reports' ? (
        <ParkList parks={props.parks} fetchedAt={props.parksFetchedAt} onSelect={props.onSelectPark} />
      ) : (
        <RegionList regions={props.regions} onSelect={props.onSelectRegion} />
      )}
    </div>
  )
}

function SightingsSummary({ treeColourSightings, parks }: Pick<Props, 'treeColourSightings' | 'parks'>) {
  const atPeak = parks?.filter((p) => p.main && p.stage === 'peak').length
  return (
    <div className="mb-4 grid grid-cols-2 gap-2">
      <Stat value={atPeak} label="Ontario parks at peak" dot={STAGES.peak.color} />
      <Stat value={treeColourSightings} label="trees seen turning, last 14 days" dot="#e8730c" />
    </div>
  )
}

function Stat({ value, label, dot }: { value: number | undefined; label: string; dot: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-2)] px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-xl font-bold tabular-nums">
        <span className="size-2 rounded-full" style={{ background: dot }} />
        {value === undefined ? '…' : value.toLocaleString('en-CA')}
      </div>
      <div className="text-xs text-[var(--ink-soft)]">{label}</div>
    </div>
  )
}

function ParkList({
  parks,
  fetchedAt,
  onSelect,
}: {
  parks: ParkReport[] | undefined
  fetchedAt: string | undefined
  onSelect: (p: ParkReport) => void
}) {
  if (!parks) return <p className="py-4 text-sm text-[var(--ink-soft)]">Loading reports…</p>
  const sorted = parks
    .filter((p) => p.main)
    .sort(
      (a, b) =>
        STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage) || (b.colourChange ?? 0) - (a.colourChange ?? 0),
    )
  return (
    <>
      <ul className="divide-y divide-[var(--line)]">
        {sorted.map((p) => {
          const stage = STAGES[p.stage]
          return (
            <li key={p.id}>
              <button onClick={() => onSelect(p)} className="flex w-full items-center gap-3 py-2.5 text-left hover:opacity-80">
                <span className="size-3 shrink-0 rounded-full" style={{ background: stage.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{parkTitle(p)}</span>
                  <span className="text-xs text-[var(--ink-soft)]">
                    {p.colourChange ?? 0}% colour · {p.leafFall ?? 0}% fallen · {p.dominantColour}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-medium" style={{ color: stage.color }}>
                  {stage.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-[11px] text-[var(--ink-soft)]">
        Source:{' '}
        <a href="https://www.ontarioparks.ca/fallcolour" target="_blank" rel="noreferrer" className="underline">
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
      <ul className="divide-y divide-[var(--line)]">
        {sorted.map((r) => {
          const phase = PHASE_STYLE[peakPhase(r)]
          return (
            <li key={r.id}>
              <button onClick={() => onSelect(r)} className="flex w-full items-center gap-3 py-2.5 text-left hover:opacity-80">
                <span className="size-3 shrink-0 rounded-full" style={{ background: phase.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{r.name}</span>
                  <span className="text-xs text-[var(--ink-soft)]">
                    {r.province} · peak {formatWindow(r)}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-medium" style={{ color: phase.color }}>
                  {phase.label}
                </span>
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
