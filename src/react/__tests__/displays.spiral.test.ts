// The truth of Spiral's display: every figure it draws against the device's
// own formula, worked out by hand from `cpp/devices/spiral/spiral.h`, each
// handle against the parameter it sets, and what is live against the meter
// it reads. The device's native harness (`cpp/test/spiral_test.cpp`) measures
// the same figures on the sound: the partials of a held sine stand where
// `spiralVoices` puts them, as loud against each other as it says.

import { describe, expect, it } from 'vitest'

import { PLAIN_COLOURS } from '../components/display-kit'
import {
  SPIRAL_CLIMB_AT,
  SPIRAL_FACES,
  SPIRAL_SPAN,
  SPIRAL_STACK,
  climbText,
  spiralBell,
  spiralCount,
  spiralFall,
  spiralHeard,
  spiralLayout,
  spiralLowest,
  spiralStreaks,
  spiralThickness,
  spiralVoices,
  spiralWet,
  spiralX,
  spiralY,
  type SpiralSettings,
} from '../components/displays/spiral'
import { type DisplayHandle, type DisplayHold } from '../components/plate-display'
import {
  drawDisplay,
  patchUnder,
  runDisplay,
  stockDescriptors,
  testSignal,
  viewOf,
} from './display-harness'

const { display, face } = SPIRAL_FACES.spiral
const descriptor = stockDescriptors().get('spiral')
const params = descriptor?.params ?? {}

// From spiral.h: kStack = 6 voices an octave apart; the bell is
// sin(pi x)^(2q) with q = kNarrowPower (4) at Spread 0 and kWidePower (0.5)
// at Spread 1, so the exponent is 8 x (1/8)^Spread; the octaves that sound
// start ceil(Voices / 2) under the played pitch.
const STACK = 6
const exponent = (spread: number): number => 8 * Math.pow(1 / 8, spread)

const settings = (over: Partial<SpiralSettings> = {}): SpiralSettings => ({
  glide: 0,
  climb: 3,
  decay: 8,
  voices: 4,
  spread: 0.5,
  mix: 0.4,
  ...over,
})

const handlesAt = (values: Record<string, number>, size?: { width: number; height: number }) =>
  display.handles?.(viewOf(display, params, { values, ...size })) ?? []
const handleOf = (
  key: string,
  values: Record<string, number>,
  size?: { width: number; height: number },
): DisplayHandle => {
  const found = handlesAt(values, size).find((handle) => handle.key === key)
  if (!found) throw new Error(`no handle ${key}`)
  return found
}

/** The sizes it is drawn at: beside the knobs, upright on a pedal, and as low as a strip. */
const SIZES = [
  { width: 128, height: 100 },
  { width: 204, height: 100 },
  { width: 224, height: 48 },
]

