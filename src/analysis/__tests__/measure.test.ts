// Every figure is held to a signal whose answer follows from how the signal
// was made, and from the definitions in ITU-R BS.1770-4 and EBU Tech 3341 and
// 3342: a sine's mean level is 3.01 dB under its peak, a 1 kHz sine in both
// channels reads its peak level in LUFS, and so on. No answer here was read
// off the code under test.

import { describe, expect, it } from 'vitest'

import { Measurer, measure, type Measurement } from '../index'
import {
  added,
  bandsTotalDb,
  gainOf,
  joined,
  meanLevelDb,
  pinkNoise,
  shareOfBand,
  sine,
  whiteNoise,
} from './support'

const RATE = 48000
/** A sine's mean level under its peak, in dB. */
const SINE_CREST_DB = 10 * Math.log10(2)

/** The figure is a number within `tolerance` of `expected`. */
function near(actual: number | null, expected: number, tolerance: number): void {
  expect(actual).not.toBeNull()
  if (actual === null) return
  expect(actual).toBeGreaterThan(expected - tolerance)
  expect(actual).toBeLessThan(expected + tolerance)
}

/** A sine with `peakDb` at its crests, the same in both channels. */
function stereoSine(seconds: number, hz: number, peakDb: number, rate = RATE): Float32Array[] {
  const channel = sine(seconds, hz, rate, gainOf(peakDb))
  return [channel, channel.slice()]
}

/** The sound fed to a measurer `size` frames at a time. */
function inChunks(channels: Float32Array[], sampleRate: number, size: number): Measurement {
  const measurer = new Measurer(sampleRate, channels.length)
  const frames = channels[0].length
  for (let from = 0; from < frames; from += size) {
    measurer.push(channels.map((channel) => channel.subarray(from, Math.min(frames, from + size))))
  }
  return measurer.finish()
}

describe('loudness', () => {
  it('reads a stereo 1 kHz sine at -23 dBFS as -23.0 LUFS', () => {
    const result = measure(stereoSine(10, 1000, -23), RATE)
    near(result.integratedLufs, -23, 0.1)
    near(result.maxMomentaryLufs, -23, 0.1)
    near(result.maxShortTermLufs, -23, 0.1)
  })

  it('reads one channel as one channel: the same sine is 3.01 LU lower', () => {
    const result = measure([sine(10, 1000, RATE, gainOf(-23))], RATE)
    near(result.integratedLufs, -23 - SINE_CREST_DB, 0.1)
    // Its level, its crest and its band are the one channel's own.
    near(result.rmsDbfs, -23 - SINE_CREST_DB, 0.05)
    near(result.crestDb, SINE_CREST_DB, 0.05)
    near(result.bands[3].levelDbfs, -23 - SINE_CREST_DB, 0.1)
  })

  it('leaves the silence after a sound out of its integrated loudness', () => {
    const sound = sine(10, 1000, RATE, gainOf(-23))
    const channel = joined(sound, new Float32Array(10 * RATE))
    // The mean over all twenty seconds would read 3.01 LU lower.
    near(measure([channel, channel], RATE).integratedLufs, -23, 0.1)
  })

  it('gives the loudest 400 ms and the loudest three seconds', () => {
    const quiet = sine(5, 1000, RATE, gainOf(-30))
    const channel = joined(quiet, sine(1, 1000, RATE, gainOf(-14)), quiet)
    const result = measure([channel, channel], RATE)
    near(result.maxMomentaryLufs, -14, 0.1)
    // Three seconds that hold the loud second: one part at -14 and two at -30.
    near(result.maxShortTermLufs, 10 * Math.log10((10 ** -1.4 + 2 * 10 ** -3) / 3), 0.1)
  })
})

