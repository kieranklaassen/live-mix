// `joinSeparators` with stand-in separators: which stems a set says and
// keeps, whose arrays its answer holds, the sets that are refused when they
// are joined, the one count its progress rises by, and when it stops.

import { describe, expect, it } from 'vitest'

import { joinSeparators, type JoinMember } from '../join'
import { createSegmentSeparator, type SegmentModel } from '../segments'
import { separateTrack } from '../separate'
import { SeparationError, type Channels, type Separator, type StemName } from '../types'
import { byGains, differenceDb, naming, noise, scaled, sine, summed } from './support'

const FOUR = { vocals: 0.3, drums: 0.25, bass: 0.2, other: 0.15 }

const sound = (frames: number, seed: number): Channels => [
  noise(frames, seed),
  noise(frames, seed + 1),
]

/** `separator`, keeping what it was handed and what it answered, to see whose arrays an answer holds. */
function watched<Name extends string>(
  separator: Separator<Name>,
): { separator: Separator<Name>; handed: Channels[]; answers: Record<Name, Channels>[] } {
  const handed: Channels[] = []
  const answers: Record<Name, Channels>[] = []
  return {
    handed,
    answers,
    separator: {
      ...separator,
      separate: async (channels, options) => {
        handed.push(channels)
        const answer = await separator.separate(channels, options)
        answers.push(answer)
        return answer
      },
    },
  }
}

/** A turn of the event loop, in which a second separator would start were two run at once. */
const turn = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

