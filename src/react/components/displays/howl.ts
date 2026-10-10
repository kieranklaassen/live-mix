// The display of Howl: the loop's own picture of where it can sing.
//
// Across is frequency, 25 Hz to 6.4 kHz; up is the loop's gain in dB, with
// the line at 0 dB where a turn round the loop gives back what went in. The
// curve is the loop's gain at each frequency (Gain times the body), and the
// posts under it are the only places the loop can sing: the whole multiples
// of 1 / Distance, which the device tunes its delay to. A post that stands
// over the line sings. Behind them is the spectrum of what comes out, and in
// the accent the tone each side sings now, as loud as it is heard, with
// Edge's harmonics beside it.
//
// Everything drawn is the device's own maths (`cpp/devices/howl/howl.h`); the
// constants copied from there say so.

import {
  INK,
  clamp,
  clipped,
  dbText,
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
  dbOfY,
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

/** Gain 0 is this loop gain in dB at the body's centre: `kGainFloorDb`. */
export const HOWL_GAIN_FLOOR_DB = -18
/** And Gain 1 is this much more: `kGainSpanDb`. */
export const HOWL_GAIN_SPAN_DB = 30
/** The Q of the body's band pass: `kBodyQ`. */
export const HOWL_BODY_Q = 2
/** Where the body's centre may stand, wherever Move and Width send it: `kCentreMinHz`, `kCentreMaxHz`. */
export const HOWL_CENTRE_MIN_HZ = 80
export const HOWL_CENTRE_MAX_HZ = 3000
/** Move 1 wanders this many octaves either way: `kMoveOctaves`. */
export const HOWL_MOVE_OCTAVES = 1
/** Width 1 sets each side this many octaves from Body, one down and one up: `kWidthOctaves`. */
export const HOWL_WIDTH_OCTAVES = 0.25
/** Edge 1 adds the third, fifth and seventh harmonics at these shares of the tone: `turn` in `howl.h`. */
export const HOWL_EDGE_HARMONICS: readonly (readonly [number, number])[] = [
  [3, 1 / 3],
  [5, 1 / 5],
  [7, 1 / 7],
]

/** The loop's gain at the body's centre, in dB, for a Gain setting: `loop_gain`. */
export const howlLoopDb = (gain: number): number =>
  HOWL_GAIN_FLOOR_DB + HOWL_GAIN_SPAN_DB * clamp(gain, 0, 1)

/** The Gain setting that gives a loop gain in dB. */
export const howlGainOf = (db: number): number =>
  clamp((db - HOWL_GAIN_FLOOR_DB) / HOWL_GAIN_SPAN_DB, 0, 1)

/**
 * What the body does to a frequency, in dB, with its centre at `centreHz`:
 * `body_at` in `howl.h`. The band pass (s / Q) / (s² + s / Q + 1) at
 * s = j tan(π hz / rate) / tan(π centre / rate), unity at the centre.
 */
export function howlBodyDb(hz: number, centreHz: number, sampleRate: number): number {
  const w =
    Math.tan((Math.PI * Math.min(hz, 0.49 * sampleRate)) / sampleRate) /
    Math.tan((Math.PI * centreHz) / sampleRate)
  const re = 1 - w * w
  const im = w / HOWL_BODY_Q
  return gainToDb(im / Math.sqrt(re * re + im * im))
}

/** The frequency the loop is tuned by, in Hz: the whole multiples of it are where it can sing. */
export const howlFundamentalHz = (distanceMs: number): number => 1000 / distanceMs

/**
 * Where one side's body stands, in Hz: Body, moved by Width (the left side
 * down, the right side up) and by the wander (`drift`, −1..1, times Move):
 * `tune` in `howl.h`.
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

/**
 * The overtone the loop sings when it starts from nothing: the whole multiple
 * of the fundamental the body passes best (`tune`: the one under the centre
 * or the one over it, whichever has the more gain).
 */
export function howlOvertone(centreHz: number, fundamentalHz: number, sampleRate: number): number {
  const most = Math.max(1, Math.floor((0.4 * sampleRate) / fundamentalHz))
  const under = clamp(Math.floor(centreHz / fundamentalHz), 1, most)
  if (under >= most) return under
  return howlBodyDb((under + 1) * fundamentalHz, centreHz, sampleRate) >
    howlBodyDb(under * fundamentalHz, centreHz, sampleRate)
    ? under + 1
    : under
}

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const

/** The note nearest a frequency, as it is said: "C3", "F#4". */
export function howlNote(hz: number): string {
  const midi = Math.round(69 + 12 * Math.log2(hz / 440))
  return `${NOTES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`
}

// --- The picture ------------------------------------------------------------

/** The frequency scale: from under the lowest fundamental to over the seventh harmonic of most howls. */
export const HOWL_MIN_HZ = 25
export const HOWL_MAX_HZ = 6400
/** The loop gain scale, in dB: Gain's whole travel with room over and under it. */
export const HOWL_TOP_DB = 15
export const HOWL_FOOT_DB = -27
/** The scale the sound is drawn on, the spectrum and the singing tones: full scale at the top, this at the foot. */
export const HOWL_SOUND_FOOT_DB = -72
/** Posts closer than this many pixels are drawn as one fill under the curve. */
export const HOWL_POSTS_APART = 3

export interface HowlBoxes {
  /** Where the curve, the posts and the sound are drawn. */
  plot: Box
  /** The level of the rail under it that carries Distance. */
  rail: number
  /** Where the loop gives back what went in: 0 dB. */
  zero: number
}

export function howlBoxes(view: Pick<DisplayView, 'width' | 'height'>): HowlBoxes {
  const plot: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 17 }
  return {
    plot,
    rail: Math.floor(view.height) - 7.5,
    zero: yOfDb(0, plot, HOWL_TOP_DB, HOWL_FOOT_DB),
  }
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
      // Across is where the body stands, up and down is the loop's gain there.
      key: 'body',
      name: 'Body and gain',
      x: xOf(view.value('body'), plot),
      y: yOfDb(howlLoopDb(view.value('gain')), plot, HOWL_TOP_DB, HOWL_FOOT_DB),
      drag: (x, y) => ({
        body: clamp(hzAt(x, plot), body?.min ?? 120, body?.max ?? 2400),
        gain: howlGainOf(dbOfY(y, plot, HOWL_TOP_DB, HOWL_FOOT_DB)),
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
    : howlCentreHz(frame.value('body'), frame.value('move'), frame.value('width'), side, 0)
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

/**
 * The tone each side sings now, in the accent: a line at its frequency as
 * high as it is heard (the loop's level times what Mix lets through, on the
 * spectrum's scale), and beside it Edge's harmonics at their shares of it.
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
    state.heard[side] = running ? follow(state.heard[side], reading * heard, frame.dt, 0.05, 0.15) : 0
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
      const top = sound(tone.level * edge * share)
      if (hz > HOWL_MAX_HZ || top > foot - 1) continue
      trace(ctx, [[xOf(hz, plot), foot], [xOf(hz, plot), top]], {
        colour: colours.accent,
        width: 1,
        alpha: INK.text,
      })
    }
    const top = sound(tone.level)
    trace(ctx, [[x, foot], [x, top]], { colour: colours.accent, width: tone.side === 0 ? 2 : 1 })
    dot(ctx, x, top, tone.side === 0 ? 2.75 : 1.75, colours.accent, {
      ring: tone.side === 0 ? colours.ink : undefined,
    })
  }
  return [left, right]
}

/** The words: what the point in hand is set to, or else the notes that sing; and on the rail the note Distance tunes. */
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
    words = `${hzText(frame.value('body'))}  ${dbText(howlLoopDb(frame.value('gain')))}`
  else if (frame.hot === 'distance')
    words = `${distance.toFixed(distance < 10 ? 1 : 0)} ms  ${hzText(fundamental)}`
  else {
    const notes = tones.filter(sings).map((tone) => howlNote(tone.pitch))
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
  info: 'The curve is the gain of the loop at each frequency and the posts are the overtones it can sing: one that stands over the line sings. In the second colour, the tone singing now over the spectrum. Drag the point on the curve for Body and Gain, the point on the rail for Distance.',
  init: () => ({ heard: [0, 0] }),
  draw(frame) {
    const { ctx, colours, sampleRate } = frame
    ground(frame)
    const { plot, rail, zero } = howlBoxes(frame)
    const foot = plot.y + plot.h
    const level = (db: number): number =>
      clamp(yOfDb(db, plot, HOWL_TOP_DB, HOWL_FOOT_DB), plot.y, foot)
    const running = frame.signal !== null && frame.powered
    const fundamental = howlFundamentalHz(frame.value('distance'))
    const heard = howlHeard(frame.value('mix'))
    // What a new note has taken off the loop's gain, while it runs.
    const ducked = running ? clamp(frame.meter('ducked'), 0, 1) : 0
    const loopDb = howlLoopDb(frame.value('gain')) + Math.max(-60, gainToDb(1 - ducked))
    const centres: [number, number] = [centreOf(frame, running, 0), centreOf(frame, running, 1)]
    const apart = Math.abs(Math.log2(centres[1] / centres[0])) > 0.01
    const loopAt = (hz: number, side: 0 | 1): number =>
      loopDb + howlBodyDb(hz, centres[side], sampleRate)
    const most = (hz: number): number => Math.max(loopAt(hz, 0), apart ? loopAt(hz, 1) : -Infinity)

    // The scale: 100 Hz and 1 kHz, and the line where the loop gives back what went in.
    for (const hz of [100, 1000])
      rule(ctx, xOf(hz, plot), plot.y, xOf(hz, plot), foot, { colour: colours.ink, alpha: INK.grid })
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
      // loop's gain there; the part over the line is what sings, drawn as
      // strongly as Mix lets it be heard.
      const posts = howlPosts(fundamental, plot)
      for (const k of posts) {
        const x = xOf(k * fundamental, plot)
        const db = most(k * fundamental)
        rule(ctx, x, foot, x, level(db), { colour: colours.ink, alpha: INK.back })
        if (db > 0)
          rule(ctx, x, zero, x, level(db), {
            colour: colours.ink,
            width: 2,
            alpha: lerp(INK.back, INK.trace, heard),
          })
      }
      // Past the last post they stand too close to tell apart: a fill under the curve.
      const last = posts.length > 0 ? posts[posts.length - 1] : 0
      const crowd = xOf(Math.max(HOWL_MIN_HZ, (last + 1) * fundamental), plot)
      if ((last + 1) * fundamental <= HOWL_MAX_HZ) {
        const under: Point[] = []
        const over: Point[] = []
        for (let x = crowd; x <= plot.x + plot.w + 0.01; x += 1) {
          const y = level(most(hzAt(x, plot)))
          under.push([x, y])
          over.push([x, Math.min(y, zero)])
        }
        fillTo(ctx, under, foot, colours.ink, INK.fill)
        fillTo(ctx, over, zero, colours.ink, lerp(INK.fill, 0.6, heard))
      }

      // The loop's gain at every frequency: the right side's behind, the left side's in front.
      const curve = (side: 0 | 1): Point[] => {
        const points: Point[] = []
        for (let x = 0; x <= plot.w; x += 2)
          points.push([plot.x + x, level(loopAt(hzAt(plot.x + x, plot), side))])
        return points
      }
      if (apart) trace(ctx, curve(1), { colour: colours.ink, width: 1, alpha: INK.back })
      trace(ctx, curve(0), { colour: colours.ink })
    })

    const tones = drawSinging(frame, plot, running, heard)

    // The rail, with the note the loop is tuned by at its end.
    rule(ctx, plot.x, rail - 0.5, plot.x + plot.w, rail - 0.5, { colour: colours.ink, alpha: INK.grid })
    const [body, distance] = howlHandles(frame)
    rule(ctx, distance.x, foot, distance.x, rail, { colour: colours.ink, alpha: INK.back })
    handle(frame, body.x, body.y, { hot: frame.hot === body.key })
    handle(frame, distance.x, distance.y, { hot: frame.hot === distance.key, radius: 3 })
    drawWords(frame, plot, body, tones)
  },
  handles: howlHandles,
})

export const HOWL_FACES: Readonly<Record<string, PlateFace>> = {
  howl: {
    display: howl,
    face: ['gain', 'distance', 'hold', 'mix'],
  },
}
