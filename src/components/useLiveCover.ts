import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import type { CoverShape } from '../lib/forestCover'
import type { LiveCover } from '../lib/liveCover'
import type { Foliage } from '../lib/lowPolyTrees'
import { MAPBOX_TOKEN } from '../lib/mapStyle'

/** Degrees turned by one press of an arrow key. */
const TURN_STEP = 20
/** How long the mouse rests on a cover before it counts as reaching for it, in ms. */
const DWELL_MS = 250
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Live covers need the map, and are left out on devices with very little memory. */
export const CAN_GO_LIVE = !!MAPBOX_TOKEN && !((navigator as { deviceMemory?: number }).deviceMemory! <= 2)

/**
 * Brings a cover to life when someone reaches for it: the mouse resting on it, a tap, a sideways
 * drag or an arrow key. Scrolling past does not count. The 3D (lib/liveCover) is loaded then, the
 * scene takes the still's place once it is set up, and it leaves with the page.
 *
 * `key` names the cover (its shape in its colors); `scene` gives what to set up for it.
 */
export function useLiveCover(key: string, canTurn: boolean, scene: () => { shape: CoverShape; foliage: Foliage }) {
  const figure = useRef<HTMLElement>(null)
  /** The first of the cover's overlays: the live scene goes in under it. */
  const firstOverlay = useRef<HTMLDivElement>(null)
  const credits = useRef<HTMLElement>(null)
  const cover = useRef<LiveCover>(null)
  /** The cover someone has reached for, by key; it goes live once its scene is ready. */
  const [wanted, setWanted] = useState<string>()
  const [live, setLive] = useState<string>()
  const dwell = useRef(0)
  const press = useRef<{ x: number; t: number }>(null)

  useEffect(() => {
    if (wanted !== key || !canTurn) return
    const abort = new AbortController()
    let mine: LiveCover | undefined
    Promise.all([import('../lib/forestCover'), import('../lib/liveCover')])
      .then(async ([{ stageCover }, { liveCover }]) => {
        const { shape, foliage } = scene()
        const stage = await stageCover(shape, foliage, abort.signal)
        if (abort.signal.aborted || !figure.current) return stage.release()
        mine = cover.current = liveCover(figure.current, firstOverlay.current, credits.current, stage, reducedMotion())
        setLive(key)
      })
      .catch(() => {})
    return () => {
      abort.abort()
      mine?.dispose()
      cover.current = null
      setLive(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the shape and colors are captured by `key`
  }, [wanted, key, canTurn])

  const reach = () => canTurn && setWanted(key)
  const rest = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || dwell.current) return
    // Counted from the first movement over it: a page can open with the mouse already there.
    dwell.current = window.setTimeout(reach, DWELL_MS)
    // The code is fetched while the mouse settles; nothing runs until it has.
    void import('../lib/liveCover')
  }

  return {
    figure,
    firstOverlay,
    credits,
    isLive: live === key,
    /** Pointer and key handlers for the cover's figure. */
    handlers: {
      onPointerEnter: rest,
      onPointerLeave: () => {
        clearTimeout(dwell.current)
        dwell.current = 0
      },
      onPointerDown: (e: PointerEvent) => {
        press.current = { x: e.clientX, t: e.timeStamp }
      },
      onPointerMove: (e: PointerEvent) => {
        rest(e)
        if (press.current && Math.abs(e.clientX - press.current.x) > 8) reach()
      },
      onPointerUp: (e: PointerEvent) => {
        if (press.current && e.timeStamp - press.current.t < 300) reach()
        press.current = null
      },
      onPointerCancel: () => {
        press.current = null
      },
      onKeyDown: (e: KeyboardEvent) => {
        const turn = e.key === 'ArrowLeft' ? -TURN_STEP : e.key === 'ArrowRight' ? TURN_STEP : 0
        if (!turn && e.key !== 'Home') return
        e.preventDefault()
        reach()
        if (turn) cover.current?.turnBy(turn)
        else cover.current?.home()
      },
    },
  }
}