describe('the short-term series', () => {
  it('has a point a second for a stretch of two minutes or less', () => {
    const result = measure(stereoSine(60, 1000, -20, 8000), 8000)
    expect(result.shortTerm.startSeconds).toBe(3)
    expect(result.shortTerm.hopSeconds).toBe(1)
    // Three seconds ending at 3, 4, and so on to 60.
    expect(result.shortTerm.lufs).toHaveLength(58)
    for (const point of result.shortTerm.lufs) near(point, -20, 0.5)
  })

  it('has at most 120 points over ten minutes, and follows the sound', () => {
    const loud = sine(300, 1000, 8000, gainOf(-20))
    const channel = joined(loud, sine(300, 1000, 8000, gainOf(-30)))
    const { shortTerm } = measure([channel, channel], 8000)
    expect(shortTerm.hopSeconds).toBe(5)
    expect(shortTerm.lufs).toHaveLength(120)
    // Point n ends at 3 + 5n seconds: 59 ends at 298, in the loud half, and 61 at 308.
    near(shortTerm.lufs[0], -20, 0.5)
    near(shortTerm.lufs[59], -20, 0.5)
    near(shortTerm.lufs[61], -30, 0.5)
    near(shortTerm.lufs[119], -30, 0.5)
  })

  it('is null where the stretch is silent so far', () => {
    const channel = joined(new Float32Array(5 * RATE), sine(5, 1000, RATE, gainOf(-20)))
    const { shortTerm } = measure([channel, channel], RATE)
    // Points end at 3 to 10 seconds. Those ending at 3, 4 and 5 hold only silence.
    expect(shortTerm.lufs).toHaveLength(8)
    expect(shortTerm.lufs.slice(0, 3)).toEqual([null, null, null])
    // The three seconds ending at 6 hold one second of the sine, and those ending at 8 only the sine.
    near(shortTerm.lufs[3], -20 + 10 * Math.log10(1 / 3), 0.1)
    near(shortTerm.lufs[5], -20, 0.1)
    near(shortTerm.lufs[7], -20, 0.1)
  })

  it('is null again once the three seconds hold nothing of a sound that has ended', () => {
    const channel = joined(sine(2, 1000, RATE, gainOf(-20)), new Float32Array(10 * RATE))
    const { shortTerm } = measure([channel, channel], RATE)
    // Points end at 3 to 12 seconds. Those ending at 3 and 4 hold two seconds and one second of the sine.
    expect(shortTerm.lufs).toHaveLength(10)
    near(shortTerm.lufs[0], -20 + 10 * Math.log10(2 / 3), 0.1)
    near(shortTerm.lufs[1], -20 + 10 * Math.log10(1 / 3), 0.1)
    // Those ending at 5 and 6 hold only what the weighting still rings with, far under any sound.
    for (const point of shortTerm.lufs.slice(2, 4)) expect(point ?? -Infinity).toBeLessThan(-70)
    // From there the three seconds are exact zeros.
    expect(shortTerm.lufs.slice(4)).toEqual([null, null, null, null, null, null])
  })
})

describe('loudness range', () => {
  it('is 10 LU for twenty seconds at -20 LUFS and twenty at -30', () => {
    const channel = joined(sine(20, 1000, RATE, gainOf(-20)), sine(20, 1000, RATE, gainOf(-30)))
    near(measure([channel, channel], RATE).loudnessRangeLu, 10, 1)
  })

  it('is nothing for a steady sound', () => {
    near(measure(stereoSine(20, 1000, -23), RATE).loudnessRangeLu, 0, 0.1)
  })

  it('spans the 10th to the 95th percentile of a sound that rises evenly', () => {
    // 100 seconds rising 0.2 dB a second from -40 dBFS. Three seconds read
    // the level at their middle, so the readings lie evenly over the 97
    // seconds from 1.5 to 98.5, which is 19.4 LU, and 85% of that is 16.5.
    const channel = new Float32Array(100 * RATE)
    for (let i = 0; i < channel.length; i += 1) {
      const t = i / RATE
      channel[i] = gainOf(-40 + 0.2 * t) * Math.sin(2 * Math.PI * 1000 * t)
    }
    near(measure([channel, channel], RATE).loudnessRangeLu, 16.5, 0.5)
  })

  it('leaves out what is more than 20 LU under the mean', () => {
    const channel = joined(
      sine(20, 1000, RATE, gainOf(-20)),
      sine(20, 1000, RATE, gainOf(-30)),
      sine(20, 1000, RATE, gainOf(-50)),
    )
    // The mean, taken of the powers, is near -24.5 LUFS, so the last twenty
    // seconds are out. Counted, they would make the range 30.
    near(measure([channel, channel], RATE).loudnessRangeLu, 10, 1)
  })

  it('keeps what is less than 20 LU under the mean', () => {
    const channel = joined(sine(20, 1000, RATE, gainOf(-20)), sine(20, 1000, RATE, gainOf(-35)))
    // The mean is near -23 LUFS, and the quiet half is 12 LU under it.
    near(measure([channel, channel], RATE).loudnessRangeLu, 15, 1)
  })

  it('is null, with the integrated loudness, for a sound that never reaches -70 LUFS', () => {
    const channel = joined(sine(10, 1000, RATE, gainOf(-80)), sine(10, 1000, RATE, gainOf(-85)))
    const result = measure([channel, channel], RATE)
    expect(result.loudnessRangeLu).toBeNull()
    expect(result.integratedLufs).toBeNull()
    // It is not silence: it has a peak, and a short-term loudness.
    expect(result.silent).toBe(false)
    near(result.samplePeakDbfs, -80, 0.1)
    near(result.maxShortTermLufs, -80, 0.1)
  })
})

