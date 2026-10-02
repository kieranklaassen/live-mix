import { describe, expect, it } from 'vitest'

import { asAudioContext, createMockContext } from '../../../testing'
import {
  DEFAULT_SPACE,
  GRAIN_ECHOES_PER_SEC,
  MAX_SPACE_DRIFT_CENTS,
  MAX_SPACE_DRIFT_DELAY_SEC,
  MAX_SPACE_DRIVE_DB,
  MAX_SPACE_LEVEL_DB,
  MIN_SPACE_LEVEL_DB,
  SPACE_DRIVE_CURVE_REACH,
  SPACE_DRIVE_LEVEL_DB,
  SPACE_LEVEL_HIGH_HZ,
  SPACE_LEVEL_LOW_HZ,
  generateSpaceImpulse,
  grainEchoesPerSec,
  resolveSpace,
  sameSpaceImpulse,
  spaceColour,
  spaceDrift,
  spaceDriveCurve,
  spaceDriveGains,
  spaceDriveShape,
  spaceImpulseChannel,
} from '../space'

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

/**
 * What the room gives back of steady sound between two frequencies, in dB
 * against what it is sent: its response at a spread of frequencies there.
 */
function bandGainDb(data: Float32Array, lowHz: number, highHz: number, rate = RATE): number {
  const steps = 48
  let sum = 0
  for (let step = 0; step < steps; step += 1) {
    const hz = lowHz * (highHz / lowHz) ** ((step + 0.5) / steps)
    const coefficient = 2 * Math.cos((2 * Math.PI * hz) / rate)
    let s1 = 0
    let s2 = 0
    for (const sample of data) {
      const s = sample + coefficient * s1 - s2
      s2 = s1
      s1 = s
    }
    sum += s1 * s1 + s2 * s2 - coefficient * s1 * s2
  }
  return db(sum / steps)
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

  it('gives a steady sound in the low mids back as loud as it went in, on each side', () => {
    for (const channel of [0, 1]) {
      const data = spaceImpulseChannel(RATE, {}, channel)
      const gain = bandGainDb(data, SPACE_LEVEL_LOW_HZ * 2, SPACE_LEVEL_HIGH_HZ)
      expect(gain).toBeGreaterThan(-2)
      expect(gain).toBeLessThan(2)
    }
  })

  it('gives back less of the top than of the low mids, and less than it is sent overall', () => {
    const data = spaceImpulseChannel(RATE)
    const lowMids = bandGainDb(data, 300, 1500)
    expect(bandGainDb(data, 8000, 16000)).toBeLessThan(lowMids - 6)
    // Hiss sent in at 0 dB comes back quieter: the whole spectrum's share is the impulse's energy.
    expect(db(energy(data))).toBeLessThan(-3)
    expect(db(energy(data))).toBeGreaterThan(-12)
  })

  it('sets the same level at another rate, another length and another colour', () => {
    for (const data of [
      spaceImpulseChannel(44100),
      spaceImpulseChannel(RATE, { decaySec: 1.5 }),
      spaceImpulseChannel(RATE, { brightHz: 12_000, darkHz: 4000 }),
    ]) {
      const rate = data.length === Math.round(5.02 * 44100) ? 44100 : RATE
      const gain = bandGainDb(data, SPACE_LEVEL_LOW_HZ * 2, SPACE_LEVEL_HIGH_HZ, rate)
      expect(gain).toBeGreaterThan(-2.5)
      expect(gain).toBeLessThan(2.5)
    }
  })

  it('comes back louder or quieter by its level, and is otherwise the same room', () => {
    const stock = spaceImpulseChannel(RATE, { decaySec: 1 })
    const loud = spaceImpulseChannel(RATE, { decaySec: 1, levelDb: 6 })
    const from = Math.round(0.1 * RATE)
    expect(loud[from] / stock[from]).toBeCloseTo(10 ** (6 / 20), 5)
    expect(db(energy(loud) / energy(stock))).toBeCloseTo(6, 3)
    expect(resolveSpace({ levelDb: 40 }).levelDb).toBe(MAX_SPACE_LEVEL_DB)
    expect(resolveSpace({ levelDb: -90 }).levelDb).toBe(MIN_SPACE_LEVEL_DB)
    expect(sameSpaceImpulse({}, { levelDb: 3 })).toBe(false)
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
    expect(Math.abs(dot) / Math.sqrt(energy(left) * energy(right))).toBeLessThan(0.1)
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
    expect(impulse.getChannelData(0)).toEqual(
      spaceImpulseChannel(44100, { decaySec: 0.5, predelaySec: 0 }, 0),
    )
    expect(impulse.getChannelData(1)).toEqual(
      spaceImpulseChannel(44100, { decaySec: 0.5, predelaySec: 0 }, 1),
    )
  })
})

