// The build part's steps, driven without a page: where Back and Add go, what the buttons say,
// and what a press does to the page's store, on a lab stood in for by one whose built tap holds
// the step it was rendered at.
import { describe, expect, it, vi } from 'vitest'
import {
  addLabel,
  afterStep,
  beforeStep,
  builtSound,
  goToStep,
  hearSoFar,
  stepAt,
  stepPlace,
} from '../../src/figures/build-steps.ts'
import { countOnPage, sinceStartOnPage, startOnPage } from '../../src/figures/once.ts'
import { cardState, tapState } from '../../src/figures/sounding.ts'
import type { LabDescription } from '../../src/lab/describe.ts'
import {
  createLabStore,
  type Renderer,
  type Result,
  type Sounder,
  type Tap,
} from '../../src/lab/store.ts'

const NAMES = ['A wire', 'Measure the level', 'Threshold and ratio']

const description: LabDescription = {
  sampleRate: 48_000,
  maxFrames: 384_000,
  controls: [
    {
      index: 0,
      id: 'ratio',
      name: 'Ratio',
      unit: ':1',
      min: 1,
      max: 10,
      initial: 4,
      scale: 'linear',
      choices: [],
    },
    {
      index: 1,
      id: 'build',
      name: 'Build',
      unit: '',
      min: 0,
      max: 2,
      initial: 0,
      scale: 'linear',
      choices: NAMES,
    },
  ],
  taps: [
    { index: 0, id: 'in', name: 'Input', unit: '', kind: 'audio', origin: 'source', channels: 2 },
    { index: 1, id: 'out', name: 'Output', unit: '', kind: 'audio', origin: 'device', channels: 2 },
    {
      index: 2,
      id: 'built',
      name: 'The compressor so far',
      unit: '',
      kind: 'audio',
      origin: 'lesson',
      channels: 2,
    },
    {
      index: 3,
      id: 'builtLevel',
      name: 'Level, as built',
      unit: 'dB',
      kind: 'control',
      origin: 'kit',
      channels: 1,
    },
  ],
  checks: [],
}

/** A tap whose every sample is `fill`. */
function tap(id: string, fill: number): Tap {
  const info = description.taps.find((one) => one.id === id)!
  const data = () => new Float32Array(16).fill(fill)
  return {
    ...info,
    channels_data: [data(), data()],
    length: 16,
    x0: 0,
    x1: 1,
    columns: 0,
    log: false,
  }
}

/**
 * What the stand-in lab renders: the main path does not know the step, and the built taps hold
 * it, as a lab's build path leaves every other tap alone.
 */
const rendered = (values: Record<string, number>): Result => ({
  frames: 16,
  ms: 1,
  checks: {},
  taps: {
    in: tap('in', 0.5),
    out: tap('out', 0.25),
    built: tap('built', values.build ?? 0),
    builtLevel: tap('builtLevel', -(values.build ?? 0)),
  },
})

/** A page's store on that lab, with renders that land when the test says so. */
async function page() {
  const flying: (() => void)[] = []
  const renderer: Renderer = {
    load: () => Promise.resolve(description),
    render: (_source, values) =>
      new Promise((resolve) => flying.push(() => resolve(rendered({ ...values })))),
    setFile: () => {},
  }
  const sounder = {
    play: vi.fn<Sounder['play']>(),
    update: vi.fn<Sounder['update']>(),
    bench: vi.fn<Sounder['bench']>(),
    stop: vi.fn<Sounder['stop']>(),
    setVolume: vi.fn<Sounder['setVolume']>(),
    wake: vi.fn<Sounder['wake']>(),
  }
  const store = createLabStore(renderer, sounder)
  const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
  /** Land every render asked for, until none is in flight. */
  const settle = async () => {
    for (;;) {
      await tick()
      const next = flying.shift()
      if (!next) return
      next()
    }
  }
  await store.init({ lab: 'stand-in', sources: ['drums'], seconds: 1 })
  await settle()
  /** The sound the sounder was last given: the tap and what it holds. */
  const heard = () => {
    const calls = [...sounder.play.mock.calls, ...sounder.update.mock.calls]
    const last = [sounder.play, sounder.update]
      .flatMap((fn) =>
        fn.mock.invocationCallOrder.map((order, i) => ({ order, tap: fn.mock.calls[i]![0] })),
      )
      .sort((a, b) => a.order - b.order)
      .at(-1)
    expect(calls.length).toBeGreaterThan(0)
    return { id: last!.tap.id, holds: last!.tap.channels_data[0]![0] }
  }
  return { store, sounder, settle, tick, heard, step: () => store.getState().values.build }
}

