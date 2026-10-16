import { describe, expect, it } from 'vitest'
import { roomImpulse, withRoom } from '../../src/lab/room.ts'
import {
  benchSource,
  differenceDb,
  expectSoundLab,
  gainToDb,
  lab,
  noise,
  rms,
  seconds,
  silence,
  sine,
  type Source,
} from './support.ts'

// The lab's starting controls, for asking the engine for the same room the lab is handed.
const START = { decay: 3, predelay: 20, swell: 40, bright: 7000, dark: 900, grain: 0 }

const room = async () => withRoom(await lab('convolution-reverb'))

/** One unit sample at the loop's start, on both channels. */
function click(frames: number): Source {
  const source = silence(frames)
  source.left[0] = 1
  source.right[0] = 1
  return source
}

/** The time for the level to fall 60 dB, from a line fitted to its level in dB over the middle of the tail. */
function fittedDecay(h: Float32Array, predelaySec: number, decaySec: number): number {
  const window = 2400 // 50 ms
  const ts: number[] = []
  const dbs: number[] = []
  for (let t = predelaySec + 0.1 * decaySec; t < predelaySec + 0.8 * decaySec; t += 0.05) {
    const at = Math.round(t * 48_000)
    ts.push(t)
    dbs.push(gainToDb(rms(h, at, at + window)))
  }
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
  const mt = mean(ts)
  const md = mean(dbs)
  let above = 0
  let below = 0
  for (let i = 0; i < ts.length; i += 1) {
    above += (ts[i]! - mt) * (dbs[i]! - md)
    below += (ts[i]! - mt) ** 2
  }
  return -60 / (above / below)
}

/** Roughly the band the engine sets the room's level in: a one-pole each way, twice over. */
function levelBand(x: Float32Array): Float32Array {
  const y = x.slice()
  for (let pass = 0; pass < 2; pass += 1) {
    const high = Math.exp((-2 * Math.PI * 150) / 48_000)
    const low = 1 - Math.exp((-2 * Math.PI * 1500) / 48_000)
    let highIn = 0
    let highOut = 0
    let lowOut = 0
    for (let i = 0; i < y.length; i += 1) {
      highOut = high * (highOut + y[i]! - highIn)
      highIn = y[i]!
      lowOut += low * (highOut - lowOut)
      y[i] = lowOut
    }
  }
  return y
}

/** The mean level, in dB, of a block of the impulse's picture: columns as parts of its length, rows in hertz. */
function pictureLevel(
  picture: { channels_data: Float32Array[]; columns: number },
  from: number,
  to: number,
  lowHz: number,
  highHz: number,
): number {
  const rows = 513
  const data = picture.channels_data[0]!
  let power = 0
  let count = 0
  for (
    let col = Math.round(from * picture.columns);
    col < Math.round(to * picture.columns);
    col += 1
  ) {
    for (let row = Math.round(lowHz / 46.875); row <= Math.round(highHz / 46.875); row += 1) {
      power += 10 ** (data[col * rows + row]! / 10)
      count += 1
    }
  }
  return 10 * Math.log10(power / count)
}

