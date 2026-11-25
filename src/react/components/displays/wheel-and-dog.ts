// The display of Wheel and Dog: one turn of the wheel, and why it barks.
//
// On the left the turn is a ring that begins at the top and runs clockwise.
// Its distance from the axle (the inner circle, a wheel at a stand) is the
// bow's speed at that place of the turn: the faint circle is the even wheel,
// and each push of the hand stands out of it as far as Depth throws it. Where
// the dog stands open the ring is thick.
// The ring stands still; a mark on it is where the wheel is now, at the place
// the device reports. It is drawn only while Speed is under three turns a
// second, and it rides over the pushes only while they come at two a second
// or slower: past that it keeps to the even circle.
//
// On the right is what opens the dog: the jerk of each push (the change of
// the bow's speed, which at full turning is about Depth where the push takes
// its full 22 ms), against the line the dog comes loose at. What stands over
// the line barks. The scale is by the square root, so the line has room.
//
// Under them, the notes of the strings: the three drones as Drone, Tuning and
// the keys set them, and the melody, or the note it begins at. A drone with
// some level has a faint line under its name; the strings that sound are
// underlined in the accent.
//
// All of it is the device's own arithmetic (`wheel_and_dog.h`; the constants
// carry its names), and the place in the turn, the bark, the melody and the
// bow's speed are its own readings.

