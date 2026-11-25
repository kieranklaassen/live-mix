// The display of Buzzing Bridge: the level against the line it touches at, and
// where the buzz sits.
//
// Above, the level the device follows lies across, from 60 dB under full scale
// to full scale. The dashed upright line is Threshold, and the curve is how
// far the touch closes for a note that loud, as high as Amount: a few dB wide
// for the bridge, the leather and the paper, as slow as Curve makes it for the
// membrane, a plain step for the shell, which an attack either knocks or not.
// The bar under it is the level now, in the accent while it is over the line,
// and the dot on it is how far the touch is closed. A note that touched goes
// on touching while it dies, so the dot may stand left of the line and high.
// The ring on the line sets Threshold across and Amount up.
//
// Under it, what a note out of silence does in its first milliseconds: the
// bounces of Rattle, each sooner and softer than the last. The shell has those
// and nothing after; the others settle into a steady touch. It is a shape over
// time and stands still.
//
// Below, where the buzz sits, from 100 Hz to 16 kHz: the filters the model
// speaks through, with Tone, and how loud the buzz is now, on one scale in dB.
// A touch that comes once a swing gives lines at the partials of the followed
// note (the bridge, the membrane, the leather); the shell and the paper are
// noise and fill the curve. On the line over it is the sweep: the dot is where
// the buzz sits now, and for the bridge the line runs from the partial a climb
// begins on to the one it ends on. Before any sound all of it is drawn for a
// note of 220 Hz.
//
// Everything is the device's own arithmetic (`buzzing_bridge.h`; the constants
// carry its names); the level, the touch, the pitch, the place and the loudness
// of the buzz are its own readings. Nothing turns back more than six times a
// second: a mark that turned waits a sixth of a second before it turns again.

import {
  INK,
  clamp,
  dot,
  fillRect,
  fillTo,
  follow,
  freqGrid,
  ground,
  handle,
  hzText,
  rule,
  text,
  trace,
  xOfHz,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayHandle,
  type DisplayView,
  type PlateFace,
} from '../plate-display'

// --- The device's numbers (`buzzing_bridge.h`) ----------------------------------

/** `Model`: the order of the choices. */
export const BUZZ_GRAZING = 0
export const BUZZ_MEMBRANE = 1
export const BUZZ_SHELL = 2
export const BUZZ_LEATHER = 3
export const BUZZ_PAPER = 4
/** `kFirstPartial`: the partial a climb begins on. */
export const BUZZ_FIRST_PARTIAL = 3
/** `place`: the octaves a climb has at Curve 1. */
const CLIMB_OCTAVES = 3.3333
/** `kEndShare`, `kEndWidth`, `kEndHz`: the share of the bridge's buzz that sits at the end of its climb throughout. */
const END_SHARE = 0.3
const END_WIDTH = 1
const END_HZ = 6500
/** `place`: the pitch the filters are tuned as for while none is followed, and the note that is drawn for before any sound. */
export const BUZZ_NOTE_HZ = 220
/** `attack`: the first knock comes this long after it. `strike_once`: how far down a knock is the strongest of. */
const FIRST_KNOCK_SEC = 0.0015
const KNOCK_MOST = 1.25
/** `hit_k_` and `touch_k_`: how fast a knock and the touch come up. */
const HIT_SEC = 0.00025
const TOUCH_SEC = 0.001

/** What the display reads off the knobs. */
export interface BuzzSettings {
  model: number
  amount: number
  threshold: number
  curve: number
  tracking: number
  resonance: number
  /** Seconds. */
  rattle: number
  bounces: number
  /** Seconds. */
  fall: number
  tone: number
}

/** `whole`: how the device rounds a setting it takes whole. */
const whole = (value: number): number => Math.floor(value + 0.5)

export function buzzSettings(value: (name: string) => number): BuzzSettings {
  return {
    model: clamp(whole(value('model')), BUZZ_GRAZING, BUZZ_PAPER),
    amount: value('amount'),
    threshold: value('threshold'),
    curve: value('curve'),
    tracking: value('tracking'),
    resonance: value('resonance'),
    rattle: 0.001 * value('rattle'),
    bounces: clamp(whole(value('bounces')), 1, 8),
    fall: 0.001 * value('fall'),
    tone: value('tone'),
  }
}

