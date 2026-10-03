// Pre-draws cover images for every fall-report park, region, trail and place in today's colors, so the
// app shows them as plain images instead of drawing them in the browser. Opens
// scripts/covers/render.html (the app's own cover code) in headless Chromium through Vite, and
// writes <out>/<name>.webp, <out>/<name>-thumb.webp and <out>/index.json.
// Usage: node scripts/build-covers.mjs [out dir, default dist/covers] [--reuse <dir>] [--only <kind>].
// --only draws just the covers whose shape id starts with it (park, island, place), for checking. With
// --reuse, covers in that folder (a previous run's output) whose shape and colors haven't changed
// are copied instead of drawn. Needs VITE_MAPBOX_TOKEN (from the environment or .env.local).
// Run by .github/workflows/deploy.yml after the build.

import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const args = process.argv.slice(2)
const reuseAt = args.indexOf('--reuse')
const REUSE = reuseAt >= 0 ? resolve(args.splice(reuseAt, 2)[1]) : null
const onlyAt = args.indexOf('--only')
const ONLY = onlyAt >= 0 ? args.splice(onlyAt, 2)[1] : ''
const OUT = resolve(args[0] ?? 'dist/covers')

// Covers are only reused when drawn by the same code: a fingerprint of the drawing code is kept
// beside them, and any change to it redraws everything.
const DRAWING_CODE = ['src/lib/forestCover.ts', 'src/lib/diorama.ts', 'src/lib/lowPolyTrees.ts', 'src/lib/placeScenes.ts', 'src/lib/coverSpec.ts', 'src/lib/foliage.ts', 'scripts/covers/render.ts']
const fingerprint = createHash('sha256')
for (const f of DRAWING_CODE) fingerprint.update(await readFile(f))
const VERSION = fingerprint.digest('hex').slice(0, 16)
const sameCode = REUSE && (await readFile(resolve(REUSE, 'version.txt'), 'utf8').catch(() => '')) === VERSION
const previous = sameCode ? await readFile(resolve(REUSE, 'index.json'), 'utf8').then(JSON.parse).catch(() => ({})) : {}
const started = Date.now()

await rm(OUT, { recursive: true, force: true })
await mkdir(OUT, { recursive: true })

const server = await createServer({ logLevel: 'warn', server: { port: 5199 } })
await server.listen()
// Software WebGL, so the drawings match on any machine, GPU or not.
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
try {
  const page = await browser.newPage({ deviceScaleFactor: 2 })
  page.on('pageerror', (e) => console.error('page error:', e.message))
  page.on('console', (m) => m.type() === 'error' && console.error('console:', m.text()))
  let count = 0
  await page.exposeFunction('saveCover', async (file, cover, thumb) => {
    await writeFile(resolve(OUT, `${file}.webp`), Buffer.from(cover, 'base64'))
    await writeFile(resolve(OUT, `${file}-thumb.webp`), Buffer.from(thumb, 'base64'))
    if (++count % 10 === 0) console.log(`${count} covers…`)
  })
  await page.goto(`${server.resolvedUrls.local[0]}scripts/covers/render.html`)
  await page.waitForFunction(() => typeof window.renderCovers === 'function')
  const index = await page.evaluate(([prev, only]) => window.renderCovers(prev, only), [previous, ONLY])
  let reused = 0
  for (const [key, files] of Object.entries(index))
    if (previous[key]?.cover === files.cover) {
      for (const f of [files.cover, files.thumb]) await copyFile(resolve(REUSE, f), resolve(OUT, f))
      reused++
    }
  await writeFile(resolve(OUT, 'index.json'), JSON.stringify(index))
  await writeFile(resolve(OUT, 'version.txt'), VERSION)
  console.log(`${Object.keys(index).length} covers: ${count} drawn, ${reused} unchanged, in ${Math.round((Date.now() - started) / 1000)} s`)
} finally {
  await browser.close()
  await server.close()
}