describe('Spiral: the bell and the voices', () => {
  it('has the six voices of the device, wrapping every six octaves', () => {
    expect(SPIRAL_STACK).toBe(STACK)
    expect(face).toEqual(['climb', 'decay', 'voices', 'mix'])
  })

  it('draws the bell of the header: sin(pi x) to the power 8 x (1/8)^Spread (by hand)', () => {
    for (const spread of [0, 0.25, 0.5, 1]) {
      for (const x of [0.05, 0.125, 0.25, 0.5, 0.8]) {
        expect(spiralBell(x, spread)).toBeCloseTo(
          Math.pow(Math.sin(Math.PI * x), exponent(spread)),
          12,
        )
      }
    }
    // Wide, it is the plain half sine; narrow, its eighth power: 0.7071 and 0.0625 a quarter of the way up.
    expect(spiralBell(0.25, 1)).toBeCloseTo(0.70711, 4)
    expect(spiralBell(0.25, 0)).toBeCloseTo(0.0625, 6)
    expect(spiralBell(0.5, 0.3)).toBeCloseTo(1, 12)
    // Nothing at the two ends, nor past them: a voice wraps unheard.
    for (const x of [0, 1, -0.2, 1.4]) expect(spiralBell(x, 0.5)).toBe(0)
  })

  it('puts voice v at (glide + v) mod 6, three octaves down to three up', () => {
    const stack = spiralVoices(0.5, 4, 1)
    expect(stack.map((voice) => voice.octaves)).toEqual([-2.5, -1.5, -0.5, 0.5, 1.5, 2.5])
    // The clock has wrapped: voice 5 has come round to the foot.
    expect(spiralVoices(1.25, 6, 1).map((voice) => voice.octaves)).toEqual([
      -1.75, -0.75, 0.25, 1.25, 2.25, -2.75,
    ])
    // A clock that ran backwards stands at the same places.
    expect(spiralVoices(-5.5, 4, 1)[0].octaves).toBeCloseTo(-2.5, 12)
  })

  it('levels them as the device does: the bell, over the root of the sum of the squares (by hand)', () => {
    // Four voices, wide, the clock at 0.5: the shares 1/8, 3/8, 5/8, 7/8 of
    // the range, sin = 0.38268 and 0.92388, the squares add to 2.
    const levels = spiralVoices(0.5, 4, 1).map((voice) => voice.level)
    expect(levels[0]).toBe(0)
    expect(levels[5]).toBe(0)
    expect(levels[1]).toBeCloseTo(0.38268 / Math.SQRT2, 4)
    expect(levels[2]).toBeCloseTo(0.92388 / Math.SQRT2, 4)
    expect(levels[3]).toBeCloseTo(levels[2], 12)
    expect(levels[4]).toBeCloseTo(levels[1], 12)
    // The harness measures the outer partial 7.66 dB under the inner one: this ratio.
    expect(20 * Math.log10(levels[1] / levels[2])).toBeCloseTo(-7.66, 2)
    // Their power is the same wherever the clock stands and whatever the bell.
    for (const glide of [0, 0.3, 0.999, 2.5, 5.7]) {
      for (const voices of [2, 3, 4, 5, 6]) {
        for (const spread of [0, 0.4, 1]) {
          const power = spiralVoices(glide, voices, spread).reduce(
            (sum, voice) => sum + voice.level ** 2,
            0,
          )
          expect(power).toBeCloseTo(1, 9)
        }
      }
    }
  })

  it('lets Voices octaves sound, from ceil(Voices / 2) under the played pitch', () => {
    expect([2, 3, 4, 5, 6].map(spiralLowest)).toEqual([-1, -2, -2, -3, -3])
    expect([1.4, 2.6, 4.49, 9].map(spiralCount)).toEqual([2, 3, 4, 6])
    for (const voices of [2, 3, 4, 5, 6]) {
      const sounding = spiralVoices(0.37, voices, 1).filter((voice) => voice.level > 0)
      expect(sounding.length).toBe(voices)
      for (const voice of sounding) {
        expect(voice.octaves).toBeGreaterThan(spiralLowest(voices))
        expect(voice.octaves).toBeLessThan(spiralLowest(voices) + voices)
      }
    }
  })
})

describe('Spiral: the staircase', () => {
  it('moves every voice at Climb octaves a minute: up, down, and not at all', () => {
    for (const climb of [3, 12, -6, 0]) {
      const at = settings({ climb, glide: 1.2, voices: 6 })
      for (const seconds of [1, 5, 20]) {
        for (let v = 0; v < STACK; v++) {
          const moved = spiralHeard(at, v, seconds).octaves - spiralHeard(at, v, 0).octaves
          // Mod 6: a voice that left the top is six octaves down.
          const wrapped = ((((moved - (climb / 60) * seconds + 3) % 6) + 6) % 6) - 3
          expect(Math.abs(wrapped)).toBeLessThan(1e-9)
        }
      }
    }
  })

  it('draws each streak on the line its voice glides along, a column every two pixels', () => {
    for (const size of SIZES) {
      const layout = spiralLayout(size)
      const at = settings({ glide: 0.4, climb: 6 })
      const streaks = spiralStreaks(layout, at)
      // Voice 2 starts at -0.6 octaves and has climbed 2.4 octaves at the right edge: no wrap.
      const streak = streaks[2]
      const last = streak.upper.length - 1
      const middle = (n: number): number => (streak.upper[n][1] + streak.lower[n][1]) / 2
      expect(streak.upper[0][0]).toBe(layout.stair.x)
      expect(middle(0)).toBeCloseTo(spiralY(layout, -0.6), 9)
      const seconds = ((streak.upper[last][0] - layout.stair.x) / layout.stair.w) * SPIRAL_SPAN
      expect(middle(last)).toBeCloseTo(spiralY(layout, -0.6 + (6 / 60) * seconds), 9)
      // An octave is the same height everywhere: six of them fill the panel.
      expect(spiralY(layout, -3) - spiralY(layout, 3)).toBeCloseTo(layout.stair.h, 9)
      expect(spiralX(layout, SPIRAL_SPAN) - spiralX(layout, 0)).toBeCloseTo(layout.stair.w, 9)
    }
  })

  it('breaks a streak where its voice wraps, and draws what it worked out', () => {
    const layout = spiralLayout({ width: 128, height: 100 })
    // At 12 octaves a minute the clock turns 4.8 octaves across the panel: four or five voices wrap.
    const fast = spiralStreaks(layout, settings({ climb: 12, voices: 6 }))
    expect(fast.length).toBeGreaterThan(STACK + 3)
    for (const streak of fast) {
      for (let n = 1; n < streak.upper.length; n++) {
        const step =
          Math.abs(
            streak.upper[n][1] +
              streak.lower[n][1] -
              streak.upper[n - 1][1] -
              streak.lower[n - 1][1],
          ) / 2
        expect(step).toBeLessThan(layout.octave)
      }
    }
    expect(spiralStreaks(layout, settings({ climb: 0 })).length).toBe(STACK)
    // The picture is those streaks: each begins where the display moves its pen to.
    const drawn = drawDisplay(display, params, {
      values: { climb: 12, voices: 6 },
      meters: { glide: 0, tail: 0 },
    })
    const starts = drawn.calls
      .filter((call) => call.name === 'moveTo')
      .map((call) => call.args as number[])
    for (const streak of spiralStreaks(layout, settings({ climb: 12, voices: 6 }))) {
      const [x, y] = streak.upper[0]
      expect(starts.some(([sx, sy]) => Math.abs(sx - x) < 1e-9 && Math.abs(sy - y) < 1e-9)).toBe(
        true,
      )
    }
  })
})