/**
 * How far the touch is closed, 0 to 1, for a note whose attack stands so high:
 * `open_target_`. The membrane opens over 4 dB at Curve 0 and 32 at Curve 1;
 * the bridge, the leather and the paper over 3; the shell is knocked or not.
 */
export function buzzOpen(levelDb: number, set: BuzzSettings): number {
  const over = levelDb - set.threshold
  if (!(over > 0)) return 0
  if (set.model === BUZZ_SHELL) return 1
  return Math.min(1, over / (set.model === BUZZ_MEMBRANE ? 4 + 28 * set.curve : 3))
}

/** The partial a climb ends on. */
export const buzzLastPartial = (set: Pick<BuzzSettings, 'curve'>): number =>
  BUZZ_FIRST_PARTIAL * Math.pow(2, CLIMB_OCTAVES * set.curve)

/**
 * `place`: where the buzz sits, in hertz, on `partial` of the bridge and under
 * a followed pitch of `hz` (0 for none yet).
 */
export function buzzPlace(
  set: BuzzSettings,
  partial: number,
  hz: number,
  sampleRate: number,
): number {
  const { model, tracking, resonance } = set
  let place = resonance
  if (model === BUZZ_GRAZING) {
    const still = (partial * resonance) / 16
    place = still * Math.pow((partial * hz) / still, hz > 0 ? tracking : 0)
    const over = place / (2 * resonance)
    place /= Math.pow(1 + over * over * over * over, 0.25)
  } else if (model === BUZZ_LEATHER) place = 0.4 * resonance
  else if (model === BUZZ_PAPER) place = 1.4 * resonance
  if (model !== BUZZ_GRAZING && hz > 0) {
    place *= Math.pow(hz / 220, 0.5 * tracking)
    const nearest = Math.max(2, Math.floor(place / hz + 0.5)) * hz
    place *= Math.pow(nearest / place, tracking)
  }
  return clamp(place, 40, 0.42 * sampleRate)
}

/** Whether a model's buzz is noise; else it comes once a swing, which is lines at the partials of the note. */
export const buzzIsNoise = (model: number): boolean => model === BUZZ_SHELL || model === BUZZ_PAPER

/** `pulse_norm`: the gain that makes a run of pulses with edges a constant in a band `q` wide on partial `k`. */
function pulseNorm(k: number, q: number): number {
  const at = clamp(k, 1, 60)
  return at / Math.sqrt(Math.max(1, (1.2 * at) / q))
}

/**
 * The gain, before Amount and Tone, of the filters a model speaks through, at
 * so many hertz: `kit::Svf` bands as `place` tunes them and `touch` adds them.
 * The membrane's is of its two resonances and not of the breath beside them,
 * the paper's of its noise and not of the little that is pulses.
 */
export function buzzFilter(
  hz: number,
  set: BuzzSettings,
  place: number,
  partial: number,
  pitch: number,
  sampleRate: number,
): number {
  // A band `q` wide at `at`: k s / (s s + k s + 1) with s on the bent scale of the filter's own.
  let re = 0
  let im = 0
  const bend = (f: number): number =>
    Math.tan((Math.PI * Math.min(f, 0.49 * sampleRate)) / sampleRate)
  const here = bend(hz)
  const band = (at: number, q: number): Point => {
    const s = here / bend(at)
    const b = s / q
    const a = 1 - s * s
    const size = a * a + b * b
    return [(b * b) / size, (a * b) / size]
  }
  const add = (gain: number, [x, y]: Point): void => {
    re += gain * x
    im += gain * y
  }
  switch (set.model) {
    case BUZZ_GRAZING: {
      const note = pitch > 0 ? pitch : BUZZ_NOTE_HZ
      const norm = 1.25 * pulseNorm(place / note, 1.5)
      const one = band(place, 1.5)
      add(norm, [one[0] * one[0] - one[1] * one[1], 2 * one[0] * one[1]])
      add(0.2 * norm, one)
      const left = Math.max(0, CLIMB_OCTAVES * set.curve - Math.log2(partial / BUZZ_FIRST_PARTIAL))
      const end = Math.min(place * Math.pow(2, left), 2 * set.resonance, END_HZ)
      add(
        END_SHARE * Math.min(1, left) * pulseNorm(Math.min(end / note, 24), END_WIDTH),
        band(end, END_WIDTH),
      )
      break
    }
    case BUZZ_MEMBRANE:
      add(1, band(place, 4))
      add(0.5, band(1.59 * place, 5))
      break
    case BUZZ_SHELL: {
      const q = clamp(Math.PI * place * 0.0012, 1, 8)
      add(1, band(place, q))
      add(0.6, band(1.58 * place, q))
      add(0.4, band(2.41 * place, q))
      break
    }
    case BUZZ_LEATHER:
      add(1, band(place, 0.8))
      break
    default:
      add(1, band(place, 0.7))
  }
  return Math.hypot(re, im)
}

