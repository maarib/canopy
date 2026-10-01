import type { Region } from '../data/regions'

export type PeakPhase = 'early' | 'approaching' | 'peak' | 'past'

function windowFor(region: Region, today: Date) {
  const year = today.getFullYear()
  return {
    start: new Date(`${year}-${region.typicalPeak.start}T00:00:00`),
    end: new Date(`${year}-${region.typicalPeak.end}T23:59:59`),
  }
}

/** Phase relative to the region's typical (historical) peak window. */
export function peakPhase(region: Region, today = new Date()): PeakPhase {
  const { start, end } = windowFor(region, today)
  if (today > end) return 'past'
  if (today >= start) return 'peak'
  return start.getTime() - today.getTime() <= 7 * 86_400_000 ? 'approaching' : 'early'
}

export const PHASE_STYLE: Record<PeakPhase, { label: string; color: string }> = {
  early: { label: 'Mostly green', color: '#2f5d3a' },
  approaching: { label: 'Turning', color: '#e9b824' },
  peak: { label: 'Typical peak', color: '#c8102e' },
  past: { label: 'Past peak', color: '#7a5c45' },
}

export function formatWindow(region: Region): string {
  const fmt = (mmdd: string) =>
    new Date(`2000-${mmdd}T12:00:00`).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
  return `${fmt(region.typicalPeak.start)} – ${fmt(region.typicalPeak.end)}`
}

export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}
