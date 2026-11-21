// A render starts every strip where the score has it, in a real browser:
// two tracks of noise bounced through `renderScore` with a strip muted,
// soloed, turned down, trimmed or panned by the score, and the bounce held
// against the mix of the two noises that the score asks for, from the first
// sample on. What each case must hold is written here as how much of each
// track's two channels each channel of the bounce carries.

import { expect, test } from '@playwright/test'

import type {
  MidRenderMeasure,
  StripStartCase,
  StripStartMeasure,
  Weights,
} from '../harness/strip-start'
import { collectPageErrors } from './page-errors'

const AS_IT_CAME: Weights = [
  [1, 0],
  [0, 1],
]
const NONE: Weights = [
  [0, 0],
  [0, 0],
]
const scaled = (gain: number): Weights => [
  [gain, 0],
  [0, gain],
]
/** Two channels panned hard left: both in the left channel, nothing in the right. */
const ALL_LEFT: Weights = [
  [1, 1],
  [0, 0],
]

const UNTOUCHED = { expected: { a: AS_IT_CAME, b: AS_IT_CAME } } satisfies StripStartCase

const MOVED = {
  muted: { b: { mute: true }, expected: { a: AS_IT_CAME, b: NONE } },
  halfLevel: { a: { level: 0.5 }, expected: { a: scaled(0.5), b: AS_IT_CAME } },
  soloed: { a: { solo: true }, expected: { a: AS_IT_CAME, b: NONE } },
  halfInputGain: { a: { inputGain: 0.5 }, expected: { a: scaled(0.5), b: AS_IT_CAME } },
  pannedLeft: { a: { pan: -1 }, expected: { a: ALL_LEFT, b: AS_IT_CAME } },
  masterHalf: { masterLevel: 0.5, expected: { a: scaled(0.5), b: scaled(0.5) } },
  groupQuarter: { group: { level: 0.25 }, expected: { a: scaled(0.25), b: AS_IT_CAME } },
  groupMuted: { group: { mute: true }, expected: { a: NONE, b: AS_IT_CAME } },
  // The muted track's clip sends into a room: the room hears none of it either.
  mutedInRoom: { b: { mute: true }, room: true, expected: { a: AS_IT_CAME, b: NONE } },
  soloedBesideRoom: { a: { solo: true }, room: true, expected: { a: AS_IT_CAME, b: NONE } },
  // A stem is its track soloed in place: the other track is out of it.
  stem: { stem: 'b', expected: { a: NONE, b: AS_IT_CAME } },
  // A trim, a pan and a fader on one strip, the other muted, under a master turned down.
  together: {
    a: { inputGain: 0.5, pan: -1, level: 0.5 },
    b: { mute: true },
    masterLevel: 0.5,
    expected: {
      a: [
        [0.125, 0.125],
        [0, 0],
      ],
      b: NONE,
    },
  },
} satisfies Record<string, StripStartCase>

/** Track `b` sends into the room and nothing is muted: the room is in the bounce. */
const ROOM_HEARD = {
  room: true,
  expected: { a: AS_IT_CAME, b: AS_IT_CAME },
} satisfies StripStartCase

const CASES = { untouched: UNTOUCHED, roomHeard: ROOM_HEARD, ...MOVED }

test.describe('a render starts every strip where the score has it, in real audio', () => {
  let measured: Record<keyof typeof CASES, StripStartMeasure>
  let midRender: MidRenderMeasure

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    const errors = collectPageErrors(page)
    await page.goto('/browser-tests/harness/index.html')
    await page.waitForSelector('body[data-harness="ready"]')
    measured = await page.evaluate(
      (cases) => window.liveMixHarness.measureStripStarts(cases),
      CASES,
    )
    midRender = await page.evaluate(() => window.liveMixHarness.measureMuteMidRender())
    expect(errors, 'no page errors while measuring').toEqual([])
    await page.close()
  })

  test('an untouched score bounces to the two tracks added up, sample for sample', () => {
    // No strip has a node and the master is at unity: each sample is the
    // sum of two, which a sample holds exactly.
    expect(measured.untouched.sameShape).toBe(true)
    expect(measured.untouched.wholeDb).toBe(-200)
  })

  test('each moved case is far from the untouched mix in its first 100 ms', () => {
    // That the measure can fail: a strip not yet where the score has it
    // leaves the head of the bounce near the untouched mix, which is this far off.
    for (const name of Object.keys(MOVED) as (keyof typeof MOVED)[]) {
      expect(measured[name].unsetHeadDb, name).toBeGreaterThan(-20)
    }
  })

  test('a room is in the bounce while the track that sends into it is heard', () => {
    // That the two cases with a room can fail: unmuted, the room adds its
    // sound to the two tracks, so its silence in them is the strip's doing.
    expect(measured.roomHeard.wholeDb).toBeGreaterThan(-40)
  })

  for (const name of Object.keys(MOVED) as (keyof typeof MOVED)[]) {
    test(`the bounce is what the score asks for from its first sample: ${name}`, () => {
      const { firstFrame, headDb, wholeDb, sameShape } = measured[name]
      test.info().annotations.push({ type: name, description: JSON.stringify(measured[name]) })
      expect(sameShape).toBe(true)
      expect(firstFrame.rendered[0]).toBeCloseTo(firstFrame.expected[0], 6)
      expect(firstFrame.rendered[1]).toBeCloseTo(firstFrame.expected[1], 6)
      // Gains and a panner worked in single precision leave the last bits of a sample.
      expect(headDb).toBeLessThan(-120)
      expect(wholeDb).toBeLessThan(-120)
    })
  }

  test('a strip muted while the render is under way closes over its time constant', () => {
    test.info().annotations.push({ type: 'midRender', description: JSON.stringify(midRender) })
    expect(midRender.gateBefore).toBeCloseTo(1, 4)
    // The 5 ms of a strip's approach, as on a playing engine.
    expect(midRender.timeConstantSec).toBeGreaterThan(0.0049)
    expect(midRender.timeConstantSec).toBeLessThan(0.0051)
    expect(Math.abs(midRender.gateAfter)).toBeLessThan(1e-4)
  })
})
