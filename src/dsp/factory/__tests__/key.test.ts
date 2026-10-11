// The bank in another key: how far it moves, what its sounds are then called,
// and that every note it plays there is a note of that key.

import { describe, expect, it } from 'vitest'

import { DeviceRegistry } from '../../../core/devices/registry'
import { patchDeviceParams, validatePatch, type PatchDevice } from '../../../core/devices/patch'
import { STOCK_WASM_DEVICES } from '../../registry'
import {
  CHORD_COLOURS,
  FACTORY_CHAINS,
  FACTORY_MODES,
  FACTORY_SOUNDS,
  chordName,
  chordTakes,
  chordTones,
  factoryTranspose,
  keyChord,
  relativeMajorRoot,
  transposeFactorySound,
  transposePatch,
  transposeWords,
  type FactoryKey,
  type FactoryMode,
  type FactorySound,
} from '..'

const registry = new DeviceRegistry(STOCK_WASM_DEVICES)
const MODES = Object.keys(FACTORY_MODES) as FactoryMode[]
const WHITE_KEYS = new Set(FACTORY_MODES.major)
const mod12 = (value: number): number => ((Math.round(value) % 12) + 12) % 12
/** The effects set to a root and an octave, which are one note between them. */
const TUNED_BY_OCTAVE = new Set(['overtone-singer', 'ring'])

function scaleOf(key: FactoryKey): Set<number> {
  return new Set(FACTORY_MODES[key.mode].map((step) => mod12(key.root + step)))
}

