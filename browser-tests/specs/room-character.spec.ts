// A room's character in a real browser: what `driveDb` and `driftCents` do
// to a steady tone sent into the room alone, and what a change of room does
// to a room that is sounding. A vibe in a host is made of these, so the
// numbers a host is given have to hold on real nodes.

import { expect, test } from '@playwright/test'

import type { RoomMeasure } from '../harness/room'
import { collectPageErrors } from './page-errors'

const TONE = { toneSec: 5, renderSec: 8 }

const CASES = {
  clean: { ...TONE },
  driven: { ...TONE, space: { driveDb: 18 } },
  hard: { ...TONE, space: { driveDb: 36 } },
  // The same drive on a tone 12 dB under the level a driven room holds.
  drivenQuiet: { ...TONE, space: { driveDb: 18 }, levelDb: -30 },
  cleanQuiet: { ...TONE, levelDb: -30 },
  // Pitch is read in a short room: a long one is still filling while the
  // tone sounds, and a level that is still settling reads as a few cents.
  still: { ...TONE, space: { decaySec: 0.5 } },
  drifting: { ...TONE, space: { decaySec: 0.5, driftCents: 20, driftHz: 1 } },
  // A long room that becomes a short one while the tone sounds, and a clean one that becomes driven.
  shortened: { ...TONE, space: { decaySec: 6 }, change: { atSec: 2.5, space: { decaySec: 0.4 } } },
  long: { ...TONE, space: { decaySec: 6 } },
  dirtied: { ...TONE, change: { atSec: 2.5, space: { driveDb: 24 } } },
} as const

test.describe('a room with a character, in real audio', () => {
  let measured: Record<keyof typeof CASES, RoomMeasure>

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    const errors = collectPageErrors(page)
    await page.goto('/browser-tests/harness/index.html')
    await page.waitForSelector('body[data-harness="ready"]')
    measured = await page.evaluate((cases) => window.liveMixHarness.measureRooms(cases), CASES)
    expect(errors, 'no page errors while measuring').toEqual([])
    await page.close()
  })

  test('a clean room adds no harmonics, and a still one holds its pitch', () => {
    expect(measured.clean.secondDb).toBeLessThan(-70)
    expect(measured.clean.thirdDb).toBeLessThan(-70)
    expect(measured.still.highCents).toBeLessThan(0.5)
    expect(measured.still.lowCents).toBeGreaterThan(-0.5)
  })

  test('a driven room adds harmonics, even and odd, and more the harder it is driven', () => {
    expect(measured.driven.secondDb).toBeGreaterThan(-40)
    expect(measured.driven.thirdDb).toBeGreaterThan(-40)
    expect(measured.hard.thirdDb).toBeGreaterThan(measured.driven.thirdDb + 3)
  })

  test('a tone at the reference level comes back as loud from a driven room as from a clean one', () => {
    // One tone in a room is one of its resonances, so the room's own gain at
    // 440 Hz is in both readings and drops out of the difference.
    expect(Math.abs(measured.driven.levelDb - measured.clean.levelDb)).toBeLessThan(1.5)
    expect(Math.abs(measured.hard.levelDb - measured.clean.levelDb)).toBeLessThan(1.5)
  })

  test('drive brings quiet sound up: a tone 12 dB down comes back less than 12 dB down', () => {
    const cleanFall = measured.clean.levelDb - measured.cleanQuiet.levelDb
    const drivenFall = measured.driven.levelDb - measured.drivenQuiet.levelDb
    expect(cleanFall).toBeGreaterThan(11.5)
    expect(cleanFall).toBeLessThan(12.5)
    expect(drivenFall).toBeLessThan(cleanFall - 2)
  })

  test('a drifting room moves the pitch as far as it says, both ways, and no further', () => {
    const { highCents, lowCents } = measured.drifting
    expect(highCents).toBeGreaterThan(15)
    expect(highCents).toBeLessThan(25)
    expect(lowCents).toBeLessThan(-15)
    expect(lowCents).toBeGreaterThan(-25)
    // Drift is a moving delay and nothing else: it adds no harmonics.
    expect(measured.drifting.thirdDb).toBeLessThan(-70)
  })

  test('a room changed while it sounds does not click, and what follows is in the new room', () => {
    // A click is a step far bigger than the tone ever makes between two samples.
    expect(measured.shortened.maxStep).toBeLessThan(measured.long.maxStep * 3)
    expect(measured.dirtied.maxStep).toBeLessThan(measured.clean.maxStep * 6)
    // The tone ends two and a half seconds after the change. A second later
    // the long room is still full of it. The short one has let go of all it
    // was sent; what is left is the old room ringing out what it held at the
    // change, three and a half seconds into a six second fall.
    expect(measured.shortened.afterDb).toBeLessThan(measured.long.afterDb - 12)
    expect(measured.shortened.afterDb).toBeGreaterThan(-45)
    // The room that became driven makes harmonics from then on.
    expect(measured.dirtied.thirdDb).toBeGreaterThan(-45)
  })
})
