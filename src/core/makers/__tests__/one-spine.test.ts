import { describe, expect, it } from 'vitest'

import { ONE_SPINE, voicedSpine } from '../one-spine'
import { type MadePhraseNote } from '../phrase'
import { WHITE_KEYS, type MadeEvent, type MakerKey } from '../types'
import { A_MINOR, chord, line, made, makerContract, notesOf, PENTATONIC } from './support'

const PARTS = { pad: 1, bass: 1, arp: 1, bell: 1, drone: 1 }
/** Every part on an instrument of its own, so it can be told from the others. */
const INSTRUMENTS = Object.fromEntries(
  Object.keys(PARTS).map((part) => [part, { deviceId: 'flute' }]),
)

const hold = (seconds: number, note = 60) => chord([note], seconds)
const round = (value: number): number => Math.round(value * 1000) / 1000
const at = (phrase: readonly MadePhraseNote[]) =>
  phrase.map((note) => [round(note.atSec), note.note, round(note.durSec)])
/** The notes that begin at each time, rising. */
function struck(phrase: readonly MadePhraseNote[]): number[][] {
  const times = [...new Set(phrase.map((note) => round(note.atSec)))]
  return times.map((time) =>
    notesOf(phrase.filter((note) => round(note.atSec) === time)).sort((a, b) => a - b),
  )
}

describe('One Spine Five Roles: the first spine, Fmaj7 Em7 Dm7 Cmaj7', () => {
  const play = (role: number, more: Record<string, number> = {}) =>
    made(ONE_SPINE, hold(16), { params: { role, ...more } }, 20)

  it('pad: A3 C4 E4, G3 B3 D4, F3 A3 C4, E3 G3 B3, four seconds each', () => {
    expect(struck(play(0))).toEqual([
      [57, 60, 64],
      [55, 59, 62],
      [53, 57, 60],
      [52, 55, 59],
    ])
    expect(play(0).map((note) => [note.atSec, note.durSec])[3]).toEqual([4, 4])
  })

  it('bass: F2 E2 D2 C2', () => {
    expect(at(play(1))).toEqual([
      [0, 41, 4],
      [4, 40, 4],
      [8, 38, 4],
      [12, 36, 4],
    ])
  })

  it('arpeggio: up through each chord and down, a note a second', () => {
    expect(notesOf(play(2))).toEqual([
      69, 72, 76, 72, 67, 71, 74, 71, 65, 69, 72, 69, 64, 67, 71, 67,
    ])
    expect(at(play(2)).slice(0, 3)).toEqual([
      [0, 69, 1],
      [1, 72, 1],
      [2, 76, 1],
    ])
  })

  it('bell: the falling sevenths, E5 D5 C5 B4, let go before the chord is', () => {
    expect(at(play(3))).toEqual([
      [0, 76, 3],
      [4, 74, 3],
      [8, 72, 3],
      [12, 71, 3],
    ])
  })

  it('drone: the tonic, struck with each chord or held through them all', () => {
    expect(at(play(4))).toEqual([
      [0, 48, 4],
      [4, 48, 4],
      [8, 48, 4],
      [12, 48, 4],
    ])
    expect(at(play(4, { common: 1 }))).toEqual([[0, 48, 16]])
  })

  it('all five, each a part but the main role, at its level', () => {
    const all = made(
      ONE_SPINE,
      hold(4),
      { params: { role: 1, pad: 0.5, arp: 0.25, bell: 1, drone: 0.75 }, parts: INSTRUMENTS },
      4,
    )
    const of = (part?: string) =>
      all.filter((n) => n.part === part).map((n) => [n.note, round(n.gain)])
    expect(of()).toEqual([[41, 0.8]])
    expect(of('bass')).toEqual([])
    expect(of('pad')).toEqual([
      [57, 0.4],
      [60, 0.4],
      [64, 0.4],
    ])
    expect(of('arp')).toEqual([
      [69, 0.2],
      [72, 0.2],
      [76, 0.2],
      [72, 0.2],
    ])
    expect(of('bell')).toEqual([[76, 0.8]])
    expect(of('drone')).toEqual([[48, 0.6]])
  })
})

