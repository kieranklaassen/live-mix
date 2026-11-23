// `separateTrack` with stand-in separators: what a separator is handed, what
// comes back at the track's own rate and channels, the remainder that makes
// the five parts the track again, and the answers that are refused.

import { describe, expect, it } from 'vitest'

import { separateTrack } from '../separate'
import { SeparationError, type Channels, type Separator, type StemName } from '../types'
import { byGains, differenceDb, naming, noise, peak, scaled, sine, summed } from './support'

const SPLIT = { vocals: 0.3, drums: 0.25, bass: 0.2, other: 0.15 }

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

  it('refuses an answer that leaves a stem out, and names the stem', async () => {
    const track = { channels: [noise(3000, 14), noise(3000, 15)], sampleRate: 44100 }
    const without: Separator = {
      sampleRate: 44100,
      separate: async (channels) => {
        const stems: Partial<Record<StemName, Channels>> = await byGains(SPLIT).separate(channels)
        delete stems.bass
        return stems as Record<StemName, Channels>
      },
    }
    await expect(separateTrack(track, without)).rejects.toThrow(/nothing.*bass/)
  })

  it('refuses a separator that answers nothing at all as it refuses one that leaves a stem out', async () => {
    const track = { channels: [noise(3000, 14), noise(3000, 15)], sampleRate: 44100 }
    for (const nothing of [undefined, null]) {
      const silent: Separator = {
        sampleRate: 44100,
        separate: () => Promise.resolve(nothing as unknown as Record<StemName, Channels>),
      }
      const run = separateTrack(track, silent)
      await expect(run).rejects.toThrow(SeparationError)
      await expect(run).rejects.toThrow(/nothing.*vocals/)
    }
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

const SIX = { vocals: 0.2, drums: 0.18, bass: 0.15, guitar: 0.12, piano: 0.1, other: 0.08 }

/** Twelve stems of about the same level, a tenth of the track left over. */
const TWELVE = {
  lead: 0.11,
  backing: 0.07,
  kick: 0.1,
  snare: 0.09,
  toms: 0.05,
  cymbals: 0.06,
  bass: 0.12,
  guitar: 0.08,
  piano: 0.07,
  strings: 0.04,
  synth: 0.06,
  other: 0.05,
}

describe('separating a track with a separator that names its stems', () => {
  it.each([
    ['at the separator’s rate', 44100, 5000],
    ['at 48 kHz, with the separator at 44.1 kHz', 48000, 5003],
  ])(
    'gives six stems in order and a remainder that add up to a track %s',
    async (_name, sampleRate, frames) => {
      const track = { channels: [noise(frames, 21), noise(frames, 22)], sampleRate }
      const seen: Channels[] = []
      const separation = await separateTrack(track, naming(SIX, 44100, seen))
      expect(seen.length).toBe(1)
      expect(separation.names).toEqual(['vocals', 'drums', 'bass', 'guitar', 'piano', 'other'])
      expect(Object.keys(separation.stems)).toEqual(separation.names)
      expect(separation.sampleRate).toBe(sampleRate)
      for (const part of [...Object.values(separation.stems), separation.remainder]) {
        expect(part.map((channel) => channel.length)).toEqual([frames, frames])
      }
      for (const channel of [0, 1]) {
        expect(differenceDb(summed(separation, channel), track.channels[channel])).toBeLessThan(
          -130,
        )
        // Without one of the six the sum is not the track.
        expect(
          differenceDb(summed(separation, channel, 'piano'), track.channels[channel]),
        ).toBeGreaterThan(-40)
      }
      expect(separation.report.resampled).toBe(sampleRate !== 44100)
    },
  )

  it('says the four as its names for a separator that says none', async () => {
    const track = { channels: [noise(3000, 23), noise(3000, 24)], sampleRate: 44100 }
    const separation = await separateTrack(track, byGains(SPLIT))
    expect(separation.names).toEqual(['vocals', 'drums', 'bass', 'other'])
    expect(Object.keys(separation.stems)).toEqual(['vocals', 'drums', 'bass', 'other'])
  })

  it('gives one stem and a remainder that add up to the track', async () => {
    const track = { channels: [noise(5000, 25), noise(5000, 26)], sampleRate: 44100 }
    const separation = await separateTrack(track, naming({ vocals: 0.6 }))
    expect(separation.names).toEqual(['vocals'])
    expect(Object.keys(separation.stems)).toEqual(['vocals'])
    for (const channel of [0, 1]) {
      expect(differenceDb(summed(separation, channel), track.channels[channel])).toBeLessThan(-130)
      expect(
        differenceDb(separation.stems.vocals[channel], scaled(track.channels, 0.6)[channel]),
      ).toBeLessThan(-140)
    }
    expect(separation.report.remainderDb).toBeCloseTo(-7.96, 2)
  })

  it.each([
    ['at the separator’s rate', 44100, 5000],
    ['at 48 kHz, with the separator at 44.1 kHz', 48000, 5003],
  ])(
    'gives twelve stems and a remainder that add up to a track %s',
    async (_name, sampleRate, frames) => {
      const track = { channels: [noise(frames, 27), noise(frames, 28)], sampleRate }
      const separation = await separateTrack(track, naming(TWELVE))
      expect(separation.names).toEqual(Object.keys(TWELVE))
      // Thirteen parts added in single precision. Measured here: the sum is
      // 144.49 dB under the track at the separator's rate and 140.97 dB under
      // it from 48 kHz, and without the quietest stem it is 33.98 dB and
      // 30.77 dB under. The line is drawn 6 dB over the worse of the first two.
      for (const channel of [0, 1]) {
        const whole = differenceDb(summed(separation, channel), track.channels[channel])
        const broken = differenceDb(summed(separation, channel, 'strings'), track.channels[channel])
        expect(whole).toBeLessThan(-135)
        expect(broken).toBeGreaterThan(-135)
      }
    },
  )

  it('takes a name of lower-case letters, digits and hyphens that starts with a letter', async () => {
    const track = { channels: [noise(3000, 29), noise(3000, 30)], sampleRate: 44100 }
    const separation = await separateTrack(track, naming({ kick: 0.3, 'lead-2': 0.2, a: 0.1 }))
    expect(separation.names).toEqual(['kick', 'lead-2', 'a'])
    expect(Object.keys(separation.stems)).toEqual(['kick', 'lead-2', 'a'])
  })

  it.each<[string, string[], RegExp]>([
    ['an empty list', [], /stems are empty/],
    ['a name said twice', ['kick', 'snare', 'kick'], /name kick twice/],
    ['a capital', ['Kick'], /"Kick"/],
    ['a digit first', ['2nd'], /"2nd"/],
    ['a name every record has', ['__proto__'], /"__proto__"/],
    ['a slash', ['a/b'], /"a\/b"/],
    ['an empty name', ['kick', ''], /""/],
    ['the remainder', ['vocals', 'remainder'], /name remainder/],
  ])(
    'refuses %s among a separator’s stems before it asks the separator',
    async (_name, stems, message) => {
      const track = { channels: [noise(3000, 31), noise(3000, 32)], sampleRate: 48000 }
      const seen: Channels[] = []
      const separator: Separator<string> = { ...byGains(SPLIT, 44100, seen), stems }
      const run = separateTrack(track, separator)
      await expect(run).rejects.toThrow(SeparationError)
      await expect(run).rejects.toThrow(message)
      expect(seen).toEqual([])
    },
  )

  it('refuses an answer that leaves a named stem out, and names the stem', async () => {
    const track = { channels: [noise(3000, 33), noise(3000, 34)], sampleRate: 44100 }
    const without: Separator<'kick' | 'snare'> = {
      ...naming({ kick: 0.3, snare: 0.2 }),
      separate: (channels) =>
        naming({ kick: 0.3 }).separate(channels) as Promise<Record<'kick' | 'snare', Channels>>,
    }
    const run = separateTrack(track, without)
    await expect(run).rejects.toThrow(SeparationError)
    await expect(run).rejects.toThrow(/nothing.*snare/)
  })

  it('refuses an answer with a stem the separator did not name, and names the stem', async () => {
    const track = { channels: [noise(3000, 35), noise(3000, 36)], sampleRate: 44100 }
    // A separator of the four that answers a fifth: the fifth would be left in the remainder without a word.
    const fifth: Separator = {
      sampleRate: 44100,
      separate: async (channels) => {
        const stems = {
          ...(await byGains(SPLIT).separate(channels)),
          guitar: scaled(channels, 0.05),
        }
        return stems
      },
    }
    const run = separateTrack(track, fifth)
    await expect(run).rejects.toThrow(SeparationError)
    await expect(run).rejects.toThrow(/guitar/)

    const unnamed: Separator<'kick' | 'snare'> = {
      ...naming({ kick: 0.3, snare: 0.2 }),
      separate: (channels) => naming({ kick: 0.3, snare: 0.2, toms: 0.1 }).separate(channels),
    }
    await expect(separateTrack(track, unnamed)).rejects.toThrow(/toms/)
  })

  it('names a stem outside the four that is far louder than the track, or holds a value that is no number', async () => {
    const track = { channels: [noise(3000, 37), noise(3000, 38)], sampleRate: 44100 }
    const loud = separateTrack(track, naming({ kick: 0.3, snare: 5 }))
    await expect(loud).rejects.toThrow(SeparationError)
    await expect(loud).rejects.toThrow(/snare stem peaks/)

    const broken: Separator<'kick' | 'snare'> = {
      ...naming({ kick: 0.3, snare: 0.2 }),
      separate: async (channels) => {
        const stems = await naming({ kick: 0.3, snare: 0.2 }).separate(channels)
        stems.kick[0][99] = Infinity
        return stems
      },
    }
    const run = separateTrack(track, broken)
    await expect(run).rejects.toThrow(SeparationError)
    await expect(run).rejects.toThrow(/kick stem holds/)
  })

  it('stops with its signal’s reason when the signal fires while the stems are brought back to the track’s rate', async () => {
    const frames = 4800
    const track = {
      channels: [sine(frames, 440, 48000, 0.4), sine(frames, 1000, 48000, 0.4)],
      sampleRate: 48000,
    }
    const controller = new AbortController()
    const separator: Separator = {
      sampleRate: 44100,
      separate: async (channels) => {
        const stems = await byGains(SPLIT).separate(channels)
        // Fires after the separator has answered, on the first turn the run gives the event loop.
        setTimeout(() => controller.abort(new Error('closed the tab')), 0)
        return stems
      },
    }
    await expect(separateTrack(track, separator, { signal: controller.signal })).rejects.toThrow(
      'closed the tab',
    )
  })
})

describe('reading a separator’s answer', () => {
  it('reads the answer’s own keys only: a name every object answers to is still missing', async () => {
    const track = { channels: [noise(3000, 39), noise(3000, 40)], sampleRate: 44100 }
    const separator: Separator<'kick' | 'constructor'> = {
      ...naming({ kick: 0.3, constructor: 0.2 }),
      separate: (channels) =>
        naming({ kick: 0.3 }).separate(channels) as Promise<
          Record<'kick' | 'constructor', Channels>
        >,
    }
    const run = separateTrack(track, separator)
    await expect(run).rejects.toThrow(SeparationError)
    await expect(run).rejects.toThrow(/nothing.*constructor/)
  })
})
