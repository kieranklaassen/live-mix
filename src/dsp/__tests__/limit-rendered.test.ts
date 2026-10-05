// The Ambient Limiter over a finished render, on the committed module: that
// it leaves the audio where it was, that the auto gain is one gain for the
// whole of it, how far that gain goes, and that the ceiling holds.

import { describe, expect, it } from 'vitest'

import { type PlanarAudio } from '../../core/render/encode'
import { type LimitRenderedParams, limitRendered } from '../limit-rendered'
import { peakOf } from '../patch-render'
import { compileFromDisk, toDb } from './render-support'

const RATE = 48000

const limit = (audio: PlanarAudio, params: LimitRenderedParams = {}) =>
  limitRendered(audio, params, { compile: compileFromDisk, sliceMs: 0 })

/** A tone that changes level: `[seconds, dBFS]` one after another, the phase running on. */
function tone(
  parts: readonly (readonly [number, number])[],
  hz = 220,
  channelCount = 2,
): PlanarAudio {
  const total = Math.round(parts.reduce((sum, [seconds]) => sum + seconds, 0) * RATE)
  const channel = new Float32Array(total)
  let at = 0
  for (const [seconds, level] of parts) {
    const gain = 10 ** (level / 20)
    const end = Math.min(total, at + Math.round(seconds * RATE))
    for (let i = at; i < end; i += 1)
      channel[i] = gain * Math.sin((2 * Math.PI * hz * (i + 1)) / RATE)
    at = end
  }
  return {
    channels: Array.from({ length: channelCount }, () => channel.slice()),
    sampleRate: RATE,
  }
}

/** Peak of `channel` between two times, dBFS. */
const peakDb = (channel: Float32Array, fromSec: number, toSec: number): number =>
  toDb(peakOf([channel.subarray(Math.round(fromSec * RATE), Math.round(toSec * RATE))]))