describe('peaks and crest factor', () => {
  it('reads a sine as 3.01 dB of crest, with a true peak at its peak', () => {
    const result = measure(stereoSine(10, 1000, -23), RATE)
    near(result.crestDb, SINE_CREST_DB, 0.05)
    near(result.truePeakDbtp, -23, 0.1)
    near(result.samplePeakDbfs, -23, 0.1)
    near(result.rmsDbfs, -23 - SINE_CREST_DB, 0.05)
  })

  it('finds a peak that falls between the samples', () => {
    // A quarter of the rate, an eighth of a turn late: every sample is 3.01 dB under the crest.
    const channel = sine(2, RATE / 4, RATE, 0.5, Math.PI / 4)
    const result = measure([channel, channel], RATE)
    near(result.samplePeakDbfs, 20 * Math.log10(0.5) - SINE_CREST_DB, 0.01)
    near(result.truePeakDbtp, 20 * Math.log10(0.5), 0.5)
    // The crest is of the samples: they are all of one size, so it is nothing.
    near(result.crestDb, 0, 0.01)
  })

  it.each([
    ['left', 0],
    ['right', 1],
  ])('takes the peak of the louder channel, the %s, and the mean level of both', (_name, loud) => {
    const channels: Float32Array[] = [new Float32Array(5 * RATE), new Float32Array(5 * RATE)]
    channels[loud] = sine(5, 1000, RATE, gainOf(-10))
    const result = measure(channels, RATE)
    near(result.samplePeakDbfs, -10, 0.1)
    near(result.truePeakDbtp, -10, 0.1)
    // Half the samples are silent, so the mean level is 3.01 dB lower again.
    near(result.rmsDbfs, -10 - 2 * SINE_CREST_DB, 0.05)
    near(result.crestDb, 2 * SINE_CREST_DB, 0.05)
  })
})

describe('the seven bands', () => {
  it('names their edges', () => {
    const { bands } = measure(stereoSine(1, 1000, -23), RATE)
    expect(bands.map((band) => [band.fromHz, band.toHz])).toEqual([
      [20, 60],
      [60, 250],
      [250, 500],
      [500, 2000],
      [2000, 4000],
      [4000, 10000],
      [10000, 20000],
    ])
  })

  it.each([
    [40, 0],
    [100, 1],
    [350, 2],
    [1000, 3],
    [3000, 4],
    [6000, 5],
    [14000, 6],
  ])('puts a %d Hz sine in band %d, at the sine’s level', (hz, index) => {
    const result = measure(stereoSine(5, hz, -20), RATE)
    expect(shareOfBand(result, index)).toBeGreaterThanOrEqual(0.99)
    near(result.bands[index].levelDbfs, -20 - SINE_CREST_DB, 0.1)
  })

  it('puts a sine on each side of an edge in the band it belongs to', () => {
    expect(shareOfBand(measure(stereoSine(5, 235, -20), RATE), 1)).toBeGreaterThanOrEqual(0.99)
    expect(shareOfBand(measure(stereoSine(5, 265, -20), RATE), 2)).toBeGreaterThanOrEqual(0.99)
  })

  it('adds up to the mean level of pink noise', () => {
    const channels = [pinkNoise(10 * 44100, 44100, 1), pinkNoise(10 * 44100, 44100, 2)]
    const result = measure(channels, 44100)
    near(bandsTotalDb(result), meanLevelDb(channels), 0.1)
    near(result.rmsDbfs, meanLevelDb(channels), 0.01)
    // Mid and side are the same sound split another way, so they add up to it too.
    for (const band of result.bands) {
      near(
        10 * Math.log10(10 ** ((band.midDbfs ?? NaN) / 10) + 10 ** ((band.sideDbfs ?? NaN) / 10)),
        band.levelDbfs ?? NaN,
        0.01,
      )
    }
  })

  it('stops at half the sample rate, and gives null for a band over it', () => {
    // At 16 kHz nothing over 8 kHz can be in the sound: the sixth band ends there.
    const result = measure(stereoSine(2, 7000, -20, 16000), 16000)
    near(result.bands[5].levelDbfs, -20 - SINE_CREST_DB, 0.1)
    expect(result.bands[6].levelDbfs).toBeNull()
  })
})

