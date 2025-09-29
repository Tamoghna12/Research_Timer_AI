import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Research_Timer_AI/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
