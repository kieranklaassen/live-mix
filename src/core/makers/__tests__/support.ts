// What every maker's own test asks of it: that the same notes come out
// however the clock is cut up, that whatever begins ends, that nothing is
// written that an instrument cannot play, and that its presets are presets.

import { describe, expect, it } from 'vitest'

import { type PatchMaker } from '../../devices/patch'
import { listPresets } from '../../devices/presets'
import { makePhrase, type MadePhraseNote, type PlayedNote } from '../phrase'
import { makerParams } from '../table'
import { WHITE_KEYS, type MadeEvent, type MakerKey, type NoteMakerDescriptor } from '../types'

export const A_MINOR: MakerKey = { root: 9, steps: [0, 2, 3, 5, 7, 8, 10] }
export const PENTATONIC: MakerKey = { root: 5, steps: [0, 2, 4, 7, 9] }

/** Notes one after another, each held up to the next: `[note, seconds]`. */
export function line(notes: readonly (readonly [number, number])[], gain = 0.8): PlayedNote[] {
  let atSec = 0
  return notes.map(([note, durSec]) => {
    const played = { atSec, durSec, note, gain }
    atSec += durSec
    return played
  })
}

/** Notes together. */
export function chord(notes: readonly number[], durSec: number, atSec = 0): PlayedNote[] {
  return notes.map((note) => ({ atSec, durSec, note, gain: 0.8 }))
}

/** What a maker makes of notes: `maker` by id of the descriptor, with these settings. */
export function made(
  descriptor: NoteMakerDescriptor,
  notes: readonly PlayedNote[],
  settings: Omit<PatchMaker, 'makerId'> = {},
  durationSec = 12,
): MadePhraseNote[] {
  return makePhrase(
    notes,
    { makerId: descriptor.id, ...settings },
    { durationSec, describe: () => descriptor },
  )
}

/** The MIDI notes in the order they begin. */
export function notesOf(phrase: readonly MadePhraseNote[]): number[] {
  return phrase.map((note) => note.note)
}

/** Two held chords, a line with repeats and overlaps, a rest, low and high keys: what people play. */
export const PLAYED: readonly PlayedNote[] = [
  ...chord([50, 57, 65, 72], 3.2),
  { atSec: 1, durSec: 0.5, note: 74, gain: 0.5 },
  { atSec: 1.5, durSec: 0.5, note: 74, gain: 0.9 },
  { atSec: 1.8, durSec: 0.9, note: 76, gain: 0.3 },
  { atSec: 5, durSec: 1, note: 62, gain: 0.8 },
  { atSec: 5.4, durSec: 2, note: 61, gain: 0.8 },
  { atSec: 6, durSec: 1.4, note: 62, gain: 0.8 },
  { atSec: 7, durSec: 0.2, note: 21, gain: 1 },
  { atSec: 7, durSec: 0.2, note: 108, gain: 0.1 },
  ...chord([48, 52, 55], 4, 8),
]

function run(
  descriptor: NoteMakerDescriptor,
  params: Readonly<Record<string, number>>,
  key: MakerKey,
  stepSec: number | null,
  toSec: number,
  played: readonly PlayedNote[] = PLAYED,
): MadeEvent[] {
  const maker = descriptor.create({ params, key, parts: descriptor.parts.map((part) => part.id) })
  const out: MadeEvent[] = []
  const emit = (event: MadeEvent): void => {
    out.push(event)
  }
  const inputs = played
    .flatMap((note, id) => [
      { atSec: note.atSec, on: true, id, note },
      { atSec: note.atSec + note.durSec, on: false, id, note },
    ])
    .sort((a, b) => a.atSec - b.atSec || Number(a.on) - Number(b.on))
  let clock = 0
  const to = (atSec: number): void => {
    if (stepSec !== null) {
      while (clock + stepSec < atSec) {
        clock += stepSec
        maker.advance(clock, emit)
      }
    }
    maker.advance(atSec, emit)
  }
  for (const input of inputs) {
    if (stepSec !== null) to(input.atSec)
    if (input.on) maker.noteOn(input.atSec, input.id, input.note.note, input.note.gain ?? 0.8)
    else maker.noteOff(input.atSec, input.id)
  }
  to(toSec)
  return out
}

