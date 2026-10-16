// site/labs/lab.h itself, tried on a lab made for the purpose (fixtures/labs/over.cpp): one that
// declares more than a lab may, and that draws the picture of a sound which is not a loop. The
// lab is compiled here, with the flags scripts/build-labs.sh gives every lab, so these tests need
// Emscripten on the path, as `pnpm labs` does. Without it they are skipped, and say so.
import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { loadLab, type Lab } from '../../src/lab/runner.ts'
import { declaredIn, expectRoom, silence } from '../labs/support.ts'

const REPO = fileURLToPath(new URL('../../..', import.meta.url))
const FIXTURE = 'site/tests/unit/fixtures/labs/over.cpp'
const emcc = spawnSync('emcc', ['--version']).status === 0

/** A lab's file as a module, built as scripts/build-labs.sh builds one, into a folder of its own. */
function build(file: string, out: string) {
  const script = fs.readFileSync(path.join(REPO, 'site/scripts/build-labs.sh'), 'utf8')
  const exported = /^exports=\(\n([\s\S]*?)\n\)$/m.exec(script)![1]!.split(/\s+/).filter(Boolean)
  const megabyte = 1024 * 1024
  execFileSync(
    'emcc',
    [
      file,
      ...['-I', 'cpp/common'],
      ...['-std=c++17', '-O3', '-fno-exceptions', '-fno-rtti', '-fno-access-control', '--no-entry'],
      '-DLAB_ARENA_MB=40',
      ...['-s', `EXPORTED_FUNCTIONS=${exported.map((name) => `_${name}`).join(',')}`],
      ...['-s', `INITIAL_MEMORY=${64 * megabyte}`, '-s', 'ALLOW_MEMORY_GROWTH=0'],
      ...['-s', 'STACK_SIZE=262144'],
      ...['-o', out],
    ],
    { cwd: REPO, stdio: 'pipe' },
  )
  return fs.readFileSync(out)
}

describe.skipIf(!emcc)('lab.h, on a lab built for the purpose (needs emcc on the path)', () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'site-lab-header-'))
  let bytes: ReturnType<typeof build>
  let over: Lab

  beforeAll(async () => {
    bytes = build(FIXTURE, path.join(folder, 'over.wasm'))
    over = await loadLab(bytes)
  }, 180_000)
  afterAll(() => fs.rmSync(folder, { recursive: true, force: true }))

  it('counts every control, tap and check a lab declares, those past the limit too', async () => {
    // The fixture writes 33 controls and 65 taps, and no check; the limits are lab.h's.
    expect(await declaredIn(bytes)).toEqual([
      { what: 'controls', declared: 33, limit: 32 },
      { what: 'taps', declared: 65, limit: 64 },
      { what: 'checks', declared: 0, limit: 32 },
    ])
    // What is past the limit is in no list the page or a test reads.
    expect(over.description.controls).toHaveLength(32)
    expect(over.description.taps).toHaveLength(64)
  })

  it('fails a lab that declares a 33rd control or a 65th tap as it is loaded, with both numbers', async () => {
    await expect(expectRoom('over', bytes)).rejects.toThrow(
      'site/labs/over.cpp declares 33 controls, and a lab may declare 32 (kMaxControls in site/labs/lab.h)',
    )
    await expect(expectRoom('over', bytes)).rejects.toThrow(
      'site/labs/over.cpp declares 65 taps, and a lab may declare 64 (kMaxTaps in site/labs/lab.h)',
    )
  })

  it('draws a sound that is not a loop to its end: the last frame of its picture ends inside the sound', () => {
    const picture = over.render(silence(1600), {}).taps.picture!
    expect(picture.columns).toBe(50)
    const rows = picture.length / picture.columns
    // 513 rows, 46.875 Hz apart: the tone is the 32nd, to the hertz.
    expect(rows).toBe(513)
    const data = picture.channels_data[0]!
    const tone = Array.from({ length: picture.columns }, (_, c) => data[c * rows + 32]!)
    const far = Array.from({ length: picture.columns }, (_, c) => data[c * rows + 200]!)
    // A full-scale sine reads 0 dB in its own row of every column, the last among them: no
    // frame is filled out with silence, which would read lower and lower towards the end.
    for (const [column, level] of tone.entries()) {
      expect(level, `the tone, in column ${column}`).toBeCloseTo(0, 2)
    }
    // And nothing 7,875 Hz away from it: a frame cut off part of the way through its window
    // would spread the tone up every row of its column, a stripe at the picture's right edge.
    for (const [column, level] of far.entries()) {
      expect(level, `far from the tone, in column ${column}`).toBeLessThan(-100)
    }
  })
})

describe('the room a lab has', () => {
  const header = fs.readFileSync(path.join(REPO, 'site/labs/lab.h'), 'utf8')
  const limit = (name: string) => new RegExp(`constexpr int ${name} = (\\d+);`).exec(header)![1]

  it('is what the template states', () => {
    expect(fs.readFileSync(path.join(REPO, 'site/LESSONS.md'), 'utf8')).toContain(
      `a lab may declare ${limit('kMaxControls')} controls, ${limit('kMaxTaps')} taps and ${limit('kMaxChecks')} checks`,
    )
  })
})
