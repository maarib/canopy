import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // MapLibre 6 loads its worker from a sibling file via import.meta.url,
  // which breaks if Vite pre-bundles it into node_modules/.vite/deps.
  optimizeDeps: { exclude: ['maplibre-gl'] },
})
