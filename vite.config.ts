import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Served from a sub-path on GitHub Pages (BASE_PATH=/canopy/); root everywhere else.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
})
