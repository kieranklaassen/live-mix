// A bypassed device and an aligned strip are exact over a whole render, in
// a real browser: white noise bounced through `renderScore` with a device
// the score marks bypassed, and with a second strip the engine delays to
// line it up with the first, held against the noise moved later by the
// count of samples written here. The noise ends half a second before the
// render does, so the last of it comes out of a delay whose source is gone.

import { expect, test } from '@playwright/test'

import type {
  AlignedMeasure,
  BypassedMeasure,
  DelayCountsMeasure,
  LateCase,
} from '../harness/bypassed-and-aligned'
import { collectPageErrors } from './page-errors'

/** The WASM device that takes longest, and one that takes little: what each reports at any rate. */
const LONG = { deviceId: 'scale-filter', delaySamples: 9216 } as const
const SHORT = { deviceId: 'lift', delaySamples: 288 } as const

const BYPASSED = {
  compiledLong: { rate: 48000, channels: 2, ...LONG },
  compiledShort: { rate: 48000, channels: 2, ...SHORT },
  compiledLongAt44100: { rate: 44100, channels: 2, ...LONG },
  // The browser's compressor looks 6 ms ahead, in whole samples rounded down.
  compressor: { rate: 48000, channels: 2, deviceId: 'compressor', delaySamples: 288 },
  compressorAt44100: { rate: 44100, channels: 2, deviceId: 'compressor', delaySamples: 264 },
  compressorOneChannel: { rate: 48000, channels: 1, deviceId: 'compressor', delaySamples: 288 },
  // A device of the browser's nodes that takes no time: working, it would take the highs off.
  filter: {
    rate: 48000,
    channels: 2,
    deviceId: 'filter',
    params: { type: 0, frequency: 200 },
    delaySamples: 0,
  },
  // A device that runs in a worklet of its own: working, it would stay shut on this noise.
  gate: {
    rate: 48000,
    channels: 2,
    deviceId: 'gate',
    params: { threshold: 0, range: -90 },
    delaySamples: 0,
  },
  // And one that holds its sound for a frame of 1,024 samples at this rate.
  denoise: { rate: 48000, channels: 2, deviceId: 'de-noise', delaySamples: 1024 },
} satisfies Record<string, LateCase>

const ALIGNED = {
  long: { rate: 48000, channels: 2, ...LONG },
  short: { rate: 48000, channels: 2, ...SHORT },
  longAt44100: { rate: 44100, channels: 2, ...LONG },
  shortAt44100: { rate: 44100, channels: 2, ...SHORT },
  longOneChannel: { rate: 48000, channels: 1, ...LONG },
  shortOneChannel: { rate: 48000, channels: 1, ...SHORT },
} satisfies Record<string, LateCase>

/** What the stock devices that take time report, in samples. The compressor's is 264 at 44.1 kHz and 288 at 48 kHz. */
const STOCK_COUNTS = [16, 31, 39, 77, 129, 264, 271, 288, 415, 960, 2304, 4096, 4352, 4608, 9216]
/** One sample, each of those, each two of them in one chain, and the most one stage holds: a second. */
const countsAt = (rate: number): number[] => [
  ...new Set([
    1,
    ...STOCK_COUNTS,
    ...STOCK_COUNTS.flatMap((a, index) => STOCK_COUNTS.slice(index + 1).map((b) => a + b)),
    rate,
  ]),
]

/** The line a difference stays under, in dB under full scale. */
const LINE_DB = -120

test.describe('a bypassed device and an aligned strip are exact over a whole render, in real audio', () => {
  let bypassed: Record<keyof typeof BYPASSED, BypassedMeasure>
  let aligned: Record<keyof typeof ALIGNED, AlignedMeasure>
  let counts: Record<number, DelayCountsMeasure>

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    const errors = collectPageErrors(page)
    await page.goto('/browser-tests/harness/index.html')
    await page.waitForSelector('body[data-harness="ready"]')
    bypassed = await page.evaluate(
      (cases) => window.liveMixHarness.measureBypassedDevices(cases),
      BYPASSED,
    )
    aligned = await page.evaluate(
      (cases) => window.liveMixHarness.measureAlignedStrips(cases),
      ALIGNED,
    )
    counts = {}
    for (const rate of [44100, 48000]) {
      counts[rate] = await page.evaluate(
        ([at, list]) => window.liveMixHarness.measureDelayCounts(at, list),
        [rate, countsAt(rate)] as const,
      )
    }
    expect(errors, 'no page errors while measuring').toEqual([])
    await page.close()
  })

  for (const name of Object.keys(BYPASSED) as (keyof typeof BYPASSED)[]) {
    test(`a device made bypassed passes its input as late as it reports, from the first sample: ${name}`, () => {
      const measure = bypassed[name]
      test.info().annotations.push({ type: name, description: JSON.stringify(measure) })
      expect(measure.sameShape).toBe(true)
      expect(measure.reportedSamples).toBe(BYPASSED[name].delaySamples)
      expect(measure.headDb).toBeLessThan(LINE_DB)
      expect(measure.wholeDb).toBeLessThan(LINE_DB)
      expect(measure.tailDb).toBeLessThan(LINE_DB)
      // That the measure can fail: a delay that let go of the end of the
      // sound, or one a sample out, is this far from the render.
      if (BYPASSED[name].delaySamples > 0) expect(measure.tailZeroedDb).toBeGreaterThan(-20)
      expect(measure.movedByOneDb).toBeGreaterThan(-20)
    })
  }

  for (const name of Object.keys(ALIGNED) as (keyof typeof ALIGNED)[]) {
    test(`a strip the engine delays comes out that many samples late, to the last of its sound: ${name}`, () => {
      const measure = aligned[name]
      test.info().annotations.push({ type: name, description: JSON.stringify(measure) })
      expect(measure.reportedSamples).toBe(ALIGNED[name].delaySamples)
      expect(measure.compensationSamples).toBe(ALIGNED[name].delaySamples)
      for (const held of [measure.second, measure.both]) {
        expect(held.sameShape).toBe(true)
        expect(held.headDb).toBeLessThan(LINE_DB)
        expect(held.wholeDb).toBeLessThan(LINE_DB)
        expect(held.tailDb).toBeLessThan(LINE_DB)
        expect(held.tailZeroedDb).toBeGreaterThan(-20)
        expect(held.movedByOneDb).toBeGreaterThan(-20)
      }
    })
  }

  for (const rate of [44100, 48000]) {
    test(`an alignment stage delays by whole samples at every count a chain of two comes to: ${rate} Hz`, () => {
      test
        .info()
        .annotations.push({ type: String(rate), description: JSON.stringify(counts[rate]) })
      expect(counts[rate].counts).toBe(countsAt(rate).length)
      expect(counts[rate].worstDb, `at ${counts[rate].worstCount} samples`).toBeLessThan(LINE_DB)
    })
  }
})
