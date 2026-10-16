import { describe, expect, it } from 'vitest'
import {
  benchSource,
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

const NAME = '11-chorus-and-flanging'

/** One bin of the lab's 4,096-point spectrum, in hertz: 11.72. */
const BIN = 48_000 / 4096
/** One point of a control tap, in seconds. */
const POINT = 16 / 48_000

/** White noise, the same on both sides. */
function monoNoise(frames: number): Source {
  const { left } = noise(0.25, frames)
  return { left, right: left.slice() }
}

/** The level of `x` against the level of `reference`, in dB. */
const against = (x: Float32Array, reference: Float32Array) => gainToDb(rms(x) / rms(reference))

function range(x: Float32Array, from = 0, to = x.length): [number, number] {
  let lo = Infinity
  let hi = -Infinity
  for (let i = from; i < to; i += 1) {
    lo = Math.min(lo, x[i]!)
    hi = Math.max(hi, x[i]!)
  }
  return [lo, hi]
}

/** The frequency of the lowest bin within three bins of `hz`, and how far under the bins around it lies. */
function notchNear(spectrum: Float32Array, hz: number) {
  const centre = Math.round(hz / BIN)
  let at = centre
  for (let k = centre - 3; k <= centre + 3; k += 1) if (spectrum[k]! < spectrum[at]!) at = k
  return { hz: at * BIN, level: spectrum[at]! }
}

/** The seconds at which a control tap rises through `level`. */
function risings(x: Float32Array, level: number): number[] {
  const out: number[] = []
  for (let i = 1; i < x.length; i += 1) {
    if (x[i - 1]! < level && x[i]! >= level) {
      out.push((i - 1 + (level - x[i - 1]!) / (x[i]! - x[i - 1]!)) * POINT)
    }
  }
  return out
}

function correlation(a: Float32Array, b: Float32Array): number {
  let ab = 0
  let aa = 0
  let bb = 0
  for (let i = 0; i < a.length; i += 1) {
    ab += a[i]! * b[i]!
    aa += a[i]! * a[i]!
    bb += b[i]! * b[i]!
  }
  return ab / Math.sqrt(aa * bb)
}

/** The comb's measured curve: its points, and the highest and lowest of them up to `upTo` hertz. */
async function combAt(values: Record<string, number | undefined>, upTo = 1000) {
  const theLab = await lab(NAME)
  const out = theLab.render(silence(seconds(0.1)), values)
  const curve = out.taps.comb!.channels_data[0]!
  const last = Math.floor(upTo / BIN)
  let top = 1
  let bottom = 1
  for (let k = 1; k <= last; k += 1) {
    if (curve[k]! > curve[top]!) top = k
    if (curve[k]! < curve[bottom]!) bottom = k
  }
  return {
    curve,
    wet: out.taps.combWet!.channels_data[0]!,
    error: out.checks.combError!,
    top: { hz: top * BIN, db: curve[top]! },
    bottom: { hz: bottom * BIN, db: curve[bottom]! },
  }
}

describe('lesson 11: chorus and flanging', () => {
  it('is a sound lab on noise: every tap says something, loops, and answers to every control', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    const result = theLab.render(source, {})
    expectSoundLab(theLab, source, result)
  })

  it('puts the notches of noise at odd multiples of 200 Hz for a delay of 2.5 ms, each within one bin, the first at 199 Hz (claim notch-first)', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    theLab.render(source, {})
    const through = theLab.spectrum('still')
    const before = theLab.spectrum('in')
    for (let k = 0; k < 10; k += 1) {
      const expected = (2 * k + 1) * 200
      const found = notchNear(through, expected)
      expect(Math.abs(found.hz - expected)).toBeLessThanOrEqual(BIN)
      // And it is a notch: 20 dB or more under the noise that went in.
      expect(found.level).toBeLessThan(before[Math.round(expected / BIN)]! - 20)
    }
    expect(notchNear(through, 200).hz).toBeCloseTo(199.2, 1)
    expect(notchNear(through, 600).hz).toBeCloseTo(597.7, 1)
    expect(notchNear(through, 1000).hz).toBeCloseTo(996.1, 1)
  })

  it('moves the notches when the delay moves: at 5 ms they stand at odd multiples of 100 Hz (claim notch-moves)', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    theLab.render(source, { delay: 5 })
    const through = theLab.spectrum('still')
    for (let k = 0; k < 10; k += 1) {
      const expected = (2 * k + 1) * 100
      expect(Math.abs(notchNear(through, expected).hz - expected)).toBeLessThanOrEqual(BIN)
    }
  })

  it('takes a 200 Hz sine out altogether at equal parts, more than 120 dB down (claim notch-depth), and leaves a 400 Hz one as it was (claim tooth-top)', async () => {
    const theLab = await lab(NAME)
    const atNotch = theLab.render(sine(200, 0.5, seconds(1)), {})
    expect(
      against(atNotch.taps.still!.channels_data[0]!, atNotch.taps.in!.channels_data[0]!),
    ).toBeLessThan(-120)
    const atTooth = theLab.render(sine(400, 0.5, seconds(1)), {})
    expect(
      Math.abs(against(atTooth.taps.still!.channels_data[0]!, atTooth.taps.in!.channels_data[0]!)),
    ).toBeLessThan(0.01)
  })

  it('makes the notch only 6.0 dB deep with the mix at 0.25 (claim notch-quarter) and no notch at all with the mix at 1 (claim mix-one)', async () => {
    const theLab = await lab(NAME)
    const quarter = theLab.render(sine(200, 0.5, seconds(1)), { mix: 0.25 })
    expect(
      against(quarter.taps.still!.channels_data[0]!, quarter.taps.in!.channels_data[0]!),
    ).toBeCloseTo(-6.02, 1)
    const wetOnly = await combAt({ mix: 1 }, 3990)
    expect(Math.abs(wetOnly.top.db)).toBeLessThan(0.01)
    expect(Math.abs(wetOnly.bottom.db)).toBeLessThan(0.01)
  })

  it('lets half the power of white noise through the comb at equal parts: 3.0 dB down (claim comb-power)', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    const out = theLab.render(source, {})
    expect(against(out.taps.still!.channels_data[0]!, out.taps.in!.channels_data[0]!)).toBeCloseTo(
      -3.0,
      1,
    )
  })

  it('measures the comb the formula draws when the delay is a whole number of samples, within −120 dB of a gain of 1 (claim comb-error)', async () => {
    for (const values of [
      {},
      { feedback: 50 },
      { feedback: -50, mix: 0.3 },
      { delay: 1 },
      { delay: 5, feedback: 30 },
    ]) {
      expect((await combAt(values)).error).toBeLessThan(-120)
    }
  })

  it('lands about 58 dB under a gain of 1 from the formula when the delay falls between samples, at 2.6 ms (claim comb-error-between)', async () => {
    const between = await combAt({ delay: 2.6 })
    expect(between.error).toBeGreaterThan(-63)
    expect(between.error).toBeLessThan(-53)
  })

  it('raises the peaks to +3.5 dB at 50 % feedback (claim feedback-peak) and fills the notches to −15.6 dB (claim feedback-trough)', async () => {
    const half = await combAt({ feedback: 50 })
    expect(half.curve[0]!).toBeCloseTo(3.52, 1)
    expect(half.top.db).toBeCloseTo(3.52, 1)
    expect(Math.abs(half.top.hz - 400)).toBeLessThanOrEqual(BIN)
    expect(half.bottom.db).toBeCloseTo(-15.56, 1)
    expect(Math.abs(half.bottom.hz - 200)).toBeLessThanOrEqual(BIN)
    // With none, the peaks stand at 0 dB.
    const none = await combAt({})
    expect(Math.abs(none.top.db)).toBeLessThan(0.01)
  })

  it('reaches +20.4 dB at 95 % feedback (claim feedback-95), where the delayed path alone is at +26 dB (claim loop-26)', async () => {
    const most = await combAt({ feedback: 95 })
    expect(most.curve[0]!).toBeCloseTo(20.42, 1)
    expect(most.wet[0]!).toBeCloseTo(26.02, 1)
  })

  it('puts the first peak at 1,922 Hz, not 2,000 Hz, at the shortest delay: the loop is one sample longer than the delay (claim loop-sample)', async () => {
    const short = await combAt({ delay: 0.5, feedback: 90 }, 3990)
    // Above 1 kHz, so the peak at 0 Hz is not the one found.
    let top = Math.ceil(1000 / BIN)
    for (let k = top; k * BIN < 3000; k += 1) if (short.curve[k]! > short.curve[top]!) top = k
    expect(Math.abs(top * BIN - 48_000 / 25)).toBeLessThanOrEqual(BIN)
    expect(top * BIN).toBeCloseTo(1921.9, 0)
    expect(Math.abs(top * BIN - 2000)).toBeGreaterThan(5 * BIN)
  })

  it('leaves −6.1 dB at the odd multiples with feedback at −50 % (claim negative-half), barely a comb at −62 % (claim negative-flat), and peaks of +13.0 dB there at −90 % (claim negative-peaks)', async () => {
    const half = await combAt({ feedback: -50 })
    expect(half.bottom.db).toBeCloseTo(-6.1, 1)
    const flat = await combAt({ feedback: -62 })
    expect(flat.top.db - flat.bottom.db).toBeGreaterThan(0.9)
    expect(flat.top.db - flat.bottom.db).toBeLessThan(1.2)
    const strong = await combAt({ feedback: -90 })
    expect(strong.top.db).toBeCloseTo(12.99, 1)
    expect(Math.abs(strong.top.hz - 200)).toBeLessThanOrEqual(BIN)
    // The delayed path by itself peaks at the odd multiples at any negative setting.
    const wet = half.wet
    let top = 1
    for (let k = 1; k * BIN < 390; k += 1) if (wet[k]! > wet[top]!) top = k
    expect(Math.abs(top * BIN - 200)).toBeLessThanOrEqual(BIN)
  })

  it('sweeps the read point from 1.31 ms to 3.69 ms at the starting settings (claim depth-half) and from 0.125 ms to 4.875 ms at full depth (claim depth-full)', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    const half = range(theLab.render(source, {}).taps.delayMs!.channels_data[0]!)
    expect(half[0]).toBeCloseTo(1.3125, 3)
    expect(half[1]).toBeCloseTo(3.6875, 3)
    const full = range(theLab.render(source, { depth: 100 }).taps.delayMs!.channels_data[0]!)
    expect(full[0]).toBeCloseTo(0.125, 3)
    expect(full[1]).toBeCloseTo(4.875, 3)
  })

  it('sweeps the lowest notch of noise between 136 Hz, where the delay is longest, and 381 Hz, where it is shortest, each within one bin (claim sweep-notch)', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    theLab.render(source, {})
    // The read point is at its longest a second into the loop and at its shortest at three.
    for (const [at, delayMs] of [
      [1, 3.6875],
      [3, 1.3125],
    ] as const) {
      const expected = 1000 / (2 * delayMs)
      const around = theLab.spectrum('flanger', 0, seconds(at - 0.15), seconds(0.3))
      const centre = Math.round(expected / BIN)
      let lowest = centre - 4
      for (let k = centre - 4; k <= centre + 4; k += 1) if (around[k]! < around[lowest]!) lowest = k
      expect(Math.abs(lowest * BIN - expected)).toBeLessThanOrEqual(BIN)
    }
    expect(1000 / (2 * 3.6875)).toBeCloseTo(135.6, 1)
    expect(1000 / (2 * 1.3125)).toBeCloseTo(381.0, 1)
  })

  it("takes out the saw's odd harmonics with the delay at 4.55 ms: the 110 Hz fundamental more than 50 dB down, 220 Hz and 440 Hz untouched (claim saw-odd)", async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('saw', seconds(4))
    // 4.55 ms as typed, and the nearest place the page's slider stops at.
    for (const delay of [4.55, 0.5 * 20 ** 0.737]) {
      theLab.render(source, { delay })
      const through = theLab.spectrum('still')
      const before = theLab.spectrum('in')
      const change = (hz: number) => through[Math.round(hz / BIN)]! - before[Math.round(hz / BIN)]!
      expect(change(110)).toBeLessThan(-50)
      expect(change(330)).toBeLessThan(-40)
      expect(Math.abs(change(220))).toBeLessThan(0.1)
      expect(Math.abs(change(440))).toBeLessThan(0.1)
    }
  })

  it('never reads closer than two samples, 0.042 ms, even at 0.5 ms and full depth (claim shortest-read)', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    const out = theLab.render(source, { delay: 0.5, depth: 100 })
    const [shortest] = range(out.taps.delayMs!.channels_data[0]!)
    expect(shortest).toBeCloseTo(2000 / 48_000, 5)
  })

  it('draws each shape as the oscillator makes it: a sine from 0, a triangle from −1 to +1 at half way, ramps, a square, one held value', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    // At 0.25 Hz the loop is one cycle: points 0, 3000, 6000 and 9000 are its quarters.
    const quarters = (shape: number) => {
      const wave = theLab.render(source, { shape }).taps.lfo!.channels_data[0]!
      return [wave[0]!, wave[3000]!, wave[6000]!, wave[9000]!]
    }
    const near = (found: number[], wanted: number[]) =>
      found.forEach((value, i) => expect(value).toBeCloseTo(wanted[i]!, 3))
    near(quarters(0), [0, 1, 0, -1])
    near(quarters(1), [-1, 0, 1, 0])
    near(quarters(2), [-1, -0.5, 0, 0.5])
    near(quarters(3), [1, 0.5, 0, -0.5])
    near(quarters(4), [1, 1, -1, -1])
    const held = theLab.render(source, { shape: 5 }).taps.lfo!.channels_data[0]!
    // Random holds one value for a whole cycle (the first few points are the fade across the wrap).
    expect(range(held, 100, 11_900)[1] - range(held, 100, 11_900)[0]).toBe(0)
  })

  it('takes 3 ms to cover 63 % of a jump in the delay, with the square shape (claim lag)', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    const out = theLab.render(source, { shape: 4 })
    const wave = out.taps.lfo!.channels_data[0]!
    const read = out.taps.delayMs!.channels_data[0]!
    let jump = 1000
    while (wave[jump] === wave[jump - 1]) jump += 1
    const from = read[jump - 1]!
    const to = read[jump + 600]!
    expect(from).toBeCloseTo(3.6875, 2)
    expect(to).toBeCloseTo(1.3125, 2)
    let k = jump
    while (read[k]! > from + (to - from) * (1 - Math.exp(-1))) k += 1
    const ms = (k - jump) * POINT * 1000
    expect(ms).toBeGreaterThan(2.6)
    expect(ms).toBeLessThan(3.4)
  })

  it("bends the flanger's delayed copy by 3.2 cents at most at its starting settings (claim flanger-cents)", async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    const read = theLab.render(source, {}).taps.delayMs!.channels_data[0]!
    let steepest = 0
    for (let i = 1; i < read.length; i += 1) {
      steepest = Math.max(steepest, Math.abs(read[i]! - read[i - 1]!) / 1000 / POINT)
    }
    expect(1200 * Math.log2(1 + steepest)).toBeCloseTo(3.23, 1)
  })

  it('bends each voice of the chorus 21.6 cents up and 21.9 cents down at its starting settings (claim chorus-cents)', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    const out = theLab.render(source, {})
    for (const id of ['cents1', 'cents2', 'cents3']) {
      const [down, up] = range(out.taps[id]!.channels_data[0]!)
      expect(up).toBeCloseTo(21.62, 1)
      expect(down).toBeCloseTo(-21.9, 1)
    }
    // The slope the formula gives: 2π × 0.8 Hz × 2.5 ms.
    const slope = 2 * Math.PI * 0.8 * 0.0025
    expect(1200 * Math.log2(1 + slope)).toBeCloseTo(21.62, 1)
    expect(1200 * Math.log2(1 - slope)).toBeCloseTo(-21.9, 1)
  })

  it('plays a 1 kHz sine back from one voice at 987.4 Hz to 1,012.6 Hz, counted from its zero crossings (claim chorus-cents-heard)', async () => {
    const theLab = await lab(NAME)
    const out = theLab.render(sine(1000, 0.5, seconds(4)), {})
    const wave = out.taps.voice!.channels_data[0]!
    const crossings: number[] = []
    for (let i = 1; i < wave.length; i += 1) {
      if (wave[i - 1]! < 0 && wave[i]! >= 0)
        crossings.push(i - 1 - wave[i - 1]! / (wave[i]! - wave[i - 1]!))
    }
    // Twenty cycles at a time, 20 ms: short against the oscillator's 1.25 s.
    let slowest = Infinity
    let fastest = -Infinity
    for (let i = 20; i < crossings.length; i += 1) {
      const hz = (20 * 48_000) / (crossings[i]! - crossings[i - 20]!)
      slowest = Math.min(slowest, hz)
      fastest = Math.max(fastest, hz)
    }
    expect(slowest).toBeCloseTo(987.4, 0)
    expect(fastest).toBeCloseTo(1012.6, 0)
    expect(1200 * Math.log2(fastest / 1000)).toBeCloseTo(21.6, 0)
    expect(1200 * Math.log2(slowest / 1000)).toBeCloseTo(-21.9, 0)
  })

  it('reads three voices from 9.5 ms to 14.5 ms (claim voice-range), a third of a cycle apart, 0.417 s (claim voices-third), their delays adding to 36 ms at every instant (claim voices-sum)', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    const out = theLab.render(source, {})
    const one = out.taps.voice1Ms!.channels_data[0]!
    const two = out.taps.voice2Ms!.channels_data[0]!
    const three = out.taps.voice3Ms!.channels_data[0]!
    for (const voice of [one, two, three]) {
      expect(range(voice)[0]).toBeCloseTo(9.5, 3)
      expect(range(voice)[1]).toBeCloseTo(14.5, 3)
    }
    // Each voice is ahead of the one before: it rises through the centre a third of 1.25 s sooner.
    const first = risings(one, 12).find((t) => t > 0.9)!
    const second = risings(two, 12).find((t) => t > first - 0.6)!
    const third = risings(three, 12).find((t) => t > first - 1.0)!
    expect(first - second).toBeCloseTo(1.25 / 3, 3)
    expect(first - third).toBeCloseTo(2.5 / 3, 3)
    let worst = 0
    for (let i = 0; i < one.length; i += 1)
      worst = Math.max(worst, Math.abs(one[i]! + two[i]! + three[i]! - 36))
    expect(worst).toBeLessThan(0.0001)
  })

  it('sets two voices half a cycle apart, 0.625 s (claim voices-half), and caps the sweep at 4 ms either way when the delay is 5 ms (claim chorus-cap)', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    const pair = theLab.render(source, { voices: 0 })
    const one = pair.taps.voice1Ms!.channels_data[0]!
    const two = pair.taps.voice2Ms!.channels_data[0]!
    const first = risings(one, 12).find((t) => t > 0.9)!
    const second = risings(two, 12).find((t) => t > first - 0.9)!
    expect(first - second).toBeCloseTo(0.625, 3)
    let worst = 0
    for (let i = 0; i < one.length; i += 1)
      worst = Math.max(worst, Math.abs(one[i]! + two[i]! - 24))
    expect(worst).toBeLessThan(0.0001)

    const short = theLab.render(source, { chorusDelay: 5, chorusDepth: 100 })
    const [nearest, furthest] = range(short.taps.voice1Ms!.channels_data[0]!)
    expect(nearest).toBeCloseTo(1, 3)
    expect(furthest).toBeCloseTo(9, 3)
  })

  it("reads the voices again and lands on the Chorus's own output, to the last bit (claim rebuilt)", async () => {
    const theLab = await lab(NAME)
    for (const id of ['noise', 'saw', 'chords']) {
      const source = await benchSource(id, seconds(4))
      expect(theLab.render(source, {}).checks.rebuilt).toBe(-140)
    }
    const source = await benchSource('chords', seconds(4))
    const other = {
      voices: 0,
      spread: 100,
      chorusDelay: 7.3,
      chorusDepth: 80,
      chorusRate: 3,
      chorusMix: 0.8,
    }
    expect(theLab.render(source, other).checks.rebuilt).toBe(-140)
  })

  it('has teeth 83 Hz apart with the chorus held still at 12 ms, the first notch at 42 Hz, each within one bin (claim chorus-teeth)', async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    theLab.render(source, { chorusDepth: 0 })
    const through = theLab.spectrum('chorus')
    for (let k = 0; k < 12; k += 1) {
      const expected = (2 * k + 1) / (2 * 0.012)
      const centre = Math.round(expected / BIN)
      let at = centre
      for (let j = centre - 2; j <= centre + 2; j += 1) if (through[j]! < through[at]!) at = j
      expect(Math.abs(at * BIN - expected)).toBeLessThanOrEqual(BIN)
    }
  })

  it('sums three voices that coincide 4.8 dB over one (claim together) and three that have drifted apart level with one, within 0.05 dB (claim apart)', async () => {
    const theLab = await lab(NAME)
    const source = monoNoise(seconds(4))
    const together = theLab.render(source, { chorusDepth: 0, spread: 0 })
    expect(
      against(together.taps.chorusWet!.channels_data[0]!, together.taps.voice!.channels_data[0]!),
    ).toBeCloseTo(4.77, 1)
    for (const values of [{ spread: 0 }, {}, { spread: 100 }, { voices: 0 }]) {
      const apart = theLab.render(source, values)
      expect(
        Math.abs(
          against(apart.taps.chorusWet!.channels_data[0]!, apart.taps.voice!.channels_data[0]!),
        ),
      ).toBeLessThan(0.05)
    }
  })

  it('loses 0.9 dB of white noise in a voice read between samples, and nothing in one read on them (claim between-samples)', async () => {
    const theLab = await lab(NAME)
    const source = monoNoise(seconds(4))
    const moving = theLab.render(source, {})
    expect(
      against(moving.taps.voice!.channels_data[0]!, moving.taps.in!.channels_data[0]!),
    ).toBeCloseTo(-0.87, 1)
    const still = theLab.render(source, { chorusDepth: 0 })
    expect(
      Math.abs(against(still.taps.voice!.channels_data[0]!, still.taps.in!.channels_data[0]!)),
    ).toBeLessThan(0.01)
  })

  it('brings white noise out 3.4 dB quieter at a mix of 0.5: the dry and the delayed no longer add as one (claim mix-dip)', async () => {
    const theLab = await lab(NAME)
    const source = monoNoise(seconds(4))
    const out = theLab.render(source, {})
    expect(against(out.taps.chorus!.channels_data[0]!, out.taps.in!.channels_data[0]!)).toBeCloseTo(
      -3.4,
      1,
    )
  })

  it('gives both sides the same samples at Spread 0 (claim spread-zero) and delayed halves that share nothing from 35 % up (claim spread-apart)', async () => {
    const theLab = await lab(NAME)
    const source = monoNoise(seconds(4))
    for (const voiceChoice of [0, 1]) {
      const centre = theLab.render(source, { spread: 0, voices: voiceChoice })
      const left = centre.taps.chorus!.channels_data[0]!
      const right = centre.taps.chorus!.channels_data[1]!
      expect(left.every((v, i) => v === right[i])).toBe(true)
      for (const amount of [35, 70, 100]) {
        const wide = theLab.render(source, { spread: amount, voices: voiceChoice })
        const wet = wide.taps.chorusWet!.channels_data
        expect(Math.abs(correlation(wet[0]!, wet[1]!))).toBeLessThan(0.02)
      }
    }
  })

  it('gives each ear one voice at full Spread with two voices (claim one-each), the right ear a quarter of a cycle, 0.31 s, behind the left (claim two-sides)', async () => {
    const theLab = await lab(NAME)
    const source = monoNoise(seconds(4))
    const out = theLab.render(source, { voices: 0, spread: 100 })
    // The left side is voice 1 and nothing else: the summed voices there are that one voice.
    const wet = out.taps.chorusWet!.channels_data[0]!
    const alone = out.taps.voice!.channels_data[0]!
    let apart = 0
    let whole = 0
    for (let i = 0; i < wet.length; i += 1) {
      apart += (wet[i]! - alone[i]!) ** 2
      whole += alone[i]! ** 2
    }
    expect(10 * Math.log10(apart / whole)).toBeLessThan(-120)
    // Voice 2 as the right side reads it rises through the centre a quarter of 1.25 s after voice 1 on the left.
    const left = risings(out.taps.voice1Ms!.channels_data[0]!, 12).find((t) => t > 0.9)!
    const right = risings(out.taps.voice2MsRight!.channels_data[0]!, 12).find((t) => t > left)!
    expect(right - left).toBeCloseTo(1.25 / 4, 3)
  })

  it("runs the right side's oscillator 63° ahead at a Spread of 70 %: it rises 0.219 s sooner (claim right-ahead)", async () => {
    const theLab = await lab(NAME)
    const source = await benchSource('noise', seconds(4))
    const out = theLab.render(source, {})
    const left = risings(out.taps.voice1Ms!.channels_data[0]!, 12).find((t) => t > 0.9)!
    const right = risings(out.taps.voice1MsRight!.channels_data[0]!, 12).find(
      (t) => t > left - 0.6,
    )!
    expect(left - right).toBeCloseTo((0.7 * 90) / 360 / 0.8, 3)
    expect(left - right).toBeCloseTo(0.219, 3)
    const full = theLab.render(source, { spread: 100 })
    const leftFull = risings(full.taps.voice1Ms!.channels_data[0]!, 12).find((t) => t > 0.9)!
    const rightFull = risings(full.taps.voice1MsRight!.channels_data[0]!, 12).find(
      (t) => t > leftFull - 0.6,
    )!
    expect(leftFull - rightFull).toBeCloseTo(1.25 / 4, 3)
  })
})
