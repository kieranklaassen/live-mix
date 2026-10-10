// A sound that keeps time at another tempo: the same notes on the same
// beats, as many beats long, an echo still a division of the beat; a kit's
// notes where they are in every key; and the rows such a sound is written in.

import { describe, expect, it } from 'vitest'

import { patchDeviceParams, type PatchDevice } from '../../../core/devices/patch'
import { DeviceRegistry } from '../../../core/devices/registry'
import { STOCK_WASM_DEVICES } from '../../registry'
import {
  FACTORY_SOUNDS,
  FACTORY_TEMPO_RANGE,
  KIT_INSTRUMENTS,
  VARIATION_LIMITS,
  isKitInstrument,
  patchAtTempo,
  soundAtTempo,
  tempoRatio,
  transposeFactorySound,
  varySound,
} from '..'
import { sound } from '../sounds/recipe'
import { BAR_SEC, KIT, WRITTEN_BPM, bars, row, strokesOf } from '../sounds/rhythm'
import { type FactorySound } from '../types'

const registry = new DeviceRegistry(STOCK_WASM_DEVICES)

function paramsOf(device: PatchDevice): Record<string, number> {
  const descriptor = registry.get(device.deviceId)
  if (!descriptor) throw new Error(`no device ${device.deviceId}`)
  return patchDeviceParams(descriptor, device)
}

/** A pulse of eighths on a mallet through a dotted-eighth echo: nothing a test renders. */
const PULSE: FactorySound = sound({
  id: 'test-pulse',
  number: 9001,
  name: 'Test pulse',
  kind: 'beat',
  description: 'Eighths on a mallet through an echo, for the tests of the tempo.',
  instrument: { deviceId: 'mallets' },
  effects: [
    { deviceId: 'tape-echo', params: { time: 375 } },
    { deviceId: 'tremolo', params: { rate: 4 } },
  ],
  ...bars(2, [row([60, 64, 67], 'x.x. x.x. x.x. x.x.')]),
})

/** The same on a kit. */
const BEAT: FactorySound = sound({
  id: 'test-beat',
  number: 9002,
  name: 'Test beat',
  kind: 'beat',
  description: 'A kick and a hat on a drum kit, for the tests of the tempo.',
  instrument: { deviceId: 'drum-kit', params: { tune: -2 } },
  effects: [],
  ...bars(1, [row(KIT.kick, 'X... x... x... x...'), row(KIT.hat, '..o. ..o. ..o. ..o.')]),
})

