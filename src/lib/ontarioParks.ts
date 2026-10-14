import { STAGES, stageFor, type Stage } from './stage'

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
  /**
   * Set once every park is known: whether this entry stands for its park in lists and search.
   * A park's main report location does; so do all of a park's locations when none is marked
   * main (Algonquin, Lake Superior, Rainbow Falls, Bronte Creek).
   */
  listed?: boolean
  /** False for a park Ontario Parks publishes no fall color report for; its color fields are empty. */
  report: boolean
  /** Park class ("Nature Reserve", "Waterway"…), size and founding year, where known. */
  classification?: string | null
  sizeHa?: number | null
  established?: number | null
}

export type ParkReportFeed = { source: string; fetchedAt: string; parks: ParkReport[] }

/** Daily snapshot written by scripts/scrape-ontario-parks.mjs. */
export async function fetchOntarioParks(): Promise<ParkReportFeed> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/ontario-parks.json`)
  if (!res.ok) throw new Error(`Ontario Parks data ${res.status}`)
  const feed = (await res.json()) as ParkReportFeed
  return {
    ...feed,
    parks: feed.parks.map((p) => ({ ...p, viewing: p.viewing.trim(), stage: stageFor(p.colorChange, p.leafFall), report: true })),
  }
}

export function parkTitle(p: ParkReport): string {
  return p.main || !p.location ? p.name : `${p.name} · ${p.location}`
}

type IndexedPark = { shortname: string; name: string; classification: string | null; lat: number; lng: number; region: string; sizeHa: number | null; established: number | null; url: string | null }

/** Every provincial park (347), written by scripts/build-parks-index.mjs. */
export async function fetchParksIndex(): Promise<IndexedPark[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/parks-index.json`)
  if (!res.ok) throw new Error(`Parks index ${res.status}`)
  return (await res.json()).parks
}

/**
 * Report locations followed by every park that has no report, in the same shape, so lists,
 * search, trips and the park page treat them alike. A park without a report is keyed by its
 * shortname and carries no color.
 */
export function allParks(reports: ParkReport[], index: IndexedPark[]): ParkReport[] {
  const reported = new Set(reports.map((p) => p.shortname))
  const details = new Map(index.map((p) => [p.shortname, p]))
  const hasMain = new Set(reports.filter((p) => p.main).map((p) => p.shortname))
  return [
    ...reports.map((p) => {
      const d = details.get(p.shortname)
      const listed = p.main || !hasMain.has(p.shortname)
      return d ? { ...p, listed, classification: d.classification, sizeHa: d.sizeHa, established: d.established } : { ...p, listed }
    }),
    ...index
      .filter((p) => !reported.has(p.shortname))
      .map((p): ParkReport => ({
        id: p.shortname,
        name: p.name,
        shortname: p.shortname,
        location: null,
        main: true,
        listed: true,
        region: p.region,
        dominantColor: '',
        colorChange: null,
        leafFall: null,
        viewing: '',
        reportedAt: null,
        closingDate: null,
        lat: p.lat,
        lng: p.lng,
        url: p.url ?? '',
        stage: 'green',
        report: false,
        classification: p.classification,
        sizeHa: p.sizeHa,
        established: p.established,
      })),
  ]
}

/** Whether a park entry belongs in lists and search (see `listed`). */
export const isListed = (p: ParkReport) => p.listed ?? p.main

/** A park's dot: its stage color, or a quiet grey where there is no report. */
export const parkColor = (p: ParkReport) => (p.report ? STAGES[p.stage].color : '#8d9189')

/** One line about a park for lists and search. */
export const parkDetail = (p: ParkReport) => (p.report ? `${p.colorChange ?? 0}% color` : (p.classification ?? 'Provincial park'))
