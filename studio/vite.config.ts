import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  publicDir: false,
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: '../public/studio',
    emptyOutDir: false,
    lib: { entry: 'src/index.tsx', formats: ['es'], fileName: () => 'studio.js', cssFileName: 'studio' },
    chunkSizeWarningLimit: 2000,
  },
})