describe('factory key', () => {
  it('leaves the bank where it is in every white-key mode', () => {
    expect(factoryTranspose({ root: 0, mode: 'major' })).toBe(0)
    expect(factoryTranspose({ root: 9, mode: 'minor' })).toBe(0)
    expect(factoryTranspose({ root: 2, mode: 'dorian' })).toBe(0)
    expect(factoryTranspose({ root: 4, mode: 'phrygian' })).toBe(0)
    expect(factoryTranspose({ root: 5, mode: 'lydian' })).toBe(0)
    expect(factoryTranspose({ root: 7, mode: 'mixolydian' })).toBe(0)
  })

  it('moves it the shortest way, five down to six up', () => {
    expect(factoryTranspose({ root: 7, mode: 'major' })).toBe(-5)
    expect(factoryTranspose({ root: 5, mode: 'major' })).toBe(5)
    expect(factoryTranspose({ root: 6, mode: 'major' })).toBe(6)
    expect(factoryTranspose({ root: 4, mode: 'minor' })).toBe(-5)
    expect(factoryTranspose({ root: 0, mode: 'minor' })).toBe(3)
    for (const mode of MODES) {
      for (let root = 0; root < 12; root += 1) {
        const key = { root, mode }
        const by = factoryTranspose(key)
        expect(by).toBeGreaterThanOrEqual(-5)
        expect(by).toBeLessThanOrEqual(6)
        // The white keys, moved, are the notes of the key.
        expect(new Set([...WHITE_KEYS].map((note) => mod12(note + by)))).toEqual(scaleOf(key))
        expect(mod12(by)).toBe(relativeMajorRoot(key))
      }
    }
  })

  it('writes names out in the key', () => {
    expect(transposeWords('Low drone {D}', 0)).toBe('Low drone D')
    expect(transposeWords('Low drone {D}', 3)).toBe('Low drone F')
    expect(transposeWords('Soft pad {F}maj7', -1)).toBe('Soft pad Emaj7')
    expect(transposeWords('on {C}, {G} and {D}', 1)).toBe('on C♯, A♭ and E♭')
    expect(transposeWords('{B}', 1)).toBe('C')
    expect(transposeWords('A hall, no note', 5)).toBe('A hall, no note')
  })

  it('names the chords of a key', () => {
    const c: FactoryKey = { root: 0, mode: 'major' }
    expect(chordName(keyChord(c, 0))).toBe('C')
    expect(chordName(keyChord(c, 1), 'ninth')).toBe('Dm9')
    expect(chordName(keyChord(c, 3), 'seventh')).toBe('Fmaj7')
    expect(chordName(keyChord(c, 4), 'sus4')).toBe('Gsus4')
    expect(chordName(keyChord(c, 5), 'seventh')).toBe('Am7')
    expect(chordName(keyChord(c, 6))).toBe('B°')
    expect(chordName(keyChord(c, 6), 'seventh')).toBe('Bm7♭5')
    expect(chordName(keyChord(c, 7))).toBe('C')
    expect(chordName(keyChord({ root: 10, mode: 'minor' }, 0), 'seventh')).toBe('B♭m7')
  })

  it('holds a tritone only when asked to', () => {
    const dominant = keyChord({ root: 0, mode: 'major' }, 4)
    expect(chordTakes(dominant, 'seventh')).toBe(false)
    expect(chordTakes(dominant, 'ninth')).toBe(false)
    expect(chordTakes(dominant, 'triad')).toBe(true)
    expect(chordTakes(keyChord({ root: 0, mode: 'major' }, 6), 'fifths')).toBe(false)
  })

  it('keeps every colour a chord takes inside the key', () => {
    for (const mode of MODES) {
      for (let root = 0; root < 12; root += 5) {
        const key = { root, mode }
        const scale = scaleOf(key)
        for (let degree = 0; degree < 7; degree += 1) {
          const chord = keyChord(key, degree)
          for (const colour of CHORD_COLOURS.filter((c) => chordTakes(chord, c))) {
            for (const tone of chordTones(chord, colour)) {
              expect(scale.has(mod12(chord.root + tone)), `${mode} ${degree} ${colour}`).toBe(true)
            }
          }
        }
      }
    }
  })

  it('moves the devices that are set to a pitch, and keeps them in range', () => {
    const patch = {
      instrument: { deviceId: 'thesis', params: { center: 70 } },
      effects: [{ deviceId: 'sympathetic', preset: 'Sitar drone', params: { root: 10 } }],
    }
    const moved = transposePatch(patch, 4)
    expect(moved.instrument.params).toMatchObject({ root: 4, center: 62 })
    expect(moved.effects[0].params).toMatchObject({ root: 2 })
    expect(moved.effects[0].preset).toBe('Sitar drone')
    expect(transposePatch(patch, 0)).toBe(patch)
    // A preset's own pitch moves too, though the patch never named it.
    const sitar: PatchDevice = { deviceId: 'sympathetic', preset: 'Sitar drone' }
    const preset = transposePatch({ effects: [sitar] }, 3)
    expect(preset.effects[0].params).toMatchObject({ root: 5 })
  })

  it('moves a root with its octave, so the note goes the way the key went', () => {
    const one = (device: PatchDevice, by: number): Record<string, number> | undefined =>
      transposePatch({ effects: [device] }, by).effects[0].params
    // The ring's carrier stands on C4 as it comes: five down is G3, not G4, and six up is F sharp 4.
    expect(one({ deviceId: 'ring' }, -5)).toEqual({ root: 7, octave: 3 })
    expect(one({ deviceId: 'ring' }, 6)).toEqual({ root: 6, octave: 4 })
    expect(one({ deviceId: 'ring' }, 2)).toEqual({ root: 2, octave: 4 })
    // A preset's own octave goes too: the gong on C3 is on B flat 2 two down.
    expect(one({ deviceId: 'ring', preset: 'Gong' }, -2)).toMatchObject({ root: 10, octave: 2 })
    // The singer's root is A2: three up is C3, five down E2.
    const singer: PatchDevice = { deviceId: 'overtone-singer', preset: 'Overtone melody' }
    expect(one(singer, 3)).toEqual({ root: 0, octave: 3 })
    expect(one(singer, -5)).toEqual({ root: 4, octave: 2 })
    // What the patch sets is kept, and only the pitch moves.
    expect(one({ deviceId: 'ring', preset: 'Frost', params: { octave: 6, mix: 0.3 } }, -1)).toEqual(
      { root: 11, octave: 5, mix: 0.3 },
    )
    // Past the octaves the control has, the nearest: still the key's note.
    expect(one({ deviceId: 'ring', params: { root: 0, octave: 0 } }, -1)).toEqual({
      root: 11,
      octave: 0,
    })
    expect(one({ deviceId: 'overtone-singer', params: { root: 9, octave: 4 } }, 3)).toEqual({
      root: 0,
      octave: 4,
    })
  })

  it('moves a scale by its root and a pivot in hertz by the ratio of the move', () => {
    const one = (device: PatchDevice, by: number): Record<string, number> | undefined =>
      transposePatch({ effects: [device] }, by).effects[0].params
    // The filter's scale is counted from its root: C major three up is E flat major.
    expect(one({ deviceId: 'scale-filter' }, 3)).toEqual({ root: 3 })
    // A preset's own root goes too, round the twelve: the A minor triad is on C three up, on E five down.
    expect(one({ deviceId: 'scale-filter', preset: 'Minor triad' }, 3)).toEqual({ root: 0 })
    expect(
      one({ deviceId: 'scale-filter', preset: 'Minor triad', params: { ring: 3 } }, -5),
    ).toEqual({ root: 4, ring: 3 })
    // The warp's pivot is the A below middle C as it comes, 220 Hz: three up is C, five down E.
    const gong: PatchDevice = { deviceId: 'warp', preset: 'Sunken gong', params: { width: 0 } }
    expect(one(gong, 3)).toEqual({ pivot: 261.63, width: 0 })
    expect(one(gong, -5)).toEqual({ pivot: 164.81, width: 0 })
    expect(one({ deviceId: 'warp', preset: 'Wide drone' }, 6)).toEqual({ pivot: 155.56 })
    // Past the range of the knob, the octave that fits: still the key's note.
    expect(one({ deviceId: 'warp', params: { pivot: 1900 } }, 2)?.pivot).toBeCloseTo(1066.34, 2)
    expect(one({ deviceId: 'warp', params: { pivot: 21 } }, -3)?.pivot).toBeCloseTo(35.32, 2)
  })
})

