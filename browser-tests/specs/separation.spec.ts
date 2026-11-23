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

// More parts than five. Where a case asks for six stems the harness's
// stand-in gives the four with a guitar and a piano, and where it asks for
// splits a second stand-in takes the drums apart in four and a third the
// vocals in two, each leaving a rest of the part it split under the part's
// own name. Every part is laid and bounced as the five are.

const SEVEN_PARTS = ['vocals', 'drums', 'bass', 'other', 'guitar', 'piano', 'remainder']
const ELEVEN_PARTS = [
  'lead',
  'backing',
  'vocals',
  'kick',
  'snare',
  'toms',
  'cymbals',
  'drums',
  'bass',
  'other',
  'remainder',
]

const SPLIT = { sampleRate: 44100, channels: 2, splits: ['drums', 'vocals'] } as const

const MORE_WHOLE = {
  sixStems: { sampleRate: 44100, channels: 2, stems: 6 },
  sixStemsMonoResampled: { sampleRate: 48000, channels: 1, stems: 6 },
  drumsAndVocalsSplit: SPLIT,
} as const

const MORE_CASES = {
  ...MORE_WHOLE,
  pianoMuted: { sampleRate: 44100, channels: 2, stems: 6, mute: 'piano' },
  snareMuted: { ...SPLIT, mute: 'snare' },
  restOfDrumsMuted: { ...SPLIT, mute: 'drums' },
} as const

const MORE_PARTS: Record<keyof typeof MORE_CASES, readonly string[]> = {
  sixStems: SEVEN_PARTS,
  sixStemsMonoResampled: SEVEN_PARTS,
  drumsAndVocalsSplit: ELEVEN_PARTS,
  pianoMuted: SEVEN_PARTS,
  snareMuted: ELEVEN_PARTS,
  restOfDrumsMuted: ELEVEN_PARTS,
}

test.describe('a track in more than five parts bounced untouched in real audio', () => {
  let measured: Record<keyof typeof MORE_CASES, SeparationMeasure>

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    const errors = collectPageErrors(page)
    await page.goto('/browser-tests/harness/index.html')
    await page.waitForSelector('body[data-harness="ready"]')
    measured = await page.evaluate(
      (cases) => window.liveMixHarness.measureSeparation(cases),
      MORE_CASES,
    )
    expect(errors, 'no page errors while measuring').toEqual([])
    await page.close()
  })

  test('each case is laid as the parts it asked for, with a remainder worth having', () => {
    for (const name of Object.keys(MORE_CASES) as (keyof typeof MORE_CASES)[]) {
      expect(measured[name].parts, name).toEqual(MORE_PARTS[name])
      expect(measured[name].trackPeakDb, name).toBeGreaterThan(-1)
      expect(measured[name].remainderDb, name).toBeGreaterThan(-20)
      expect(measured[name].sameShape, name).toBe(true)
    }
  })

  test('each split leaves a rest of its part worth having', () => {
    // What the drums' four leave is 3.4 dB under the drums, and what the
    // vocals' two leave is 12.1 dB under the vocals.
    const { restsDb } = measured.drumsAndVocalsSplit
    expect(Object.keys(restsDb)).toEqual(['drums', 'vocals'])
    expect(restsDb.drums).toBeGreaterThan(-20)
    expect(restsDb.vocals).toBeGreaterThan(-20)
  })

  for (const name of ['sixStems', 'sixStemsMonoResampled'] as const) {
    test(`the bounce is the track: ${name}`, () => {
      // Seven parts. The difference is in the last bits of a sample and is
      // not the same in every run: over 40 runs it was 138.5 dB under full
      // scale at its least and 132.4 dB at its most, in two channels and in
      // one alike. With the piano muted it is 12.2 dB under.
      expect(measured[name].differenceDb).toBeLessThan(-120)
    })
  }

  test('the bounce is the track: drumsAndVocalsSplit', () => {
    // Eleven parts. Over 40 runs the difference was 138.5 dB under full
    // scale at its least and 130.5 dB at its most. With the snare muted it
    // is 19.1 dB under, and with what is left of the drums muted 13.7 dB.
    expect(measured.drumsAndVocalsSplit.differenceDb).toBeLessThan(-120)
  })

  test('without one of six stems the bounce is not the track', () => {
    // That the measure can fail at seven parts.
    expect(measured.pianoMuted.differenceDb).toBeGreaterThan(-40)
  })

  test('without one part of a split the bounce is not the track', () => {
    expect(measured.snareMuted.differenceDb).toBeGreaterThan(-40)
  })

  test('without the rest of a split part the bounce is not the track', () => {
    // The track named for the drums holds only what the kick, the snare,
    // the toms and the cymbals left of them, and the sum needs it.
    expect(measured.restOfDrumsMuted.differenceDb).toBeGreaterThan(-40)
  })
})
