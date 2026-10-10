// The truth of the Sub Bass's display: its figures are the header's, there is
// one voice and it goes where the device's own rule sends it, the note is lit
// for as long as the device lets it sound, and what a knob does to a note
// that sounds shows on it.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  SUB_BASS_INSTRUMENT_FACES,
  subBassFall,
  subBassGiveBack,
  subBassKeyPitch,
  subBassLevel,
  subBassPitch,
  subBassPlay,
  subBassSample,
  subBassShare,
  subBassTone,
  subBassTouch,
  subBassVoice,
  subBassWave,
  type SubBassTimes,
  type SubBassTone,
  type SubBassVoice,
} from '../components/displays/instrument-sub-bass'
import { type DisplayNote } from '../components/plate-display'
import {
  drawDisplay,
  drawnPaths,
  runDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
  type DrawnPath,
} from './display-harness'

const stock = stockDescriptors()
const params = stock.get('sub-bass')?.params ?? {}
const { accent, ink } = PLAIN_COLOURS

const A1 = 55
const A2 = 110
const A3 = 220
const octaves = (hz: number): number => Math.log2(hz)

const note = (
  frequency: number,
  age: number,
  released: number | null = null,
  gain = 1,
): DisplayNote => ({ id: Math.round(frequency * 1000 + age * 10), frequency, gain, age, released })

const tone = (shape: number, harmonics: number, hz = 0, sampleRate = 48000): SubBassTone =>
  subBassTone(shape, harmonics, { second: 0, third: 0, fifth: 0, seventh: 0 }, hz, sampleRate)

/** The harness's plain patch: a quick start, the hold, a short release. */
const plain: SubBassTimes = { attack: 0.002, decay: 20, release: 0.05 }
/** Half a block of 128 frames at 48 kHz: keys nearer than that land together. */
const TOGETHER = 64 / 48000
const play = (notes: DisplayNote[], glide = 0, times: SubBassTimes = plain): SubBassVoice =>
  subBassPlay(notes, times, glide, TOGETHER, subBassVoice())

