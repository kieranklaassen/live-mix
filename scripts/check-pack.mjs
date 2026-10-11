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

  // A peer is imported, never carried: no built script holds a CommonJS
  // module, which is how a peer left out of the build's externals arrives
  // (React's DOM once did, and could not find `react` from inside the bundle).
  const bundled = [...files].filter(
    (file) =>
      file.startsWith('dist/') &&
      file.endsWith('.js') &&
      !file.startsWith('dist/worklets/') &&
      /__commonJS\(|Dynamic require of/.test(readFileSync(file, 'utf8')),
  )
  if (bundled.length > 0) {
    throw new Error(
      `check-pack: ${bundled.join(', ')} bundles a CommonJS module: make what it imports a peer in package.json and an external in scripts/build.mjs`,
    )
  }

  // `./motion` stands alone: its built entry is one file that imports
  // nothing, so a consumer who wants motion loads none of the engine.
  const motionImports = [
    ...readFileSync('dist/motion/index.js', 'utf8').matchAll(/(?:from|import)\s*["']([^"']+)["']/g),
  ].map((match) => match[1])
  if (motionImports.length > 0) {
    throw new Error(`check-pack: dist/motion/index.js imports ${motionImports.join(', ')}`)
  }

  // A built script finds its files (a device's .wasm, a worklet) beside
  // itself: `new URL('../wasm/x.wasm', import.meta.url)`. Code splitting may
  // move that line into a shared chunk at another depth, where the same path
  // points at nothing, and a consumer's bundler then leaves the file out
  // without a word. Every such path has to land on a file of the tarball.
  const scripts = [...files].filter((file) => file.startsWith('dist/') && file.endsWith('.js'))
  let located = 0
  const lost = []
  for (const script of scripts) {
    const source = readFileSync(script, 'utf8')
    for (const [, path] of source.matchAll(
      /new URL\(\s*["'](\.{1,2}\/[^"']+)["']\s*,\s*import\.meta\.url\s*\)/g,
    )) {
      located += 1
      if (!files.has(join(dirname(script), path))) lost.push(`${script}: ${path}`)
    }
  }
  if (lost.length > 0) {
    console.error('check-pack: built scripts point at files that are not where they look:')
    for (const line of lost.slice(0, 12)) console.error(`  ${line}`)
    if (lost.length > 12) console.error(`  and ${lost.length - 12} more`)
    console.error(
      'A shared chunk took device or worklet code out of its entry. Whatever a lazily loaded script imports ' +
        'must import nothing that reaches a descriptor: see "The layout of the build" in docs/factory.md.',
    )
    process.exit(1)
  }

  console.log(
    `check-pack: ${files.size} files, ${targets.length} export targets resolve, ` +
      `${located} files found from where the scripts look for them, ` +
      `${wasm.length} wasm, ${worklets.length} worklet(s), ` +
      `optional peers (${optionalPeers.join(', ')}) confined to their entries and none bundled, ` +
      `./motion imports nothing`,
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
