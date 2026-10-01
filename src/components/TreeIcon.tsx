import type { ReactNode } from 'react'
import type { TreeIconId } from '../data/treeIcons'

// Minimal tree icons, one per tree group in src/data/treeGroups.ts.
// 24×24, single colour (currentColor), drawn to sit alongside Relume icons.
// Preview them all in dev at /?icons.

/** A thin slit from (x1,y1) to (x2,y2), used with even-odd fill to cut veins out of a leaf. */
function slit(x1: number, y1: number, x2: number, y2: number, w = 0.8): string {
  const len = Math.hypot(x2 - x1, y2 - y1)
  const px = (-(y2 - y1) / len) * (w / 2)
  const py = ((x2 - x1) / len) * (w / 2)
  const f = (n: number) => n.toFixed(2)
  return `M${f(x1 + px)} ${f(y1 + py)}L${f(x2 + px)} ${f(y2 + py)}L${f(x2 - px)} ${f(y2 - py)}L${f(x1 - px)} ${f(y1 - py)}Z`
}

/**
 * Leaf outline from tip (top) to base: half-width follows sin(π·t^k), so k > 1 widens
 * toward the base and k < 1 toward the tip. Odd samples pulled in to make teeth.
 */
function leaf({ top = 3, bottom = 17.6, width = 5.4, k = 1, teeth = 0 }) {
  const n = teeth ? teeth * 2 : 24
  const pts: [number, number][] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    let hw = width * Math.sin(Math.PI * Math.pow(t, k))
    if (teeth && i % 2 === 1) hw *= 0.84
    pts.push([hw, top + t * (bottom - top)])
  }
  const right = pts.map(([x, y]) => `${(12 + x).toFixed(2)} ${y.toFixed(2)}`)
  const left = [...pts].reverse().map(([x, y]) => `${(12 - x).toFixed(2)} ${y.toFixed(2)}`)
  return `M${right.join('L')}L${left.join('L')}Z`
}

const stem = <rect x="11.3" y="17" width="1.4" height="4.5" rx="0.7" />
const midrib = (top: number, bottom: number) => slit(12, top, 12, bottom)

