// The counting family: which moments of a phrase sound on which turn. These
// ways change when a phrase's notes sound and never which notes, so they
// play a kit loop as they play a phrase of pitches. Every take is held to
// what a take keeps (./ways-support.ts).

import { describe, expect, it } from 'vitest'

import { FACTORY_SOUNDS } from '..'
import { cycled, looped, played } from '../sounds/recipe'
import { type FactorySound } from '../types'
import { VARIATION_LIMITS } from '../vary'
import { describeTake, playSound, wayTakes } from '../ways'
import { readSound } from '../ways/reading'
import { bankProblems } from './ways-support'

const COUNTING = ['counted-rests', 'leave-one-out', 'turning-rests', 'sliding-window']

type Sound = Pick<FactorySound, 'phrase' | 'durationSec'>

/** Eight moments, a note each, standing on the first. */
const eight = cycled(8, [
  [0, 1, 48],
  [1, 1, 60],
  [2, 1, 64],
  [3, 1, 67],
  [4, 1, 72],
  [5, 1, 76],
  [6, 1, 79],
  [7, 0.5, 84],
])
/** Eight moments that come back to the note the phrase stands on at the third and the sixth. */
const returning = cycled(8, [
  [0, 1, 48],
  [1, 1, 60],
  [2, 1, 48],
  [3, 1, 64],
  [4, 1, 67],
  [5, 1, 48],
  [6, 1, 72],
  [7, 0.5, 76],
])
/** Sixteen moments, a note each, standing on the first. */
const sixteen = cycled(
  8,
  Array.from(
    { length: 16 },
    (_, index) => [index / 2, 0.25, index === 0 ? 48 : 59 + index] as const,
  ),
)
const four = played(8, [
  [0, 1, 48],
  [1, 1, 55],
  [2, 1, 60],
  [3, 1, 64],
])
const chord = looped(16, 4, 2, [48, 55, 64, 71])

const momentsIn = (sound: Sound): number => readSound(sound).moments.length
/** The pitches of take `take`, one pass of them, in time order. */
const takePitches = (sound: Sound, way: string, take: number, far?: number): number[] =>
  readSound(playSound(sound, { way, seed: 1, far, take }))
    .moments.flatMap((moment) => moment.notes)
    .map((note) => note.note)
/** The pitches the way plays on turn `turn`: the take its round names there. */
const pitches = (sound: Sound, way: string, turn: number, far?: number): number[] => {
  const { round } = wayTakes(sound, { way, seed: 1, far })
  return takePitches(sound, way, round[turn % round.length], far)
}

const kits = FACTORY_SOUNDS.filter((each) => each.kit)

