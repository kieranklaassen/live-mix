// `splitPart` with stand-in separators: a part of a separation replaced, in
// its place, by a second separator's stems and what they leave of the part,
// the sums that still hold, the separation handed in left as it was, and the
// splits that are refused before the second separator is asked.

import { describe, expect, it } from 'vitest'

import { createSegmentSeparator, type SegmentModel } from '../segments'
import { separateTrack } from '../separate'
import { splitPart } from '../split'
import {
  SeparationError,
  type Channels,
  type Separation,
  type SeparationReport,
  type Separator,
} from '../types'
import { byGains, differenceDb, naming, noise, peak, scaled, sine, summed } from './support'

const SPLIT = { vocals: 0.3, drums: 0.25, bass: 0.2, other: 0.15 }

/** A second separator for the drums: a tenth of them is in none of its four. */
const KIT = { kick: 0.4, snare: 0.25, toms: 0.1, cymbals: 0.15 }

/** A second separator for the vocals: a fifth of them is in neither of its two. */
const VOICES = { lead: 0.55, backing: 0.25 }

/** Parts added up as a mixer adds them, in single precision, in the order given. */
function added(parts: readonly Channels[], channel: number): Float32Array {
  const out = new Float32Array(parts[0][channel].length)
  for (const part of parts) {
    for (let i = 0; i < out.length; i += 1) out[i] += part[channel][i]
  }
  return out
}

/** Every array of a separation, to see afterwards that it holds the same ones. */
function arraysOf(separation: Separation<string>): Float32Array[] {
  return [...Object.values(separation.stems), separation.remainder].flat()
}

/** What a separation holds, copied, to see afterwards that nothing in it was written to. */
function copyOf(separation: Separation<string>) {
  return {
    sampleRate: separation.sampleRate,
    names: [...(separation.names ?? [])],
    keys: Object.keys(separation.stems),
    samples: arraysOf(separation).map((channel) => Float32Array.from(channel)),
    report: { ...separation.report },
  }
}

/** Fails when `separation` is not what `copy` was taken of, array for array and sample for sample. */
function expectUntouched(
  separation: Separation<string>,
  arrays: readonly Float32Array[],
  copy: ReturnType<typeof copyOf>,
): void {
  expect(separation.sampleRate).toBe(copy.sampleRate)
  expect(separation.names).toEqual(copy.names)
  expect(Object.keys(separation.stems)).toEqual(copy.keys)
  const now = arraysOf(separation)
  expect(now.length).toBe(arrays.length)
  now.forEach((channel, index) => {
    expect(channel).toBe(arrays[index])
    expect(channel).toEqual(copy.samples[index])
  })
  expect(separation.report).toEqual(copy.report)
}

async function four(sampleRate = 44100, frames = 5000, channels = 2) {
  const track = {
    channels: Array.from({ length: channels }, (_, index) => noise(frames, 51 + index)),
    sampleRate,
  }
  return { track, separation: await separateTrack(track, byGains(SPLIT)) }
}

