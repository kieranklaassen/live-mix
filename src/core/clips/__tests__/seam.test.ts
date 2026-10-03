import { describe, expect, it } from 'vitest'
import { SEAM_SILENCE, comesRound, entersOnStep, leavesOnStep, type SoundFrames } from '../seam'

const RATE = 48000

function sound(
  seconds: number,
  ...channels: ((sec: number, through: number) => number)[]
): SoundFrames {
  const length = Math.round(seconds * RATE)
  const data = channels.map((at) =>
    Float32Array.from({ length }, (_, n) => at(n / RATE, n / length)),
  )
  return {
    numberOfChannels: data.length,
    length,
    sampleRate: RATE,
    getChannelData: (channel) => data[channel],
  }
}

/** A 100 Hz wave of whole cycles, entered `turn` of a cycle in: a sound made to loop. */
const looped =
  (turn: number) =>
  (sec: number): number =>
    0.5 * Math.sin(2 * Math.PI * (turn + 100 * sec))
/** A wave from rest that dies away to nothing. */
const struck = (sec: number, through: number): number =>
  0.5 * (1 - through) * Math.sin(2 * Math.PI * 100 * sec)
/** Noise that is the same every run. */
const hiss = (): ((sec: number) => number) => {
  let seed = 1
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed / 2147483647 - 0.5) * 0.6
  }
}

describe('entersOnStep', () => {
  it('is a step where a looped sound is entered partway through a wave', () => {
    expect(entersOnStep(sound(2, looped(0.25)), 0)).toBe(true)
    expect(entersOnStep(sound(2, looped(0.1)), 0)).toBe(true)
  })

  it('is none where the sound starts from rest, however fast it then moves', () => {
    expect(entersOnStep(sound(2, looped(0)), 0)).toBe(false)
    expect(entersOnStep(sound(2, struck), 0)).toBe(false)
    // A hit: nothing, then a jump as large as the sound gets.
    expect(
      entersOnStep(
        sound(2, (sec) => (sec === 0 ? 0 : 0.5 * Math.exp(-sec * 40))),
        0,
      ),
    ).toBe(false)
  })

  it('is none where the frame is no further from zero than the sound moves beside it', () => {
    expect(entersOnStep(sound(2, hiss()), 0)).toBe(false)
    // A hit trimmed to start on its peak with a fast ring after it.
    expect(
      entersOnStep(
        sound(2, (sec) => 0.3 * Math.cos(2 * Math.PI * 6000 * sec)),
        0,
      ),
    ).toBe(false)
  })

  it('is none under the floor, whatever is beside it', () => {
    expect(
      entersOnStep(
        sound(2, () => SEAM_SILENCE * 0.9),
        0,
      ),
    ).toBe(false)
    expect(
      entersOnStep(
        sound(2, () => SEAM_SILENCE * 1.1),
        0,
      ),
    ).toBe(true)
  })

  it('is a step when either channel steps', () => {
    expect(entersOnStep(sound(2, looped(0), looped(0.25)), 0)).toBe(true)
  })

  it('looks at the frame it is asked about, and takes one past the end as the last', () => {
    const frames = sound(2, looped(0))
    // A quarter of a cycle in: the top of the wave.
    expect(entersOnStep(frames, RATE / 400)).toBe(true)
    expect(entersOnStep(frames, 10 * RATE)).toBe(entersOnStep(frames, frames.length - 1))
  })
})

describe('leavesOnStep', () => {
  it('is a step where the sound is left partway through a wave', () => {
    const frames = sound(2, looped(0))
    expect(leavesOnStep(frames, RATE / 400)).toBe(true)
    expect(leavesOnStep(sound(2, looped(0.25)), 2 * RATE - 1)).toBe(true)
  })

  it('is none where the sound has died away, or is at rest there', () => {
    expect(leavesOnStep(sound(2, struck), 2 * RATE - 1)).toBe(false)
    expect(leavesOnStep(sound(2, looped(0)), RATE)).toBe(false)
    expect(leavesOnStep(sound(2, hiss()), RATE)).toBe(false)
  })
})

describe('comesRound', () => {
  it('is true of a sound made to loop, wherever in the wave it starts', () => {
    expect(comesRound(sound(2, looped(0.25)), 0, 2 * RATE)).toBe(true)
    expect(comesRound(sound(2, looped(0.6), looped(0.1)), 0, 2 * RATE)).toBe(true)
  })

  it('is true of a sound that starts and ends at rest, and of noise', () => {
    expect(comesRound(sound(2, struck), 0, 2 * RATE)).toBe(true)
    expect(comesRound(sound(2, hiss()), 0, 2 * RATE)).toBe(true)
  })

  it('is false where the end is somewhere else in the wave than the start', () => {
    // 100.25 cycles: it starts at rest and stops at the top of a wave.
    const cutOff = (sec: number): number => 0.5 * Math.sin(2 * Math.PI * 100.25 * sec)
    expect(comesRound(sound(1, cutOff), 0, RATE)).toBe(false)
    // One channel that does not is enough.
    expect(comesRound(sound(1, looped(0.25), cutOff), 0, RATE)).toBe(false)
  })

  it('judges a region by its own two ends', () => {
    const frames = sound(2, looped(0.25))
    // Whole cycles: round. Cut a quarter of a cycle short: not.
    expect(comesRound(frames, RATE / 2, RATE)).toBe(true)
    expect(comesRound(frames, RATE / 2, RATE - RATE / 400)).toBe(false)
  })

  it('has no answer for a sound of a frame, or a region of none', () => {
    const one: SoundFrames = {
      numberOfChannels: 1,
      length: 1,
      sampleRate: RATE,
      getChannelData: () => new Float32Array(1),
    }
    expect(comesRound(one, 0, 1)).toBe(false)
    expect(entersOnStep(one, 0)).toBe(false)
    expect(leavesOnStep(one, 0)).toBe(false)
    expect(comesRound(sound(1, looped(0.25)), 100, 100)).toBe(false)
  })
})
