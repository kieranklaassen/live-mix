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
    for (const channel of [0, 1]) {
      expect(stems.other[channel].length).toBe(length)
      expect(differenceDb(stems.other[channel], track[channel])).toBeLessThan(-120)
    }
    for (const call of calls) {
      expect(call.map((channel) => channel.length)).toEqual([SEGMENT, SEGMENT])
    }
    expect(calls.length).toBe(Math.ceil(length / STRIDE))
  })

  it('takes a track as it is by its mean and deviation, and hands the stems back as they were', async () => {
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
    const { mean, deviation } = standard(track)
    const back = (value: number): number => value * deviation + mean
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

  it('gives a level that stands still back as it was', async () => {
    const level = (): Float32Array => new Float32Array(1500).fill(0.25)
    const stems = await createSegmentSeparator(passing()).separate([level(), level()])
    expect(differenceDb(stems.other[0], level())).toBeLessThan(-120)
    expect(stems.other[0].every(Number.isFinite)).toBe(true)
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
