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
})

describe.each([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6])('the chains moved by %i', (by) => {
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
