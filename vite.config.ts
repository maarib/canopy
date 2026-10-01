import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Served from a sub-path on GitHub Pages (BASE_PATH=/canopy/); root everywhere else.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  // MapLibre's worker is an ES module (see FoliageMap.tsx).
  worker: { format: 'es' },
  // MapLibre 6 loads its worker from a sibling file via import.meta.url,
  // which breaks if Vite pre-bundles it into node_modules/.vite/deps.
  optimizeDeps: { exclude: ['maplibre-gl'] },
})