describe('splitting a part of a separation', () => {
  it('puts a second separator’s stems and what they leave in the place of the part', async () => {
    const { track, separation } = await four()
    const split = await splitPart(separation, 'drums', naming(KIT))

    expect(split.sampleRate).toBe(44100)
    expect(split.names).toEqual([
      'vocals',
      'kick',
      'snare',
      'toms',
      'cymbals',
      'drums',
      'bass',
      'other',
    ])
    expect(Object.keys(split.stems)).toEqual(split.names)
    // The parts that were not split and the remainder are the arrays they were, not copies.
    expect(split.remainder).toBe(separation.remainder)
    expect(split.stems.vocals).toBe(separation.stems.vocals)
    expect(split.stems.bass).toBe(separation.stems.bass)
    expect(split.stems.other).toBe(separation.stems.other)

    const { kick, snare, toms, cymbals, drums } = split.stems
    for (const channel of [0, 1]) {
      const old = separation.stems.drums[channel]
      // The five in the place of the drums are the drums. Measured here: the
      // five added in single precision are 162.56 dB under the old drums, and
      // 38.06 dB under without what the four leave.
      expect(differenceDb(added([kick, snare, toms, cymbals, drums], channel), old)).toBeLessThan(
        -150,
      )
      expect(differenceDb(added([kick, snare, toms, cymbals], channel), old)).toBeGreaterThan(-150)
      expect(
        differenceDb(kick[channel], scaled(separation.stems.drums, 0.4)[channel]),
      ).toBeLessThan(-140)
      // A tenth of the drums is in none of the four, and keeps the name.
      expect(
        differenceDb(drums[channel], scaled(separation.stems.drums, 0.1)[channel]),
      ).toBeLessThan(-140)
      // All nine are the track. Measured here: 150.51 dB under, and 38.06 dB
      // under without the toms.
      expect(differenceDb(summed(split, channel), track.channels[channel])).toBeLessThan(-144)
      expect(differenceDb(summed(split, channel, 'toms'), track.channels[channel])).toBeGreaterThan(
        -144,
      )
    }
  })

  it('reports the split and leaves the remainder’s figures as they were', async () => {
    const { separation } = await four()
    const split = await splitPart(separation, 'drums', naming(KIT))
    const { splits, ...remainder } = split.report
    expect(remainder).toEqual(separation.report)
    expect(splits?.length).toBe(1)
    expect(splits?.[0]).toMatchObject({
      part: 'drums',
      names: ['kick', 'snare', 'toms', 'cymbals', 'drums'],
      modelSampleRate: 44100,
      resampled: false,
    })
    // A tenth of the part is left: 20 dB under it.
    expect(splits?.[0].restDb).toBeCloseTo(-20, 1)
    expect(splits?.[0].restPeak).toBeCloseTo(0.1 * peak(separation.stems.drums[0]), 4)
    // A separation no part of which was split says nothing of splits.
    expect('splits' in separation.report).toBe(false)
  })

  it('brings a part to the second separator’s rate and its stems back to the track’s', async () => {
    const frames = 48000 + 7
    const track = {
      channels: [sine(frames, 440, 48000, 0.4), sine(frames, 1000, 48000, 0.4)],
      sampleRate: 48000,
    }
    const separation = await separateTrack(track, byGains(SPLIT, 44100))
    const seen: Channels[] = []
    const split = await splitPart(separation, 'drums', naming(KIT, 44100, seen))

    expect(seen.length).toBe(1)
    expect(seen[0].map((channel) => channel.length)).toEqual([44106, 44106])
    expect(split.sampleRate).toBe(48000)
    const { kick, snare, toms, cymbals, drums } = split.stems
    for (const part of [kick, snare, toms, cymbals, drums]) {
      expect(part.map((channel) => channel.length)).toEqual([frames, frames])
    }
    expect(split.report.splits?.[0]).toMatchObject({ modelSampleRate: 44100, resampled: true })
    for (const channel of [0, 1]) {
      // What the two resamplings lose of the part is in what is left of it,
      // so the sum still holds. Measured here: the five are 162.56 dB under
      // the old drums and 39.58 dB under without what the four leave, and the
      // nine are 144.49 dB under the track.
      const old = separation.stems.drums[channel]
      expect(differenceDb(added([kick, snare, toms, cymbals, drums], channel), old)).toBeLessThan(
        -150,
      )
      expect(differenceDb(added([kick, snare, toms, cymbals], channel), old)).toBeGreaterThan(-150)
      expect(differenceDb(summed(split, channel), track.channels[channel])).toBeLessThan(-138)
      expect(
        differenceDb(
          snare[channel],
          scaled(separation.stems.drums, 0.25)[channel],
          400,
          frames - 400,
        ),
      ).toBeLessThan(-60)
    }
  })

  it('gives a one-channel part one channel a stem, the mean of the two a separator answers', async () => {
    const { track, separation } = await four(44100, 5000, 1)
    const seen: Channels[] = []
    const uneven: Separator<'kick' | 'snare'> = {
      sampleRate: 44100,
      stems: ['kick', 'snare'],
      separate: (channels) => {
        seen.push(channels)
        return Promise.resolve({
          kick: [channels[0].map((s) => s * 0.5), channels[1].map((s) => s * 0.3)],
          snare: scaled(channels, 0.2),
        })
      },
    }
    const split = await splitPart(separation, 'drums', uneven)
    expect(seen[0].length).toBe(2)
    expect(seen[0][0]).toEqual(separation.stems.drums[0])
    expect(seen[0][1]).toEqual(separation.stems.drums[0])
    const { kick, snare, drums } = split.stems
    for (const part of [kick, snare, drums]) {
      expect(part.map((channel) => channel.length)).toEqual([5000])
    }
    expect(differenceDb(kick[0], scaled(separation.stems.drums, 0.4)[0])).toBeLessThan(-140)
    expect(differenceDb(added([kick, snare, drums], 0), separation.stems.drums[0])).toBeLessThan(
      -150,
    )
    expect(differenceDb(summed(split, 0), track.channels[0])).toBeLessThan(-144)
  })

  it('names what is left as its options say, and the part’s name is gone', async () => {
    const { track, separation } = await four()
    const split = await splitPart(separation, 'vocals', naming({ lead: 0.7 }), { rest: 'backing' })
    expect(split.names).toEqual(['lead', 'backing', 'drums', 'bass', 'other'])
    expect(Object.keys(split.stems)).toEqual(split.names)
    // @ts-expect-error the separation that comes back has no stem named vocals
    expect(split.stems.vocals).toBeUndefined()
    expect(split.report.splits?.[0]).toMatchObject({ part: 'vocals', names: ['lead', 'backing'] })
    for (const channel of [0, 1]) {
      expect(
        differenceDb(split.stems.backing[channel], scaled(separation.stems.vocals, 0.3)[channel]),
      ).toBeLessThan(-140)
      expect(
        differenceDb(
          added([split.stems.lead, split.stems.backing], channel),
          separation.stems.vocals[channel],
        ),
      ).toBeLessThan(-150)
      expect(differenceDb(summed(split, channel), track.channels[channel])).toBeLessThan(-144)
    }
  })

  it('takes a separator that names the part itself when what is left is named another way', async () => {
    const { separation } = await four()
    const split = await splitPart(separation, 'drums', naming({ drums: 0.6, cymbals: 0.3 }), {
      rest: 'room',
    })
    expect(split.names).toEqual(['vocals', 'drums', 'cymbals', 'room', 'bass', 'other'])
    expect(differenceDb(split.stems.drums[0], scaled(separation.stems.drums, 0.6)[0])).toBeLessThan(
      -140,
    )
  })

  it('splits a part that a split gave', async () => {
    const { track, separation } = await four()
    const once = await splitPart(separation, 'drums', naming(KIT))
    const twice = await splitPart(once, 'kick', naming({ 'kick-in': 0.6, 'kick-out': 0.3 }))
    expect(twice.names).toEqual([
      'vocals',
      'kick-in',
      'kick-out',
      'kick',
      'snare',
      'toms',
      'cymbals',
      'drums',
      'bass',
      'other',
    ])
    expect(twice.remainder).toBe(separation.remainder)
    expect(twice.stems.snare).toBe(once.stems.snare)
    expect(twice.stems.drums).toBe(once.stems.drums)
    expect(twice.report.splits?.map((entry) => entry.part)).toEqual(['drums', 'kick'])
    expect(once.report.splits?.map((entry) => entry.part)).toEqual(['drums'])
    for (const channel of [0, 1]) {
      expect(
        differenceDb(
          added([twice.stems['kick-in'], twice.stems['kick-out'], twice.stems.kick], channel),
          once.stems.kick[channel],
        ),
      ).toBeLessThan(-150)
      // Ten parts and the remainder. Measured here: 144.49 dB under the track.
      expect(differenceDb(summed(twice, channel), track.channels[channel])).toBeLessThan(-138)
    }
  })

  it.each([
    ['at the separators’ rate', 44100, 5000],
    ['at 48 kHz, with the separators at 44.1 kHz', 48000, 5003],
  ])(
    'gives eleven parts that add up to a track %s, the drums split in four and the vocals in two',
    async (_name, sampleRate, frames) => {
      const { track, separation } = await four(sampleRate, frames)
      const drums = await splitPart(separation, 'drums', naming(KIT))
      const eleven = await splitPart(drums, 'vocals', naming(VOICES))
      expect(eleven.names).toEqual([
        'lead',
        'backing',
        'vocals',
        'kick',
        'snare',
        'toms',
        'cymbals',
        'drums',
        'bass',
        'other',
      ])
      expect(eleven.remainder).toBe(separation.remainder)
      // Eleven parts added in single precision. Measured here: the sum is
      // 150.51 dB under the track at the separators' rate and 144.49 dB under
      // it from 48 kHz, and without the toms it is 38.06 dB and 34.47 dB
      // under. The line is drawn 6 dB over the worse of the first two.
      for (const channel of [0, 1]) {
        const whole = differenceDb(summed(eleven, channel), track.channels[channel])
        const broken = differenceDb(summed(eleven, channel, 'toms'), track.channels[channel])
        expect(whole).toBeLessThan(-138)
        expect(broken).toBeGreaterThan(-138)
      }
    },
  )

  it('splits a part that is silence into silence, and does not refuse it', async () => {
    const track = { channels: [noise(5000, 61), noise(5000, 62)], sampleRate: 44100 }
    const separation = await separateTrack(track, byGains({ ...SPLIT, drums: 0 }))
    expect(peak(separation.stems.drums[0])).toBe(0)
    // A model run by the segment runner, which brings what it is handed to a deviation of 1 first.
    const model: SegmentModel<'kick' | 'snare'> = {
      sampleRate: 44100,
      segmentFrames: 1000,
      stems: ['kick', 'snare'],
      run: (segment) =>
        Promise.resolve({ kick: scaled(segment, 0.5), snare: scaled(segment, 0.3) }),
    }
    const split = await splitPart(separation, 'drums', createSegmentSeparator(model))
    expect(split.names).toEqual(['vocals', 'kick', 'snare', 'drums', 'bass', 'other'])
    for (const part of [split.stems.kick, split.stems.snare, split.stems.drums]) {
      expect(part.map(peak)).toEqual([0, 0])
    }
    expect(split.report.splits?.[0]).toMatchObject({ restDb: -Infinity, restPeak: 0 })
  })

  it('refuses a stem far louder than the part, and names the stem and the part', async () => {
    const { separation } = await four()
    // Five times the drums is 1.25 times the track: over the part's limit, and under the track's.
    const loud = splitPart(separation, 'drums', naming({ kick: 5, snare: 0.2 }))
    await expect(loud).rejects.toThrow(SeparationError)
    await expect(loud).rejects.toThrow(/kick stem peaks.*drums part/)
    await expect(
      splitPart(separation, 'drums', naming({ kick: 3, snare: 0.2 })),
    ).resolves.toBeDefined()
  })

  it('hands its signal and its progress on to the separator, and not what it names the rest', async () => {
    const { separation } = await four()
    const controller = new AbortController()
    const handed: unknown[] = []
    const separator: Separator<'kick'> = {
      sampleRate: 44100,
      stems: ['kick'],
      separate: (channels, options) => {
        handed.push(options)
        options?.onProgress?.({ done: 1, total: 1 })
        return naming({ kick: 0.5 }).separate(channels)
      },
    }
    const seen: string[] = []
    await splitPart(separation, 'drums', separator, {
      rest: 'kit',
      signal: controller.signal,
      onProgress: ({ done, total }) => seen.push(`${done}/${total}`),
    })
    expect(seen).toEqual(['1/1'])
    expect(handed.length).toBe(1)
    expect(handed[0]).toMatchObject({ signal: controller.signal })
    expect(handed[0]).not.toHaveProperty('rest')
  })
})