/** The gain of Tone: a low pass of two poles. */
export function buzzTone(hz: number, tone: number, sampleRate: number): number {
  const at = (f: number): number =>
    Math.tan((Math.PI * Math.min(f, 0.49 * sampleRate)) / sampleRate)
  const s = at(hz) / at(tone)
  return 1 / Math.sqrt(1 + s * s * s * s)
}

/** One bounce: when it comes after the attack, how strong, and how fast it dies, in seconds. */
export interface BuzzKnock {
  at: number
  strength: number
  decay: number
}

/** `attack` and `strike_once`: the bounces after an attack. */
export function buzzKnocks(set: BuzzSettings): BuzzKnock[] {
  const ratio = 0.92 - 0.45 * set.curve
  const { bounces } = set
  let gap =
    bounces < 2 ? set.rattle : (set.rattle * (1 - ratio)) / (1 - Math.pow(ratio, bounces - 1))
  let at = FIRST_KNOCK_SEC
  const knocks: BuzzKnock[] = []
  for (let k = 0; k < bounces; k++) {
    knocks.push({
      at,
      strength: KNOCK_MOST * Math.pow(0.75, k) * Math.pow(10, -at / set.fall),
      decay: clamp(0.14 * gap, 0.0004, 0.04),
    })
    at += gap
    gap *= ratio
  }
  return knocks
}

/**
 * How far the touch is closed over the first moments of a note out of silence
 * and well over Threshold, `count` readings over `seconds`: `step_hits`. The
 * shell's is the knocks themselves; the others chatter with them, when there
 * is more than one, and are closed from the last of them on.
 */
export function buzzTouch(set: BuzzSettings, seconds: number, count: number): number[] {
  const knocks = buzzKnocks(set)
  const dt = seconds / count
  const hitK = 1 - Math.exp(-dt / HIT_SEC)
  const touchK = 1 - Math.exp(-dt / TOUCH_SEC)
  const out: number[] = []
  let next = 0
  let env = 0
  let decay = 1
  let hit = 0
  let touch = 1
  let open = 0
  let chatter = set.bounces > 1
  for (let n = 1; n <= count; n++) {
    while (next < knocks.length && n * dt >= knocks[next].at) {
      env = knocks[next].strength
      decay = Math.exp(-dt / knocks[next].decay)
      next++
      if (next === knocks.length) chatter = false
    }
    env *= decay
    hit += (env - hit) * hitK
    touch += ((chatter ? Math.min(1, 1.2 * hit) : 1) - touch) * touchK
    open += (1 - open) * touchK
    out.push(set.model === BUZZ_SHELL ? hit : touch * open)
  }
  return out
}

/** How long the bounces are shown for: Rattle, and a fifth more for what follows. */
export const buzzSpan = (set: BuzzSettings): number => FIRST_KNOCK_SEC + 1.2 * set.rattle

// --- Where things stand -------------------------------------------------------