describe('the tempo of a sound', () => {
  it('is a ratio of the tempo it is written at, and 1 where there is nothing to keep', () => {
    expect(tempoRatio(120, 120)).toBe(1)
    expect(tempoRatio(120, 80)).toBe(1.5)
    expect(tempoRatio(120, 240)).toBe(0.5)
    expect(tempoRatio(undefined, 80)).toBe(1)
    expect(tempoRatio(120, undefined)).toBe(1)
    expect(tempoRatio(120, Number.NaN)).toBe(1)
    expect(tempoRatio(120, 1)).toBe(120 / FACTORY_TEMPO_RANGE.min)
    expect(tempoRatio(120, 1e6)).toBe(120 / FACTORY_TEMPO_RANGE.max)
  })

  it('leaves a sound with no tempo of its own as it is, the same object, at any tempo', () => {
    for (const each of FACTORY_SOUNDS.filter((s) => s.bpm === undefined).slice(0, 12)) {
      expect(soundAtTempo(each, 77)).toBe(each)
    }
    expect(soundAtTempo(PULSE, undefined)).toBe(PULSE)
    expect(soundAtTempo(PULSE, WRITTEN_BPM)).toBe(PULSE)
  })

  it('puts every note on the beat it was written on, and keeps the sound as many beats long', () => {
    for (const bpm of [40, 60, 80, 98.5, 140, 240]) {
      const at = soundAtTempo(PULSE, bpm)
      const beat = 60 / bpm
      expect(at.bpm).toBe(bpm)
      expect(at.durationSec / beat).toBeCloseTo(8, 9)
      expect((at.skipSec ?? 0) / beat).toBeCloseTo(8, 9)
      expect(at.phrase.notes).toHaveLength(PULSE.phrase.notes.length)
      at.phrase.notes.forEach((note, index) => {
        const written = PULSE.phrase.notes[index]
        expect(note.atSec / beat).toBeCloseTo(written.atSec / 0.5, 9)
        expect(note.durSec / beat).toBeCloseTo(written.durSec / 0.5, 9)
        expect(note.note).toBe(written.note)
        expect(note.gain).toBe(written.gain)
      })
    }
  })

  it('never makes the fold of a loop longer than it is written, and shortens it when faster', () => {
    expect(soundAtTempo(PULSE, 60).loopCrossfadeSec).toBe(PULSE.loopCrossfadeSec)
    expect(soundAtTempo(PULSE, 240).loopCrossfadeSec).toBeCloseTo((PULSE.loopCrossfadeSec ?? 0) / 2)
  })

  it('keeps an echo on its division of the beat and an LFO going round with it', () => {
    const patch = soundAtTempo(PULSE, 90).patch
    if (typeof patch === 'string') throw new Error('a patch written out')
    const [echo, tremolo] = patch.effects
    // A dotted eighth is three quarters of a beat at any tempo.
    expect(paramsOf(echo).time).toBeCloseTo(0.75 * (60000 / 90), 6)
    expect(paramsOf(tremolo).rate).toBeCloseTo(4 * (90 / 120), 9)
  })

  it('takes an echo that would be out of reach the nearest octave of it that is inside', () => {
    const slow = patchAtTempo(
      { effects: [{ deviceId: 'analog-delay', params: { time: 500 } }] },
      tempoRatio(120, 40),
    )
    // A beat at 40 is 1500 ms, past the 1200 the delay goes to: half a beat.
    expect(paramsOf(slow.effects[0]).time).toBeCloseTo(750, 6)
    const fast = patchAtTempo(
      { effects: [{ deviceId: 'echo-memory', params: { time: 125 } }] },
      tempoRatio(120, 480),
    )
    // A sixteenth at 480 is 31 ms, under the 50 the echo starts at: an eighth.
    expect(paramsOf(fast.effects[0]).time).toBeCloseTo(62.5, 6)
  })

  it('leaves the devices that keep no time as they are', () => {
    const patch = { effects: [{ deviceId: 'plate-reverb', params: { mix: 0.3 } }] }
    expect(patchAtTempo(patch, 1.5).effects[0]).toBe(patch.effects[0])
    expect(patchAtTempo(patch, 1)).toBe(patch)
  })
})

describe('a sound on a kit', () => {
  it('is marked as one by the instrument it is played on', () => {
    expect(KIT_INSTRUMENTS).toEqual(['drum-kit', 'glitch-kit'])
    for (const id of KIT_INSTRUMENTS) {
      expect(registry.get(id)?.category, id).toBe('instrument')
      expect(isKitInstrument(id)).toBe(true)
    }
    expect(isKitInstrument('mallets')).toBe(false)
    expect(BEAT.kit).toBe(true)
    expect(PULSE.kit).toBeUndefined()
    for (const each of FACTORY_SOUNDS) {
      const patch = typeof each.patch === 'string' ? undefined : each.patch
      if (!patch?.instrument) continue
      expect(each.kit === true, each.id).toBe(isKitInstrument(patch.instrument.deviceId))
    }
  })

  it('keeps its notes in every key and moves its tuning', () => {
    for (const by of [-5, -2, 3, 6]) {
      const moved = transposeFactorySound(BEAT, by)
      expect(moved.phrase).toBe(BEAT.phrase)
      const patch = moved.patch
      if (typeof patch === 'string' || !patch.instrument) throw new Error('a patch written out')
      expect(paramsOf(patch.instrument).tune).toBe(-2 + by)
    }
    // A pitched sound moves its notes, as it always did.
    expect(transposeFactorySound(PULSE, 3).phrase.notes[0].note).toBe(63)
  })

  it('is never moved to another chord or tuned by the hand in a variant', () => {
    const written = new Set(BEAT.phrase.notes.map((note) => note.note))
    for (let seed = 1; seed <= 60; seed += 1) {
      const variant = varySound(BEAT, { seed, amount: 1 })
      for (const note of variant.phrase.notes)
        expect(written.has(note.note), `seed ${seed}`).toBe(true)
    }
  })
})

