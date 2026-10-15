// The display of Isochronic: an even pulse over time, one lane for each ear.
//
// The lanes show three periods of the pulse as the device shapes it, the left
// ear above the middle line and the right ear below, the right one Offset
// later. They stand still: the time across them is three periods whatever the
// Rate, and the Rate and the length of one period are written over them, so a
// pulse of forty a second is read as a shape and a figure and never as a
// light going on and off. Nothing here moves in time with the pulse.
//
// Under the lanes the glide runs from Rate to Target with a dot at its place,
// which the device reports. Under that are one cycle of the tone as Warmth
// makes it, with the noise Air puts in its place, and the rise and fall of one
// key, lit while a key is held. The foot is the level that comes out, taken
// over the last second.
//
// Everything is the device's own arithmetic: the pulse is `kit::pulse_shape`,
// `kit::pulse_open`, `kit::pulse_floor` and `kit::pulse_gain` of
// `cpp/kit/beat.h`, the glide `kit::RateGlide`, the wave, the noise's level
// and the envelope those of `cpp/devices/isochronic/isochronic.h` and
// `kit::Adsr`. A change of Duty or Edge waits in the device for the next
// pulse; the lanes show the values as they are set.

import {
  INK,
  clamp,
  dot,
  fillTo,
  ground,
  rule,
  text,
  trace,
  type Box,
  type Point,
} from '../display-kit'
import { plateDisplay, type DisplayView, type PlateFace } from '../plate-display'
import { levelFoot } from './instrument-parts'

const wrap = (cycles: number): number => (Number.isFinite(cycles) ? cycles - Math.floor(cycles) : 0)

// --- The device's numbers (`kit/beat.h`, `isochronic.h`, `kit/env.h`) ----------

/** `kit::pulse_shape`: Duty is held to this much of the period at the least and at the most. */
const DUTY_LEAST = 0.01
const DUTY_MOST = 0.99
/** `kit::pulse_shape`: an edge is never shorter than this part of the period. */
const EDGE_LEAST = 1e-6
/** `kSecondPartial` and `kThirdPartial`: the second and third partials against the first at Warmth 1. */
const SECOND_PARTIAL = 0.5
const THIRD_PARTIAL = 0.25
/** `kPeakPoints`: the wave's peak is worked out at this many values of Warmth and read between them. */
const PEAK_POINTS = 17
/** `build_peak_table`, `kSteps`: half a cycle is searched in this many steps for the peak. */
const PEAK_STEPS = 1024
/** `kNoiseRms`: the RMS of a key's noise against the peak of its tone. */
export const ISOCHRONIC_NOISE_RMS = 0.5
/** `kit::Adsr`, `kAttackTarget`: the attack aims this far above the top and is cut off where it gets there. */
const ATTACK_TARGET = 1.3
/** `kit::Adsr`, `kSixtyDb`: a release falls 60 dB in its time. */
const SIXTY_DB = 6.907755279

/** One pulse as the device shapes it: Duty and the edge as parts of the period, the level in the gap, and how far the right ear is behind, in periods. */
export interface IsochronicPulse {
  duty: number
  edge: number
  floor: number
  offset: number
}

/**
 * `kit::pulse_shape` and `kit::pulse_floor`: the pulse at `hz` pulses a second.
 * Edge is asked for in milliseconds and held to half of the shorter of the on
 * time and the gap; Depth `d` leaves `(1 - d)²` in the gap.
 */
export function isochronicPulse(
  hz: number,
  duty: number,
  edgeMs: number,
  depth: number,
  offsetDeg: number,
): IsochronicPulse {
  const d = clamp(duty, DUTY_LEAST, DUTY_MOST)
  const most = 0.5 * Math.min(d, 1 - d)
  const asked = 0.001 * edgeMs * hz
  const deep = clamp(depth, 0, 1)
  return {
    duty: d,
    edge: asked > EDGE_LEAST ? Math.min(asked, most) : EDGE_LEAST,
    floor: (1 - deep) * (1 - deep),
    offset: clamp(offsetDeg, 0, 360) / 360,
  }
}