describe('where the steps go', () => {
  it('reads the step off the build control: whole, and inside the steps there are', () => {
    expect(stepAt(undefined, 3)).toBe(0)
    expect(stepAt(1, 3)).toBe(1)
    expect(stepAt(1.4, 3)).toBe(1)
    expect(stepAt(7, 3)).toBe(2)
    expect(stepAt(-1, 3)).toBe(0)
  })

  it('goes on by one piece, and from the last step back to the first', () => {
    expect(afterStep(0, 3)).toBe(1)
    expect(afterStep(1, 3)).toBe(2)
    expect(afterStep(2, 3)).toBe(0)
  })

  it('goes back by one piece, and nowhere from the first', () => {
    expect(beforeStep(2)).toBe(1)
    expect(beforeStep(1)).toBe(0)
    expect(beforeStep(0)).toBeUndefined()
  })

  it('names on Add the piece that comes next, and at the end says it starts again', () => {
    expect(addLabel(0, NAMES)).toBe('Add: measure the level')
    expect(addLabel(1, NAMES)).toBe('Add: threshold and ratio')
    expect(addLabel(2, NAMES)).toBe('Start again')
    // A name that opens with an abbreviation keeps its capitals.
    expect(addLabel(0, ['A wire', 'RMS detector'])).toBe('Add: RMS detector')
  })

  it('says of each step whether it is built, the one shown, or still to come', () => {
    expect([0, 1, 2].map((step) => stepPlace(step, 1))).toEqual(['built', 'here', 'ahead'])
  })

  it('finds the sound the build path writes, and takes a tap that is named', () => {
    expect(builtSound(description, undefined, 'a lesson').id).toBe('built')
    expect(() => builtSound(description, 'builtLevel', 'a lesson')).toThrow(
      /a lesson: .*"builtLevel".* not sound/,
    )
    expect(() => builtSound(description, 'out', 'a lesson')).toThrow(/a lesson: .*"out"/)
    const none = { ...description, taps: description.taps.slice(0, 2) }
    expect(() => builtSound(none, undefined, 'a lesson')).toThrow(/a lesson: .*built/)
  })
})

