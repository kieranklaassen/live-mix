import { describe, expect, it } from 'vitest'
import type { Lab } from '../../src/lab/runner.ts'
import { expectSoundLab, lab, mean, peak, seconds, silence } from './support.ts'

/** The lab plays by itself: nothing goes in. */
const nothing = silence(seconds(2))

/** The spacing of the lab's spectrum: 4,096 points at 48 kHz. */
const BIN = 48_000 / 4096
/** A note on the middle of bin 40, so that a line's level is read with no loss between bins. */
const ON_A_BIN = 40 * BIN

/**
 * The spectrum of a held tap, from 8,192 samples in: clear of the 20 ms at the loop's start
 * where the lab crosses the end of the tone over into its beginning.
 */
const heldSpectrum = (theLab: Lab, tap = 'steady') => theLab.spectrum(tap, 0, 8192, 65_536)

/** The lab's ratio switch, by the ratio each position stands for. */
const RATIO = { half: 0, one: 1, two: 3, threeAndAHalf: 6, fourteen: 11 }

/** The highest level within a bin of `hz`, in dB where a full-scale sine reads 0. */
function lineAt(spectrum: Float32Array, hz: number): number {
  const centre = Math.round(hz / BIN)
  return Math.max(spectrum[centre - 1] ?? -140, spectrum[centre]!, spectrum[centre + 1] ?? -140)
}

/** The frequencies of the lines of a spectrum that stand above `floor` dB. */
function linesOver(spectrum: Float32Array, floor: number): number[] {
  const found: number[] = []
  for (let k = 1; k < spectrum.length - 1; k += 1) {
    const here = spectrum[k]!
    if (here > floor && here >= spectrum[k - 1]! && here > spectrum[k + 1]!) found.push(k * BIN)
  }
  return found
}

/** The loudest bin further than `clear` bins from `hz`. */
function loudestAwayFrom(spectrum: Float32Array, hz: number, clear = 4): number {
  const centre = Math.round(hz / BIN)
  let top = -Infinity
  for (let k = 0; k < spectrum.length; k += 1) {
    if (Math.abs(k - centre) > clear) top = Math.max(top, spectrum[k]!)
  }
  return top
}

/** The loudest bin above 0.47 of the sample rate, the device's band limit. */
function loudestOverTheLimit(spectrum: Float32Array): number {
  let top = -Infinity
  for (let k = Math.ceil((0.47 * 48_000) / BIN); k < spectrum.length; k += 1) {
    top = Math.max(top, spectrum[k]!)
  }
  return top
}

/** Seconds from a control tap's peak until it has fallen to `part` of that peak. */
function fallTime(trace: Float32Array, part: number): number {
  const top = peak(trace)
  const from = trace.indexOf(top)
  let k = from
  while (k < trace.length && trace[k]! > top * part) k += 1
  return ((k - from) * 16) / 48_000
}

/** Where a curve against the index (0 to 8 rad) crosses zero, in radians. */
function zeroCrossings(curve: Float32Array): number[] {
  const step = 8 / (curve.length - 1)
  const found: number[] = []
  for (let p = 1; p < curve.length; p += 1) {
    const a = curve[p - 1]!
    const b = curve[p]!
    if (a * b < 0) found.push(step * (p - 1 + a / (a - b)))
  }
  return found
}