/** Every param at its least, its default and its most, one at a time, and all presets. */
function settings(descriptor: NoteMakerDescriptor): [string, Record<string, number>][] {
  const rows: [string, Record<string, number>][] = [['defaults', {}]]
  for (const [name, spec] of Object.entries(descriptor.params)) {
    if (spec.choices) {
      for (let value = spec.min; value <= spec.max; value += 1)
        rows.push([`${name} ${spec.choices[value - spec.min]}`, { [name]: value }])
    } else
      rows.push([`${name} least`, { [name]: spec.min }], [`${name} most`, { [name]: spec.max }])
  }
  for (const preset of listPresets(descriptor)) rows.push([`preset ${preset.name}`, preset.params])
  return rows
}

/** The checks every maker passes; call it in the maker's own test. */
export function makerContract(descriptor: NoteMakerDescriptor): void {
  describe(`${descriptor.name}: what every maker keeps`, () => {
    const rows = settings(descriptor)

    it('writes the same notes however the clock is cut up', () => {
      for (const [, params] of rows) {
        const whole = run(descriptor, params, WHITE_KEYS, null, 40)
        for (const step of [0.0051, 0.37]) {
          expect(run(descriptor, params, WHITE_KEYS, step, 40)).toEqual(whole)
        }
      }
    }, 60000)

    it('writes the same notes twice, in any key', () => {
      for (const key of [A_MINOR, PENTATONIC]) {
        const [, params] = rows[0]
        expect(run(descriptor, params, key, null, 40)).toEqual(
          run(descriptor, params, key, null, 40),
        )
      }
    })

    it('moves with the key: another key is the same notes, so far up or down', () => {
      const middle = PLAYED.filter((note) => note.note > 40 && note.note < 90)
      const inside = (event: MadeEvent): boolean => event.note > 20 && event.note < 111
      for (const [label, params] of rows) {
        const home = run(descriptor, params, WHITE_KEYS, null, 30, middle)
        // A setting that writes to the ends of the keyboard is folded there, in every key elsewhere.
        if (!home.every(inside)) continue
        for (const semitones of [-5, -3, 2, 6]) {
          const moved = run(
            descriptor,
            params,
            { root: (12 + semitones) % 12, steps: WHITE_KEYS.steps },
            null,
            30,
            middle.map((note) => ({ ...note, note: note.note + semitones })),
          )
          expect(
            moved.map((event) => ({ ...event, note: event.note - semitones })),
            `${label}, ${semitones} semitones`,
          ).toEqual(home)
        }
      }
    }, 60000)

    it('ends whatever it begins, in order of time, with notes an instrument can play', () => {
      for (const key of [WHITE_KEYS, A_MINOR, PENTATONIC]) {
        for (const [label, params] of rows) {
          const events = run(descriptor, params, key, null, 80)
          const sounding = new Map<number, string>()
          const pitches = new Set<string>()
          let last = 0
          let most = 0
          for (const event of events) {
            expect(event.atSec, label).toBeGreaterThanOrEqual(last)
            last = event.atSec
            expect(
              Number.isFinite(event.note) && event.note >= 12 && event.note <= 119,
              label,
            ).toBe(true)
            expect(event.gain >= 0 && event.gain <= 1, label).toBe(true)
            const pitch = `${event.part ?? ''}:${event.note}`
            if (event.on) {
              // One pitch of one instrument is one voice.
              expect(pitches.has(pitch), label).toBe(false)
              expect(sounding.has(event.id), label).toBe(false)
              sounding.set(event.id, pitch)
              pitches.add(pitch)
              most = Math.max(most, sounding.size)
            } else {
              expect(sounding.get(event.id), label).toBe(pitch)
              sounding.delete(event.id)
              pitches.delete(pitch)
            }
          }
          expect([...sounding.values()], `${label}: still sounding at the end`).toEqual([])
          expect(most, `${label}: voices at once`).toBeLessThanOrEqual(64)
          expect(events.length, `${label}: events in 80 s`).toBeLessThanOrEqual(6000)
        }
      }
    }, 60000)

    it('is silent after silence, and plays again', () => {
      const maker = descriptor.create()
      const open = new Set<number>()
      const emit = (event: MadeEvent): void => {
        if (event.on) open.add(event.id)
        else open.delete(event.id)
      }
      for (const [id, note] of [60, 64, 67].entries()) maker.noteOn(0, id, note, 0.8)
      maker.advance(1.3, emit)
      maker.silence(1.3, emit)
      expect(open.size).toBe(0)
      expect(maker.next()).toBe(Infinity)
      const late: MadeEvent[] = []
      maker.advance(60, (event) => late.push(event))
      expect(late).toEqual([])
      maker.noteOn(60, 9, 60, 0.8)
      maker.advance(90, (event) => late.push(event))
      expect(late.some((event) => event.on)).toBe(true)
    })

    it('takes every control while it plays', () => {
      for (const [name, spec] of Object.entries(descriptor.params)) {
        const maker = descriptor.create()
        const open = new Set<number>()
        const emit = (event: MadeEvent): void => {
          if (event.on) open.add(event.id)
          else open.delete(event.id)
        }
        for (const [id, note] of [50, 57, 65].entries()) maker.noteOn(0, id, note, 0.8)
        maker.advance(2, emit)
        maker.setParam(2, name, spec.max)
        maker.advance(5, emit)
        maker.setParam(5, name, spec.min)
        maker.setKey(6, A_MINOR)
        maker.advance(9, emit)
        for (const id of [0, 1, 2]) maker.noteOff(9, id)
        maker.advance(60, emit)
        expect(open.size, name).toBe(0)
      }
    })

    it('has sixteen presets of its own, no two alike in what they write', () => {
      const presets = listPresets(descriptor)
      expect(presets.length).toBeGreaterThanOrEqual(16)
      const seen = new Map<string, string>()
      for (const preset of presets) {
        expect(preset.name.length, preset.name).toBeLessThanOrEqual(20)
        for (const [name, value] of Object.entries(preset.params)) {
          const spec = descriptor.params[name]
          expect(spec, `${preset.name}: ${name}`).toBeDefined()
          expect(value >= spec.min && value <= spec.max, `${preset.name}: ${name}`).toBe(true)
        }
        const params = makerParams(descriptor, { preset: preset.name })
        const events = run(descriptor, params, WHITE_KEYS, null, 40)
        expect(events.length, preset.name).toBeGreaterThan(0)
        const written = JSON.stringify(
          events.map((event) => [
            event.on,
            Math.round(event.atSec * 1000),
            event.note,
            Math.round(event.gain * 100),
            event.part,
          ]),
        )
        expect(seen.get(written), `${preset.name} writes what another writes`).toBeUndefined()
        seen.set(written, preset.name)
      }
    })

    it('has a description for every control, and ids that are its own', () => {
      const ids = new Set<number>()
      for (const [name, spec] of Object.entries(descriptor.params)) {
        expect(ids.has(spec.id), name).toBe(false)
        ids.add(spec.id)
        expect(spec.description?.length ?? 0, name).toBeGreaterThan(20)
        expect(spec.description?.length ?? 0, name).toBeLessThanOrEqual(170)
        if (spec.choices) expect(spec.choices.length, name).toBe(spec.max - spec.min + 1)
      }
      for (const name of Object.keys(descriptor.timed ?? {}))
        expect(descriptor.params[name], name).toBeDefined()
      expect(descriptor.description.length).toBeLessThanOrEqual(220)
    })

    it('changes what it writes with every control, from the defaults or from a preset', () => {
      const bases = [{}, ...listPresets(descriptor).map((preset) => preset.params)]
      for (const [name, spec] of Object.entries(descriptor.params)) {
        const heard = bases.some((base) => {
          const least = run(descriptor, { ...base, [name]: spec.min }, WHITE_KEYS, null, 40)
          const most = run(descriptor, { ...base, [name]: spec.max }, WHITE_KEYS, null, 40)
          return JSON.stringify(least) !== JSON.stringify(most)
        })
        expect(heard, `${name} changes nothing`).toBe(true)
      }
    })
  })
}
