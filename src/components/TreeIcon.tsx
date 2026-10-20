import type { TreeIconId } from '../data/treeIcons'
import { LEAF_COLORS, LEAF_MARKS, type Paint } from '../lib/leafShapes'

// Two-color tree icons (shapes, fall colors and stem settings in src/lib/leafShapes.ts): the leaf
// in its tree's fall color, the stem and veins in ink. Ink comes from --leaf-ink so it adapts to
// light and dark backgrounds. `tone="mono"` draws everything in currentColor instead.
// Preview them all in dev at /?icons.

export function TreeIcon({
  id,
  className = 'size-4',
  title,
  tone = 'color',
}: {
  id: TreeIconId
  className?: string
  title?: string
  tone?: 'color' | 'mono'
}) {
  const { leaf, accent = leaf } = LEAF_COLORS[id]
  const paint = (p?: Paint) =>
    !p ? 'none' : tone === 'mono' ? 'currentColor' : p === 'leaf' ? leaf : p === 'accent' ? accent : p === 'ink' ? 'var(--leaf-ink)' : p

  return (
    <svg viewBox="0 0 100 100" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      {LEAF_MARKS[id].map((m, i) => (
        <path
          key={i}
          d={m.d}
          fill={paint(m.fill)}
          stroke={m.stroke && paint(m.stroke)}
          strokeWidth={m.width}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}