describe('separators joined as one', () => {
  it('keeps three stems of a separator of the four and the vocals of a second, the second’s own arrays', async () => {
    const track = sound(3000, 1)
    const first = watched(naming(FOUR))
    const second = watched(naming({ vocals: 0.5 }))
    const joined = joinSeparators([
      { separator: first.separator, take: ['drums', 'bass', 'other'] },
      { separator: second.separator, take: ['vocals'] },
    ])
    expect(joined.sampleRate).toBe(44100)
    expect(joined.stems).toEqual(['drums', 'bass', 'other', 'vocals'])

    const answer = await joined.separate(track)
    expect(Object.keys(answer)).toEqual(['drums', 'bass', 'other', 'vocals'])
    expect(first.answers.length).toBe(1)
    expect(second.answers.length).toBe(1)
    expect(answer.vocals).toBe(second.answers[0].vocals)
    expect(answer.drums).toBe(first.answers[0].drums)
    expect(answer.bass).toBe(first.answers[0].bass)
    expect(answer.other).toBe(first.answers[0].other)
    // The first separator's vocals are in no stem of the answer.
    const dropped = first.answers[0].vocals
    for (const stem of Object.values(answer)) {
      expect(stem).not.toBe(dropped)
      for (const channel of stem) expect(dropped).not.toContain(channel)
    }
    // The channels handed to the first are the ones handed to the second.
    expect(first.handed[0]).toBe(track)
    expect(second.handed[0]).toBe(track)
  })

  it('keeps every stem of a separator whose take is left out, in the separator’s order, and the four of one that says none', async () => {
    const joined = joinSeparators([
      { separator: naming({ kick: 0.2, snare: 0.1 }) },
      { separator: byGains(FOUR) },
    ])
    expect(joined.stems).toEqual(['kick', 'snare', 'vocals', 'drums', 'bass', 'other'])
    const track = sound(2000, 3)
    const answer = await joined.separate(track)
    expect(Object.keys(answer)).toEqual(['kick', 'snare', 'vocals', 'drums', 'bass', 'other'])
    for (const channel of [0, 1]) {
      expect(differenceDb(answer.snare[channel], scaled(track, 0.1)[channel])).toBeLessThan(-140)
      expect(differenceDb(answer.bass[channel], scaled(track, 0.2)[channel])).toBeLessThan(-140)
    }
  })

  it('keeps one stem of each of four separators of the four, and runs each once, one after another', async () => {
    const track = sound(3000, 5)
    const log: string[] = []
    // Each answers every stem at a level of its own, after a turn of the event loop.
    const tuned = (label: string, gain: number) => {
      const inner = naming({ vocals: gain, drums: gain, bass: gain, other: gain })
      return watched<StemName>({
        ...inner,
        separate: async (channels, options) => {
          log.push(`${label} asked`)
          await turn()
          const answer = await inner.separate(channels, options)
          log.push(`${label} answered`)
          return answer
        },
      })
    }
    const a = tuned('a', 0.1)
    const b = tuned('b', 0.2)
    const c = tuned('c', 0.3)
    const d = tuned('d', 0.25)
    const joined = joinSeparators([
      { separator: a.separator, take: ['vocals'] },
      { separator: b.separator, take: ['drums'] },
      { separator: c.separator, take: ['bass'] },
      { separator: d.separator, take: ['other'] },
    ])
    expect(joined.stems).toEqual(['vocals', 'drums', 'bass', 'other'])

    const answer = await joined.separate(track)
    expect(Object.keys(answer)).toEqual(['vocals', 'drums', 'bass', 'other'])
    expect(answer.vocals).toBe(a.answers[0].vocals)
    expect(answer.drums).toBe(b.answers[0].drums)
    expect(answer.bass).toBe(c.answers[0].bass)
    expect(answer.other).toBe(d.answers[0].other)
    for (const channel of [0, 1]) {
      expect(differenceDb(answer.vocals[channel], scaled(track, 0.1)[channel])).toBeLessThan(-140)
      expect(differenceDb(answer.drums[channel], scaled(track, 0.2)[channel])).toBeLessThan(-140)
      expect(differenceDb(answer.bass[channel], scaled(track, 0.3)[channel])).toBeLessThan(-140)
      expect(differenceDb(answer.other[channel], scaled(track, 0.25)[channel])).toBeLessThan(-140)
    }
    for (const one of [a, b, c, d]) {
      expect(one.handed.length).toBe(1)
      expect(one.handed[0]).toBe(track)
    }
    expect(log).toEqual([
      'a asked',
      'a answered',
      'b asked',
      'b answered',
      'c asked',
      'c answered',
      'd asked',
      'd answered',
    ])
  })

  it('says the stems of a set of one in the order they are taken, and answers with those alone', async () => {
    const joined = joinSeparators([{ separator: naming(FOUR), take: ['other', 'vocals'] }])
    expect(joined.stems).toEqual(['other', 'vocals'])
    const track = sound(2000, 7)
    const answer = await joined.separate(track)
    expect(Object.keys(answer)).toEqual(['other', 'vocals'])
    for (const channel of [0, 1]) {
      expect(differenceDb(answer.other[channel], scaled(track, 0.15)[channel])).toBeLessThan(-140)
      expect(differenceDb(answer.vocals[channel], scaled(track, 0.3)[channel])).toBeLessThan(-140)
    }
  })

  it.each([
    ['at the separators’ rate', 44100],
    ['at 48 kHz, with the separators at 44.1 kHz', 48000],
  ])(
    'gives, through separateTrack, stems and a remainder that add up to a track %s, each stem its own separator’s',
    async (_name, sampleRate) => {
      const frames = 4800 + 7
      const track = {
        channels: [sine(frames, 440, sampleRate, 0.4), sine(frames, 1000, sampleRate, 0.4)],
        sampleRate,
      }
      // The first would give the vocals at a twentieth of the track, the second gives them at 0.3.
      const first = watched(naming({ ...FOUR, vocals: 0.05 }))
      const second = watched(naming({ vocals: 0.3 }))
      const joined = joinSeparators([
        { separator: first.separator, take: ['drums', 'bass', 'other'] },
        { separator: second.separator },
      ])
      const separation = await separateTrack(track, joined)
      expect(separation.names).toEqual(['drums', 'bass', 'other', 'vocals'])
      expect(Object.keys(separation.stems)).toEqual(['drums', 'bass', 'other', 'vocals'])
      expect(first.handed.length).toBe(1)
      expect(second.handed.length).toBe(1)
      for (const part of [...Object.values(separation.stems), separation.remainder]) {
        expect(part.map((channel) => channel.length)).toEqual([frames, frames])
      }
      // Measured here, at the worse of the two rates: the sum is 150.5 dB
      // under the track and 18.4 dB under it without the vocals, and from
      // 48 kHz the vocals are 103.6 dB from the second separator's and
      // 20.0 dB from what the first would have given.
      for (const channel of [0, 1]) {
        expect(differenceDb(summed(separation, channel), track.channels[channel])).toBeLessThan(
          -130,
        )
        // Without the second separator's stem the sum is not the track.
        expect(
          differenceDb(summed(separation, channel, 'vocals'), track.channels[channel]),
        ).toBeGreaterThan(-40)
        const inside = [400, frames - 400] as const
        expect(
          differenceDb(
            separation.stems.vocals[channel],
            scaled(track.channels, 0.3)[channel],
            ...inside,
          ),
        ).toBeLessThan(-60)
        expect(
          differenceDb(
            separation.stems.vocals[channel],
            scaled(track.channels, 0.05)[channel],
            ...inside,
          ),
        ).toBeGreaterThan(-30)
        expect(
          differenceDb(
            separation.stems.drums[channel],
            scaled(track.channels, 0.25)[channel],
            ...inside,
          ),
        ).toBeLessThan(-60)
      }
      // 0.25, 0.2, 0.15 and 0.3 are kept: a tenth of the track is in no stem.
      expect(separation.report.remainderDb).toBeCloseTo(-20, 0)
      expect(separation.report.modelSampleRate).toBe(44100)
    },
  )

  it('is typed by the stems it keeps, so a set that keeps the four goes where the four are asked for', async () => {
    const joined = joinSeparators([
      { separator: naming({ ...FOUR, guitar: 0.05 }), take: ['drums', 'bass', 'other'] },
      { separator: naming({ vocals: 0.3 }) },
    ])
    // No cast: the kept names are the four.
    const four: Separator = joined
    const separation = await separateTrack({ channels: sound(1000, 9), sampleRate: 44100 }, four)
    const names: readonly StemName[] | undefined = separation.names
    expect(names).toEqual(['drums', 'bass', 'other', 'vocals'])

    // @ts-expect-error A set that keeps a kick is no separator of the four.
    const kick: Separator = joinSeparators([{ separator: naming({ kick: 0.2, snare: 0.1 }) }])
    expect(kick.stems).toEqual(['kick', 'snare'])

    // A set that is not written where it is joined is a separator of any names.
    const set: JoinMember[] = [{ separator: naming({ kick: 0.2 }) }]
    const any: Separator<string> = joinSeparators(set)
    expect(any.stems).toEqual(['kick'])
  })
})