describe('the sub bass’s figures', () => {
  it('add the harmonics `SubBass::process` adds, in its proportions', () => {
    // `kSecond`, `kThird`: the second 6 dB and the third 10 dB under the fundamental.
    expect(tone(0, 1)).toEqual({ second: 0.5, third: 0.3162, fifth: 0, seventh: 0 })
    expect(tone(0, 0.5).second).toBeCloseTo(0.25, 9)
    // `kShapeThird`, `kShapeFifth`, `kShapeSeventh`: odd ones only, and nothing even.
    expect(tone(1, 0)).toEqual({ second: 0, third: 0.2682, fifth: 0.0966, seventh: 0.0204 })
    // Half way the third is there and the fifth and seventh have hardly started (-17.5, -32.3, -51.9 dB).
    const half = tone(0.5, 0)
    expect(20 * Math.log10(half.third)).toBeCloseTo(-17.45, 1)
    expect(20 * Math.log10(half.fifth)).toBeCloseTo(-32.34, 1)
    expect(20 * Math.log10(half.seventh)).toBeCloseTo(-51.87, 1)
    // Both knobs add to the third.
    expect(tone(1, 1).third).toBeCloseTo(0.2682 + 0.3162, 9)
  })

  it('fade a harmonic out as it climbs from 12 to 18 kHz, as `SubBass::fade` does', () => {
    // On a bass's own keys nothing fades.
    expect(tone(1, 1, A3)).toEqual(tone(1, 1))
    // At 2 kHz the seventh stands at 14 kHz, a third of the way through the fade; the fifth is whole.
    const high = tone(1, 1, 2000)
    expect(high.seventh).toBeCloseTo(0.0204 * (2 / 3), 6)
    expect(high.fifth).toBe(0.0966)
    // At 6 kHz the third is at 18 kHz and gone, the second at 12 kHz is whole.
    expect(tone(1, 1, 6000).third).toBe(0)
    expect(tone(1, 1, 6000).second).toBe(0.5)
    // A low sample rate brings the top of the band down: 0.42 of it.
    expect(tone(1, 1, 3500, 32000).third).toBeCloseTo((0.2682 + 0.3162) * (3 - 31500 / 13440), 6)
    expect(tone(1, 1, 3500, 48000).third).toBe(0.2682 + 0.3162)
  })

  it('make a wave that is odd in time and starts at its rising zero', () => {
    const full = tone(1, 1)
    expect(subBassWave(0, full)).toBeCloseTo(0, 12)
    expect(subBassWave(0.01, full)).toBeGreaterThan(0)
    for (const phase of [0.07, 0.25, 0.4])
      expect(subBassWave(1 - phase, full)).toBeCloseTo(-subBassWave(phase, full), 9)
    // With nothing added it is the sine.
    expect(subBassWave(0.25, tone(0, 0))).toBeCloseTo(1, 12)
    // Shape brings the peak down as the wave gets squarer.
    const peak = (t: SubBassTone): number =>
      Math.max(...Array.from({ length: 512 }, (_, i) => Math.abs(subBassWave(i / 512, t))))
    expect(peak(tone(1, 0))).toBeLessThan(0.85)
  })

  it('drive a loud note hard and let a tail go clean, without a change of level', () => {
    const sine = tone(0, 0)
    const cycle = (amp: number, drive: number): number[] =>
      Array.from({ length: 512 }, (_, i) => subBassSample(i / 512, sine, amp, drive))
    const rms = (wave: number[]): number =>
      Math.sqrt(wave.reduce((sum, v) => sum + v * v, 0) / wave.length)
    const peak = (wave: number[]): number => Math.max(...wave.map(Math.abs))
    // No drive: the wave times the loudness.
    expect(subBassSample(0.25, sine, 0.5, 0)).toBeCloseTo(0.5, 12)
    // `kMaxDrive` 1.25 into x - x³ + 3/5 x⁵ - 1/7 x⁷, which is held flat from ±1.
    const give = subBassGiveBack(1, 1, sine)
    expect(give).toBeCloseTo(
      Math.sqrt(1 + 1.5 * 1.5625 + (1.78 * 1.5625 ** 2) / 3.509375) / 1.25,
      9,
    )
    expect(subBassSample(0.25, sine, 1, 1)).toBeCloseTo((1 - 1 + 0.6 - 1 / 7) * give, 9)
    // Full drive on a full sine: within 2 dB of the clean note, and its top is flat.
    const driven = cycle(1, 1)
    expect(Math.abs(20 * Math.log10(rms(driven) / Math.SQRT1_2))).toBeLessThan(2)
    expect(peak(driven) / rms(driven)).toBeLessThan(1.2)
    // 30 dB down the same drive leaves a sine.
    const tail = cycle(0.03, 1)
    expect(peak(tail) / rms(tail)).toBeCloseTo(Math.SQRT2, 2)
    expect(Math.abs(20 * Math.log10(rms(tail) / (0.03 * Math.SQRT1_2)))).toBeLessThan(0.1)
    expect(subBassGiveBack(0, 1, sine)).toBe(1)
  })

  it('fall onto the key as `SubBass::start_fall` does: an exponential to a hundredth, cut off at Fall', () => {
    expect(subBassFall(0, 0.8)).toBeCloseTo(1, 12)
    // Half way: exp(-ln 100 / 2) is a tenth; stretched so that the cut is zero.
    expect(subBassFall(0.4, 0.8)).toBeCloseTo((0.1 - 0.01) / 0.99, 9)
    expect(subBassFall(0.8, 0.8)).toBe(0)
    expect(subBassFall(5, 0.8)).toBe(0)
    // Just short of Fall it is all but there.
    expect(subBassFall(0.799, 0.8)).toBeLessThan(0.0001)
  })

  it('rise, fall and fade as `SubBass::advance_level` does', () => {
    // Attack 1 s: an S that is half way at half its time.
    const slow: SubBassTimes = { attack: 1, decay: 20, release: 0.05 }
    expect(subBassLevel(0.1, null, 0, slow)).toBeCloseTo(0.028, 9)
    expect(subBassLevel(0.5, null, 0, slow)).toBeCloseTo(0.5, 9)
    expect(subBassLevel(0.9, null, 0, slow)).toBeCloseTo(0.972, 9)
    expect(subBassLevel(1.01, null, 0, slow)).toBe(1)
    // A strike over a sounding note rises from wherever the level is.
    expect(subBassLevel(0.5, null, 0.4, slow)).toBeCloseTo(0.7, 9)
    // The top of Decay holds for as long as the key is down.
    expect(subBassLevel(60, null, 0, slow)).toBe(1)
    // Decay: 60 dB down a Decay after the rise, and exact silence 120 dB down.
    const short: SubBassTimes = { attack: 0.002, decay: 0.5, release: 0.3 }
    expect(subBassLevel(0.502, null, 0, short)).toBeCloseTo(0.001, 9)
    expect(subBassLevel(1.02, null, 0, short)).toBe(0)
    // Release: 60 dB down a Release after the last key went up.
    expect(subBassLevel(0.402, 0.102, 0, short)).toBeCloseTo(0.001 ** (1 / 5 + 1), 9)
    expect(subBassLevel(0.8, 0.5, 0, { ...short, decay: 20 })).toBeCloseTo(0.001, 9)
    // A key let go half way up a 2 s rise fades from where the rise had got to.
    const swell: SubBassTimes = { attack: 2, decay: 20, release: 0.5 }
    expect(subBassLevel(1, 1, 0, swell)).toBeCloseTo(0.5, 9)
    expect(subBassLevel(1.25, 1, 0, swell)).toBeCloseTo(0.5 * Math.sqrt(0.001), 9)
    expect(subBassLevel(2.5, 1, 0, swell)).toBe(0)
  })

  it('play the softest key, and measure loudness over the 60 dB the knobs are named for', () => {
    // `kSoftestLevel`.
    expect(subBassTouch(0)).toBe(0.3)
    expect(subBassTouch(0.5)).toBeCloseTo(0.65, 9)
    expect(subBassTouch(1)).toBe(1)
    expect(subBassShare(1)).toBe(1)
    expect(subBassShare(Math.sqrt(0.001))).toBeCloseTo(0.5, 9)
    expect(subBassShare(0.001)).toBeCloseTo(0, 9)
    expect(subBassShare(0)).toBe(0)
  })
})