describe('a variant of a sound that keeps time', () => {
  it('moves no note further off its beat than a hand that keeps time does', () => {
    const gridSec = BAR_SEC / 16
    let furthest = 0
    for (let seed = 1; seed <= 60; seed += 1) {
      const variant = varySound(PULSE, { seed, touch: 1 })
      for (const note of variant.phrase.notes) {
        const off = Math.abs(note.atSec - Math.round(note.atSec / gridSec) * gridSec)
        furthest = Math.max(furthest, off)
      }
    }
    expect(furthest).toBeGreaterThan(0.005)
    expect(furthest).toBeLessThanOrEqual(VARIATION_LIMITS.beatTimingSec + 1e-9)
  })
})

describe('a row of a pattern', () => {
  it('reads its marks as touches and its length as its turn', () => {
    const strokes = strokesOf(1, [row(60, 'X.x. o.-.', { per: 8 })])
    expect(strokes).toEqual([
      [0, 0.125, 60, 1],
      [0.5, 0.125, 60, 0.8],
      [1, 0.125, 60, 0.55],
      [1.5, 0.125, 60, 0.3],
    ])
  })

  it('is repeated until the loop is full, and takes its notes in turn', () => {
    const strokes = strokesOf(2, [row([60, 64, 67], 'x... x...')])
    expect(strokes.map(([at]) => at)).toEqual([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5])
    expect(strokes.map(([, , note]) => note)).toEqual([60, 64, 67, 60, 64, 67, 60, 64])
  })

  it('goes three or five to the bar against the four of the rest', () => {
    const threes = strokesOf(1, [row(60, 'xxx', { per: 3 })])
    expect(threes.map(([at]) => at)).toEqual([0, BAR_SEC / 3, (2 * BAR_SEC) / 3])
    const fives = strokesOf(1, [row(60, 'xxxxx', { per: 5 })])
    expect(fives.map(([at]) => at)).toEqual([0, 0.4, 0.8, 1.2000000000000002, 1.6])
  })

  it('swings every second step and lays a whole row back', () => {
    const swung = strokesOf(1, [row(60, 'xxxx', { per: 8, swing: 1 / 3, lateSec: 0.01 })])
    expect(swung[0][0]).toBeCloseTo(0.01)
    expect(swung[1][0]).toBeCloseTo(0.25 + 0.25 / 3 + 0.01)
    expect(swung[2][0]).toBeCloseTo(0.51)
  })

  it('refuses a row that does not fill the loop, and a mark it does not know', () => {
    expect(() => strokesOf(1, [row(60, 'x..')])).toThrow(/does not fill/)
    expect(() => row(60, 'x?..')).toThrow(/no mark/)
  })

  it('makes a loop of whole bars at the tempo it is written at, every stroke inside it', () => {
    const loop = bars(2, [row(KIT.kick, 'x... .... x... ....'), row(KIT.hat, '..x. ..x.')])
    expect(loop.bpm).toBe(WRITTEN_BPM)
    expect(loop.durationSec).toBe(4)
    expect(loop.skipSec).toBe(4)
    expect(loop.loopFold).toBe('linear')
    expect(loop.loopCrossfadeSec).toBe(0.03)
    // Three passes of twelve strokes: the one dropped, the sound, and the one folded over its start.
    expect(loop.phrase.notes).toHaveLength(36)
  })
})
