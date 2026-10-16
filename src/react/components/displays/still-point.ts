// The display of Still Point: held keys as level lines, and the one sine's
// slow path through them. Across is one whole turn of the sweep (a pass up and
// a pass down, twice Time), upward is pitch. The dashed lines are the limits,
// Reach under the lowest held key and Reach over the highest; the bent line is
// the path the sine takes between them; a ring stands where it meets a key,
// which is where the beat between the two falls still. The dot is the sine
// now. Under the picture are the next meeting and the beat with the nearest
// key, as a rate in figures.
//
// Nothing here moves in time with the beat. The picture stands still along its
// time axis and one mark crosses it once in twice Time, eight seconds at the
// least. The beat is said as a number, never drawn as a wave or a light, and
// the level that comes out is the mean of one second, moved in steps of half a
// decibel and turned no more than four times a second, so a sound that beats
// ten times a second does not flicker.
//
// Everything is the device's own arithmetic (`cpp/devices/still-point/still_point.h`
// and the envelope of `cpp/kit/env.h`). While it sounds the device reports the
// sine's pitch, the two limits and the sine's gate, and the display draws
// those; from the notes alone it works the same figures out again
// (`stillPointReplay`), which is what it draws until the first reading comes
// and what its test holds to the readings. The replay knows what the notes
// tell it: with more keys held than the device has voices, or with Time or
// Reach moved in mid sweep, only the readings are right.