/** The scale the level lies on, in dB under full scale. */
export const BUZZ_FOOT_DB = -60
/** The scale of the buzz, in dB under full scale, and the frequencies it is drawn over. */
export const BUZZ_TOP_DB = -12
export const BUZZ_RANGE_DB = 36
export const BUZZ_MIN_HZ = 100
export const BUZZ_MAX_HZ = 16000

export interface BuzzLayout {
  /** The level across and how far closed up; the bar of the level stands on its foot. */
  touch: Box
  /** The line its numbers are on. */
  scale: number
  /** The bounces, and where the length of them is written. */
  knocks: Box
  knocksBase: number
  /** The line of the sweep, and the buzz under it. */
  sweep: number
  buzz: Box
  /** The words under it, and their two ends. */
  base: number
  left: number
  right: number
}

/** Laid out from the size it is given: the touch, the bounces, the sweep and the buzz, a line of words. */
export function buzzLayout(view: Pick<DisplayView, 'width' | 'height'>): BuzzLayout {
  const { width, height } = view
  const inside = Math.max(16, width - 12)
  const touch: Box = { x: 6, y: 6, w: inside, h: Math.max(8, height * 0.3) }
  const scale = touch.y + touch.h + 10
  const knocks: Box = { x: 6, y: scale + 4, w: Math.max(8, inside - 32), h: 9 }
  const sweep = knocks.y + knocks.h + 5
  const base = height - 4
  const top = sweep + 3.5
  return {
    touch,
    scale,
    knocks,
    knocksBase: knocks.y + 8,
    sweep,
    buzz: { x: 6, y: top, w: inside, h: Math.max(4, base - 9 - top) },
    base,
    left: 6,
    right: 6 + inside,
  }
}

/** Where a level lies across. */
export const buzzXOfDb = (db: number, box: Box): number =>
  box.x + clamp(1 - db / BUZZ_FOOT_DB, 0, 1) * box.w

/** Two partials nearer than this are not two lines. */
export const BUZZ_LINES_PX = 2

export const buzzXOfHz = (hz: number, box: Box): number => xOfHz(hz, box, BUZZ_MIN_HZ, BUZZ_MAX_HZ)

/** The filters and Tone over the buzz's box: for each pixel its frequency and its gain in dB under the highest. */
export function buzzShape(
  set: BuzzSettings,
  place: number,
  partial: number,
  pitch: number,
  box: Box,
  sampleRate: number,
): { x: number; db: number }[] & { top: number } {
  const gain = (hz: number): number =>
    buzzFilter(hz, set, place, partial, pitch, sampleRate) * buzzTone(hz, set.tone, sampleRate)
  const count = Math.max(8, Math.round(box.w))
  const gains: number[] = []
  let top = gain(place)
  for (let n = 0; n <= count; n++) {
    gains.push(gain(BUZZ_MIN_HZ * Math.pow(BUZZ_MAX_HZ / BUZZ_MIN_HZ, n / count)))
    top = Math.max(top, gains[n])
  }
  const points = gains.map((one, n) => ({
    x: box.x + (n / count) * box.w,
    db: 20 * Math.log10(Math.max(one / Math.max(top, 1e-12), 1e-9)),
  }))
  return Object.assign(points, { top })
}

// --- The point ----------------------------------------------------------------

/** One ring, on the Threshold line as high as Amount: across is Threshold, up is Amount. */
function buzzHandles(view: DisplayView): DisplayHandle[] {
  const { touch } = buzzLayout(view)
  const threshold = view.value('threshold')
  const amount = view.value('amount')
  const thresholdSpec = view.spec('threshold')
  const amountSpec = view.spec('amount')
  const x = buzzXOfDb(threshold, touch)
  const y = touch.y + (1 - amount) * touch.h
  return [
    {
      key: 'touch',
      name: 'Threshold and Amount',
      x,
      y,
      drag: (toX, toY) => ({
        threshold:
          Math.abs(toX - x) < 1e-6
            ? threshold
            : clamp(
                BUZZ_FOOT_DB * (1 - (toX - touch.x) / touch.w),
                thresholdSpec?.min ?? BUZZ_FOOT_DB,
                thresholdSpec?.max ?? 0,
              ),
        amount:
          Math.abs(toY - y) < 1e-6
            ? amount
            : clamp(1 - (toY - touch.y) / touch.h, amountSpec?.min ?? 0, amountSpec?.max ?? 1),
      }),
      reset: () => ({
        threshold: thresholdSpec?.default ?? threshold,
        amount: amountSpec?.default ?? amount,
      }),
    },
  ]
}