describe('a set that is refused when it is joined', () => {
  const refused = (join: () => unknown, message: RegExp): void => {
    expect(join).toThrow(SeparationError)
    expect(join).toThrow(message)
  }

  it('refuses an empty set', () => {
    refused(() => joinSeparators([]), /set of separators is empty/)
  })

  it('refuses a name kept twice across the set, and names it', () => {
    refused(
      () => joinSeparators([{ separator: naming(FOUR) }, { separator: naming({ vocals: 0.5 }) }]),
      /keeps vocals twice/,
    )
    refused(
      () =>
        joinSeparators([
          { separator: byGains(FOUR), take: ['drums'] },
          { separator: byGains(FOUR), take: ['bass', 'drums'] },
        ]),
      /keeps drums twice/,
    )
  })

  it('refuses a take of a stem its separator does not answer, and names the stem', () => {
    refused(
      () => joinSeparators([{ separator: naming({ vocals: 0.5 }), take: ['drums'] }]),
      /drums.*does not answer.*\[vocals\]/,
    )
    // A separator that says no stems answers the four.
    refused(
      () => joinSeparators([{ separator: byGains(FOUR), take: ['vocals', 'guitar'] }]),
      /guitar.*does not answer.*\[vocals, drums, bass, other\]/,
    )
  })

  it.each<[string, string[], RegExp]>([
    ['an empty take', [], /are empty/],
    ['a take that names a stem twice', ['drums', 'drums'], /name drums twice/],
    ['a take with a name of another shape', ['Drums'], /"Drums"/],
    ['a take of the remainder', ['drums', 'remainder'], /name remainder/],
  ])('refuses %s', (_name, take, message) => {
    refused(() => joinSeparators([{ separator: naming(FOUR), take }]), message)
  })

  it('refuses a separator whose own stems are no list of names', () => {
    const separator: Separator<string> = { ...byGains(FOUR), stems: ['Kick'] }
    refused(() => joinSeparators([{ separator }]), /"Kick"/)
  })

  it('refuses separators at two sample rates, and says both', () => {
    refused(
      () =>
        joinSeparators([
          { separator: naming({ drums: 0.2 }, 44100) },
          { separator: naming({ vocals: 0.3 }, 48000) },
        ]),
      /44100.*48000/,
    )
  })

  it('asks no separator of a set it refuses', () => {
    const seen: Channels[] = []
    expect(() =>
      joinSeparators([
        { separator: naming(FOUR, 44100, seen) },
        { separator: naming({ vocals: 0.5 }, 44100, seen) },
      ]),
    ).toThrow(SeparationError)
    expect(seen).toEqual([])
  })
})

