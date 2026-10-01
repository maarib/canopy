import type { Region } from '../data/regions'
import { formatWindow, PHASE_STYLE, peakPhase, type PeakPhase } from '../lib/peak'

const ORDER: PeakPhase[] = ['peak', 'approaching', 'early', 'past']

export function RegionList({
  regions,
  sightings,
  onSelect,
}: {
  regions: Region[]
  sightings: number | undefined
  onSelect: (r: Region) => void
}) {
  const sorted = [...regions].sort((a, b) => ORDER.indexOf(peakPhase(a)) - ORDER.indexOf(peakPhase(b)))
  return (
    <div className="p-5">
      <p className="mb-4 text-sm text-[var(--ink-soft)]">
        {sightings === undefined ? 'Loading live sightings…' : `${sightings.toLocaleString('en-CA')} coloured-leaf sightings across Canada in the last two weeks`}
        <span className="ml-1.5 inline-block size-2 rounded-full bg-pumpkin align-middle" />
      </p>
      <ul className="divide-y divide-[var(--line)]">
        {sorted.map((r) => {
          const phase = PHASE_STYLE[peakPhase(r)]
          return (
            <li key={r.id}>
              <button onClick={() => onSelect(r)} className="flex w-full items-center gap-3 py-3 text-left hover:opacity-80">
                <span className="size-3 shrink-0 rounded-full" style={{ background: phase.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{r.name}</span>
                  <span className="text-xs text-[var(--ink-soft)]">
                    {r.province} · peak {formatWindow(r)}
                  </span>
                </span>
                <span className="text-xs font-medium" style={{ color: phase.color }}>
                  {phase.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
