// The segment runner with stand-in models: what it hands a model, how it
// puts the model's answers back together, and when it stops.

import { describe, expect, it } from 'vitest'

import { createSegmentSeparator, type SegmentModel } from '../segments'
import { STEM_NAMES, SeparationError, type Channels, type StemName } from '../types'
import { differenceDb, noise, peak } from './support'

const SEGMENT = 1000
/** Three quarters of a segment: where the next one starts. */
const STRIDE = 750

const silence = (length: number): Channels => [new Float32Array(length), new Float32Array(length)]

/** A model that answers with what it was given as "other" and silence as the rest. */
function passing(calls: Channels[] = []): SegmentModel {
  return {
    sampleRate: 44100,
    segmentFrames: SEGMENT,
    run: (segment) => {
      calls.push(segment.map((channel) => channel.slice()))
      return Promise.resolve({
        vocals: silence(SEGMENT),
        drums: silence(SEGMENT),
        bass: silence(SEGMENT),
        other: segment.map((channel) => channel.slice()),
      })
    },
  }
}

/** The mean and the deviation of the two channels' mean, as the model's reference takes them. */
function standard(channels: Channels): { mean: number; deviation: number } {
  const length = channels[0].length
  let sum = 0
  for (let i = 0; i < length; i += 1) sum += (channels[0][i] + channels[1][i]) / 2
  const mean = sum / length
  let squares = 0
  for (let i = 0; i < length; i += 1) squares += ((channels[0][i] + channels[1][i]) / 2 - mean) ** 2
  return { mean, deviation: Math.sqrt(squares / (length - 1)) + 1e-8 }
}

