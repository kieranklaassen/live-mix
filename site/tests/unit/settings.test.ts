import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { LabDescription } from '../../src/lab/describe.ts'
import {
  checkSettings,
  lessonSettings,
  readSettings,
  resolveSet,
  setNamed,
  settingsSchema,
} from '../../src/lib/settings.ts'

const FIXTURES = fileURLToPath(new URL('./fixtures/settings', import.meta.url))

const control = (index: number, id: string, min: number, max: number, initial: number) => ({
  index,
  id,
  name: id,
  unit: '',
  min,
  max,
  initial,
  scale: 'linear' as const,
  choices: [],
})

/** A lab of three controls, one of them the build step, and three taps, one of them not sound. */
const lab: LabDescription = {
  sampleRate: 48_000,
  maxFrames: 384_000,
  controls: [
    control(0, 'threshold', -60, 0, -24),
    control(1, 'ratio', 1, 10, 4),
    control(2, 'build', 0, 3, 0),
  ],
  taps: [
    { index: 0, id: 'in', name: 'Input', unit: '', kind: 'audio', origin: 'source', channels: 2 },
    {
      index: 1,
      id: 'level',
      name: 'Level',
      unit: 'dB',
      kind: 'control',
      origin: 'device',
      channels: 1,
    },
    { index: 2, id: 'out', name: 'Output', unit: '', kind: 'audio', origin: 'device', channels: 2 },
  ],
  checks: [],
}
const SOURCES = ['drums', 'guitar']

/** A whole file, as a lesson might write it. */
const whole = {
  tile: {
    values: { threshold: -30, ratio: 8 },
    tap: 'out',
    picture: { taps: ['in', 'out'], view: 'wave', from: 1, span: 2 },
  },
  sets: {
    pump: { label: 'pumping', values: { threshold: -36, ratio: 10 }, source: 'drums', tap: 'out' },
    gentle: { label: 'a gentle hold', values: { ratio: 2 } },
  },
  defaults: { values: { ratio: 2 } },
}

/** `whole` with one set put in or replaced. */
const withSet = (set: unknown) =>
  settingsSchema.parse({ ...whole, sets: { ...whole.sets, odd: set } })

describe('a named set', () => {
  it('resolves a control it leaves out to the lab’s starting value', () => {
    expect(resolveSet(lab, { values: { ratio: 2 } })).toEqual({
      values: { threshold: -24, ratio: 2 },
    })
    expect(resolveSet(lab, {})).toEqual({ values: { threshold: -24, ratio: 4 } })
  })

  it('never resolves a value for the build step, named or not', () => {
    const resolved = resolveSet(lab, { values: { threshold: -30, build: 3 } })
    expect(resolved.values).toEqual({ threshold: -30, ratio: 4 })
    expect('build' in resolved.values).toBe(false)
  })

  it('carries the source and the tap it names, and none it does not', () => {
    expect(resolveSet(lab, { source: 'drums', tap: 'out' })).toEqual({
      values: { threshold: -24, ratio: 4 },
      source: 'drums',
      tap: 'out',
    })
  })
})

