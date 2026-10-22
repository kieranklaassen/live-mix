// The six voice cleanup kernels, rendered offline on made-up sounds: each
// takes off what it is for, leaves a clean voice as it was, holds its sound
// as long as it says, and is bypassed to the dry sound held as long.

import { describe, expect, it } from 'vitest'

import {
  CLEANUP_KINDS,
  cleanupLatencySamples,
  type CleanupKind,
} from '../devices/native/cleanup/abi'
import { type AnyCleanupKernel } from '../devices/native/cleanup/CleanupKernel'
import { type DeclickKernel } from '../devices/native/cleanup/DeclickKernel'
import { createCleanupKernel } from '../devices/native/cleanup/kernels'

const SAMPLE_RATE = 48_000
const BLOCK = 128

const db = (ratio: number): number => 20 * Math.log10(ratio)

function rms(signal: Float32Array, from = 0, to = signal.length): number {
  let sum = 0
  for (let i = from; i < to; i += 1) sum += signal[i] * signal[i]
  return Math.sqrt(sum / (to - from))
}

/** A seeded white noise, ±`amplitude`. */
function noise(seconds: number, amplitude: number, seed = 1): Float32Array {
  let state = seed >>> 0
  return Float32Array.from({ length: seconds * SAMPLE_RATE }, () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0
    return amplitude * ((state / 2 ** 32) * 2 - 1)
  })
}

/** A held voiced sound: twenty harmonics of `f0` falling as 1/h, about −28 dBFS. */
function vowel(seconds: number, f0 = 137): Float32Array {
  return Float32Array.from({ length: seconds * SAMPLE_RATE }, (_, i) => {
    let sum = 0
    for (let h = 1; h <= 20; h += 1)
      sum += Math.sin((2 * Math.PI * f0 * h * i) / SAMPLE_RATE + h) / h
    return 0.05 * sum
  })
}

/** Speech of a sort: the vowel in syllables of 250 ms with 150 ms between. */
function speech(seconds: number): Float32Array {
  const signal = vowel(seconds)
  for (let i = 0; i < signal.length; i += 1) {
    const t = (i / SAMPLE_RATE) % 0.4
    signal[i] *= t < 0.25 ? Math.sin((Math.PI * t) / 0.25) : 0
  }
  return signal
}

function render(kernel: AnyCleanupKernel, signal: Float32Array): Float32Array {
  const out = new Float32Array(signal.length)
  const block = [new Float32Array(BLOCK)]
  for (let start = 0; start + BLOCK <= signal.length; start += BLOCK) {
    kernel.process([signal.subarray(start, start + BLOCK)], block, BLOCK)
    out.set(block[0], start)
  }
  return out
}

function through(kind: CleanupKind, signal: Float32Array, params: Record<string, number> = {}) {
  const kernel = createCleanupKernel(kind, SAMPLE_RATE)
  for (const [name, value] of Object.entries(params)) kernel.setParam(name, value)
  return { out: render(kernel, signal), latency: kernel.latencySamples, kernel }
}

/** The change in level, in dB, from `signal` to `out` over [from, to) of the signal, `out` read `latency` late. */
function change(
  signal: Float32Array,
  out: Float32Array,
  latency: number,
  from: number,
  to: number,
): number {
  return db(rms(out, from + latency, to + latency) / rms(signal, from, to))
}

