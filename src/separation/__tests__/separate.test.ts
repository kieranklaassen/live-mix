// `separateTrack` with stand-in separators: what a separator is handed, what
// comes back at the track's own rate and channels, the remainder that makes
// the five parts the track again, and the answers that are refused.

import { describe, expect, it } from 'vitest'

import { separateTrack } from '../separate'
import {
  STEM_NAMES,
  SeparationError,
  type Channels,
  type Separation,
  type Separator,
  type StemName,
} from '../types'
import { differenceDb, noise, peak, sine } from './support'

const scaled = (channels: Channels, gain: number): Channels =>
  channels.map((channel) => channel.map((sample) => sample * gain))

/** A separator that answers each stem as the track times that stem's gain. */
function byGains(
  gains: Record<StemName, number>,
  sampleRate = 44100,
  seen: Channels[] = [],
): Separator {
  return {
    sampleRate,
    separate: (channels) => {
      seen.push(channels)
      const stems = {} as Record<StemName, Channels>
      for (const name of STEM_NAMES) stems[name] = scaled(channels, gains[name])
      return Promise.resolve(stems)
    },
  }
}

const SPLIT = { vocals: 0.3, drums: 0.25, bass: 0.2, other: 0.15 }

/** The five parts added up as a mixer adds them, in single precision. */
function summed(separation: Separation, channel: number): Float32Array {
  const out = new Float32Array(separation.remainder[channel].length)
  for (const part of [...STEM_NAMES.map((name) => separation.stems[name]), separation.remainder]) {
    for (let i = 0; i < out.length; i += 1) out[i] += part[channel][i]
  }
  return out
}