describe('what a set holds each separator’s answer to', () => {
  const track = sound(1000, 11)

  /** A separator that names the stems of `named` and answers the stems of `answered`. */
  function answering<Name extends string>(
    named: Record<Name, number>,
    answered: Record<string, number>,
  ): Separator<Name> {
    return {
      ...naming(named),
      separate: (channels) => naming(answered).separate(channels),
    }
  }

  it('refuses an answer that leaves a kept stem out, and names the stem', async () => {
    const run = joinSeparators([
      { separator: naming({ vocals: 0.3 }) },
      { separator: answering({ drums: 0.2, bass: 0.2 }, { drums: 0.2 }) },
    ]).separate(track)
    await expect(run).rejects.toThrow(SeparationError)
    await expect(run).rejects.toThrow(/nothing for bass/)
  })

  it('refuses an answer that leaves out a stem its separator names and the set does not keep', async () => {
    const run = joinSeparators([
      { separator: answering({ drums: 0.2, bass: 0.2 }, { drums: 0.2 }), take: ['drums'] },
    ]).separate(track)
    await expect(run).rejects.toThrow(SeparationError)
    await expect(run).rejects.toThrow(/nothing for bass/)
  })

  it('refuses an answer with a stem its separator did not name, and names the stem', async () => {
    const run = joinSeparators([
      { separator: answering({ drums: 0.2 }, { drums: 0.2, guitar: 0.1 }) },
    ]).separate(track)
    await expect(run).rejects.toThrow(SeparationError)
    await expect(run).rejects.toThrow(/does not name, guitar/)
  })

  it('reads an answer’s own keys only: a name every object answers to is still missing', async () => {
    const run = joinSeparators([
      { separator: answering({ kick: 0.3, constructor: 0.2 }, { kick: 0.3 }), take: ['kick'] },
    ]).separate(track)
    await expect(run).rejects.toThrow(SeparationError)
    await expect(run).rejects.toThrow(/nothing for constructor/)
  })
})

/** A rate at which half a second, the most silence a later pass has in front, is 500 frames. */
const SLOW = 1000

/** A model of one stem that answers with what it was given, a segment of `segmentFrames` at a time. */
function passing<Name extends string>(
  name: Name,
  segmentFrames: number,
  calls: Channels[] = [],
): SegmentModel<Name> {
  return {
    sampleRate: SLOW,
    segmentFrames,
    stems: [name],
    run: (segment) => {
      calls.push(segment)
      const answer = {} as Record<Name, Channels>
      answer[name] = segment.map((channel) => channel.slice())
      return Promise.resolve(answer)
    },
  }
}

describe('the one count a set reports', () => {
  it('counts two segment separators of other segment lengths, one of them with two passes, as one run', async () => {
    const frames = 3000
    const long: Channels[] = []
    const short: Channels[] = []
    // Segments of 1000 start every 750 and segments of 600 every 450.
    const joined = joinSeparators([
      { separator: createSegmentSeparator(passing('vocals', 1000, long)) },
      { separator: createSegmentSeparator(passing('drums', 600, short), { shifts: 2, seed: 5 }) },
    ])
    const said = joined.steps?.(frames)
    const seen: { done: number; total: number; fed: number }[] = []
    await joined.separate(sound(frames, 13), {
      onProgress: ({ done, total }) => seen.push({ done, total, fed: long.length + short.length }),
    })
    // The first is four segments. The second is seven in its first pass, and
    // seven or eight in its second, by the silence that pass has in front.
    expect(long.length).toBe(4)
    expect([14, 15]).toContain(short.length)
    const segments = long.length + short.length
    expect(said).toBe(segments)
    expect(joined.steps?.(frames)).toBe(segments)
    expect(seen.map(({ done }) => done)).toEqual(
      Array.from({ length: segments }, (_unused, index) => index + 1),
    )
    expect(seen.every(({ total }) => total === segments)).toBe(true)
    // Each step is reported as its segment is done, not when its separator has answered.
    expect(seen.every(({ done, fed }) => done === fed)).toBe(true)
  })

  it('counts a separator that says no steps as one, when it has answered, and passes on nothing it reports itself', async () => {
    const frames = 1500
    const log: string[] = []
    const unsaid: Separator<'bass'> = {
      sampleRate: SLOW,
      stems: ['bass'],
      separate: (channels, options) => {
        log.push('asked')
        options?.onProgress?.({ done: 1, total: 3 })
        options?.onProgress?.({ done: 2, total: 3 })
        options?.onProgress?.({ done: 3, total: 3 })
        log.push('answered')
        return Promise.resolve({ bass: scaled(channels, 0.2) })
      },
    }
    // 1500 frames are two segments of 1000 and four of 600.
    const joined = joinSeparators([
      { separator: createSegmentSeparator(passing('vocals', 1000)) },
      { separator: unsaid },
      { separator: createSegmentSeparator(passing('drums', 600)) },
    ])
    expect(joined.steps?.(frames)).toBe(7)
    await joined.separate(sound(frames, 15), {
      onProgress: ({ done, total }) => log.push(`${done}/${total}`),
    })
    expect(log).toEqual(['1/7', '2/7', 'asked', 'answered', '3/7', '4/7', '5/7', '6/7', '7/7'])
  })

  it('counts a set of separators that say no steps one each, through separateTrack', async () => {
    const joined = joinSeparators([
      { separator: naming({ drums: 0.2 }) },
      { separator: naming({ vocals: 0.3 }) },
    ])
    expect(joined.steps?.(12345)).toBe(2)
    const seen: string[] = []
    await separateTrack({ channels: sound(1000, 17), sampleRate: 44100 }, joined, {
      onProgress: ({ done, total }) => seen.push(`${done}/${total}`),
    })
    expect(seen).toEqual(['1/2', '2/2'])
  })
})