/**
 * `kit::pulse_open`: how far open the pulse is at `phase` of its period
 * (0..1). It rises from phase 0 over the edge as half a cosine, stays up until
 * Duty and falls over the edge again, so it is on for Duty of the period
 * between the half heights.
 */
export function isochronicOpen(phase: number, pulse: IsochronicPulse): number {
  const { duty, edge } = pulse
  if (!(phase > 0)) return 0
  if (phase < edge) return 0.5 - 0.5 * Math.cos((Math.PI * phase) / edge)
  if (phase < duty) return 1
  const past = phase - duty
  return past < edge ? 0.5 + 0.5 * Math.cos((Math.PI * past) / edge) : 0
}

/** `kit::pulse_gain`: what the pulse lets through, from the level in the gap up to all of it. */
export const isochronicGain = (open: number, floor: number): number => floor + (1 - floor) * open

/** What each ear is let through at `phase` of the one clock: the right ear reads it Offset later. */
export function isochronicEars(phase: number, pulse: IsochronicPulse): [number, number] {
  return [
    isochronicGain(isochronicOpen(wrap(phase), pulse), pulse.floor),
    isochronicGain(isochronicOpen(wrap(phase - pulse.offset), pulse), pulse.floor),
  ]
}

/**
 * `kit::RateGlide`: the rate at `place` of the way from Rate to Target, by
 * ratio (half way in pitch at half time). With Glide at 0 it is Rate.
 */
export function isochronicRate(rate: number, target: number, glide: number, place: number): number {
  if (!(glide > 0) || !(rate > 0) || !(target > 0)) return rate
  return rate * Math.pow(target / rate, clamp(place, 0, 1))
}

/** The tone before it is scaled: the first partial and Warmth of the next two, at `turn` of its cycle. */
const rawWave = (turn: number, warmth: number): number => {
  const x = 2 * Math.PI * turn
  return Math.sin(x) + warmth * (SECOND_PARTIAL * Math.sin(2 * x) + THIRD_PARTIAL * Math.sin(3 * x))
}

let peakTable: number[] | null = null

/**
 * `build_peak_table` and `wave_peak`: the peak of the tone at a Warmth, worked
 * out at seventeen values of Warmth and read between two of them, as the
 * device reads it.
 */
export function isochronicWavePeak(warmth: number): number {
  if (!peakTable) {
    peakTable = []
    for (let k = 0; k < PEAK_POINTS; k++) {
      const w = k / (PEAK_POINTS - 1)
      let most = 0
      for (let n = 0; n <= PEAK_STEPS; n++)
        most = Math.max(most, Math.abs(rawWave((0.5 * n) / PEAK_STEPS, w)))
      peakTable.push(most)
    }
  }
  const place = clamp(warmth, 0, 1) * (PEAK_POINTS - 1)
  const index = Math.min(Math.floor(place), PEAK_POINTS - 2)
  return peakTable[index] + (peakTable[index + 1] - peakTable[index]) * (place - index)
}

/** One cycle of the tone as the device makes it: scaled so its peak is the sine's. */
export function isochronicWave(turn: number, warmth: number): number {
  const w = clamp(warmth, 0, 1)
  return w > 0 ? rawWave(turn, w) / isochronicWavePeak(w) : rawWave(turn, 0)
}

/** How much of the tone and of the noise Air leaves: their powers add, and the ends are all of one. */
export function isochronicMix(air: number): { tone: number; noise: number } {
  const a = clamp(air, 0, 1)
  return {
    tone: a < 1 ? Math.cos(0.5 * Math.PI * a) : 0,
    noise: a > 0 ? Math.sin(0.5 * Math.PI * a) : 0,
  }
}

