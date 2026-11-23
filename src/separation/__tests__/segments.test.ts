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
function passing(calls: Channels[] = [], sampleRate = 44100): SegmentModel {
  return {
    sampleRate,
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

/**
 * A model that answers "other" as what it was given plus a ramp along the
 * segment, from 0 at its first frame up to 1, so that where a frame sits in
 * its segment shows in the answer.
 */
function ramped(calls: Channels[] = [], sampleRate = 44100): SegmentModel {
  return {
    sampleRate,
    segmentFrames: SEGMENT,
    run: (segment) => {
      calls.push(segment.map((channel) => channel.slice()))
      return Promise.resolve({
        vocals: silence(SEGMENT),
        drums: silence(SEGMENT),
        bass: silence(SEGMENT),
        other: segment.map((channel) => channel.map((sample, i) => sample + i / SEGMENT)),
      })
    },
  }
}

/** The frames of silence a channel begins with. */
function silentHead(channel: Float32Array): number {
  const at = channel.findIndex((sample) => sample !== 0)
  return at < 0 ? channel.length : at
}

/** The segments of a pass over `length` frames with `lead` frames of silence in front. */
const segmentsOf = (length: number, lead: number): number => Math.ceil((length + lead) / STRIDE)

/**
 * The silence each pass had in front of the track, read off what a model was
 * fed. The first pass has none. A later pass's is the count of silent frames
 * before the track's first, over as many segments as they fill, and the pass
 * is as many segments as that silence and the track take. `length` is at
 * least a segment, so the segment the track starts in is a whole one and not
 * a short piece sat in its middle.
 */
function leadsFed(calls: Channels[], length: number): number[] {
  const leads: number[] = []
  let at = 0
  while (at < calls.length) {
    let lead = 0
    if (leads.length > 0) {
      let silent = 0
      while (silentHead(calls[at + silent][0]) === SEGMENT) silent += 1
      lead = silent * STRIDE + silentHead(calls[at + silent][0])
    }
    leads.push(lead)
    at += segmentsOf(length, lead)
  }
  return leads
}

/** A model's rate at which half a second is 500 frames: the most silence a pass has in front, and less than a segment. */
const SLOW = 1000

describe('a track run more than once, at offsets drawn from a seed', () => {
  const runs = [400, 751, 4321].flatMap((length) =>
    [1, 2, 5].flatMap((shifts) =>
      [44100, 48000].map((sampleRate) => ({ length, shifts, sampleRate })),
    ),
  )

  it.each(runs)(
    'gives back a track of $length frames as the model answered it, run $shifts times at $sampleRate Hz',
    async ({ length, shifts, sampleRate }) => {
      const track = [noise(length, 41), noise(length, 42)]
      const calls: Channels[] = []
      const separator = createSegmentSeparator(passing(calls, sampleRate), { shifts })
      const stems = await separator.separate(track)
      const { mean } = standard(track)
      for (const channel of [0, 1]) {
        expect(stems.other[channel].length).toBe(length)
        const about = track[channel].map((sample) => sample - mean)
        expect(differenceDb(stems.other[channel], about)).toBeLessThan(-120)
        expect(peak(stems.vocals[channel])).toBe(0)
      }
      expect(calls.length).toBeGreaterThanOrEqual(shifts * Math.ceil(length / STRIDE))
      expect(calls.length).toBe(separator.steps?.(length))
    },
  )

  it('gives another answer with a second run where a frame’s place in its segment shows, the same for the same seed and another for another', async () => {
    const track = [noise(4321, 43), noise(4321, 44)]
    const once = await createSegmentSeparator(ramped()).separate(track)
    const twice = await createSegmentSeparator(ramped(), { shifts: 2 }).separate(track)
    const again = await createSegmentSeparator(ramped(), { shifts: 2 }).separate(track)
    const seeded = await createSegmentSeparator(ramped(), { shifts: 2, seed: 0 }).separate(track)
    const other = await createSegmentSeparator(ramped(), { shifts: 2, seed: 1 }).separate(track)
    for (const channel of [0, 1]) {
      // Measured: two runs are 19.6 dB under full scale from one, and the
      // two seeds 27 dB from each other. A second run on the first one's
      // grid measured 144 dB under, which is rounding.
      expect(differenceDb(twice.other[channel], once.other[channel])).toBeGreaterThan(-40)
      expect(again.other[channel]).toEqual(twice.other[channel])
      expect(seeded.other[channel]).toEqual(twice.other[channel])
      expect(differenceDb(other.other[channel], twice.other[channel])).toBeGreaterThan(-40)
    }
  })

  it('brings a seed to a whole number', async () => {
    const track = [noise(4321, 45), noise(4321, 46)]
    const run = (seed: number): Promise<Record<StemName, Channels>> =>
      createSegmentSeparator(ramped(), { shifts: 3, seed }).separate(track)
    const whole = await run(2)
    const between = await run(2.7)
    const none = await run(Number.NaN)
    const zero = await run(0)
    for (const channel of [0, 1]) {
      expect(between.other[channel]).toEqual(whole.other[channel])
      expect(none.other[channel]).toEqual(zero.other[channel])
      expect(differenceDb(whole.other[channel], zero.other[channel])).toBeGreaterThan(-40)
    }
  })

  it('runs once as it does with no count of runs, whatever the seed', async () => {
    const track = [noise(4321, 47), noise(4321, 48)]
    const calls: Channels[] = []
    const plain = await createSegmentSeparator(ramped()).separate(track)
    const one = await createSegmentSeparator(ramped(calls), { shifts: 1, seed: 99 }).separate(track)
    for (const name of STEM_NAMES) {
      for (const channel of [0, 1]) expect(one[name][channel]).toEqual(plain[name][channel])
    }
    expect(peak(plain.other[0])).toBeGreaterThan(0)
    expect(calls.length).toBe(6)
  })

  it('draws each later run’s offset from 0 to half a second, both ends among them, and the first run’s is 0', async () => {
    const length = 3000
    const track = [noise(length, 49), noise(length, 50)]
    const calls: Channels[] = []
    await createSegmentSeparator(passing(calls, SLOW), { shifts: 41 }).separate(track)
    const leads = leadsFed(calls, length)
    expect(leads.length).toBe(41)
    expect(leads[0]).toBe(0)
    for (const lead of leads) {
      expect(lead).toBeGreaterThanOrEqual(0)
      expect(lead).toBeLessThanOrEqual(500)
    }
    // Each run's offset is its own.
    expect(new Set(leads.slice(1)).size).toBeGreaterThan(1)

    // At 5 frames a second, half a second is two and a half frames: an
    // offset is 0, 1 or 2, and forty draws give each of them.
    const few: Channels[] = []
    await createSegmentSeparator(passing(few, 5), { shifts: 41 }).separate(track)
    const small = leadsFed(few, length)
    expect(small[0]).toBe(0)
    expect([...new Set(small.slice(1))].sort()).toEqual([0, 1, 2])
  })

  it('draws the same offsets for a second track and in a second separator of the same seed, and others for another seed', async () => {
    const fed = async (seed: number, length: number, from?: Channels[]): Promise<number[]> => {
      const calls = from ?? []
      const first = calls.length
      const separator = createSegmentSeparator(passing(calls, SLOW), { shifts: 4, seed })
      await separator.separate([noise(length, 51), noise(length, 52)])
      return leadsFed(calls.slice(first), length)
    }
    const calls: Channels[] = []
    const separator = createSegmentSeparator(passing(calls, SLOW), { shifts: 4, seed: 3 })
    await separator.separate([noise(3000, 53), noise(3000, 54)])
    const first = leadsFed(calls, 3000)
    const firstCalls = calls.length
    await separator.separate([noise(2500, 55), noise(2500, 56)])
    const second = leadsFed(calls.slice(firstCalls), 2500)
    expect(first.length).toBe(4)
    expect(second).toEqual(first)
    expect(await fed(3, 3000)).toEqual(first)
    expect(await fed(4, 3000)).not.toEqual(first)
  })

  it('hands a later run that much silence before the track, at the one scale of every run', async () => {
    const length = 3000
    // A track that stands off zero: silence in front of it would move its
    // mean and its deviation, were they taken again for a run.
    const track = [
      noise(length, 57).map((v) => v * 0.1 + 0.2),
      noise(length, 58).map((v) => v * 0.1),
    ]
    const calls: Channels[] = []
    await createSegmentSeparator(passing(calls, SLOW), { shifts: 3, seed: 11 }).separate(track)
    const { mean, deviation } = standard(track)
    const leads = leadsFed(calls, length)
    expect(leads.length).toBe(3)
    expect(calls[0][0][17]).toBeCloseTo((track[0][17] - mean) / deviation, 4)
    // The first segment of the second run, and of the third.
    const second = segmentsOf(length, 0)
    const firsts = [second, second + segmentsOf(length, leads[1])]
    for (const [index, lead] of leads.slice(1).entries()) {
      expect(lead).toBeGreaterThan(0)
      const segment = calls[firsts[index]]
      for (const channel of [0, 1]) {
        expect(silentHead(segment[channel])).toBe(lead)
        for (const frame of [0, 17, 499]) {
          expect(segment[channel][lead + frame]).toBeCloseTo(
            (track[channel][frame] - mean) / deviation,
            4,
          )
        }
      }
    }
  })

  it.each([
    ['at a rate where every offset is less than a segment', SLOW, 3000, 3],
    ['at 44.1 kHz', 44100, 4321, 4],
  ])(
    'counts its steps across every run %s: the count it said before, and the segments it was fed',
    async (_name, sampleRate, length, shifts) => {
      const calls: Channels[] = []
      const separator = createSegmentSeparator(passing(calls, sampleRate), { shifts, seed: 7 })
      const said = separator.steps?.(length)
      const seen: { done: number; total: number }[] = []
      await separator.separate([noise(length, 59), noise(length, 60)], {
        onProgress: (progress) => seen.push({ ...progress }),
      })
      const leads = leadsFed(calls, length)
      expect(leads.length).toBe(shifts)
      const segments = leads.reduce((sum, lead) => sum + segmentsOf(length, lead), 0)
      expect(calls.length).toBe(segments)
      expect(said).toBe(segments)
      expect(separator.steps?.(length)).toBe(segments)
      expect(seen.map(({ done }) => done)).toEqual(
        Array.from({ length: segments }, (_unused, index) => index + 1),
      )
      expect(seen.every(({ total }) => total === segments)).toBe(true)
    },
  )

  it('stops when its signal fires in the second run, and a run after it draws as one that was never stopped', async () => {
    const track = [noise(3000, 61), noise(3000, 62)]
    const controller = new AbortController()
    const calls: Channels[] = []
    const separator = createSegmentSeparator(ramped(calls, SLOW), { shifts: 3 })
    // The first run of 3000 frames is four segments: the sixth is in the second.
    const run = separator.separate(track, {
      signal: controller.signal,
      onProgress: ({ done }) => {
        if (done === 6) controller.abort(new Error('the host gave up'))
      },
    })
    await expect(run).rejects.toThrow('the host gave up')
    expect(calls.length).toBe(6)

    const after = await separator.separate(track)
    const fresh = await createSegmentSeparator(ramped([], SLOW), { shifts: 3 }).separate(track)
    for (const channel of [0, 1]) expect(after.other[channel]).toEqual(fresh.other[channel])
  })

  it.each([0, 1.5, -1, Number.NaN])(
    'refuses a count of %s runs before a model is asked',
    (shifts) => {
      const calls: Channels[] = []
      expect(() => createSegmentSeparator(passing(calls), { shifts })).toThrow(SeparationError)
      expect(calls).toEqual([])
    },
  )
})

/** The model of `passing`, saying that it is run on sound as it is. */
function asItIs(calls: Channels[] = [], sampleRate = 44100): SegmentModel {
  return { ...passing(calls, sampleRate), standardize: false }
}

describe('a model that says it is not run at a standard level', () => {
  /** A track that stands off zero and is far from a deviation of one. */
  const offZero = (length: number): Channels => [
    noise(length, 71).map((v) => v * 0.1 + 0.2),
    noise(length, 72).map((v) => v * 0.1),
  ]

  it('is handed the track’s own values, with silence past the track’s end', async () => {
    const length = SEGMENT + 10
    const track = offZero(length)
    const calls: Channels[] = []
    await createSegmentSeparator(asItIs(calls)).separate(track)
    expect(calls.length).toBe(2)
    for (const channel of [0, 1]) {
      expect(calls[0][channel]).toEqual(track[channel].subarray(0, SEGMENT))
      // The last 260 frames sit 370 into their segment, after the 370 frames
      // of the track before them.
      expect(calls[1][channel].subarray(0, 630)).toEqual(track[channel].subarray(380))
      expect(Array.from(calls[1][channel].subarray(630))).toEqual(new Array(370).fill(0))
    }
  })

  it('gives back what the model answered with no mean taken off and no level brought back', async () => {
    const track = offZero(4321)
    const stems = await createSegmentSeparator(asItIs()).separate(track)
    const { mean } = standard(track)
    for (const channel of [0, 1]) {
      expect(stems.other[channel].length).toBe(4321)
      // Measured: the answer is 150.5 dB under full scale from the track,
      // which is the rounding of the weights. From the track with its mean
      // taken off, which a standardized run answers, it is 20 dB under.
      const about = track[channel].map((sample) => sample - mean)
      expect(differenceDb(stems.other[channel], track[channel])).toBeLessThan(-120)
      expect(differenceDb(stems.other[channel], about)).toBeGreaterThan(-120)
      expect(peak(stems.vocals[channel])).toBe(0)
    }
  })

  it('gives a level that stands still back as that level', async () => {
    const level = (): Float32Array => new Float32Array(1500).fill(0.25)
    const calls: Channels[] = []
    const stems = await createSegmentSeparator(asItIs(calls)).separate([level(), level()])
    expect(calls[0][0].every((sample) => sample === 0.25)).toBe(true)
    // Measured: the level comes back to the bit. A standardized run answers
    // silence, which is 12 dB under full scale from the level.
    expect(differenceDb(stems.other[0], level())).toBeLessThan(-120)
  })

  it('is handed the track’s own values in every run, after each later run’s silence', async () => {
    const length = 3000
    const track = offZero(length)
    const calls: Channels[] = []
    const separator = createSegmentSeparator(asItIs(calls, SLOW), { shifts: 3, seed: 11 })
    const stems = await separator.separate(track)
    const leads = leadsFed(calls, length)
    expect(leads.length).toBe(3)
    expect(calls.length).toBe(separator.steps?.(length))
    // The first segment of each run: the first run's, the second's and the third's.
    const second = segmentsOf(length, 0)
    const firsts = [0, second, second + segmentsOf(length, leads[1])]
    for (const [index, lead] of leads.entries()) {
      if (index > 0) expect(lead).toBeGreaterThan(0)
      const segment = calls[firsts[index]]
      for (const channel of [0, 1]) {
        expect(silentHead(segment[channel])).toBe(lead)
        expect(segment[channel].subarray(lead)).toEqual(track[channel].subarray(0, SEGMENT - lead))
      }
    }
    for (const channel of [0, 1]) {
      // Measured: 147 dB under full scale from the track.
      expect(differenceDb(stems.other[channel], track[channel])).toBeLessThan(-120)
    }
  })

  it('leaves a model that says it is run at a standard level to the run of one that says nothing', async () => {
    const track = offZero(4321)
    for (const options of [{}, { shifts: 3, seed: 5 }]) {
      const unsaid = await createSegmentSeparator(ramped(), options).separate(track)
      const said = await createSegmentSeparator(
        { ...ramped(), standardize: true },
        options,
      ).separate(track)
      const not = await createSegmentSeparator(
        { ...ramped(), standardize: false },
        options,
      ).separate(track)
      for (const name of STEM_NAMES) {
        for (const channel of [0, 1]) expect(said[name][channel]).toEqual(unsaid[name][channel])
      }
      for (const channel of [0, 1]) {
        expect(peak(unsaid.other[channel])).toBeGreaterThan(0)
        // Measured: a run on the track as it is differs by 1.2 dB under
        // full scale with one run and by 1.6 dB with three.
        expect(differenceDb(not.other[channel], unsaid.other[channel])).toBeGreaterThan(-40)
      }
    }
  })
})