describe('a press on the build part', () => {
  it('Add moves the build control, and the lab renders that step', async () => {
    const { store, settle, step } = await page()
    expect(step()).toBe(0)
    goToStep(store, afterStep(0, 3))
    await settle()
    expect(step()).toBe(1)
    expect(store.getState().result?.taps.built?.channels_data[0]?.[0]).toBe(1)
  })

  it('"Hear it so far" plays the built tap', async () => {
    const { store, heard } = await page()
    hearSoFar(store, 'built')
    expect(store.getState().playing).toBe(true)
    expect(heard()).toEqual({ id: 'built', holds: 0 })
    expect(tapState(store.getState(), 'built')).toBe('sounding')
  })

  it('Add while the built tap sounds keeps it sounding, at the new step', async () => {
    const { store, settle, heard } = await page()
    hearSoFar(store, 'built')
    goToStep(store, 1)
    await settle()
    expect(store.getState().playing).toBe(true)
    expect(heard()).toEqual({ id: 'built', holds: 1 })
    goToStep(store, 2)
    await settle()
    expect(heard()).toEqual({ id: 'built', holds: 2 })
    expect(tapState(store.getState(), 'built')).toBe('sounding')
  })

  it('Add while something else sounds changes the pictures and not the sound', async () => {
    const { store, sounder, settle, heard } = await page()
    store.listen('out')
    const before = heard()
    goToStep(store, 1)
    await settle()
    // The pictures are of the new step.
    expect(store.getState().result?.taps.builtLevel?.channels_data[0]?.[0]).toBe(-1)
    // What sounds is what sounded: the same tap, holding what it held.
    expect(store.getState().sounding).toBe('out')
    expect(heard()).toEqual(before)
    for (const call of [...sounder.play.mock.calls, ...sounder.update.mock.calls]) {
      expect(call[0].id).toBe('out')
    }
    expect(tapState(store.getState(), 'built')).toBe('idle')
  })

  it('"Hear it so far" pressed on a step still rendering is busy until it sounds', async () => {
    const { store, sounder, settle } = await page()
    goToStep(store, 2)
    hearSoFar(store, 'built')
    expect(tapState(store.getState(), 'built')).toBe('busy')
    expect(store.getState().playing).toBe(false)
    expect(sounder.play).not.toHaveBeenCalled()
    await settle()
    expect(tapState(store.getState(), 'built')).toBe('sounding')
    // What starts is the step that was asked for, never the one before it.
    expect(sounder.play).toHaveBeenCalledTimes(1)
    expect(sounder.play.mock.calls[0]![0].channels_data[0]![0]).toBe(2)
  })

  it('pressed again while busy it does not start, and pressed while it sounds it stops', async () => {
    const { store, sounder, settle } = await page()
    goToStep(store, 1)
    hearSoFar(store, 'built')
    hearSoFar(store, 'built')
    expect(tapState(store.getState(), 'built')).toBe('idle')
    await settle()
    expect(sounder.play).not.toHaveBeenCalled()

    hearSoFar(store, 'built')
    expect(tapState(store.getState(), 'built')).toBe('sounding')
    hearSoFar(store, 'built')
    expect(store.getState().playing).toBe(false)
    expect(tapState(store.getState(), 'built')).toBe('idle')
  })
})

describe('which button is lit', () => {
  const set = { values: { ratio: 8 }, tap: 'out' }

  it('a card is busy from its press until its render lands, then lit', async () => {
    const { store, settle } = await page()
    store.audition({ id: 'pump', label: 'Pumping' }, set)
    expect(cardState(store.getState(), 'pump')).toBe('busy')
    await settle()
    expect(cardState(store.getState(), 'pump')).toBe('sounding')
  })

  it('of two cards on one tap, only the one pressed last is lit', async () => {
    const { store, settle } = await page()
    store.audition({ id: 'pump', label: 'Pumping' }, set)
    await settle()
    store.audition({ id: 'hit', label: 'The hit' }, { values: { ratio: 6 }, tap: 'out' })
    await settle()
    expect(cardState(store.getState(), 'hit')).toBe('sounding')
    expect(cardState(store.getState(), 'pump')).toBe('idle')
  })

  it('a stage is not lit while a card plays its tap, and is once a control is moved by hand', async () => {
    const { store, settle } = await page()
    store.audition({ id: 'pump', label: 'Pumping' }, set)
    await settle()
    expect(tapState(store.getState(), 'out')).toBe('idle')
    store.setValue('ratio', 3)
    await settle()
    expect(cardState(store.getState(), 'pump')).toBe('idle')
    expect(tapState(store.getState(), 'out')).toBe('sounding')
  })
})

describe('the steps of a page as it is built', () => {
  it('are numbered from one in each build part of a page, and apart on another page', () => {
    const page = {}
    const other = {}
    const step = (where: object) => {
      countOnPage(where, 'step')
      return sinceStartOnPage(where, 'step')
    }
    startOnPage(page, 'step')
    expect([step(page), step(page), step(page)]).toEqual([1, 2, 3])
    expect(sinceStartOnPage(page, 'step')).toBe(3)
    // A second build part on the same page.
    startOnPage(page, 'step')
    expect(sinceStartOnPage(page, 'step')).toBe(0)
    expect([step(page), step(page)]).toEqual([1, 2])
    expect(step(other)).toBe(1)
  })
})
