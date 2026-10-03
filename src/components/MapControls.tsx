import { useState } from 'react'
import { Check } from 'relume-icons'
import { LIGHT_PRESETS, localDate, type LightSetting } from '../lib/mapStyle'
import { TreeIcon } from './TreeIcon'
import { STAGES, type Stage } from '../lib/stage'
import { treeOptions } from '../lib/treeOptions'
import type { MapLayers } from './FoliageMap'

const LAYER_LABELS: [keyof MapLayers, string, string][] = [
  ['reports', 'Official park reports', 'Ontario Parks, updated daily'],
  ['hexes', 'Color sightings', 'iNaturalist, grouped by area'],
  ['sightings', 'Individual sightings', 'Shown when you zoom in'],
  ['trails', 'Parks Canada trails', 'Shown when you zoom in'],
  ['fishing', 'Fishing access', 'Boat launches, shore access and docks · zoom in'],
  ['satellite', 'Satellite view', 'NASA VIIRS true color'],
  ['terrain3d', '3D terrain', 'Tilts the map to show hills and valleys'],
]

/** Map layers, satellite date and light: the Layers tab of the map's Filters menu. */
export function LayerOptions({
  layers,
  onChange,
  satelliteDate,
  onSatelliteDate,
  light,
  onLight,
}: {
  layers: MapLayers
  onChange: (l: MapLayers) => void
  satelliteDate: string
  onSatelliteDate: (d: string) => void
  light: LightSetting
  onLight: (l: LightSetting) => void
}) {
  const [today] = useState(() => localDate())
  return (
    <div className="px-1">
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
      <div className="mt-3 border-t border-[var(--line)] px-1 pt-3">
        <div className="mb-1.5 text-xs font-semibold">Light</div>
        <div role="radiogroup" aria-label="Map light" className="flex gap-1 rounded-full bg-[var(--surface-2)] p-1 text-xs">
          {(['auto', ...LIGHT_PRESETS] as LightSetting[]).map((l) => (
            <button
              key={l}
              role="radio"
              aria-checked={light === l}
              onClick={() => onLight(l)}
              className={`flex-1 rounded-full py-1 capitalize transition ${
                light === l ? 'bg-[var(--surface)] font-medium shadow-sm' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 border-t border-[var(--line)] px-1 pt-3">
        <Legend />
      </div>
    </div>
  )
}

const LEGEND_STAGES: Stage[] = ['green', 'patchy', 'near', 'peak', 'past']

export function Legend() {
  return (
    <div className="text-xs">
      <div className="mb-1.5 font-semibold">Color stage</div>
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

export type { TreeFilterValue } from '../lib/treeOptions'
import type { TreeFilterValue } from '../lib/treeOptions'

/** Which trees' sightings show on the map: one choice, with live sighting counts. */
export function TreeOptions({
  counts,
  value,
  onChange,
}: {
  counts: Map<string, number>
  value: TreeFilterValue
  onChange: (v: TreeFilterValue) => void
}) {
  return (
    <ul role="radiogroup" aria-label="Trees on the map">
      {!counts.size && <li className="px-2 py-2 text-xs text-[var(--ink-soft)]">Loading sightings…</li>}
      {treeOptions(counts).map((o) => {
        const on = value === o.id
        return (
          <li key={o.id}>
            <button
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                on ? 'bg-maple/10 font-medium' : 'hover:bg-[var(--surface-2)]'
              }`}
            >
              <span className="flex size-[22px] items-center justify-center">
                {o.icon ? (
                  <TreeIcon id={o.icon} className="size-[22px]" />
                ) : (
                  <TreeIcon id="maples" tone="mono" className="size-[18px] text-[var(--ink-soft)]" />
                )}
              </span>
              <span className="min-w-0 flex-1">{o.label}</span>
              {o.n != null && <span className="text-xs tabular-nums text-[var(--ink-soft)]">{o.n}</span>}
              <span className="flex size-4 items-center justify-center">{on && <Check className="size-4 text-maple" />}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
