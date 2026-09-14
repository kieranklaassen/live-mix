// Full library build: tsup for the entries, esbuild for the self-contained
// worklet processors, and a copy of the committed .wasm artefacts into dist/.
// Also the `prepare` script, so `github:kieranklaassen/live-mix#<sha>` installs
// build themselves with nothing but Node (no Emscripten: the .wasm is committed).

import { build as tsupBuild } from 'tsup'
import { build as esbuild } from 'esbuild'
import { cp, mkdir, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')

// Worklet processors run in AudioWorkletGlobalScope: one file each, no imports,
// no module syntax, so addModule() can load them from any origin.
const worklets = {
  'wasm-device': 'src/dsp/worklets/wasm-device.processor.ts',
  ducker: 'src/dsp/worklets/ducker.processor.ts',
}

async function main() {
  await tsupBuild({
    entry: {
      index: 'src/index.ts',
      'dsp/index': 'src/dsp/index.ts',
      'react/index': 'src/react/index.ts',
      'testing/index': 'src/testing/index.ts',
    },
    format: ['esm'],
    target: 'es2022',
    platform: 'browser',
    dts: true,
    sourcemap: true,
    splitting: true,
    clean: true,
    treeshake: true,
    external: ['react'],
    outDir: 'dist',
    silent: true,
  })

  await mkdir(join(dist, 'worklets'), { recursive: true })
  for (const [name, entry] of Object.entries(worklets)) {
    await esbuild({
      entryPoints: [join(root, entry)],
      bundle: true,
      format: 'iife',
      target: 'es2022',
      platform: 'browser',
      minify: false,
      sourcemap: false,
      outfile: join(dist, 'worklets', `${name}.js`),
      logLevel: 'error',
    })
  }

  const wasmDir = join(root, 'src/dsp/wasm')
  await mkdir(join(dist, 'wasm'), { recursive: true })
  for (const file of await readdir(wasmDir)) {
    if (file.endsWith('.wasm')) await cp(join(wasmDir, file), join(dist, 'wasm', file))
  }

  console.log('live-mix: built dist/')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
