// Renders in a piece's tuning (`keyTuning`): a phrase's notes sound at the
// tuning's pitches, a steady tone still loops whole around its tuned pitch,
// and what takes whole keys only (a kit, the felt piano, a sound made from
// another one) is rendered as it would be in Equal.

import { describe, expect, it } from 'vitest'

import { type Patch } from '../../../core/devices/patch'
import { type PlanarAudio } from '../../../core/render/encode'
import { compileFromDisk } from '../../__tests__/render-support'
import { type Phrase, type RenderPatchOptions, renderPatch } from '../../patch-render'
import { type KeyTuning } from '../../tuning'
import {
  type FactorySound,
  factorySound,
  generateSound,
  renderFactorySound,
  renderGeneratedSound,
} from '..'
import { wholeCycles } from '../parts'

const node = { compile: compileFromDisk, sliceMs: 0 } as const
const JUST_ON_C: KeyTuning = { tuning: 'just', root: 0 }

const JUST = [1, 16 / 15, 9 / 8, 6 / 5, 5 / 4, 4 / 3, 45 / 32, 3 / 2, 8 / 5, 5 / 3, 9 / 5, 15 / 8]
/** Where a whole key sits in Just on `root`, worked out from the ratios alone. */
function justKey(note: number, root: number): number {
  const whole = Math.round(note)
  const degree = (((whole - root) % 12) + 12) % 12
  return whole - degree + 12 * Math.log2(JUST[degree])
}

const ORGAN: Patch = {
  id: 'plain-organ',
  name: 'Plain organ',
  category: 'pad',
  description: 'Pipes with no celeste or tremulant, for measuring a pitch.',
  instrument: { deviceId: 'organ', params: { celeste: 0, tremulant: 0 } },
  effects: [],
}

const held = (...notes: number[]): Phrase => ({
  notes: notes.map((note) => ({ atSec: 0, durSec: 3, note })),
})

const render = (
  patch: Patch,
  options: Omit<RenderPatchOptions, 'durationSec'>,
): Promise<PlanarAudio> => renderPatch(patch, { durationSec: 2, skipSec: 0.5, ...node, ...options })

/** The frequency between `low` and `high` hertz where the left channel is loudest. */
function loudestBetween(audio: PlanarAudio, low: number, high: number): number {
  const count = audio.channels[0].length
  const samples = audio.channels[0].map(
    (value, i) => value * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (count - 1))),
  )
  let best = low
  let bestPower = -1
  for (let hz = low; hz <= high; hz += 0.05) {
    const step = (2 * Math.PI * hz) / audio.sampleRate
    let re = 0
    let im = 0
    for (let i = 0; i < count; i += 1) {
      re += samples[i] * Math.cos(step * i)
      im += samples[i] * Math.sin(step * i)
    }
    const power = re * re + im * im
    if (power > bestPower) {
      bestPower = power
      best = hz
    }
  }
  return best
}

const centsBetween = (upper: number, lower: number): number => 1200 * Math.log2(upper / lower)
const C4 = 440 * 2 ** (-9 / 12)

function bankSound(id: string): FactorySound {
  const sound = factorySound(id)
  if (!sound) throw new Error(`no factory sound ${id}`)
  return sound
}

function same(a: PlanarAudio, b: PlanarAudio): boolean {
  return a.channels.every((channel, index) => {
    const other = b.channels[index]
    return channel.length === other.length && channel.every((value, i) => value === other[i])
  })
}

