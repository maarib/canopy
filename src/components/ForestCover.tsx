import { useQuery } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { coverUrl, useCoverIndex, type CoverIndex } from '../lib/coverIndex'
import { coverFoliage, coverKey, coverShape, shapeId, shapeIds, type CoverSpec } from '../lib/coverSpec'
import { COVER_BLEED, COVER_SIZE } from '../lib/coverFrame'
import { fetchOntarioParks } from '../lib/ontarioParks'
import { MAPBOX_TOKEN } from '../lib/mapStyle'
import { fetchParkBoundary } from '../lib/parkBoundaries'

/**
 * A detail page's cover: the place's shape as a floating piece of land with low-poly trees in
 * today's fall colors. Pre-drawn covers (lib/coverIndex) show straight away; anything else is
 * drawn in the browser (lib/forestCover). A still image, inset to the page's content width.
 */
export function ForestCover({ spec, name }: { spec: CoverSpec; name: string }) {
  const parks = useQuery({ queryKey: ['ontario-parks'], queryFn: fetchOntarioParks })
  const index = useCoverIndex()
  const outline = useQuery({
    queryKey: ['park-boundary', spec.boundary ?? null],
    queryFn: () => fetchParkBoundary(spec.boundary!),
    enabled: !!spec.boundary,
    staleTime: Infinity,
  })
  const [drawn, setDrawn] = useState<{ key: string; url: string }>()

  const { foliage, source } = coverFoliage(spec, parks.data?.parks ?? [])
  const predrawn = parks.data ? findCover(index.data, spec, foliage) : undefined
  // Draw only once the colors, the pre-drawn index and the shape are known, so it happens once.
  const ready = (!!parks.data || parks.isError) && !index.isPending && (!spec.boundary || !outline.isPending)
  const outlineData = outline.data ?? null
  const key = coverKey(shapeId(spec, outlineData), foliage)

  useEffect(() => {
    if (!ready || predrawn || !MAPBOX_TOKEN) return
    const abort = new AbortController()
    // The drawing code loads only when a cover has to be drawn here; most are pre-drawn images.
    import('../lib/forestCover')
      .then(({ forestCover }) => forestCover(coverShape(spec, outlineData), foliage, abort.signal))
      .then((url) => !abort.signal.aborted && setDrawn({ key, url }))
      .catch(() => {})
    return () => abort.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the shape and colors are captured by `key`
  }, [ready, key, !!predrawn])

  if (!MAPBOX_TOKEN && !predrawn) return null
  const url = predrawn ? coverUrl(predrawn.cover) : drawn?.key === key ? drawn.url : undefined
  return (
    // Sideways overflow is clipped at the panel's padding, so the panel never scrolls sideways.
    <figure className="relative aspect-[3/2] overflow-x-clip [overflow-clip-margin:1.25rem]">
      {url ? (
        <img
          src={url}
          alt={`Illustration of ${name} as a small forested island in today's fall colors`}
          title={source}
          draggable={false}
          decoding="async"
          // Drawn with a margin all round and allowed to overflow the frame, so nothing is cropped.
          style={BLEED}
          className="pointer-events-none absolute max-w-none animate-fade-in select-none"
        />
      ) : (
        <div className="skeleton size-full rounded-2xl" role="status" aria-label="Drawing the cover" />
      )}
      <figcaption className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[9px] whitespace-nowrap text-[var(--ink-soft)]">
        © Mapbox © OpenStreetMap
      </figcaption>
    </figure>
  )
}

function findCover(index: CoverIndex | null | undefined, spec: CoverSpec, foliage: ReturnType<typeof coverFoliage>['foliage']) {
  if (!index) return undefined
  for (const id of shapeIds(spec)) {
    const hit = index[coverKey(id, foliage)]
    if (hit) return hit
  }
  return undefined
}

/**
 * A small island for list rows, only when it was pre-drawn: lists never draw covers themselves,
 * so scrolling stays smooth. Shows `fallback` (the row's usual icon) otherwise.
 */
export function CoverThumb({ spec, fallback }: { spec: CoverSpec; fallback: ReactNode }) {
  const parks = useQuery({ queryKey: ['ontario-parks'], queryFn: fetchOntarioParks })
  const index = useCoverIndex()
  const hit = parks.data ? findCover(index.data, spec, coverFoliage(spec, parks.data.parks).foliage) : undefined
  if (!hit) return fallback
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)]">
      <img src={coverUrl(hit.thumb)} alt="" loading="lazy" decoding="async" draggable={false} className="size-12 max-w-none animate-fade-in object-contain select-none" />
    </span>
  )
}

const pct = (n: number, of: number) => `${(n / of) * 100}%`
const BLEED = {
  left: pct(-COVER_BLEED, COVER_SIZE.width),
  top: pct(-COVER_BLEED, COVER_SIZE.height),
  width: pct(COVER_SIZE.width + 2 * COVER_BLEED, COVER_SIZE.width),
  height: pct(COVER_SIZE.height + 2 * COVER_BLEED, COVER_SIZE.height),
}