describe('frequency modulation', () => {
  it('is a sound lab on its own notes: every tap says something, loops, and answers to every control', async () => {
    const fm = await lab('frequency-modulation')
    const result = fm.render(nothing, {})
    expectSoundLab(fm, nothing, result)
  })

  it('is one sine at an index of 0: every other line of the held tone is more than 130 dB under it (claim one-sine)', async () => {
    const fm = await lab('frequency-modulation')
    const result = fm.render(nothing, { index: 0, pitch: ON_A_BIN })
    const held = heldSpectrum(fm)
    expect(lineAt(held, ON_A_BIN)).toBeGreaterThan(-0.01)
    expect(loudestAwayFrom(held, ON_A_BIN)).toBeLessThan(-130)
    // And in the device: the carrier with its phase modulated is the carrier alone, sample for sample.
    const alone = result.taps.carrier!.channels_data[0]!
    expect(result.taps.modulated!.channels_data[0]!.every((v, i) => v === alone[i])).toBe(true)
  })

  it('lands a sine whose frequency is swung 64 dB under the sine whose phase is (claim as-frequency)', async () => {
    const fm = await lab('frequency-modulation')
    const result = fm.render(nothing, {})
    expect(result.checks.asFrequency).toBeLessThan(-63)
    expect(result.checks.asFrequency).toBeGreaterThan(-66)
  })

  it('puts every line within one bin of the carrier plus or minus a whole number of modulators (claim sidebands-where)', async () => {
    const fm = await lab('frequency-modulation')
    // The device counts its ratio as modulator over carrier: 2 is a modulator at twice the note.
    for (const [position, ratio] of [
      [RATIO.two, 2],
      [RATIO.threeAndAHalf, 3.5],
    ] as const) {
      fm.render(nothing, { ratio: position, index: 2, pitch: ON_A_BIN })
      const lines = linesOver(heldSpectrum(fm), -60)
      expect(lines.length).toBeGreaterThan(5)
      for (const hz of lines) {
        const k = Math.round((hz - ON_A_BIN) / (ratio * ON_A_BIN))
        const upper = ON_A_BIN + k * ratio * ON_A_BIN
        // A lower side band below zero comes back up at the same distance above it.
        const j = Math.round((hz + ON_A_BIN) / (ratio * ON_A_BIN))
        const reflected = j * ratio * ON_A_BIN - ON_A_BIN
        expect(Math.min(Math.abs(hz - upper), Math.abs(hz - reflected))).toBeLessThanOrEqual(BIN)
      }
    }
    // At a ratio of 2 that is the odd multiples of the note and nothing on the even ones.
    fm.render(nothing, { ratio: RATIO.two, index: 2, pitch: ON_A_BIN })
    const held = heldSpectrum(fm)
    for (const odd of [1, 3, 5, 7]) expect(lineAt(held, odd * ON_A_BIN)).toBeGreaterThan(-30)
    for (const even of [2, 4, 6, 8]) expect(lineAt(held, even * ON_A_BIN)).toBeLessThan(-90)
    // At a ratio of 1 there is a line on every multiple of the note.
    fm.render(nothing, { ratio: RATIO.one, index: 2, pitch: ON_A_BIN })
    const every = heldSpectrum(fm)
    for (const harmonic of [1, 2, 3, 4])
      expect(lineAt(every, harmonic * ON_A_BIN)).toBeGreaterThan(-30)
    // At 3.5 the first lines beside the carrier are at 2.5, 4.5, 6 and 8 times the note.
    fm.render(nothing, { ratio: RATIO.threeAndAHalf, index: 2, pitch: ON_A_BIN })
    const uneven = heldSpectrum(fm)
    for (const multiple of [2.5, 4.5, 6, 8])
      expect(lineAt(uneven, multiple * ON_A_BIN)).toBeGreaterThan(-30)
    for (const multiple of [2, 3, 4, 5, 7])
      expect(lineAt(uneven, multiple * ON_A_BIN)).toBeLessThan(-90)
  })

  it('brings the first lower side band back up from below zero at −7.1 dB, the level of the upper one (claim reflected-level)', async () => {
    const fm = await lab('frequency-modulation')
    fm.render(nothing, { ratio: RATIO.threeAndAHalf, index: 1, pitch: ON_A_BIN })
    const held = heldSpectrum(fm)
    const upper = lineAt(held, ON_A_BIN + 3.5 * ON_A_BIN)
    const reflected = lineAt(held, 3.5 * ON_A_BIN - ON_A_BIN)
    expect(upper).toBeCloseTo(-7.13, 1)
    expect(reflected).toBeCloseTo(-7.13, 1)
  })

  it('adds the reflected side band to the carrier at a ratio of 2: +1.6 dB at an index of 1 (claim ratio-two)', async () => {
    const fm = await lab('frequency-modulation')
    fm.render(nothing, { ratio: RATIO.two, index: 1, pitch: ON_A_BIN })
    // J0(1) + J1(1) = 1.205, which is +1.62 dB.
    expect(lineAt(heldSpectrum(fm), ON_A_BIN)).toBeCloseTo(1.62, 1)
  })

  it('reads the carrier at −2.3 dB and the first pair at −7.1 dB at an index of 1 (claim bessel-one)', async () => {
    const fm = await lab('frequency-modulation')
    const result = fm.render(nothing, { index: 1, pitch: ON_A_BIN })
    const held = heldSpectrum(fm)
    // J0(1) = 0.7652 and J1(1) = 0.4401.
    expect(lineAt(held, ON_A_BIN)).toBeCloseTo(-2.32, 1)
    expect(lineAt(held, 4.5 * ON_A_BIN)).toBeCloseTo(-7.13, 1)
    // The curves measured from the kit's table sines give the same two numbers.
    expect(result.taps.line0!.channels_data[0]![20]).toBeCloseTo(0.7652, 3)
    expect(result.taps.line1!.channels_data[0]![20]).toBeCloseTo(0.4401, 3)
  })

  it('crosses zero where the Bessel functions do: 2.40 and 5.52, 3.83 and 7.02, 5.14 (claim line-zeros)', async () => {
    const fm = await lab('frequency-modulation')
    const result = fm.render(nothing, {})
    const zeros = (id: string) =>
      zeroCrossings(result.taps[id]!.channels_data[0]!).filter((at) => at > 0.5)
    const carrier = zeros('line0')
    const first = zeros('line1')
    const second = zeros('line2')
    expect(carrier).toHaveLength(2)
    expect(carrier[0]).toBeCloseTo(2.405, 2)
    expect(carrier[1]).toBeCloseTo(5.52, 2)
    expect(first).toHaveLength(2)
    expect(first[0]).toBeCloseTo(3.832, 2)
    expect(first[1]).toBeCloseTo(7.016, 2)
    expect(second).toHaveLength(1)
    expect(second[0]).toBeCloseTo(5.136, 2)
    // The curves do not move with the controls: they are a property of the operator.
    const other = fm.render(nothing, { index: 7, pitch: 880, ratio: RATIO.one })
    expect(other.taps.line0!.channels_data[0]).toEqual(result.taps.line0!.channels_data[0])
  })

  it('all but loses the carrier at an index of 2.405: its line is 81 dB down (claim carrier-null)', async () => {
    const fm = await lab('frequency-modulation')
    fm.render(nothing, { index: 2.405, pitch: ON_A_BIN })
    const held = heldSpectrum(fm)
    expect(lineAt(held, ON_A_BIN)).toBeLessThan(-78)
    expect(lineAt(held, ON_A_BIN)).toBeGreaterThan(-84)
    // The energy is in the side bands: the first pair stands 75 dB over it.
    expect(lineAt(held, 4.5 * ON_A_BIN)).toBeGreaterThan(-6)
  })

  it('holds 99.8 % of the power in the carrier and three pairs at an index of 2 (claim carson)', async () => {
    const fm = await lab('frequency-modulation')
    const result = fm.render(nothing, {})
    // Point 40 of 161 stands at 2 rad. The index plus one is three pairs.
    const at = (id: string) => result.taps[id]!.channels_data[0]![40]!
    const power = at('line0') ** 2 + 2 * (at('line1') ** 2 + at('line2') ** 2 + at('line3') ** 2)
    expect(power).toBeGreaterThan(0.997)
    expect(power).toBeLessThan(0.9985)
  })

  it('grants the index the slider asks for: 2.00 rad for 2 at the starting settings (claim index-strike)', async () => {
    const fm = await lab('frequency-modulation')
    const result = fm.render(nothing, {})
    expect(result.checks.granted).toBeCloseTo(2, 3)
    // The trace of the note's index reaches it at the strike (a point every 16 samples).
    expect(peak(result.taps.indexNow!.channels_data[0]!)).toBeGreaterThan(1.98)
    expect(peak(result.taps.indexNow!.channels_data[0]!)).toBeLessThanOrEqual(2.0001)
  })

  it("takes 0.43 s off the modulator's envelope for 60 dB (claim mod-decay) and 1.72 s off the carrier's (claim amp-decay)", async () => {
    const fm = await lab('frequency-modulation')
    const result = fm.render(nothing, {})
    // Decay 0.4 s, stretched by key_time_scale(220 Hz) = 1.072; the carrier four times as long.
    const brightness = fallTime(result.taps.modEnv!.channels_data[0]!, 0.001)
    const loudness = fallTime(result.taps.ampEnv!.channels_data[0]!, 0.001)
    expect(brightness).toBeCloseTo(0.429, 2)
    expect(loudness).toBeCloseTo(1.715, 2)
  })

  it('is bright at the strike and pure as it rings: the first pair 4 and 5 dB under the carrier, then 78 dB under (claim bright-then-pure)', async () => {
    const fm = await lab('frequency-modulation')
    fm.render(nothing, {})
    // 220 Hz at a ratio of 3.5: the first pair is at 550 Hz (reflected) and 990 Hz.
    const under = (spectrum: Float32Array, hz: number) =>
      lineAt(spectrum, 220) - lineAt(spectrum, hz)
    const strike = fm.spectrum('out', 0, 0, 4096)
    expect(under(strike, 550)).toBeGreaterThan(3.2)
    expect(under(strike, 550)).toBeLessThan(4.2)
    expect(under(strike, 990)).toBeGreaterThan(4.5)
    expect(under(strike, 990)).toBeLessThan(5.5)
    const ringing = fm.spectrum('out', 0, 24_000, 8192)
    expect(under(ringing, 550)).toBeGreaterThan(77)
    expect(under(ringing, 990)).toBeGreaterThan(77)
    expect(under(ringing, 550)).toBeLessThan(80)
  })

  it("works the left channel out again from the device's own state, sample for sample (claim rebuilt-exact)", async () => {
    const fm = await lab('frequency-modulation')
    // −140 dB is the floor of the lab's measure: no difference at all.
    expect(fm.render(nothing, {}).checks.rebuilt).toBe(-140)
    const others: Record<string, number>[] = [
      { feedback: 1, index: 6 },
      { ratio: RATIO.fourteen, index: 8 },
      { decay: 20, index: 8, pitch: 55 },
      { decay: 0.05, pitch: 1760, ratio: RATIO.half },
    ]
    for (const values of others) expect(fm.render(nothing, values).checks.rebuilt).toBe(-140)
  })

  it('gives the second pair 0.70 times the index, gone in 0.26 s against 0.43 s (claim pair-b)', async () => {
    const fm = await lab('frequency-modulation')
    const result = fm.render(nothing, {})
    const first = result.taps.indexNow!.channels_data[0]!
    const second = result.taps.indexB!.channels_data[0]!
    expect(peak(second) / peak(first)).toBeCloseTo(0.7, 2)
    expect(fallTime(second, 0.001)).toBeCloseTo(0.257, 2)
    expect(fallTime(first, 0.001)).toBeCloseTo(0.429, 2)
    // Spread 1 puts it alone on the right, at the same level as the first pair on the left.
    const right = peak(result.taps.outB!.channels_data[0]!)
    expect(right).toBeCloseTo(peak(result.taps.out!.channels_data[0]!), 2)
  })

  it('bends the modulator towards a sawtooth: at full Feedback its second harmonic is 10 dB under its first (claim feedback-saw)', async () => {
    const fm = await lab('frequency-modulation')
    // The starting note moved 1 Hz, to 220.98 Hz, so that its modulator stands on bin 66 (773 Hz).
    const pitch = (66 * BIN) / 3.5
    fm.render(nothing, { feedback: 1, pitch })
    const bent = heldSpectrum(fm, 'steadyModulator')
    const first = lineAt(bent, 66 * BIN)
    const second = lineAt(bent, 132 * BIN)
    expect(first - second).toBeGreaterThan(9.5)
    expect(first - second).toBeLessThan(10.5)
    // With no feedback it is the table's sine and has no second harmonic.
    fm.render(nothing, { feedback: 0, pitch })
    expect(lineAt(heldSpectrum(fm, 'steadyModulator'), 132 * BIN)).toBeLessThan(-100)
  })

  it('leaves the held tone 0.013 below centre at a ratio of 1 with full Feedback, and centred with none (claim dc-offset)', async () => {
    const fm = await lab('frequency-modulation')
    const fed = fm.render(nothing, { ratio: RATIO.one, index: 2, feedback: 1 })
    const offset = mean(fed.taps.steady!.channels_data[0]!, 2000, 90_000)
    expect(offset).toBeLessThan(-0.011)
    expect(offset).toBeGreaterThan(-0.015)
    const plain = fm.render(nothing, { ratio: RATIO.one, index: 2 })
    expect(Math.abs(mean(plain.taps.steady!.channels_data[0]!, 2000, 90_000))).toBeLessThan(0.001)
  })

  it('caps the index at 2.78 rad of the 8 asked at 220 Hz and a ratio of 14 (claim cap-granted)', async () => {
    const fm = await lab('frequency-modulation')
    const result = fm.render(nothing, { ratio: RATIO.fourteen, index: 8 })
    expect(result.checks.granted).toBeCloseTo(2.784, 2)
    // Below the cap the slider is granted in full: a ratio of 3.5 leaves room for 8 rad at 110 Hz.
    expect(fm.render(nothing, { index: 8, pitch: 110 }).checks.granted).toBeCloseTo(8, 3)
  })

  it('keeps the capped tone 71 dB down above 0.47 of the sample rate, where the uncapped tone folds back 13 dB down (claim cap-clean)', async () => {
    const fm = await lab('frequency-modulation')
    fm.render(nothing, { ratio: RATIO.fourteen, index: 8 })
    const capped = heldSpectrum(fm)
    const free = heldSpectrum(fm, 'uncapped')
    expect(loudestOverTheLimit(capped)).toBeLessThan(-69)
    expect(loudestOverTheLimit(capped)).toBeGreaterThan(-73)
    expect(loudestOverTheLimit(free)).toBeGreaterThan(-14.5)
    expect(loudestOverTheLimit(free)).toBeLessThan(-12)
    // A folded line stands between the rungs of the ladder: 220 + 9 × 3,080 Hz comes back at 20,060 Hz.
    const folded = 48_000 - (220 + 9 * 3080)
    expect(lineAt(free, folded)).toBeGreaterThan(-20)
    expect(lineAt(capped, folded)).toBeLessThan(-80)
  })

  it('grants a note at 880 Hz no more than 2.64 rad at a ratio of 3.5 (claim key-scale)', async () => {
    const fm = await lab('frequency-modulation')
    expect(fm.render(nothing, { pitch: 880, index: 8 }).checks.granted).toBeCloseTo(2.64, 2)
    // With room to spare (a ratio of 1) the key scaling alone decides: 8 × sqrt(261.63 / 880).
    const scaled = fm.render(nothing, { pitch: 880, index: 8, ratio: RATIO.one }).checks.granted
    expect(scaled).toBeCloseTo(8 * Math.sqrt(261.63 / 880), 2)
  })

  it('does not run a modulator that would sit above the limit: at 1,760 Hz and a ratio of 14 the note is one sine (claim modulator-silent)', async () => {
    const fm = await lab('frequency-modulation')
    const result = fm.render(nothing, { pitch: 1760, ratio: RATIO.fourteen, index: 8 })
    expect(result.checks.granted).toBe(0)
    const alone = result.taps.steadyCarrier!.channels_data[0]!
    expect(result.taps.steady!.channels_data[0]!.every((v, i) => v === alone[i])).toBe(true)
    expect(peak(result.taps.modulator!.channels_data[0]!)).toBe(0)
    const bare = result.taps.carrier!.channels_data[0]!
    expect(result.taps.modulated!.channels_data[0]!.every((v, i) => v === bare[i])).toBe(true)
  })
})