describe('limitRendered', () => {
  it('leaves a sound under the ceiling as it was and where it was, with Auto gain off', async () => {
    const audio = tone([[1, -12]])
    const before = audio.channels[0].slice()
    expect(await limit(audio)).toEqual({ autoGainDb: 0 })
    expect(audio.channels[0]).toHaveLength(before.length)
    let off = 0
    for (let i = 0; i < before.length; i += 1) {
      off = Math.max(off, Math.abs(audio.channels[0][i] - before[i]))
    }
    // Not a sample later: 77 frames of lookahead would be 0.4 of full scale off here.
    expect(off).toBeLessThan(1e-5)
    expect(audio.channels[1]).toEqual(audio.channels[0])
  })

  it('holds the ceiling as the limiter does in a chain, to the last frame', async () => {
    const audio = tone([[2, 3]])
    await limit(audio, { ceiling: -3 })
    expect(toDb(peakOf(audio.channels))).toBeLessThanOrEqual(-3)
    expect(toDb(peakOf(audio.channels))).toBeGreaterThan(-4)
    // The end is the sound still, not the silence that brought the last of it out.
    expect(peakDb(audio.channels[0], 1.99, 2)).toBeGreaterThan(-5)
  })

  it('sets only the parameters the limiter has: a name every object has is not one of them', async () => {
    // A saved device's values, read back from a file, may carry any name.
    const saved = JSON.parse('{"ceiling":-6,"constructor":0,"toString":0}') as LimitRenderedParams
    const audio = tone([[2, 3]])
    await limit(audio, saved)
    // `constructor` has no id, and a parameter id that is no number is the first one: the ceiling.
    expect(toDb(peakOf(audio.channels))).toBeLessThanOrEqual(-6)
    expect(toDb(peakOf(audio.channels))).toBeGreaterThan(-7)
  })

  it('turns a quiet sound up to the ceiling by one gain, from its first cycle', async () => {
    const audio = tone([[6, -6]])
    const { autoGainDb } = await limit(audio, { ceiling: -0.3, autoGain: 12 })
    // The line it works to is half a dB under the ceiling: −0.8 dB, so 5.2 dB up from −6.
    expect(autoGainDb).toBeGreaterThan(4.9)
    expect(autoGainDb).toBeLessThan(5.3)
    expect(peakDb(audio.channels[0], 0, 0.05)).toBeCloseTo(-6 + autoGainDb, 1)
    expect(peakDb(audio.channels[0], 5.9, 6)).toBeCloseTo(-6 + autoGainDb, 1)
    expect(toDb(peakOf(audio.channels))).toBeLessThanOrEqual(-0.3)
  })

  it('goes no further up than the Auto gain setting', async () => {
    const audio = tone([[4, -30]])
    expect(await limit(audio, { ceiling: -0.3, autoGain: 12 })).toEqual({ autoGainDb: 12 })
    expect(toDb(peakOf(audio.channels))).toBeCloseTo(-18, 1)
    const less = tone([[4, -30]])
    expect((await limit(less, { ceiling: -0.3, autoGain: 4.5 })).autoGainDb).toBeCloseTo(4.5, 5)
  })

  it('keeps a quiet opening as far under the loud part as it was', async () => {
    // Live the auto gain would start full and come down over the swell; a file gets the gain the loud part ends on.
    const audio = tone([
      [4, -30],
      [8, -6],
      [4, -30],
    ])
    const { autoGainDb } = await limit(audio, { ceiling: -0.3, autoGain: 12 })
    // 8 seconds of it are not quite the whole way down: the ride holds the half dB that is left.
    expect(autoGainDb).toBeGreaterThan(4.9)
    expect(autoGainDb).toBeLessThan(5.8)
    const opening = peakDb(audio.channels[0], 1, 3)
    const loud = peakDb(audio.channels[0], 9, 11)
    const ending = peakDb(audio.channels[0], 13, 15)
    expect(opening).toBeCloseTo(-30 + autoGainDb, 1)
    // The ending is still coming back from the half dB the ride held.
    expect(Math.abs(ending - opening)).toBeLessThan(0.2)
    expect(loud - opening).toBeGreaterThan(23.4)
    expect(toDb(peakOf(audio.channels))).toBeLessThanOrEqual(-0.3)
  })

  it('pushes the whole of it into the ceiling by Gain, over the auto gain', async () => {
    const parts = [
      [4, -18],
      [8, -6],
    ] as const
    const plain = tone(parts)
    const pushed = tone(parts)
    const a = await limit(plain, { ceiling: -0.3, autoGain: 12 })
    const b = await limit(pushed, { ceiling: -0.3, autoGain: 12, gain: 6 })
    // Gain is not made up for: the auto gain is the same, and the limiter holds 6 dB more of the loud part.
    expect(b.autoGainDb).toBeCloseTo(a.autoGainDb, 5)
    expect(peakDb(pushed.channels[0], 1, 3) - peakDb(plain.channels[0], 1, 3)).toBeCloseTo(6, 1)
    expect(peakDb(pushed.channels[0], 10, 12) - peakDb(plain.channels[0], 10, 12)).toBeLessThan(0.6)
    expect(toDb(peakOf(pushed.channels))).toBeLessThanOrEqual(-0.3)
  })

  it('takes mono, and gives the same for the same', async () => {
    const mono = tone([[3, -10]], 330, 1)
    const stereo = tone([[3, -10]], 330, 2)
    const a = await limit(mono, { autoGain: 12 })
    const b = await limit(stereo, { autoGain: 12 })
    expect(a).toEqual(b)
    expect(mono.channels[0]).toEqual(stereo.channels[0])
    await expect(
      limit({ channels: [new Float32Array(8), new Float32Array(9)], sampleRate: RATE }),
    ).rejects.toThrow(/differ in length/)
    await expect(limit({ channels: [], sampleRate: RATE })).rejects.toThrow(/mono or stereo/)
  })

  it('leaves silence silent and nothing as nothing', async () => {
    const silence = { channels: [new Float32Array(RATE), new Float32Array(RATE)], sampleRate: RATE }
    expect(await limit(silence, { autoGain: 12 })).toEqual({ autoGainDb: 12 })
    expect(peakOf(silence.channels)).toBe(0)
    const nothing = { channels: [new Float32Array(0)], sampleRate: RATE }
    expect(await limit(nothing, { autoGain: 12 })).toEqual({ autoGainDb: 0 })
  })

  it('stops when it is told to', async () => {
    const stop = new AbortController()
    stop.abort()
    await expect(
      limitRendered(
        tone([[1, -6]]),
        { autoGain: 12 },
        { compile: compileFromDisk, signal: stop.signal },
      ),
    ).rejects.toThrow()
  })
})