describe('left against right', () => {
  it('reads left equal to right as correlation 1, with no side and no width', () => {
    const channel = whiteNoise(5 * RATE, 3)
    const result = measure([channel, channel.slice()], RATE)
    near(result.correlation, 1, 1e-9)
    expect(result.widthDb).toBeNull()
    for (const band of result.bands) {
      expect(band.sideDbfs).toBeNull()
      near(band.midDbfs, band.levelDbfs ?? NaN, 1e-9)
    }
  })

  it('reads left equal to minus right as correlation -1, with no mid and no width', () => {
    const channel = whiteNoise(5 * RATE, 3)
    const result = measure([channel, channel.map((sample) => -sample)], RATE)
    near(result.correlation, -1, 1e-9)
    expect(result.widthDb).toBeNull()
    for (const band of result.bands) {
      expect(band.midDbfs).toBeNull()
      near(band.sideDbfs, band.levelDbfs ?? NaN, 1e-9)
    }
  })

  it('reads two noises that share nothing as correlation 0, as wide as they are narrow', () => {
    const result = measure([whiteNoise(10 * RATE, 5), whiteNoise(10 * RATE, 6)], RATE)
    near(result.correlation, 0, 0.05)
    // With nothing in common the sum and the difference hold the same power.
    near(result.widthDb, 0, 0.5)
  })

  it('tells the mid from the side: a low sine in the middle, a high one at the sides', () => {
    const low = sine(5, 100, RATE, gainOf(-12))
    const high = sine(5, 6000, RATE, gainOf(-30))
    const result = measure([added(low, high), added(low, high, -1)], RATE)
    // The mid is the low sine and the side the high one, each at its own level.
    near(result.bands[1].midDbfs, -12 - SINE_CREST_DB, 0.1)
    near(result.bands[5].sideDbfs, -30 - SINE_CREST_DB, 0.1)
    // Neither is in the other: what the window leaks is 60 dB under, or more.
    expect(result.bands[1].sideDbfs ?? -Infinity).toBeLessThan(-12 - 60)
    expect(result.bands[5].midDbfs ?? -Infinity).toBeLessThan(-30 - 60)
    near(result.widthDb, -18, 0.1)
  })
})

describe('DC offset', () => {
  it('is the mean of each channel', () => {
    const wave = sine(2, 1000, RATE, 0.25)
    const result = measure([wave.map((sample) => sample + 0.1), wave], RATE)
    near(result.dcOffset[0], 0.1, 0.001)
    near(result.dcOffset[1], 0, 0.001)
    expect(result.dcOffset).toHaveLength(2)
  })
})