describe('a split that is refused before the second separator is asked', () => {
  it.each<
    [string, (separation: Separation<string>, kit: Separator<string>) => Promise<unknown>, RegExp]
  >([
    ['a part the separation does not have', (s, kit) => splitPart(s, 'guitar', kit), /guitar/],
    ['the remainder', (s, kit) => splitPart(s, 'remainder', kit), /remainder/],
    [
      'a rest whose name another part has',
      (s, kit) => splitPart(s, 'drums', kit, { rest: 'other' }),
      /other/,
    ],
    ['a rest that is no name', (s, kit) => splitPart(s, 'drums', kit, { rest: 'Rest' }), /"Rest"/],
    [
      'a rest named remainder',
      (s, kit) => splitPart(s, 'drums', kit, { rest: 'remainder' }),
      /name remainder/,
    ],
    [
      'a rest named as one of the separator’s stems',
      (s, kit) => splitPart(s, 'drums', kit, { rest: 'snare' }),
      /snare/,
    ],
  ])('refuses %s', async (_name, run, message) => {
    const { separation } = await four()
    const arrays = arraysOf(separation)
    const copy = copyOf(separation)
    const seen: Channels[] = []
    const refused = run(separation, naming(KIT, 44100, seen))
    await expect(refused).rejects.toThrow(SeparationError)
    await expect(refused).rejects.toThrow(message)
    expect(seen).toEqual([])
    expectUntouched(separation, arrays, copy)
  })

  it('does not take the name of a part the separation’s type does not have', async () => {
    const { separation } = await four()
    const seen: Channels[] = []
    // @ts-expect-error a separation of the four has no part named guitar
    await expect(splitPart(separation, 'guitar', naming(KIT, 44100, seen))).rejects.toThrow(
      /guitar/,
    )
    // @ts-expect-error the remainder is no stem of a separation
    await expect(splitPart(separation, 'remainder', naming(KIT, 44100, seen))).rejects.toThrow(
      /remainder/,
    )
    expect(seen).toEqual([])
  })

  it('refuses a separator that names a part the separation has already', async () => {
    const { separation } = await four()
    const seen: Channels[] = []
    const run = splitPart(separation, 'drums', naming({ kick: 0.4, bass: 0.2 }, 44100, seen))
    await expect(run).rejects.toThrow(SeparationError)
    await expect(run).rejects.toThrow(/bass/)
    expect(seen).toEqual([])
  })

  it('refuses a separator that names the part itself while what is left keeps that name', async () => {
    const { separation } = await four()
    const seen: Channels[] = []
    const run = splitPart(separation, 'drums', naming({ drums: 0.6, cymbals: 0.3 }, 44100, seen))
    await expect(run).rejects.toThrow(SeparationError)
    await expect(run).rejects.toThrow(/drums.*options\.rest/)
    expect(seen).toEqual([])
  })

  it('refuses a separator whose stems are no list of names', async () => {
    const { separation } = await four()
    const seen: Channels[] = []
    const separator: Separator<string> = { ...byGains(KIT, 44100, seen), stems: ['kick', 'Snare'] }
    const run = splitPart(separation, 'drums', separator)
    await expect(run).rejects.toThrow(SeparationError)
    await expect(run).rejects.toThrow(/"Snare"/)
    expect(seen).toEqual([])
  })

  it('refuses a separation with no report: a split is of a separation the engine made', async () => {
    const { separation } = await four()
    const bare: Omit<Separation, 'report'> = {
      sampleRate: separation.sampleRate,
      names: separation.names,
      stems: separation.stems,
      remainder: separation.remainder,
    }
    const seen: Channels[] = []
    // @ts-expect-error a separation written by hand, with no report, is not one to split
    const run = splitPart(bare, 'drums', naming(KIT, 44100, seen))
    await expect(run).rejects.toThrow(SeparationError)
    await expect(run).rejects.toThrow(/report/)
    expect(seen).toEqual([])
  })

  it('refuses a separation written by hand with six stems and no names by its fifth stem’s name, with a report and without one', async () => {
    const part = (): Channels => [new Float32Array(8), new Float32Array(8)]
    const report: SeparationReport = {
      remainderDb: -20,
      remainderPeak: 0.1,
      modelSampleRate: 44100,
      resampled: false,
    }
    const six = {
      sampleRate: 44100,
      stems: {
        vocals: part(),
        drums: part(),
        bass: part(),
        other: part(),
        guitar: part(),
        piano: part(),
      },
      remainder: part(),
    }
    const seen: Channels[] = []
    const kit = naming(KIT, 44100, seen)
    for (const name of ['drums', 'guitar'] as const) {
      const reported = splitPart({ ...six, report }, name, kit)
      await expect(reported).rejects.toThrow(SeparationError)
      await expect(reported).rejects.toThrow(/holds the stem guitar/)
      // The names are read before the report is looked for.
      // @ts-expect-error a separation written by hand, with no report, is not one to split
      const bare = splitPart(six, name, kit)
      await expect(bare).rejects.toThrow(SeparationError)
      await expect(bare).rejects.toThrow(/holds the stem guitar/)
    }
    expect(seen).toEqual([])
  })
})