describe.each([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6])('the chains moved by %i', (by) => {
  it('are the same chains with every scale filter and every pivot that far from where it stood', () => {
    /** The effects set to one pitch in one parameter, and what the move makes of it. */
    const tunedByOne: Record<string, [string, (before: number, after: number) => void]> = {
      'scale-filter': ['root', (before, after) => expect(after).toBe(mod12(before + by))],
      warp: [
        'pivot',
        (before, after) => {
          // The ratio of the move, an octave either way where the knob ends: within a cent.
          const cents = 1200 * Math.log2(after / before) - 100 * by
          expect(Math.abs(cents - 1200 * Math.round(cents / 1200))).toBeLessThan(1)
        },
      ],
    }
    for (const id of Object.keys(tunedByOne)) {
      const tuned = FACTORY_CHAINS.filter((chain) => chain.effects.some((e) => e.deviceId === id))
      expect(tuned.length, id).toBeGreaterThan(0)
      for (const chain of tuned) {
        const moved = transposePatch(chain, by)
        expect(validatePatch(moved, registry), chain.id).toEqual([])
        chain.effects.forEach((effect, at) => {
          const descriptor = registry.get(effect.deviceId)
          const rule = tunedByOne[effect.deviceId]
          if (!descriptor || !rule) return
          const before = patchDeviceParams(descriptor, effect)
          const after = patchDeviceParams(descriptor, moved.effects[at])
          rule[1](before[rule[0]], after[rule[0]])
          // Nothing else of it moved.
          for (const [name, value] of Object.entries(before)) {
            if (name !== rule[0]) expect(after[name], `${chain.id}: ${name}`).toBe(value)
          }
        })
      }
    }
  })

  it('are the same chains with every tuned effect that far from where it stood', () => {
    const tuned = FACTORY_CHAINS.filter((chain) =>
      chain.effects.some((effect) => TUNED_BY_OCTAVE.has(effect.deviceId)),
    )
    expect(tuned.length).toBeGreaterThan(0)
    for (const chain of tuned) {
      const moved = transposePatch(chain, by)
      expect(validatePatch(moved, registry), chain.id).toEqual([])
      chain.effects.forEach((effect, at) => {
        const descriptor = registry.get(effect.deviceId)
        if (!descriptor || !TUNED_BY_OCTAVE.has(effect.deviceId)) {
          expect(moved.effects[at], chain.id).toBe(effect)
          return
        }
        const before = patchDeviceParams(descriptor, effect)
        const after = patchDeviceParams(descriptor, moved.effects[at])
        const note = (params: Record<string, number>): number => params.root + 12 * params.octave
        expect(note(after) - note(before), `${chain.id}: ${effect.deviceId}`).toBe(by)
        // Nothing else of it moved.
        for (const [name, value] of Object.entries(before)) {
          if (name !== 'root' && name !== 'octave') expect(after[name], name).toBe(value)
        }
      })
    }
  })
})