describe('the sub bass’s one voice', () => {
  it('drops a key struck from silence and lands it on the key after Fall', () => {
    const voice = play([note(A2, 0.3)])
    expect(voice.since).toBeCloseTo(0.3, 9)
    expect(voice.up).toBeNull()
    expect(voice.from).toBe(0)
    expect(voice.lead).toBe(0)
    expect(subBassPitch(voice, 0, 12, 0.8)).toBeCloseTo(octaves(A2) + 1, 9)
    expect(subBassPitch(voice, 0.4, 12, 0.8)).toBeCloseTo(octaves(A2) + 0.09 / 0.99, 9)
    expect(subBassPitch(voice, 0.8, 12, 0.8)).toBe(octaves(A2))
    // Drop 0 starts on the key, Glide or not.
    expect(subBassPitch(play([note(A2, 0.3)], 0.4), 0, 0, 0.04)).toBe(octaves(A2))
  })

  it('slides to a key pressed over a held one, in a straight line that arrives in Glide', () => {
    // An octave in 0.4 s: 300 cents up after 0.1 s, 600 after 0.2 s, there at 0.4 s.
    const voice = play([note(A2, 0.9), note(A3, 0.5)], 0.4)
    expect(voice.since).toBeCloseTo(0.5, 9)
    expect(subBassKeyPitch(voice, 0)).toBeCloseTo(octaves(A2), 9)
    expect(subBassKeyPitch(voice, 0.1)).toBeCloseTo(octaves(A2) + 0.25, 9)
    expect(subBassKeyPitch(voice, 0.2)).toBeCloseTo(octaves(A2) + 0.5, 9)
    expect(subBassKeyPitch(voice, 0.4)).toBeCloseTo(octaves(A3), 9)
    // It is struck again from where the level is: the held note was at full.
    expect(voice.from).toBe(1)
  })

  it('does not drop a key slid to, and lets a drop that is still falling fall on', () => {
    // The first key's fall is long over: 6 ms on the new key the pitch is the key's.
    const slid = play([note(A1, 1.2), note(A2, 0.2)])
    expect(subBassPitch(slid, 0.006, 24, 0.4)).toBeCloseTo(octaves(A2), 9)
    // Struck 0.1 s into the first key's fall of 0.8 s: what is left of that drop goes with it.
    const falling = play([note(A1, 0.3), note(A2, 0.2)])
    expect(falling.lead).toBeCloseTo(0.1, 9)
    expect(subBassPitch(falling, 0.01, 24, 0.8)).toBeCloseTo(
      octaves(A2) + 2 * subBassFall(0.11, 0.8),
      9,
    )
  })

  it('returns to the key under the one let go, without a new strike', () => {
    const voice = play([note(A2, 1), note(A3, 0.6, 0.2)], 0.4)
    // Still the second key's strike, and a key is still down.
    expect(voice.since).toBeCloseTo(0.6, 9)
    expect(voice.up).toBeNull()
    // Half the Glide after it went up the pitch is half way back.
    expect(subBassKeyPitch(voice, 0.4)).toBeCloseTo(octaves(A3), 9)
    expect(subBassKeyPitch(voice, 0.6)).toBeCloseTo(octaves(A3) - 0.5, 9)
    expect(subBassKeyPitch(voice, 0.8)).toBeCloseTo(octaves(A2), 9)
    // Letting an older key go leaves the playing one alone, and the last key up ends the note.
    const kept = play([note(A2, 1, 0.2), note(A3, 0.6)], 0.4)
    expect(subBassKeyPitch(kept, 0.6)).toBeCloseTo(octaves(A3), 9)
    expect(kept.up).toBeNull()
    expect(play([note(A2, 1, 0.5), note(A3, 0.6, 0.2)], 0.4).up).toBeCloseTo(0.4, 9)
  })

  it('sounds the newest of keys that land together out of silence at once, and drops it', () => {
    const chord = play([note(A1, 0.2), note(A2, 0.2), note(A3, 0.2)], 0.4)
    expect(subBassKeyPitch(chord, 0)).toBe(octaves(A3))
    expect(chord.lead).toBe(0)
    expect(chord.from).toBe(0)
    // A hundredth of a second apart the first has sounded: the second slides from it.
    const hand = play([note(A2, 0.21), note(A3, 0.2)], 0.4)
    expect(subBassKeyPitch(hand, 0)).toBeCloseTo(octaves(A2), 9)
    expect(subBassKeyPitch(hand, 0.2)).toBeCloseTo(octaves(A2) + 0.5, 9)
  })

  it('slides the keys of a chord that lands over a ringing note from that note, as the device does', () => {
    // `SubBass::note_on`: the first key is played apart and drops; the others find it held and
    // are slid to (`aim(kGlide)`) from where the pitch still is, the old note. Run on the header:
    // A1 let go and ringing, A2 and A3 together, Glide 0.4 s, was 6.779 after 0.2 s, 7.781 after 0.4 s.
    const times: SubBassTimes = { attack: 0.002, decay: 20, release: 3 }
    const chord = play([note(A1, 2, 1.5), note(A2, 1), note(A3, 1)], 0.4, times)
    expect(chord.lead).toBe(0)
    expect(subBassKeyPitch(chord, 0)).toBeCloseTo(octaves(A1), 9)
    expect(subBassKeyPitch(chord, 0.2)).toBeCloseTo(octaves(A1) + 1, 9)
    expect(subBassKeyPitch(chord, 0.4)).toBeCloseTo(octaves(A3), 9)
    // One key played apart over the same ringing note is on its pitch after 2 ms.
    const one = play([note(A1, 2, 1.5), note(A3, 1)], 0.4, times)
    expect(subBassKeyPitch(one, 0.002)).toBeCloseTo(octaves(A3), 9)
  })

  it('still slides from a held key that has died away, and strikes from nothing', () => {
    const times: SubBassTimes = { attack: 0.002, decay: 0.3, release: 0.05 }
    const voice = play([note(A2, 1.2), note(A3, 0.2)], 0.4, times)
    expect(voice.from).toBe(0)
    expect(voice.lead).toBeNull()
    // 35 ms in it is still over a thousand cents under the new key.
    const cents = 1200 * (subBassKeyPitch(voice, 0.035) - octaves(A3))
    expect(cents).toBeGreaterThan(-1150)
    expect(cents).toBeLessThan(-1000)
    expect(subBassPitch(voice, 0, 24, 0.8)).toBeCloseTo(octaves(A2), 9)
  })

  it('carries a ringing note into the drop of a key played apart', () => {
    const times: SubBassTimes = { attack: 0.002, decay: 20, release: 1 }
    const voice = play([note(A2, 1, 0.5), note(A3, 0.3)], 0.4, times)
    // Let go 0.2 s before the new strike: a fifth of the way down its 60 dB.
    expect(voice.from).toBeCloseTo(0.001 ** 0.2, 6)
    expect(voice.lead).toBe(0)
    // The pitch is led from the old key to the new one in 2 ms (`kJoinSeconds`), Glide or not.
    expect(subBassKeyPitch(voice, 0)).toBeCloseTo(octaves(A2), 9)
    expect(subBassKeyPitch(voice, 0.002)).toBeCloseTo(octaves(A3), 9)
    // The same key struck again is let go first: it is played apart and drops.
    const again = play([note(A2, 0.5, 0.2), note(A2, 0.2)], 0.4, times)
    expect(again.lead).toBe(0)
    expect(again.from).toBe(1)
  })

  it('does not jump to the top of a drop over a note that still sounds', () => {
    // `start_fall`, `join_`: the old note was 0.7 s into its own fall of 0.8 s. The pitch leaves
    // from what was left of that and is on the new curve 2 ms later (`kJoinSeconds`).
    const times: SubBassTimes = { attack: 0.002, decay: 20, release: 1 }
    const voice = play([note(A2, 1, 0.5), note(A3, 0.3)], 0.4, times)
    expect(voice.carry).toBeCloseTo(0.7, 9)
    const left = 2 * subBassFall(0.7, 0.8)
    expect(left).toBeGreaterThan(0.01)
    expect(subBassPitch(voice, 0, 24, 0.8)).toBeCloseTo(octaves(A2) + left, 9)
    expect(subBassPitch(voice, 0.001, 24, 0.8)).toBeCloseTo(
      octaves(A2) + 0.5 + 2 * subBassFall(0.001, 0.8) + (left - 2) / 2,
      9,
    )
    expect(subBassPitch(voice, 0.002, 24, 0.8)).toBeCloseTo(
      octaves(A3) + 2 * subBassFall(0.002, 0.8),
      9,
    )
    // With the old drop long over it rises from the old key itself.
    const late = play([note(A2, 3, 2.5), note(A3, 0.3)], 0.4, { ...times, release: 8 })
    expect(subBassPitch(late, 0, 24, 0.8)).toBeCloseTo(octaves(A2), 9)
    // Out of silence there is nothing to lead from: the strike starts at the top.
    expect(play([note(A2, 0.3)]).carry).toBeNull()
    // Two strikes in one block: the second leads from where the first found the pitch.
    const twice = play([note(A2, 1, 0.5), note(A1, 0.3, 0.3), note(A3, 0.3)], 0.4, times)
    expect(twice.carry).toBeCloseTo(0.7, 9)
    expect(subBassPitch(twice, 0, 24, 0.8)).toBeCloseTo(octaves(A2) + left, 9)
  })

  it('lets go a key that went down and up in one instant', () => {
    // Told the other way round it would be held for good.
    const tap = play([note(A2, 0.5, 0.5)])
    expect(tap.up).toBe(0)
    expect(subBassLevel(tap.since, tap.up, tap.from, plain)).toBe(0)
    // Over a held key it strikes the loudness again and the pitch stays with the held key.
    const over = play([note(A2, 1), note(A3, 0.5, 0.5)], 0.4)
    expect(over.up).toBeNull()
    expect(over.since).toBeCloseTo(0.5, 9)
    expect(over.from).toBe(1)
    expect(subBassKeyPitch(over, 0.2)).toBeCloseTo(octaves(A2), 9)
  })

  it('forgets a key struck again as its new strike comes, without a move', () => {
    // `SubBass::release_key`. A3 is held; in one instant a key goes down over it and A3 is struck
    // again. The stack was never empty, so both are slid to and the old drop falls on.
    const held = { ...note(A3, 1, 0.3), id: 7 }
    const voice = play([held, note(A2, 0.3), { ...note(A3, 0.3), id: 7 }], 0.4)
    expect(voice.lead).toBeCloseTo(0.7, 9)
    expect(voice.from).toBe(1)
    expect(subBassKeyPitch(voice, 0)).toBeCloseTo(octaves(A3), 9)
    // Struck again over a held key after the sound has died: it slides from where the pitch is,
    // its own key, and not from the key under it.
    const times: SubBassTimes = { attack: 0.002, decay: 0.3, release: 0.05 }
    const dead = play(
      [note(A2, 3), { ...note(A3, 2, 0.2), id: 7 }, { ...note(A3, 0.2), id: 7 }],
      0.4,
      times,
    )
    expect(dead.from).toBe(0)
    expect(dead.lead).toBeNull()
    expect(subBassKeyPitch(dead, 0)).toBeCloseTo(octaves(A3), 9)
    // Let go in earnest, the voice had gone back to the key under it and slides from there.
    const gone = play([note(A2, 3), note(A3, 2, 0.2), { ...note(A3, 0.2), id: 7 }], 0.4, times)
    expect(subBassKeyPitch(gone, 0)).toBeCloseTo(octaves(A2), 9)
  })

  it('holds sixteen keys: a seventeenth forgets the oldest', () => {
    const keys = (released: (n: number) => number | null): DisplayNote[] =>
      Array.from({ length: 17 }, (_, n) =>
        note(A1 * Math.pow(2, n / 12), 2 - n * 0.05, released(n)),
      )
    // Seventeen held: the newest plays.
    const pile = play(
      keys(() => null),
      0.01,
    )
    expect(subBassKeyPitch(pile, pile.since)).toBeCloseTo(octaves(A1) + 16 / 12, 9)
    expect(pile.up).toBeNull()
    // Every key but the first let go: the first was forgotten, so nothing is held.
    const emptied = play(
      keys((n) => (n === 0 ? null : 0.5)),
      0.01,
    )
    expect(emptied.up).not.toBeNull()
    // With sixteen the first is still there to return to.
    const sixteen = play(keys((n) => (n === 0 ? null : 0.5)).slice(0, 16), 0.01)
    expect(sixteen.up).toBeNull()
    expect(subBassKeyPitch(sixteen, sixteen.since)).toBeCloseTo(octaves(A1), 9)
  })
})

