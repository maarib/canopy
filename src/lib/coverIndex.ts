import { useQuery } from '@tanstack/react-query'

// Covers drawn at deploy time (scripts/build-covers.mjs) for every fall-report park, region and
// trail in that day's colors. The app shows these as plain images, with no map work at all, and
// only draws a cover itself when none matches.

/** Cover key (`shape|colors`) → its files, relative to the covers folder. */
export type CoverIndex = Record<string, { cover: string; thumb: string }>

const BASE = `${import.meta.env.BASE_URL}covers/`

async function fetchCoverIndex(): Promise<CoverIndex | null> {
  const res = await fetch(`${BASE}index.json`)
  // Local dev has no pre-drawn covers; its server answers with the app's HTML.
  if (!res.ok || !res.headers.get('content-type')?.includes('json')) return null
  return (await res.json()) as CoverIndex
}

export const useCoverIndex = () => useQuery({ queryKey: ['cover-index'], queryFn: fetchCoverIndex, staleTime: Infinity, retry: false })

export const coverUrl = (file: string) => BASE + file
