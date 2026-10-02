// A room shared between tracks, in a real browser: the same scene rendered
// with a convolver per track and with `EngineOptions.sharedSpace` has to be
// the same sound. A host turns the option on to save the convolvers, not to
// change what its pieces sound like.

import { expect, test } from '@playwright/test'

import type { SharedRoomMeasure, SharedRoomTrack, SharedRoomVoice } from '../harness/shared-room'
import { collectPageErrors } from './page-errors'

const voices = (hz: number): SharedRoomVoice[] => [
  { hz, atSec: 0.1, spaceDb: -3, pan: -0.4, lowpassHz: 4000 },
  { hz: hz * 1.5, atSec: 1.2, spaceDb: -9, pan: 0.6, channels: 1 },
  { hz: hz * 2, atSec: 2.5, spaceDb: 0, gainDb: -6 },
]

// Four tracks as a host's painted sounds are: a trim insert, a fader, nothing else.
const PLAIN: SharedRoomTrack[] = [
  { voices: voices(110), trimDb: 0, level: 0.7 },
  { voices: voices(165), trimDb: -4.5, level: 1.2 },
  { voices: voices(247), trimDb: 0 },
  { voices: voices(330) },
]

const CASES = {
  clean: { tracks: PLAIN },
  // Driven and drifting, as a tape vibe makes the room.
  tape: { space: { driveDb: 12, driftCents: 10, driftHz: 0.5, decaySec: 3 }, tracks: PLAIN },
  // One track is panned, so it keeps a room of its own beside the shared one.
  mixed: {
    space: { driveDb: 6 },
    tracks: [...PLAIN.slice(0, 3), { voices: voices(330), pan: 0.5, trimDb: -2 }],
  },
}

test.describe('a room shared between tracks, in real audio', () => {
  let measured: Record<keyof typeof CASES, SharedRoomMeasure>

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    const errors = collectPageErrors(page)
    await page.goto('/browser-tests/harness/index.html')
    await page.waitForSelector('body[data-harness="ready"]')
    measured = await page.evaluate(
      (cases) => window.liveMixHarness.measureSharedRooms(cases),
      CASES,
    )
    expect(errors, 'no page errors while measuring').toEqual([])
    await page.close()
  })

  test('plain tracks send into one convolver instead of four', () => {
    expect(measured.clean.roomsOwn).toBe(4)
    expect(measured.clean.roomsShared).toBe(1)
    expect(measured.tape.roomsShared).toBe(1)
    // The panned track has its own; the other three share.
    expect(measured.mixed.roomsShared).toBe(2)
  })

  test('a clean room sounds the same shared, down to rounding', () => {
    expect(measured.clean.peak).toBeGreaterThan(0.5)
    expect(measured.clean.maxDiffDb).toBeLessThan(-110)
    expect(measured.mixed.maxDiffDb).toBeLessThan(-110)
  })

  test('a driven, drifting room sounds the same shared', () => {
    // Each track still has its own saturator; the one moving delay after the
    // room is a little off in its rounding from four of them summed.
    expect(measured.tape.peak).toBeGreaterThan(0.5)
    expect(measured.tape.maxDiffDb).toBeLessThan(-70)
    expect(measured.tape.diffDb).toBeLessThan(-90)
  })
})
