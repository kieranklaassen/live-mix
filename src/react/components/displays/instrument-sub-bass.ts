// The display of the Sub Bass: a sine with a pitch that falls at the strike, harmonics added over it and a drive.
//
// It is two views of one note. At the left one cycle of the wave over the
// pure sine it is made from, so what Shape, Harmonics and Drive add is the
// part between the two. At the right the note from its strike on: a body as
// thick as the note is loud, lying along the note's own pitch, which starts
// Drop above the key and falls onto it in Fall. There is one voice, so there
// is one body: the keys are played through again as the device takes them,
// and the body goes where the one voice went.

import {
  INK,
  clamp,
  clipped,
  dot,
  gainToDb,
  ground,
  handle,
  hzText,
  label,
  rule,
  text,
  type Box,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayHandle,
  type DisplayNote,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import { levelFoot, outShare, pitchName } from './instrument-parts'
import { secondsText } from './tails'

type Size = Pick<DisplayView, 'width' | 'height'>

/** `sub_bass.h`, `kSecond` and `kThird`: Harmonics at full adds the second at half and the third at 0.316 of the fundamental. */
const SUB_SECOND = 0.5
const SUB_THIRD = 0.3162
/** `sub_bass.h`, `kShapeThird`, `kShapeFifth`, `kShapeSeventh`: Shape at full is a square wave's first terms with its corners rounded. */
const SUB_SHAPE_THIRD = 0.2682
const SUB_SHAPE_FIFTH = 0.0966
const SUB_SHAPE_SEVENTH = 0.0204
/** `sub_bass.h`, `kFadeToHz` and `kMaxHz`: no harmonic is made above the one, and a drop from the top keys stops at the other. */
const SUB_FADE_TO_HZ = 18000
const SUB_MAX_HZ = 16000
/** `sub_bass.h`, `kFallRate` and `kFallFloor`: the fall is an exponential that is cut off where it has reached a hundredth. */
const SUB_FALL_RATE = Math.log(100)
const SUB_FALL_FLOOR = 0.01
/** `sub_bass.h`, `kMaxDrive`, `kCleanBelow`, `kLossC`, `kLossD`: the gain into the curve at full Drive, and the level a sine loses in it. */
const SUB_MAX_DRIVE = 1.25
const SUB_CLEAN_BELOW = 1e-4
const SUB_LOSS_C = 1.78
const SUB_LOSS_D = 1.606
/** `sub_bass.h`, `kSoftestLevel`, `kHoldFromSeconds`, `kSixtyDb`, `kSilent`, `kJoinSeconds`, `kMaxHeld`. */
const SUB_SOFTEST = 0.3
const SUB_HOLD_FROM_SEC = 19.9
const SUB_SIXTY_DB = 6.907755279
const SUB_SILENT = 1e-6
const SUB_JOIN_SEC = 0.002
const SUB_MAX_HELD = 16
/** The frames the engine hands the device at a time: keys that reach it in one of them are struck before any sound is made. */
const BLOCK_FRAMES = 128

/** How strong each harmonic over the fundamental is, the fundamental being 1. */
export interface SubBassTone {
  second: number
  third: number
  fifth: number
  seventh: number
}

/**
 * `SubBass::process` and `fade`: the harmonics Shape and Harmonics add, written
 * into `into`. Shape adds the odd ones, Harmonics the second and the third,
 * and each fades out as it climbs the top third of the way to 18 kHz, which
 * only a note at `hz` high above a bass's own keys comes near.
 */
export function subBassTone(
  shape: number,
  harmonics: number,
  into: SubBassTone,
  hz = 0,
  sampleRate = 48000,
): SubBassTone {
  into.second = SUB_SECOND * harmonics
  into.third = SUB_SHAPE_THIRD * shape + SUB_THIRD * harmonics
  into.fifth = SUB_SHAPE_FIFTH * shape * shape
  into.seventh = SUB_SHAPE_SEVENTH * shape * shape * shape
  const slope = 3 / Math.min(SUB_FADE_TO_HZ, 0.42 * sampleRate)
  if (hz * 7 * slope > 2) {
    into.second *= clamp(3 - 2 * hz * slope, 0, 1)
    into.third *= clamp(3 - 3 * hz * slope, 0, 1)
    into.fifth *= clamp(3 - 5 * hz * slope, 0, 1)
    into.seventh *= clamp(3 - 7 * hz * slope, 0, 1)
  }
  return into
}

/** `SubBass::process`: the wave before the loudness, `phase` in cycles. Every harmonic is in sine phase, so it starts at its rising zero as a strike from silence does. */
export function subBassWave(phase: number, tone: SubBassTone): number {
  const x = 2 * Math.PI * phase
  return (
    Math.sin(x) +
    tone.second * Math.sin(2 * x) +
    tone.third * Math.sin(3 * x) +
    tone.fifth * Math.sin(5 * x) +
    tone.seventh * Math.sin(7 * x)
  )
}

/** `SubBass::process`, `give_back`: what the drive gives back of the level it takes from a note as loud as `amp`; 1 while Drive is off. */
export function subBassGiveBack(drive: number, amp: number, tone: SubBassTone): number {
  const gain = drive * SUB_MAX_DRIVE
  if (gain <= SUB_CLEAN_BELOW) return 1
  const size2 =
    1 +
    tone.second * tone.second +
    tone.third * tone.third +
    tone.fifth * tone.fifth +
    tone.seventh * tone.seventh
  const depth2 = gain * gain * amp * amp * size2
  const lost = 1 + 1.5 * depth2 + (SUB_LOSS_C * depth2 * depth2) / (1 + SUB_LOSS_D * depth2)
  return Math.sqrt(lost) / gain
}

/**
 * `SubBass::process`: the wave as it leaves the drive, for a note as loud as
 * `amp`. The curve is x - x³ + 3/5 x⁵ - 1/7 x⁷, flat where it ends, and it
 * comes after the loudness: a loud note is pressed against it and a tail is not.
 */
export function subBassSample(
  phase: number,
  tone: SubBassTone,
  amp: number,
  drive: number,
): number {
  const clean = subBassWave(phase, tone) * amp
  const gain = drive * SUB_MAX_DRIVE
  if (gain <= SUB_CLEAN_BELOW) return clean
  const x = clamp(clean * gain, -1, 1)
  const x2 = x * x
  return x * (1 + x2 * (-1 + x2 * (0.6 - x2 / 7))) * subBassGiveBack(drive, amp, tone)
}

/** `SubBass::start_fall` and `pitch_offset`: the share of Drop the pitch still stands above its key, `seconds` after a strike that falls in `fall` seconds. */
export function subBassFall(seconds: number, fall: number): number {
  if (seconds >= fall) return 0
  return (
    (Math.exp((-SUB_FALL_RATE * Math.max(seconds, 0)) / fall) - SUB_FALL_FLOOR) /
    (1 - SUB_FALL_FLOOR)
  )
}

/** `SubBass::note_on`: the level of a key from how hard it was played. The softest still sounds. */
export const subBassTouch = (gain: number): number =>
  SUB_SOFTEST + (1 - SUB_SOFTEST) * clamp(gain, 0, 1)

/** The times of the loudness, in seconds. */
export interface SubBassTimes {
  attack: number
  decay: number
  release: number
}

/**
 * `SubBass::advance_level`: the loudness `since` seconds after a strike that
 * found it at `from`. It rises to full over Attack along an S, then falls
 * 60 dB in Decay while a key is down (at the top of Decay it holds), and
 * 60 dB in Release from `up` on, the seconds after the strike at which the
 * last key went up (null while one is down). A key let go during the rise
 * fades from where the rise had got to. A millionth is silence.
 */
export function subBassLevel(
  since: number,
  up: number | null,
  from: number,
  times: SubBassTimes,
): number {
  if (since < 0) return 0
  const down = up === null ? since : Math.min(since, up)
  let level: number
  if (down < times.attack) {
    const x = down / times.attack
    level = from + (1 - from) * x * x * (3 - 2 * x)
    if (down >= since) return level
  } else {
    level =
      times.decay >= SUB_HOLD_FROM_SEC
        ? 1
        : Math.exp((-SUB_SIXTY_DB * (down - times.attack)) / times.decay)
  }
  if (since > down) level *= Math.exp((-SUB_SIXTY_DB * (since - down)) / times.release)
  return level < SUB_SILENT ? 0 : level
}

/** A level as a share of the 60 dB the knobs' times are measured over: 1 at full, 0 from 60 dB down. */
export const subBassShare = (level: number): number => clamp(1 + gainToDb(level) / 60, 0, 1)

/**
 * A key going down or up: when (seconds, under zero for the past) and which
 * of the notes. The events of one instant are told in this order: first the
 * keys let go that were down before it (`turn` 0); then each key that goes
 * down, in the order of the notes (`place`): the held key of its id is
 * forgotten (1), it goes down (2), and it goes up again if it did so in that
 * same instant (3).
 */
interface SubEvent {
  at: number
  down: boolean
  index: number
  turn: number
  place: number
}

/** The voice set off towards a key: so long after the strike, from one pitch to another (log2 of Hz) in so many seconds, at that key's level. */
interface SubMove {
  at: number
  from: number
  to: number
  seconds: number
  touch: number
}

/** The one voice as the keys leave it. */
export interface SubBassVoice {
  /** Seconds since the last key was struck; under zero when none was. */
  since: number
  /** Seconds after that strike at which the last held key went up; null while one is down. */
  up: number | null
  /** The loudness that strike found. */
  from: number
  /** Seconds before that strike at which the drop began, 0 when the strike itself dropped; null when the pitch is not falling (a key slid to). */
  lead: number | null
  /** Seconds the drop before it had been falling when that drop began over a note that still sounded (Infinity when there was none); null when it began in silence. */
  carry: number | null
  moves: SubMove[]
  moveCount: number
  events: SubEvent[]
  held: number[]
}

export const subBassVoice = (): SubBassVoice => ({
  since: -1,
  up: null,
  from: 0,
  lead: null,
  carry: null,
  moves: [],
  moveCount: 0,
  events: [],
  held: [],
})

/**
 * Every key down and key up of `notes` in the order the device had them,
 * written into `into`, which is kept between frames: the count comes back. A
 * key that goes up in the instant another goes down was let go first, so the
 * new one is played apart. The same key struck again is forgotten as its
 * new strike comes (`SubBass::release_key`), after the keys that went down
 * before it in that instant. A key that goes down and up in one instant goes
 * down first, or it would be held for good.
 */
function subEvents(notes: readonly DisplayNote[], into: SubEvent[]): number {
  let count = 0
  const put = (at: number, down: boolean, index: number, turn: number, place: number): void => {
    if (count === into.length) into.push({ at: 0, down: false, index: 0, turn: 0, place: 0 })
    const event = into[count++]
    event.at = at
    event.down = down
    event.index = index
    event.turn = turn
    event.place = place
  }
  notes.forEach((note, index) => {
    put(-note.age, true, index, 2, index)
    if (note.released === null) return
    if (note.released >= note.age) return put(-note.released, false, index, 3, index)
    // Struck again: the next note of its id began in the instant this one ended.
    let again = -1
    for (let later = index + 1; later < notes.length && again < 0; later++)
      if (notes[later].id === note.id && notes[later].age === note.released) again = later
    put(-note.released, false, index, again < 0 ? 0 : 1, again < 0 ? index : again)
  })
  // The ones left over from a fuller frame go to the end.
  for (let i = count; i < into.length; i++) into[i].at = Infinity
  into.sort(
    (a, b) =>
      a.at - b.at ||
      Math.min(a.turn, 1) - Math.min(b.turn, 1) ||
      a.place - b.place ||
      a.turn - b.turn,
  )
  return count
}

/** The move the voice is on, `after` seconds after the strike: where it is headed and how hard that key was played. */
function subGoal(voice: SubBassVoice, after: number): SubMove | null {
  let goal: SubMove | null = null
  for (let m = 0; m < voice.moveCount; m++) {
    if (voice.moves[m].at > after && goal) break
    goal = voice.moves[m]
  }
  return goal
}

/** `SubBass::aim`, `pitch_`: where the key's own pitch is `after` seconds after the strike, as log2 of Hz. Between two keys it goes in a straight line. */
export function subBassKeyPitch(voice: SubBassVoice, after: number): number {
  const move = subGoal(voice, after)
  if (!move) return 0
  const share = move.seconds > 0 ? clamp((after - move.at) / move.seconds, 0, 1) : 1
  return move.from + (move.to - move.from) * share
}

/** `SubBass::process`: the pitch that sounds, the key's own plus what is left of the drop, as log2 of Hz. `drop` in semitones, `fall` in seconds. */
export function subBassPitch(
  voice: SubBassVoice,
  after: number,
  drop: number,
  fall: number,
): number {
  const key = subBassKeyPitch(voice, after)
  if (voice.lead === null || drop <= 0) return key
  const falling = after + voice.lead
  let share = subBassFall(falling, fall)
  // `start_fall`, `join_`: a note that still sounds is led from what was left of its own drop to
  // the top of the new one along a line of kJoinSeconds, so its pitch does not jump.
  if (voice.carry !== null && falling < SUB_JOIN_SEC)
    share += (subBassFall(voice.carry, fall) - 1) * (1 - falling / SUB_JOIN_SEC)
  return key + (drop / 12) * share
}

/**
 * `SubBass::note_on` and `note_off` played through again. Held keys sit on a
 * stack of sixteen and the newest plays; letting it go returns to the one
 * under it without a new strike. Every key down strikes the loudness again
 * from wherever it is. Only a key played apart drops; a key pressed over a
 * held one slides to it in Glide, as does a key over a held one that has died
 * away. Keys within `together` seconds of a strike reach the device before it
 * has made a sound of it: out of silence the newest of them sounds at once,
 * without a slide.
 */
export function subBassPlay(
  notes: readonly DisplayNote[],
  times: SubBassTimes,
  glide: number,
  together: number,
  into: SubBassVoice,
): SubBassVoice {
  const count = subEvents(notes, into.events)
  const held = into.held
  held.length = 0
  into.moveCount = 0
  let struck: number | null = null
  let from = 0
  let emptied: number | null = null
  let fell: number | null = null
  let carry: number | null = null
  const keyOf = (index: number): number => Math.log2(clamp(notes[index].frequency, 8, 12000))
  const touchOf = (index: number): number => subBassTouch(notes[index].gain)
  // A key let go before the device made a sound of its strike never rose at all.
  const upAfter = (): number | null =>
    emptied === null || struck === null ? null : emptied - struck < together ? 0 : emptied - struck
  const levelAt = (at: number): number => {
    if (struck === null) return 0
    if (at - struck < together) return from
    return subBassLevel(at - struck, upAfter(), from, times)
  }
  const move = (at: number, start: number, to: number, seconds: number, touch: number): void => {
    if (into.moveCount === into.moves.length)
      into.moves.push({ at: 0, from: 0, to: 0, seconds: 0, touch: 0 })
    const next = into.moves[into.moveCount++]
    next.at = at
    next.from = seconds > 0 ? start : to
    next.to = to
    next.seconds = seconds
    next.touch = touch
  }
  for (let e = 0; e < count; e++) {
    const { at, down, index, turn } = into.events[e]
    if (down) {
      const overlapping = held.length > 0
      // The strike before this one is still to be played: nothing has sounded to slide from.
      const pending = struck !== null && overlapping && at - struck < together
      const level = levelAt(at)
      const pitch = struck === null ? keyOf(index) : subBassKeyPitch(into, at - struck)
      if (held.length === SUB_MAX_HELD) {
        // A full stack forgets its oldest key.
        for (let i = 1; i < held.length; i++) held[i - 1] = held[i]
        held.length -= 1
      }
      held.push(index)
      into.moveCount = 0
      if (level <= 0) {
        const slide = overlapping && !pending
        move(0, pitch, keyOf(index), slide ? glide : 0, touchOf(index))
        fell = slide ? null : at
        carry = null
      } else if (overlapping) {
        // A key slid to does not drop; a drop that is still falling falls on.
        move(0, pitch, keyOf(index), Math.max(glide, SUB_JOIN_SEC), touchOf(index))
      } else {
        // Played apart while the last note still sounds: the wave carries on into a new drop.
        move(0, pitch, keyOf(index), SUB_JOIN_SEC, touchOf(index))
        // A drop begun in this same block has not moved yet: what it took over is still what is left.
        if (fell === null) carry = Infinity
        else if (carry === null || at - fell >= together) carry = at - fell
        fell = at
      }
      from = level
      struck = at
      emptied = null
    } else {
      const stacked = held.indexOf(index)
      if (stacked < 0 || struck === null) continue
      const playing = stacked === held.length - 1
      for (let i = stacked + 1; i < held.length; i++) held[i - 1] = held[i]
      held.length -= 1
      if (held.length === 0) {
        emptied = at
      } else if (playing && turn !== 1) {
        // Back to the key still held under it, sliding if anything still sounds. A key struck
        // again is only forgotten (`release_key`): the voice goes nowhere before its new strike.
        const under = held[held.length - 1]
        const pitch = subBassKeyPitch(into, at - struck)
        const seconds = levelAt(at) > 0 ? Math.max(glide, SUB_JOIN_SEC) : 0
        move(at - struck, pitch, keyOf(under), seconds, touchOf(under))
      }
    }
  }
  into.since = struck === null ? -1 : -struck
  into.up = upAfter()
  into.from = from
  into.lead = fell === null || struck === null ? null : struck - fell
  into.carry = into.lead === null ? null : carry
  return into
}

// --- The picture -------------------------------------------------------------

/**
 * The seconds the note's box spans from the strike at its left edge, by the
 * cube root so a fall of five milliseconds is still seen beside a decay of
 * twenty seconds. The longest rise and the longest decay that is not a hold
 * end just inside it, so only a note that holds reaches the edge.
 */
const SUB_LONG_SEC = 23
/** The semitones above the key the box has room for (Drop at its top), and under it, where a slide from a lower key comes from. */
const SUB_ABOVE_ST = 36
const SUB_BELOW_ST = 7
/**
 * The scale of pitch is drawn closer the further it is from the key: a drop
 * of a few semitones, a knock, is as plain as a dive of three octaves. So
 * many semitones lie half way up to where the scale would close.
 */
const SUB_BEND_ST = 24
/** How far a pitch so many semitones from the key stands from the key's line, 1 at the top of Drop; and the semitones that stand so far. */
const SUB_TOP = SUB_ABOVE_ST / (SUB_ABOVE_ST + SUB_BEND_ST)
const subRise = (semitones: number): number =>
  semitones / (Math.abs(semitones) + SUB_BEND_ST) / SUB_TOP
const subSemitones = (rise: number): number => {
  const share = clamp(rise, 0, 1) * SUB_TOP
  return (SUB_BEND_ST * share) / (1 - share)
}
/** The largest swing the wave can have, with Shape and Harmonics at full and no Drive: the wave's box holds it. */
const SUB_SWING = 1.6
/** Under this share of its loudness the voice is done. */
const SUB_DONE = 0.02
/** The points a body is laid out in, at most. */
const SUB_STEPS = 256
/** The times a scale line stands at. */
const SUB_SCALE_SEC = [0.1, 1, 10] as const

const subX = (seconds: number, box: Box): number =>
  box.x + Math.cbrt(clamp(seconds / SUB_LONG_SEC, 0, 1)) * box.w
const subSeconds = (x: number, box: Box): number =>
  SUB_LONG_SEC * Math.pow(clamp((x - box.x) / box.w, 0, 1), 3)

interface SubParts {
  /** One cycle of the wave. */
  wave: Box
  /** The note in time: the strike at `x`, the key's own pitch at `key`. */
  note: Box
  /** Where the key's pitch lies in the note's box, how many pixels above it the top of Drop is, and half the thickness of a note at full. */
  key: number
  rise: number
  half: number
  words: Box
  foot: Box
}

function subParts(view: Size): SubParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const top = all.y + 12
  const high = Math.max(24, all.h - 12 - 9)
  const wide = Math.round(all.w * 0.31)
  const gap = Math.round(clamp(all.w * 0.05, 5, 10))
  const note: Box = { x: all.x + wide + gap, y: top, w: all.w - wide - gap - 4, h: high }
  const half = clamp(Math.round(high * 0.11), 3, 9)
  // Above the key there is room for a full note at the top of the drop, under it for a fifth.
  const rise = (high - half) / (1 + subRise(SUB_BELOW_ST))
  return {
    wave: { x: all.x, y: top, w: wide, h: high },
    note,
    key: note.y + half + rise,
    rise,
    half,
    words: { x: all.x, y: all.y, w: all.w, h: 9 },
    foot: { x: all.x, y: all.y + all.h - 5, w: all.w, h: 5 },
  }
}

