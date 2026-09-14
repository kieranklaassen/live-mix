// Packs the library and verifies that every `exports` entry resolves to a file
// that is actually inside the tarball. Catches `files`/`exports` mistakes that
// `npm link` hides.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

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

  // Optional peers stay behind their own entries: nothing `.`, `./dsp` or
  // `./testing` reaches (entry or shared chunk) may import them.
  const optionalPeers = Object.keys(pkg.peerDependenciesMeta ?? {}).filter(
    (name) => pkg.peerDependenciesMeta[name]?.optional,
  )
  for (const entry of ['dist/index.js', 'dist/dsp/index.js', 'dist/testing/index.js']) {
    const leaked = importsOf(entry).filter((spec) =>
      optionalPeers.some((peer) => spec === peer || spec.startsWith(`${peer}/`)),
    )
    if (leaked.length > 0) {
      throw new Error(`check-pack: ${entry} reaches optional peer(s): ${leaked.join(', ')}`)
    }
  }

  console.log(
    `check-pack: ${files.size} files, ${targets.length} export targets resolve, ` +
      `${wasm.length} wasm, ${worklets.length} worklet(s), ` +
      `optional peers (${optionalPeers.join(', ')}) confined to their entries`,
  )
} finally {
  rmSync(dir, { recursive: true, force: true })
}

/** Every bare import specifier reachable from `file` through relative imports in dist/. */
function importsOf(file, seen = new Set()) {
  if (seen.has(file)) return []
  seen.add(file)
  const source = readFileSync(file, 'utf8')
  const specifiers = [...source.matchAll(/(?:from|import)\s*["']([^"']+)["']/g)].map((m) => m[1])
  const bare = specifiers.filter((spec) => !spec.startsWith('.'))
  for (const spec of specifiers.filter((s) => s.startsWith('.'))) {
    bare.push(...importsOf(join(dirname(file), spec), seen))
  }
  return bare
}
