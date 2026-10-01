// A placed clip in a real browser: what `pan`, `lowpassHz` and `spaceDb` do
// to one second of noise on a real OfflineAudioContext, against the same
// clip unplaced. The numbers a host maps positions onto only mean something
// if these hold. The room's level is set in the low mids, so that is where
// it is measured: a warm noise comes back as loud as it was sent, hiss less.

import { expect, test } from '@playwright/test'

import type { PlacementMeasure } from '../harness/placement'
import { collectPageErrors } from './page-errors'

const CASES = {
  monoPlain: { channels: 1 },
  monoCentre: { channels: 1, pan: 0 },
  monoLeft: { channels: 1, pan: -0.6 },
  stereoPlain: { channels: 2 },
  stereoCentre: { channels: 2, pan: 0 },
  dull: { channels: 1, pan: 0, lowpassHz: 1000 },
  halfOpen: { channels: 1, pan: 0, lowpassHz: 6000 },
  quiet: { channels: 1, pan: 0, gainDb: -18 },
  // Dry as far down as a placed trim goes and the send as far up: the room alone, at −36 dB.
  room: { channels: 1, gainDb: -60, spaceDb: 24 },
  warmPlain: { channels: 1, warm: true },
  warmRoom: { channels: 1, warm: true, gainDb: -60, spaceDb: 24 },
  warmStereoPlain: { channels: 2, warm: true },
  warmStereoRoom: { channels: 2, warm: true, gainDb: -60, spaceDb: 24 },
} as const

const db = (ratio: number): number => 10 * Math.log10(ratio)
const total = ([left, right]: readonly [number, number]): number => left + right

test.describe('placed clips in real audio', () => {
  let measured: Record<keyof typeof CASES, PlacementMeasure>

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    const errors = collectPageErrors(page)
    await page.goto('/browser-tests/harness/index.html')
    await page.waitForSelector('body[data-harness="ready"]')
    measured = await page.evaluate((cases) => window.liveMixHarness.measurePlacements(cases), CASES)
    expect(errors, 'no page errors while measuring').toEqual([])
    await page.close()
  })

  test('a clip placed in the centre is as loud as the same clip unplaced, mono or stereo', () => {
    for (const [plain, centre] of [
      ['monoPlain', 'monoCentre'],
      ['stereoPlain', 'stereoCentre'],
    ] as const) {
      // The open low-pass sits just under half the sample rate; of white
      // noise it takes a tenth of a dB, all of it above 22 kHz.
      expect(Math.abs(db(measured[centre].during[0] / measured[plain].during[0]))).toBeLessThan(
        0.15,
      )
      expect(Math.abs(db(measured[centre].during[1] / measured[plain].during[1]))).toBeLessThan(
        0.15,
      )
    }
    // Without a send nothing is left once the clip has ended.
    expect(total(measured.monoCentre.after)).toBeLessThan(total(measured.monoCentre.during) * 1e-8)
  })

  test('pan leans a mono clip to one side at the same power', () => {
    const { during } = measured.monoLeft
    expect(db(during[0] / during[1])).toBeGreaterThan(6)
    expect(Math.abs(db(total(during) / total(measured.monoPlain.during)))).toBeLessThan(0.2)
  })

  test('the low-pass dulls the clip', () => {
    expect(measured.dull.brightness).toBeLessThan(measured.monoCentre.brightness * 0.05)
  })

  test('the low-pass is flat up to its cutoff: no bump ahead of it', () => {
    // White noise through a flat two-pole low-pass at a quarter of the band
    // keeps 1.11 quarters of its power, 5.6 dB down. A resonant one keeps more.
    const fall = db(total(measured.halfOpen.during) / total(measured.monoCentre.during))
    expect(fall).toBeGreaterThan(-6.3)
    expect(fall).toBeLessThan(-4.9)
  })

  test('a placed clip can sit 18 dB down, past the loudness trim of an unplaced one', () => {
    const fall = db(total(measured.quiet.during) / total(measured.monoCentre.during))
    expect(fall).toBeGreaterThan(-18.2)
    expect(fall).toBeLessThan(-17.8)
  })

  /** Everything a room-only render holds, against the dry clip's energy. */
  const returned = (room: keyof typeof CASES, plain: keyof typeof CASES): number =>
    db((total(measured[room].during) + total(measured[room].after)) / total(measured[plain].during))

  test('the room gives back as much of a low-mid sound as it was sent', () => {
    // The send is 36 dB under the clip's own level.
    for (const [room, plain] of [
      ['warmRoom', 'warmPlain'],
      ['warmStereoRoom', 'warmStereoPlain'],
    ] as const) {
      expect(returned(room, plain)).toBeGreaterThan(-38)
      expect(returned(room, plain)).toBeLessThan(-34)
    }
  })

  test('the room gives back less of hiss: its top end is gone early', () => {
    expect(returned('room', 'monoPlain')).toBeLessThan(returned('warmRoom', 'warmPlain') - 3)
    expect(returned('room', 'monoPlain')).toBeGreaterThan(-36 - 12)
  })

  test('the room rings on after the clip, wide and falling', () => {
    const { during, after, tailCorrelation, tailFallDb } = measured.room
    // A good part of what a one-second clip sends in comes back after it has ended.
    expect(total(after)).toBeGreaterThan(total(during) * 0.25)
    expect(Math.abs(db(after[0] / after[1]))).toBeLessThan(2)
    expect(Math.abs(tailCorrelation)).toBeLessThan(0.2)
    // 60 dB over five seconds is 24 dB over two.
    expect(tailFallDb).toBeGreaterThan(-28)
    expect(tailFallDb).toBeLessThan(-20)
  })
})
