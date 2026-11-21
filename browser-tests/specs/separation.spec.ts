// A separated track, laid on a score and bounced untouched, in a real
// browser: the bounce against the track it was separated from. The parts
// are a stand-in's (the harness says how they are made), so what is held
// here is the arithmetic and the engine, not a model: the five parts add up
// to the track through real sources, gains, panners and the master.

import { expect, test } from '@playwright/test'

import type { SeparationMeasure } from '../harness/separation'
import { collectPageErrors } from './page-errors'

const WHOLE = {
  stereo: { sampleRate: 44100, channels: 2 },
  // The separator works at 44,100: the track goes there and its stems come back.
  stereoResampled: { sampleRate: 48000, channels: 2 },
  mono: { sampleRate: 44100, channels: 1 },
  monoResampled: { sampleRate: 48000, channels: 1 },
} as const

const CASES = {
  ...WHOLE,
  remainderMuted: { sampleRate: 44100, channels: 2, muteRemainder: true },
  noSilenceAfter: { sampleRate: 44100, channels: 2, noTail: true },
} as const

test.describe('a separated track bounced untouched in real audio', () => {
  let measured: Record<keyof typeof CASES, SeparationMeasure>

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    const errors = collectPageErrors(page)
    await page.goto('/browser-tests/harness/index.html')
    await page.waitForSelector('body[data-harness="ready"]')
    measured = await page.evaluate((cases) => window.liveMixHarness.measureSeparation(cases), CASES)
    expect(errors, 'no page errors while measuring').toEqual([])
    await page.close()
  })

  test('the track is near full scale and the stems leave a remainder worth having', () => {
    for (const name of Object.keys(CASES) as (keyof typeof CASES)[]) {
      expect(measured[name].trackPeakDb, name).toBeGreaterThan(-1)
      expect(measured[name].remainderDb, name).toBeGreaterThan(-20)
      expect(measured[name].sameShape, name).toBe(true)
    }
  })

  for (const name of Object.keys(WHOLE) as (keyof typeof WHOLE)[]) {
    test(`the bounce is the track: ${name}`, () => {
      // Five voices added where one sound was differ in the last bits of a
      // sample: 138 dB under full scale in two channels and 144 dB in one,
      // at the track's own rate and through the resampling alike.
      expect(measured[name].differenceDb).toBeLessThan(-120)
    })
  }

  test('without the remainder the bounce is not the track', () => {
    // That the measure can fail: the remainder is most of what the stand-in
    // left out, and the bounce without it is 1 dB under full scale from the track.
    expect(measured.remainderMuted.differenceDb).toBeGreaterThan(-40)
  })

  test('without the silence after each part the bounce is not the track', () => {
    // What the silence is for. A part kept in a buffer that ends where its
    // sound does, and that stands away from zero there, is eased in and out
    // by its track: the bounce was 10 dB under full scale from the track.
    expect(measured.noSilenceAfter.differenceDb).toBeGreaterThan(-40)
  })
})