describe('Spiral: how loud a streak is', () => {
  it('is as thick as the level in dB: whole at full level, half at 30 dB down, nothing at 60', () => {
    expect(spiralThickness(1)).toBe(1)
    expect(spiralThickness(Math.pow(10, -30 / 20))).toBeCloseTo(0.5, 9)
    expect(spiralThickness(Math.pow(10, -60 / 20))).toBeCloseTo(0, 9)
    expect(spiralThickness(0)).toBe(0)
  })

  it('falls 60 dB in Decay, as kit::rt60_gain makes the tank (by hand)', () => {
    expect(20 * Math.log10(spiralFall(8, 8))).toBeCloseTo(-60, 9)
    expect(20 * Math.log10(spiralFall(2, 8))).toBeCloseTo(-15, 9)
    expect(spiralFall(0, 8)).toBe(1)
  })

  it('lets out what the equal-power Mix of the kit lets out (by hand)', () => {
    expect(spiralWet(0)).toBe(0)
    expect(spiralWet(0.5)).toBeCloseTo(Math.SQRT1_2, 12)
    expect(spiralWet(1)).toBeCloseTo(1, 12)
    expect(spiralWet(0.4)).toBeCloseTo(0.58779, 5)
  })

  it('is the bell where the voice has got to, times the fall, times Mix', () => {
    const at = settings({ glide: 0.5, climb: 6, voices: 4, spread: 1, decay: 10, mix: 0.4 })
    // Voice 3 after 5 s: the clock at 1.0, the voice at +1 octave, the share
    // 3/4 of the range; the sounding voices stand at 1/4, 1/2 and 3/4, whose
    // squares add to 2; the tail has fallen 30 dB.
    const heard = spiralHeard(at, 3, 5)
    expect(heard.octaves).toBeCloseTo(1, 9)
    const expected = (Math.sin(Math.PI * 0.75) / Math.SQRT2) * Math.pow(10, -30 / 20) * 0.58779
    expect(heard.level).toBeCloseTo(expected, 5)
  })

  it('ends every streak at the tail end and draws none of what Mix 0 keeps back', () => {
    const layout = spiralLayout({ width: 128, height: 100 })
    const thickAt = (streaks: ReturnType<typeof spiralStreaks>, x: number): number =>
      Math.max(
        ...streaks.flatMap((streak) =>
          streak.upper.flatMap(([sx, sy], n) =>
            Math.abs(sx - x) < 1.01 ? [streak.lower[n][1] - sy] : [],
          ),
        ),
      )
    const streaks = spiralStreaks(layout, settings({ decay: 8, mix: 1 }))
    expect(thickAt(streaks, spiralX(layout, 0))).toBeGreaterThan(layout.thick)
    expect(thickAt(streaks, spiralX(layout, 4))).toBeGreaterThan(0.3 * layout.thick)
    expect(thickAt(streaks, spiralX(layout, 9))).toBe(0)
    expect(thickAt(spiralStreaks(layout, settings({ mix: 0 })), spiralX(layout, 0))).toBe(0)
    // A quieter Mix is a thinner streak: 0.25 lets out 8.3 dB less than 1.
    const quiet = spiralStreaks(layout, settings({ decay: 8, mix: 0.25 }))
    expect(thickAt(quiet, spiralX(layout, 0))).toBeLessThan(thickAt(streaks, spiralX(layout, 0)))
  })
})