describe('the sub bass’s display', () => {
  const { display, face } = SUB_BASS_INSTRUMENT_FACES['sub-bass']
  const run = (values: Record<string, number>, notes: DisplayNote[]) =>
    runDisplay(display, params, 0.1, { values, notes, signal: testSignal() })
  /** What is painted in the accent: the body of the note that sounds, and its wave. */
  const lit = (paths: DrawnPath[]): DrawnPath[] => paths.filter((path) => path.colour === accent)
  const bodies = (paths: DrawnPath[]): DrawnPath[] =>
    lit(paths).filter((path) => path.kind === 'fill' && path.points.length > 2)
  const waves = (paths: DrawnPath[]): DrawnPath[] =>
    lit(paths).filter((path) => path.kind === 'stroke' && path.points.length > 2)
  const body = (values: Record<string, number>, notes: DisplayNote[]): DrawnPath =>
    bodies(drawnPaths(run(values, notes)))[0]
  const wave = (values: Record<string, number>, notes: DisplayNote[]): DrawnPath =>
    waves(drawnPaths(run(values, notes)))[0]
  /** A body is its upper edge from the strike to now and its lower edge back again. */
  const start = (path: DrawnPath): { middle: number; thick: number } => {
    const upper = path.points[0][1]
    const lower = path.points[path.points.length - 1][1]
    return { middle: (upper + lower) / 2, thick: lower - upper }
  }
  const head = (path: DrawnPath): { x: number; middle: number; thick: number } => {
    const n = path.points.length / 2
    const [x, upper] = path.points[n - 1]
    const lower = path.points[n][1]
    return { x, middle: (upper + lower) / 2, thick: lower - upper }
  }
  /** Where the key's own pitch lies: the Decay handle stands on it. */
  const keyLine = (values: Record<string, number> = {}): number =>
    (display.handles?.(viewOf(display, params, { values })) ?? [])[1].y
  /** How often a wave crosses its own middle, which is where it starts. */
  const crossings = (path: DrawnPath): number => {
    const middle = path.points[0][1]
    let count = 0
    for (let i = 2; i < path.points.length; i++) {
      const before = path.points[i - 1][1] - middle
      const after = path.points[i][1] - middle
      if (before !== 0 && before * after < 0) count++
    }
    return count
  }
  const swing = (path: DrawnPath): number => {
    const ys = path.points.map(([, y]) => y)
    return Math.max(...ys) - Math.min(...ys)
  }

  it('stands with the knobs of the strike and the tone, and reads every knob but Volume', () => {
    expect(face).toEqual(['drop', 'fall', 'shape', 'harmonics'])
    expect([...display.params].sort()).toEqual(
      Object.keys(params)
        .filter((name) => name !== 'volume')
        .sort(),
    )
  })

  it('lights nothing at rest, and one body and one wave for a note that sounds', () => {
    expect(lit(drawnPaths(drawDisplay(display, params)))).toHaveLength(0)
    expect(lit(drawnPaths(run({}, [])))).toHaveLength(0)
    const paths = drawnPaths(run({}, [note(A1, 0.2)]))
    expect(bodies(paths)).toHaveLength(1)
    expect(waves(paths)).toHaveLength(1)
    // A key down and up in one instant is not held: with Decay at its top it would be lit for good.
    expect(lit(drawnPaths(run({}, [note(A1, 5, 5)])))).toHaveLength(0)
  })

  it('has one voice: a chord is one body, on the newest key', () => {
    const chord = [note(A1, 0.4), note(A2, 0.4), note(A3, 0.4)]
    const drawn = run({ drop: 0 }, chord)
    expect(bodies(drawnPaths(drawn))).toHaveLength(1)
    expect(drawn.words()).toContain('A3 220 Hz')
    // Let the newest go and the voice is back on the key under it.
    const back = run({ drop: 0, glide: 0 }, [note(A1, 0.4), note(A2, 0.4), note(A3, 0.4, 0.2)])
    expect(bodies(drawnPaths(back))).toHaveLength(1)
    expect(back.words()).toContain('A2 110 Hz')
  })

  it('holds a note at the top of Decay, and puts it out a Decay after its rise below that', () => {
    expect(bodies(drawnPaths(run({}, [note(A1, 60)])))).toHaveLength(1)
    expect(run({}, [note(A1, 60)]).words()).toContain('Hold')
    // Decay 1 s: 54 dB down after 0.9 s, 66 dB down after 1.1 s.
    expect(bodies(drawnPaths(run({ decay: 1 }, [note(A1, 0.9)])))).toHaveLength(1)
    expect(lit(drawnPaths(run({ decay: 1 }, [note(A1, 1.1)])))).toHaveLength(0)
    expect(run({ decay: 1 }, [note(A1, 1.1)]).words()).toContain('1.0 s')
  })

  it('fades a note let go over Release, and puts it out when it has', () => {
    // Release 0.4 s: 30 dB down 0.2 s after the key went up, gone after 0.45 s.
    expect(bodies(drawnPaths(run({ release: 0.4 }, [note(A1, 1, 0.2)])))).toHaveLength(1)
    expect(lit(drawnPaths(run({ release: 0.4 }, [note(A1, 1, 0.45)])))).toHaveLength(0)
    expect(bodies(drawnPaths(run({ release: 8 }, [note(A1, 1, 0.45)])))).toHaveLength(1)
    // The body thins as it fades.
    const early = head(body({ release: 0.4 }, [note(A1, 1, 0.05)]))
    const late = head(body({ release: 0.4 }, [note(A1, 1, 0.3)]))
    expect(late.thick).toBeLessThan(early.thick * 0.5)
  })

  it('starts the body Drop above the key and lands it on the key after Fall', () => {
    const key = keyLine()
    const flat = body({ drop: 0 }, [note(A1, 0.3)])
    expect(start(flat).middle).toBeCloseTo(key, 3)
    expect(head(flat).middle).toBeCloseTo(key, 3)
    const knock = start(body({ drop: 7, fall: 800 }, [note(A1, 0.3)])).middle
    const dive = start(body({ drop: 36, fall: 800 }, [note(A1, 0.3)])).middle
    expect(knock).toBeLessThan(key - 8)
    expect(dive).toBeLessThan(knock - 15)
    // 0.3 s into a fall of 0.8 s the head is still above the key; a second in it has landed.
    expect(head(body({ drop: 36, fall: 800 }, [note(A1, 0.3)])).middle).toBeLessThan(key - 3)
    expect(head(body({ drop: 36, fall: 800 }, [note(A1, 1)])).middle).toBeCloseTo(key, 3)
    // A shorter Fall has landed sooner.
    expect(head(body({ drop: 36, fall: 100 }, [note(A1, 0.3)])).middle).toBeCloseTo(key, 3)
  })

  it('brings a slide in from the key it left, for as long as Glide', () => {
    const key = keyLine()
    const up = [note(A1, 1), note(A2, 0.1)]
    // From the octave under: the body starts under the key's line and is half way at half the Glide.
    const slow = body({ drop: 0, glide: 0.2 }, up)
    expect(start(slow).middle).toBeGreaterThan(key + 5)
    expect(head(slow).middle).toBeGreaterThan(key + 2)
    expect(head(slow).middle).toBeLessThan(start(slow).middle)
    expect(head(body({ drop: 0, glide: 0.05 }, up)).middle).toBeCloseTo(key, 3)
    // From a key above it comes down, though nothing drops.
    const down = body({ drop: 0, glide: 0.2 }, [note(A2, 1), note(A1, 0.1)])
    expect(start(down).middle).toBeLessThan(key - 5)
    // A slide from further under than the scale reaches comes in along its lower edge, in sight:
    // from two octaves under it starts where the one from an octave under does.
    const far = start(body({ drop: 0, glide: 0.2 }, [note(A1, 1), note(A3, 0.01)])).middle
    expect(far).toBeCloseTo(start(slow).middle, 3)
    expect(far).toBeLessThan(key + 20)
    // A key slid to does not drop: with Drop up the slide starts where it did.
    expect(start(body({ drop: 24, fall: 40, glide: 0.2 }, up)).middle).toBeCloseTo(
      start(slow).middle,
      3,
    )
  })

  it('makes the body as thick as the note is loud: thin through a slow rise, thinner for a soft key', () => {
    const rising = head(body({ attack: 2 }, [note(A1, 0.2)]))
    const risen = head(body({ attack: 2 }, [note(A1, 2.5)]))
    expect(rising.thick).toBeLessThan(risen.thick * 0.6)
    expect(rising.x).toBeLessThan(risen.x)
    // The softest key still sounds: three tenths of the level, 10 dB of the 60.
    const soft = head(body({}, [note(A1, 0.5, null, 0)]))
    const hard = head(body({}, [note(A1, 0.5, null, 1)]))
    expect(soft.thick / hard.thick).toBeCloseTo(subBassShare(0.3), 2)
  })

  it('draws the wave that sounds: crowded while the pitch is above the key, smaller as it fades', () => {
    // Landed, it is one cycle of the key: it crosses its middle once on the way.
    expect(crossings(wave({ drop: 36, fall: 100 }, [note(A1, 0.5)]))).toBe(1)
    // At the strike of a three-octave drop eight cycles pass in the time of one.
    expect(crossings(wave({ drop: 36, fall: 800 }, [note(A1, 0.001)]))).toBeGreaterThanOrEqual(14)
    const during = crossings(wave({ drop: 36, fall: 800 }, [note(A1, 0.2)]))
    expect(during).toBeGreaterThan(1)
    expect(during).toBeLessThan(14)
    // Let go, it shrinks with the body.
    const held = swing(wave({ release: 0.4 }, [note(A1, 1)]))
    const fading = swing(wave({ release: 0.4 }, [note(A1, 1, 0.2)]))
    expect(fading).toBeCloseTo(held / 2, 0)
  })

  it('shows on the wave what Shape, Harmonics and Drive add to a note that sounds', () => {
    const held = [note(A1, 1)]
    const sine = { shape: 0, harmonics: 0, drive: 0 }
    const flatness = (path: DrawnPath): number => {
      const middle = path.points[0][1]
      const ys = path.points.map(([, y]) => Math.abs(y - middle))
      return Math.sqrt(ys.reduce((sum, y) => sum + y * y, 0) / ys.length) / Math.max(...ys)
    }
    // A sine's level is 0.707 of its peak; a squarer wave's is nearer its peak.
    expect(flatness(wave(sine, held))).toBeCloseTo(Math.SQRT1_2, 1)
    expect(flatness(wave({ ...sine, shape: 1 }, held))).toBeGreaterThan(0.85)
    expect(flatness(wave({ ...sine, drive: 1 }, held))).toBeGreaterThan(0.85)
    // Harmonics adds the octave and the fifth over it in step with the note: the wave swings wider
    // and leans forward, its top a seventh of a cycle in where a sine's is a quarter in.
    const topAt = (path: DrawnPath): number => {
      const ys = path.points.map(([, y]) => y)
      const [first] = path.points[0]
      const [last] = path.points[path.points.length - 1]
      return (path.points[ys.indexOf(Math.min(...ys))][0] - first) / (last - first)
    }
    expect(topAt(wave(sine, held))).toBeCloseTo(0.25, 1)
    const octave = wave({ ...sine, harmonics: 1 }, held)
    expect(topAt(octave)).toBeLessThan(0.18)
    expect(crossings(octave)).toBe(1)
    expect(swing(octave)).toBeGreaterThan(swing(wave(sine, held)) * 1.2)
    // The drive lets go of a note as it fades: 40 dB down a fully driven sine is a sine again.
    const tail = wave({ ...sine, drive: 1, release: 3 }, [note(A1, 3, 2)])
    expect(flatness(tail)).toBeCloseTo(Math.SQRT1_2, 1)
  })

  it('draws the note at rest as long as the knobs make it', () => {
    /** The body at rest: the ink's fill that lies furthest to the right. */
    const rest = (values: Record<string, number>): DrawnPath => {
      const fills = drawnPaths(drawDisplay(display, params, { values })).filter(
        (path) => path.kind === 'fill' && path.colour === ink && path.points.length > 2,
      )
      const left = (path: DrawnPath): number => Math.min(...path.points.map(([x]) => x))
      return fills.reduce((a, b) => (left(b) > left(a) ? b : a))
    }
    const handles = (values: Record<string, number>) =>
      display.handles?.(viewOf(display, params, { values })) ?? []
    // It closes where the Decay handle stands, a Decay after its rise; a longer Decay closes later.
    const short = head(rest({ decay: 0.5 }))
    expect(short.x).toBeCloseTo(handles({ decay: 0.5 })[1].x, 3)
    expect(short.thick).toBeCloseTo(0, 3)
    expect(head(rest({ decay: 5 })).x).toBeGreaterThan(short.x + 10)
    expect(head(rest({ decay: 0.5, attack: 2 })).x).toBeGreaterThan(short.x + 10)
    // At the top of Decay it runs off the edge at full thickness.
    const held = head(rest({ decay: 20 }))
    expect(held.x).toBeCloseTo(handles({ decay: 20 })[1].x, 3)
    expect(held.thick).toBeGreaterThan(10)
    // It starts as high as the Drop handle stands, and on the key with no Drop.
    expect(start(rest({ drop: 24 })).middle).toBeCloseTo(handles({ drop: 24 })[0].y, 3)
    expect(start(rest({ drop: 0 })).middle).toBeCloseTo(keyLine(), 3)
  })

  it('says the drop at rest and the pitch while a note sounds', () => {
    expect(drawDisplay(display, params).words()).toContain('7 st in 40 ms')
    expect(drawDisplay(display, params, { values: { drop: 0 } }).words()).toContain('No drop')
    expect(run({ drop: 0 }, [note(A1, 0.5)]).words()).toContain('A1 55 Hz')
    // While it falls the pitch said is the one that sounds: an octave up at the strike.
    expect(run({ drop: 12, fall: 800 }, [note(A1, 0.001)]).words()).toContain('A2 110 Hz')
  })

  it('stands its handles where the knobs are, and a drag sets them', () => {
    const settings: Record<string, number>[] = [
      {},
      { drop: 30, fall: 600, decay: 0.7, attack: 0.5 },
      { drop: 3, fall: 5, decay: 7 },
    ]
    for (const values of settings) {
      const view = viewOf(display, params, { values })
      const [drop, decay] = display.handles?.(view) ?? []
      const taken = drop.drag(drop.x, drop.y)
      expect(taken.drop).toBeCloseTo(view.value('drop'), 3)
      expect(taken.fall).toBeCloseTo(view.value('fall'), 2)
      expect(decay.drag(decay.x, decay.y).decay).toBeCloseTo(view.value('decay'), 3)
      // Up is a higher start, to the right a longer fall, to the left a shorter note.
      expect(drop.drag(drop.x, drop.y - 5).drop).toBeGreaterThan(view.value('drop'))
      expect(drop.drag(drop.x + 5, drop.y).fall).toBeGreaterThan(view.value('fall'))
      expect(decay.drag(decay.x - 5, decay.y).decay).toBeLessThan(view.value('decay'))
    }
    // At the far right Decay is at its top, where the note holds.
    const view = viewOf(display, params)
    const decay = (display.handles?.(view) ?? [])[1]
    expect(decay.drag(view.width, decay.y).decay).toBeGreaterThanOrEqual(19.9)
  })
})
