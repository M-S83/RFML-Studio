import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative base so the build works at any hosting path (GitHub Pages
  // serves under /RFML-Studio/); routing is hash-based so no server config
  // is needed.
  base: './',
  server: { host: true, port: 5174 },
})
