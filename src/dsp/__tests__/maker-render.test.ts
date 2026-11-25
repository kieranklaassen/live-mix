// A patch with a note maker on the committed device modules: what it renders
// is what the maker's notes render, in any key and at any tempo, and a part
// with an instrument of its own is heard on it.

import { describe, expect, it } from 'vitest'

import { isPatch, validatePatch, type Patch, type PatchMaker } from '../../core/devices/patch'
import { DeviceRegistry } from '../../core/devices/registry'
import { patchAtTempo, transposePatch, transposePhrase } from '../factory'
import { type RenderPatchOptions, madePhrase, peakOf, renderPatch } from '../patch-render'
import { STOCK_WASM_DEVICES } from '../registry'
import { compileFromDisk } from './render-support'

const REPLACE: PatchMaker = { makerId: 'mirror-on-d', params: { mode: 0, level: 1 } }
const BOTH: PatchMaker = { makerId: 'mirror-on-d', params: { mode: 1 } }
const PHRASE = {
  notes: [
    { atSec: 0, durSec: 0.5, note: 60 },
    { atSec: 0.5, durSec: 0.5, note: 64 },
  ],
}

function patch(maker?: PatchMaker, deviceId = 'modal-bells'): Patch {
  return {
    id: 'p',
    name: 'P',
    category: 'bell',
    description: 'A struck bell.',
    instrument: { deviceId },
    ...(maker ? { maker } : {}),
    effects: [],
  }
}

const render = (of: Patch, options: Partial<RenderPatchOptions> = {}) =>
  renderPatch(of, {
    compile: compileFromDisk,
    sliceMs: 0,
    durationSec: 1.5,
    phrase: PHRASE,
    ...options,
  })

/** Where two renders part, or -1: a `toEqual` on this many samples takes minutes to say so. */
function parts(a: readonly Float32Array[], b: readonly Float32Array[]): number {
  for (let i = 0; i < a[0].length; i += 1) {
    if (a[0][i] !== b[0][i] || a[1][i] !== b[1][i]) return i
  }
  return -1
}

const registry = new DeviceRegistry(STOCK_WASM_DEVICES)

describe('a patch with a note maker', () => {
  it('renders what the maker writes', async () => {
    const plain = await render(patch(), {
      phrase: { notes: PHRASE.notes.map((note) => ({ ...note, note: 124 - note.note })) },
    })
    expect(parts((await render(patch(REPLACE))).channels, plain.channels)).toBe(-1)
  })

  it('renders the notes as they come when it is switched off, and on a kit', async () => {
    const plain = await render(patch())
    expect(
      parts((await render(patch({ ...REPLACE, bypass: true }))).channels, plain.channels),
    ).toBe(-1)
    const kit = await render(patch(undefined, 'drum-kit'))
    expect(parts((await render(patch(REPLACE, 'drum-kit'))).channels, kit.channels)).toBe(-1)
  })

  it('plays a part on an instrument of its own, through the same effects', async () => {
    const both = await render(patch({ ...BOTH, parts: { mirror: { deviceId: 'flute' } } }))
    const own = await render(patch())
    const flute = await render(patch(undefined, 'flute'), {
      phrase: {
        notes: PHRASE.notes.map((note) => ({ ...note, note: 124 - note.note, gain: 0.8 * 0.7 })),
      },
    })
    for (const side of [0, 1]) {
      for (let i = 0; i < own.channels[side].length; i += 997) {
        expect(both.channels[side][i]).toBeCloseTo(
          own.channels[side][i] + flute.channels[side][i],
          5,
        )
      }
    }
    expect(peakOf(flute.channels)).toBeGreaterThan(0.01)
  })

  it('refuses a part that plays a loaded sound', async () => {
    await expect(
      render(patch({ ...BOTH, parts: { mirror: { deviceId: 'sampler' } } })),
    ).rejects.toThrow('loaded sound')
  })

  it('moves with the key and the tempo', () => {
    const moved = transposePatch(patch(REPLACE), 5)
    const up = madePhrase(moved, transposePhrase(PHRASE, 5), 2).notes.map((note) => note.note)
    expect(up).toEqual([69, 65])
    const slow = patchAtTempo(patch({ makerId: 'mirror-on-d', params: { delay: 0.5 } }), 1.5)
    expect(slow.maker?.params?.delay).toBe(0.75)
  })

  it('is checked', () => {
    expect(validatePatch(patch(BOTH), registry)).toEqual([])
    const wrong = (maker: PatchMaker) =>
      validatePatch(patch(maker), registry).map((issue) => issue.path)
    expect(wrong({ makerId: 'nothing' })).toEqual(['maker.makerId'])
    expect(wrong({ makerId: 'mirror-on-d', preset: 'No' })).toEqual(['maker.preset'])
    expect(wrong({ makerId: 'mirror-on-d', params: { mode: 9, x: 1 } })).toEqual([
      'maker.params.mode',
      'maker.params.x',
    ])
    expect(wrong({ makerId: 'mirror-on-d', parts: { no: { deviceId: 'flute' } } })).toEqual([
      'maker.parts.no',
    ])
    expect(wrong({ makerId: 'mirror-on-d', parts: { mirror: { deviceId: 'tape' } } })).toEqual([
      'maker.parts.mirror.deviceId',
    ])
    expect(isPatch(patch(BOTH))).toBe(true)
    expect(isPatch({ ...patch(), maker: { makerId: 3 } })).toBe(false)
  })
})
