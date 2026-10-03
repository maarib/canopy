import { createElement } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { PlaceIcon, type PlaceIconId } from '../components/PlaceIcon'
import type { TreeIconId } from '../data/treeIcons'
import { PLACE_KINDS } from './explore'
import { LEAF_COLORS, LEAF_SHAPES } from './leafShapes'

// Map pins drawn once onto canvases and handed to Mapbox as images, so they render on the GPU
// as a symbol layer. DOM markers (what these replaced) are repositioned by the browser on every
// frame of a pan or zoom, which is what made the map stutter. Every pin shares one base: a disc
// with the same white border, floating on a soft shadow.

const RATIO = 2

type MapLike = {
  hasImage: (id: string) => boolean
  addImage: (id: string, img: ImageData, o: { pixelRatio: number }) => void
  once: (type: 'idle', listener: () => void) => unknown
  triggerRepaint: () => void
}

function svgImage(markup: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
  return img.decode().then(() => img)
}

/** The two-colour leaf as standalone SVG (ink fixed to the pin's light background). */
function leafMarkup(id: TreeIconId): string {
  const s = LEAF_SHAPES[id]
  const c = LEAF_COLORS[id]
  const ink = '#2d3550'
  const blades = s.blades.map((b) => `<path d="${b.d}" fill="${b.tone === 'accent' ? (c.accent ?? c.leaf) : b.tone === 'ink' ? ink : c.leaf}"/>`).join('')
  const needles = (s.needles ?? []).map((n) => `<path d="${n.d}" stroke-width="${n.width}"/>`).join('')
  const strokes = s.ink.map((k) => `<path d="${k.d}" stroke-width="${k.width}"/>`).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${blades}<g fill="none" stroke="${c.leaf}" stroke-linecap="round">${needles}</g><g fill="none" stroke="${ink}" stroke-linecap="round" stroke-linejoin="round">${strokes}</g></svg>`
}

/** PlaceIcon rendered to a white SVG string, so the map pins and the app share one drawing. */
function glyphMarkup(kind: PlaceIconId): string {
  const host = document.createElement('div')
  const root = createRoot(host)
  flushSync(() => root.render(createElement(PlaceIcon, { kind, className: '' })))
  const svg = host.innerHTML
  root.unmount()
  return svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"').replace(/currentColor/g, '#ffffff')
}

/**
 * One pin drawn for one on-screen size (`px` is the disc diameter, border included). Pins are
 * drawn at the exact size they're shown with icon-size 1: Mapbox garbled or dropped these raster
 * icons when scaling them below 1.
 */
class Pin {
  readonly px: number
  readonly size: number
  readonly ctx: CanvasRenderingContext2D
  private readonly canvas: HTMLCanvasElement
  constructor(px: number) {
    this.px = px
    // Room around the disc for the floating shadow, which sits a little below it.
    this.size = Math.ceil(px * 1.4) * RATIO
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.canvas.height = this.size
    this.ctx = this.canvas.getContext('2d')!
  }
  get centre() {
    return this.size / 2
  }
  /** Device pixels for a length given in pin units (a 40px pin's CSS pixels). */
  u(n: number) {
    return (n * this.px * RATIO) / 40
  }
  image(id: string): PinImage {
    return { id, data: this.ctx.getImageData(0, 0, this.size, this.size) }
  }
  /** Draw `img` centred, `w` pin units wide. */
  centred(img: CanvasImageSource, w: number) {
    const d = this.u(w)
    this.ctx.drawImage(img, this.centre - d / 2, this.centre - d / 2, d, d)
  }
}

/** Every pin's border: the same white ring on all pin types (in pin units). */
const BORDER = 3

/**
 * The shared pin base: a soft shadow on the ground below (so the pin reads as floating), a
 * closer contact shadow, then the disc in `fill` with the white border.
 */
function disc(pin: Pin, fill: string) {
  const { ctx, centre: c } = pin
  const r = pin.u(20) - pin.u(BORDER) / 2
  ctx.save()
  ctx.filter = `blur(${pin.u(3)}px)`
  ctx.fillStyle = 'rgba(0,0,0,0.30)'
  ctx.beginPath()
  ctx.ellipse(c, c + r * 0.82, r * 0.72, r * 0.24, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.22)'
  ctx.shadowBlur = pin.u(3)
  ctx.shadowOffsetY = pin.u(1.5)
  ctx.beginPath()
  ctx.arc(c, c, r, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.restore()
  ctx.lineWidth = pin.u(BORDER)
  ctx.strokeStyle = '#ffffff'
  ctx.stroke()
}

/** A small status dot on the pin's lower right edge (e.g. a region's peak phase). */
function badge(pin: Pin, color: string) {
  const { ctx, centre: c } = pin
  const off = pin.u(16) * Math.SQRT1_2
  ctx.beginPath()
  ctx.arc(c + off, c + off, pin.u(6), 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.lineWidth = pin.u(2)
  ctx.strokeStyle = '#ffffff'
  ctx.stroke()
}

export type PinImage = { id: string; data: ImageData }

/**
 * Add every pin image in one synchronous batch once the map has settled, then call `onAdded`.
 * Callers keep the pin layers hidden until then: when Mapbox lays out a symbol before its image
 * exists and patches the image in later, its icon atlas can corrupt and pins render as noise or
 * with another pin's artwork.
 */
export function addPins(map: MapLike, pins: PinImage[], onAdded?: () => void) {
  map.once('idle', () => {
    for (const { id, data } of pins) if (!map.hasImage(id)) map.addImage(id, data, { pixelRatio: RATIO })
    onAdded?.()
  })
  map.triggerRepaint() // make sure an idle event follows even if the map is already still
}

/** Pin image ids carry their size: `place-waterfall@28`. Layers pick the size with an expression. */
export const sized = (base: string, px: number) => `${base}@${px}`
export const regionPinId = (tree: TreeIconId, phase: string) => `region-${tree}-${phase.replace('#', '')}`
export const placePinId = (kind: PlaceIconId) => `place-${kind}`

/** On-screen sizes: regions 24px zoomed out, 32px, 44px selected; places 28/44; fishing 24/34. */
export const PIN_SIZES = { region: [24, 32, 44], place: [28, 44], fishing: [24, 34] } as const

/** Region pins: white disc with the tree's leaf, and a dot in the region's peak-phase colour. */
export async function drawRegionPins(tree: TreeIconId, phase: string): Promise<PinImage[]> {
  const leaf = await svgImage(leafMarkup(tree))
  return PIN_SIZES.region.map((px) => {
    const pin = new Pin(px)
    disc(pin, '#ffffff')
    pin.centred(leaf, 27)
    badge(pin, phase)
    return pin.image(sized(regionPinId(tree, phase), px))
  })
}

/** Place and trailhead pins: disc in the kind's colour with a white glyph. */
export async function drawPlacePins(kind: PlaceIconId): Promise<PinImage[]> {
  const glyph = await svgImage(glyphMarkup(kind))
  return PIN_SIZES.place.map((px) => {
    const pin = new Pin(px)
    disc(pin, PLACE_KINDS[kind].color)
    pin.centred(glyph, 23)
    return pin.image(sized(placePinId(kind), px))
  })
}

/** Pins with a full-colour icon from an image URL (Icons8) on a white disc, e.g. fishing access. */
export async function drawIconPins(base: string, url: string, sizes: readonly number[]): Promise<PinImage[]> {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = url
  await img.decode()
  return sizes.map((px) => {
    const pin = new Pin(px)
    disc(pin, '#ffffff')
    pin.centred(img, 26)
    return pin.image(sized(base, px))
  })
}