describe('a rough room', () => {
  /** How many separate bursts a stretch of the tail is made of: runs of sound with silence between. */
  function bursts(data: Float32Array, from: number, to: number): number {
    let peak = 0
    for (let i = from; i < to; i += 1) peak = Math.max(peak, Math.abs(data[i]))
    const floor = peak * 0.05
    const gap = Math.round(RATE / 2000)
    let count = 0
    let quiet = gap
    for (let i = from; i < to; i += 1) {
      if (Math.abs(data[i]) > floor) {
        if (quiet >= gap) count += 1
        quiet = 0
      } else {
        quiet += 1
      }
    }
    return count
  }

  it('is the stock room, sample for sample, while grain is 0', () => {
    expect(spaceImpulseChannel(RATE, { decaySec: 1, grain: 0 })).toEqual(
      spaceImpulseChannel(RATE, { decaySec: 1 }),
    )
  })

  it('thins from every sample to a hundred or so echoes a second', () => {
    expect(grainEchoesPerSec(0, RATE)).toBe(RATE)
    expect(grainEchoesPerSec(1, RATE)).toBeCloseTo(GRAIN_ECHOES_PER_SEC)
    expect(grainEchoesPerSec(0.5, RATE)).toBeCloseTo(Math.sqrt(RATE * GRAIN_ECHOES_PER_SEC))
    expect(grainEchoesPerSec(4, 44100)).toBeCloseTo(GRAIN_ECHOES_PER_SEC)
  })

  it('breaks the tail into separate echoes, about as many as it says', () => {
    // Bright all the way, so an echo is a few samples long and can be counted.
    const open = { decaySec: 2, predelaySec: 0, lowCutHz: 0, brightHz: 20_000, darkHz: 20_000 }
    const from = Math.round(0.1 * RATE)
    const to = Math.round(0.6 * RATE)
    const rough = bursts(spaceImpulseChannel(RATE, { ...open, grain: 1 }), from, to)
    // Half a second of a room at 120 echoes a second, less the few that land on one another.
    expect(rough).toBeGreaterThan(35)
    expect(rough).toBeLessThan(80)
    const halfway = bursts(spaceImpulseChannel(RATE, { ...open, grain: 0.5 }), from, to)
    expect(halfway).toBeGreaterThan(rough * 4)
  })

  it('comes back as loud as a smooth room in the low mids', () => {
    for (const grain of [0.3, 0.7, 1]) {
      const gain = bandGainDb(
        spaceImpulseChannel(RATE, { grain }),
        SPACE_LEVEL_LOW_HZ * 2,
        SPACE_LEVEL_HIGH_HZ,
      )
      expect(gain).toBeGreaterThan(-3)
      expect(gain).toBeLessThan(3)
    }
  })

  it('is the same rough room for the same seed, and differs left and right', () => {
    const a = spaceImpulseChannel(RATE, { decaySec: 1, grain: 0.8 })
    expect(spaceImpulseChannel(RATE, { decaySec: 1, grain: 0.8 })).toEqual(a)
    expect(spaceImpulseChannel(RATE, { decaySec: 1, grain: 0.8 }, 1)).not.toEqual(a)
  })
})