interface SubBassState {
  voice: SubBassVoice
  tone: SubBassTone
  /** A body as it is laid out: where each point stands across, the height of its middle and half its thickness. */
  xs: Float32Array
  middle: Float32Array
  half: Float32Array
}

/**
 * Lay a body out between two times after the strike: a point for every pixel
 * across and one on the last moment itself. `middleAt` is the height of its
 * middle and `halfAt` half its thickness at a time. How many points there
 * are comes back.
 */
function subLay(
  state: SubBassState,
  box: Box,
  from: number,
  until: number,
  middleAt: (seconds: number) => number,
  halfAt: (seconds: number) => number,
): number {
  const start = subX(from, box)
  const end = subX(until, box)
  const step = Math.max(1, (end - start) / (SUB_STEPS - 1))
  let count = 0
  for (let x = start; count < SUB_STEPS; x += step) {
    const last = x >= end || count === SUB_STEPS - 1
    const seconds = last ? until : Math.max(from, subSeconds(x, box))
    state.xs[count] = last ? end : x
    state.middle[count] = middleAt(seconds)
    state.half[count] = halfAt(seconds)
    count++
    if (last) break
  }
  return count
}

/** The outline of a body that was laid out: its upper edge, then its lower one back again when `closed`, or begun anew as a line of its own. */
function subOutline(
  ctx: CanvasRenderingContext2D,
  state: SubBassState,
  count: number,
  closed: boolean,
): void {
  const { xs, middle, half } = state
  ctx.beginPath()
  for (let i = 0; i < count; i++) {
    if (i === 0) ctx.moveTo(xs[i], middle[i] - half[i])
    else ctx.lineTo(xs[i], middle[i] - half[i])
  }
  if (closed) {
    for (let i = count - 1; i >= 0; i--) ctx.lineTo(xs[i], middle[i] + half[i])
    ctx.closePath()
    return
  }
  for (let i = 0; i < count; i++) {
    if (i === 0) ctx.moveTo(xs[i], middle[i] + half[i])
    else ctx.lineTo(xs[i], middle[i] + half[i])
  }
}