describe('Spiral: what is live', () => {
  const dots = (values: Record<string, number>, meters: Record<string, number>) =>
    runDisplay(display, params, 0.2, { values, meters, signal: testSignal() })
      .calls.filter((call) => call.name === 'arc')
      .map((call) => call.args as number[])

  it('starts the streaks and stands the voices where the glide meter says', () => {
    const layout = spiralLayout({ width: 128, height: 100 })
    for (const glide of [0, 0.75, 4.2]) {
      const drawn = dots({ voices: 6, spread: 1 }, { glide, tail: 0.5 })
      for (const voice of spiralVoices(glide, 6, 1)) {
        if (voice.level <= 0) continue
        const y = spiralY(layout, voice.octaves)
        expect(drawn.some(([x, dy]) => x === layout.stair.x && Math.abs(dy - y) < 1e-9)).toBe(true)
      }
    }
    // The picture moves with the clock, also while Mix keeps the tail back.
    const still = (glide: number) =>
      runDisplay(display, params, 0.2, {
        values: { mix: 0 },
        meters: { glide, tail: 0.5 },
        signal: testSignal(),
      }).print()
    expect(still(1.3)).not.toBe(still(0))
  })

  it('lights each voice by the tail meter, the bell and Mix: a larger dot for a louder voice', () => {
    const layout = spiralLayout({ width: 128, height: 100 })
    const stack = spiralVoices(0.5, 4, 1)
    const radius = (tail: number, mix: number, v: number): number | undefined =>
      dots({ voices: 4, spread: 1, mix }, { glide: 0.5, tail }).find(
        ([x, y]) => x === layout.stair.x && Math.abs(y - spiralY(layout, stack[v].octaves)) < 1e-9,
      )?.[2]
    // 1.2 px and up to 2 more: by how far the voice is above 60 dB down.
    expect(radius(0.5, 1, 2)).toBeCloseTo(1.2 + 2 * spiralThickness(stack[2].level * 0.5), 9)
    expect(radius(0.5, 0.4, 1)).toBeCloseTo(
      1.2 + 2 * spiralThickness(stack[1].level * 0.5 * spiralWet(0.4)),
      9,
    )
    expect(radius(0.5, 1, 2) ?? 0).toBeGreaterThan(radius(0.5, 1, 1) ?? 9)
    expect(radius(0.05, 1, 2) ?? 9).toBeLessThan(radius(0.5, 1, 2) ?? 0)
    // Silence, or Mix 0, lights none: the voices are then small marks on the bell.
    expect(radius(0, 1, 2)).toBeUndefined()
    expect(radius(0.5, 0, 2)).toBeUndefined()
  })
})