describe.each([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6])('the bank moved by %i', (by) => {
  it('is the same sounds, named and played in that key', () => {
    const scale = new Set([...WHITE_KEYS].map((note) => mod12(note + by)))
    const names = new Set<string>()
    for (const sound of FACTORY_SOUNDS) {
      const moved = transposeFactorySound(sound, by)
      if (by === 0) expect(moved).toBe(sound)
      expect(moved.id).toBe(sound.id)
      expect(moved.number).toBe(sound.number)
      expect(moved.name, sound.id).not.toMatch(/[{}]/)
      expect(moved.description, sound.id).not.toMatch(/[{}]/)
      expect(moved.name.length, `${sound.id}: ${moved.name}`).toBeLessThanOrEqual(24)
      expect(moved.description, sound.id).toMatch(/^[A-Z].{24,}\.$/)
      names.add(moved.name)
      if (typeof moved.patch !== 'string') {
        expect(validatePatch(moved.patch, registry), sound.id).toEqual([])
        for (const device of [moved.patch.instrument, ...moved.patch.effects]) {
          if (device?.deviceId !== 'sympathetic') continue
          // Its strings are a major scale: the one that holds the key.
          const descriptor = registry.get('sympathetic')
          expect(descriptor && patchDeviceParams(descriptor, device).root, sound.id).toBe(mod12(by))
        }
      }
      // A sound made from another plays that one: its own notes pick grains, not pitches.
      if (sound.source !== undefined) {
        expect(moved.phrase).toBe(sound.phrase)
        continue
      }
      // A sound on a kit plays drums, not pitches: its notes stay, and the kit is tuned to the key.
      if (sound.kit) {
        expect(moved.phrase, sound.id).toBe(sound.phrase)
        const tuneOf = (each: FactorySound): number => {
          const kit = typeof each.patch === 'string' ? undefined : each.patch.instrument
          const descriptor = kit && registry.get(kit.deviceId)
          if (!kit || !descriptor) throw new Error(`${each.id}: no kit`)
          return patchDeviceParams(descriptor, kit).tune
        }
        expect(mod12(tuneOf(moved) - tuneOf(sound)), sound.id).toBe(mod12(by))
        expect(Math.abs(tuneOf(moved)), sound.id).toBeLessThanOrEqual(12)
        continue
      }
      // Weather is not in a key, whatever note holds it open.
      if (sound.kind === 'texture' && sound.words === undefined) continue
      for (const note of moved.phrase.notes) {
        expect(scale.has(mod12(note.note)), `${sound.id} plays ${note.note}`).toBe(true)
      }
    }
    expect(names.size).toBe(FACTORY_SOUNDS.length)
  })
})