describe('One Spine Five Roles: the other spines', () => {
  const pads = (spine: number, key = WHITE_KEYS) => voicedSpine(key, spine).map((c) => c.close)
  const basses = (spine: number, key = WHITE_KEYS) => voicedSpine(key, spine).map((c) => c.bass)
  const classes = (notes: readonly number[]) => notes.map((n) => n % 12).sort((a, b) => a - b)

  it('two: Am G F Em over the falling bass A G F E', () => {
    expect(basses(1).slice(0, 4)).toEqual([45, 43, 41, 40])
    expect(pads(1).slice(0, 4).map(classes)).toEqual([
      [0, 4, 9],
      [2, 7, 11],
      [0, 5, 9],
      [4, 7, 11],
    ])
  })

  it('three: C Am Dm G', () => {
    expect(
      basses(2)
        .slice(0, 4)
        .map((n) => n % 12),
    ).toEqual([0, 9, 2, 7])
    expect(pads(2).slice(0, 4).map(classes)).toEqual([
      [0, 4, 7],
      [0, 4, 9],
      [2, 5, 9],
      [2, 7, 11],
    ])
  })

  it('four: C F Fm C, the one chord that leaves the key', () => {
    expect(pads(3).slice(0, 4)).toEqual([
      [52, 55, 60],
      [53, 57, 60],
      [53, 56, 60],
      [52, 55, 60],
    ])
    // In a minor key the fourth is minor, and its other third is the major one.
    expect(pads(3, A_MINOR).slice(1, 3)).toEqual([
      [50, 53, 57],
      [50, 54, 57],
    ])
  })

  it('walks the bass down the stairs under C G/B Am Em/G F C/E Dm G', () => {
    expect(basses(13)).toEqual([48, 47, 45, 43, 41, 40, 38, 43])
  })

  it('stays in the key but for the borrowed chord', () => {
    for (const key of [WHITE_KEYS, A_MINOR, PENTATONIC]) {
      const own = key.steps.map((step) => (key.root + step) % 12)
      for (let spine = 0; spine < 16; spine += 1) {
        const out = voicedSpine(key, spine).flatMap(({ close, bass }) =>
          [...close, bass].filter((note) => !own.includes(note % 12)),
        )
        expect(out, `spine ${spine}`).toHaveLength(spine === 3 && key.steps.length === 7 ? 2 : 0)
      }
    }
  })

  it('gives the same chords in twelve steps, and three-note chords in scales of five to twelve', () => {
    const chromatic: MakerKey = { root: 0, steps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }
    expect(pads(1, chromatic).slice(0, 4)).toEqual(pads(1).slice(0, 4))
    const scales = [
      [0, 3, 5, 7, 10],
      [0, 1, 5, 7, 8],
      [0, 2, 4, 6, 8, 10],
      [0, 2, 3, 5, 6, 8, 9, 11],
    ]
    for (const steps of scales) {
      for (let spine = 0; spine < 16; spine += 1) {
        for (const { close, bass } of voicedSpine({ root: 2, steps }, spine)) {
          expect(new Set(close.map((n) => n % 12)).size).toBe(3)
          expect(bass < close[0] && close[2] - close[0] <= 19).toBe(true)
        }
      }
    }
  })

  it('falls step by step in a scale of five too: A G F D on the F pentatonic', () => {
    expect(
      basses(0, PENTATONIC)
        .slice(0, 4)
        .map((n) => n % 12),
    ).toEqual([9, 7, 5, 2])
  })

  it('moves the voices of the pad little, at the end of the round as well', () => {
    for (let spine = 0; spine < 16; spine += 1) {
      const close = pads(spine)
      close.forEach((notes, i) => {
        const next = close[(i + 1) % 8]
        const moved = notes.reduce((sum, note, voice) => sum + Math.abs(note - next[voice]), 0)
        expect(moved, `spine ${spine} chord ${i}`).toBeLessThanOrEqual(15)
      })
    }
  })

  it('has sixteen that are unlike: no two share more than half of their chords, at any turn', () => {
    const written = Array.from({ length: 16 }, (_, spine) =>
      voicedSpine(WHITE_KEYS, spine).map(
        ({ close, bass }) => `${classes(close).join()}/${bass % 12}`,
      ),
    )
    for (let a = 0; a < 16; a += 1) {
      for (let b = a + 1; b < 16; b += 1) {
        for (let turn = 0; turn < 8; turn += 1) {
          const same = written[a].filter((c, i) => c === written[b][(i + turn) % 8]).length
          expect(same, `spines ${a} and ${b}, turned ${turn}`).toBeLessThanOrEqual(4)
          const under = basses(a).filter(
            (note, i) => note % 12 === basses(b)[(i + turn) % 8] % 12,
          ).length
          expect(under, `the basses of ${a} and ${b}, turned ${turn}`).toBeLessThanOrEqual(5)
        }
      }
    }
  })

  it('comes round to the first chord after eight', () => {
    const notes = made(ONE_SPINE, hold(20), { params: { role: 1, chord: 2 } }, 24)
    expect(notesOf(notes)).toEqual([41, 40, 38, 36, 33, 40, 41, 43, 41, 40])
  })
})