describe('the separation a split is handed', () => {
  it('holds the same names, arrays and samples after a split', async () => {
    const { separation } = await four(48000, 5003)
    const arrays = arraysOf(separation)
    const copy = copyOf(separation)
    const split = await splitPart(separation, 'drums', naming(KIT))
    expectUntouched(separation, arrays, copy)
    expect(split.names).not.toBe(separation.names)
    expect(split.stems).not.toBe(separation.stems)
    expect(split.report).not.toBe(separation.report)
  })

  it('holds the same after a split whose answer is refused', async () => {
    const { separation } = await four()
    const arrays = arraysOf(separation)
    const copy = copyOf(separation)
    await expect(splitPart(separation, 'drums', naming({ kick: 5, snare: 0.2 }))).rejects.toThrow(
      SeparationError,
    )
    expectUntouched(separation, arrays, copy)
  })

  it('holds the same after a split that is stopped, which gives nothing back', async () => {
    const { separation } = await four()
    const arrays = arraysOf(separation)
    const copy = copyOf(separation)

    const seen: Channels[] = []
    const before = new AbortController()
    before.abort(new Error('closed'))
    await expect(
      splitPart(separation, 'drums', naming(KIT, 44100, seen), { signal: before.signal }),
    ).rejects.toThrow('closed')
    expect(seen).toEqual([])

    // A separator that does not look at its signal: its answer is dropped all the same.
    const during = new AbortController()
    const deaf: Separator<keyof typeof KIT> = {
      ...naming(KIT),
      separate: (channels) => {
        during.abort(new Error('left the page'))
        return naming(KIT).separate(channels)
      },
    }
    await expect(splitPart(separation, 'drums', deaf, { signal: during.signal })).rejects.toThrow(
      'left the page',
    )
    expectUntouched(separation, arrays, copy)
  })
})
