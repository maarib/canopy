// A cover brought to life: the scene the still image is taken from, laid over it on the page so it
// can be turned by dragging. Trees lean as the land turns and settle when it stops; small life
// (lib/coverLife) moves over it. Loaded only when someone reaches for a cover.

import { COVER_BLEED, COVER_SIZE } from './coverFrame'
import { addLife } from './coverLife'
import { bboxOf } from './diorama'
import { showTrees, type Staged } from './forestCover'

/** Degrees turned per pixel dragged. */
const TURN = 0.5
/** The animals keep moving this long after the cover was last touched, then rest. */
const AWAKE_MS = 30_000

export type LiveCover = {
  /** Turn by `deg` (arrow keys). */
  turnBy: (deg: number) => void
  /** Turn back to the angle of the still. */
  home: () => void
  /** Take the scene off the page and hand the cover map back. */
  dispose: () => void
}

/**
 * Lays `stage` over the still in `figure` (before `above`, so the page's own overlays stay on top)
 * and lets it be turned. With `calm` (reduced motion) the land follows the hand and nothing else
 * moves. `onTurn` is called the first time it is turned.
 */
export function liveCover(figure: HTMLElement, above: Element | null, stage: Staged, calm: boolean, onTurn: () => void): LiveCover {
  const { map } = stage
  const box = map.getContainer()
  Object.assign(box.style, { position: 'absolute', transformOrigin: '0 0', pointerEvents: 'auto', cursor: 'grab', touchAction: 'pan-y' })
  box.inert = false
  // A live Mapbox map carries Mapbox's logo; it sits in the corner of the frame, not of the wider
  // canvas the scene is drawn on.
  const logo = box.querySelector<HTMLElement>('.mapboxgl-ctrl-bottom-left')
  if (logo) Object.assign(logo.style, { left: `${COVER_BLEED}px`, bottom: `${COVER_BLEED}px` })
  figure.insertBefore(box, above)

  // Exactly over the still: the same margin all round, scaled to the page's width.
  const fit = () => {
    const k = figure.clientWidth / COVER_SIZE.width
    Object.assign(box.style, { left: `${-COVER_BLEED * k}px`, top: `${-COVER_BLEED * k}px`, transform: `scale(${k})` })
  }
  fit()
  const sized = new ResizeObserver(fit)
  sized.observe(figure)

  // The view the still was taken from. The land turns around its own middle, which stays where the
  // still has it, at the still's own size.
  const home = { bearing: map.getBearing(), center: map.getCenter() }
  const [w, s, e, n] = bboxOf(stage.scene.land)
  const middle: [number, number] = [(w + e) / 2, (s + n) / 2]
  const pin = map.project(middle)
  let turned = false
  const view = (bearing: number) => {
    map.jumpTo({ bearing })
    const at = map.project(middle)
    const centre = map.project(map.getCenter())
    map.jumpTo({ center: map.unproject([centre.x + at.x - pin.x, centre.y + at.y - pin.y]) })
    // Which trees stand in front of the trail or stream changes with the angle.
    showTrees(stage)
    if (!turned && Math.abs(bearing - home.bearing) > 2) {
      turned = true
      onTurn()
    }
  }

  const life = addLife(stage, calm)
  // Trees lean against the turn, then swing back past upright and come to rest.
  const spring = { lean: 0, speed: 0 }
  /** A turn still playing out after the hand has left: coasting, an arrow key's step, the way home. */
  let glide: ((dt: number) => boolean) | undefined
  let seen = true
  let awakeUntil = performance.now() + AWAKE_MS
  let before = 0
  let was = map.getBearing()
  let frame = 0

  const tick = (now: number) => {
    frame = 0
    const dt = before ? Math.min(40, now - before) : 16
    before = now
    if (glide && !glide(dt)) glide = undefined
    const bearing = map.getBearing()
    const rate = ((((bearing - was + 540) % 360) - 180) / dt) * 16
    was = bearing
    const pull = calm ? 0 : Math.max(-9, Math.min(9, -rate * 2.2))
    spring.speed += ((pull - spring.lean) * 0.09 - spring.speed * 0.16) * (dt / 16)
    spring.lean += spring.speed * (dt / 16)
    const fresh = now < awakeUntil
    life.frame(dt, fresh, calm ? 0 : spring.lean)
    // Asleep once nothing is left to play out: no flock in the air, the trees at rest, no turn.
    const settled = Math.abs(spring.lean) < 0.05 && Math.abs(spring.speed) < 0.05
    if (seen && (!calm || glide) && (fresh || life.busy() || glide || drag || !settled)) run()
    else before = 0
  }
  const run = () => {
    if (!frame) frame = requestAnimationFrame(tick)
  }
  const wake = () => {
    awakeUntil = performance.now() + AWAKE_MS
    if (seen) run()
  }
  // Nothing moves while the cover is scrolled out of view.
  const watching = new IntersectionObserver(([entry]) => {
    seen = entry.isIntersecting
    if (seen) run()
  })
  watching.observe(figure)

  let drag: { x: number; bearing: number; last: number; t: number; speed: number } | undefined
  let pressed = { x: 0, t: 0 }
  const down = (ev: PointerEvent) => {
    glide = undefined
    box.setPointerCapture(ev.pointerId)
    box.style.cursor = 'grabbing'
    drag = { x: ev.clientX, bearing: map.getBearing(), last: ev.clientX, t: ev.timeStamp, speed: 0 }
    pressed = { x: ev.clientX, t: ev.timeStamp }
    wake()
  }
  const move = (ev: PointerEvent) => {
    wake()
    if (!drag) return
    const dt = Math.max(1, ev.timeStamp - drag.t)
    drag.speed = 0.7 * drag.speed + 0.3 * (((ev.clientX - drag.last) * TURN) / dt)
    drag.last = ev.clientX
    drag.t = ev.timeStamp
    view(drag.bearing + (ev.clientX - drag.x) * TURN)
  }
  const up = (ev: PointerEvent) => {
    if (!drag) return
    box.style.cursor = 'grab'
    // A tap, not a turn: the trees shiver and the birds hurry on.
    if (!calm && Math.abs(ev.clientX - pressed.x) < 4 && ev.timeStamp - pressed.t < 300) {
      spring.speed += 2.4
      life.startle()
    }
    // Let go while moving and it coasts to a stop.
    let speed = !calm && ev.timeStamp - drag.t < 80 ? drag.speed : 0
    drag = undefined
    if (speed)
      glide = (dt) => {
        speed *= 0.94 ** (dt / 16)
        if (Math.abs(speed) < 0.005) return false
        view(map.getBearing() + speed * dt)
        return true
      }
    wake()
  }
  /** Eases `turn` degrees further round from where it is now. */
  const ease = (turn: number, ms: number) => {
    const from = map.getBearing()
    if (calm) return view(from + turn)
    let t = 0
    glide = (dt) => {
      t = Math.min(1, t + dt / ms)
      view(from + turn * (1 - (1 - t) ** 3))
      return t < 1
    }
    wake()
  }
  const goHome = () => ease(((home.bearing - map.getBearing() + 540) % 360) - 180, 450)

  const listeners = [['pointerdown', down], ['pointermove', move], ['pointerup', up], ['pointercancel', up], ['pointerenter', wake], ['dblclick', goHome]] as const
  for (const [type, fn] of listeners) box.addEventListener(type, fn as EventListener)
  run()

  return {
    turnBy: (deg) => ease(deg, 260),
    home: goHome,
    dispose() {
      cancelAnimationFrame(frame)
      sized.disconnect()
      watching.disconnect()
      for (const [type, fn] of listeners) box.removeEventListener(type, fn as EventListener)
      life.remove()
      if (logo) Object.assign(logo.style, { left: '', bottom: '' })
      stage.release()
    },
  }
}
