// Packs the library and verifies that every `exports` entry resolves to a file
// that is actually inside the tarball. Catches `files`/`exports` mistakes that
// `npm link` hides.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const dir = mkdtempSync(join(tmpdir(), 'live-mix-pack-'))

try {
  const output = execFileSync('pnpm', ['pack', '--pack-destination', dir], { encoding: 'utf8' })
  const tarball = output.trim().split('\n').pop()
  const listing = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' })
  const files = new Set(
    listing
      .trim()
      .split('\n')
      .map((line) => line.replace(/^package\//, '')),
  )

  const targets = []
  const collect = (value) => {
    if (typeof value === 'string') targets.push(value)
    else if (value && typeof value === 'object') Object.values(value).forEach(collect)
  }
  for (const [subpath, target] of Object.entries(pkg.exports)) {
    if (subpath.includes('*')) continue
    collect(target)
  }

  const missing = targets.map((t) => t.replace(/^\.\//, '')).filter((t) => !files.has(t))
  if (missing.length > 0) {
    console.error('check-pack: exports point at files missing from the tarball:')
    for (const file of missing) console.error(`  ${file}`)
    process.exit(1)
  }

  const wasm = [...files].filter((f) => f.endsWith('.wasm'))
  const worklets = [...files].filter((f) => f.startsWith('dist/worklets/'))
  if (wasm.length === 0) throw new Error('check-pack: no .wasm artefacts in the tarball')
  if (worklets.length === 0) throw new Error('check-pack: no worklet bundles in the tarball')

  console.log(
    `check-pack: ${files.size} files, ${targets.length} export targets resolve, ` +
      `${wasm.length} wasm, ${worklets.length} worklet(s)`,
  )
} finally {
  rmSync(dir, { recursive: true, force: true })
}
