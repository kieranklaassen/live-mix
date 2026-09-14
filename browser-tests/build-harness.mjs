// Bundles the page-side harness with esbuild. The package itself is left
// external and rewritten to its served location under /dist, so the page
// runs the built library (worklets and WASM resolve relative to /dist exactly
// as they do for a consumer) rather than a second copy of the sources.

import { build } from 'esbuild'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const here = fileURLToPath(new URL('.', import.meta.url))
const outdir = `${here}.build`

const SUBPATHS = {
  '@kieranklaassen/live-mix': '/dist/index.js',
  '@kieranklaassen/live-mix/dsp': '/dist/dsp/index.js',
  '@kieranklaassen/live-mix/testing': '/dist/testing/index.js',
}

/** @type {import('esbuild').Plugin} */
const servedPackage = {
  name: 'served-package',
  setup(builder) {
    builder.onResolve({ filter: /^@kieranklaassen\/live-mix(\/.*)?$/ }, (args) => {
      const path = SUBPATHS[args.path]
      if (!path) throw new Error(`browser-tests: no served location for ${args.path}`)
      return { path, external: true }
    })
  },
}

await mkdir(outdir, { recursive: true })
await build({
  entryPoints: [`${here}harness/main.ts`],
  bundle: true,
  format: 'esm',
  target: 'es2022',
  platform: 'browser',
  sourcemap: true,
  outfile: `${outdir}/harness.js`,
  plugins: [servedPackage],
  logLevel: 'info',
})
