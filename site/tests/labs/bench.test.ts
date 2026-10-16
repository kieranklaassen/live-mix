import { describe, expect, it } from 'vitest'
import { SOURCES } from '../../src/lab/sources.ts'
import { BIN, gainToDb, lab, loops, peak, RATE, rms, seconds, silence } from './support.ts'

const FOUR = seconds(4)
/** The loops the engine's instruments play; the rest are test signals. */
const LOOPS = ['drums', 'guitar', 'chords', 'bass', 'pad', 'mix']

/** The level, in dB, of the part of `x` from `from` to `to` that turns at exactly `hz`, under a Hann window. */
function lineDb(x: Float32Array, hz: number, from: number, to: number): number {
  let re = 0
  let im = 0
  for (let i = from; i < to; i += 1) {
    const v = x[i]! * (0.5 - 0.5 * Math.cos((2 * Math.PI * (i - from)) / (to - from)))
    re += v * Math.cos((2 * Math.PI * hz * i) / RATE)
    im -= v * Math.sin((2 * Math.PI * hz * i) / RATE)
  }
  return gainToDb((4 * Math.hypot(re, im)) / (to - from))
}

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

  it('lists eleven sources, six of them loops, each with a name and one line about it', () => {
    expect(SOURCES.map((source) => source.id)).toEqual([
      ...LOOPS,
      'sine',
      'saw',
      'noise',
      'clicks',
      'sweep',
    ])
    for (const source of SOURCES) {
      expect(source.name, source.id).not.toBe('')
      expect(source.about, source.id).toMatch(/^[^\n]{20,100}\.$/)
    }
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
      // The clicks start on a click by design: they are held to the clicks inside the loop.
      for (const data of out.taps[source.id]!.channels_data) {
        expect(loops(data, source.id === 'clicks'), source.id).toBe(true)
      }
    }
  })

  it('starts the drum loop on a kick: the first tenth of a second is mostly under 150 Hz', async () => {
    const bench = await lab('bench')
    bench.render(silence(FOUR), {})
    const spectrum = bench.spectrum('drums', 0, 0, seconds(0.1))
    const band = (from: number, to: number) => {
      let sum = 0
      for (let k = Math.round(from / BIN); k <= Math.round(to / BIN); k += 1)
        sum += 10 ** (spectrum[k]! / 10)
      return 10 * Math.log10(sum)
    }
    expect(band(30, 150)).toBeGreaterThan(band(150, 2000) + 6)
  })

  it('plays the bass on the root of each bar: A in the first, F in the second', async () => {
    const bench = await lab('bench')
    const bass = bench.render(silence(FOUR), {}).taps.bass!.channels_data[0]!
    const [a, f] = [55, 43.65]
    // The other bar's root is 18 dB down in the first bar and 11 dB down in the second.
    expect(lineDb(bass, a, 0, seconds(2)) - lineDb(bass, f, 0, seconds(2))).toBeGreaterThan(12)
    expect(lineDb(bass, f, seconds(2), FOUR) - lineDb(bass, a, seconds(2), FOUR)).toBeGreaterThan(6)
  })

  it('holds A minor on the pad in the first bar and F in the second', async () => {
    const bench = await lab('bench')
    const pad = bench.render(silence(FOUR), {}).taps.pad!.channels_data[0]!
    // The second half of each bar, once the chord has swelled. The F above middle C is in the
    // second bar's chord only; the E under it is the first bar's, and in the second what is
    // left at its pitch is an overtone of a lower note.
    const first = [seconds(1), seconds(2)] as const
    const second = [seconds(3), FOUR] as const
    expect(lineDb(pad, 349.23, ...second) - lineDb(pad, 349.23, ...first)).toBeGreaterThan(40)
    expect(lineDb(pad, 329.63, ...first) - lineDb(pad, 329.63, ...second)).toBeGreaterThan(10)
  })

  it('adds the mix up from the drums, the bass and the chords, and from nothing else', async () => {
    const bench = await lab('bench')
    const out = bench.render(silence(FOUR), {})
    for (const [c, mix] of out.taps.mix!.channels_data.entries()) {
      const part = (id: string) => out.taps[id]!.channels_data[c]!
      const [drums, bass, chords] = [part('drums'), part('bass'), part('chords')]
      let apart = 0
      for (let i = 0; i < mix.length; i += 1) {
        const sum = 0.75 * drums[i]! + 0.6 * bass[i]! + 0.75 * chords[i]!
        apart = Math.max(apart, Math.abs(mix[i]! - sum))
      }
      expect(apart).toBeLessThan(1e-6)
    }
  })

  it('measures a sine where it is: the 440 Hz sine peaks at 440 Hz and reads its level', async () => {
    const bench = await lab('bench')
    bench.render(silence(FOUR), {})
    const spectrum = bench.spectrum('sine')
    let top = 0
    for (let k = 1; k < spectrum.length; k += 1) if (spectrum[k]! > spectrum[top]!) top = k
    expect(Math.abs(top * BIN - 440)).toBeLessThan(BIN)
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
      const k = Math.round(hz / BIN)
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
    for (const id of LOOPS) {
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