describe('what cannot be measured is null', () => {
  it('silence: every loudness, the range, the peaks, the crest and the bands', () => {
    const result = measure([new Float32Array(5 * RATE), new Float32Array(5 * RATE)], RATE)
    expect(result.silent).toBe(true)
    expect(result.integratedLufs).toBeNull()
    expect(result.maxMomentaryLufs).toBeNull()
    expect(result.maxShortTermLufs).toBeNull()
    expect(result.shortTerm.lufs).toEqual([null, null, null])
    expect(result.loudnessRangeLu).toBeNull()
    expect(result.truePeakDbtp).toBeNull()
    expect(result.samplePeakDbfs).toBeNull()
    expect(result.rmsDbfs).toBeNull()
    expect(result.crestDb).toBeNull()
    expect(result.widthDb).toBeNull()
    expect(result.correlation).toBeNull()
    expect(result.bands).toHaveLength(7)
    for (const band of result.bands) {
      expect([band.levelDbfs, band.midDbfs, band.sideDbfs]).toEqual([null, null, null])
    }
    expect(result.dcOffset).toEqual([0, 0])
  })

  it('a sound is not silent', () => {
    expect(measure(stereoSine(1, 1000, -60), RATE).silent).toBe(false)
  })

  it('one channel: width, correlation and every mid and side level', () => {
    const result = measure([whiteNoise(5 * RATE, 7)], RATE)
    expect(result.channels).toBe(1)
    expect(result.widthDb).toBeNull()
    expect(result.correlation).toBeNull()
    expect(result.dcOffset).toHaveLength(1)
    for (const band of result.bands) {
      expect(band.midDbfs).toBeNull()
      expect(band.sideDbfs).toBeNull()
    }
    // White noise has something in every band.
    for (const band of result.bands) expect(band.levelDbfs).not.toBeNull()
    expect(result.integratedLufs).not.toBeNull()
  })

  it('300 ms: every loudness and the range, and the peak is still a number', () => {
    const result = measure(stereoSine(0.3, 1000, -23), RATE)
    expect(result.integratedLufs).toBeNull()
    expect(result.maxMomentaryLufs).toBeNull()
    expect(result.maxShortTermLufs).toBeNull()
    expect(result.shortTerm.lufs).toEqual([])
    expect(result.loudnessRangeLu).toBeNull()
    near(result.samplePeakDbfs, -23, 0.1)
    near(result.truePeakDbtp, -23, 0.1)
    near(result.crestDb, SINE_CREST_DB, 0.05)
    near(result.bands[3].levelDbfs, -23 - SINE_CREST_DB, 0.1)
    near(result.dcOffset[0], 0, 0.001)
    expect(result.silent).toBe(false)
  })

  it('two seconds: short-term loudness and the range, and the rest are numbers', () => {
    const result = measure(stereoSine(2, 1000, -23), RATE)
    near(result.integratedLufs, -23, 0.1)
    near(result.maxMomentaryLufs, -23, 0.1)
    expect(result.maxShortTermLufs).toBeNull()
    expect(result.shortTerm.lufs).toEqual([])
    expect(result.loudnessRangeLu).toBeNull()
  })

  it('no frames at all: everything, and it counts as silent', () => {
    const result = measure([new Float32Array(0), new Float32Array(0)], RATE)
    expect(result.silent).toBe(true)
    expect(result.frames).toBe(0)
    expect(result.dcOffset).toEqual([null, null])
    expect(result.rmsDbfs).toBeNull()
  })
})

describe('chunks', () => {
  it('reads the same whether fed whole, 1,000 frames at a time or 16,384', () => {
    const frames = Math.round(7.3 * 44100)
    const tone = sine(7.3, 220, 44100, 0.2)
    const channels = [added(whiteNoise(frames, 8, 0.3), tone), whiteNoise(frames, 9, 0.3)]
    const whole = measure(channels, 44100)
    expect(whole.integratedLufs).not.toBeNull()
    expect(whole.loudnessRangeLu).not.toBeNull()
    expect(inChunks(channels, 44100, 1000)).toEqual(whole)
    expect(inChunks(channels, 44100, 16384)).toEqual(whole)
  })
})

describe('the result', () => {
  it('names the frames, the seconds, the rate, the channels and the version of the measuring', () => {
    const result = measure(stereoSine(2, 1000, -23, 44100), 44100)
    expect(result.frames).toBe(88200)
    expect(result.seconds).toBe(2)
    expect(result.sampleRate).toBe(44100)
    expect(result.channels).toBe(2)
    expect(result.version).toBe(1)
  })

  it.each([
    ['a sound', () => measure([whiteNoise(4 * RATE, 1), whiteNoise(4 * RATE, 2)], RATE)],
    ['silence', () => measure([new Float32Array(4 * RATE), new Float32Array(4 * RATE)], RATE)],
    ['one channel', () => measure([whiteNoise(4 * RATE, 1)], RATE)],
    ['300 ms', () => measure(stereoSine(0.3, 1000, -23), RATE)],
    ['no frames', () => measure([new Float32Array(0)], RATE)],
  ])('is JSON as it stands: %s', (_name, make) => {
    const result = make()
    expect(JSON.parse(JSON.stringify(result))).toEqual(result)
  })
})

describe('a measurer', () => {
  it('takes one or two channels and no other count', () => {
    expect(() => new Measurer(RATE, 3)).toThrow(RangeError)
    expect(() => measure([], RATE)).toThrow(RangeError)
  })

  it('refuses a chunk of another channel count, or with channels of unequal length', () => {
    const measurer = new Measurer(RATE, 2)
    expect(() => measurer.push([new Float32Array(10)])).toThrow(RangeError)
    expect(() => measurer.push([new Float32Array(10), new Float32Array(9)])).toThrow(RangeError)
  })

  it('is read once: nothing is pushed or read after', () => {
    const measurer = new Measurer(RATE, 1)
    measurer.push([sine(1, 1000, RATE, 0.5)])
    measurer.finish()
    expect(() => measurer.push([new Float32Array(10)])).toThrow()
    expect(() => measurer.finish()).toThrow()
  })
})