/** `kit::Adsr`: a key's level `along` its Attack (0..1): it aims above the top and arrives in the set time. */
export const isochronicAttack = (along: number): number =>
  Math.min(
    1,
    ATTACK_TARGET * (1 - Math.pow((ATTACK_TARGET - 1) / ATTACK_TARGET, clamp(along, 0, 1))),
  )

/** `kit::Adsr`: a key's level `along` its Release (0..1): 60 dB down at the end of it. */
export const isochronicRelease = (along: number): number => Math.exp(-SIXTY_DB * clamp(along, 0, 1))

/** A rate as it is written: "0.8 Hz", "10 Hz". */
export function isochronicRateText(hz: number): string {
  return `${hz < 9.95 ? hz.toFixed(1) : String(Math.round(hz))} Hz`
}

/** The length of one period as it is written: "25 ms", "1.3 s". */
export function isochronicPeriodText(hz: number): string {
  const ms = 1000 / hz
  return ms < 999.5 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`
}

/** The time a glide has left as it is written: "0:42", "12:08". */
export function isochronicTimeText(seconds: number): string {
  const whole = Math.max(0, Math.ceil(seconds - 1e-9))
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

// --- Where things stand -------------------------------------------------------

/** The lanes show this many periods of the pulse, whatever the Rate. */
export const ISOCHRONIC_PERIODS = 3
/** The glide's place and the rate there are taken from the device this often while a glide runs, in seconds. */
const TAKE_SEC = 0.5
/** The level is taken over this long, so it does not follow the pulse. */
export const ISOCHRONIC_LEVEL_SEC = 1
/** The level's bar moves only when the level has moved by this share of its scale (1.2 dB). */
const LEVEL_STEP = 0.02
/** The foot of the level's scale, dB under full scale. */
const LEVEL_FLOOR_DB = -60

export interface IsochronicLayout {
  /** The line the Rate and the period are written on, and the ends of the words. */
  words: number
  left: number
  right: number
  /** Both lanes; `mid` is the line they grow from and `lane` how high each stands. */
  lanes: Box
  mid: number
  lane: number
  /** The glide's line: from Rate at `x` to Target at `x + w`, `reach` up or down from `y`; `row` is where its time is written. */
  glide: { x: number; w: number; y: number; reach: number; row: number }
  /** One cycle of the tone. */
  wave: Box
  /** One key's rise and fall. */
  envelope: Box
  /** The level over the last second. */
  foot: Box
}

/** Laid out from the size it is given. */
export function isochronicLayout(view: Pick<DisplayView, 'width' | 'height'>): IsochronicLayout {
  const { width, height } = view
  const left = 5
  const right = width - 5
  const lane = clamp(Math.floor((height - 66) / 2), 5, 40)
  const top = 15
  const lanes: Box = { x: left, y: top, w: Math.max(12, right - left - 9), h: 2 * lane + 1 }
  const under = top + lanes.h
  const wave: Box = {
    x: left,
    y: under + 15,
    w: clamp(Math.round((right - left) * 0.36), 20, 80),
    h: 20,
  }
  return {
    words: 11,
    left,
    right,
    lanes,
    mid: top + lane + 0.5,
    lane,
    glide: {
      x: left + 2,
      w: Math.max(8, right - left - 34),
      y: under + 8,
      reach: 3,
      row: under + 11,
    },
    wave,
    envelope: {
      x: wave.x + wave.w + 6,
      y: wave.y,
      w: Math.max(8, right - wave.x - wave.w - 6),
      h: 20,
    },
    foot: { x: left, y: wave.y + wave.h + 5, w: right - left, h: 4 },
  }
}

/**
 * One ear's lane as points: the time in periods across the lanes (0 to
 * `ISOCHRONIC_PERIODS`) and what the ear is let through there. `behind` is how
 * far the ear reads the clock behind, in periods (the right ear's Offset). The
 * points stand on the corners of every pulse and, up each rise and down each
 * fall, about every pixel and a half of a lane `wide` pixels across.
 */
export function isochronicLanePoints(
  pulse: IsochronicPulse,
  behind: number,
  wide: number,
): [number, number][] {
  const period = wide / ISOCHRONIC_PERIODS
  const parts = clamp(Math.ceil((pulse.edge * period) / 1.5), 2, 16)
  const breaks: number[] = []
  for (let i = 0; i <= parts; i++) breaks.push((pulse.edge * i) / parts)
  for (let i = 0; i <= parts; i++) breaks.push(pulse.duty + (pulse.edge * i) / parts)
  const times = [0, ISOCHRONIC_PERIODS]
  for (let k = -1; k <= ISOCHRONIC_PERIODS; k++) {
    for (const at of breaks) {
      const time = k + behind + at
      if (time > 0 && time < ISOCHRONIC_PERIODS) times.push(time)
    }
  }
  times.sort((a, b) => a - b)
  return times.map((time) => [
    time,
    isochronicGain(isochronicOpen(wrap(time - behind), pulse), pulse.floor),
  ])
}

/** A stretch of noise that stands still, with a root mean square of 1: the noise of Air is drawn through it. */
const NOISE = (() => {
  const raw = [0.9, -1.4, 0.3, 1.6, -0.7, -1.1, 0.5, 1.2, -1.5, 0.2, 0.8, -0.4, -1.3, 1.0, -0.2]
  const rms = Math.sqrt(raw.reduce((sum, value) => sum + value * value, 0) / raw.length)
  return raw.map((value) => value / rms)
})()

/** The noise of Air across the wave's box, as heights from its middle line in parts of the tone's peak. */
export function isochronicNoisePoints(air: number): number[] {
  const { noise } = isochronicMix(air)
  return NOISE.map((value) => value * noise * ISOCHRONIC_NOISE_RMS)
}

// --- The display --------------------------------------------------------------

interface IsochronicState {
  /** The knobs the glide is made of, as they stood when its place was last taken. */
  rate: number
  target: number
  glide: number
  /** The glide's place as it was last taken from the device, and when. */
  place: number
  takenAt: number
  /** The mean squares of the sound that came out in the last second, each with the time it stands for. */
  heard: { at: number; square: number; dt: number }[]
  /** The level the foot shows, as a share of its scale. */
  shown: number
}

const isochronic = plateDisplay<IsochronicState>({
  place: 'window',
  columns: 2,
  params: [
    'rate',
    'duty',
    'edge',
    'depth',
    'offset',
    'warmth',
    'air',
    'target',
    'glide',
    'attack',
    'release',
  ],
  live: { meters: true, signal: true, notes: true },
  info: 'Three periods of the pulse, the left ear above the line and the right ear below, under the rate and the length of one period. Below, the glide from Rate to Target with a dot at its place, one cycle of the tone with the noise of Air, the rise and fall of a key, and the level over the last second.',
  init: () => ({
    rate: NaN,
    target: NaN,
    glide: NaN,
    place: 0,
    takenAt: 0,
    heard: [],
    shown: 0,
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const lay = isochronicLayout(frame)
    const rate = frame.value('rate')
    const target = frame.value('target')
    const glide = frame.value('glide')
    const gliding = glide > 0

    // Where the glide is: the device's reading. It is taken when a knob of the
    // glide moves and otherwise twice a second, so nothing drawn from it moves
    // more often than that.
    const read = frame.powered && gliding && frame.hasMeter('glide') ? frame.meter('glide') : 0
    const reading = Number.isFinite(read) ? clamp(read, 0, 1) : 0
    const moved = rate !== state.rate || target !== state.target || glide !== state.glide
    const since = frame.now - state.takenAt
    if (moved || frame.dt <= 0 || !(since >= 0) || since >= TAKE_SEC) {
      state.rate = rate
      state.target = target
      state.glide = glide
      state.place = reading
      state.takenAt = frame.now
    }
    const now = isochronicRate(rate, target, glide, state.place)
    const pulse = isochronicPulse(
      now,
      frame.value('duty'),
      frame.value('edge'),
      frame.value('depth'),
      frame.value('offset'),
    )

    // --- The pulse over three periods, a lane for each ear ---
    const { lanes, mid, lane } = lay
    const across = (time: number): number => lanes.x + (time / ISOCHRONIC_PERIODS) * lanes.w
    const upper: Point[] = isochronicLanePoints(pulse, 0, lanes.w).map(([time, gain]) => [
      across(time),
      mid - 0.5 - gain * lane,
    ])
    const lower: Point[] = isochronicLanePoints(pulse, pulse.offset, lanes.w).map(
      ([time, gain]) => [across(time), mid + 0.5 + gain * lane],
    )
    fillTo(ctx, upper, mid - 0.5, colours.ink)
    fillTo(ctx, lower, mid + 0.5, colours.ink)
    rule(ctx, lanes.x, mid, lanes.x + lanes.w, mid, { colour: colours.ink, alpha: INK.rule })
    for (let period = 0; period <= ISOCHRONIC_PERIODS; period++) {
      const x = across(period)
      rule(ctx, x, mid - 2.5, x, mid + 2.5, { colour: colours.ink, alpha: INK.rule })
    }
    trace(ctx, upper, { colour: colours.ink, width: 1.25 })
    trace(ctx, lower, { colour: colours.ink, width: 1.25 })
    text(frame, 'L', lay.right, lanes.y + lane / 2 + 3, { align: 'right', alpha: INK.text })
    text(frame, 'R', lay.right, mid + 0.5 + lane / 2 + 3, { align: 'right', alpha: INK.text })
    text(frame, isochronicRateText(now), lay.left, lay.words)
    text(frame, isochronicPeriodText(now), lay.right, lay.words, {
      align: 'right',
      alpha: INK.text,
    })

    // --- The glide: Rate at the left, Target at the right, a dot where it is ---
    const line = lay.glide
    if (gliding) {
      const lowest = frame.spec('rate')?.min ?? 0.5
      const highest = frame.spec('rate')?.max ?? 40
      const heightOf = (hz: number): number => {
        const share = Math.log(clamp(hz, lowest, highest) / lowest) / Math.log(highest / lowest)
        return line.y + line.reach * (1 - 2 * share)
      }
      const from = heightOf(rate)
      const to = heightOf(target)
      rule(ctx, line.x, line.y - 4, line.x, line.y + 4, { colour: colours.ink, alpha: INK.rule })
      rule(ctx, line.x + line.w, line.y - 4, line.x + line.w, line.y + 4, {
        colour: colours.ink,
        alpha: INK.rule,
      })
      trace(
        ctx,
        [
          [line.x, from],
          [line.x + line.w, to],
        ],
        { colour: colours.ink, width: 1, alpha: INK.back },
      )
      dot(
        ctx,
        line.x + state.place * line.w,
        from + (to - from) * state.place,
        2.5,
        colours.accent,
        { ring: colours.ink },
      )
      text(frame, isochronicTimeText((1 - state.place) * glide * 60), lay.right, line.row, {
        align: 'right',
        alpha: INK.text,
      })
    } else {
      rule(ctx, line.x, line.y, line.x + line.w, line.y, { colour: colours.ink, alpha: INK.grid })
    }

    // --- One cycle of the tone, and the noise Air puts in its place ---
    const { wave } = lay
    const centre = wave.y + wave.h / 2
    const high = wave.h / 2 - 1
    const warmth = frame.value('warmth')
    const air = frame.value('air')
    const mix = isochronicMix(air)
    rule(ctx, wave.x, centre, wave.x + wave.w, centre, { colour: colours.ink, alpha: INK.grid })
    if (mix.noise > 0) {
      const heights = isochronicNoisePoints(air)
      trace(
        ctx,
        heights.map((value, i): Point => [
          wave.x + (i / (heights.length - 1)) * wave.w,
          centre - clamp(value, -1, 1) * high,
        ]),
        { colour: colours.ink, width: 1, alpha: INK.back },
      )
    }
    if (mix.tone > 1e-6) {
      const cycle: Point[] = []
      const steps = Math.max(16, Math.round(wave.w / 1.5))
      for (let i = 0; i <= steps; i++)
        cycle.push([
          wave.x + (i / steps) * wave.w,
          centre - mix.tone * isochronicWave(i / steps, warmth) * high,
        ])
      trace(ctx, cycle, { colour: colours.ink, width: 1.5 })
    }

    // --- One key's rise and fall, lit while a key is held ---
    const { envelope } = lay
    const foot = envelope.y + envelope.h - 0.5
    const top = envelope.y + 1.5
    const rise = Math.max(1.5, frame.at('attack') * 0.42 * envelope.w)
    const fall = Math.max(1.5, frame.at('release') * 0.42 * envelope.w)
    const letGo = envelope.x + envelope.w - fall
    const rising: Point[] = []
    const falling: Point[] = []
    for (let i = 0; i <= 12; i++) {
      rising.push([envelope.x + (i / 12) * rise, foot - isochronicAttack(i / 12) * (foot - top)])
      falling.push([letGo + (i / 12) * fall, foot - isochronicRelease(i / 12) * (foot - top)])
    }
    const whole: Point[] = [...rising, ...falling]
    fillTo(ctx, whole, foot, colours.ink)
    rule(ctx, envelope.x, foot, envelope.x + envelope.w, foot, {
      colour: colours.ink,
      alpha: INK.rule,
    })
    trace(ctx, whole, { colour: colours.ink, width: 1 })
    if (frame.powered) {
      const release = frame.value('release')
      // A key is lit for as long as it is held, and its fall for as long as it takes.
      if (frame.notes.some((note) => note.released === null))
        trace(ctx, [...rising, falling[0]], { colour: colours.accent, width: 1.5 })
      if (frame.notes.some((note) => note.released !== null && note.released < release))
        trace(ctx, falling, { colour: colours.accent, width: 1.5 })
    }

    // --- The level that comes out, over the last second ---
    // Each frame's reading stands for the time since the frame before it, and
    // the mean is taken over the whole second, so time with nothing read counts
    // as silence and a level that pulses is read as its mean.
    const rms = frame.powered && frame.signal ? frame.signal.output.rms : NaN
    if (!Number.isFinite(rms) || !(frame.dt >= 0) || frame.dt > ISOCHRONIC_LEVEL_SEC) {
      state.heard = []
      state.shown = 0
    } else {
      if (frame.dt > 0) state.heard.push({ at: frame.now, square: rms * rms, dt: frame.dt })
      const from = frame.now - ISOCHRONIC_LEVEL_SEC
      state.heard = state.heard.filter((one) => one.at > from && one.at <= frame.now)
      let sum = 0
      for (const one of state.heard) sum += one.square * Math.min(one.dt, one.at - from)
      const mean = sum / ISOCHRONIC_LEVEL_SEC
      const db = mean > 1e-12 ? 10 * Math.log10(mean) : LEVEL_FLOOR_DB
      const share = clamp(1 - db / LEVEL_FLOOR_DB, 0, 1)
      // The bar moves when the level has moved by a step, and to its ends.
      const end = share <= 0 || share >= 1
      if (Math.abs(share - state.shown) > LEVEL_STEP || (end && share !== state.shown))
        state.shown = share
    }
    levelFoot(frame, lay.foot, state.shown)
  },
})

export const ISOCHRONIC_FACES: Readonly<Record<string, PlateFace>> = {
  isochronic: {
    display: isochronic,
    face: ['rate', 'duty', 'depth', 'offset'],
    sections: [
      ['rate', 'duty', 'edge', 'depth', 'offset'],
      ['warmth', 'air'],
      ['target', 'glide'],
      ['attack', 'release', 'volume'],
    ],
  },
}