describe('separating a track', () => {
  it('gives five parts that add up to a stereo track', async () => {
    const track = { channels: [noise(5000, 1), noise(5000, 2)], sampleRate: 44100 }
    const separation = await separateTrack(track, byGains(SPLIT))
    expect(separation.sampleRate).toBe(44100)
    for (const channel of [0, 1]) {
      expect(differenceDb(summed(separation, channel), track.channels[channel])).toBeLessThan(-130)
      expect(
        differenceDb(separation.stems.vocals[channel], scaled(track.channels, 0.3)[channel]),
      ).toBeLessThan(-140)
    }
    // A tenth of the track is in no stem.
    expect(separation.report.remainderDb).toBeCloseTo(-20, 1)
    expect(separation.report.remainderPeak).toBeCloseTo(0.1 * peak(track.channels[0]), 2)
    expect(separation.report).toMatchObject({ modelSampleRate: 44100, resampled: false })
  })

  it('gives a mono track one channel a part, the mean of the two a separator answers', async () => {
    const track = { channels: [noise(5000, 3)], sampleRate: 44100 }
    const seen: Channels[] = []
    const separator: Separator = {
      sampleRate: 44100,
      separate: (channels) => {
        seen.push(channels)
        const silent = (): Channels => [new Float32Array(5000), new Float32Array(5000)]
        return Promise.resolve({
          vocals: [channels[0].map((s) => s * 0.5), channels[1].map((s) => s * 0.3)],
          drums: silent(),
          bass: silent(),
          other: silent(),
        })
      },
    }
    const separation = await separateTrack(track, separator)
    expect(seen[0].length).toBe(2)
    expect(seen[0][0]).toEqual(track.channels[0])
    expect(seen[0][1]).toEqual(track.channels[0])
    expect(separation.stems.vocals.length).toBe(1)
    expect(separation.remainder.length).toBe(1)
    expect(differenceDb(separation.stems.vocals[0], scaled(track.channels, 0.4)[0])).toBeLessThan(
      -140,
    )
    expect(differenceDb(summed(separation, 0), track.channels[0])).toBeLessThan(-130)
  })

  it('takes a track to the separator’s rate and brings the parts back to the track’s', async () => {
    const frames = 48000 + 7
    const track = {
      channels: [sine(frames, 440, 48000, 0.4), sine(frames, 1000, 48000, 0.4)],
      sampleRate: 48000,
    }
    const seen: Channels[] = []
    const separation = await separateTrack(track, byGains(SPLIT, 44100, seen))
    expect(seen[0].map((channel) => channel.length)).toEqual([44106, 44106])
    expect(separation.sampleRate).toBe(48000)
    for (const part of [...Object.values(separation.stems), separation.remainder]) {
      expect(part.map((channel) => channel.length)).toEqual([frames, frames])
    }
    expect(separation.report).toMatchObject({ modelSampleRate: 44100, resampled: true })
    // What the two resamplings lose is in the remainder, so the sum still holds.
    expect(differenceDb(summed(separation, 0), track.channels[0])).toBeLessThan(-130)
    expect(
      differenceDb(separation.stems.bass[1], scaled(track.channels, 0.2)[1], 400, frames - 400),
    ).toBeLessThan(-60)
  })

  it('reports no remainder when the stems add up to the track', async () => {
    const track = { channels: [noise(3000, 4), noise(3000, 5)], sampleRate: 44100 }
    const separation = await separateTrack(
      track,
      byGains({ vocals: 1, drums: 0, bass: 0, other: 0 }),
    )
    expect(peak(separation.remainder[0])).toBe(0)
    expect(separation.report.remainderDb).toBe(-Infinity)
    expect(separation.report.remainderPeak).toBe(0)
  })

  it('reports a remainder of half the track as 6.02 dB under it', async () => {
    const track = { channels: [noise(3000, 6), noise(3000, 7)], sampleRate: 44100 }
    const separation = await separateTrack(
      track,
      byGains({ vocals: 0.5, drums: 0, bass: 0, other: 0 }),
    )
    expect(separation.report.remainderDb).toBeCloseTo(-6.02, 2)
  })

  it('refuses a stem that holds a value that is no number, and names the stem', async () => {
    const track = { channels: [noise(3000, 8), noise(3000, 9)], sampleRate: 44100 }
    const separator: Separator = {
      sampleRate: 44100,
      separate: async (channels) => {
        const stems = await byGains(SPLIT).separate(channels)
        const bass = scaled(stems.bass, 1)
        bass[1][1234] = NaN
        return { ...stems, bass }
      },
    }
    const run = separateTrack(track, separator)
    await expect(run).rejects.toThrow(SeparationError)
    await expect(run).rejects.toThrow(/bass/)
  })

  it('refuses a stem far louder than the track, and takes one that is only louder', async () => {
    const track = { channels: [noise(3000, 10), noise(3000, 11)], sampleRate: 44100 }
    const loud = (gain: number): Separator => byGains({ ...SPLIT, drums: gain })
    await expect(separateTrack(track, loud(5))).rejects.toThrow(/drums/)
    await expect(separateTrack(track, loud(3))).resolves.toBeDefined()
  })

  it('refuses an answer that is not two channels of the length it was handed', async () => {
    const track = { channels: [noise(3000, 12), noise(3000, 13)], sampleRate: 44100 }
    const short: Separator = {
      sampleRate: 44100,
      separate: async (channels) => {
        const stems = await byGains(SPLIT).separate(channels)
        return { ...stems, other: stems.other.map((channel) => channel.subarray(0, 2999)) }
      },
    }
    await expect(separateTrack(track, short)).rejects.toThrow(/other/)
  })

  it('refuses a track with no frames or with three channels before asking the separator', async () => {
    const seen: Channels[] = []
    const separator = byGains(SPLIT, 44100, seen)
    await expect(
      separateTrack({ channels: [new Float32Array(0)], sampleRate: 44100 }, separator),
    ).rejects.toThrow(SeparationError)
    await expect(
      separateTrack(
        { channels: [noise(100), noise(100), noise(100)], sampleRate: 44100 },
        separator,
      ),
    ).rejects.toThrow(/one or two channels/)
    await expect(
      separateTrack({ channels: [noise(100), noise(99)], sampleRate: 44100 }, separator),
    ).rejects.toThrow(SeparationError)
    expect(seen).toEqual([])
  })

  it('stops with its signal’s reason and gives nothing back', async () => {
    const track = { channels: [noise(3000, 14), noise(3000, 15)], sampleRate: 44100 }
    const seen: Channels[] = []
    const before = new AbortController()
    before.abort(new Error('closed'))
    await expect(
      separateTrack(track, byGains(SPLIT, 44100, seen), { signal: before.signal }),
    ).rejects.toThrow('closed')
    expect(seen).toEqual([])

    // A separator that does not look at its signal: its answer is dropped all the same.
    const during = new AbortController()
    const deaf: Separator = {
      sampleRate: 44100,
      separate: (channels) => {
        during.abort(new Error('left the page'))
        return byGains(SPLIT).separate(channels)
      },
    }
    await expect(separateTrack(track, deaf, { signal: during.signal })).rejects.toThrow(
      'left the page',
    )
  })

  it('hands its options on to the separator', async () => {
    const track = { channels: [noise(3000, 16), noise(3000, 17)], sampleRate: 44100 }
    const seen: string[] = []
    const separator: Separator = {
      sampleRate: 44100,
      separate: (channels, options) => {
        options?.onProgress?.({ done: 1, total: 1 })
        return byGains(SPLIT).separate(channels)
      },
    }
    await separateTrack(track, separator, {
      onProgress: ({ done, total }) => seen.push(`${done}/${total}`),
    })
    expect(seen).toEqual(['1/1'])
  })
})