describe('convolution reverb', () => {
  it('is a sound lab on the drums: every tap says something, loops, and answers to every control', async () => {
    const theLab = await room()
    const drums = await benchSource('drums', seconds(4))
    expectSoundLab(theLab, drums, theLab.render(drums, {}))
  })

  it('is handed the same room for the same settings, sample for sample, and a different one left and right (claim same-room)', async () => {
    const theLab = await room()
    const drums = await benchSource('drums', seconds(4))
    const first = theLab.render(drums, {}).taps.impulse!
    const again = theLab.render(drums, {}).taps.impulse!
    expect(again.channels_data[0]!.every((v, i) => v === first.channels_data[0]![i])).toBe(true)
    expect(again.channels_data[1]!.every((v, i) => v === first.channels_data[1]![i])).toBe(true)
    expect(differenceDb(first.channels_data[1]!, first.channels_data[0]!)).toBeGreaterThan(0)
  })

  it('gives back the impulse itself for a single sample in, below −120 dB (claim click-returns-impulse)', async () => {
    const theLab = await room()
    const out = theLab.render(click(seconds(4)), {})
    for (const channel of [0, 1]) {
      const wet = out.taps.wet!.channels_data[channel]!
      const impulse = out.taps.impulse!.channels_data[channel]!
      expect(differenceDb(wet, impulse)).toBeLessThan(-120)
    }
  })

  it('gets the same answer from the product of spectra as from the sum done term by term, below −110 dB (claim sums-agree)', async () => {
    const theLab = await room()
    for (const id of ['drums', 'guitar', 'noise']) {
      const source = await benchSource(id, seconds(4))
      const out = theLab.render(source, {})
      expect(out.checks.sums).toBeLessThan(-110)
      // And the two are not both nothing.
      expect(rms(out.taps.direct!.channels_data[0]!)).toBeGreaterThan(1e-4)
    }
  })

  it('keeps the loop as it sounds the tenth time round: the same as the sum over a loop that never stops, below −110 dB (claim loop-wraps)', async () => {
    const theLab = await room()
    const frames = seconds(0.5)
    const drums = await benchSource('drums', frames)
    // A room of 0.3 s on a loop of half a second, so the sum term by term stays small enough to
    // do here. The tail of each pass is still ringing when the next begins.
    const out = theLab.render(drums, { decay: 0.3 }, frames)
    const taps = roomImpulse({ ...START, decay: 0.3 }).left
    const expected = new Float32Array(frames)
    for (let n = 0; n < frames; n += 1) {
      let sum = 0
      for (let k = 0; k < taps.length; k += 1)
        sum += taps[k]! * drums.left[(n - k + frames) % frames]!
      expected[n] = sum
    }
    expect(differenceDb(out.taps.wet!.channels_data[0]!, expected)).toBeLessThan(-110)
  })

  it('folds an impulse longer than the loop back onto the loop', async () => {
    const theLab = await room()
    const frames = seconds(1)
    const out = theLab.render(click(frames), { decay: 3 }, frames)
    const h = roomImpulse(START).left
    const folded = new Float32Array(frames)
    for (let n = 0; n < h.length; n += 1) folded[n % frames]! += h[n]!
    expect(differenceDb(out.taps.impulse!.channels_data[0]!, folded)).toBeLessThan(-120)
    expect(differenceDb(out.taps.wet!.channels_data[0]!, folded)).toBeLessThan(-110)
  })

  it('falls 60 dB over the decay it is set to, within 5 % (claim decay-time)', () => {
    for (const decay of [1, 3, 5]) {
      const h = roomImpulse({ ...START, decay }).left
      const measured = fittedDecay(h, 0.02, decay)
      expect(measured).toBeGreaterThan(decay * 0.95)
      expect(measured).toBeLessThan(decay * 1.05)
    }
  })

  it('has 60 dB of its energy behind it 2.7 s into a 3 s room (claim energy-60)', async () => {
    const theLab = await room()
    const energy = theLab.render(click(seconds(4)), {}).taps.energy!
    const curve = energy.channels_data[0]!
    let k = 0
    while (k < curve.length && curve[k]! > -60) k += 1
    const at = energy.x0 + ((energy.x1 - energy.x0) * k) / (curve.length - 1)
    expect(at).toBeGreaterThan(2.6)
    expect(at).toBeLessThan(2.85)
    // Within a tenth of the decay it is set to.
    expect(Math.abs(at - 3) / 3).toBeLessThan(0.1)
  })

  it('loses its top as it goes: 5 kHz against 500 Hz, early and late (claim dark-end)', async () => {
    const theLab = await room()
    const picture = theLab.render(click(seconds(4)), {}).taps.picture!
    const early =
      pictureLevel(picture, 0.05, 0.15, 4500, 5500) - pictureLevel(picture, 0.05, 0.15, 400, 600)
    const late =
      pictureLevel(picture, 0.6, 0.7, 4500, 5500) - pictureLevel(picture, 0.6, 0.7, 400, 600)
    // A tenth of the way in the top is about 4 dB under the low mids; two thirds through, 17 dB.
    expect(early).toBeGreaterThan(-5.5)
    expect(early).toBeLessThan(-2)
    expect(late).toBeGreaterThan(-19)
    expect(late).toBeLessThan(-15)
  })

  it('gives white noise back about 5 dB quieter than it went in (claim white-quieter)', async () => {
    const theLab = await room()
    const white = noise(0.25, seconds(4))
    const wet = theLab.render(white, {}).taps.wet!.channels_data[0]!
    const change = gainToDb(rms(wet) / rms(white.left))
    expect(change).toBeGreaterThan(-5.6)
    expect(change).toBeLessThan(-4.4)
  })

  it('gives noise in the low mids back as loud as it went in, within 1.5 dB (claim band-as-loud)', async () => {
    const theLab = await room()
    const white = noise(0.25, seconds(4))
    const band = { left: levelBand(white.left), right: levelBand(white.right) }
    const out = theLab.render(band, {})
    for (const [channel, dry] of [band.left, band.right].entries()) {
      const change = gainToDb(rms(out.taps.wet!.channels_data[channel]!) / rms(dry))
      expect(Math.abs(change)).toBeLessThan(1.5)
    }
  })

  it('gives single tones back anywhere from 4 dB quieter to 6 dB louder: a room of noise is ragged (claim tones-vary)', async () => {
    const theLab = await room()
    const changes = [220, 440, 1000].map((hz) => {
      const tone = sine(hz, 0.5, seconds(4))
      const wet = theLab.render(tone, {}).taps.wet!.channels_data[0]!
      return gainToDb(rms(wet) / rms(tone.left))
    })
    // Measured: −3.7, +0.7 and +5.6 dB.
    expect(Math.min(...changes)).toBeGreaterThan(-4.5)
    expect(Math.min(...changes)).toBeLessThan(-3)
    expect(Math.max(...changes)).toBeGreaterThan(5)
    expect(Math.max(...changes)).toBeLessThan(6.5)
  })

  it('uses only as much of the impulse as it is told to', async () => {
    const theLab = await room()
    const drums = await benchSource('drums', seconds(4))
    const out = theLab.render(drums, { used: 100 })
    const impulse = out.taps.impulse!.channels_data[0]!
    // 100 ms is 4,800 samples: nothing after them.
    expect(impulse.subarray(4800).every((v) => v === 0)).toBe(true)
    expect(impulse.subarray(960, 4800).some((v) => v !== 0)).toBe(true)
    // Under the pre-delay there is no impulse yet, and so no reverb.
    const none = theLab.render(drums, { used: 10 })
    expect(none.taps.wet!.channels_data[0]!.every((v) => v === 0)).toBe(true)
  })

  it('adds the reverb to the dry loop at the send level', async () => {
    const theLab = await room()
    const drums = await benchSource('drums', seconds(4))
    const out = theLab.render(drums, { send: -6 })
    const gain = 10 ** (-6 / 20)
    const sum = out.taps.out!.channels_data[0]!
    const wet = out.taps.wet!.channels_data[0]!
    const expected = drums.left.map((x, i) => x + gain * wet[i]!)
    expect(differenceDb(sum, expected)).toBeLessThan(-120)
  })
})
