import { useId, useMemo, useState } from 'react'
import type { Place, Trail } from '../lib/explore'
import { PLACE_KINDS } from '../lib/explore'
import { PlaceIcon } from './PlaceIcon'

const W = 360
const H = 150
const PAD = { top: 26, right: 10, bottom: 22, left: 34 }

/**
 * AllTrails-style elevation profile. Hover or drag along it to see the point on the map;
 * places along the trail sit on the line at their km.
 */
export function ElevationChart({
  trail,
  places,
  onHover,
}: {
  trail: Trail
  places: Map<string, Place>
  onHover: (point: [number, number] | null) => void
}) {
  const [active, setActive] = useState<number | null>(null)
  const gradId = useId()
  const p = trail.profile
  const maxKm = p[p.length - 1][0] || 1

  const { x, y, line, area, ticks, yTicks } = useMemo(() => {
    const ele = p.map((d) => d[1])
    const lo = Math.min(...ele)
    const hi = Math.max(...ele)
    const span = Math.max(30, hi - lo) // keep flat trails from looking dramatic
    const yLo = Math.floor((lo - span * 0.15) / 10) * 10
    const yHi = Math.ceil((lo + span * 1.15) / 10) * 10
    const x = (km: number) => PAD.left + (km / maxKm) * (W - PAD.left - PAD.right)
    const y = (m: number) => PAD.top + (1 - (m - yLo) / (yHi - yLo)) * (H - PAD.top - PAD.bottom)
    const line = p.map((d, i) => `${i ? 'L' : 'M'}${x(d[0]).toFixed(1)} ${y(d[1]).toFixed(1)}`).join('')
    const area = `${line}L${x(maxKm).toFixed(1)} ${H - PAD.bottom}L${PAD.left} ${H - PAD.bottom}Z`
    const step = maxKm > 40 ? 20 : maxKm > 15 ? 5 : maxKm > 6 ? 2 : maxKm > 2.5 ? 1 : 0.5
    const ticks = Array.from({ length: Math.floor(maxKm / step) + 1 }, (_, i) => +(i * step).toFixed(1))
    return { x, y, line, area, ticks, yTicks: [yLo, Math.round((yLo + yHi) / 2 / 10) * 10, yHi] }
  }, [p, maxKm])

  const eleAt = (km: number) => {
    const i = p.findIndex((d) => d[0] >= km)
    return i <= 0 ? p[0][1] : p[i][1]
  }

  function pick(clientX: number, rect: DOMRect) {
    const km = ((clientX - rect.left) / rect.width) * W
    const target = ((km - PAD.left) / (W - PAD.left - PAD.right)) * maxKm
    let best = 0
    for (let i = 1; i < p.length; i++) if (Math.abs(p[i][0] - target) < Math.abs(p[best][0] - target)) best = i
    setActive(best)
    onHover([p[best][2], p[best][3]])
  }
  const clear = () => {
    setActive(null)
    onHover(null)
  }

  const a = active !== null ? p[active] : null

  return (
    <figure className="select-none">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none overflow-visible"
        role="img"
        aria-label={`Elevation profile: ${trail.minEleM} to ${trail.maxEleM} metres over ${trail.lengthKm} kilometres, ${trail.gainM} metres of climbing.`}
        onPointerMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerDown={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerLeave={clear}
        onPointerUp={(e) => e.pointerType !== 'mouse' && clear()}
      >
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#e8730c" stopOpacity="0.45" />
            <stop offset="1" stopColor="#e8730c" stopOpacity="0.03" />
          </linearGradient>
        </defs>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeDasharray="2 3" />
            <text x={PAD.left - 5} y={y(t) + 3} textAnchor="end" fontSize="9" fill="var(--ink-soft)">
              {t}
            </text>
          </g>
        ))}
        {ticks.map((t) => (
          <text key={t} x={x(t)} y={H - 6} textAnchor="middle" fontSize="9" fill="var(--ink-soft)">
            {t} km
          </text>
        ))}
        <path d={area} fill={`url(#${gradId})`} />
        <path d={line} fill="none" stroke="#e8730c" strokeWidth="2" strokeLinejoin="round" />

        {trail.along.map((entry) => {
          const place = places.get(entry.poi)
          if (!place) return null
          const cx = x(Math.min(entry.km, maxKm))
          const cy = y(eleAt(entry.km))
          return (
            <g key={entry.poi} style={{ color: PLACE_KINDS[place.kind].color }}>
              <line x1={cx} x2={cx} y1={cy} y2={PAD.top - 12} stroke="currentColor" strokeOpacity="0.4" strokeDasharray="1.5 2" />
              <circle cx={cx} cy={PAD.top - 12} r="8" fill="var(--surface)" stroke="currentColor" strokeWidth="1.2" />
              <svg x={cx - 5.5} y={PAD.top - 17.5} width="11" height="11" viewBox="0 0 24 24">
                <PlaceIcon kind={place.kind} className="" />
              </svg>
            </g>
          )
        })}

        {a && (
          <g pointerEvents="none">
            <line x1={x(a[0])} x2={x(a[0])} y1={PAD.top - 2} y2={H - PAD.bottom} stroke="var(--ink)" strokeOpacity="0.5" />
            <circle cx={x(a[0])} cy={y(a[1])} r="4.5" fill="#e8730c" stroke="#fff" strokeWidth="2" />
          </g>
        )}
      </svg>
      <figcaption className="mt-1 flex justify-between text-xs text-[var(--ink-soft)]" aria-live="polite">
        {a ? (
          <span className="font-medium text-[var(--ink)]">
            km {a[0].toFixed(1)} · {a[1]} m
          </span>
        ) : (
          <span>Drag along the chart to follow the trail on the map</span>
        )}
        <span>
          {trail.minEleM}–{trail.maxEleM} m
        </span>
      </figcaption>
    </figure>
  )
}
