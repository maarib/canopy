import { useState } from 'react'
import { Check } from 'relume-icons'
import { LIGHT_PRESETS, localDate, MAP_STYLES, type LightSetting, type MapStyle, type MapStyleId } from '../lib/mapStyle'
import { TreeIcon } from './TreeIcon'
import { Segmented } from './ui'
import { STAGES, type Stage } from '../lib/stage'
import { treeOptions } from '../lib/treeOptions'
import type { MapLayers } from './FoliageMap'

const LAYER_LABELS: [keyof MapLayers, string, string][] = [
  ['reports', 'Official park reports', 'Ontario Parks, updated daily'],
  ['hexes', 'Color sightings', 'iNaturalist, grouped by area'],
  ['sightings', 'Individual sightings', 'Shown when you zoom in'],
  ['trails', 'Parks Canada trails', 'Shown when you zoom in'],
  ['fishing', 'Fishing access', 'Boat launches, shore access and docks · zoom in'],
  ['satellite', 'Daily satellite image', 'NASA VIIRS true color, by date'],
  ['terrain3d', '3D terrain', 'Tilts the map to show hills and valleys'],
]

/** Map style, light and layers: the map's Layers menu. */
export function LayerOptions({
  layers,
  onChange,
  satelliteDate,
  onSatelliteDate,
  light,
  onLight,
  mapStyle,
  onMapStyle,
}: {
  layers: MapLayers
  onChange: (l: MapLayers) => void
  satelliteDate: string
  onSatelliteDate: (d: string) => void
  light: LightSetting
  onLight: (l: LightSetting) => void
  mapStyle: MapStyleId
  onMapStyle: (s: MapStyleId) => void
}) {
  const [today] = useState(() => localDate())
  return (
    <div className="px-1">
      <div className="mb-3 border-b border-[var(--line)] px-1 pb-3">
        <div className="mb-1.5 text-xs font-semibold">Map style</div>
        <div role="radiogroup" aria-label="Map style" className="grid grid-cols-4 gap-2">
          {MAP_STYLES.map((s) => (
            <button
              key={s.id}
              role="radio"
              aria-checked={s.id === mapStyle}
              onClick={() => onMapStyle(s.id)}
              className="group flex flex-col items-center gap-1 text-[11px] leading-tight transition-transform active:scale-[0.97]"
            >
              <StylePreview style={s} selected={s.id === mapStyle} />
              <span className={s.id === mapStyle ? 'font-semibold' : 'text-[var(--ink-soft)] group-hover:text-[var(--ink)]'}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="mb-3 border-b border-[var(--line)] px-1 pb-3">
        <div className="mb-1.5 text-xs font-semibold">Light</div>
        <Segmented
          role="radiogroup"
          label="Map light"
          size="xs"
          value={light}
          onChange={onLight}
          options={(['auto', ...LIGHT_PRESETS] as LightSetting[]).map((l) => ({ id: l, label: <span className="capitalize">{l}</span> }))}
        />
      </div>
      <ul className="space-y-1">
        {LAYER_LABELS.map(([key, label, hint]) => (
          <li key={key}>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-1.5 py-1 hover:bg-[var(--surface-2)]">
              <input
                type="checkbox"
                checked={layers[key]}
                onChange={(e) => onChange({ ...layers, [key]: e.target.checked })}
                className="mt-1 accent-brand"
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
    </div>
  )
}

/** A tiny map in the look's colors: land, a park, a lake and a road. */
function StylePreview({ style, selected }: { style: MapStyle; selected: boolean }) {
  const [land, green, water, road] = style.swatch
  return (
    <span
      className={`block aspect-square w-full overflow-hidden rounded-xl border-2 transition-colors ${
        selected ? 'border-[var(--ink)]' : 'border-[var(--line)] group-hover:border-[var(--ink-soft)]'
      }`}
    >
      <svg viewBox="0 0 48 48" className="size-full" aria-hidden>
        <rect width="48" height="48" fill={land} />
        <path d="M-2 30 C8 24 14 34 24 30 S40 18 50 24 V50 H-2Z" fill={green} />
        <path d="M30 -2 C26 8 36 12 33 20 S40 30 50 28 V-2Z" fill={water} />
        <path d="M-2 14 C12 18 20 10 28 22 S36 40 30 50" fill="none" stroke={road} strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  )
}

const LEGEND_STAGES: Stage[] = ['green', 'patchy', 'near', 'peak', 'past']

/** What the map's colors mean: opened by the info button beside Layers. */
export function Legend() {
  return (
    <div className="px-2 text-xs">
      <div className="mb-1.5 font-semibold">Color stage</div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {LEGEND_STAGES.map((s) => (
          <span key={s} className="flex items-center gap-1">
            <span className="size-2.5 rounded-full" style={{ background: STAGES[s].color }} />
            {STAGES[s].label}
          </span>
        ))}
      </div>
      <p className="mt-1.5 leading-snug text-[var(--ink-soft)]">
        The color outlook (the Outlook button on the map) is solid within 60 km of an Ontario Parks report and lighter where it is an estimate from farther reports or the
        usual timing for that latitude.
      </p>
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
                on ? 'bg-brand/10 font-medium' : 'hover:bg-[var(--surface-2)]'
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
              <span className="flex size-4 items-center justify-center">{on && <Check className="size-4 text-brand" />}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
