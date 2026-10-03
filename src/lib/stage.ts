// Fall color stages, shared by official reports and the legend.

export type Stage = 'green' | 'patchy' | 'near' | 'peak' | 'past' | 'bare'

export const STAGES: Record<Stage, { label: string; color: string }> = {
  green: { label: 'Mostly green', color: '#4f7a4a' },
  patchy: { label: 'Patchy', color: '#d4b13a' },
  near: { label: 'Near peak', color: '#e8730c' },
  peak: { label: 'Peak', color: '#c8102e' },
  past: { label: 'Past peak', color: '#8a5a3c' },
  bare: { label: 'Bare', color: '#5b4a40' },
}

export const STAGE_ORDER: Stage[] = ['peak', 'near', 'past', 'patchy', 'green', 'bare']

export function stageFor(colorChange: number | null, leafFall: number | null): Stage {
  const color = colorChange ?? 0
  const fall = leafFall ?? 0
  if (fall >= 85) return 'bare'
  if (fall >= 50) return 'past'
  if (color >= 80) return 'peak'
  if (color >= 50) return 'near'
  if (color >= 20) return 'patchy'
  return 'green'
}

/** MapLibre expression version of stageFor, for styling GeoJSON layers. */
export const STAGE_COLOR_EXPRESSION = [
  'match',
  ['get', 'stage'],
  ...Object.entries(STAGES).flatMap(([stage, { color }]) => [stage, color]),
  '#888',
] as const