/** A stretch of the wave across its box as a path: `cycles` of it, as loud as `amp` and drawn `tall` of the box's half height for a swing of one. */
function subWavePath(
  ctx: CanvasRenderingContext2D,
  box: Box,
  tone: SubBassTone,
  cycles: number,
  amp: number,
  drive: number,
  tall: number,
): void {
  const middle = box.y + box.h / 2
  // A cycle a few pixels long needs more points than there are pixels.
  const step = cycles > 2 ? 0.5 : 1
  ctx.beginPath()
  for (let x = 0; x <= box.w; x += step) {
    const y = middle - subBassSample((x / box.w) * cycles, tone, amp, drive) * tall
    if (x === 0) ctx.moveTo(box.x, y)
    else ctx.lineTo(box.x + x, y)
  }
}

const subBass = plateDisplay<SubBassState>({
  place: 'window',
  columns: 2,
  params: ['shape', 'harmonics', 'drop', 'fall', 'attack', 'decay', 'release', 'drive', 'glide'],
  live: { signal: true, notes: true },
  info: 'Left, one cycle of the wave over its pure sine. Right, one note from its strike: it starts Drop above the key, on lines an octave apart, and its body is as thick as it is loud. Dashed is a key let go, dotted a slide. A played note fills it. Drag the handles for Drop, Fall and Decay.',
  init: () => ({
    voice: subBassVoice(),
    tone: { second: 0, third: 0, fifth: 0, seventh: 0 },
    xs: new Float32Array(SUB_STEPS),
    middle: new Float32Array(SUB_STEPS),
    half: new Float32Array(SUB_STEPS),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const parts = subParts(frame)
    const { wave, note, key } = parts
    const shape = clamp(frame.value('shape'), 0, 1)
    const harmonics = clamp(frame.value('harmonics'), 0, 1)
    const drive = clamp(frame.value('drive'), 0, 1)
    const drop = frame.value('drop')
    const fall = frame.value('fall') * 0.001
    const glide = frame.value('glide')
    const times: SubBassTimes = {
      attack: frame.value('attack'),
      decay: frame.value('decay'),
      release: frame.value('release'),
    }
    const holds = times.decay >= SUB_HOLD_FROM_SEC
    const foot = note.y + note.h
    const yOf = (semitones: number): number => key - subRise(semitones) * parts.rise

    // The voice as the keys leave it, and whether it still sounds. Keys nearer than half a
    // block are more likely in one block than in two.
    const together = (0.5 * BLOCK_FRAMES) / frame.sampleRate
    const voice = subBassPlay(frame.notes, times, glide, together, state.voice)
    const goal = voice.since < 0 ? null : subGoal(voice, voice.since)
    const levelNow = goal ? subBassLevel(voice.since, voice.up, voice.from, times) : 0
    const sounding = goal !== null && subBassShare(levelNow * goal.touch) >= SUB_DONE

    // --- The wave: what is added over the sine -------------------------------
    const middle = wave.y + wave.h / 2
    const tall = (wave.h / 2 - 1) / SUB_SWING
    rule(ctx, wave.x, middle, wave.x + wave.w, middle, { colour: colours.ink, alpha: INK.grid })
    // A note at full, as the knobs set it. Between it and the sine lies what the three knobs add.
    const tone = subBassTone(shape, harmonics, state.tone)
    subWavePath(ctx, wave, tone, 1, 1, drive, tall)
    for (let x = wave.w; x >= 0; x--)
      ctx.lineTo(wave.x + x, middle - Math.sin((2 * Math.PI * x) / wave.w) * tall)
    ctx.closePath()
    ctx.globalAlpha = 0.3
    ctx.fillStyle = colours.ink
    ctx.fill()
    ctx.beginPath()
    for (let x = 0; x <= wave.w; x++) {
      const y = middle - Math.sin((2 * Math.PI * x) / wave.w) * tall
      if (x === 0) ctx.moveTo(wave.x, y)
      else ctx.lineTo(wave.x + x, y)
    }
    ctx.setLineDash([2, 2])
    ctx.globalAlpha = INK.back
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.setLineDash([])
    subWavePath(ctx, wave, tone, 1, 1, drive, tall)
    ctx.globalAlpha = sounding ? INK.back : 1
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.stroke()
    ctx.globalAlpha = 1

    // --- The note: the scales -------------------------------------------------
    for (const seconds of SUB_SCALE_SEC) {
      const x = subX(seconds, note)
      rule(ctx, x, note.y, x, foot, { colour: colours.ink, alpha: INK.grid })
    }
    // The key's own pitch, and a line at every octave above it.
    for (let semitones = 12; semitones <= SUB_ABOVE_ST; semitones += 12) {
      const y = yOf(semitones)
      rule(ctx, note.x, y, note.x + note.w, y, { colour: colours.ink, alpha: INK.grid })
    }
    rule(ctx, note.x, key, note.x + note.w, key, { colour: colours.ink, alpha: INK.rule })

    // --- The note at rest: a key struck at full and held ----------------------
    const pitchAt = (seconds: number): number => yOf(drop * subBassFall(seconds, fall))
    const heldEnd = holds ? SUB_LONG_SEC : times.attack + times.decay
    let count = subLay(
      state,
      note,
      0,
      heldEnd,
      pitchAt,
      (seconds) => parts.half * subBassShare(subBassLevel(seconds, null, 0, times)),
    )
    subOutline(ctx, state, count, true)
    ctx.globalAlpha = 0.24
    ctx.fillStyle = colours.ink
    ctx.fill()
    // A note that holds runs off the edge: its end is left open.
    subOutline(ctx, state, count, false)
    ctx.globalAlpha = sounding ? INK.back : 1
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.lineJoin = 'round'
    ctx.stroke()
    // The same key let go at the top of its rise: it is gone a Release later.
    count = subLay(
      state,
      note,
      times.attack,
      times.attack + times.release,
      pitchAt,
      (seconds) => parts.half * subBassShare(subBassLevel(seconds, times.attack, 0, times)),
    )
    subOutline(ctx, state, count, false)
    ctx.setLineDash([2, 2])
    ctx.globalAlpha = INK.text
    ctx.stroke()
    // A key slid to from the fifth under it: a straight line in pitch that arrives after Glide.
    if (glide > 0) {
      count = subLay(
        state,
        note,
        0,
        glide,
        (seconds) => yOf(-SUB_BELOW_ST * (1 - seconds / glide)),
        () => 0,
      )
      ctx.beginPath()
      for (let i = 0; i < count; i++) {
        if (i === 0) ctx.moveTo(state.xs[i], state.middle[i])
        else ctx.lineTo(state.xs[i], state.middle[i])
      }
      ctx.setLineDash([1, 2])
      ctx.stroke()
    }
    ctx.setLineDash([])
    ctx.globalAlpha = 1

    // How far above the key the strike starts, and where it has landed: the corner the handle stands on.
    const corner = subX(fall, note)
    if (drop > 0) {
      const y = yOf(drop)
      rule(ctx, note.x, y, corner, y, { colour: colours.ink, alpha: INK.back, dash: [2, 2] })
      rule(ctx, corner, y, corner, key, { colour: colours.ink, alpha: INK.back, dash: [2, 2] })
    }

    // --- The note that sounds --------------------------------------------------
    let hz = 0
    if (sounding && goal) {
      const up = voice.up
      const pitchNow = subBassPitch(voice, voice.since, drop, fall)
      hz = Math.min(Math.pow(2, pitchNow), SUB_MAX_HZ, 0.4 * frame.sampleRate)
      // The one voice from its strike to now, about the key it is on its way to: a slide comes
      // in from the key it left, a drop from above, and it is as thick as it was loud. A pitch
      // further off than the scale reaches lies along its edge, where it is still seen.
      const above = (seconds: number): number =>
        clamp(
          (subBassPitch(voice, seconds, drop, fall) - goal.to) * 12,
          -SUB_BELOW_ST,
          SUB_ABOVE_ST,
        )
      // The level of the key that plays; the device crosses from one key's level to the next in 5 ms.
      const loud = (seconds: number): number =>
        subBassLevel(seconds, up, voice.from, times) * (subGoal(voice, seconds)?.touch ?? 0)
      count = subLay(
        state,
        note,
        0,
        voice.since,
        (seconds) => yOf(above(seconds)),
        (seconds) => parts.half * subBassShare(loud(seconds)),
      )
      const box: Box = { x: note.x - 1, y: note.y - 1, w: note.w + 2, h: note.h + 2 }
      clipped(ctx, box, () => {
        subOutline(ctx, state, count, true)
        ctx.fillStyle = colours.accent
        ctx.fill()
        // Its head is where the voice is now, as round as the body is thick.
        const head = Math.max(2, state.half[count - 1])
        dot(ctx, state.xs[count - 1], state.middle[count - 1], head, colours.accent)
      })

      // The wave now: as much of it as passes in one cycle of the key, so a pitch above the key
      // crowds it, and as tall as the note is loud on the scale of its body. The drive lets go
      // of it as it fades.
      const amp = levelNow * goal.touch
      const cycles = clamp(Math.pow(2, pitchNow - goal.to), 0.125, 16)
      subBassTone(shape, harmonics, state.tone, hz, frame.sampleRate)
      subWavePath(ctx, wave, state.tone, cycles, amp, drive, (tall * subBassShare(amp)) / amp)
      ctx.strokeStyle = colours.accent
      ctx.lineWidth = 1.75
      ctx.lineJoin = 'round'
      ctx.stroke()
    }

    levelFoot(frame, parts.foot, outShare(frame))

    // The scale of seconds is said at the foot of the note's box, under its body, and the scale of
    // pitch on its first line, at the far end where no strike and no slide reaches.
    label(frame, '1 s', subX(1, note) - 2, foot, 'right')
    label(frame, '10 s', subX(10, note) - 2, foot, 'right')
    text(frame, '12 st', note.x + note.w, yOf(12) - 2, { align: 'right' })

    // The words: how long a held note lasts, and the pitch that sounds (at rest, the drop a strike makes).
    const base = parts.words.y + 8
    text(frame, holds ? 'Hold' : secondsText(times.decay), parts.words.x, base)
    const figure = sounding
      ? `${pitchName(hz)} ${hzText(hz)}`
      : drop > 0
        ? `${Math.round(drop)} st in ${Math.round(fall * 1000)} ms`
        : 'No drop'
    text(frame, figure, parts.words.x + parts.words.w, base, { align: 'right' })

    for (const point of subHandles(frame))
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: subHandles,
})

function subHandles(view: DisplayView): DisplayHandle[] {
  const { note, key, rise } = subParts(view)
  const attack = view.value('attack')
  const decay = view.value('decay')
  const fall = view.spec('fall')
  const held = view.spec('decay')
  return [
    {
      // Up for a higher start, across for a longer fall.
      key: 'drop',
      name: 'Drop and Fall',
      x: subX(view.value('fall') * 0.001, note),
      y: key - subRise(view.value('drop')) * rise,
      drag: (toX, toY) => ({
        drop: subSemitones((key - toY) / rise),
        fall: clamp(subSeconds(toX, note) * 1000, fall?.min ?? 5, fall?.max ?? 800),
      }),
      reset: () => ({
        drop: view.spec('drop')?.default ?? 7,
        fall: view.spec('fall')?.default ?? 40,
      }),
    },
    {
      // Where a held note ends, a Decay after its rise. At the far right it holds.
      key: 'decay',
      name: 'Decay',
      x: subX(decay >= SUB_HOLD_FROM_SEC ? SUB_LONG_SEC : attack + decay, note),
      y: key,
      drag: (toX) => ({
        decay: clamp(subSeconds(toX, note) - attack, held?.min ?? 0.05, held?.max ?? 20),
      }),
      reset: () => ({ decay: view.spec('decay')?.default ?? 20 }),
    },
  ]
}

export const SUB_BASS_INSTRUMENT_FACES: Readonly<Record<string, PlateFace>> = {
  'sub-bass': { display: subBass, face: ['drop', 'fall', 'shape', 'harmonics'] },
}
