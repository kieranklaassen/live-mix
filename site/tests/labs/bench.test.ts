import { describe, expect, it } from 'vitest'
import { SOURCES } from '../../src/lab/sources.ts'
import { SAMPLE_RATE } from '../../src/lab/runner.ts'
import { gainToDb, lab, peak, rms, seconds, silence, steps } from './support.ts'

const FOUR = seconds(4)
const binHz = SAMPLE_RATE / 4096

describe('the bench: sources', () => {
  it('has a tap for every source the picker lists, and no other', async () => {
    const bench = await lab('bench')
    expect(bench.description.taps.map((tap) => tap.id).sort()).toEqual(
      SOURCES.map((s) => s.id).sort(),
    )
    expect(
      bench.description.taps.every((tap) => tap.kind === 'audio' && tap.origin === 'source'),
    ).toBe(true)
  })

  it('renders the same samples twice, finite and under full scale', async () => {
    const bench = await lab('bench')
    const first = bench.render(silence(FOUR), {})
    const second = bench.render(silence(FOUR), {})
    for (const source of SOURCES) {
      const tap = first.taps[source.id]!
      expect(tap.length, source.id).toBe(FOUR)
      for (const [c, data] of tap.channels_data.entries()) {
        expect(data.every(Number.isFinite), `${source.id} is finite`).toBe(true)
        expect(peak(data), `${source.id} peaks at or under full scale`).toBeLessThanOrEqual(1)
        expect(rms(data), `${source.id} is not silent`).toBeGreaterThan(1e-4)
        const again = second.taps[source.id]!.channels_data[c]!
        expect(
          data.every((v, i) => v === again[i]),
          `${source.id} repeats`,
        ).toBe(true)
      }
    }
  })

  it('loops every source without a step', async () => {
    const bench = await lab('bench')
    const out = bench.render(silence(FOUR), {})
    for (const source of SOURCES) {
      if (source.id === 'clicks') continue // a click is a step by design, and none sits on the wrap
      for (const data of out.taps[source.id]!.channels_data) {
        const { inside, wrap } = steps(data)
        expect(wrap, source.id).toBeLessThanOrEqual(inside + 1e-6)
      }
    }
  })

  it('starts the drum loop on a kick: the first tenth of a second is mostly under 150 Hz', async () => {
    const bench = await lab('bench')
    bench.render(silence(FOUR), {})
    const spectrum = bench.spectrum('drums', 0, 0, seconds(0.1))
    const band = (from: number, to: number) => {
      let sum = 0
      for (let k = Math.round(from / binHz); k <= Math.round(to / binHz); k += 1)
        sum += 10 ** (spectrum[k]! / 10)
      return 10 * Math.log10(sum)
    }
    expect(band(30, 150)).toBeGreaterThan(band(150, 2000) + 6)
  })

  it('measures a sine where it is: the 440 Hz sine peaks at 440 Hz and reads its level', async () => {
    const bench = await lab('bench')
    bench.render(silence(FOUR), {})
    const spectrum = bench.spectrum('sine')
    let top = 0
    for (let k = 1; k < spectrum.length; k += 1) if (spectrum[k]! > spectrum[top]!) top = k
    expect(Math.abs(top * binHz - 440)).toBeLessThan(binHz)
    // Between two bins a Hann window shares the level out: up to 1.4 dB under the true -12.
    expect(spectrum[top]!).toBeGreaterThan(-13.6)
    expect(spectrum[top]!).toBeLessThan(-11.9)
    expect(spectrum[top + 40]!).toBeLessThan(-100)
  })

  it('gives the saw every harmonic, each lower than the last', async () => {
    const bench = await lab('bench')
    bench.render(silence(FOUR), {})
    const spectrum = bench.spectrum('saw')
    const at = (hz: number) => {
      const k = Math.round(hz / binHz)
      return Math.max(spectrum[k - 1]!, spectrum[k]!, spectrum[k + 1]!)
    }
    // A saw's harmonic n is 1/n of the first: 6 dB down at 2, 20 dB down at 10.
    expect(at(110) - at(220)).toBeGreaterThan(4.5)
    expect(at(110) - at(220)).toBeLessThan(7.5)
    expect(at(110) - at(1100)).toBeGreaterThan(18)
    expect(at(110) - at(1100)).toBeLessThan(22)
  })

  it('renders nothing for no frames, and does not trap', async () => {
    const bench = await lab('bench')
    const out = bench.render(silence(0), {})
    expect(out.frames).toBe(0)
    expect(Object.values(out.taps).every((tap) => tap.length === 0)).toBe(true)
  })

  it('says how loud the loops are', async () => {
    const bench = await lab('bench')
    const out = bench.render(silence(FOUR), {})
    for (const id of ['drums', 'guitar', 'chords']) {
      const data = out.taps[id]!.channels_data[0]!
      // Loud enough to drive a compressor, with room over the top.
      expect(gainToDb(peak(data)), `${id} peak`).toBeGreaterThan(-12)
      expect(gainToDb(rms(data)), `${id} level`).toBeGreaterThan(-32)
      console.log(
        id,
        'peak',
        gainToDb(peak(data)).toFixed(1),
        'rms',
        gainToDb(rms(data)).toFixed(1),
        'ms',
        out.ms.toFixed(0),
      )
    }
  })
})
