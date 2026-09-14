// The playground imports the package by its public subpaths, aliased onto the
// source tree so edits under src/ hot-reload. React is deduplicated onto the
// repository's single copy (the kit's hooks and the page must share one).

import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const here = fileURLToPath(new URL('.', import.meta.url))
const src = fileURLToPath(new URL('../src/', import.meta.url))

export default defineConfig({
  root: here,
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@kieranklaassen/live-mix/react/styles.css', replacement: `${src}react/styles.css` },
      { find: '@kieranklaassen/live-mix/react', replacement: `${src}react/index.ts` },
      { find: '@kieranklaassen/live-mix/testing', replacement: `${src}testing/index.ts` },
      { find: '@kieranklaassen/live-mix/dsp', replacement: `${src}dsp/index.ts` },
      { find: '@kieranklaassen/live-mix', replacement: `${src}index.ts` },
    ],
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5199,
    strictPort: true,
    fs: { allow: [fileURLToPath(new URL('..', import.meta.url))] },
  },
  build: { outDir: 'dist', emptyOutDir: true },
})
