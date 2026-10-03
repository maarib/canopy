import { stageFor, type Stage } from './stage'

export type ParkReport = {
  id: string
  name: string
  shortname: string
  location: string | null
  main: boolean
  region: string
  dominantColor: string
  colorChange: number | null
  leafFall: number | null
  viewing: string
  reportedAt: string | null
  closingDate: string | null
  lat: number
  lng: number
  url: string
  stage: Stage
}

export type ParkReportFeed = { source: string; fetchedAt: string; parks: ParkReport[] }

/** Daily snapshot written by scripts/scrape-ontario-parks.mjs. */
export async function fetchOntarioParks(): Promise<ParkReportFeed> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/ontario-parks.json`)
  if (!res.ok) throw new Error(`Ontario Parks data ${res.status}`)
  const feed = (await res.json()) as ParkReportFeed
  return {
    ...feed,
    parks: feed.parks.map((p) => ({ ...p, viewing: p.viewing.trim(), stage: stageFor(p.colorChange, p.leafFall) })),
  }
}

export function parkTitle(p: ParkReport): string {
  return p.main || !p.location ? p.name : `${p.name} · ${p.location}`
}