// --- The display --------------------------------------------------------------

/** A mark that has turned may not turn again for this long: three times to and fro a second at the most. */
const TURN_SEC = 1 / 6 + 0.001
/** The words that count are written anew three times a second at the most. */
const WORDS_SEC = 1 / 3

/** Marks on their way to their readings: they move together, and none of them turns sooner than it may. */
interface BuzzMarks {
  shown: number[]
  way: number[]
  turned: number
}

/** A move smaller than this is none: of a level in dB, of a share, of a pitch in octaves or a buzz in tens of dB. */
const STILL = { level: 0.1, touch: 0.005, sweep: 0.01 } as const

interface BuzzState {
  marks: Partial<Record<keyof typeof STILL, BuzzMarks>>
  /** What is written under the buzz, and since when. */
  words: readonly [string, string] | null
  since: number
}

const RISE_SEC = 0.03
const SINK_SEC = 0.1
const SWEEP_SEC = 0.04

const buzzingBridge = plateDisplay<BuzzState>({
  place: 'window',
  columns: 2,
  params: [
    'model',
    'amount',
    'threshold',
    'curve',
    'tracking',
    'resonance',
    'rattle',
    'bounces',
    'fall',
    'tone',
  ],
  live: { meters: true },
  info: 'Above, the level against the Threshold line: the curve is how far the touch closes, and the ring sets Threshold and Amount. Then the bounces after an attack. Below, the partials the buzz is made of, and over them where it sits as it climbs.',
  init: () => ({ marks: {}, words: null, since: -Infinity }),
  draw(frame) {
    const { ctx, colours, state, now } = frame
    ground(frame)
    const layout = buzzLayout(frame)
    const set = buzzSettings((name) => frame.value(name))
    const rate = frame.sampleRate
    const metered = frame.powered && frame.hasMeter('over')
    // Before any sound, and again after a silence, the device reads no place.
    const reading = (name: string): number => {
      const value = metered && frame.hasMeter(name) ? frame.meter(name) : 0
      return Number.isFinite(value) ? value : 0
    }
    const awake = reading('place') > 0

    if (!awake) {
      state.marks = {}
      state.words = null
      state.since = -Infinity
    }
    /** Readings as they are drawn: followed together, and no sooner turned than they may. */
    const shown = (
      name: keyof typeof STILL,
      values: readonly number[],
      rise = RISE_SEC,
      sink = SINK_SEC,
    ): readonly number[] => {
      const marks = (state.marks[name] ??= {
        shown: [...values],
        way: values.map(() => 0),
        turned: -Infinity,
      })
      if (!(frame.dt > 0)) {
        marks.shown = [...values]
        return marks.shown
      }
      const ways = values.map((value, n) =>
        Math.abs(value - marks.shown[n]) < STILL[name] ? 0 : Math.sign(value - marks.shown[n]),
      )
      if (ways.some((way, n) => way * marks.way[n] < 0)) {
        if (now - marks.turned < TURN_SEC) return marks.shown
        marks.turned = now
      }
      ways.forEach((way, n) => {
        if (way === 0) return
        marks.way[n] = way
        marks.shown[n] = follow(marks.shown[n], values[n], frame.dt, rise, sink)
      })
      return marks.shown
    }

    // The note, where the buzz sits on it and how loud it is move as one, in octaves and tens of dB.
    const pitchRead = reading('pitch')
    // The first pitch found is not come to from nowhere.
    if (state.marks.sweep?.shown[0] === 0 && pitchRead > 0)
      state.marks.sweep.shown[0] = Math.log2(pitchRead)
    const [pitchAt, partialAt, placeAt, loudAt] = awake
      ? shown(
          'sweep',
          [
            pitchRead > 0 ? Math.log2(pitchRead) : 0,
            Math.log2(Math.max(reading('partial'), BUZZ_FIRST_PARTIAL)),
            Math.log2(Math.max(reading('place'), 1)),
            0.1 * clamp(reading('buzz'), -90, 0),
          ],
          SWEEP_SEC,
          SWEEP_SEC,
        )
      : [0, 0, 0, -9]
    const pitch = awake ? (pitchRead > 0 ? Math.pow(2, pitchAt) : 0) : BUZZ_NOTE_HZ
    const partial = awake ? Math.pow(2, partialAt) : BUZZ_FIRST_PARTIAL
    const place = awake ? Math.pow(2, placeAt) : buzzPlace(set, BUZZ_FIRST_PARTIAL, pitch, rate)

    // --- The level against Threshold ---
    const { touch } = layout
    const foot = touch.y + touch.h
    const yOf = (closed: number): number => foot - clamp(set.amount * closed, 0, 1) * touch.h
    for (const db of [-40, -20])
      rule(ctx, buzzXOfDb(db, touch), touch.y, buzzXOfDb(db, touch), foot, {
        colour: colours.ink,
        alpha: INK.grid,
      })
    const lineX = buzzXOfDb(set.threshold, touch)
    const wide = set.model === BUZZ_SHELL ? 0 : set.model === BUZZ_MEMBRANE ? 4 + 28 * set.curve : 3
    const full = set.threshold + wide
    // Up from the line to where the touch is all the way closed, or as far as full scale goes.
    const law: Point[] = [
      [touch.x, foot],
      [lineX, foot],
      [buzzXOfDb(full, touch), yOf(full > 0 ? buzzOpen(0, set) : 1)],
      [touch.x + touch.w, yOf(full > 0 ? buzzOpen(0, set) : 1)],
    ]
    fillTo(ctx, law, foot, colours.ink)
    trace(ctx, law, { colour: colours.ink, width: 1.25 })
    rule(ctx, lineX, touch.y, lineX, foot, { colour: colours.ink, alpha: INK.text, dash: [2, 2] })
    if (awake) {
      const [level] = shown('level', [clamp(set.threshold + reading('over'), BUZZ_FOOT_DB, 0)])
      const closed =
        set.model === BUZZ_SHELL
          ? buzzOpen(level, set)
          : shown('touch', [clamp(reading('touch'), 0, 1)])[0]
      const over = level > set.threshold
      const x = buzzXOfDb(level, touch)
      fillRect(
        ctx,
        { x: touch.x, y: foot - 1, w: x - touch.x, h: 3 },
        over ? colours.accent : colours.ink,
        over ? 1 : INK.back,
      )
      dot(ctx, x, yOf(closed), 2.25, colours.accent, { ring: colours.ink })
    }
    text(frame, '−60', layout.left, layout.scale, { alpha: INK.text })
    text(frame, '0 dB', layout.right, layout.scale, { align: 'right', alpha: INK.text })

    // --- The bounces ---
    const { knocks } = layout
    const count = 6 * Math.max(8, Math.round(knocks.w))
    const closing = buzzTouch(set, buzzSpan(set), count)
    const tall = set.model === BUZZ_SHELL ? KNOCK_MOST : 1
    const under = knocks.y + knocks.h
    const bounces: Point[] = [[knocks.x, under]]
    for (let n = 0; n < closing.length; n += 2)
      bounces.push([
        knocks.x + ((n + 1) / count) * knocks.w,
        under - clamp(Math.max(closing[n], closing[n + 1]) / tall, 0, 1) * knocks.h,
      ])
    rule(ctx, knocks.x, under, knocks.x + knocks.w, under, { colour: colours.ink, alpha: INK.rule })
    fillTo(ctx, bounces, under, colours.ink, INK.back)
    text(frame, `${Math.round(1000 * set.rattle)} ms`, layout.right, layout.knocksBase, {
      align: 'right',
      alpha: INK.text,
    })

    // --- Where the buzz sits ---
    const { buzz } = layout
    const floor = buzz.y + buzz.h
    freqGrid(frame, buzz, BUZZ_MIN_HZ, BUZZ_MAX_HZ)
    rule(ctx, buzz.x, floor, buzz.x + buzz.w, floor, { colour: colours.ink, alpha: INK.rule })
    const shape = buzzShape(set, place, partial, pitch, buzz, rate)
    const yOfBuzz = (db: number): number => floor - clamp(1 + db / BUZZ_RANGE_DB, 0, 1) * buzz.h
    const outline = shape.map(({ x, db }): Point => [x, yOfBuzz(db)])
    const loud = 10 * loudAt
    const lit = shape.map(({ x, db }): Point => [x, yOfBuzz(db + loud - BUZZ_TOP_DB)])
    if (loud > BUZZ_TOP_DB - BUZZ_RANGE_DB) {
      // Lines, as far up as two of them can be told apart; the rest is filled, as noise is.
      let filled = buzz.x
      if (!buzzIsNoise(set.model) && pitch > 0) {
        filled = Infinity
        for (let k = 1; k * pitch < BUZZ_MAX_HZ; k++) {
          const hz = k * pitch
          if (hz < BUZZ_MIN_HZ) continue
          const x = buzzXOfHz(hz, buzz)
          const gain =
            buzzFilter(hz, set, place, partial, pitch, rate) * buzzTone(hz, set.tone, rate)
          const db = 20 * Math.log10(Math.max(gain / shape.top, 1e-9))
          const y = yOfBuzz(db + loud - BUZZ_TOP_DB)
          if (y < floor - 0.05)
            trace(
              ctx,
              [
                [x, floor],
                [x, y],
              ],
              { colour: colours.accent, width: 1.25 },
            )
          if (buzzXOfHz(hz + pitch, buzz) - x < BUZZ_LINES_PX) {
            filled = x
            break
          }
        }
      }
      fillTo(
        ctx,
        lit.filter(([x]) => x >= filled),
        floor,
        colours.accent,
        INK.text,
      )
    }
    trace(ctx, outline, { colour: colours.ink, width: 1 })

    // --- The sweep over it ---
    const { sweep } = layout
    if (set.model === BUZZ_GRAZING) {
      const ends = [BUZZ_FIRST_PARTIAL, buzzLastPartial(set)].map((one) =>
        buzzXOfHz(buzzPlace(set, one, pitch, rate), buzz),
      )
      rule(ctx, ends[0], sweep, ends[1], sweep, { colour: colours.ink, alpha: INK.text })
      for (const x of ends)
        rule(ctx, x, sweep - 2.5, x, sweep + 2.5, { colour: colours.ink, alpha: INK.text })
    }
    const placeX = buzzXOfHz(place, buzz)
    rule(ctx, placeX, sweep, placeX, floor, { colour: colours.ink, alpha: INK.rule })
    dot(ctx, placeX, sweep, 2.25, awake ? colours.accent : colours.plate, { ring: colours.ink })

    // --- What it is called ---
    let words: readonly [string, string]
    if (awake && state.words && frame.dt > 0 && now - state.since < WORDS_SEC) words = state.words
    else {
      const hz = awake ? reading('place') : place
      words = [
        awake && pitchRead > 0
          ? `Partial ${(hz / pitchRead).toFixed(1)}`
          : set.model === BUZZ_GRAZING
            ? `Partials 3 to ${Math.round(buzzLastPartial(set))}`
            : (frame.spec('model')?.choices?.[set.model] ?? ''),
        hzText(hz),
      ]
      state.words = words
      state.since = now
    }
    text(frame, words[0], layout.left, layout.base, { alpha: INK.text })
    text(frame, words[1], layout.right, layout.base, { align: 'right', alpha: INK.text })

    for (const point of buzzHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: buzzHandles,
})

export const BUZZING_BRIDGE_FACES: Readonly<Record<string, PlateFace>> = {
  // What touches, how far it climbs, where it rings and how it dies; Threshold and Amount are the point.
  'buzzing-bridge': {
    display: buzzingBridge,
    face: ['model', 'curve', 'resonance', 'fall'],
  },
}
