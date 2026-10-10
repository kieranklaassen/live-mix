// The display of Spiral, the reverb whose tail climbs or sinks without ever
// arriving. It is the staircase itself: pitch runs upward over the six
// octaves the device's voices turn through, time runs to the right, and each
// voice of the tail is a streak that starts where the voice stands now (the
// device says where: its glide clock) and glides at Climb, as thick as it is
// loud: under the bell of level over pitch, which is drawn at the left with
// the voices on it, and fading as the tail does until Decay ends it. A streak
// that leaves the top comes back at the foot, six octaves down, and both ends
// have no thickness: that is why the ear hears no step.
//
// Every figure is the device's own: the constants and formulas are those of
// `cpp/devices/spiral/spiral.h`, copied here.

import {
  INK,
  clamp,
  dot,
  fillBetween,
  gainToDb,
  ground,
  handle,
  label,
  rule,
  trace,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayHandle,
  type DisplayHold,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

/** `kStack`: the voices on the glide clock, an octave apart; the clock wraps every so many octaves. */
export const SPIRAL_STACK = 6
/** `kNarrowPower` and `kWidePower`: the bell is sin(pi x)^(2q), q from 4 at Spread 0 to 0.5 at Spread 1. */
const NARROW_POWER = 4
const WIDE_POWER = 0.5
/** Seconds across the staircase. */
export const SPIRAL_SPAN = 24
/** Where the Climb point stands across it, in seconds. */
export const SPIRAL_CLIMB_AT = 12
/** A streak is as thin as nothing when it is this far down: the 60 dB that Decay counts. */
const FOOT_DB = -60
/** `kCentre`: a Climb nearer its centre than this is the centre, where the clock goes home and rests. */
export const SPIRAL_CENTRE = 0.05
/** `kHomeRate`: the octaves a minute the clock goes home at. */
const HOME_RATE = 12
/** The Climb point catches at the centre: a hand this near it (octaves a minute) sets the centre. */
export const SPIRAL_CATCH = 0.25

/**
 * Where the glide clock stands `seconds` on from `glide` (`moved()` of the
 * device): on at Climb octaves a minute, or, with Climb at its centre, to the
 * nearest whole octave at twelve octaves a minute, where it rests.
 */
export function spiralClock(glide: number, climb: number, seconds: number): number {
  if (!(climb > -SPIRAL_CENTRE && climb < SPIRAL_CENTRE)) return glide + (climb / 60) * seconds
  const whole = Math.floor(glide)
  const over = glide - whole
  if (over === 0) return glide
  const reach = (HOME_RATE / 60) * seconds
  return over >= 0.5 ? Math.min(glide + reach, whole + 1) : Math.max(glide - reach, whole)
}

/** The bell of `control()`: the level of a voice at the share `x` of the octaves that sound, before it is scaled. */
export function spiralBell(x: number, spread: number): number {
  if (!(x > 0 && x < 1)) return 0
  const power = 2 * NARROW_POWER * Math.pow(WIDE_POWER / NARROW_POWER, clamp(spread, 0, 1))
  return Math.pow(Math.sin(Math.PI * x), power)
}

/** The lowest octave that sounds, from the played pitch: `voices` octaves from ceil(voices / 2) below it. */
export function spiralLowest(voices: number): number {
  return -Math.ceil(spiralCount(voices) / 2)
}

/** Voices as the device reads it: a whole number from 2 to 6. */
export function spiralCount(voices: number): number {
  return clamp(Math.round(voices), 2, SPIRAL_STACK)
}

export interface SpiralVoice {
  /** How far the voice plays from the played pitch, in octaves: -3 up to 3. */
  octaves: number
  /** Its level, the six scaled so that their squares add to one. */
  level: number
}

/**
 * The six voices at glide position `glide` (octaves): voice v stands at
 * u = (glide + v) mod 6 and plays 2^(u - 3) times the pitch, under the bell
 * over the octaves that sound, divided by the root of the sum of the squares.
 */
export function spiralVoices(glide: number, voices: number, spread: number): SpiralVoice[] {
  const count = spiralCount(voices)
  const lowest = spiralLowest(voices)
  const stack: SpiralVoice[] = []
  let total = 0
  for (let v = 0; v < SPIRAL_STACK; v++) {
    const u = (((glide + v) % SPIRAL_STACK) + SPIRAL_STACK) % SPIRAL_STACK
    const octaves = u - SPIRAL_STACK / 2
    const level = spiralBell((octaves - lowest) / count, spread)
    stack.push({ octaves, level })
    total += level * level
  }
  const norm = total > 1e-12 ? 1 / Math.sqrt(total) : 0
  for (const voice of stack) voice.level *= norm
  return stack
}

/** `kit::equal_power`: what Mix lets out of the wet path. */
export const spiralWet = (mix: number): number => Math.sin((Math.PI / 2) * clamp(mix, 0, 1))

/** The tail of a sound `seconds` old against the sound: 60 dB down at Decay (`kit::rt60_gain`). */
export const spiralFall = (seconds: number, decay: number): number =>
  Math.pow(10, (-3 * Math.max(0, seconds)) / Math.max(decay, 1e-3))

/** How much of its full thickness a level is drawn at: all of it at full level, none 60 dB down. */
export const spiralThickness = (level: number): number => clamp(1 - gainToDb(level) / FOOT_DB, 0, 1)

// --- Where things stand -----------------------------------------------------

export interface SpiralLayout {
  /** The bell, at the left: level across, pitch upward. */
  bell: Box
  /** The staircase: time across, pitch upward on the same scale. */
  stair: Box
  /** Pixels to the octave. */
  octave: number
  /** Half the thickness of a streak at full level. */
  thick: number
}

export function spiralLayout(view: Pick<DisplayView, 'width' | 'height'>): SpiralLayout {
  const all: Box = { x: 4, y: 5, w: view.width - 8, h: view.height - 10 }
  const wide = clamp(Math.round(all.w * 0.18), 18, 36)
  const octave = all.h / SPIRAL_STACK
  return {
    bell: { x: all.x, y: all.y, w: wide, h: all.h },
    stair: { x: all.x + wide + 6, y: all.y, w: all.w - wide - 6, h: all.h },
    octave,
    thick: clamp(0.3 * octave, 1, 3),
  }
}

/** Where a pitch stands, in octaves from the played one: three up is the top. */
export const spiralY = (layout: SpiralLayout, octaves: number): number =>
  layout.stair.y + (SPIRAL_STACK / 2 - octaves) * layout.octave

/** Where a time stands; past the span it stands on the right edge. */
export const spiralX = (layout: SpiralLayout, seconds: number): number =>
  layout.stair.x + clamp(seconds / SPIRAL_SPAN, 0, 1) * layout.stair.w

export interface SpiralSettings {
  /** Where the glide clock stands, in octaves. */
  glide: number
  climb: number
  decay: number
  voices: number
  spread: number
  mix: number
}

const settingsOf = (view: DisplayView, glide: number): SpiralSettings => ({
  glide,
  climb: view.value('climb'),
  decay: view.value('decay'),
  voices: view.value('voices'),
  spread: view.value('spread'),
  mix: view.value('mix'),
})

/**
 * How loud voice `v` of a sound played now is `seconds` later, as it is
 * heard: the clock has moved on by Climb (or gone home, at its centre), the
 * bell is read where the voice has got to, the tail has fallen with Decay
 * and Mix lets so much out.
 */
export function spiralHeard(settings: SpiralSettings, v: number, seconds: number): SpiralVoice {
  const stack = spiralVoices(
    spiralClock(settings.glide, settings.climb, seconds),
    settings.voices,
    settings.spread,
  )
  const voice = stack[v]
  return {
    octaves: voice.octaves,
    level: voice.level * spiralFall(seconds, settings.decay) * spiralWet(settings.mix),
  }
}

export interface SpiralStreak {
  upper: Point[]
  lower: Point[]
}

/**
 * The streaks: each voice from now to the right edge, a column every two
 * pixels, as thick as `spiralHeard` says. A voice that wraps ends its streak
 * at the top (or the foot) and begins another six octaves away.
 */
export function spiralStreaks(layout: SpiralLayout, settings: SpiralSettings): SpiralStreak[] {
  const { stair } = layout
  const streaks: SpiralStreak[] = []
  for (let v = 0; v < SPIRAL_STACK; v++) {
    let streak: SpiralStreak | null = null
    let before = 0
    for (let x = 0; x <= stair.w; x += 2) {
      const heard = spiralHeard(settings, v, (x / stair.w) * SPIRAL_SPAN)
      if (!streak || Math.abs(heard.octaves - before) > SPIRAL_STACK / 2) {
        streak = { upper: [], lower: [] }
        streaks.push(streak)
      }
      before = heard.octaves
      const y = spiralY(layout, heard.octaves)
      const half = layout.thick * spiralThickness(heard.level)
      streak.upper.push([stair.x + x, y - half])
      streak.lower.push([stair.x + x, y + half])
    }
  }
  return streaks
}

// --- The handles ------------------------------------------------------------

/** Octaves the Climb point rises for each octave a minute: it stands 12 seconds along its line. */
const CLIMB_RISE = SPIRAL_CLIMB_AT / 60

function spiralHandles(view: DisplayView): DisplayHandle[] {
  const layout = spiralLayout(view)
  const { stair } = layout
  const climb = view.value('climb')
  const decay = view.value('decay')
  const climbSpec = view.spec('climb')
  const decaySpec = view.spec('decay')
  const secondsAt = (x: number): number => ((x - stair.x) / stair.w) * SPIRAL_SPAN
  return [
    {
      key: 'climb',
      name: 'Climb',
      x: spiralX(layout, SPIRAL_CLIMB_AT),
      y: spiralY(layout, climb * CLIMB_RISE),
      // The slope of the line through the point: so many octaves in twelve
      // seconds. It catches at the centre, where the tail comes to rest.
      drag: (_x, y) => {
        const slope = (SPIRAL_STACK / 2 - (y - stair.y) / layout.octave) / CLIMB_RISE
        return {
          climb:
            Math.abs(slope) < SPIRAL_CATCH
              ? 0
              : clamp(slope, climbSpec?.min ?? -12, climbSpec?.max ?? 12),
        }
      },
      reset: () => ({ climb: climbSpec?.default ?? climb }),
    },
    {
      key: 'decay',
      name: 'Decay',
      x: spiralX(layout, decay),
      y: stair.y + stair.h,
      // The tail's end. A Decay longer than the staircase waits on its right
      // edge: it is taken there and moves from where it lies, as far past
      // the edge as it lay at the press (kept in the hold).
      drag: (x, _y, hold?: DisplayHold) => {
        const kept = hold ?? {}
        kept.past ??= Math.max(0, decay - SPIRAL_SPAN)
        return {
          decay: clamp(secondsAt(x) + kept.past, decaySpec?.min ?? 0.5, decaySpec?.max ?? 60),
        }
      },
      reset: () => ({ decay: decaySpec?.default ?? decay }),
    },
  ]
}

// --- The display ------------------------------------------------------------

/** Climb as it is said, with a real minus. */
export function climbText(climb: number): string {
  const rounded = Math.round(climb * 10) / 10
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : ''
  return `${sign}${Math.abs(rounded).toFixed(1)} oct/min`
}

const spiral = plateDisplay({
  place: 'window',
  columns: 2,
  params: ['climb', 'decay', 'voices', 'spread', 'mix'],
  live: { meters: true, signal: true },
  info: 'Pitch runs upward and time to the right. Each streak is one voice of the tail gliding at Climb, as thick as it is loud, under the bell of level drawn at the left; the dots are the voices now. Drag the point on the dashed line for Climb, which catches at its centre, and the one at the foot for Decay.',
  draw(frame) {
    const { ctx, colours } = frame
    ground(frame)
    const layout = spiralLayout(frame)
    const { bell, stair } = layout
    // Where the device's clock stands; a device that does not say stands at the start.
    const glide = frame.hasMeter('glide') ? frame.meter('glide') : 0
    const settings = settingsOf(frame, Number.isFinite(glide) ? glide : 0)
    const foot = stair.y + stair.h

    // The octaves, across both panels; the played pitch a little stronger.
    for (let octaves = -SPIRAL_STACK / 2 + 1; octaves < SPIRAL_STACK / 2; octaves++) {
      const y = spiralY(layout, octaves)
      rule(ctx, bell.x, y, stair.x + stair.w, y, {
        colour: colours.ink,
        alpha: octaves === 0 ? INK.rule : INK.grid,
      })
    }

    // The bell: the level a voice has at each pitch, with the six scaled as the device scales them.
    const now = spiralVoices(settings.glide, settings.voices, settings.spread)
    const count = spiralCount(settings.voices)
    const lowest = spiralLowest(settings.voices)
    let total = 0
    for (const voice of now)
      total += spiralBell((voice.octaves - lowest) / count, settings.spread) ** 2
    const norm = total > 1e-12 ? 1 / Math.sqrt(total) : 0
    const curve: Point[] = []
    const steps = Math.max(8, Math.round(count * layout.octave))
    for (let n = 0; n <= steps; n++) {
      const x = n / steps
      curve.push([
        bell.x + spiralBell(x, settings.spread) * norm * bell.w,
        spiralY(layout, lowest + x * count),
      ])
    }
    fillBetween(
      ctx,
      curve,
      [
        [bell.x, curve[0][1]],
        [bell.x, curve[curve.length - 1][1]],
      ],
      colours.ink,
      INK.fill,
    )
    trace(ctx, curve, { colour: colours.ink, width: 1.2 })
    rule(ctx, bell.x, bell.y, bell.x, bell.y + bell.h, { colour: colours.ink, alpha: INK.rule })

    // The staircase: what a sound played now will be, as far as Mix lets it be heard.
    for (const streak of spiralStreaks(layout, settings)) {
      fillBetween(ctx, streak.upper, streak.lower, colours.ink, 0.92)
    }

    // The tail's end, and the line whose slope is Climb.
    const points = spiralHandles(frame)
    const [climbPoint, decayPoint] = points
    if (settings.decay <= SPIRAL_SPAN) {
      rule(ctx, decayPoint.x, stair.y, decayPoint.x, foot, {
        colour: colours.ink,
        alpha: INK.back,
        dash: [2, 2],
      })
    }
    trace(
      ctx,
      [
        [stair.x, spiralY(layout, 0)],
        [climbPoint.x, climbPoint.y],
      ],
      { colour: colours.ink, alpha: INK.text, width: 1, dash: [3, 2] },
    )

    // The voices now: a tick on the bell and a dot where each streak starts, lit by the tail's level.
    const live = frame.powered && frame.hasMeter('tail')
    const tail = live ? Math.max(0, frame.meter('tail')) * spiralWet(settings.mix) : 0
    for (const voice of now) {
      if (voice.level <= 0) continue
      const y = spiralY(layout, voice.octaves)
      rule(ctx, bell.x, y, bell.x + voice.level * bell.w, y, {
        colour: colours.ink,
        alpha: INK.text,
      })
      const lit = Number.isFinite(tail) ? spiralThickness(voice.level * tail) : 0
      if (lit > 0) dot(ctx, stair.x, y, 1.2 + 2 * lit, colours.accent, { ring: colours.ink })
      else dot(ctx, bell.x + voice.level * bell.w, y, 1.2, colours.ink)
    }

    label(frame, climbText(settings.climb), stair.x + stair.w - 2, stair.y + 8, 'right')
    for (const point of points) handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: spiralHandles,
})

export const SPIRAL_FACES: Readonly<Record<string, PlateFace>> = {
  spiral: {
    display: spiral,
    face: ['climb', 'decay', 'voices', 'mix'],
  },
}
