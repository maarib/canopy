// A test sheet (cover-gallery.html), not part of the app: every cover of the chosen kinds, drawn
// fresh by the current drawing code, side by side for checking shapes.
// ?kinds=region,waterfall,creek,river,lake,peak,viewpoint,park,trail (default: region,waterfall,creek)

import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { REGIONS } from '../data/regions'
import { COVER_BLEED, COVER_SIZE } from '../lib/coverFrame'
import { coverFoliage, coverShape, parkCover, placeCover, regionCover, trailCover, type CoverSpec } from '../lib/coverSpec'
import { fetchExploreAreas } from '../lib/explore'
import { forestCover } from '../lib/forestCover'
import { fetchOntarioParks, parkTitle } from '../lib/ontarioParks'
import { fetchParkBoundary } from '../lib/parkBoundaries'
import '../index.css'

type Card = { kind: string; name: string; url?: string }

const KINDS = (new URLSearchParams(location.search).get('kinds') ?? 'region,waterfall,creek').split(',')

function Gallery() {
  const [cards, setCards] = useState<Card[]>([])
  const [done, setDone] = useState(false)

  useEffect(() => {
    const abort = new AbortController()
    ;(async () => {
      const parks = (await fetchOntarioParks()).parks
      const areas = await fetchExploreAreas()
      const all: { kind: string; name: string; spec: CoverSpec }[] = [
        ...REGIONS.map((r) => ({ kind: 'region', name: r.name, spec: regionCover(r) })),
        ...parks.map((p) => ({ kind: 'park', name: parkTitle(p), spec: parkCover(p) })),
        ...areas.flatMap((a) => a.trails).map((t) => ({ kind: 'trail', name: t.name, spec: trailCover(t) })),
        ...areas.flatMap((a) => a.pois).map((p) => ({ kind: p.kind, name: p.name, spec: placeCover(p) })),
      ]
      const list = KINDS.flatMap((k) => all.filter((c) => c.kind === k))
      setCards(list.map(({ kind, name }) => ({ kind, name })))
      for (const [i, { spec }] of list.entries()) {
        if (abort.signal.aborted) return
        const outline = spec.boundary ? await fetchParkBoundary(spec.boundary) : null
        const url = await forestCover(coverShape(spec, outline), coverFoliage(spec, parks).foliage, abort.signal).catch(() => undefined)
        setCards((c) => c.map((card, j) => (j === i ? { ...card, url } : card)))
      }
      setDone(true)
    })()
    return () => abort.abort()
  }, [])

  const w = COVER_SIZE.width + 2 * COVER_BLEED
  const h = COVER_SIZE.height + 2 * COVER_BLEED
  return (
    <main className="min-h-dvh bg-[var(--surface)] p-6" data-done={done}>
      <h1 className="mb-4 text-3xl">Cover gallery</h1>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {cards.map((c, i) => (
          <figure key={i} className="rounded-2xl border border-[var(--line)] p-2">
            {c.url ? <img src={c.url} alt="" style={{ aspectRatio: `${w} / ${h}` }} className="w-full" /> : <div style={{ aspectRatio: `${w} / ${h}` }} className="skeleton w-full rounded-xl" />}
            <figcaption className="px-1 text-sm">
              <span className="text-[var(--ink-soft)]">{c.kind} · </span>
              {c.name}
            </figcaption>
          </figure>
        ))}
      </div>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<Gallery />)