/**
 * The effects a measure tunes with no note written down, and which way the pitch goes with
 * each: -1 for a time or a size (longer or larger is lower), 1 for a frequency.
 */
const TUNED_BY_MEASURE: Readonly<Record<string, Readonly<Record<string, 1 | -1>>>> = {
  vessel: { size: -1 },
  howl: { distance: -1, body: 1 },
}
/** The effects whose root is a pitch class alone. */
const TUNED_BY_CLASS = new Set(['bowls'])
/** How far a measure moved the pitch, in semitones, and how far that is from `by` in any octave. */
function offKey(before: number, after: number, way: 1 | -1, by: number): number {
  const off = way * 12 * Math.log2(after / before) - by
  return Math.abs(off - 12 * Math.round(off / 12))
}

describe('a pitch held by a time, a size or a frequency', () => {
  const one = (device: PatchDevice, by: number): Record<string, number> =>
    transposePatch({ effects: [device] }, by).effects[0].params ?? {}

  it('moves the loop of a howl and its resonance against each other', () => {
    // As it comes the loop is 7.645 ms round, which tunes C3, and Body stands at 520 Hz, its fourth overtone.
    const up = one({ deviceId: 'howl' }, 3)
    expect(Object.keys(up).sort()).toEqual(['body', 'distance'])
    expect(up.distance).toBeCloseTo(7.645 * 2 ** (-3 / 12), 9)
    // A frequency is written to the hundredth of a hertz, as a knob in hertz reads.
    expect(up.body).toBe(Math.round(520 * 2 ** (3 / 12) * 100) / 100)
    // The note the loop tunes is three semitones up, and Body is as many times it as before.
    expect(12 * Math.log2(1000 / up.distance / (1000 / 7.645))).toBeCloseTo(3, 9)
    expect(up.body * up.distance).toBeCloseTo(520 * 7.645, 1)
    // A preset's own tuning moves too: the low drone on C2 is on G1 five down.
    const low = one({ deviceId: 'howl', preset: 'Low drone' }, -5)
    expect(low.distance).toBeCloseTo(15.29 * 2 ** (5 / 12), 9)
    expect(low.body).toBe(Math.round(196 * 2 ** (-5 / 12) * 100) / 100)
    // What the patch sets is kept, and only the tuning moves.
    const kept = one({ deviceId: 'howl', preset: 'In the gaps', params: { mix: 0.3 } }, 2)
    expect(Object.keys(kept).sort()).toEqual(['body', 'distance', 'mix'])
    expect(kept.mix).toBe(0.3)
    // Past the end of a control it goes the octave that fits: still the key's note.
    const short = one({ deviceId: 'howl', params: { distance: 1.2, body: 2000 } }, 6)
    expect(short.distance).toBeCloseTo(1.2 * 2 ** (-6 / 12) * 2, 9)
    expect(short.body).toBe(Math.round(2000 * 2 ** (6 / 12) * 100) / 100 / 2)
    const long = one({ deviceId: 'howl', params: { distance: 36, body: 130 } }, -5)
    expect(long.distance).toBeCloseTo((36 * 2 ** (5 / 12)) / 2, 9)
    expect(long.body).toBe((Math.round(130 * 2 ** (-5 / 12) * 100) / 100) * 2)
  })

  it('moves the size of a body the other way from its pitch', () => {
    // The open pipe rings C3 at Size 1: three up it is smaller, five down larger.
    expect(one({ deviceId: 'vessel' }, 3).size).toBeCloseTo(2 ** (-3 / 12), 9)
    expect(one({ deviceId: 'vessel' }, -5).size).toBeCloseTo(2 ** (5 / 12), 9)
    // The cistern is as large as a body gets: five down is the octave above that, and six up fits.
    expect(one({ deviceId: 'vessel', preset: 'Cistern' }, -5).size).toBeCloseTo(
      (4 * 2 ** (5 / 12)) / 2,
      9,
    )
    expect(one({ deviceId: 'vessel', preset: 'Cistern' }, 6).size).toBeCloseTo(
      4 * 2 ** (-6 / 12),
      9,
    )
    // The thimble is as small as one gets: six up is the octave below that.
    expect(one({ deviceId: 'vessel', preset: 'Thimble' }, 6).size).toBeCloseTo(
      0.25 * 2 ** (-6 / 12) * 2,
      9,
    )
    // What the patch sets is kept, and its own size is the one that moves.
    expect(
      one({ deviceId: 'vessel', preset: 'Glass tube', params: { size: 2, mix: 0.4 } }, 12),
    ).toEqual({ size: 1, mix: 0.4 })
  })

  it('moves the root of the bowls and leaves their scale and register', () => {
    expect(one({ deviceId: 'bowls' }, 3)).toEqual({ root: 3 })
    // The table of fifths stands on A: three up is C, five down E.
    expect(one({ deviceId: 'bowls', preset: 'Low fifths' }, 3)).toEqual({ root: 0 })
    expect(one({ deviceId: 'bowls', preset: 'Low fifths', params: { ring: 20 } }, -5)).toEqual({
      root: 4,
      ring: 20,
    })
  })
})

