// The bank in another key: how far it moves, what its sounds are then called,
// and that every note it plays there is a note of that key.

import { describe, expect, it } from 'vitest'

import { DeviceRegistry } from '../../../core/devices/registry'
import { patchDeviceParams, validatePatch, type PatchDevice } from '../../../core/devices/patch'
import { STOCK_WASM_DEVICES } from '../../registry'
import {
  CHORD_COLOURS,
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
} from '..'

const registry = new DeviceRegistry(STOCK_WASM_DEVICES)
const MODES = Object.keys(FACTORY_MODES) as FactoryMode[]
const WHITE_KEYS = new Set(FACTORY_MODES.major)
const mod12 = (value: number): number => ((Math.round(value) % 12) + 12) % 12

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
      // Weather is not in a key, whatever note holds it open.
      if (sound.kind === 'texture' && sound.words === undefined) continue
      for (const note of moved.phrase.notes) {
        expect(scale.has(mod12(note.note)), `${sound.id} plays ${note.note}`).toBe(true)
      }
    }
    expect(names.size).toBe(FACTORY_SOUNDS.length)
  })
})
