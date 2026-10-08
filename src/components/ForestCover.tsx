import { useQuery } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { coverUrl, useCoverIndex, type CoverIndex } from '../lib/coverIndex'
import { coverFoliage, coverKey, coverShape, shapeId, shapeIds, type CoverSpec } from '../lib/coverSpec'
import { COVER_BLEED, COVER_SIZE } from '../lib/coverFrame'
import { fetchOntarioParks } from '../lib/ontarioParks'
import { MAPBOX_TOKEN } from '../lib/mapStyle'
import { TurnIcon } from './ui'
import { CAN_GO_LIVE, useLiveCover } from './useLiveCover'
import { fetchParkBoundary } from '../lib/parkBoundaries'

/**
 * A detail page's cover: the place's shape as a floating piece of land with low-poly trees in
 * today's fall colors, inset to the page's content width. Pre-drawn covers (lib/coverIndex) show
 * straight away; anything else is drawn in the browser (lib/forestCover).
 *
 * It starts as a still image. Reach for it (rest the pointer on it, tap it, drag it sideways or
 * press an arrow key) and the scene itself takes the still's place (lib/liveCover): it turns under
 * the hand, with a little life on it. The 3D is only loaded and run for people who do.
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

  const url = predrawn ? coverUrl(predrawn.cover) : drawn?.key === key ? drawn.url : undefined
  const canTurn = CAN_GO_LIVE && ready && !!url
  const { figure, firstOverlay, credits, isLive, handlers } = useLiveCover(key, canTurn, () => ({ shape: coverShape(spec, outlineData), foliage }))

  if (!MAPBOX_TOKEN && !predrawn) return null

  return (
    // Sideways overflow is clipped at the panel's padding, so the panel never scrolls sideways.
    <figure
      ref={figure}
      className={`relative aspect-[3/2] overflow-x-clip [overflow-clip-margin:1.25rem] ${canTurn ? 'cursor-grab touch-pan-y' : ''}`}
      {...(canTurn && {
        tabIndex: 0,
        role: 'group',
        'aria-label': `${name}, as a small forested island. Drag it, or use the left and right arrow keys, to turn it.`,
        ...handlers,
      })}
    >
      {url ? (
        <img
          src={url}
          alt={`Illustration of ${name} as a small forested island in today's fall colors`}
          title={source}
          draggable={false}
          decoding="async"
          // Drawn with a margin all round and allowed to overflow the frame, so nothing is cropped.
          style={BLEED}
          className={`pointer-events-none absolute max-w-none animate-fade-in select-none ${isLive ? 'invisible' : ''}`}
        />
      ) : (
        <div className="skeleton size-full rounded-2xl" role="status" aria-label="Drawing the cover" />
      )}
      {/* Tilt-shift: the far and near edges go soft, like a photo of a miniature. The near bands stop
          at the frame's foot, so the page's text below stays sharp. The live scene goes under these. */}
      {url && TILT_SHIFT.map((band, i) => <div key={i} ref={i ? undefined : firstOverlay} aria-hidden="true" className="pointer-events-none absolute" style={band} />)}
      {/* Says the cover can be turned by hand. */}
      {canTurn && (
        <span aria-hidden="true" className="pointer-events-none absolute top-1 right-0 flex size-8 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--ink-soft)]">
          <TurnIcon className="size-5" />
        </span>
      )}
      {/* Credits at the right; a live cover has Mapbox's logo at the left (lib/liveCover). The row is
          as tall as the logo, so the pills sit level with its middle. */}
      <figcaption ref={credits} className="pointer-events-none absolute right-0 bottom-1 flex h-[23px] items-center gap-1 text-[9px] whitespace-nowrap text-[var(--ink-soft)]">
        <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5">© Mapbox</span>
        <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5">© OpenStreetMap</span>
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

/** Blur in CSS pixels at the very edge of the frame. */
const TILT_SHIFT_PX = 3
const SIDE = pct(-COVER_BLEED, COVER_SIZE.width)
const TILT_SHIFT = [
  { top: pct(-COVER_BLEED, COVER_SIZE.height), height: '46%', fade: 'to bottom', k: 0.5 },
  { top: pct(-COVER_BLEED, COVER_SIZE.height), height: '26%', fade: 'to bottom', k: 1 },
  { bottom: 0, height: '30%', fade: 'to top', k: 0.5 },
  { bottom: 0, height: '16%', fade: 'to top', k: 1 },
].map(({ fade, k, ...edge }) => {
  const mask = `linear-gradient(${fade}, #000, transparent)`
  const blur = `blur(${TILT_SHIFT_PX * k}px)`
  return { ...edge, left: SIDE, right: SIDE, maskImage: mask, WebkitMaskImage: mask, backdropFilter: blur, WebkitBackdropFilter: blur }
})