describe('every voice cleanup kernel', () => {
  it.each(CLEANUP_KINDS)(
    '%s leaves speech with nothing wrong in it within half a dB, or the room within 3 dB',
    (kind) => {
      const signal = speech(3)
      const { out, latency } = through(kind, signal)
      const moved = change(signal, out, latency, SAMPLE_RATE, 2 * SAMPLE_RATE)
      // De-reverb takes a voice's own steady part for the room it would ring in: a little of a dry voice goes with it.
      expect(Math.abs(moved), kind).toBeLessThan(kind === 'de-reverb' ? 3 : 0.5)
    },
  )

  it.each(CLEANUP_KINDS)(
    '%s holds its sound as long as it says, and bypassed is the dry sound held as long',
    (kind) => {
      const kernel = createCleanupKernel(kind, SAMPLE_RATE)
      expect(kernel.latencySamples).toBe(cleanupLatencySamples(kind, SAMPLE_RATE))
      kernel.bypass = true
      const signal = speech(1)
      const out = render(kernel, signal)
      // Past the 5 ms crossfade the output is the input, exactly, `latencySamples` late.
      for (let i = 2000; i < signal.length - kernel.latencySamples - BLOCK; i += 97) {
        expect(out[i + kernel.latencySamples]).toBeCloseTo(signal[i], 6)
      }
    },
  )

  it.each(CLEANUP_KINDS)(
    '%s plays a mono signal on both sides of a stereo output, and a missing input as silence',
    (kind) => {
      const kernel = createCleanupKernel(kind, SAMPLE_RATE)
      const left = new Float32Array(BLOCK)
      const right = new Float32Array(BLOCK)
      const signal = speech(0.5)
      for (let start = 0; start + BLOCK <= signal.length; start += BLOCK) {
        kernel.process([signal.subarray(start, start + BLOCK)], [left, right], BLOCK)
        expect(right).toEqual(left)
      }
      kernel.reset()
      kernel.process([], [left, right], BLOCK)
      expect(Math.max(...left.map(Math.abs))).toBe(0)
    },
  )

  it('meters the dB it took off, and reads 0 over silence', () => {
    const kernel = createCleanupKernel('de-hum', SAMPLE_RATE)
    const hum = Float32Array.from(
      { length: SAMPLE_RATE },
      (_, i) => 0.1 * Math.sin((2 * Math.PI * 60 * i) / SAMPLE_RATE),
    )
    render(kernel, hum)
    // The narrow cut takes a few hundred milliseconds to reach its depth: the second span reads it.
    kernel.takeReduction()
    render(kernel, hum)
    expect(kernel.takeReduction()).toBeGreaterThan(20)
    render(kernel, new Float32Array(SAMPLE_RATE))
    expect(kernel.takeReduction()).toBe(0)
  })
})

describe('de-hum', () => {
  it('takes 60 Hz hum and its harmonics down by about the reduction, and 50 Hz when told', () => {
    const hum = (mains: number) =>
      Float32Array.from({ length: SAMPLE_RATE }, (_, i) =>
        [1, 2, 3].reduce(
          (sum, k) => sum + (0.1 / k) * Math.sin((2 * Math.PI * mains * k * i) / SAMPLE_RATE),
          0,
        ),
      )
    const sixty = hum(60)
    expect(
      change(sixty, through('de-hum', sixty).out, 0, SAMPLE_RATE / 2, SAMPLE_RATE),
    ).toBeLessThan(-25)
    const fifty = hum(50)
    expect(
      change(fifty, through('de-hum', fifty).out, 0, SAMPLE_RATE / 2, SAMPLE_RATE),
    ).toBeGreaterThan(-3)
    expect(
      change(fifty, through('de-hum', fifty, { mains: 0 }).out, 0, SAMPLE_RATE / 2, SAMPLE_RATE),
    ).toBeLessThan(-25)
  })

  it('leaves a tone 5 Hz off a harmonic within a quarter of a dB', () => {
    const tone = Float32Array.from({ length: SAMPLE_RATE }, (_, i) =>
      Math.sin((2 * Math.PI * 125 * i) / SAMPLE_RATE),
    )
    expect(
      change(tone, through('de-hum', tone).out, 0, SAMPLE_RATE / 2, SAMPLE_RATE),
    ).toBeGreaterThan(-0.25)
  })
})

describe('de-click', () => {
  it('draws a voice through clicks in it, and touches nothing of a voice with none', () => {
    const clean = speech(2)
    const clicked = Float32Array.from(clean)
    const clicks: number[] = []
    for (let at = 10_000; at < clicked.length - 2000; at += 9001) {
      clicked[at] += 0.5
      clicked[at + 1] -= 0.3
      clicks.push(at)
    }
    const { out, latency, kernel } = through('de-click', clicked)
    expect((kernel as DeclickKernel).clicksRepaired).toBe(clicks.length)
    let worst = 0
    for (let i = 5000; i < clean.length - 2000; i += 1)
      worst = Math.max(worst, Math.abs(out[i + latency] - clean[i]))
    expect(worst).toBeLessThan(0.05)

    const untouched = through('de-click', clean)
    expect((untouched.kernel as DeclickKernel).clicksRepaired).toBe(0)
    for (let i = 0; i < clean.length - untouched.latency - BLOCK; i += 1) {
      expect(untouched.out[i + untouched.latency]).toBe(clean[i])
    }
  })

  it('leaves a burst longer than Length alone: a consonant, not a click', () => {
    const signal = speech(1)
    const burst = noise(0.02, 0.2, 7)
    signal.set(
      burst.map((x, i) => signal[20_000 + i] + x),
      20_000,
    )
    const { kernel } = through('de-click', signal)
    expect((kernel as DeclickKernel).clicksRepaired).toBe(0)
  })
})