describe('One Spine Five Roles: the voicings', () => {
  const first = (voicing: number) => struck(made(ONE_SPINE, hold(2), { params: { voicing } }, 2))[0]

  it('lays A3 C4 E4 over F2 out in five ways', () => {
    expect(first(0)).toEqual([57, 60, 64])
    expect(first(1)).toEqual([57, 64, 72])
    expect(first(2)).toEqual([45, 60, 64])
    expect(first(3)).toEqual([53, 57, 60, 64])
    expect(first(4)).toEqual([57, 64])
  })

  it('gives the arpeggio the same tones', () => {
    const arp = made(ONE_SPINE, hold(4), { params: { role: 2, voicing: 3, steps: 8 } }, 4)
    expect(notesOf(arp)).toEqual([65, 69, 72, 76, 72, 69, 65, 69])
    expect(arp[1].atSec).toBe(0.5)
  })
})

describe('One Spine Five Roles: what the keys do', () => {
  const bass = { role: 1, chord: 2 }

  it('runs once, however many keys are held, and ends with the last', () => {
    const notes = made(
      ONE_SPINE,
      [...hold(3), { atSec: 1, durSec: 4, note: 67, gain: 0.8 }, ...chord([40, 43], 0.5, 2.5)],
      { params: bass },
      12,
    )
    expect(at(notes)).toEqual([
      [0, 41, 2],
      [2, 40, 2],
      [4, 38, 1],
    ])
  })

  it('counts on through a gap shorter than a chord, and starts over after a longer one', () => {
    const played = [...hold(0.5), ...chord([60], 1, 2.25), ...chord([60], 1, 5.5)]
    expect(at(made(ONE_SPINE, played, { params: bass }, 12))).toEqual([
      [0, 41, 0.5],
      [2.25, 40, 1],
      [5.5, 41, 1],
    ])
  })

  it('strikes the chord that is running with every key of a line, where it stands', () => {
    const played = line([
      [60, 0.5],
      [62, 0.5],
      [64, 1.5],
    ])
    expect(at(made(ONE_SPINE, played, { params: bass }, 12))).toEqual([
      [0, 41, 0.5],
      [0.5, 41, 0.5],
      [1, 41, 1],
      [2, 40, 0.5],
    ])
  })

  it('agrees with itself in another role: the same chord at the same time', () => {
    const bells = made(ONE_SPINE, hold(9), { params: { role: 3, chord: 3 } }, 12)
    const arp = made(ONE_SPINE, hold(9), { params: { role: 2, chord: 3 } }, 12)
    for (const bell of bells) {
      const under = arp.filter((n) => n.atSec >= bell.atSec && n.atSec < bell.atSec + 3)
      expect(Math.max(...notesOf(under))).toBe(bell.note)
    }
  })

  it('joins the arpeggio where it is when a key comes late in the chord', () => {
    const played = [...hold(0.5), ...chord([60], 1.5, 2.5)]
    expect(at(made(ONE_SPINE, played, { params: { role: 2 } }, 8))).toEqual([
      [0, 69, 0.5],
      [2.5, 76, 0.5],
      [3, 72, 1],
    ])
  })

  it('takes the loudness of the loudest key held', () => {
    const played = [
      { atSec: 0, durSec: 4, note: 60, gain: 0.3 },
      { atSec: 1, durSec: 3, note: 64, gain: 0.6 },
    ]
    const gains = made(ONE_SPINE, played, { params: bass }, 8).map((note) => note.gain)
    expect(gains).toEqual([0.3, 0.6])
  })

  it('moves the main role alone to the octave of the lowest key', () => {
    const played = (low: number) =>
      made(ONE_SPINE, hold(1, low), { params: { role: 1, keys: 1, bell: 1 } }, 2)
    expect(notesOf(played(40)).sort((a, b) => a - b)).toEqual([41, 76])
    expect(notesOf(played(53)).sort((a, b) => a - b)).toEqual([53, 76])
    expect(notesOf(played(28)).sort((a, b) => a - b)).toEqual([29, 76])
  })

  it('moves the spine to the degree of the lowest key, and the drone stays', () => {
    const played = (low: number) =>
      made(
        ONE_SPINE,
        hold(4, low),
        { params: { role: 1, chord: 1, keys: 2, drone: 1, common: 1 } },
        6,
      )
    // From D: G F E D, a step above F E D C.
    expect(notesOf(played(62)).map((n) => n % 12)).toEqual([0, 7, 5, 4, 2])
    expect(notesOf(played(60)).map((n) => n % 12)).toEqual([0, 5, 4, 2, 0])
  })

  it('does nothing with a key but run, when the keys give the time', () => {
    expect(made(ONE_SPINE, hold(8, 38), {}, 10)).toEqual(made(ONE_SPINE, hold(8, 91), {}, 10))
  })

  it('holds the notes two chords share, or strikes them again', () => {
    // Am to G to F to Em has none; C to Am over the third spine has C and E.
    const held = made(ONE_SPINE, hold(8), { params: { spine: 2, common: 1 } }, 10)
    expect(at(held).filter(([, note]) => note === 60 || note === 64)).toEqual([
      [0, 60, 8],
      [0, 64, 8],
    ])
    expect(made(ONE_SPINE, hold(8), { params: { spine: 2 } }, 10)).toHaveLength(6)
  })
})