describe('a model run over a whole track, segment by segment', () => {
  it.each([
    ['shorter than a segment', 400],
    ['shorter than a segment and longer than a stride', 900],
    ['exactly a segment', SEGMENT],
    ['a frame over a segment', SEGMENT + 1],
    ['several segments', 4321],
  ])('gives back a track %s as the model answered it', async (_name, length) => {
    const track = [noise(length, 1), noise(length, 2)]
    const calls: Channels[] = []
    const stems = await createSegmentSeparator(passing(calls)).separate(track)
    const { mean } = standard(track)
    for (const channel of [0, 1]) {
      expect(stems.other[channel].length).toBe(length)
      const about = track[channel].map((sample) => sample - mean)
      expect(differenceDb(stems.other[channel], about)).toBeLessThan(-120)
    }
    for (const call of calls) {
      expect(call.map((channel) => channel.length)).toEqual([SEGMENT, SEGMENT])
    }
    expect(calls.length).toBe(Math.ceil(length / STRIDE))
  })

  it('hands a model the track about zero and at a deviation of one', async () => {
    const track = [
      noise(SEGMENT, 3).map((v) => v * 0.1 + 0.2),
      noise(SEGMENT, 4).map((v) => v * 0.1),
    ]
    const calls: Channels[] = []
    await createSegmentSeparator(passing(calls)).separate(track)
    const { mean, deviation } = standard(track)
    expect(calls[0][0][17]).toBeCloseTo((track[0][17] - mean) / deviation, 4)
    expect(calls[0][1][999]).toBeCloseTo((track[1][999] - mean) / deviation, 4)
  })

  it('centres a short last piece in its segment, with the track beside it where there is some', async () => {
    const length = SEGMENT + 10
    const track = [noise(length, 5), noise(length, 6)]
    const calls: Channels[] = []
    await createSegmentSeparator(passing(calls)).separate(track)
    const { mean, deviation } = standard(track)
    // The last 260 frames start at 750 and sit 370 into their segment, after
    // the 370 frames of the track before them. Past the track's end is silence.
    expect(calls[1][0][370]).toBeCloseTo((track[0][750] - mean) / deviation, 4)
    expect(calls[1][0][0]).toBeCloseTo((track[0][380] - mean) / deviation, 4)
    expect(calls[1][0][629]).toBeCloseTo((track[0][1009] - mean) / deviation, 4)
    expect(Array.from(calls[1][0].subarray(630))).toEqual(new Array(370).fill(0))
  })

  it.each([0, 0.5, 0.9])('gives the track back with an overlap of %s', async (overlap) => {
    const track = [noise(4321, 21), noise(4321, 22)]
    const stems = await createSegmentSeparator(passing(), { overlap }).separate(track)
    const { mean } = standard(track)
    for (const channel of [0, 1]) {
      const about = track[channel].map((sample) => sample - mean)
      expect(differenceDb(stems.other[channel], about)).toBeLessThan(-120)
    }
  })

  it.each([-0.2, 1, 25, Number.NaN])(
    'refuses an overlap of %s before a model is asked',
    (overlap) => {
      expect(() => createSegmentSeparator(passing(), { overlap })).toThrow(SeparationError)
    },
  )

  it('weighs each segment most in its middle where two overlap', async () => {
    // The first segment answers 1 everywhere and the second 2, so a frame
    // says how much of each it was given.
    let call = 0
    const model: SegmentModel = {
      sampleRate: 44100,
      segmentFrames: SEGMENT,
      run: () => {
        call += 1
        const level = (): Float32Array => new Float32Array(SEGMENT).fill(call)
        return Promise.resolve({
          vocals: [level(), level()],
          drums: silence(SEGMENT),
          bass: silence(SEGMENT),
          other: silence(SEGMENT),
        })
      },
    }
    const track = [noise(SEGMENT, 7), noise(SEGMENT, 8)]
    const stems = await createSegmentSeparator(model).separate(track)
    const { deviation } = standard(track)
    const back = (value: number): number => value * deviation
    // Before the second segment starts, the first alone.
    expect(stems.vocals[0][749]).toBeCloseTo(back(1), 5)
    // Frame 800 is 800 into the first, whose weight has fallen to 200 of 500,
    // and 50 into the second, whose weight has risen to 51 of 500.
    expect(stems.vocals[0][800]).toBeCloseTo(back((200 * 1 + 51 * 2) / 251), 5)
    expect(stems.vocals[1][999]).toBeCloseTo(back((1 * 1 + 250 * 2) / 251), 5)
  })

  it('gives silence for silence', async () => {
    const stems = await createSegmentSeparator(passing()).separate(silence(2000))
    for (const name of STEM_NAMES) {
      for (const channel of stems[name]) expect(peak(channel)).toBe(0)
    }
  })

  it('leaves a track’s standing off zero out of every stem', async () => {
    // A track 0.25 off zero. What the model answers comes back at the track's
    // level and about zero: the offset is no stem's.
    const about = [noise(1500, 3).map((v) => v * 0.1), noise(1500, 4).map((v) => v * 0.1)]
    const { mean } = standard(about)
    const track = about.map((channel) => channel.map((sample) => sample + 0.25))
    const stems = await createSegmentSeparator(passing()).separate(track)
    for (const channel of [0, 1]) {
      const centred = about[channel].map((sample) => sample - mean)
      expect(differenceDb(stems.other[channel], centred)).toBeLessThan(-100)
      expect(peak(stems.vocals[channel])).toBe(0)
    }
  })

  it('gives silence for a level that stands still', async () => {
    const level = (): Float32Array => new Float32Array(1500).fill(0.25)
    const stems = await createSegmentSeparator(passing()).separate([level(), level()])
    expect(stems.other[0].every(Number.isFinite)).toBe(true)
    expect(peak(stems.other[0])).toBeLessThan(1e-6)
  })

  it('reports each segment as it is done', async () => {
    const seen: string[] = []
    await createSegmentSeparator(passing()).separate([noise(2500, 1), noise(2500, 2)], {
      onProgress: ({ done, total }) => seen.push(`${done}/${total}`),
    })
    expect(seen).toEqual(['1/4', '2/4', '3/4', '4/4'])
  })

  it('stops when its signal fires, with the signal’s reason, and asks the model for nothing more', async () => {
    const controller = new AbortController()
    const calls: Channels[] = []
    const run = createSegmentSeparator(passing(calls)).separate([noise(4000, 1), noise(4000, 2)], {
      signal: controller.signal,
      onProgress: ({ done }) => {
        if (done === 2) controller.abort(new Error('the host gave up'))
      },
    })
    await expect(run).rejects.toThrow('the host gave up')
    expect(calls.length).toBe(2)
  })

  it('fails as its model fails', async () => {
    const model: SegmentModel = {
      ...passing(),
      run: () => Promise.reject(new Error('the session is gone')),
    }
    await expect(
      createSegmentSeparator(model).separate([noise(500, 1), noise(500, 2)]),
    ).rejects.toThrow('the session is gone')
  })

  it('refuses an answer that is not a segment long, and a track that is not two channels', async () => {
    const short: SegmentModel = {
      ...passing(),
      run: () => {
        const stems = {} as Record<StemName, Channels>
        for (const name of STEM_NAMES) stems[name] = silence(SEGMENT - 1)
        return Promise.resolve(stems)
      },
    }
    await expect(
      createSegmentSeparator(short).separate([noise(500, 1), noise(500, 2)]),
    ).rejects.toThrow(SeparationError)
    await expect(createSegmentSeparator(passing()).separate([noise(500, 1)])).rejects.toThrow(
      /two channels/,
    )
  })
})

/** A model that answers each stem of `gains` as the segment times that stem's gain. It says no stems of its own. */
function byGains<Name extends string>(
  gains: Record<Name, number>,
  calls: Channels[] = [],
): SegmentModel<Name> {
  const names = Object.keys(gains) as Name[]
  return {
    sampleRate: 44100,
    segmentFrames: SEGMENT,
    run: (segment) => {
      calls.push(segment)
      const stems = {} as Record<Name, Channels>
      for (const name of names) {
        stems[name] = segment.map((channel) => channel.map((sample) => sample * gains[name]))
      }
      return Promise.resolve(stems)
    },
  }
}

