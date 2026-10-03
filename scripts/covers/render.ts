// Runs in headless Chromium (scripts/build-covers.mjs): draws the cover of every fall-report
// park, region and trail in today's colors with the app's own code, plus a small thumbnail for
// list rows, and hands each to the Node script to save. Covers whose shape and colors are
// unchanged since the last deploy are reused rather than drawn again.

import { REGIONS } from '../../src/data/regions'
import { coverFoliage, coverKey, coverShape, parkCover, regionCover, trailCover, type CoverSpec } from '../../src/lib/coverSpec'
import type { CoverIndex } from '../../src/lib/coverIndex'
import { fetchExploreAreas } from '../../src/lib/explore'
import { COVER_BLEED, COVER_SIZE, forestCover } from '../../src/lib/forestCover'
import { fetchOntarioParks } from '../../src/lib/ontarioParks'
import { fetchParkBoundary } from '../../src/lib/parkBoundaries'

declare global {
  interface Window {
    saveCover: (file: string, cover: string, thumb: string) => Promise<void>
    renderCovers: (previous: CoverIndex) => Promise<CoverIndex>
  }
}

/** Thumbnails are this many pixels square (shown at 48 CSS px, so sharp at 2×). */
const THUMB = 96

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
function hash(s: string) {
  let h = 0x811c9dc5
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193)
  return (h >>> 0).toString(16).padStart(8, '0')
}

const toBase64 = (blob: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.readAsDataURL(blob)
  })

/** The cover's frame (plus a little of the margin, for treetops), fitted into a square. */
async function thumbnail(url: string): Promise<string> {
  const img = new Image()
  img.src = url
  await img.decode()
  const k = img.naturalWidth / (COVER_SIZE.width + 2 * COVER_BLEED)
  const pad = 12
  const sx = (COVER_BLEED - pad) * k
  const sy = (COVER_BLEED - pad * 2) * k
  const sw = (COVER_SIZE.width + pad * 2) * k
  const sh = (COVER_SIZE.height + pad * 2) * k
  const scale = Math.min(THUMB / sw, THUMB / sh)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = THUMB
  canvas.getContext('2d')!.drawImage(img, sx, sy, sw, sh, (THUMB - sw * scale) / 2, (THUMB - sh * scale) / 2, sw * scale, sh * scale)
  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/webp', 0.9))
  return toBase64(blob)
}

window.renderCovers = async (previous) => {
  const parks = (await fetchOntarioParks()).parks
  const trails = (await fetchExploreAreas()).flatMap((a) => a.trails)
  const specs: CoverSpec[] = [...parks.map(parkCover), ...REGIONS.map(regionCover), ...trails.map(trailCover)]
  const index: CoverIndex = {}
  for (const spec of specs) {
    const outline = spec.boundary ? await fetchParkBoundary(spec.boundary) : null
    const shape = coverShape(spec, outline)
    const { foliage } = coverFoliage(spec, parks)
    const key = coverKey(shape.id, foliage)
    if (index[key]) continue
    // Unchanged since the last deploy: the Node script copies the old files.
    if (previous[key]) {
      index[key] = previous[key]
      continue
    }
    const url = await forestCover(shape, foliage, new AbortController().signal)
    const file = `${slug(shape.id)}-${hash(key)}`
    await window.saveCover(file, await toBase64(await (await fetch(url)).blob()), await thumbnail(url))
    index[key] = { cover: `${file}.webp`, thumb: `${file}-thumb.webp` }
    URL.revokeObjectURL(url)
  }
  return index
}