describe('de-plosive', () => {
  it('turns a thump in the lows down, and leaves a deep voice alone', () => {
    const thump = Float32Array.from({ length: SAMPLE_RATE / 2 }, (_, i) =>
      i < 4800 ? 0.5 * Math.sin((2 * Math.PI * 40 * i) / SAMPLE_RATE) * Math.exp(-i / 1500) : 0,
    )
    expect(change(thump, through('de-plosive', thump).out, 0, 0, 4800)).toBeLessThan(-6)
    const deep = vowel(1, 90)
    expect(Math.abs(change(deep, through('de-plosive', deep).out, 0, 0, SAMPLE_RATE))).toBeLessThan(
      0.1,
    )
  })
})

describe('de-noise', () => {
  it('learns a steady noise and takes most of the reduction off it', () => {
    const hiss = noise(4, 0.01)
    const { out, latency } = through('de-noise', hiss)
    expect(change(hiss, out, latency, 2 * SAMPLE_RATE, 3 * SAMPLE_RATE)).toBeLessThan(-8)
    expect(
      change(
        hiss,
        through('de-noise', hiss, { reduction: 0 }).out,
        latency,
        SAMPLE_RATE,
        3 * SAMPLE_RATE,
      ),
    ).toBeCloseTo(0, 1)
  })

  it('leaves speech over the noise cleaner by several dB than it came', () => {
    const voice = speech(4)
    const hiss = noise(4, 0.01)
    const noisy = voice.map((x, i) => x + hiss[i])
    const { out, latency } = through('de-noise', noisy)
    const before = new Float32Array(noisy.length)
    const after = new Float32Array(noisy.length)
    for (let i = 0; i < noisy.length - latency; i += 1) {
      before[i] = noisy[i] - voice[i]
      after[i] = out[i + latency] - voice[i]
    }
    const from = 2 * SAMPLE_RATE
    const to = 4 * SAMPLE_RATE - 2000
    expect(db(rms(after, from, to) / rms(before, from, to))).toBeLessThan(-5)
  })
})

describe('de-reverb', () => {
  it('takes a room’s tail down more than the sound that rang it', { timeout: 30_000 }, () => {
    const syllable = vowel(1)
    const dry = new Float32Array(2 * SAMPLE_RATE)
    for (let i = 0; i < dry.length; i += 1)
      dry[i] = i % SAMPLE_RATE < 0.25 * SAMPLE_RATE ? syllable[i % SAMPLE_RATE] : 0
    // A room of 0.6 s: the sound, then a tail of noise falling 60 dB in 0.6 s from 10 ms on.
    const tail = noise(1, 0.25, 3)
    const wet = Float32Array.from(dry)
    for (let i = 0; i < dry.length; i += 1) {
      if (dry[i] === 0) continue
      for (let j = 480; j < SAMPLE_RATE && i + j < wet.length; j += 8) {
        wet[i + j] += 2 * dry[i] * tail[j] * Math.exp((-6.9 * j) / (0.6 * SAMPLE_RATE))
      }
    }
    const { out, latency } = through('de-reverb', wet)
    const head = change(wet, out, latency, SAMPLE_RATE + 2400, SAMPLE_RATE + 0.2 * SAMPLE_RATE)
    const ringing = change(
      wet,
      out,
      latency,
      SAMPLE_RATE + 0.35 * SAMPLE_RATE,
      SAMPLE_RATE + 0.7 * SAMPLE_RATE,
    )
    expect(ringing).toBeLessThan(-6)
    expect(ringing).toBeLessThan(head - 4)
  })
})

describe('de-ess', () => {
  it('turns hiss over the frequency down by up to the range, and a vowel not at all', () => {
    const hiss = noise(1, 0.05, 2)
    const highs = Float32Array.from(hiss, (x, i) => x - (i > 0 ? hiss[i - 1] : 0))
    const taken = change(highs, through('de-ess', highs).out, 0, SAMPLE_RATE / 2, SAMPLE_RATE)
    expect(taken).toBeLessThan(-6)
    expect(taken).toBeGreaterThan(-8.5)
    const voice = speech(1)
    expect(Math.abs(change(voice, through('de-ess', voice).out, 0, 0, SAMPLE_RATE))).toBeLessThan(
      0.05,
    )
  })

  it('judges the hiss against the voice, so a quiet recording is treated as a loud one', () => {
    const hiss = noise(1, 0.05, 2)
    const loud = Float32Array.from(hiss, (x, i) => x - (i > 0 ? hiss[i - 1] : 0))
    const quiet = loud.map((x) => x / 30)
    const loudTaken = change(loud, through('de-ess', loud).out, 0, SAMPLE_RATE / 2, SAMPLE_RATE)
    const quietTaken = change(quiet, through('de-ess', quiet).out, 0, SAMPLE_RATE / 2, SAMPLE_RATE)
    expect(quietTaken).toBeCloseTo(loudTaken, 1)
  })
})