/** The same model, saying its stems: the names of `gains` in the order they are written. */
function naming<Name extends string>(
  gains: Record<Name, number>,
  calls: Channels[] = [],
): SegmentModel<Name> {
  return { ...byGains(gains, calls), stems: Object.keys(gains) as Name[] }
}

const FOUR = { vocals: 0.3, drums: 0.25, bass: 0.2, other: 0.15 }

describe('a model that names its stems, run over a whole track', () => {
  it('gives the same samples for a model that says no stems and for one that says the four', async () => {
    const track = [noise(4321, 31), noise(4321, 32)]
    const unsaid = createSegmentSeparator(byGains(FOUR))
    const said = createSegmentSeparator(naming(FOUR))
    const before = await unsaid.separate(track)
    const after = await said.separate(track)
    expect(Object.keys(after)).toEqual(Object.keys(before))
    for (const name of STEM_NAMES) {
      for (const channel of [0, 1]) {
        expect(peak(before[name][channel])).toBeGreaterThan(0)
        expect(after[name][channel]).toEqual(before[name][channel])
      }
    }
    expect(unsaid.stems).toEqual(['vocals', 'drums', 'bass', 'other'])
    expect(said.stems).toEqual(['vocals', 'drums', 'bass', 'other'])
  })

  it('answers with its model’s stems, in the model’s order, and says them', async () => {
    const track = [noise(4321, 33), noise(4321, 34)]
    const gains = { kick: 0.3, snare: 0.25, toms: 0.1, cymbals: 0.15, bass: 0.1, other: 0.05 }
    const separator = createSegmentSeparator(naming(gains))
    expect(separator.stems).toEqual(['kick', 'snare', 'toms', 'cymbals', 'bass', 'other'])
    const stems = await separator.separate(track)
    expect(Object.keys(stems)).toEqual(['kick', 'snare', 'toms', 'cymbals', 'bass', 'other'])
    const { mean } = standard(track)
    for (const channel of [0, 1]) {
      const toms = track[channel].map((sample) => (sample - mean) * 0.1)
      expect(stems.toms[channel].length).toBe(4321)
      expect(differenceDb(stems.toms[channel], toms)).toBeLessThan(-120)
    }
  })

  it('refuses an answer to a segment with a stem the model did not name, and names the stem', async () => {
    const track = [noise(500, 35), noise(500, 36)]
    // A model of the four that answers a fifth.
    const fifth: SegmentModel = {
      ...byGains(FOUR),
      run: (segment) => byGains({ ...FOUR, guitar: 0.05 }).run(segment),
    }
    const run = createSegmentSeparator(fifth).separate(track)
    await expect(run).rejects.toThrow(SeparationError)
    await expect(run).rejects.toThrow(/guitar/)

    const unnamed: SegmentModel<'kick' | 'snare'> = {
      ...naming({ kick: 0.3, snare: 0.2 }),
      run: (segment) => byGains({ kick: 0.3, snare: 0.2, toms: 0.1 }).run(segment),
    }
    await expect(createSegmentSeparator(unnamed).separate(track)).rejects.toThrow(/toms/)
  })

  it('refuses an answer to a segment without a stem the model named, and names the stem', async () => {
    const model: SegmentModel<'kick' | 'snare'> = {
      ...naming({ kick: 0.3, snare: 0.2 }),
      run: (segment) =>
        byGains({ kick: 0.3 }).run(segment) as Promise<Record<'kick' | 'snare', Channels>>,
    }
    const run = createSegmentSeparator(model).separate([noise(500, 37), noise(500, 38)])
    await expect(run).rejects.toThrow(SeparationError)
    await expect(run).rejects.toThrow(/nothing for snare/)
  })

  it.each<[string, string[], RegExp]>([
    ['an empty list', [], /stems are empty/],
    ['a name said twice', ['kick', 'kick'], /name kick twice/],
    ['a name of another shape', ['Kick'], /"Kick"/],
    ['the remainder', ['kick', 'remainder'], /name remainder/],
  ])('refuses %s among a model’s stems before the model is asked', (_name, stems, message) => {
    const calls: Channels[] = []
    const model: SegmentModel<string> = { ...byGains(FOUR, calls), stems }
    expect(() => createSegmentSeparator(model)).toThrow(SeparationError)
    expect(() => createSegmentSeparator(model)).toThrow(message)
    expect(calls).toEqual([])
  })

  it.each([
    ['shorter than a segment', 400, 1],
    ['several segments long', 4321, 6],
  ])(
    'says how many steps a track %s takes: the count its run reports',
    async (_name, length, steps) => {
      const separator = createSegmentSeparator(passing())
      expect(separator.steps?.(length)).toBe(steps)
      const seen: { done: number; total: number }[] = []
      await separator.separate([noise(length, 1), noise(length, 2)], {
        onProgress: (progress) => seen.push({ ...progress }),
      })
      expect(seen.map(({ done }) => done)).toEqual(
        Array.from({ length: steps }, (_unused, index) => index + 1),
      )
      expect(seen.every(({ total }) => total === steps)).toBe(true)
    },
  )
})