describe('a lesson’s settings file', () => {
  it('holds a tile, the sets the cards play and the device’s defaults', () => {
    const settings = settingsSchema.parse(whole)
    expect(() => checkSettings(settings, lab, SOURCES, 'compression')).not.toThrow()
    // What a file leaves out: no values is a set of the lab's own start, and a picture starts at 0.
    expect(
      settingsSchema.parse({ tile: { tap: 'out', picture: { taps: ['out'], view: 'wave' } } }),
    ).toEqual({
      tile: { values: {}, tap: 'out', picture: { taps: ['out'], view: 'wave', from: 0 } },
      sets: {},
    })
  })

  it('is refused when it holds a key the shape does not have', () => {
    expect(settingsSchema.safeParse({ ...whole, cards: {} }).success).toBe(false)
    expect(
      settingsSchema.safeParse({ sets: { pump: { label: 'pumping', value: { ratio: 2 } } } })
        .success,
    ).toBe(false)
    expect(settingsSchema.safeParse({ sets: { pump: { values: { ratio: 2 } } } }).success).toBe(
      false,
    )
  })

  it('stops the build, naming the lesson and the set, on a control the lab lacks', () => {
    const settings = withSet({ label: 'odd', values: { knee: 6 } })
    expect(() => checkSettings(settings, lab, SOURCES, 'compression')).toThrow(
      'compression: the control "knee", named in the set "odd", is not one the lab has. It has: threshold, ratio',
    )
  })

  it('stops the build on a value out of its control’s range', () => {
    const settings = withSet({ label: 'odd', values: { ratio: 12 } })
    expect(() => checkSettings(settings, lab, SOURCES, 'compression')).toThrow(
      'compression: "ratio" is 12 in the set "odd", outside its range of 1 to 10.',
    )
    const low = settingsSchema.parse({ ...whole, defaults: { values: { threshold: -61 } } })
    expect(() => checkSettings(low, lab, SOURCES, 'compression')).toThrow(
      `compression: "threshold" is -61 in the device's defaults, outside its range of -60 to 0.`,
    )
  })

  it('stops the build on a source the lesson does not list', () => {
    const settings = withSet({ label: 'odd', source: 'noise' })
    expect(() => checkSettings(settings, lab, SOURCES, 'compression')).toThrow(
      'compression: the source "noise", named in the set "odd", is not one the lesson lists. It lists: drums, guitar',
    )
  })

  it('stops the build on a tap the lab lacks, and on one to play that is not sound', () => {
    const unknown = withSet({ label: 'odd', tap: 'wet' })
    expect(() => checkSettings(unknown, lab, SOURCES, 'compression')).toThrow(
      'compression: the tap "wet", named in the set "odd", is not one the lab has. It has: in, level, out',
    )
    const silent = withSet({ label: 'odd', tap: 'level' })
    expect(() => checkSettings(silent, lab, SOURCES, 'compression')).toThrow(
      'compression: the tap "level", played by the set "odd", is not sound.',
    )
    const drawn = settingsSchema.parse({
      tile: { tap: 'out', picture: { taps: ['out', 'gain'], view: 'wave' } },
    })
    expect(() => checkSettings(drawn, lab, SOURCES, 'compression')).toThrow(
      `compression: the tap "gain", named in the tile's picture, is not one the lab has. It has: in, level, out`,
    )
    // A picture may draw a tap that is not sound.
    const level = settingsSchema.parse({
      tile: { tap: 'out', picture: { taps: ['level'], view: 'wave' } },
    })
    expect(() => checkSettings(level, lab, SOURCES, 'compression')).not.toThrow()
  })

  it('stops the build on a set that names the build step', () => {
    const settings = withSet({ label: 'odd', values: { build: 2 } })
    expect(() => checkSettings(settings, lab, SOURCES, 'compression')).toThrow(
      'compression: the control "build" is named in the set "odd". A set never moves the build step.',
    )
  })

  it('gives a card its set by name, and stops the build on a name the file does not have', () => {
    const settings = settingsSchema.parse(whole)
    expect(setNamed(settings, 'gentle', 'compression')).toEqual({
      label: 'a gentle hold',
      values: { ratio: 2 },
    })
    expect(() => setNamed(settings, 'loud', 'compression')).toThrow(
      'compression: there is no set called "loud". Its settings file has: pump, gentle',
    )
    expect(() => setNamed(undefined, 'loud', 'compression')).toThrow(
      'compression: there is no set called "loud". The lesson has no settings file',
    )
  })
})

describe('reading a lesson’s settings', () => {
  it('has none for a lesson with no file, which is not a fault', async () => {
    expect(readSettings('no-such-lesson', FIXTURES)).toBeUndefined()
    const lesson = { id: 'no-such-lesson', data: { lab: 'through', sources: ['drums'] } }
    expect(await lessonSettings(lesson, FIXTURES)).toBeUndefined()
  })

  it('reads a file and checks it against the lab as built', async () => {
    const lesson = { id: 'sample', data: { lab: 'through', sources: ['drums', 'sine'] } }
    const settings = await lessonSettings(lesson, FIXTURES)
    expect(settings).toEqual({
      tile: { values: {}, tap: 'in', picture: { taps: ['in'], view: 'wave', from: 0, span: 2 } },
      sets: { dry: { label: 'the loop, dry', values: {}, source: 'sine', tap: 'in' } },
    })
    // The same file under a lesson that does not list its source.
    const narrow = { id: 'sample', data: { lab: 'through', sources: ['drums'] } }
    await expect(lessonSettings(narrow, FIXTURES)).rejects.toThrow(
      'sample: the source "sine", named in the set "dry", is not one the lesson lists. It lists: drums',
    )
  })

  it('stops the build on a file whose set names a control the built lab lacks', async () => {
    const lesson = { id: 'wrong-control', data: { lab: 'through', sources: ['drums'] } }
    await expect(lessonSettings(lesson, FIXTURES)).rejects.toThrow(
      'wrong-control: the control "threshold", named in the set "pump", is not one the lab has. It has no controls',
    )
  })

  it('stops the build, naming the lesson and the place, on a file that is not of the shape', () => {
    expect(() => readSettings('misshapen', FIXTURES)).toThrow(/^misshapen: .*sets\.pump/s)
  })
})
