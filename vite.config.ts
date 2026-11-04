import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
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

// https://vite.dev/config/
export default defineConfig({
  // Served from a sub-path on GitHub Pages (BASE_PATH=/canopy/); root everywhere else.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss(), preloadMap()],
  // The release version (package.json), shown on the About page.
  define: { __APP_VERSION__: JSON.stringify(version) },
})
