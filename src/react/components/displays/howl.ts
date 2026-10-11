// The display of Howl: the loop's own picture of where it can sing.
//
// Across is frequency, 25 Hz to 6.4 kHz; up is how fast a tone at each
// frequency grows or dies as it goes round the loop, on the Gain knob's own
// scale: the line across the middle is where a turn round the loop gives back
// what went in, the top is growing 240 dB a second and the foot dying as
// fast. The posts are the only places the loop can sing, the whole multiples
// of 1 / Distance, each as high as its rate: Gain's rate for the one the body
// passes best, and less for the others by what the body takes off them a
// turn. The curve joins their tops. Posts over the line grow, and the level
// hold leaves the tallest singing. Behind
// them is the spectrum of what comes out, and in the accent the tone each
// side sings now, as loud as it is heard, with Edge's harmonics beside it.
//
// Everything drawn is the device's own maths (`cpp/devices/howl/howl.h`); the
// constants copied from there say so.

import {
  INK,
  clamp,
  clipped,
  dot,
  fillRect,
  fillTo,
  follow,
  gainToDb,
  ground,
  handle,
  hzOfX,
  hzText,
  label,
  lerp,
  rule,
  spectrum,
  text,
  trace,
  xOfHz,
  yOfDb,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

// --- The device's numbers ---------------------------------------------------

/** Gain 1 is this rate of growth in dB a second, and Gain 0 this rate of dying: `kRateMax`. */
export const HOWL_RATE_MAX = 240
/** How fine the Gain knob is near the middle: `kRateCurve`. */
export const HOWL_RATE_CURVE = 3.5
/** The loop's gain is never more than this a turn, in dB: `kTripMaxDb`. */
export const HOWL_TRIP_MAX_DB = 6
/** Where the body's centre may stand, wherever Move and Width send it: `kCentreMinHz`, `kCentreMaxHz`. */
export const HOWL_CENTRE_MIN_HZ = 80
export const HOWL_CENTRE_MAX_HZ = 3000
/** And never under this many times rate / (period - 2), so the body's taps fit the loop: `kCentreOverNote`. */
export const HOWL_CENTRE_OVER_NOTE = 1.125
/** The tilt: two one-pole low passes at this many times the centre: `kTiltRatio`. */
export const HOWL_TILT_RATIO = 3
/** Move 1 wanders this many octaves either way: `kMoveOctaves`. */
export const HOWL_MOVE_OCTAVES = 1
/** Width 1 sets each side this many octaves from Body, one down and one up: `kWidthOctaves`. */
export const HOWL_WIDTH_OCTAVES = 0.25
/** Follow 1 turns the howl down this far under a new note, in dB: `kDuckDb`. */
export const HOWL_DUCK_DB = 24
/** Edge 1 adds the third, fifth and seventh harmonics at these shares of the tone: `harmonics` in `howl.h`. */
export const HOWL_EDGE_HARMONICS: readonly (readonly [number, number])[] = [
  [3, 1 / 3],
  [5, 1 / 5],
  [7, 1 / 7],
]

/**
 * How fast the overtone the body passes best grows, in dB a second, for a
 * Gain setting: `rate_of`. Nothing at the middle, the knob's two halves alike.
 */
export function howlRate(gain: number): number {
  const u = 2 * clamp(gain, 0, 1) - 1
  const size =
    (HOWL_RATE_MAX * (Math.exp(HOWL_RATE_CURVE * Math.abs(u)) - 1)) /
    (Math.exp(HOWL_RATE_CURVE) - 1)
  return u < 0 ? -size : size
}

/** Where a rate stands on the Gain knob: 0 at the foot, 1 at the top, past either end beyond them. */
export function howlKnobOf(rate: number): number {
  const u =
    Math.log(1 + (Math.abs(rate) * (Math.exp(HOWL_RATE_CURVE) - 1)) / HOWL_RATE_MAX) /
    HOWL_RATE_CURVE
  return 0.5 + 0.5 * (rate < 0 ? -u : u)
}

/** The frequency the loop is tuned by, in Hz: the whole multiples of it are where it can sing. */
export const howlFundamentalHz = (distanceMs: number): number => 1000 / distanceMs

/**
 * The rate Gain gives in a loop as long as Distance: `trip_db` over the
 * loop's length. A long loop cannot have all of the top of the knob.
 */
export const howlLoopRate = (gain: number, distanceMs: number): number =>
  Math.min(howlRate(gain), (HOWL_TRIP_MAX_DB * 1000) / distanceMs)

/** The pole of each of the tilt's low passes: `tilt_pole`. */
const tiltPole = (centreHz: number, sampleRate: number): number =>
  Math.exp((-2 * Math.PI * Math.min(HOWL_TILT_RATIO * centreHz, 0.45 * sampleRate)) / sampleRate)

/**
 * What the body and the tilt pass of a frequency, with the body's centre at
 * `centreHz`: `shape` in `howl.h`. sin^4(pi hz / 2 centre), a band pass that
 * turns no phase, times two one-pole low passes at three times the centre.
 */
export function howlShape(hz: number, centreHz: number, sampleRate: number): number {
  const w = (2 * Math.PI * hz) / sampleRate
  const a = tiltPole(centreHz, sampleRate)
  const s = Math.sin((0.5 * Math.PI * hz) / centreHz)
  return (s * s * s * s * (1 - a) * (1 - a)) / (1 - 2 * a * Math.cos(w) + a * a)
}

/** Where a body asked to stand at `hz` stands in a loop tuned to `fundamentalHz`: `centre_in`. */
export function howlCentreIn(hz: number, fundamentalHz: number, sampleRate: number): number {
  const least = (HOWL_CENTRE_OVER_NOTE * sampleRate) / (sampleRate / fundamentalHz - 2)
  return clamp(Math.max(hz, least), HOWL_CENTRE_MIN_HZ, HOWL_CENTRE_MAX_HZ)
}

/**
 * Where one side's body is asked to stand, in Hz: Body, moved by Width (the
 * left side down, the right side up) and by the wander (`drift`, -1..1,
 * times Move): `tune` in `howl.h`.
 */
export function howlCentreHz(
  bodyHz: number,
  move: number,
  width: number,
  side: 0 | 1,
  drift: number,
): number {
  const octaves =
    Math.log2(bodyHz) +
    move * HOWL_MOVE_OCTAVES * drift +
    (side === 1 ? width : -width) * HOWL_WIDTH_OCTAVES
  return clamp(Math.pow(2, octaves), HOWL_CENTRE_MIN_HZ, HOWL_CENTRE_MAX_HZ)
}

/** The best overtone is looked for this many overtones either way at the most: `kBestWalk`. */
export const HOWL_BEST_WALK = 8

/**
 * The overtone the loop sings when it starts from nothing: the whole multiple
 * of the fundamental the body passes best (`best_overtone`: walked to from
 * the one under the centre, down and then up, while the next is passed more).
 */
export function howlOvertone(centreHz: number, fundamentalHz: number, sampleRate: number): number {
  const most = clamp(Math.floor((0.45 * sampleRate) / fundamentalHz), 1, 8192)
  let best = clamp(Math.floor(centreHz / fundamentalHz), 1, most)
  let passed = howlShape(best * fundamentalHz, centreHz, sampleRate)
  for (const step of [-1, 1]) {
    for (let walked = 0; walked < HOWL_BEST_WALK; walked++) {
      const k = best + step
      if (k < 1 || k > most) break
      const here = howlShape(k * fundamentalHz, centreHz, sampleRate)
      if (here <= passed) break
      passed = here
      best = k
    }
  }
  return best
}

/**
 * How fast a tone at `hz` grows or dies as it goes round one side's loop, in
 * dB a second: Gain's rate for the overtone the body passes best (`tune` sets
 * the loop's gain so), and for any other frequency less by what the body
 * passes less of it a turn, over the length of the turn.
 */
export function howlRateAt(
  hz: number,
  centreHz: number,
  gain: number,
  distanceMs: number,
  sampleRate: number,
): number {
  const fundamental = howlFundamentalHz(distanceMs)
  const best = howlOvertone(centreHz, fundamental, sampleRate) * fundamental
  const less = gainToDb(howlShape(hz, centreHz, sampleRate) / howlShape(best, centreHz, sampleRate))
  return howlLoopRate(gain, distanceMs) + (less * 1000) / distanceMs
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

/** The note nearest a frequency, as it is said: "C3", "F#4". */
export function howlNote(hz: number): string {
  const midi = Math.round(69 + 12 * Math.log2(hz / 440))
  return `${NOTES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`
}

/**
 * A side is said to sing a note once its pitch reading is this near a whole
 * multiple of the fundamental, in cents. (The reading is of the loop's tone
 * by itself and stands within a few cents of it; while the tone is handed
 * from one overtone to the next it passes between them.)
 */
export const HOWL_SETTLED_CENTS = 15

/**
 * The overtone a side has settled on, or 0 while it is between two: as the
 * body moves from one overtone to the next both sound for a moment and the
 * pitch reading passes between them, which is no note of the loop's.
 */
export function howlSettled(pitchHz: number, fundamentalHz: number): number {
  const overtone = Math.round(pitchHz / fundamentalHz)
  if (overtone < 1) return 0
  const cents = 1200 * Math.log2(pitchHz / (overtone * fundamentalHz))
  return Math.abs(cents) <= HOWL_SETTLED_CENTS ? overtone : 0
}

// --- The picture ------------------------------------------------------------

/** The frequency scale: from under the lowest fundamental to over the seventh harmonic of most howls. */
export const HOWL_MIN_HZ = 25
export const HOWL_MAX_HZ = 6400
/** The scale the sound is drawn on, the spectrum and the singing tones: full scale at the top, this at the foot. */
export const HOWL_SOUND_FOOT_DB = -72
/** Posts closer than this many pixels are drawn as one fill under the curve. */
export const HOWL_POSTS_APART = 3

export interface HowlBoxes {
  /** Where the curve, the posts and the sound are drawn. */
  plot: Box
  /** The level of the rail under it that carries Distance. */
  rail: number
  /** Where a turn round the loop gives back what went in: the middle of the Gain knob. */
  zero: number
}

export function howlBoxes(view: Pick<DisplayView, 'width' | 'height'>): HowlBoxes {
  const plot: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 17 }
  return {
    plot,
    rail: Math.floor(view.height) - 7.5,
    zero: howlYOfRate(0, plot),
  }
}

/**
 * The foot of the rate scale stands this far over the foot of the plot, so a
 * post that dies as fast as the scale goes still shows where it is, and the
 * point on the curve at Gain 0 stands clear of the one on the rail.
 */
export const HOWL_FOOT_ROOM = 3

/** Where a rate stands in the plot: the Gain knob's travel is the plot's height less the room at its foot. */
export const howlYOfRate = (rate: number, plot: Box): number =>
  plot.y + (plot.h - HOWL_FOOT_ROOM) * (1 - clamp(howlKnobOf(rate), 0, 1))

/** The Gain setting a height in the plot stands for. */
export const howlGainAtY = (y: number, plot: Box): number =>
  clamp(1 - (y - plot.y) / (plot.h - HOWL_FOOT_ROOM), 0, 1)

/** A rate as it is said: "+79 dB/s". */
export const howlRateText = (rate: number): string => {
  const size = Math.abs(rate)
  const said = size >= 9.95 ? size.toFixed(0) : size.toFixed(1)
  return `${rate < 0 ? '\u2212' : '+'}${said} dB/s`
}

const xOf = (hz: number, plot: Box): number => xOfHz(hz, plot, HOWL_MIN_HZ, HOWL_MAX_HZ)
const hzAt = (x: number, plot: Box): number => hzOfX(x, plot, HOWL_MIN_HZ, HOWL_MAX_HZ)

/** How much of the feedback Mix lets through: the equal-power wet gain of `process`. */
export const howlHeard = (mix: number): number => Math.sin((clamp(mix, 0, 1) * Math.PI) / 2)

/** The overtones that stand apart as posts: every whole multiple up to where they crowd or leave the scale. */
export function howlPosts(fundamentalHz: number, plot: Box): number[] {
  const posts: number[] = []
  for (let k = 1; k * fundamentalHz <= HOWL_MAX_HZ; k++) {
    const hz = k * fundamentalHz
    if (hz < HOWL_MIN_HZ) continue
    if (k > 1 && xOf(hz, plot) - xOf(hz - fundamentalHz, plot) < HOWL_POSTS_APART) break
    posts.push(k)
  }
  return posts
}

function howlHandles(view: DisplayView): DisplayHandle[] {
  const { plot, rail } = howlBoxes(view)
  const body = view.spec('body')
  const distance = view.spec('distance')
  return [
    {
      // Across is where the body stands, up and down is Gain: the rate its best overtone goes at.
      key: 'body',
      name: 'Body and gain',
      x: xOf(view.value('body'), plot),
      y: howlYOfRate(howlRate(view.value('gain')), plot),
      drag: (x, y) => ({
        body: clamp(hzAt(x, plot), body?.min ?? 120, body?.max ?? 2400),
        gain: howlGainAtY(y, plot),
      }),
      reset: () => ({
        body: body?.default ?? view.value('body'),
        gain: view.spec('gain')?.default ?? view.value('gain'),
      }),
    },
    {
      // The first post, on the rail: the note the loop is tuned by.
      key: 'distance',
      name: 'Distance',
      x: xOf(howlFundamentalHz(view.value('distance')), plot),
      y: rail,
      drag: (x) => ({
        distance: clamp(1000 / hzAt(x, plot), distance?.min ?? 1, distance?.max ?? 40),
      }),
      reset: () => ({ distance: distance?.default ?? view.value('distance') }),
    },
  ]
}

interface HowlState {
  /** How loud each side's tone is heard, eased between two readings. */
  heard: [number, number]
}

/** One side's reading of where its body stands, or where the knobs put it while nothing runs. */
function centreOf(frame: DisplayFrame, running: boolean, side: 0 | 1): number {
  const reading = running ? frame.meter(side === 1 ? 'centreRight' : 'centre') : 0
  return reading > 0
    ? clamp(reading, HOWL_CENTRE_MIN_HZ, HOWL_CENTRE_MAX_HZ)
    : howlCentreIn(
        howlCentreHz(frame.value('body'), frame.value('move'), frame.value('width'), side, 0),
        howlFundamentalHz(frame.value('distance')),
        frame.sampleRate,
      )
}

/** A tone under this is not drawn: the foot of the sound's scale. */
const HOWL_HEARD_LEAST = Math.pow(10, HOWL_SOUND_FOOT_DB / 20)

interface Tone {
  side: 0 | 1
  /** The frequency the side sings at, Hz; 0 while it holds nothing. */
  pitch: number
  /** How loud it is heard, as a share of full scale. */
  level: number
}

const sings = (tone: Tone): boolean =>
  tone.pitch >= HOWL_MIN_HZ && tone.pitch <= HOWL_MAX_HZ && tone.level >= HOWL_HEARD_LEAST

/** What is left of the howl while a new note has turned it down: `ducked` of Follow's 24 dB. */
export const howlDucked = (ducked: number): number =>
  Math.pow(10, (-HOWL_DUCK_DB * clamp(ducked, 0, 1)) / 20)

/** How much of a harmonic at `hz` Edge adds: all of it under 0.4 of the rate, none past 0.45. */
export const howlEdgeShare = (hz: number, sampleRate: number): number =>
  clamp((0.45 * sampleRate - hz) / (0.05 * sampleRate), 0, 1)

/**
 * The tone each side sings now, in the accent: a line at its frequency as
 * high as it is heard (the tone's size, less what a new note has turned it
 * down, times what Mix lets through, on the spectrum's scale), and beside it
 * Edge's harmonics at their shares of it.
 * The right side's is drawn behind and finer, and not at all where both
 * sides sing one tone.
 */
function drawSinging(
  frame: DisplayFrame<HowlState>,
  plot: Box,
  running: boolean,
  heard: number,
): readonly [Tone, Tone] {
  const { ctx, colours, state } = frame
  const foot = plot.y + plot.h
  const sound = (gain: number): number =>
    clamp(yOfDb(gainToDb(gain), plot, 0, HOWL_SOUND_FOOT_DB), plot.y, foot)
  const edge = clamp(frame.value('edge'), 0, 1)
  const toneOf = (side: 0 | 1): Tone => {
    const pitch = running ? frame.meter(side === 1 ? 'pitchRight' : 'pitch') : 0
    const reading =
      pitch >= HOWL_MIN_HZ ? Math.max(0, frame.meter(side === 1 ? 'levelRight' : 'level')) : 0
    state.heard[side] = running
      ? follow(state.heard[side], reading * heard, frame.dt, 0.05, 0.15)
      : 0
    return { side, pitch, level: state.heard[side] }
  }
  const left = toneOf(0)
  const right = toneOf(1)
  const one = sings(left) && Math.abs(xOf(left.pitch, plot) - xOf(right.pitch, plot)) < 1
  for (const tone of [right, left]) {
    if (!sings(tone) || (tone.side === 1 && one)) continue
    const x = xOf(tone.pitch, plot)
    for (const [harmonic, share] of HOWL_EDGE_HARMONICS) {
      const hz = harmonic * tone.pitch
      const top = sound(tone.level * edge * share * howlEdgeShare(hz, frame.sampleRate))
      if (hz > HOWL_MAX_HZ || top > foot - 1) continue
      trace(
        ctx,
        [
          [xOf(hz, plot), foot],
          [xOf(hz, plot), top],
        ],
        {
          colour: colours.accent,
          width: 1,
          alpha: INK.text,
        },
      )
    }
    const top = sound(tone.level)
    trace(
      ctx,
      [
        [x, foot],
        [x, top],
      ],
      { colour: colours.accent, width: tone.side === 0 ? 2 : 1 },
    )
    dot(ctx, x, top, tone.side === 0 ? 2.75 : 1.75, colours.accent, {
      ring: tone.side === 0 ? colours.ink : undefined,
    })
  }
  return [left, right]
}

/**
 * The words: what the point in hand is set to, or else the notes that sing
 * (the overtone each side has settled on); and on the rail the note Distance tunes.
 */
function drawWords(
  frame: DisplayFrame<HowlState>,
  plot: Box,
  body: DisplayHandle,
  tones: readonly [Tone, Tone],
): void {
  const distance = frame.value('distance')
  const fundamental = howlFundamentalHz(distance)
  text(frame, howlNote(fundamental), plot.x + plot.w, Math.floor(frame.height) - 4, {
    align: 'right',
  })
  let words = ''
  if (frame.hot === 'body')
    words = `${hzText(frame.value('body'))}  ${howlRateText(howlLoopRate(frame.value('gain'), distance))}`
  else if (frame.hot === 'distance')
    words = `${distance.toFixed(distance < 10 ? 1 : 0)} ms  ${hzText(fundamental)}`
  else {
    const notes = tones
      .filter(sings)
      .map((tone) => howlSettled(tone.pitch, fundamental))
      .filter((overtone) => overtone > 0)
      .map((overtone) => howlNote(overtone * fundamental))
    words = [...new Set(notes)].join(' ')
  }
  if (!words) return
  // At the head of the plot, or at its foot when the point on the curve is up there itself.
  const wide = words.length * 5 + 8
  const high = body.x < plot.x + wide && body.y < plot.y + 16
  label(frame, words, plot.x + 2, high ? plot.y + plot.h - 3 : plot.y + 8)
}

const howl = plateDisplay<HowlState>({
  place: 'window',
  columns: 2,
  params: ['gain', 'distance', 'body', 'move', 'width', 'mix'],
  live: { meters: true, spectrum: true },
  info: 'The posts are the overtones the loop can sing, each as high as it grows or dies fast: those over the line grow and the tallest sings. In the second colour, the tone singing now over the spectrum. Drag the point on the curve for Body and Gain, the point on the rail for Distance.',
  init: () => ({ heard: [0, 0] }),
  draw(frame) {
    const { ctx, colours, sampleRate } = frame
    ground(frame)
    const { plot, rail, zero } = howlBoxes(frame)
    const foot = plot.y + plot.h
    const level = (rate: number): number => howlYOfRate(rate, plot)
    const running = frame.signal !== null && frame.powered
    const gain = frame.value('gain')
    const distance = frame.value('distance')
    const fundamental = howlFundamentalHz(distance)
    // What is heard of the howl: what Mix lets through, less what a new note has turned it down.
    const heard = howlHeard(frame.value('mix')) * howlDucked(running ? frame.meter('ducked') : 0)
    const centres: [number, number] = [centreOf(frame, running, 0), centreOf(frame, running, 1)]
    const apart = Math.abs(Math.log2(centres[1] / centres[0])) > 0.01
    // `howlRateAt`, with what the best overtone is passed worked out once a side.
    const loop = howlLoopRate(gain, distance)
    const passed = centres.map((centre) =>
      howlShape(howlOvertone(centre, fundamental, sampleRate) * fundamental, centre, sampleRate),
    )
    const loopAt = (hz: number, side: 0 | 1): number =>
      loop + gainToDb(howlShape(hz, centres[side], sampleRate) / passed[side]) * fundamental
    const most = (hz: number): number => Math.max(loopAt(hz, 0), apart ? loopAt(hz, 1) : -Infinity)

    // The scale: 100 Hz and 1 kHz, and the line where a turn round the loop gives back what went in.
    for (const hz of [100, 1000])
      rule(ctx, xOf(hz, plot), plot.y, xOf(hz, plot), foot, {
        colour: colours.ink,
        alpha: INK.grid,
      })
    rule(ctx, plot.x, zero, plot.x + plot.w, zero, { colour: colours.ink, alpha: INK.rule })

    // How far the bodies may wander: from the left one at its lowest to the right one at its highest.
    const from = xOf(
      howlCentreHz(frame.value('body'), frame.value('move'), frame.value('width'), 0, -1),
      plot,
    )
    const to = xOf(
      howlCentreHz(frame.value('body'), frame.value('move'), frame.value('width'), 1, 1),
      plot,
    )
    if (to - from >= 1)
      fillRect(ctx, { x: from, y: plot.y, w: to - from, h: plot.h }, colours.ink, INK.ground)

    clipped(ctx, plot, () => {
      spectrum(frame, plot, {
        topDb: 0,
        bottomDb: HOWL_SOUND_FOOT_DB,
        alpha: 0.35,
        minHz: HOWL_MIN_HZ,
        maxHz: HOWL_MAX_HZ,
      })

      // The posts: each whole multiple of the fundamental, as high as the
      // rate it goes round at; the part over the line is what sings, drawn
      // as strongly as it is heard.
      const posts = howlPosts(fundamental, plot)
      for (const k of posts) {
        const x = xOf(k * fundamental, plot)
        const rate = most(k * fundamental)
        rule(ctx, x, foot, x, level(rate), { colour: colours.ink, alpha: INK.back })
        // Two pixels wide over the one the post stands on, on whole pixels.
        if (rate > 0)
          rule(ctx, Math.round(x), zero, Math.round(x), level(rate), {
            colour: colours.ink,
            width: 2,
            alpha: lerp(INK.back, INK.trace, heard),
          })
      }
      // Past the last post they stand too close to tell apart: a fill under their tops.
      const last = posts.length > 0 ? posts[posts.length - 1] : 0
      if ((last + 1) * fundamental <= HOWL_MAX_HZ) {
        const under: Point[] = []
        const over: Point[] = []
        for (let k = last + 1; k * fundamental <= HOWL_MAX_HZ; k++) {
          const x = xOf(k * fundamental, plot)
          const y = level(most(k * fundamental))
          under.push([x, y])
          over.push([x, Math.min(y, zero)])
        }
        fillTo(ctx, under, foot, colours.ink, INK.fill)
        fillTo(ctx, over, zero, colours.ink, lerp(INK.fill, 0.6, heard))
      }

      // The curve joins the tops of the overtones, every one the scale holds:
      // between them there is no tone, so nothing is drawn of the rate there.
      // The right side's behind, the left side's in front.
      const curve = (side: 0 | 1): Point[] => {
        const points: Point[] = []
        for (let k = 1; k * fundamental <= HOWL_MAX_HZ; k++) {
          const hz = k * fundamental
          if (hz >= HOWL_MIN_HZ) points.push([xOf(hz, plot), level(loopAt(hz, side))])
        }
        return points
      }
      if (apart) trace(ctx, curve(1), { colour: colours.ink, width: 1, alpha: INK.back })
      trace(ctx, curve(0), { colour: colours.ink })
    })

    const tones = drawSinging(frame, plot, running, heard)

    // The rail, with the note the loop is tuned by at its end.
    rule(ctx, plot.x, rail - 0.5, plot.x + plot.w, rail - 0.5, {
      colour: colours.ink,
      alpha: INK.grid,
    })
    const [onCurve, onRail] = howlHandles(frame)
    rule(ctx, onRail.x, foot, onRail.x, rail, { colour: colours.ink, alpha: INK.back })
    handle(frame, onCurve.x, onCurve.y, { hot: frame.hot === onCurve.key })
    handle(frame, onRail.x, onRail.y, { hot: frame.hot === onRail.key, radius: 3 })
    drawWords(frame, plot, onCurve, tones)
  },
  handles: howlHandles,
})

export const HOWL_FACES: Readonly<Record<string, PlateFace>> = {
  howl: {
    display: howl,
    face: ['gain', 'distance', 'hold', 'mix'],
  },
}
