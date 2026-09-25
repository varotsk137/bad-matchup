import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // relative base so the build works on Vercel/Netlify root *and* on a
  // GitHub Pages sub-path (username.github.io/bad-matchup/) without changes
  base: './',
  plugins: [react(), tailwindcss()],
  server: { host: true },
})
