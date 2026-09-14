// The playground imports the package by its public subpaths, aliased onto the
// source tree so edits under src/ hot-reload. React is deduplicated onto the
// repository's single copy (the kit's hooks and the page must share one).
//
// The worklet processors are the one thing the source tree cannot serve: they
// are bundled into dist/worklets by `pnpm build` (one self-contained file each,
// what `addModule` needs). `distWorklets` exposes that folder at /worklets/ in
// dev and copies it into the build, and playground/src/demo.ts hands every WASM
// factory the explicit `processorUrl` — the consumer escape hatch from KTD3.

import react from '@vitejs/plugin-react'
import { readFile, readdir } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

const here = fileURLToPath(new URL('.', import.meta.url))
const root = fileURLToPath(new URL('..', import.meta.url))
const src = fileURLToPath(new URL('../src/', import.meta.url))
const workletsDir = join(root, 'dist', 'worklets')

function distWorklets(): Plugin {
  return {
    name: 'live-mix-dist-worklets',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const url = request.url ?? ''
        if (!url.startsWith('/worklets/')) {
          next()
          return
        }
        const file = join(workletsDir, basename(url.split('?')[0]))
        readFile(file).then(
          (body) => {
            response.setHeader('Content-Type', 'text/javascript')
            response.end(body)
          },
          () => next(),
        )
      })
    },
    async generateBundle() {
      let files: string[]
      try {
        files = await readdir(workletsDir)
      } catch {
        this.warn('dist/worklets is missing; run `pnpm build` first so WASM devices can load')
        return
      }
      for (const file of files) {
        if (!file.endsWith('.js')) continue
        this.emitFile({
          type: 'asset',
          fileName: `worklets/${file}`,
          source: await readFile(join(workletsDir, file)),
        })
      }
    },
  }
}

export default defineConfig({
  root: here,
  // Relative asset URLs, so the build serves from any path (the browser tests
  // mount it under /playground/dist/).
  base: './',
  plugins: [react(), distWorklets()],
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
    fs: { allow: [root] },
  },
  build: { outDir: 'dist', emptyOutDir: true },
})
