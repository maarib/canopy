import { useState } from 'react'
import { Layers } from 'relume-icons'
import { TREE_GROUPS } from '../data/treeGroups'
import { localDate } from '../lib/mapStyle'
import { STAGES, type Stage } from '../lib/stage'
import type { MapLayers } from './FoliageMap'

const LAYER_LABELS: [keyof MapLayers, string, string][] = [
  ['reports', 'Official park reports', 'Ontario Parks, updated daily'],
  ['hexes', 'Colour sightings', 'iNaturalist, grouped by area'],
  ['sightings', 'Individual sightings', 'Visible when zoomed in'],
  ['trails', 'Parks Canada trails', 'Visible when zoomed in'],
  ['satellite', 'Satellite view', 'NASA VIIRS true colour'],
  ['terrain3d', '3D terrain', 'Tilt the map to see hills'],
]

export function LayerControl({
  layers,
  onChange,
  satelliteDate,
  onSatelliteDate,
}: {
  layers: MapLayers
  onChange: (l: MapLayers) => void
  satelliteDate: string
  onSatelliteDate: (d: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [today] = useState(() => localDate())

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium shadow-md"
      >
        <Layers className="size-4" />
        Layers
      </button>
      {open && (
        <div className="absolute top-full left-0 z-10 mt-2 w-72 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-xl">
          <ul className="space-y-1">
            {LAYER_LABELS.map(([key, label, hint]) => (
              <li key={key}>
                <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-1.5 py-1 hover:bg-[var(--surface-2)]">
                  <input
                    type="checkbox"
                    checked={layers[key]}
                    onChange={(e) => onChange({ ...layers, [key]: e.target.checked })}
                    className="mt-1 accent-maple"
                  />
                  <span>
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="block text-xs text-[var(--ink-soft)]">{hint}</span>
                  </span>
                </label>
                {key === 'satellite' && layers.satellite && (
                  <input
                    type="date"
                    value={satelliteDate}
                    max={today}
                    onChange={(e) => e.target.value && onSatelliteDate(e.target.value)}
                    className="mt-1 ml-8 rounded-md border border-[var(--line)] bg-[var(--surface-2)] px-2 py-1 text-xs"
                    aria-label="Satellite image date"
                  />
                )}
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-[var(--line)] pt-3">
            <Legend />
          </div>
        </div>
      )}
    </div>
  )
}

const LEGEND_STAGES: Stage[] = ['green', 'patchy', 'near', 'peak', 'past']

export function Legend() {
  return (
    <div className="text-xs">
      <div className="mb-1.5 font-semibold">Colour stage</div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {LEGEND_STAGES.map((s) => (
          <span key={s} className="flex items-center gap-1">
            <span className="size-2.5 rounded-full" style={{ background: STAGES[s].color }} />
            {STAGES[s].label}
          </span>
        ))}
      </div>
      <div className="mt-2 mb-1 font-semibold">Sightings per area</div>
      <div className="flex items-center gap-2">
        <span>few</span>
        <span className="h-2 flex-1 rounded-full bg-gradient-to-r from-[#e3b53c] via-[#e8730c] to-[#c8102e]" />
        <span>many</span>
      </div>
    </div>
  )
}

export type TreeFilterValue = 'trees' | 'all' | string

export function TreeFilter({
  counts,
  value,
  onChange,
}: {
  counts: Map<string, number>
  value: TreeFilterValue
  onChange: (v: TreeFilterValue) => void
}) {
  if (!counts.size) return null
  // Real trees first by count; shrubs and vines go last.
  const groups = TREE_GROUPS.filter((g) => counts.get(g.id)).sort(
    (a, b) => Number(b.tree) - Number(a.tree) || counts.get(b.id)! - counts.get(a.id)!,
  )
  const chip = (active: boolean) =>
    `flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm shadow-md transition ${
      active
        ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
        : 'border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)]'
    }`
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Filter by tree">
      <button className={chip(value === 'trees')} aria-pressed={value === 'trees'} onClick={() => onChange('trees')}>
        All trees
      </button>
      {groups.map((g) => (
        <button
          key={g.id}
          className={chip(value === g.id)}
          aria-pressed={value === g.id}
          onClick={() => onChange(value === g.id ? 'trees' : g.id)}
        >
          <span className="size-2.5 rounded-full" style={{ background: g.colour }} />
          {g.label} <span className="opacity-60">{counts.get(g.id)}</span>
        </button>
      ))}
      <button className={chip(value === 'all')} aria-pressed={value === 'all'} onClick={() => onChange('all')}>
        All plants
      </button>
    </div>
  )
}