const ICONS: Record<TreeIconId, ReactNode> = {
  maples: (
    <path
      d="M12 2l1.2 2.7 1.6-.6-.9 4.3 2.9-3 .7 1.5 3.3-.7-1.2 3.4 1.3.7-3.9 3.3.6 1.7-3.9-.6v6.9h-1.4V15.7l-3.9.6.6-1.7-3.9-3.3 1.3-.7-1.2-3.4 3.3.7.7-1.5 2.9 3-.9-4.3 1.6.6z"
      stroke="currentColor"
      strokeWidth="0.6"
      strokeLinejoin="round"
    />
  ),
  oaks: (
    <>
      <ellipse cx="12" cy="10.4" rx="2.4" ry="7" />
      <circle cx="12" cy="4" r="2.1" />
      {[
        [8.5, 6.6, -30],
        [8.1, 10.6, -12],
        [9.1, 14.4, 10],
      ].map(([x, y, r]) => (
        <g key={y}>
          <ellipse cx={x} cy={y} rx="2.6" ry="1.75" transform={`rotate(${r} ${x} ${y})`} />
          <ellipse cx={24 - x} cy={y} rx="2.6" ry="1.75" transform={`rotate(${-r} ${24 - x} ${y})`} />
        </g>
      ))}
      {stem}
    </>
  ),
  birches: (
    <>
      <path fillRule="evenodd" d={`${leaf({ top: 2.6, bottom: 17.4, width: 4.6, k: 1.45, teeth: 9 })}${midrib(6.5, 16)}`} />
      {stem}
    </>
  ),
  aspens: (
    <>
      <path fillRule="evenodd" d={`${leaf({ top: 3.6, bottom: 17.2, width: 6.6, k: 1.25 })}${midrib(7.2, 15.6)}`} />
      <rect x="11.4" y="16.6" width="1.2" height="4.9" rx="0.6" />
    </>
  ),
  beeches: (
    <>
      <path
        fillRule="evenodd"
        d={`${leaf({ top: 2.4, bottom: 17.8, width: 3.9, k: 1 })}${midrib(5.5, 16.4)}${slit(12.9, 9.4, 14.6, 7.9)}${slit(11.1, 9.4, 9.4, 7.9)}${slit(12.9, 12.9, 14.9, 11.3)}${slit(11.1, 12.9, 9.1, 11.3)}`}
      />
      {stem}
    </>
  ),
  elms: (
    <>
      <path
        fillRule="evenodd"
        d={`M12 2.8C14.6 5.2 20.4 8.6 19.4 13.6 18.6 17.6 14 18.2 12 15.2 10 18.2 5.4 17.6 4.6 13.6 3.6 8.6 9.4 5.2 12 2.8Z${midrib(6.4, 13.6)}`}
      />
      <rect x="11.3" y="14.5" width="1.4" height="7" rx="0.7" />
    </>
  ),
  larches: (
    <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none">
      {[-62, -41, -20, 0, 20, 41, 62].map((deg) => {
        const r = (deg * Math.PI) / 180
        const len = deg === 0 ? 10 : 8.6
        return <line key={deg} x1="12" y1="14.5" x2={12 + Math.sin(r) * len} y2={14.5 - Math.cos(r) * len} />
      })}
      <line x1="12" y1="14.5" x2="12" y2="21.5" strokeWidth="1.6" />
      <circle cx="12" cy="14.8" r="1.4" fill="currentColor" stroke="none" />
    </g>
  ),
  ashes: (
    <>
      <rect x="11.35" y="5" width="1.3" height="16.5" rx="0.65" />
      <ellipse cx="12" cy="4.6" rx="1.7" ry="2.7" />
      {[8.4, 12.8].map((y) => (
        <g key={y}>
          <ellipse cx="8.6" cy={y} rx="1.5" ry="2.8" transform={`rotate(-58 8.6 ${y})`} />
          <ellipse cx="15.4" cy={y} rx="1.5" ry="2.8" transform={`rotate(58 15.4 ${y})`} />
        </g>
      ))}
    </>
  ),
  hickories: (
    <>
      {/* Hickory nut: plump nut with a pointed tip and a centre seam. */}
      <path
        fillRule="evenodd"
        d={`M12 3.4C16.4 7 18.8 9.8 18.8 13.6 18.8 17.6 15.8 20.6 12 20.6S5.2 17.6 5.2 13.6C5.2 9.8 7.6 7 12 3.4Z${slit(12, 8.2, 12, 18.6, 0.9)}`}
      />
    </>
  ),
  cherries: (
    <>
      <path d="M8.4 13.4Q9.2 7.6 13.3 3.8M15.7 14.2Q15.2 8.4 13.3 3.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <circle cx="8.2" cy="16.4" r="3.4" />
      <circle cx="15.9" cy="17.2" r="3.4" />
      <ellipse cx="16.6" cy="4.4" rx="3" ry="1.4" transform="rotate(-22 16.6 4.4)" />
    </>
  ),
  alders: (
    <>
      {/* Alder cone: overlapping scales as chevrons. */}
      <path
        fillRule="evenodd"
        d={`M8 13.6A4 6 0 1 1 16 13.6 4 6 0 1 1 8 13.6Z${[10.4, 13.4, 16.4]
          .map((y) => `${slit(9.2, y - 1, 12, y + 0.6, 0.75)}${slit(14.8, y - 1, 12.4, y + 0.4, 0.75)}`)
          .join('')}`}
      />
      <rect x="11.3" y="2.6" width="1.4" height="5.4" rx="0.7" />
    </>
  ),
  'other-trees': (
    <>
      <path d="M12 15.2 4.2 8.4C6 4.7 9 3.7 11.2 5.1L12 7.4 12.8 5.1C15 3.7 18 4.7 19.8 8.4Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
      <rect x="11.3" y="14" width="1.4" height="7.5" rx="0.7" />
    </>
  ),
  shrubs: (
    <>
      {/* Bush: three rounded clumps on a short trunk. */}
      <circle cx="7.2" cy="12.6" r="3.8" />
      <circle cx="16.8" cy="12.6" r="3.8" />
      <circle cx="12" cy="9.4" r="4.6" />
      <rect x="3.4" y="12.4" width="17.2" height="4.8" rx="2.4" />
      <rect x="11.3" y="16" width="1.4" height="5.5" rx="0.7" />
    </>
  ),
}

export function TreeIcon({ id, className = 'size-4', title }: { id: TreeIconId; className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {ICONS[id]}
    </svg>
  )
}
