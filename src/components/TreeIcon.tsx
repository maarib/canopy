import type { TreeIconId } from '../data/treeIcons'
import { LEAF_COLORS, LEAF_SHAPES } from '../lib/leafShapes'

// Two-color tree icons (shapes and fall colors in src/lib/leafShapes.ts): the leaf in its
// tree's fall color, the stem and veins in ink. Ink comes from --leaf-ink so it adapts to
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
  const shape = LEAF_SHAPES[id]
  const mono = tone === 'mono'
  const leaf = mono ? 'currentColor' : LEAF_COLORS[id].leaf
  const accent = mono ? 'currentColor' : (LEAF_COLORS[id].accent ?? leaf)
  const ink = mono ? 'currentColor' : 'var(--leaf-ink)'
  const fillFor = (t?: 'leaf' | 'accent' | 'ink') => (t === 'accent' ? accent : t === 'ink' ? ink : leaf)

  return (
    <svg viewBox="0 0 100 100" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      {shape.blades.map((b, i) => (
        <path key={i} d={b.d} fill={fillFor(b.tone)} />
      ))}
      {shape.needles && (
        <g fill="none" stroke={leaf} strokeLinecap="round">
          {shape.needles.map((n, i) => (
            <path key={i} d={n.d} strokeWidth={n.width} />
          ))}
        </g>
      )}
      <g fill="none" stroke={ink} strokeLinecap="round" strokeLinejoin="round">
        {shape.ink.map((s, i) => (
          <path key={i} d={s.d} strokeWidth={s.width} />
        ))}
      </g>
    </svg>
  )
}
