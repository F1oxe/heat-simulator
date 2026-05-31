import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The simulation runs entirely in the browser, so no backend proxy is needed.
// 'base' is relative so the built site works on any static host (Netlify, Vercel, etc.).
export default defineConfig({
  plugins: [react()],
  base: './'
})