describe('Spiral: the handles', () => {
  it('stands the Climb point on the line whose slope is Climb, twelve seconds along', () => {
    for (const size of SIZES) {
      const layout = spiralLayout(size)
      for (const climb of [-12, -3, 0, 2, 12]) {
        const point = handleOf('climb', { climb }, size)
        expect(point.x).toBeCloseTo(spiralX(layout, SPIRAL_CLIMB_AT), 9)
        // Twelve seconds at `climb` octaves a minute is a fifth of that in octaves.
        expect(point.y).toBeCloseTo(spiralY(layout, climb / 5), 9)
      }
    }
  })

  it('sets the Climb whose line passes under the hand, over its whole range', () => {
    for (const size of SIZES) {
      const layout = spiralLayout(size)
      for (const climb of [-12, -7.5, -1, 0, 0.5, 4, 12]) {
        const point = handleOf('climb', { climb: 3 }, size)
        const y = spiralY(layout, climb / 5)
        expect(point.drag(point.x + 9, y).climb).toBeCloseTo(climb, 9)
        // One drag is one value: the point for that value stands under the hand.
        expect(handleOf('climb', { climb }, size).y).toBeCloseTo(y, 9)
      }
      // Past the ends of the knob the hand is held to them.
      expect(handleOf('climb', {}, size).drag(0, -500).climb).toBe(12)
      expect(handleOf('climb', {}, size).drag(0, 900).climb).toBe(-12)
      // Room to set it by hand: the whole of Climb is at least 28 pixels of travel.
      const travel =
        handleOf('climb', { climb: -12 }, size).y - handleOf('climb', { climb: 12 }, size).y
      expect(travel).toBeGreaterThanOrEqual(28)
    }
    expect(handleOf('climb', { climb: -9 }).reset?.()).toEqual({ climb: 3 })
  })

  it('stands the Decay point at the tail end and sets the Decay that ends there', () => {
    for (const size of SIZES) {
      const layout = spiralLayout(size)
      const foot = layout.stair.y + layout.stair.h
      for (const decay of [0.5, 2, 8, 20, 24]) {
        const point = handleOf('decay', { decay }, size)
        expect(point.x).toBeCloseTo(spiralX(layout, decay), 9)
        expect(point.y).toBe(foot)
        expect(handleOf('decay', { decay: 5 }, size).drag(point.x, 3).decay).toBeCloseTo(decay, 9)
      }
      // The streaks have no thickness left where the point stands.
      const point = handleOf('decay', { decay: 8 }, size)
      const streaks = spiralStreaks(layout, {
        glide: 0,
        climb: 3,
        decay: 8,
        voices: 4,
        spread: 0.5,
        mix: 1,
      })
      for (const streak of streaks) {
        streak.upper.forEach(([x, y], n) => {
          if (x >= point.x) expect(streak.lower[n][1] - y).toBe(0)
        })
      }
      expect(layout.stair.w).toBeGreaterThanOrEqual(90)
    }
    expect(handleOf('decay', { decay: 30 }).reset?.()).toEqual({ decay: 8 })
  })

  it('waits at the right edge for a Decay longer than the staircase, and is moved from where it lies', () => {
    const layout = spiralLayout({ width: 128, height: 100 })
    const edge = layout.stair.x + layout.stair.w
    const perPixel = SPIRAL_SPAN / layout.stair.w
    const point = handleOf('decay', { decay: 40 })
    expect(point.x).toBe(edge)
    // Taken and not moved it stays at 40 s, with a hold and without.
    expect(point.drag(point.x, point.y).decay).toBeCloseTo(40, 9)
    const hold: DisplayHold = {}
    expect(point.drag(edge, point.y, hold).decay).toBeCloseTo(40, 9)
    // Ten pixels to the left is ten pixels of seconds less, at every move of
    // the same hand, though the plate asks for the handles again each time.
    const moved = handleOf('decay', { decay: 39 }).drag(edge - 10, point.y, hold).decay
    expect(moved).toBeCloseTo(40 - 10 * perPixel, 9)
    expect(handleOf('decay', { decay: moved }).drag(edge - 10, point.y, hold).decay).toBeCloseTo(
      moved,
      9,
    )
    // To the right it goes on to the top of the knob.
    expect(handleOf('decay', { decay: 39 }).drag(edge + 500, point.y, hold).decay).toBe(60)
    // A point inside the picture has nothing to remember: the hand's place is the time.
    const inside: DisplayHold = {}
    expect(handleOf('decay', { decay: 8 }).drag(spiralX(layout, 12), 0, inside).decay).toBeCloseTo(
      12,
      9,
    )
    expect(inside.past).toBe(0)
  })
})

describe('Spiral: the words', () => {
  it('says Climb with its sign and its unit, a real minus for sinking', () => {
    expect(climbText(3)).toBe('+3.0 oct/min')
    expect(climbText(-12)).toBe('−12.0 oct/min')
    expect(climbText(0)).toBe('0.0 oct/min')
    expect(climbText(-0.04)).toBe('0.0 oct/min')
  })

  it('writes it on a patch of the plate, clear of the streaks, at every size', () => {
    for (const size of SIZES) {
      const drawn = drawDisplay(display, params, {
        ...size,
        values: { climb: -6 },
        meters: { glide: 2, tail: 0.3 },
      })
      expect(drawn.words()).toEqual(['−6.0 oct/min'])
      const patch = patchUnder(drawn, '−6.0 oct/min', PLAIN_COLOURS.plate)
      expect(patch).not.toBeNull()
      expect((patch?.x ?? 0) + (patch?.w ?? 0)).toBeLessThanOrEqual(size.width - 3)
    }
  })
})
