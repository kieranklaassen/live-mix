import { describe, expect, it } from 'vitest'

import { asAudioContext, createMockContext } from '../../../testing'
import { DEFAULT_SPACE, generateSpaceImpulse, resolveSpace, spaceImpulseChannel } from '../space'

const RATE = 48000

function energy(data: Float32Array, from = 0, to = data.length): number {
  let sum = 0
  for (let i = from; i < to; i += 1) sum += data[i] * data[i]
  return sum
}

function db(power: number): number {
  return 10 * Math.log10(power)
}

/** Share of a stretch's energy above about `hz`, read off a first difference. */
function brightness(data: Float32Array, from: number, to: number): number {
  let diff = 0
  for (let i = from + 1; i < to; i += 1) diff += (data[i] - data[i - 1]) ** 2
  return diff / energy(data, from, to)
}

describe('the generated space', () => {
  it('fills in the stock room and keeps settings inside what can be made', () => {
    expect(resolveSpace()).toEqual(DEFAULT_SPACE)
    const odd = resolveSpace({ decaySec: -4, darkHz: 50_000, brightHz: 3000, seed: 7.9 })
    expect(odd.decaySec).toBe(0.1)
    expect(odd.darkHz).toBe(3000)
    expect(odd.seed).toBe(7)
  })

  it('is as long as the predelay and the decay, silent until the predelay is over', () => {
    const data = spaceImpulseChannel(RATE, { decaySec: 2, predelaySec: 0.05 })
    expect(data.length).toBe(Math.round(2.05 * RATE))
    expect(energy(data, 0, Math.round(0.05 * RATE))).toBe(0)
  })

  it('carries unit energy on each side, so a steady send comes back as loud as it went in', () => {
    for (const channel of [0, 1]) {
      expect(energy(spaceImpulseChannel(RATE, {}, channel))).toBeCloseTo(1, 5)
    }
  })

  it('is the same room for the same seed and another for another', () => {
    const a = spaceImpulseChannel(RATE, { decaySec: 1, seed: 3 })
    expect(spaceImpulseChannel(RATE, { decaySec: 1, seed: 3 })).toEqual(a)
    expect(spaceImpulseChannel(RATE, { decaySec: 1, seed: 4 })).not.toEqual(a)
  })

  it('differs left and right, so the tail is wide', () => {
    const left = spaceImpulseChannel(RATE, { decaySec: 1 }, 0)
    const right = spaceImpulseChannel(RATE, { decaySec: 1 }, 1)
    let dot = 0
    for (let i = 0; i < left.length; i += 1) dot += left[i] * right[i]
    // Both sides have unit energy, so this is their correlation.
    expect(Math.abs(dot)).toBeLessThan(0.1)
  })

  it('falls about 60 dB over the decay', () => {
    const decaySec = 4
    const data = spaceImpulseChannel(RATE, { decaySec, predelaySec: 0, lowCutHz: 0 })
    const window = Math.round(0.2 * RATE)
    const at = (sec: number) => {
      const from = Math.round(sec * RATE)
      return db(energy(data, from, from + window) / window)
    }
    // Between one and three seconds the line drops 60 dB × 2 / 4.
    expect(at(1) - at(3)).toBeGreaterThan(26)
    expect(at(1) - at(3)).toBeLessThan(34)
  })

  it('swells in instead of starting on a slap', () => {
    const data = spaceImpulseChannel(RATE, { predelaySec: 0, attackSec: 0.04 })
    const ms = Math.round(RATE / 1000)
    expect(energy(data, 0, ms)).toBeLessThan(energy(data, 40 * ms, 41 * ms) * 0.05)
  })

  it('dulls as it goes: the end of the tail has less top than its start', () => {
    const data = spaceImpulseChannel(RATE, { decaySec: 4, predelaySec: 0 })
    const early = brightness(data, Math.round(0.1 * RATE), Math.round(0.4 * RATE))
    const late = brightness(data, Math.round(3 * RATE), Math.round(3.3 * RATE))
    expect(late).toBeLessThan(early * 0.25)
  })

  it('ends on nothing', () => {
    const data = spaceImpulseChannel(RATE, { decaySec: 1 })
    expect(Math.abs(data[data.length - 1])).toBeLessThan(1e-6)
  })

  it('makes a stereo buffer at the context rate', () => {
    const ctx = createMockContext({ sampleRate: 44100 })
    const impulse = generateSpaceImpulse(asAudioContext(ctx), { decaySec: 0.5, predelaySec: 0 })
    expect(impulse.numberOfChannels).toBe(2)
    expect(impulse.sampleRate).toBe(44100)
    expect(impulse.length).toBe(22050)
    expect(energy(impulse.getChannelData(0))).toBeCloseTo(1, 5)
    expect(energy(impulse.getChannelData(1))).toBeCloseTo(1, 5)
  })
})
