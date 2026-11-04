import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

/**
 * The map is on every first screen, but its code is split off (FoliageMap and the ~500 kB map
 * engine) and only requested once the app's own code has run. Preloading it from the page starts
 * that download with the app's instead of about a second later.
 */
function preloadMap(): Plugin {
  return {
    name: 'canopy:preload-map',
    apply: 'build',
    transformIndexHtml(_html, { bundle }) {
      if (!bundle) return
      const base = process.env.BASE_PATH ?? '/'
      const map = Object.values(bundle).find((c) => c.type === 'chunk' && c.facadeModuleId?.endsWith('/components/FoliageMap.tsx'))
      if (!map || map.type !== 'chunk') throw new Error('preloadMap: the FoliageMap chunk was not found')
      const scripts = [map.fileName, ...map.imports.concat(map.dynamicImports).filter((f) => f.includes('mapbox-gl'))]
      const styles = [...(map.viteMetadata?.importedCss ?? [])]
      return [
        ...scripts.map((f) => ({ tag: 'link', attrs: { rel: 'modulepreload', crossorigin: true, href: base + f }, injectTo: 'head' as const })),
        ...styles.map((f) => ({ tag: 'link', attrs: { rel: 'preload', as: 'style', crossorigin: true, href: base + f }, injectTo: 'head' as const })),
      ]
    },
  }
}

// SERVICE_WORKER=off builds a worker that removes itself and its caches (src/sw.js).
const serviceWorkerOn = process.env.SERVICE_WORKER !== 'off'

/**
 * Emits sw.js from src/sw.js, with the base path, a build version and the list of this build's
 * hashed files to keep (everything under assets/), so repeat visits load the app from the device.
 */
function serviceWorker(): Plugin {
  return {
    name: 'canopy:service-worker',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const base = process.env.BASE_PATH ?? '/'
      if (!serviceWorkerOn) {
        this.emitFile({ type: 'asset', fileName: 'sw.js', source: SW_OFF })
        return
      }
      const precache = Object.keys(bundle).filter((f) => f.startsWith('assets/')).sort()
      const source = readFileSync(new URL('./src/sw.js', import.meta.url), 'utf8')
      const version = createHash('sha256').update(precache.join('\n')).update(source).digest('hex').slice(0, 12)
      const head = `const BASE = ${JSON.stringify(base)}\nconst VERSION = ${JSON.stringify(version)}\nconst PRECACHE = ${JSON.stringify(precache)}\n`
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: head + source })
    },
  }
}

/** The worker a SERVICE_WORKER=off build ships: it clears Canopy's caches and unregisters itself. */
const SW_OFF = `self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) if (name.startsWith('canopy-')) await caches.delete(name)
    await self.registration.unregister()
  })())
})
`

// https://vite.dev/config/
export default defineConfig({
  // Served from a sub-path on GitHub Pages (BASE_PATH=/canopy/); root everywhere else.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss(), preloadMap(), serviceWorker()],
  // The release version (package.json), shown on the About page, and whether to register sw.js.
  define: { __APP_VERSION__: JSON.stringify(version), __SERVICE_WORKER__: JSON.stringify(serviceWorkerOn) },
})