describe('renders in a tuning', () => {
  it('plays a pure third over the root in Just', async () => {
    const audio = await render(ORGAN, { phrase: held(60, 64), keyTuning: JUST_ON_C })
    const e = loudestBetween(audio, 323, 333)
    expect(Math.abs(centsBetween(e, C4) - 1200 * Math.log2(5 / 4))).toBeLessThan(2)

    // Equal's third is 14 cents wider, which is what the test is there to catch.
    const equal = await render(ORGAN, { phrase: held(60, 64) })
    expect(
      Math.abs(centsBetween(loudestBetween(equal, 323, 333), C4) - 1200 * Math.log2(5 / 4)),
    ).toBeGreaterThan(10)
  }, 30_000)

  it('renders as before with no tuning or with Equal', async () => {
    const before = await render(ORGAN, { phrase: held(60, 64, 67) })
    const equal = await render(ORGAN, {
      phrase: held(60, 64, 67),
      keyTuning: { tuning: 'equal', root: 0 },
    })
    expect(same(before, equal)).toBe(true)
  })

  it('tunes By ear pure over the chord it is given', async () => {
    const overD: KeyTuning = { tuning: 'by-ear', root: 0, chordRoot: 2 }
    const d = 60 + 12 * Math.log2(9 / 8)
    const tuned = await render(ORGAN, { phrase: held(62, 65, 69), keyTuning: overD })
    const expected = await render(ORGAN, {
      phrase: held(d, d + 12 * Math.log2(6 / 5), d + 12 * Math.log2(3 / 2)),
    })
    expect(same(tuned, expected)).toBe(true)
    // The A is a pure fifth on that D, 27/16 over C and not Just's 5/3.
    const justA = await render(ORGAN, { phrase: held(62, 65, 69), keyTuning: JUST_ON_C })
    expect(same(tuned, justA)).toBe(false)
  })

  it('leaves a kit as it is', async () => {
    const kit = bankSound('drums-far-kit')
    const patch = kit.patch as Patch
    const phrase = kit.phrase
    const plain = await render(patch, { phrase })
    const tuned = await render(patch, { phrase, keyTuning: { tuning: 'slendro', root: 0 } })
    expect(same(plain, tuned)).toBe(true)
    const sound = await renderFactorySound(kit, { ...node, keyTuning: JUST_ON_C })
    expect(same(sound, await renderFactorySound(kit, node))).toBe(true)
  })

  it('leaves the felt piano and a sound made from it on the nearest key', async () => {
    // In Just on A, the piano's C is a minor third over A, 16 cents under Equal's.
    const onA: KeyTuning = { tuning: 'just', root: 9 }
    for (const id of ['felt-piano-c', 'reversed-piano-c']) {
      const sound = bankSound(id)
      const tuned = await renderFactorySound(sound, { ...node, keyTuning: onA })
      expect(same(tuned, await renderFactorySound(sound, node)), id).toBe(true)
    }
  })

  it('tunes a factory sound and loops a steady one whole around its tuned pitch', async () => {
    const drone = bankSound('organ-drone-c')
    const withThird: FactorySound = {
      ...drone,
      phrase: {
        notes: drone.phrase.notes.map((note, index) =>
          index === 1 ? { ...note, note: 52 } : note,
        ),
      },
    }
    const tuned = await renderFactorySound(withThird, { ...node, keyTuning: JUST_ON_C })
    // The sound with its notes written at Just's pitches renders the same: the
    // whole-cycles nudge is laid on the tuned pitch.
    const written: FactorySound = {
      ...withThird,
      phrase: {
        notes: withThird.phrase.notes.map((note) => ({ ...note, note: justKey(note.note, 0) })),
      },
    }
    expect(same(tuned, await renderFactorySound(written, node))).toBe(true)
    expect(same(tuned, await renderFactorySound(withThird, node))).toBe(false)
    for (const note of written.phrase.notes) {
      const nudged = wholeCycles(note.note, drone.durationSec)
      expect(Math.abs(nudged - note.note) * 100).toBeLessThan(2)
    }
  })

  it('tunes a steady generated sound with no second fifth on top, still whole', async () => {
    const key = { root: 0, mode: 'major' } as const
    let found = 0
    for (let seed = 1; seed < 400 && found < 2; seed += 1) {
      for (const kind of ['drone', 'pad'] as const) {
        const sound = generateSound({ seed, kind, key, degree: 0 })
        if (!sound.steady || !sound.pitched) continue
        found += 1
        const tuned = await renderGeneratedSound(sound, { ...node, keyTuning: JUST_ON_C })
        const notes = sound.phrase.notes.map((note) => ({
          ...note,
          note: wholeCycles(justKey(note.note, 0), sound.durationSec),
        }))
        const written = await renderGeneratedSound({ ...sound, phrase: { notes } }, node)
        expect(same(tuned, written), `${kind} ${seed}`).toBe(true)
        break
      }
    }
    expect(found).toBeGreaterThan(0)
  })
})
