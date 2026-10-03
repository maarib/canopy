import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

// https://vite.dev/config/
export default defineConfig({
  // Served from a sub-path on GitHub Pages (BASE_PATH=/canopy/); root everywhere else.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  // The release version (package.json), shown on the About page.
  define: { __APP_VERSION__: JSON.stringify(version) },
})