describe('One Spine Five Roles: a control moved while it plays', () => {
  function playing(params: Record<string, number>, parts: string[] = []) {
    const maker = ONE_SPINE.create({ params, parts })
    const out: MadeEvent[] = []
    const emit = (event: MadeEvent): void => void out.push(event)
    maker.noteOn(0, 1, 60, 0.8)
    return {
      maker,
      to: (atSec: number) => {
        out.length = 0
        maker.advance(atSec, emit)
        return out.map((e) => [e.on ? 'on' : 'off', round(e.atSec), e.note])
      },
    }
  }

  it('strikes nothing again that stays, and changes the rest at once', () => {
    const { maker, to } = playing({})
    to(1)
    maker.setParam(1, 'voicing', 4)
    expect(to(1)).toEqual([['off', 1, 60]])
    maker.setParam(2, 'voicing', 3)
    expect(to(2)).toEqual([
      ['on', 2, 53],
      ['on', 2, 60],
    ])
    maker.setParam(2.5, 'bass', 0.5)
    expect(to(2.5)).toEqual([['on', 2.5, 41]])
    maker.setParam(3, 'bass', 0.9)
    expect(to(3)).toEqual([])
    maker.setParam(3.5, 'bass', 0)
    expect(to(3.5)).toEqual([['off', 3.5, 41]])
  })

  it('keeps its place in the chord when the chord length moves', () => {
    const { maker, to } = playing({ role: 1 })
    to(2)
    maker.setParam(2, 'chord', 8)
    // Half of the chord is over: four of its eight seconds are left.
    expect(to(5.9)).toEqual([])
    expect(to(6)).toEqual([
      ['off', 6, 41],
      ['on', 6, 40],
    ])
    expect(to(14)).toEqual([
      ['off', 14, 40],
      ['on', 14, 38],
    ])
  })

  it('turns the arpeggio over without striking twice', () => {
    const { maker, to } = playing({ role: 2 })
    to(1.5)
    for (let i = 0; i < 20; i += 1) maker.setParam(1.5 + i / 100, 'chord', 4 + i / 10)
    maker.setParam(1.8, 'steps', 8)
    expect(to(1.8)).toEqual([])
    expect(to(4).length).toBeGreaterThan(2)
  })

  it('moves another role to the main instrument', () => {
    const { maker, to } = playing({ bass: 1 }, ['pad', 'bass'])
    to(1)
    maker.setParam(1, 'role', 1)
    expect(to(1)).toEqual([
      ['off', 1, 41],
      ['off', 1, 57],
      ['off', 1, 60],
      ['off', 1, 64],
      ['on', 1, 41],
    ])
  })

  it('moves with the key, and leaves nothing hanging', () => {
    const { maker, to } = playing({ bell: 1, arp: 1, drone: 1, bass: 1 })
    to(3.5)
    maker.setKey(3.5, A_MINOR)
    to(4.2)
    maker.setParam(4.2, 'bell', 0)
    maker.noteOff(5, 1)
    to(5)
    expect(maker.next()).toBe(Infinity)
    expect(to(60)).toEqual([])
  })

  it('lives through very fast playing', () => {
    const { maker } = playing({ bell: 1, arp: 1, drone: 1, bass: 1, chord: 1, steps: 16 })
    const open = new Set<number>()
    const emit = (e: MadeEvent): void => void (e.on ? open.add(e.id) : open.delete(e.id))
    for (let i = 0; i < 200; i += 1) {
      maker.noteOn(i * 0.03, 10 + i, 40 + ((i * 7) % 48), 0.7)
      maker.noteOff(i * 0.03 + 0.02, 10 + i - (i % 2))
    }
    for (let i = 0; i < 200; i += 1) maker.noteOff(7, 10 + i)
    maker.noteOff(7, 1)
    maker.advance(7, emit)
    expect(open.size).toBe(0)
    expect(maker.next()).toBe(Infinity)
  })
})

makerContract(ONE_SPINE)