import {
  INK,
  clamp,
  dot,
  fillRect,
  ground,
  label,
  rule,
  text,
  trace,
  type Box,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayNote,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import { levelFoot, pitchName } from './instrument-parts'

const wrap = (cycles: number): number => (Number.isFinite(cycles) ? cycles - Math.floor(cycles) : 0)

// --- The device's numbers (`still_point.h`, `kit/env.h`) ----------------------

/** `kLimitSeconds`: the limits follow the held keys through two one poles in a row, each of this many seconds. */
export const STILL_POINT_LIMIT_SECONDS = 0.4
/** `kit::Adsr`, `kAttackTarget`: the attack aims this far above full and is cut off at full. */
const ATTACK_TARGET = 1.3
/** `kit::Adsr`, `kSixtyDb`: a release covers 60 dB in the set time. */
const SIXTY_DB = 6.907755279
/** `kit::Adsr`, `kIdleLevel`: under this a voice has ended. */
const IDLE_LEVEL = 1.0e-5
/** The frames the engine hands the device at a time: keys that reach it in one of them land together. */
const BLOCK_SECONDS = 128 / 48000

/** `pitch_of`: a frequency in semitones on the MIDI scale, 69 the A at 440 Hz. */
export const stillPointKey = (hz: number): number => 69 + 12 * Math.log2(Math.max(hz, 1e-3) / 440)

/** `sine_increment_at`: the frequency of a pitch, in hertz. */
export const stillPointHz = (pitch: number): number => 440 * Math.pow(2, (pitch - 69) / 12)

/** `triangle`: the share of the way up for a place in the turn. */
export const stillPointTriangle = (phase: number): number =>
  phase < 0.5 ? 2 * phase : 2 - 2 * phase

/** `control`: the sweep clock turns 0.5 / Time times a second, so a pass from limit to limit takes Time. */
export const stillPointPhase = (seconds: number, time: number): number =>
  wrap((0.5 * seconds) / time)

/** `pitch_at`: the sine's pitch for a place in the turn, between the limits as they stand. */
export const stillPointPitch = (phase: number, low: number, high: number): number =>
  low + stillPointTriangle(phase) * (high - low)

/** A step through the two one poles: 1 - (1 + t/T) e^(-t/T), which starts with no slope. */
export function stillPointGlide(seconds: number): number {
  if (!(seconds > 0)) return 0
  const t = seconds / STILL_POINT_LIMIT_SECONDS
  return 1 - (1 + t) * Math.exp(-t)
}

/** `kit::Adsr`, the attack: how far a key has come in so many seconds. */
export function stillPointAttack(seconds: number, attack: number): number {
  if (!(seconds > 0)) return 0
  const left = Math.pow((ATTACK_TARGET - 1) / ATTACK_TARGET, seconds / Math.max(attack, 1e-6))
  return Math.min(1, ATTACK_TARGET * (1 - left))
}

/** `kit::Adsr`, the release: what is left of a key so many seconds after it is let go. */
export const stillPointFade = (seconds: number, release: number): number =>
  Math.exp((-SIXTY_DB * Math.max(0, seconds)) / Math.max(release, 1e-6))

/** How long a key let go at `level` goes on before its voice ends, in seconds. */
export const stillPointRings = (level: number, release: number): number =>
  level > IDLE_LEVEL ? (release * Math.log(level / IDLE_LEVEL)) / SIXTY_DB : 0

/** The beat between the sine and a key: the difference of their frequencies, in hertz. */
export const stillPointBeat = (sine: number, key: number): number =>
  Math.abs(stillPointHz(sine) - stillPointHz(key))

/**
 * When the sine meets a pitch, in seconds from the start of a turn: once on
 * the way up and once on the way down. Null for a pitch outside the limits.
 */
export function stillPointMeetings(
  pitch: number,
  low: number,
  high: number,
  time: number,
): [number, number] | null {
  if (!(high > low) || pitch < low || pitch > high) return null
  const share = (pitch - low) / (high - low)
  return [share * time, (2 - share) * time]
}

/** Seconds until the sine, at `phase` of its turn, next meets a pitch; never, for a pitch outside the limits. */
export function stillPointUntil(
  pitch: number,
  phase: number,
  low: number,
  high: number,
  time: number,
): number {
  const meetings = stillPointMeetings(pitch, low, high, time)
  if (!meetings) return Infinity
  const now = phase * 2 * time
  let least = Infinity
  for (const at of meetings) {
    const wait = at >= now ? at - now : at + 2 * time - now
    if (wait < least) least = wait
  }
  return least
}

// --- The notes played through again --------------------------------------------

/** The knobs the replay needs. */
export interface StillPointSetting {
  time: number
  reach: number
  attack: number
  release: number
}

/** Where the sweep stands, worked out from the notes alone. */
export interface StillPointRun {
  /** The limits, Reach past the outer keys as the two poles have them. */
  low: number
  high: number
  /** The place in the turn: 0 at the lower limit going up, a half at the upper. */
  phase: number
  /** Seconds since the key that began it arrived out of silence. */
  since: number
}

interface Played {
  on: number
  off: number | null
  pitch: number
  /** When its voice ends; never, while it is held. */
  ends: number
}

/** A value and the pole before it, on their way to a target for so many seconds. */
function follow(pair: { lag: number; value: number }, target: number, seconds: number): void {
  const t = seconds / STILL_POINT_LIMIT_SECONDS
  const left = Math.exp(-t)
  const lag = pair.lag - target
  pair.value = target + (pair.value - target) * left + lag * t * left
  pair.lag = target + lag * left
}

/**
 * The device's sweep from the notes it was sent, times in seconds before now.
 * `note_on` and `restart`: the sweep begins again at the lower limit when a
 * key arrives with no voice sounding, and the limits are then on the keys
 * that land with it. `retarget` and `control`: after that the limits follow
 * the lowest and the highest held key through the two poles while a key is
 * held, and stand still while none is. Null when no voice sounds any more.
 */
export function stillPointReplay(
  notes: readonly DisplayNote[],
  set: StillPointSetting,
): StillPointRun | null {
  const played: Played[] = notes
    .map((note) => {
      const on = -note.age
      const off = note.released === null ? null : Math.max(on, -note.released)
      const level = off === null ? 1 : stillPointAttack(off - on, set.attack)
      return {
        on,
        off,
        pitch: stillPointKey(note.frequency),
        ends: off === null ? Infinity : off + stillPointRings(level, set.release),
      }
    })
    .sort((a, b) => a.on - b.on)
  // The run that sounds now began with the last key that found every voice ended.
  let first = 0
  let sounding = -Infinity
  for (let i = 0; i < played.length; i++) {
    if (played[i].on >= sounding) first = i
    sounding = Math.max(sounding, played[i].ends)
  }
  if (played.length === 0 || !(sounding > 0)) return null
  const run = played.slice(first)
  const start = run[0].on
  // What is held at a moment: the keys that have landed and are not let go.
  const outer = (at: number): [number, number] | null => {
    let low = Infinity
    let high = -Infinity
    for (const key of run) {
      if (key.on > at || (key.off !== null && key.off <= at)) continue
      low = Math.min(low, key.pitch)
      high = Math.max(high, key.pitch)
    }
    return high >= low ? [low, high] : null
  }
  const landed = outer(start + BLOCK_SECONDS) ?? [run[0].pitch, run[0].pitch]
  const low = { lag: landed[0], value: landed[0] }
  const high = { lag: landed[1], value: landed[1] }
  // From one change of the held keys to the next, the poles move on toward the outer ones.
  const changes = [0]
  for (const key of run) {
    if (key.on > start + BLOCK_SECONDS && key.on < 0) changes.push(key.on)
    if (key.off !== null && key.off > start && key.off < 0) changes.push(key.off)
  }
  changes.sort((a, b) => a - b)
  let from = start
  for (const to of changes) {
    if (to <= from) continue
    const held = outer(0.5 * (from + to))
    if (held) {
      follow(low, held[0], to - from)
      follow(high, held[1], to - from)
    }
    from = to
  }
  return {
    low: low.value - set.reach,
    high: high.value + set.reach,
    phase: stillPointPhase(-start, set.time),
    since: -start,
  }
}

// --- Where things stand ---------------------------------------------------------

/** The least the picture shows either side of its middle, in semitones: a small Reach is seen as small. */
const LEAST_HALF_ST = 2
/** Room kept above the upper limit and under the lower, as a share of the height shown. */
const HEADROOM = 1.12

export interface StillPointLayout {
  /** One turn across, the pitches shown from its foot to its top. */
  plot: Box
  /** The line the words are written on. */
  base: number
  /** The bar that fills with the level coming out. */
  foot: Box
}

export function stillPointLayout(view: Pick<DisplayView, 'width' | 'height'>): StillPointLayout {
  const { width, height } = view
  const foot: Box = { x: 4, y: height - 7, w: width - 8, h: 3 }
  const base = foot.y - 3
  return { plot: { x: 6, y: 6, w: width - 12, h: Math.max(8, base - 10 - 6) }, base, foot }
}

/** The pitches at the foot and the top of the picture, for limits and keys that all have to be on it. */
export function stillPointSpan(
  low: number,
  high: number,
  keys: readonly number[],
): { bottom: number; top: number } {
  const least = Math.min(low, ...keys)
  const most = Math.max(high, ...keys)
  const middle = 0.5 * (least + most)
  const half = Math.max(0.5 * (most - least), LEAST_HALF_ST) * HEADROOM
  return { bottom: middle - half, top: middle + half }
}

/** A figure as the display says it: with one decimal under ten, whole from there. */
const figure = (value: number): string =>
  value < 9.95 ? value.toFixed(1) : String(Math.round(value))

/** A length of time as the display says it: "4.2 s", "42 s". */
export const stillPointSeconds = (seconds: number): string => `${figure(seconds)} s`

/** A beat as the display says it: "0.4 Hz", "3.2 Hz", "41 Hz". */
export const stillPointRate = (hz: number): string => `${figure(hz)} Hz`

// --- The level that comes out -----------------------------------------------------

/** The level at the foot is the mean of this long, so a sound that beats is drawn at its mean and not in time. */
export const STILL_POINT_LEVEL_SECONDS = 1
/** Having turned, the level drawn does not turn again for this long: four turns a second at the most. */
export const STILL_POINT_TURN_SECONDS = 0.25
/** The level drawn stays where it is until the mean has moved this far from it, in decibels. */
export const STILL_POINT_STEP_DB = 0.5
/** The scale of the foot: a level this far under full scale leaves it empty. */
const FOOT_FLOOR_DB = -60

/** What the foot keeps between frames. */
export interface StillPointLevel {
  /** When each reading of the last second was taken, and its power. */
  times: number[]
  powers: number[]
  /** The share of the foot that is filled, the way it last moved, and when it last turned. */
  shown: number
  way: number
  turned: number
}

export const stillPointLevelStart = (): StillPointLevel => ({
  times: [],
  powers: [],
  shown: 0,
  way: 0,
  turned: -Infinity,
})

/**
 * The share of the foot to fill at `now`, from the level read on this frame
 * (`rms`, linear; null while no sound is read, which empties it): the mean
 * power of the last second on a scale of 60 dB, left where it stands until
 * the mean is half a decibel away, and held when it would turn sooner than a
 * quarter of a second after its last turn.
 */
export function stillPointLevel(level: StillPointLevel, now: number, rms: number | null): number {
  if (rms === null || !Number.isFinite(rms)) {
    level.times.length = 0
    level.powers.length = 0
    level.shown = 0
    level.way = 0
    return 0
  }
  level.times.push(now)
  level.powers.push(rms * rms)
  while (level.times.length > 0 && !(level.times[0] > now - STILL_POINT_LEVEL_SECONDS)) {
    level.times.shift()
    level.powers.shift()
  }
  let sum = 0
  for (const power of level.powers) sum += power
  const mean = sum / Math.max(1, level.powers.length)
  const share = mean > 0 ? clamp(1 - (10 * Math.log10(mean)) / FOOT_FLOOR_DB, 0, 1) : 0
  const way = Math.sign(share - level.shown)
  if (way === 0) return level.shown
  // A mean that has hardly moved is not drawn again; a sound that has stopped still empties the foot.
  if (share > 0 && Math.abs(share - level.shown) < STILL_POINT_STEP_DB / -FOOT_FLOOR_DB)
    return level.shown
  if (level.way !== 0 && way !== level.way) {
    if (now - level.turned < STILL_POINT_TURN_SECONDS) return level.shown
    level.turned = now
  }
  level.way = way
  level.shown = share
  return share
}

// --- The display ----------------------------------------------------------------

/** The key the picture is drawn about while nothing is played. */
const REST_KEY = 69
/** A key is drawn while it is over 60 dB down from full: `kit::Adsr` covers that in Release. */
const HEARD = 1.0e-3
/** How faint the line of a key that has only begun to fade in, or has nearly gone, is drawn. */
export const STILL_POINT_FAINTEST = 0.35

interface StillPointState {
  /** The last readings: the sine's pitch and place between the limits, and the limits. */
  sine: number
  place: number | null
  low: number
  high: number
  /** Which way the sine was going at the last reading that told. */
  up: boolean
  /** The level that comes out, over the last second. */
  level: StillPointLevel
}

type Draw = DisplayFrame<StillPointState>

/** The line of one key, as strong as the key sounds. */
function keyLine(frame: Draw, plot: Box, y: number, colour: string, level: number): void {
  rule(frame.ctx, plot.x, y, plot.x + plot.w, y, {
    colour,
    width: 1.25,
    alpha: STILL_POINT_FAINTEST + (1 - STILL_POINT_FAINTEST) * clamp(level, 0, 1),
  })
}

const stillPoint = plateDisplay<StillPointState>({
  place: 'window',
  params: ['time', 'reach', 'level', 'attack', 'release'],
  live: { meters: true, signal: true, notes: true },
  info: 'One turn of the sweep across, pitch upward: the dashed limits, the path of the sine between them, a lit line for each held key and a ring where the sine meets it. The dot is the sine now. Below, the next meeting and the beat with the nearest key.',
  init: () => ({ sine: 0, place: null, low: 0, high: 0, up: true, level: stillPointLevelStart() }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const lay = stillPointLayout(frame)
    const { plot } = lay
    const set: StillPointSetting = {
      time: Math.max(frame.value('time'), 1e-3),
      reach: Math.max(frame.value('reach'), 0),
      attack: frame.value('attack'),
      release: frame.value('release'),
    }

    // The keys that sound: held, or let go and not yet 60 dB down.
    const keys: { pitch: number; held: boolean; level: number }[] = []
    if (frame.powered) {
      for (const note of frame.notes) {
        const held = note.released === null
        const came = stillPointAttack(note.age - (note.released ?? 0), set.attack)
        const level = held ? came : came * stillPointFade(note.released ?? 0, set.release)
        if (held || level > HEARD) keys.push({ pitch: stillPointKey(note.frequency), held, level })
      }
    }
    const pitches = keys.map((key) => key.pitch)
    const heldPitches = keys.filter((key) => key.held).map((key) => key.pitch)

    // Where the sweep stands: the device's readings while it sounds, else the notes played through again.
    const gate = frame.hasMeter('gate') ? frame.meter('gate') : 0
    const replay = (): StillPointRun | null =>
      frame.powered ? stillPointReplay(frame.notes, set) : null
    const metered =
      frame.powered &&
      gate > 0 &&
      frame.hasMeter('sine') &&
      frame.hasMeter('low') &&
      frame.hasMeter('high')
    let low = REST_KEY - set.reach
    let high = REST_KEY + set.reach
    let phase: number | null = null
    if (metered) {
      low = frame.meter('low')
      high = Math.max(low, frame.meter('high'))
      const sine = frame.meter('sine')
      const place = high > low ? clamp((sine - low) / (high - low), 0, 1) : 0
      if (state.place === null || frame.dt <= 0) {
        const played = replay()
        state.up = played ? played.phase < 0.5 : true
      } else if (
        Math.abs(low - state.low) + Math.abs(high - state.high) <
        0.2 * Math.abs(sine - state.sine)
      ) {
        // The reading tells which way the sine goes only while the limits stand: while they glide its place moves with them.
        state.up = place > state.place
      }
      state.sine = sine
      state.place = place
      state.low = low
      state.high = high
      phase = state.up ? 0.5 * place : 1 - 0.5 * place
    } else {
      state.place = null
      const played = replay()
      if (played) {
        low = played.low
        high = Math.max(low, played.high)
        phase = played.phase
      }
    }

    const span = stillPointSpan(low, high, pitches)
    const yOf = (pitch: number): number =>
      plot.y + ((span.top - pitch) / (span.top - span.bottom)) * plot.h
    const xOf = (seconds: number): number => plot.x + (seconds / (2 * set.time)) * plot.w
    const right = plot.x + plot.w
    const foot = plot.y + plot.h

    // The turn in the middle of the picture: up to it the sine climbs, after it the sine comes down.
    rule(ctx, xOf(set.time), plot.y, xOf(set.time), foot, { colour: colours.ink, alpha: INK.grid })
    // What is held, from its lowest key to its highest.
    if (heldPitches.length > 1) {
      const top = yOf(Math.max(...heldPitches))
      fillRect(
        ctx,
        { x: plot.x, y: top, w: plot.w, h: yOf(Math.min(...heldPitches)) - top },
        colours.ink,
        INK.fill,
      )
    }
    // The limits.
    for (const limit of [high, low]) {
      rule(ctx, plot.x, yOf(limit), right, yOf(limit), {
        colour: colours.ink,
        alpha: INK.back,
        dash: [3, 2],
      })
    }
    // The keys: lit while held, in the ink while they ring out, and one plain line at rest.
    for (const key of keys)
      keyLine(frame, plot, yOf(key.pitch), key.held ? colours.accent : colours.ink, key.level)
    if (keys.length === 0 && phase === null)
      rule(ctx, plot.x, yOf(REST_KEY), right, yOf(REST_KEY), {
        colour: colours.ink,
        alpha: INK.rule,
      })
    // The path of the sine through one turn, and a ring wherever it meets a key.
    trace(
      ctx,
      [
        [xOf(0), yOf(low)],
        [xOf(set.time), yOf(high)],
        [xOf(2 * set.time), yOf(low)],
      ],
      { colour: colours.ink, width: 1.5 },
    )
    for (const pitch of keys.length > 0 || phase !== null ? pitches : [REST_KEY]) {
      for (const at of stillPointMeetings(pitch, low, high, set.time) ?? [])
        dot(ctx, xOf(at), yOf(pitch), 2, colours.plate, { ring: colours.ink })
    }

    // The sine now.
    if (phase !== null) {
      const x = xOf(phase * 2 * set.time)
      rule(ctx, x, plot.y, x, foot, { colour: colours.accent, alpha: INK.back })
      dot(
        ctx,
        x,
        yOf(stillPointPitch(phase, low, high)),
        1.5 + 2 * clamp(frame.value('level'), 0, 1),
        colours.accent,
        { ring: colours.ink },
      )
    }

    // The outer keys by name, and under the picture what comes next.
    if (pitches.length > 0) {
      const most = Math.max(...pitches)
      const least = Math.min(...pitches)
      label(frame, pitchName(stillPointHz(most)), plot.x + 1, yOf(most) - 2)
      if (least < most)
        label(frame, pitchName(stillPointHz(least)), xOf(set.time) + 3, yOf(least) - 2)
    }
    if (phase !== null && pitches.length > 0) {
      const sine = stillPointPitch(phase, low, high)
      let wait = Infinity
      let next = pitches[0]
      let beat = Infinity
      for (const pitch of pitches) {
        const until = stillPointUntil(pitch, phase, low, high, set.time)
        if (until < wait) [wait, next] = [until, pitch]
        beat = Math.min(beat, stillPointBeat(sine, pitch))
      }
      const name = pitchName(stillPointHz(next))
      text(
        frame,
        Number.isFinite(wait) ? `${name} in ${stillPointSeconds(wait)}` : name,
        plot.x,
        lay.base,
      )
      text(frame, `beat ${stillPointRate(beat)}`, right, lay.base, { align: 'right' })
    } else {
      text(frame, `${stillPointSeconds(set.time)} a pass`, plot.x, lay.base)
      text(frame, `${figure(set.reach)} st past`, right, lay.base, { align: 'right' })
    }

    // The level that comes out: the mean of the last second, so a sound that beats does not make the foot beat.
    const rms = frame.powered && frame.signal ? frame.signal.output.rms : null
    levelFoot(frame, lay.foot, stillPointLevel(state.level, frame.now, rms))
  },
})

export const STILL_POINT_FACES: Readonly<Record<string, PlateFace>> = {
  'still-point': { display: stillPoint, face: ['time', 'reach', 'level', 'ears'] },
}