describe('counting', () => {
  it('Counted rests sounds each moment on the turns its count divides', () => {
    // Counts 1 2 3 2 1 2 3 2 by place: the first turn is the phrase as written.
    expect(pitches(eight, 'counted-rests', 0, 1)).toEqual([48, 60, 64, 67, 72, 76, 79, 84])
    expect(playSound(eight, { way: 'counted-rests', seed: 1, far: 1, take: 0 })).toBe(eight)
    expect(pitches(eight, 'counted-rests', 1, 1)).toEqual([48, 72])
    expect(pitches(eight, 'counted-rests', 2, 1)).toEqual([48, 60, 67, 72, 76, 84])
    expect(pitches(eight, 'counted-rests', 3, 1)).toEqual([48, 64, 72, 79])
    // The third moment has a count of 3: of the six turns of the round it sounds on two.
    const sounds = [0, 1, 2, 3, 4, 5].filter((turn) =>
      pitches(eight, 'counted-rests', turn, 1).includes(64),
    )
    expect(sounds).toEqual([0, 3])
    expect(wayTakes(eight, { way: 'counted-rests', seed: 1, far: 1 })).toEqual({
      takes: 4,
      round: [0, 1, 2, 3, 2, 1],
      cut: false,
    })
  })

  it('Counted rests counts a share of the moments at low far, and the rest always sound', () => {
    // Half of the six moments with a count above 1, spread evenly: the third, the sixth and the eighth.
    expect(pitches(eight, 'counted-rests', 1)).toEqual([48, 60, 67, 72, 79])
    expect(pitches(eight, 'counted-rests', 3)).toEqual([48, 60, 64, 67, 72, 79])
    expect(wayTakes(eight, { way: 'counted-rests', seed: 1 }).round).toEqual([0, 1, 2, 3, 2, 1])
    // The note the phrase stands on sounds wherever it comes, whatever its place counts.
    for (let turn = 0; turn < 6; turn += 1) {
      const sounding = pitches(returning, 'counted-rests', turn, 1)
      expect(
        sounding.filter((note) => note === 48),
        `turn ${turn}`,
      ).toHaveLength(3)
    }
  })

  it('Leave one out rests one moment a turn, each of them once, and never the first or the standing note', () => {
    // Five moments may rest: not the first, and not the two that come back to the standing note.
    expect(wayTakes(returning, { way: 'leave-one-out', seed: 1 })).toEqual({
      takes: 5,
      round: [0, 1, 2, 3, 4],
      cut: false,
    })
    const rested: number[] = []
    for (let turn = 0; turn < 5; turn += 1) {
      const sounding = pitches(returning, 'leave-one-out', turn)
      expect(sounding, `turn ${turn}`).toHaveLength(7)
      expect(sounding[0], `turn ${turn}`).toBe(48)
      expect(
        sounding.filter((note) => note === 48),
        `turn ${turn}`,
      ).toHaveLength(3)
      rested.push(...[60, 64, 67, 72, 76].filter((note) => !sounding.includes(note)))
    }
    expect(rested).toEqual([60, 64, 67, 72, 76])
  })

  it('Leave one out rests two past half of far, and visits eight moments of a long phrase', () => {
    expect(pitches(eight, 'leave-one-out', 0, 1)).toEqual([48, 64, 67, 76, 79, 84])
    expect(pitches(eight, 'leave-one-out', 1, 1)).toEqual([48, 60, 67, 72, 79, 84])
    expect(wayTakes(eight, { way: 'leave-one-out', seed: 1, far: 1 }).round).toEqual([
      0, 1, 2, 3, 4, 5, 6,
    ])
    // Fifteen moments may rest: eight of them do, spread through the phrase, and the round is whole.
    expect(wayTakes(sixteen, { way: 'leave-one-out', seed: 1 })).toEqual({
      takes: 8,
      round: [0, 1, 2, 3, 4, 5, 6, 7],
      cut: false,
    })
    const rested = [0, 1, 2, 3, 4, 5, 6, 7].map((turn) => {
      const sounding = pitches(sixteen, 'leave-one-out', turn)
      return sixteen.phrase.notes.slice(0, 16).findIndex((note) => !sounding.includes(note.note))
    })
    expect(rested).toEqual([1, 2, 4, 6, 8, 10, 12, 14])
  })

  it('Turning rests spreads its rests evenly and turns them a place each turn', () => {
    // Two of eight rest, four moments apart; the turn they come to the first moment, it sounds.
    expect(pitches(eight, 'turning-rests', 0)).toEqual([48, 64, 67, 72, 79, 84])
    expect(pitches(eight, 'turning-rests', 1)).toEqual([48, 60, 67, 72, 76, 84])
    expect(pitches(eight, 'turning-rests', 2)).toEqual([48, 60, 64, 72, 76, 79])
    expect(pitches(eight, 'turning-rests', 3)).toEqual([48, 60, 64, 67, 76, 79, 84])
    expect(wayTakes(eight, { way: 'turning-rests', seed: 1 })).toEqual({
      takes: 4,
      round: [0, 1, 2, 3],
      cut: false,
    })
    // Three of sixteen would take sixteen turns to come round a place at a time: they turn two.
    expect(wayTakes(sixteen, { way: 'turning-rests', seed: 1 })).toEqual({
      takes: 8,
      round: [0, 1, 2, 3, 4, 5, 6, 7],
      cut: false,
    })
  })

  it('Turning rests at far 1 rests no more than two moments in five, and neighbouring turns differ', () => {
    for (const each of [eight, returning, sixteen, ...kits.filter((kit) => momentsIn(kit) >= 8)]) {
      const { takes, round } = wayTakes(each, { way: 'turning-rests', seed: 1, far: 1 })
      expect(takes).toBeGreaterThanOrEqual(2)
      const moments = momentsIn(each)
      for (let take = 0; take < takes; take += 1) {
        const sounding = momentsIn(playSound(each, { way: 'turning-rests', seed: 1, far: 1, take }))
        expect(moments - sounding).toBeLessThanOrEqual(VARIATION_LIMITS.rests * moments)
      }
      round.forEach((take, turn) => expect(take).not.toBe(round[(turn + 1) % round.length]))
    }
    // Three of eight at far 1.
    expect(pitches(eight, 'turning-rests', 0, 1)).toHaveLength(5)
  })

  it('Sliding window sounds a window of the phrase that moves on by a quarter each turn', () => {
    // Half the phrase at the far it stands at; the first moment sounds outside the window too.
    expect(pitches(eight, 'sliding-window', 0)).toEqual([48, 60, 64, 67])
    expect(pitches(eight, 'sliding-window', 1)).toEqual([48, 64, 67, 72, 76])
    expect(pitches(eight, 'sliding-window', 2)).toEqual([48, 72, 76, 79, 84])
    expect(pitches(eight, 'sliding-window', 3)).toEqual([48, 60, 79, 84])
    expect(wayTakes(eight, { way: 'sliding-window', seed: 1 })).toEqual({
      takes: 4,
      round: [0, 1, 2, 3],
      cut: false,
    })
    // Far is the size of the window: a quarter of the phrase up to three quarters.
    expect(pitches(eight, 'sliding-window', 1, 0)).toEqual([48, 64, 67])
    expect(pitches(eight, 'sliding-window', 1, 1)).toEqual([48, 64, 67, 72, 76, 79, 84])
    // The standing note sounds wherever it comes.
    expect(pitches(returning, 'sliding-window', 2)).toEqual([48, 48, 67, 48, 72, 76])
  })

  it('Sliding window needs eight moments', () => {
    const refused = { takes: 0, round: [], cut: false, refusal: 'Needs a phrase of eight moments.' }
    expect(wayTakes(four, { way: 'sliding-window', seed: 1 })).toEqual(refused)
    const short = kits.filter((kit) => momentsIn(kit) > 1 && momentsIn(kit) < 8)
    expect(short.length).toBeGreaterThan(0)
    for (const kit of short) {
      expect(wayTakes(kit, { way: 'sliding-window', seed: 1 }), kit.id).toEqual(refused)
    }
  })

  it('needs a phrase: a held chord and a single moment are refused', () => {
    const single = kits.filter((kit) => momentsIn(kit) === 1)
    expect(single.length).toBeGreaterThan(0)
    for (const way of COUNTING) {
      expect(wayTakes(chord, { way, seed: 1 }).refusal, way).toBe('Needs a phrase.')
      for (const kit of single) {
        expect(wayTakes(kit, { way, seed: 1 }).takes, `${kit.id} ${way}`).toBe(0)
        expect(wayTakes(kit, { way, seed: 1 }).refusal, `${kit.id} ${way}`).toBeTruthy()
      }
    }
  })

  it('says what a take rests', () => {
    // Turning rests, first take: two of eight moments rest and nothing else is touched.
    expect(describeTake(eight, { way: 'turning-rests', seed: 1, take: 0 })).toEqual({
      sounding: 6,
      resting: 2,
      moved: 0,
      shifted: 0,
      added: 0,
    })
  })

  it('plays every kit loop of eight moments or more, and always its first moment', () => {
    const loops = kits.filter((kit) => momentsIn(kit) >= 8)
    expect(loops.length).toBeGreaterThan(0)
    for (const kit of loops) {
      const [first] = readSound(kit).moments
      for (const way of COUNTING) {
        const { takes } = wayTakes(kit, { way, seed: 1 })
        expect(takes, `${kit.id} ${way}`).toBeGreaterThanOrEqual(2)
        for (let take = 0; take < takes; take += 1) {
          const [starts] = readSound(playSound(kit, { way, seed: 1, take })).moments
          expect(starts.at, `${kit.id} ${way} take ${take}`).toBe(first.at)
          expect(
            starts.notes.map((note) => note.note),
            `${kit.id} ${way} take ${take}`,
          ).toEqual(first.notes.map((note) => note.note))
        }
      }
    }
  })

  it('keeps what a take keeps on every sound of the bank it fits', () => {
    expect(bankProblems(COUNTING, [3, 77])).toEqual([])
    const fitted: Record<string, { pitched: number; kit: number }> = {}
    for (const each of FACTORY_SOUNDS) {
      for (const way of COUNTING) {
        fitted[way] ??= { pitched: 0, kit: 0 }
        if (wayTakes(each, { way, seed: 3 }).takes === 0) continue
        if (each.kit) fitted[way].kit += 1
        else if (!each.source) fitted[way].pitched += 1
      }
    }
    // Each way has phrases of pitches and kit loops of the bank to play.
    for (const way of COUNTING) {
      expect(fitted[way].pitched, way).toBeGreaterThanOrEqual(20)
      expect(fitted[way].kit, way).toBeGreaterThanOrEqual(20)
    }
  }, 60_000)
})
