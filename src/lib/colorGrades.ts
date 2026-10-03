// Color grades for Mapbox Standard's custom theme: a 3D lookup table applied to every basemap
// color. Mapbox reads it as an N²×N PNG where x = r + N·b and y = g (its shader samples
// `col.rbg`), N ≤ 32. Our pins and data layers sit outside the basemap and keep their colors.

const N = 32
const clamp = (v: number) => Math.min(1, Math.max(0, v))
type RGB = [number, number, number]

const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as RGB
const mix = (a: RGB, b: RGB, t: number): RGB => a.map((v, i) => v + (b[i] - v) * t) as RGB
const luma = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b

function ramp(stops: [number, string][], t: number): RGB {
  for (let i = 1; i < stops.length; i++)
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1]
      const [t1, c1] = stops[i]
      return mix(hex(c0), hex(c1), (t - t0) / (t1 - t0))
    }
  return hex(stops[stops.length - 1][1])
}

function rgbToHsl(r: number, g: number, b: number): RGB {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, s, l]
}

function hslToRgb(h: number, s: number, l: number): RGB {
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)]
}

const GRADES = {
  /** Warm film: greens toward olive and gold, blues a little cooler, lifted shadows, soft contrast. */
  autumn: (r: number, g: number, b: number): RGB => {
    let [h, s, l] = rgbToHsl(r, g, b)
    if (h > 60 && h < 170) {
      h -= (h - 42) * 0.45
      s *= 1.1
    }
    if (h >= 170 && h < 250) s *= 0.8
    ;[r, g, b] = hslToRgb(h, clamp(s), l)
    const c = (v: number) => 0.5 + (v - 0.5) * 0.92
    return [c(r * 1.06 + 0.02), c(g * 1.01 + 0.015), c(b * 0.9 + 0.02)]
  },
  /** Duotone in Canopy's bark, spruce and paper, keyed to brightness. */
  ink: (r: number, g: number, b: number): RGB =>
    ramp([[0, '#2a211c'], [0.35, '#2f5d3a'], [0.72, '#d9cdb4'], [1, '#fffdf9']], luma(r, g, b)),
  /** Posterized into a few warm inks, like a risograph park poster. */
  riso: (r: number, g: number, b: number): RGB => {
    const l = Math.round(luma(r, g, b) * 4) / 4
    return mix(ramp([[0, '#3b2f2a'], [0.25, '#7a3b2e'], [0.5, '#e8730c'], [0.75, '#e9d8b4'], [1, '#fbf6ee']], l), [r, g, b], 0.18)
  },
}
export type GradeId = keyof typeof GRADES

const cache = new Map<GradeId, string>()

/** The grade as base64 PNG (no data-URL prefix), for Standard's `theme-data`. Drawn once. */
export function gradeData(id: GradeId): string {
  const hit = cache.get(id)
  if (hit) return hit
  const canvas = document.createElement('canvas')
  canvas.width = N * N
  canvas.height = N
  const ctx = canvas.getContext('2d')!
  const img = ctx.createImageData(N * N, N)
  const fn = GRADES[id]
  for (let g = 0; g < N; g++)
    for (let b = 0; b < N; b++)
      for (let r = 0; r < N; r++) {
        const out = fn(r / (N - 1), g / (N - 1), b / (N - 1))
        const i = (g * N * N + b * N + r) * 4
        img.data[i] = clamp(out[0]) * 255
        img.data[i + 1] = clamp(out[1]) * 255
        img.data[i + 2] = clamp(out[2]) * 255
        img.data[i + 3] = 255
      }
  ctx.putImageData(img, 0, 0)
  const data = canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '')
  cache.set(id, data)
  return data
}