import {
  INK,
  clamp,
  dot,
  fillRect,
  fillTo,
  follow,
  ground,
  handle,
  rule,
  text,
  trace,
  trackPhase,
  type Box,
  type PhaseTrack,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayNote,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import { hzOfKey, levelFoot, meanOutShare, pitchName, type HeardLevel } from './instrument-parts'

const TWO_PI = Math.PI * 2

// --- The device's numbers (`wheel_and_dog.h`) -----------------------------------

/** `kRiseSeconds`, `kRiseShare`, `kJump`: a push, and how far the speed goes at Depth 1. */
export const WHEEL_RISE_SEC = 0.022
export const WHEEL_RISE_SHARE = 0.3
export const WHEEL_JUMP = 1.5
/** `accents`: what the choices of Accents count. */
export const WHEEL_ACCENTS = [0, 2, 3, 4, 6] as const
/** `kLate`: how late the second of a pair is in the long and short pattern, in gaps. */
const LATE = 1 / 3
/** The hand's push is rounded off over this long (`push_coeff_`). */
const PUSH_SEC = 0.002
/** The jerk is held to this, and dies away over this long at the most (`jerk_fall_`). */
export const WHEEL_JERK_MOST = 1.2
const JERK_FALL_SEC = 0.09
/** The foot comes loose, and sits down again, over this long (`open_`). */
const OPEN_SEC = 0.004
/** `split_note`: the note each choice of Split begins the melody at; all keys, and none. */
const SPLIT_NOTES = [-1000, 36, 41, 48, 53, 60, 65, 72, 1000] as const
/** `kSteps`: where the second and third drones stand over the low one. */
export const WHEEL_TUNINGS = [
  [12, 19],
  [12, 17],
  [12, 24],
  [7, 12],
] as const
/** The drones' note until a key gives one: D2. */
const FIRST_KEY_NOTE = 38

/** What the display reads off the knobs. */
export interface WheelSettings {
  speed: number
  /** Pushes a turn. */
  count: number
  pattern: number
  depth: number
  dog: number
  /** Level of the third drone, which the bark goes with. */
  third: number
}

export function wheelSettings(value: (name: string) => number): WheelSettings {
  return {
    speed: value('speed'),
    count: WHEEL_ACCENTS[clamp(Math.round(value('accents')), 0, WHEEL_ACCENTS.length - 1)],
    pattern: Math.round(value('pattern')),
    depth: value('depth'),
    dog: value('dog'),
    third: value('trompette'),
  }
}

/** A push of the hand: where in the turn it begins, how long it is (turns), how long its rise, how strong. */
export interface WheelPush {
  start: number
  length: number
  rise: number
  strength: number
}

/** The pushes of one turn, as `push_at` lays them. */
export function wheelPushes(set: Pick<WheelSettings, 'speed' | 'count' | 'pattern'>): WheelPush[] {
  const { count, speed, pattern } = set
  const pushes: WheelPush[] = []
  for (let k = 0; k < count; k++) {
    let start = k
    let length = 1
    if (pattern === 1) {
      if (k % 2 === 1) {
        start += LATE
        length = 1 - LATE
      } else if (k + 1 < count) length = 1 + LATE
    }
    const share = Math.min(WHEEL_RISE_SHARE, (WHEEL_RISE_SEC * speed * count) / length)
    pushes.push({
      start: start / count,
      length: length / count,
      rise: (share * length) / count,
      strength: pattern === 2 && k > 0 ? 0.5 : 1,
    })
  }
  return pushes
}

/** `push_at` within one push: how far the hand is into it, so many turns after it began. */
function pushLevel(push: WheelPush, into: number): number {
  if (into < push.rise) {
    const r = into / push.rise
    return push.strength * r * r * (3 - 2 * r)
  }
  const fall = 1 - (into - push.rise) / (push.length - push.rise)
  return fall > 0 ? push.strength * fall * fall * fall : 0
}

/** `push_at`: how far the hand is into a push at this place of the turn, 0 to 1. */
export function wheelPushAt(place: number, pushes: readonly WheelPush[]): number {
  for (let k = pushes.length - 1; k >= 0; k--)
    if (place >= pushes[k].start) return pushLevel(pushes[k], place - pushes[k].start)
  return 0
}

/** `turn_wheel`, `bow_speed_` on a wheel at full turning: 1 for the even wheel. */
export const wheelBowSpeed = (place: number, depth: number, pushes: readonly WheelPush[]): number =>
  1 + WHEEL_JUMP * depth * wheelPushAt(place, pushes)

/** `turn_wheel`, `threshold`: the jerk the dog comes loose at. */
export function wheelThreshold(dog: number): number {
  const firm = clamp(1 - dog, 0, 1)
  return 0.02 + 0.42 * Math.pow(firm, 1.25)
}

/** The Dog whose threshold that is. */
export function wheelDogOf(threshold: number): number {
  return 1 - Math.pow(clamp((threshold - 0.02) / 0.42, 0, 1), 0.8)
}

/** `turn_wheel`, `loose`: how far open the dog is at a jerk. */
export function wheelLoose(jerk: number, dog: number): number {
  if (!(dog > 0)) return 0
  const over = clamp((jerk - wheelThreshold(dog)) / 0.15, 0, 1)
  return over * over * (3 - 2 * over) * Math.min(1, 8 * dog) * (0.55 + 0.45 * dog)
}

/** A push with what it does to the dog. */
export interface WheelJerk extends WheelPush {
  /** The highest jerk of the push, at full turning. */
  jerk: number
  /** How far the dog opens, as the device's Bark reading has it: nothing with no third drone. */
  open: number
  /** The stretch of the turn the dog is open over; empty (from = to) where it stays shut. */
  from: number
  to: number
}

/**
 * The jerk of every push at full turning and how far the dog answers it: the
 * device's own steps, sample by sample. The push is rounded off by its 2 ms
 * follower, the step of that by time is the jerk (scaled by kRiseSeconds /
 * (1.5 kJump)), which dies away at its own pace, and the foot opens in 4 ms.
 */
export function wheelJerks(set: WheelSettings, sampleRate: number): WheelJerk[] {
  const { speed, count, depth, dog, third } = set
  const rounds = 1 - Math.exp(-1 / (PUSH_SEC * sampleRate))
  const opens = 1 - Math.exp(-1 / (OPEN_SEC * sampleRate))
  const scale = (WHEEL_JUMP * depth * sampleRate * WHEEL_RISE_SEC) / (1.5 * WHEEL_JUMP)
  const threshold = wheelThreshold(dog)
  const falls = Math.min(JERK_FALL_SEC, 0.4 / (count * speed))
  const fall = Math.exp(-1 / (falls * sampleRate))
  const step = speed / sampleRate
  const done: WheelJerk[] = []
  for (const push of wheelPushes(set)) {
    // A push like one before it does what that one did, further round.
    const like = done.find(
      (each) =>
        each.strength === push.strength &&
        Math.abs(each.rise - push.rise) < 1e-9 &&
        Math.abs(each.length - push.length) < 1e-9,
    )
    if (like) {
      const on = push.start - like.start
      done.push({ ...like, start: push.start, from: like.from + on, to: like.to + on })
      continue
    }
    let level = 0
    let held = 0
    let most = 0
    let peakAt = 0
    let crossed = 0
    let loose = 0
    let open = 0
    const end = Math.min(push.length, push.rise + 5 * OPEN_SEC * speed)
    for (let into = 0; into <= end; into += step) {
      const before = level
      level += (pushLevel(push, into) - level) * rounds
      const jerk = clamp(scale * (level - before), 0, WHEEL_JERK_MOST)
      if (held <= threshold && jerk > threshold) crossed = into
      held = Math.max(jerk, held * fall)
      if (jerk > most) {
        most = jerk
        peakAt = into
      }
      loose += (wheelLoose(held, dog) - loose) * opens
      open = Math.max(open, loose)
    }
    const heard = most > threshold ? open * Math.min(1, 2 * third) : 0
    const from = push.start + crossed
    // It dies away from its highest, and the next push finds it where it is.
    const last = Math.min(push.length, peakAt + speed * falls * Math.log(most / threshold))
    done.push({ ...push, jerk: most, open: heard, from, to: heard > 0 ? push.start + last : from })
  }
  return done
}

/** The wheel's place in a turn that a push is at its highest, for the first push. */
const firstTop = (pushes: readonly WheelPush[]): number => (pushes.length > 0 ? pushes[0].rise : 0)

// --- The notes --------------------------------------------------------------------

export const wheelSplitNote = (split: number): number =>
  SPLIT_NOTES[clamp(Math.round(split), 0, SPLIT_NOTES.length - 1)]

/** `note_on`: whether a key holds the drones (else it plays the melody). */
export const wheelIsDrone = (hz: number, split: number): boolean =>
  69 + 12 * Math.log2(hz / 440) < wheelSplitNote(split) - 0.5

/** `retarget`: the pitches of the three drones, the third before its Detune. */
export function wheelDrones(drone: number, tuning: number, firstKeyHz: number): number[] {
  let root = firstKeyHz
  if (Math.round(drone) > 0) root = hzOfKey(36 + Math.round(drone) - 1)
  while (root < 27) root *= 2
  while (root > 1000) root *= 0.5
  const steps = WHEEL_TUNINGS[clamp(Math.round(tuning), 0, WHEEL_TUNINGS.length - 1)]
  return [root, root * Math.pow(2, steps[0] / 12), root * Math.pow(2, steps[1] / 12)]
}

/** `retarget`: what the two melody strings play, from the melody keys held, oldest first. */
export function wheelMelody(melody: number, held: readonly number[]): number[] {
  if (held.length === 0) return []
  const newest = held[held.length - 1]
  if (Math.round(melody) === 1) return [newest, Math.max(16, 0.5 * newest)]
  if (Math.round(melody) === 2 && held.length > 1) return [held[held.length - 2], newest]
  return [newest]
}

/** Where the melody begins, as it is said under the display. */
export function wheelSplitText(split: number, melody: number): string {
  const note = wheelSplitNote(split)
  if (note > 127) return 'no tune'
  const strings = ['tune', 'octave', 'duo'][Math.round(clamp(melody, 0, 2))]
  return note < 0 ? `${strings} on all` : `${strings} ${pitchName(hzOfKey(note))} up`
}

/** How long a turn takes, as it is said: "2 s", "0.33 s", "10 s". */
export function wheelTurnText(speed: number): string {
  const seconds = 1 / Math.max(speed, 1e-3)
  const digits = seconds >= 9.95 ? 0 : seconds >= 0.995 ? 1 : 2
  const said = seconds.toFixed(digits)
  return `${digits > 0 ? said.replace(/\.?0+$/, '') : said} s`
}

/** How many of the pushes the dog answers. */
export function wheelBarksText(jerks: readonly WheelJerk[]): string {
  const barks = jerks.filter((push) => push.open > 0).length
  return barks === 0 ? 'no bark' : barks === 1 ? '1 bark' : `${barks} barks`
}

// --- Where things stand -------------------------------------------------------------

export interface WheelLayout {
  /** The middle of the ring, and how far out a bow at its fastest (2.5 of even) stands. */
  x: number
  y: number
  radius: number
  /** Where the jerks stand: its foot is none, its top `WHEEL_JERK_MOST`. */
  jerks: Box
  /** The baseline of the words over the jerks and of the notes, and their two ends. */
  head: number
  notes: number
  left: number
  right: number
  foot: Box
}

/** The bow's speed at the edge of the ring, and how much of the way out the axle takes. */
export const WHEEL_EDGE = 1 + WHEEL_JUMP
export const WHEEL_AXLE = 0.36

/** How far out of the middle a bow's speed stands. */
export const wheelOut = (speed: number, at: Pick<WheelLayout, 'radius'>): number =>
  at.radius * (WHEEL_AXLE + ((1 - WHEEL_AXLE) * speed) / WHEEL_EDGE)

export function wheelLayout(size: Pick<DisplayView, 'width' | 'height'>): WheelLayout {
  const { width, height } = size
  const left = 5
  const right = width - 5
  const radius = Math.max(8, Math.min((height - 28) / 2, (width - 54) / 2))
  const y = 6 + radius
  // What is left over, past the ring and its handle, is the jerks' own; the two stand together in the middle.
  const room = clamp(width - 2 * radius - 22, 30, 72)
  const from = Math.max(left, (width - (2 * radius + 10 + room)) / 2)
  const gauge = from + 2 * radius + 10
  return {
    x: from + radius,
    y,
    radius,
    jerks: { x: gauge, y: 18, w: room, h: Math.max(10, y + radius - 18) },
    head: 13,
    notes: height - 12,
    left,
    right,
    foot: { x: 4, y: height - 8, w: width - 8, h: 4 },
  }
}

/** A place in the turn at a bow's speed, on the ring. */
export function wheelPoint(place: number, speed: number, at: WheelLayout): Point {
  const angle = TWO_PI * place
  const out = wheelOut(speed, at)
  return [at.x + out * Math.sin(angle), at.y - out * Math.cos(angle)]
}

/** How high a jerk stands in its box. */
export function wheelJerkY(jerk: number, box: Box): number {
  return box.y + box.h * (1 - Math.sqrt(clamp(jerk / WHEEL_JERK_MOST, 0, 1)))
}

/** The places of a turn the ring is drawn through: every three degrees, and the corners of each push. */
function ringPlaces(pushes: readonly WheelPush[]): number[] {
  const places: number[] = []
  for (let i = 0; i <= 120; i++) places.push(i / 120)
  for (const push of pushes)
    for (let i = 0; i <= 6; i++) places.push(push.start + (push.rise * i) / 6)
  return places.filter((place) => place <= 1).sort((a, b) => a - b)
}

const ringPoints = (
  places: readonly number[],
  set: WheelSettings,
  pushes: readonly WheelPush[],
  at: WheelLayout,
): Point[] =>
  places.map((place) => wheelPoint(place, wheelBowSpeed(place % 1, set.depth, pushes), at))

// --- The points ---------------------------------------------------------------------

/**
 * Depth is the ring on the top of the first push: further out throws the
 * wheel further. Dog is the ring on the line the dog comes loose at: lower is
 * looser. With no pushes there is no Depth to take.
 */
function wheelHandles(view: DisplayView): DisplayHandle[] {
  const at = wheelLayout(view)
  const set = wheelSettings((name) => view.value(name))
  const pushes = wheelPushes(set)
  const handles: DisplayHandle[] = []
  const pull = (
    key: string,
    name: string,
    x: number,
    y: number,
    of: (toX: number, toY: number) => number,
  ): void => {
    const now = view.value(key)
    const spec = view.spec(key)
    handles.push({
      key,
      name,
      x,
      y,
      drag: (toX, toY) => ({
        [key]: Math.hypot(toX - x, toY - y) < 1e-6 ? now : clamp(of(toX, toY), 0, 1),
      }),
      reset: () => ({ [key]: spec?.default ?? now }),
    })
  }
  if (pushes.length > 0) {
    const place = firstTop(pushes)
    const [x, y] = wheelPoint(place, 1 + WHEEL_JUMP * set.depth, at)
    const angle = TWO_PI * place
    pull('depth', 'Depth', x, y, (toX, toY) => {
      const out = (toX - at.x) * Math.sin(angle) - (toY - at.y) * Math.cos(angle)
      const speed = ((out / at.radius - WHEEL_AXLE) / (1 - WHEEL_AXLE)) * WHEEL_EDGE
      return (speed - 1) / WHEEL_JUMP
    })
  }
  const { jerks } = at
  pull(
    'dog',
    'Dog',
    jerks.x + jerks.w - 4,
    wheelJerkY(wheelThreshold(set.dog), jerks),
    (_, toY) => {
      const root = clamp(1 - (toY - jerks.y) / jerks.h, 0, 1)
      return wheelDogOf(root * root * WHEEL_JERK_MOST)
    },
  )
  return handles
}

// --- The display ----------------------------------------------------------------------

/** Nothing that moves or lights comes and goes more often than this in a second. */
const WHEEL_MOST_HZ = 3
/** Pushes that come closer than this are not followed one by one: the mark goes round as well. */
const WHEEL_EACH_HZ = 2
/** A name under the display stands this long before it changes again. */
export const WHEEL_WORD_SEC = 0.4
/** The melody stays underlined this long after its last key. */
export const WHEEL_LIT_SEC = 0.5
/** Barks that come faster than the mark may follow are shown as the strongest of this long. */
const BARK_HOLD_SEC = 0.5
const BARK_RISE_SEC = 0.05
const BARK_FALL_SEC = 0.25
const BARK_STEP = 0.08
/** How long the wheel's own speed, its pushes taken off, takes to be believed. */
const SPIN_SEC = 0.15
const LEVEL_SEC = 1

interface Said {
  words: string
  at: number
}

interface WheelState extends HeardLevel {
  track: PhaseTrack | null
  /** The wheel's speed with its pushes taken off, 0 at a stand. */
  spin: number
  barks: { at: number; bark: number }[]
  bark: number
  lit: number
  /** Which side of Split each key was struck on: a key keeps its side. */
  sides: Map<number, { born: number; drone: boolean }>
  /** The lowest drone key the turning wheel was last given. */
  root: number | null
  melodyUntil: number
  melody: string[]
  drones: Said
  tune: Said
}

/** Words that change no more often than they can be read. */
function say(said: Said, words: string, now: number): string {
  if (said.words === '' || (words !== said.words && now - said.at >= WHEEL_WORD_SEC)) {
    said.words = words
    said.at = now
  }
  return said.words
}

/** How strongly the bark is lit: each bark by itself while they are slow, their strongest while they are not. */
function barkLit(state: WheelState, frame: DisplayFrame, reading: number, rate: number): number {
  const hold = rate > WHEEL_EACH_HZ ? BARK_HOLD_SEC : 0
  state.barks.push({ at: frame.now, bark: clamp(reading, 0, 1) })
  state.barks = state.barks.filter((each) => each.at >= frame.now - hold && each.at <= frame.now)
  const most = state.barks.reduce((high, each) => Math.max(high, each.bark), 0)
  state.bark = follow(state.bark, most, frame.dt, BARK_RISE_SEC, BARK_FALL_SEC)
  if (state.bark < 0.02) state.lit = 0
  else if (Math.abs(state.bark - state.lit) > BARK_STEP) state.lit = state.bark
  return state.lit
}

/** The keys held, each on the side it was struck on, oldest first. */
function keysHeld(
  state: WheelState,
  notes: readonly DisplayNote[],
  now: number,
  split: number,
): { drones: number[]; melody: number[] } {
  const drones: number[] = []
  const melody: number[] = []
  const seen = new Set<number>()
  for (const note of notes) {
    if (note.released !== null) continue
    seen.add(note.id)
    const born = now - note.age
    let side = state.sides.get(note.id)
    if (!side || Math.abs(side.born - born) > 0.1) {
      side = { born, drone: wheelIsDrone(note.frequency, split) }
      state.sides.set(note.id, side)
    }
    ;(side.drone ? drones : melody).push(note.frequency)
  }
  for (const id of state.sides.keys()) if (!seen.has(id)) state.sides.delete(id)
  return { drones, melody }
}

const wheelAndDog = plateDisplay<WheelState>({
  place: 'window',
  columns: 2,
  params: [
    'speed',
    'accents',
    'pattern',
    'depth',
    'dog',
    'split',
    'drone',
    'tuning',
    'drones',
    'trompette',
    'melody',
  ],
  live: { meters: true, signal: true, notes: true },
  info: 'Left, one turn of the wheel from the top: further out is a faster bow, thick where the dog barks, and the rings set Depth and Dog. Right, the jerk of each push against the line the dog comes loose at. Below, the notes of the drones and the melody.',
  init: () => ({
    heard: [],
    shown: 0,
    track: null,
    spin: 0,
    barks: [],
    bark: 0,
    lit: 0,
    sides: new Map(),
    root: null,
    melodyUntil: -Infinity,
    melody: [],
    drones: { words: '', at: -Infinity },
    tune: { words: '', at: -Infinity },
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const at = wheelLayout(frame)
    const set = wheelSettings((name) => frame.value(name))
    const pushes = wheelJerks(set, frame.sampleRate)
    // How often pushes come, at the closest two of them.
    const rate = pushes.length > 0 ? set.speed / Math.min(...pushes.map((push) => push.length)) : 0

    // --- What the device reports ---
    const reads = frame.powered && frame.hasMeter('turning')
    const turning = reads ? Math.max(0, frame.meter('turning')) : 0
    const reading = reads && frame.hasMeter('wheel') ? frame.meter('wheel') : 0
    if (turning > 0 && frame.dt > 0)
      state.track = trackPhase(state.track, reading, set.speed * state.spin, frame.dt)
    else state.track = { phase: reading, reading }
    const place = clamp(state.track.phase, 0, 1)
    const even = clamp(turning / wheelBowSpeed(reading % 1, set.depth, pushes), 0, 1)
    if (!(turning > 0)) state.spin = 0
    else state.spin = frame.dt > 0 ? follow(state.spin, even, frame.dt, SPIN_SEC, SPIN_SEC) : even
    const bark = reads && frame.hasMeter('buzz') ? frame.meter('buzz') : 0
    const lit = reads ? barkLit(state, frame, bark, rate) : (state.lit = state.bark = 0)

    // --- The turn ---
    const places = ringPlaces(pushes)
    const ring = ringPoints(places, set, pushes, at)
    fillTo(ctx, ring, at.y, colours.ink)
    const circle: Point[] = []
    for (let i = 0; i <= 60; i++) circle.push(wheelPoint(i / 60, 1, at))
    trace(ctx, circle, { colour: colours.ink, width: 1, alpha: INK.rule })
    const axle: Point[] = []
    for (let i = 0; i <= 30; i++) axle.push(wheelPoint(i / 30, 0, at))
    trace(ctx, axle, { colour: colours.ink, width: 1, alpha: INK.rule })
    trace(ctx, ring, { colour: colours.ink, width: 1.25 })
    for (const push of pushes) {
      if (!(push.to > push.from)) continue
      const open: Point[] = []
      const steps = Math.max(4, Math.ceil((push.to - push.from) * 120))
      for (let i = 0; i <= steps; i++) {
        const part = push.from + ((push.to - push.from) * i) / steps
        open.push(wheelPoint(part, wheelBowSpeed(part % 1, set.depth, pushes), at))
      }
      trace(ctx, open, { colour: colours.ink, width: 3 })
      if (lit > 0) trace(ctx, open, { colour: colours.accent, width: 3, alpha: lit })
    }
    text(frame, wheelTurnText(set.speed), at.x, at.y, { align: 'center', baseline: 'middle' })

    // --- The jerks against the dog ---
    const { jerks } = at
    const foot = jerks.y + jerks.h
    const line = wheelJerkY(wheelThreshold(set.dog), jerks)
    rule(ctx, jerks.x, foot, jerks.x + jerks.w, foot, { colour: colours.ink, alpha: INK.rule })
    const each = (jerks.w - 8) / Math.max(1, pushes.length)
    const wide = clamp(each - 1, 2, 7)
    pushes.forEach((push, k) => {
      const x = jerks.x + each * (k + 0.5) - wide / 2
      const top = wheelJerkY(push.jerk, jerks)
      const cut = push.open > 0 ? Math.max(top, line) : top
      fillRect(ctx, { x, y: cut, w: wide, h: foot - cut }, colours.ink, INK.back)
      if (!(push.open > 0)) return
      fillRect(ctx, { x, y: top, w: wide, h: cut - top }, colours.ink)
      if (lit > 0) fillRect(ctx, { x, y: top, w: wide, h: cut - top }, colours.accent, lit)
    })
    trace(
      ctx,
      [
        [jerks.x - 2, line],
        [jerks.x + jerks.w, line],
      ],
      { colour: colours.ink, width: 1, dash: set.dog > 0 ? undefined : [2, 2] },
    )
    text(frame, wheelBarksText(pushes), jerks.x + jerks.w, at.head, { align: 'right' })

    // --- The strings ---
    const held = keysHeld(state, frame.powered ? frame.notes : [], frame.now, frame.value('split'))
    if (held.drones.length > 0) state.root = Math.min(...held.drones)
    else if (turning <= 0 && held.melody.length === 0) state.root = null
    const drones = wheelDrones(
      frame.value('drone'),
      frame.value('tuning'),
      state.root ?? hzOfKey(FIRST_KEY_NOTE),
    ).map(pitchName)
    if (held.melody.length > 0)
      state.melody = wheelMelody(frame.value('melody'), held.melody).map(pitchName)
    const melodyOn = reads && frame.hasMeter('melodyOn') && frame.meter('melodyOn') > 0.5
    if (melodyOn && turning > 0) state.melodyUntil = frame.now + WHEEL_LIT_SEC
    const playing = frame.now < state.melodyUntil && state.melody.length > 0
    const names = say(state.drones, drones.join(' '), frame.now).split(' ')
    const rest = wheelSplitText(frame.value('split'), frame.value('melody'))
    const tune = say(state.tune, playing ? state.melody.join(' ') : rest, frame.now)
    let x = at.left
    names.forEach((name, d) => {
      text(frame, name, x, at.notes)
      const wideName = ctx.measureText(name).width
      if (frame.value(d < 2 ? 'drones' : 'trompette') > 0) {
        const under = { x, y: at.notes + 1.5, w: wideName, h: 1.5 }
        if (turning > 0) fillRect(ctx, under, colours.accent)
        else fillRect(ctx, under, colours.ink, INK.rule)
      }
      x += wideName + 3
    })
    text(frame, tune, at.right, at.notes, { align: 'right' })
    if (playing && tune !== rest) {
      const wideTune = ctx.measureText(tune).width
      fillRect(
        ctx,
        { x: at.right - wideTune, y: at.notes + 1.5, w: wideTune, h: 1.5 },
        colours.accent,
      )
    }
    levelFoot(frame, at.foot, meanOutShare(state, frame, LEVEL_SEC))

    // --- Where the wheel is ---
    if (turning > 0 && set.speed < WHEEL_MOST_HZ) {
      const pushed = rate > WHEEL_EACH_HZ ? 1 : wheelBowSpeed(place % 1, set.depth, pushes)
      const [dotX, dotY] = wheelPoint(place, state.spin * pushed, at)
      dot(ctx, dotX, dotY, 2.5, colours.accent, { ring: colours.ink })
    }
    for (const point of wheelHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: wheelHandles,
})

export const WHEEL_AND_DOG_FACES: Readonly<Record<string, PlateFace>> = {
  // Depth and Dog are the points on the display.
  'wheel-and-dog': {
    display: wheelAndDog,
    face: ['speed', 'accents', 'rosin', 'drone'],
    sections: [
      ['speed', 'spin', 'accents', 'pattern', 'depth', 'dog'],
      ['split', 'drone', 'tuning', 'drones', 'trompette', 'detune'],
      ['melody', 'tangents'],
      ['rosin', 'noise', 'brightness', 'body'],
      ['spread', 'volume'],
    ],
  },
}