describe.each([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6])(
  'the chains with bowls, a body or a howl moved by %i',
  (by) => {
    it('are the same chains with each of them tuned that far from where it stood', () => {
      const tuned = FACTORY_CHAINS.filter((chain) =>
        chain.effects.some(
          (effect) => effect.deviceId in TUNED_BY_MEASURE || TUNED_BY_CLASS.has(effect.deviceId),
        ),
      )
      expect(tuned.length).toBeGreaterThan(0)
      // Each of the three is in the bank, so each is held to it.
      for (const id of [...Object.keys(TUNED_BY_MEASURE), ...TUNED_BY_CLASS]) {
        expect(
          tuned.some((chain) => chain.effects.some((effect) => effect.deviceId === id)),
          id,
        ).toBe(true)
      }
      for (const chain of tuned) {
        const moved = transposePatch(chain, by)
        expect(validatePatch(moved, registry), chain.id).toEqual([])
        chain.effects.forEach((effect, at) => {
          const descriptor = registry.get(effect.deviceId)
          const measures = TUNED_BY_MEASURE[effect.deviceId] ?? {}
          const byClass = TUNED_BY_CLASS.has(effect.deviceId)
          if (!descriptor || (!byClass && !(effect.deviceId in TUNED_BY_MEASURE))) {
            // An effect tuned by its octave is held to the key above; every other one is untouched.
            if (!TUNED_BY_OCTAVE.has(effect.deviceId)) {
              expect(moved.effects[at], chain.id).toBe(effect)
            }
            return
          }
          const before = patchDeviceParams(descriptor, effect)
          const after = patchDeviceParams(descriptor, moved.effects[at])
          const where = `${chain.id}: ${effect.deviceId}`
          if (byClass) expect(mod12(after.root - before.root), where).toBe(mod12(by))
          for (const [name, way] of Object.entries(measures)) {
            // The key's note, in whichever octave the control has room for. A frequency is
            // written to the hundredth of a hertz, which is under a fifth of a cent from 50 Hz up.
            expect(offKey(before[name], after[name], way, by), `${where} ${name}`).toBeLessThan(
              way === 1 ? 2e-3 : 1e-9,
            )
          }
          // Nothing else of it moved.
          for (const [name, value] of Object.entries(before)) {
            if (name in measures || (byClass && name === 'root')) continue
            expect(after[name], `${where} ${name}`).toBe(value)
          }
        })
      }
    })
  },
)