describe('what a room does on the way through', () => {
  it('is clean and still unless told otherwise, and keeps drive and drift in range', () => {
    expect(spaceColour()).toEqual({ driveDb: 0, driftCents: 0, driftHz: 0.5 })
    expect(spaceColour({ driveDb: 90, driftCents: -3, driftHz: 400 })).toEqual({
      driveDb: MAX_SPACE_DRIVE_DB,
      driftCents: 0,
      driftHz: 8,
    })
    expect(resolveSpace({ grain: 7 }).grain).toBe(1)
    expect(spaceColour({ driftCents: 900 }).driftCents).toBe(MAX_SPACE_DRIFT_CENTS)
  })

  it('two rooms share an impulse when only the way through differs', () => {
    expect(sameSpaceImpulse({ decaySec: 5 }, { driveDb: 12, driftCents: 9, driftHz: 2 })).toBe(true)
    expect(sameSpaceImpulse({}, { grain: 0.2 })).toBe(false)
    expect(sameSpaceImpulse({}, { decaySec: 6 })).toBe(false)
    expect(sameSpaceImpulse({ seed: 1 }, { seed: 2 })).toBe(false)
  })

  it('the saturator passes quiet sound as it is and holds loud sound', () => {
    expect(spaceDriveShape(0)).toBe(0)
    expect(spaceDriveShape(1e-4) / 1e-4).toBeCloseTo(1, 3)
    // Lopsided: it gives more one way than the other, which is where even harmonics come from.
    expect(spaceDriveShape(4)).toBeLessThan(-spaceDriveShape(-4))
    expect(spaceDriveShape(4)).toBeLessThan(1)
    const curve = spaceDriveCurve(1025)
    expect(curve).toHaveLength(1025)
    expect(curve[512]).toBe(0)
    expect(curve[1024]).toBeCloseTo(spaceDriveShape(SPACE_DRIVE_CURVE_REACH), 6)
    expect(curve[0]).toBeCloseTo(spaceDriveShape(-SPACE_DRIVE_CURVE_REACH), 6)
    for (let i = 1; i < curve.length; i += 1) expect(curve[i]).toBeGreaterThanOrEqual(curve[i - 1])
  })

  it('a steady sound at the reference level comes back as loud at any drive', () => {
    expect(spaceDriveGains(0)).toEqual({ into: 1, outOf: 1 })
    const rms = 10 ** (SPACE_DRIVE_LEVEL_DB / 20)
    for (const driveDb of [3, 12, 24, MAX_SPACE_DRIVE_DB]) {
      const { into, outOf } = spaceDriveGains(driveDb)
      expect(into).toBeCloseTo(10 ** (driveDb / 20) / SPACE_DRIVE_CURVE_REACH)
      const steps = 4096
      let sum = 0
      let squares = 0
      for (let i = 0; i < steps; i += 1) {
        const x = rms * Math.SQRT2 * Math.sin((2 * Math.PI * (i + 0.25)) / steps)
        const y = outOf * spaceDriveShape(into * SPACE_DRIVE_CURVE_REACH * x)
        sum += y
        squares += y * y
      }
      const out = Math.sqrt(squares / steps - (sum / steps) ** 2)
      expect(20 * Math.log10(out / rms)).toBeCloseTo(0, 1)
    }
    // More drive, more held: what comes out of the saturator is turned down further.
    expect(spaceDriveGains(24).outOf).toBeLessThan(spaceDriveGains(12).outOf)
    expect(spaceDriveGains(200)).toEqual(spaceDriveGains(MAX_SPACE_DRIVE_DB))
  })

  it('two sines move the tail by as many cents as asked, at most', () => {
    const drift = spaceDrift({ driftCents: 12, driftHz: 0.5 })
    expect(drift.rates[0]).toBe(0.5)
    expect(drift.rates[1]).toBeGreaterThan(1)
    // A delay moving at 2π·hz·depth seconds a second shifts pitch by that ratio.
    const ratio = drift.rates.reduce(
      (sum, hz, index) => sum + 2 * Math.PI * hz * drift.depths[index],
      0,
    )
    expect(1200 * Math.log2(1 + ratio)).toBeCloseTo(12, 5)
    expect(drift.delaySec).toBeGreaterThan(drift.depths[0] + drift.depths[1])
    expect(spaceDrift({ driftCents: 0, driftHz: 0.5 }).depths).toEqual([0, 0])
  })

  it('a slow, deep drift keeps inside the delay there is', () => {
    const drift = spaceDrift({ driftCents: MAX_SPACE_DRIFT_CENTS, driftHz: 0.05 })
    expect(drift.delaySec + drift.depths[0] + drift.depths[1]).toBeLessThanOrEqual(
      MAX_SPACE_DRIFT_DELAY_SEC,
    )
    expect(drift.delaySec - drift.depths[0] - drift.depths[1]).toBeGreaterThan(0)
  })
})
