import { useId } from 'react'
import type { TreeIconId } from '../data/treeIcons'
import { LEAF_SHAPES, STROKE_ONLY } from '../lib/leafShapes'

// Organic leaf icons, one per tree group (shapes in src/lib/leafShapes.ts).
// "solid" reads best at 16–24px (chips, pins, lists); "veined" cuts the veins out and
// suits 32px and up (headers, empty states). Single colour via currentColor.
// Preview them all in dev at /?icons.

export function TreeIcon({
  id,
  className = 'size-4',
  title,
  variant = 'solid',
}: {
  id: TreeIconId
  className?: string
  title?: string
  variant?: 'solid' | 'veined'
}) {
  const maskId = useId()
  const shape = LEAF_SHAPES[id]
  const strokeOnly = STROKE_ONLY.has(id)
  const cutVeins = variant === 'veined' && !strokeOnly && shape.veins.length > 0

  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {cutVeins && (
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
          <rect width="100" height="100" fill="white" />
          <g stroke="black" fill="none" strokeLinecap="round">
            {shape.veins.map((v, i) => (
              <path key={i} d={v.d} strokeWidth={v.width} />
            ))}
          </g>
        </mask>
      )}
      <path d={shape.fill} mask={cutVeins ? `url(#${maskId})` : undefined} />
      {shape.stem && <path d={shape.stem.d} fill="none" stroke="currentColor" strokeWidth={shape.stem.width} strokeLinecap="round" />}
      {strokeOnly && (
        <g fill="none" stroke="currentColor" strokeLinecap="round">
          {shape.veins.map((v, i) => (
            <path key={i} d={v.d} strokeWidth={v.width} />
          ))}
        </g>
      )}
    </svg>
  )
}