describe('a set that is stopped', () => {
  const track = sound(3000, 19)

  /** A separator that does not look at its signal, and stops the run while it is at work. */
  function stopping<Name extends string>(
    gains: Record<Name, number>,
    controller: AbortController,
    reason: Error,
  ): Separator<Name> {
    const inner = naming(gains)
    return {
      ...inner,
      separate: (channels) => {
        controller.abort(reason)
        return inner.separate(channels)
      },
    }
  }

  it('does not ask the second separator when the signal fired during the first', async () => {
    const controller = new AbortController()
    const reason = new Error('left the page')
    const second = watched(naming({ vocals: 0.3 }))
    const joined = joinSeparators([
      { separator: stopping({ drums: 0.2 }, controller, reason) },
      { separator: second.separator },
    ])
    const seen: string[] = []
    await expect(
      joined.separate(track, {
        signal: controller.signal,
        onProgress: ({ done, total }) => seen.push(`${done}/${total}`),
      }),
    ).rejects.toBe(reason)
    expect(second.handed).toEqual([])
    // A step that was stopped is not counted.
    expect(seen).toEqual([])
  })

  it('asks no separator when the signal had fired before', async () => {
    const controller = new AbortController()
    const reason = new Error('closed')
    controller.abort(reason)
    const first = watched(naming({ drums: 0.2 }))
    const joined = joinSeparators([
      { separator: first.separator },
      { separator: naming({ vocals: 0.3 }) },
    ])
    await expect(joined.separate(track, { signal: controller.signal })).rejects.toBe(reason)
    expect(first.handed).toEqual([])
  })

  it('rejects when the signal fires while the second runs, and returns nothing of the first', async () => {
    const controller = new AbortController()
    const reason = new Error('the host gave up')
    const first = watched(naming({ drums: 0.2 }))
    const joined = joinSeparators([
      { separator: first.separator },
      { separator: stopping({ vocals: 0.3 }, controller, reason) },
    ])
    await expect(joined.separate(track, { signal: controller.signal })).rejects.toBe(reason)
    expect(first.answers.length).toBe(1)

    const again = new AbortController()
    const through = joinSeparators([
      { separator: naming({ drums: 0.2 }) },
      { separator: stopping({ vocals: 0.3 }, again, reason) },
    ])
    await expect(
      separateTrack({ channels: track, sampleRate: 44100 }, through, { signal: again.signal }),
    ).rejects.toBe(reason)
  })

  it('hands each separator the signal, so a second that looks at it stops within a segment', async () => {
    const controller = new AbortController()
    const reason = new Error('the host gave up')
    const calls: Channels[] = []
    // 3000 frames are four segments of 1000: the sixth step is the second separator's second.
    const joined = joinSeparators([
      { separator: createSegmentSeparator(passing('vocals', 1000)) },
      { separator: createSegmentSeparator(passing('drums', 1000, calls)) },
    ])
    const run = joined.separate(track, {
      signal: controller.signal,
      onProgress: ({ done }) => {
        if (done === 6) controller.abort(reason)
      },
    })
    await expect(run).rejects.toBe(reason)
    expect(calls.length).toBe(2)
  })
})

describe('a set whose separator fails', () => {
  it('rejects with that separator’s own error, and asks none after it', async () => {
    const failure = new Error('the service is down')
    const failing: Separator<'vocals'> = {
      sampleRate: 44100,
      stems: ['vocals'],
      separate: () => Promise.reject(failure),
    }
    const first = watched(naming({ drums: 0.2 }))
    const third = watched(naming({ bass: 0.2 }))
    const joined = joinSeparators([
      { separator: first.separator },
      { separator: failing },
      { separator: third.separator },
    ])
    await expect(joined.separate(sound(1000, 21))).rejects.toBe(failure)
    expect(first.handed.length).toBe(1)
    expect(third.handed).toEqual([])
  })
})
