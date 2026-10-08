import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { coverUrl, useCoverIndex, type CoverIndex } from '../lib/coverIndex'
import { coverFoliage, coverKey, coverShape, shapeId, shapeIds, type CoverSpec } from '../lib/coverSpec'
import { COVER_BLEED, COVER_SIZE } from '../lib/coverFrame'
import type { LiveCover } from '../lib/liveCover'
import { fetchOntarioParks } from '../lib/ontarioParks'
import { MAPBOX_TOKEN } from '../lib/mapStyle'
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
  const figure = useRef<HTMLElement>(null)
  const firstBand = useRef<HTMLDivElement>(null)
  const scene = useRef<LiveCover>(null)
  /** The cover someone has reached for, by key; it goes live once its scene is ready. */
  const [wanted, setWanted] = useState<string>()
  const [live, setLive] = useState<string>()
  const [turned, setTurned] = useState(hasTurned)
  const dwell = useRef(0)
  const press = useRef<{ x: number; t: number }>(null)

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
  const reach = () => canTurn && setWanted(key)

  // The scene takes the still's place once it is set up, and leaves with the page.
  useEffect(() => {
    if (wanted !== key || !canTurn) return
    const abort = new AbortController()
    let cover: LiveCover | undefined
    Promise.all([import('../lib/forestCover'), import('../lib/liveCover')])
      .then(async ([{ stageCover }, { liveCover }]) => {
        const stage = await stageCover(coverShape(spec, outlineData), foliage, abort.signal)
        if (abort.signal.aborted || !figure.current) return stage.release()
        cover = scene.current = liveCover(figure.current, firstBand.current, stage, REDUCED_MOTION(), () => {
          setTurned(true)
          rememberTurned()
        })
        setLive(key)
      })
      .catch(() => {})
    return () => {
      abort.abort()
      cover?.dispose()
      scene.current = null
      setLive(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the shape and colors are captured by `key`
  }, [wanted, key, canTurn])

  if (!MAPBOX_TOKEN && !predrawn) return null
  const isLive = live === key

  // A mouse resting on the cover, a tap, or a sideways drag reaches for it; scrolling past does not.
  const rest = (e: PointerEvent) => {
    // Counted from the first movement over it: a page can open with the mouse already there.
    if (e.pointerType === 'mouse' && !dwell.current) dwell.current = window.setTimeout(reach, 250)
  }
  const leave = () => {
    clearTimeout(dwell.current)
    dwell.current = 0
  }
  const onPointerDown = (e: PointerEvent) => {
    press.current = { x: e.clientX, t: e.timeStamp }
  }
  const onPointerMove = (e: PointerEvent) => {
    rest(e)
    if (press.current && Math.abs(e.clientX - press.current.x) > 8) reach()
  }
  const onPointerUp = (e: PointerEvent) => {
    if (press.current && e.timeStamp - press.current.t < 300) reach()
    press.current = null
  }
  const onKeyDown = (e: KeyboardEvent) => {
    const turn = e.key === 'ArrowLeft' ? -TURN_STEP : e.key === 'ArrowRight' ? TURN_STEP : 0
    if (!turn && e.key !== 'Home') return
    e.preventDefault()
    reach()
    if (turn) scene.current?.turnBy(turn)
    else scene.current?.home()
  }

  return (
    // Sideways overflow is clipped at the panel's padding, so the panel never scrolls sideways.
    <figure
      ref={figure}
      className={`relative aspect-[3/2] overflow-x-clip [overflow-clip-margin:1.25rem] ${canTurn ? 'cursor-grab touch-pan-y' : ''}`}
      {...(canTurn && {
        tabIndex: 0,
        role: 'group',
        'aria-label': `${name}, as a small forested island. Drag it, or use the left and right arrow keys, to turn it.`,
        onPointerEnter: rest,
        onPointerLeave: leave,
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel: () => (press.current = null),
        onKeyDown,
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
      {url && TILT_SHIFT.map((band, i) => <div key={i} ref={i ? undefined : firstBand} aria-hidden="true" className="pointer-events-none absolute" style={band} />)}
      {canTurn && !turned && (
        <span aria-hidden="true" className="pointer-events-none absolute top-1 right-1 rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[11px] whitespace-nowrap text-[var(--ink-soft)]">
          Drag to turn
        </span>
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

/** Degrees turned by one press of an arrow key. */
const TURN_STEP = 20
const REDUCED_MOTION = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
/** Live covers need the map, and are left out on devices with very little memory. */
const CAN_GO_LIVE = !!MAPBOX_TOKEN && !((navigator as { deviceMemory?: number }).deviceMemory! <= 2)

// The "Drag to turn" hint goes away for good once someone has turned a cover.
const TURNED_KEY = 'canopy:cover-turned'
function hasTurned() {
  try {
    return localStorage.getItem(TURNED_KEY) === '1'
  } catch {
    return false
  }
}
function rememberTurned() {
  try {
    localStorage.setItem(TURNED_KEY, '1')
  } catch {
    // Private windows may refuse; the hint then returns next visit.
  }
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
