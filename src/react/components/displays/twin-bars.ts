// The display of Twin Bars: two bars a few hertz apart on every key.
//
// It is two lanes over time and nothing in it moves with the beat. The upper
// lane is the first seconds after a stroke: the swell each ear is given, the
// left ear's above the line and the right ear's below, over the swell of the
// two bars summed, which is what a mono fold or the air between two speakers
// makes of them. The pair is drawn standing still along the time axis, so
// twenty hertz is twenty humps and not a light going on and off. The lower
// lane is how long each mode of the bar rings, on a scale of seconds, with
// the fundamental of a key let go dashed.
//
// The device reports no readings, so all of it is worked out from the knobs
// and from the last key played, with the device's own arithmetic
// (`cpp/devices/twin-bars/twin_bars.h`; the constants carry its names).
// Three things follow a stroke: a dot on the ring lane at the stroke's age,
// two dots on the ears' swells while Beat is three hertz or under, and the
// pair beside the material's name, which is lit while a key is held. The
// level in the foot is the mean over the last second.

import {
  INK,
  clamp,
  clipped,
  dot,
  fillBetween,
  fillRect,
  ground,
  label,
  rule,
  text,
  trace,
  yOfDb,
  type Box,
  type Point,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayNote,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import { levelFoot, pitchName } from './instrument-parts'
import { secondsText } from './tails'

type Size = Pick<DisplayView, 'width' | 'height'>

const TWO_PI = Math.PI * 2

/** `twin_bars.h`, `Bars`: what sets one material apart from the next. */
export interface TwinBarsMaterial {
  name: string
  /** `ratio`: each mode's pitch against the fundamental. */
  ratio: readonly number[]
  /** `level`: how strongly a hard stroke lights each mode against the fundamental. */
  level: readonly number[]
  /** `damping`: extra decay rate per unit of ratio above the fundamental. */
  damping: number
  /** `contact`: mallet contact time against the metal bar's. */
  contact: number
  /** `gain`: evens out how loud a stroke is across materials. */
  gain: number
}

/** `twin_bars.h`, `kBars`: Metal, Wood, Glass, as Bar counts them. */
export const TWIN_BARS_MATERIALS: readonly TwinBarsMaterial[] = [
  {
    name: 'Metal',
    ratio: [1, 2.757, 5.404, 8.933],
    level: [1, 0.7, 0.45, 0.28],
    damping: 0.25,
    contact: 1,
    gain: 1,
  },
  { name: 'Wood', ratio: [1, 4, 9.9], level: [1, 1.2, 0.9], damping: 3, contact: 1, gain: 1 },
  {
    name: 'Glass',
    ratio: [1, 2.32, 4.25, 6.63],
    level: [1, 0.22, 0.09, 0.04],
    damping: 0.6,
    contact: 1.3,
    gain: 1.4,
  },
]

/** `kStrikeLevel`: what a key at full strength leaves in each bar's fundamental, before Volume. */
const STRIKE_LEVEL = 0.25
/** `kSixtyDb`: ln(1000), so a ring time is the time to fall 60 dB. */
const SIXTY_DB = 6.907755279
/** `kChokeSeconds`: Damp 1 stops a released bar in this long. */
const CHOKE_SEC = 0.07
/** `kShortestRing`: no mode rings shorter. */
const SHORTEST_RING_SEC = 0.005
/** `kSoftContact`, `kHardContact`, `kLongestContact`, `kMostOfAPeriod`: the mallet's contact at middle C. */
const SOFT_CONTACT_SEC = 0.0025
const HARD_CONTACT_SEC = 0.00025
const LONGEST_CONTACT_SEC = 0.008
const MOST_OF_A_PERIOD = 0.9
/** `kC4`, `kMinHz`, `kMaxHz`. */
const C4_HZ = 261.6256
const MIN_HZ = 20
const MAX_HZ = 8000
/** `kDarkTilt`, `kBrightTilt`: Tone as a power of a mode's ratio at its two ends. */
const DARK_TILT = -1.5
const BRIGHT_TILT = 0.5
/** `kTopHz`, `kTopOfBand`, `kMostBeat`: a mode above these does not exist. */
const TOP_HZ = 16000
const TOP_OF_BAND = 0.45
const MOST_BEAT = 20

const materialOf = (material: number): TwinBarsMaterial =>
  TWIN_BARS_MATERIALS[clamp(Math.round(material), 0, TWIN_BARS_MATERIALS.length - 1)]

/**
 * `kit::ear_gains` (`cpp/kit/beat.h`): how much of its own bar and of the
 * other bar each ear is given. The left ear's own bar is the higher one.
 */
export function twinBarsEars(ears: number): { same: number; other: number } {
  const e = clamp(ears, 0, 1)
  return { same: 0.5 + 0.5 * e, other: 0.5 - 0.5 * e }
}

/** `TwinBars::ring`, `let_go`: a key let go rings Decay^(1 - Damp) · 0.07^Damp, so this share of Decay. */
export function twinBarsLetGo(decay: number, damp: number): number {
  return Math.pow(CHOKE_SEC / decay, damp)
}

/** `TwinBars::ring`: the seconds mode `k` takes to fall 60 dB; `letGo` is 1 for a held key. */
export function twinBarsRing(material: number, k: number, decay: number, letGo = 1): number {
  const made = materialOf(material)
  return Math.max((decay * letGo) / (1 + made.damping * (made.ratio[k] - 1)), SHORTEST_RING_SEC)
}

/** `TwinBars::stroke_level`: what a key press at `gain` leaves in the fundamental of a bar at rest. */
export function twinBarsStroke(material: number, gain: number): number {
  return STRIKE_LEVEL * materialOf(material).gain * gain * (0.3 + 0.7 * gain)
}

/** `TwinBars::response`: how much of a raised-cosine push `periods` of a mode long ends up in the mode. */
export function twinBarsResponse(periods: number): number {
  if (periods < 1e-3) return 1
  const spare = 1 - periods * periods
  if (Math.abs(spare) < 1e-3) return 0.5
  return Math.abs(Math.sin(Math.PI * periods) / (Math.PI * periods * spare))
}

/**
 * `TwinBars::stroke`, `length`: how many samples the mallet pushes for. The
 * contact is the key's, the limit of most of a period is that of the bar's
 * own fundamental, `barHz`.
 */
export function twinBarsContact(
  material: number,
  mallet: number,
  hz: number,
  gain: number,
  barHz: number,
  sampleRate: number,
): number {
  const contact =
    SOFT_CONTACT_SEC *
    Math.pow(HARD_CONTACT_SEC / SOFT_CONTACT_SEC, mallet) *
    materialOf(material).contact *
    Math.sqrt(C4_HZ / hz) *
    (1.4 - 0.6 * gain)
  const most = Math.min(LONGEST_CONTACT_SEC * sampleRate, (MOST_OF_A_PERIOD * sampleRate) / barHz)
  return Math.max(2, Math.floor(Math.min(contact * sampleRate, most) + 0.5))
}

/** `TwinBars::tilt`: Tone as a power of a mode's ratio, 0 in the middle. */
export function twinBarsTilt(tone: number): number {
  return tone < 0.5 ? DARK_TILT * (1 - 2 * tone) : BRIGHT_TILT * (2 * tone - 1)
}

/** What the display reads off the knobs. */
export interface TwinBarsSettings {
  beat: number
  ears: number
  material: number
  mallet: number
  decay: number
  /** Scatter in ms. */
  scatter: number
  damp: number
  tone: number
}

export function twinBarsSettings(value: (name: string) => number): TwinBarsSettings {
  return {
    beat: value('beat'),
    ears: value('ears'),
    material: clamp(Math.round(value('bar')), 0, TWIN_BARS_MATERIALS.length - 1),
    mallet: value('mallet'),
    decay: value('decay'),
    scatter: value('scatter'),
    damp: value('damp'),
    tone: value('tone'),
  }
}

export interface TwinBarsMode {
  hz: number
  /** As it is heard just after a fresh stroke, against the fundamental. */
  level: number
  /** Seconds to fall 60 dB while the key is held. */
  seconds: number
}

/**
 * The modes of one bar after a stroke on a bar at rest (`TwinBars::start`,
 * `stroke` and `colour`). `side` is -1 for the first bar (the lower, the
 * right ear's), 1 for the second, and 0 for the key that lies between them,
 * which is what the display draws.
 */
export function twinBarsModes(
  set: TwinBarsSettings,
  hz: number,
  gain: number,
  side: -1 | 0 | 1,
  sampleRate: number,
): TwinBarsMode[] {
  const made = materialOf(set.material)
  const key = clamp(hz, MIN_HZ, MAX_HZ)
  const off = 0.5 * side * set.beat
  const length = twinBarsContact(set.material, set.mallet, key, gain, key + off, sampleRate)
  const base = made.level[0] * twinBarsResponse((length * (key + off)) / sampleRate)
  const tilt = twinBarsTilt(set.tone)
  const modes: TwinBarsMode[] = []
  for (let k = 0; k < made.ratio.length; k++) {
    // Out of band at the top of Beat: the mode does not exist, on either bar.
    if (!(key * made.ratio[k] + 0.5 * MOST_BEAT < Math.min(TOP_HZ, TOP_OF_BAND * sampleRate))) break
    const modeHz = key * made.ratio[k] + off
    const struck = (made.level[k] / base) * twinBarsResponse((length * modeHz) / sampleRate)
    modes.push({
      hz: modeHz,
      level: struck * (k === 0 ? 1 : Math.pow(made.ratio[k], tilt)),
      seconds: twinBarsRing(set.material, k, set.decay),
    })
  }
  return modes
}

/** The fundamentals of a key's two bars at one moment: their sizes against a fresh stroke, and the angle between them. */
export interface TwinBarsPair {
  first: number
  second: number
  angle: number
}

/**
 * The two fundamentals `t` seconds after the stroke lands on the first bar,
 * on a held key. Both are pushed the same way, so with no Scatter the beat
 * starts at its crest; the second bar is struck Scatter later (to a whole
 * sample, `TwinBars::play`) and turns `hz + Beat/2` times a second from then.
 */
export function twinBarsPair(
  t: number,
  set: Pick<TwinBarsSettings, 'beat' | 'decay' | 'scatter'>,
  hz: number,
  sampleRate: number,
): TwinBarsPair {
  const late = Math.floor(set.scatter * 0.001 * sampleRate + 0.5) / sampleRate
  const seconds = Math.max(set.decay, SHORTEST_RING_SEC)
  return {
    first: t >= 0 ? Math.exp((-SIXTY_DB * t) / seconds) : 0,
    second: t >= late ? Math.exp((-SIXTY_DB * (t - late)) / seconds) : 0,
    angle: TWO_PI * (set.beat * t - (clamp(hz, MIN_HZ, MAX_HZ) + 0.5 * set.beat) * late),
  }
}

/** The swell of the two bars summed, as a mono fold has it: 1 where two fresh strokes meet at the crest. */
export function twinBarsSum(pair: TwinBarsPair): number {
  const { first, second, angle } = pair
  return 0.5 * Math.sqrt(first * first + second * second + 2 * first * second * Math.cos(angle))
}

/** The swell one ear is given (`kit::to_ears`): the left ear has `same` of the second bar and `other` of the first. */
export function twinBarsEar(pair: TwinBarsPair, ears: number, left: boolean): number {
  const { same, other } = twinBarsEars(ears)
  const own = same * (left ? pair.second : pair.first)
  const far = other * (left ? pair.first : pair.second)
  return Math.sqrt(own * own + far * far + 2 * own * far * Math.cos(pair.angle))
}

/** The fundamental of a stroke `age` seconds old, in dB under the stroke: held, then let go `released` seconds ago. */
export function twinBarsFallDb(
  set: Pick<TwinBarsSettings, 'material' | 'decay' | 'damp'>,
  age: number,
  released: number | null,
): number {
  const held = twinBarsRing(set.material, 0, set.decay)
  const letGo = twinBarsRing(set.material, 0, set.decay, twinBarsLetGo(set.decay, set.damp))
  const free = Math.min(released ?? 0, age)
  return -60 * ((age - free) / held + free / letGo)
}

// --- The picture ------------------------------------------------------------

/** The upper lane shows four swells, and never less than a second nor more than eight. */
export function twinBarsSpan(beat: number): number {
  return clamp(4 / beat, 1, 8)
}

/** The lower lane's scale of seconds, by ratio, and its scale of level in dB against the fundamental at the stroke. */
export const TWIN_BARS_RING_FROM_SEC = 0.01
export const TWIN_BARS_RING_TO_SEC = 30
export const TWIN_BARS_TOP_DB = 12
export const TWIN_BARS_FLOOR_DB = -60
/** A dot shows where the beat is only this slow (R10): above it the beat is the still shape alone. */
export const TWIN_BARS_MARK_MOST_HZ = 3
/** A stroke is followed for at least this long, so a roll restarts the marks twice a second at the most. */
export const TWIN_BARS_FOLLOWS_SEC = 0.5
/** The pair stays lit this long after the last key was held, so short notes do not make it flicker. */
export const TWIN_BARS_LIT_SEC = 0.5
/** The level in the foot is the mean over this long. */
export const TWIN_BARS_LEVEL_SEC = 1

export interface TwinBarsLayout {
  /** The baseline of the words at the top, and where they start and end. */
  head: { left: number; right: number; baseline: number }
  /** The upper lane, and the shares of the two bars beside it. */
  beat: Box
  shares: Box
  /** The lower lane and the baseline of its scale. */
  ring: Box
  scale: number
  foot: Box
}

export function twinBarsLayout(size: Size): TwinBarsLayout {
  const box: Box = { x: 4, y: 4, w: size.width - 8, h: size.height - 8 }
  const lane = Math.max(8, Math.floor((box.h - 30) / 2))
  const beat: Box = { x: box.x + 13, y: box.y + 11, w: box.w - 13, h: lane }
  const ring: Box = { x: box.x, y: beat.y + lane + 3, w: box.w, h: lane }
  return {
    head: { left: box.x, right: box.x + box.w, baseline: box.y + 8 },
    beat,
    shares: { x: box.x + 7, y: beat.y, w: 4, h: lane },
    ring,
    scale: ring.y + lane + 9,
    foot: { x: box.x, y: box.y + box.h - 4, w: box.w, h: 4 },
  }
}

/** Where a time stands on the lower lane. */
export function twinBarsRingX(seconds: number, lane: Box): number {
  const share =
    Math.log(Math.max(seconds, 1e-6) / TWIN_BARS_RING_FROM_SEC) /
    Math.log(TWIN_BARS_RING_TO_SEC / TWIN_BARS_RING_FROM_SEC)
  return lane.x + clamp(share, 0, 1) * lane.w
}

const ringY = (db: number, lane: Box): number =>
  yOfDb(db, lane, TWIN_BARS_TOP_DB, TWIN_BARS_FLOOR_DB)

/** A level falling 60 dB in `seconds` from `fromDb`, as points on the lower lane down to its floor. */
function fallPoints(fromDb: number, seconds: number, lane: Box): Point[] {
  const points: Point[] = []
  if (!(fromDb > TWIN_BARS_FLOOR_DB)) return points
  const ends = (seconds * (fromDb - TWIN_BARS_FLOOR_DB)) / 60
  const ratio = TWIN_BARS_RING_TO_SEC / TWIN_BARS_RING_FROM_SEC
  const steps = Math.max(2, Math.round(lane.w / 2))
  for (let i = 0; i <= steps; i++) {
    const t = TWIN_BARS_RING_FROM_SEC * Math.pow(ratio, i / steps)
    if (t >= ends) break
    points.push([lane.x + (i / steps) * lane.w, ringY(fromDb - (60 * t) / seconds, lane)])
  }
  // The last point is where it reaches the floor, so the eye reads the ring time off the scale.
  points.push([twinBarsRingX(ends, lane), ringY(TWIN_BARS_FLOOR_DB, lane)])
  return points
}

const beatText = (hz: number): string => `${hz.toFixed(1).replace(/\.0$/, '')} Hz apart`

interface Stroke {
  id: number
  /** When it was struck and when the marks took it up, on the display's clock. */
  at: number
  taken: number
  hz: number
  gain: number
  /** When it was let go; null while it is held. */
  freed: number | null
}

interface TwinBarsState {
  /** The stroke the marks follow. */
  stroke: Stroke | null
  /** The pair is lit until then. */
  lit: number
  /** The power that came out on each frame of the last second. */
  heard: { at: number; dt: number; power: number }[]
  /** The foot as it is drawn: it moves a whole pixel at a time. */
  share: number
}

/**
 * The stroke the marks follow on this frame, as a note. The newest stroke is
 * taken up only when the one followed has been followed for
 * `TWIN_BARS_FOLLOWS_SEC`. Until then it is followed on the display's own
 * clock, so a key struck again and again, which the plate lists as one note
 * that keeps starting over, does not start the marks over with it.
 */
function followed(
  state: TwinBarsState,
  notes: readonly DisplayNote[],
  now: number,
): DisplayNote | null {
  const bornAt = (note: DisplayNote): number => now - note.age
  const freedAt = (note: DisplayNote): number | null =>
    note.released === null ? null : now - note.released
  let stroke = state.stroke
  let mine: DisplayNote | null = null
  if (stroke) {
    for (const note of notes) {
      if (note.id !== stroke.id || Math.abs(bornAt(note) - stroke.at) > 0.1) continue
      if (!mine || Math.abs(bornAt(note) - stroke.at) < Math.abs(bornAt(mine) - stroke.at))
        mine = note
    }
    // Its age runs on the display's own clock; the plate's list says only whether it is still held.
    if (mine) stroke.freed = freedAt(mine)
  }
  let newest: DisplayNote | null = null
  for (const note of notes) if (!newest || note.age <= newest.age) newest = note
  if (newest && newest !== mine && (!stroke || now - stroke.taken >= TWIN_BARS_FOLLOWS_SEC)) {
    stroke = {
      id: newest.id,
      at: bornAt(newest),
      taken: now,
      hz: newest.frequency,
      gain: newest.gain,
      freed: freedAt(newest),
    }
  } else if (notes.length === 0) stroke = null
  state.stroke = stroke
  if (!stroke) return null
  return {
    id: stroke.id,
    frequency: stroke.hz,
    gain: stroke.gain,
    age: now - stroke.at,
    released: stroke.freed === null ? null : now - stroke.freed,
  }
}

/** The level that came out, averaged over the last second, as a share of a scale from -60 dB up to full scale. */
function heardShare(
  state: TwinBarsState,
  frame: DisplayFrame<TwinBarsState>,
  wide: number,
): number {
  if (!frame.powered || !frame.signal) {
    state.heard.length = 0
    state.share = 0
    return 0
  }
  const rms = frame.signal.output.rms
  state.heard.push({
    at: frame.now,
    dt: frame.dt > 0 ? frame.dt : 1 / 30,
    power: Number.isFinite(rms) ? rms * rms : 0,
  })
  while (state.heard.length > 0 && state.heard[0].at <= frame.now - TWIN_BARS_LEVEL_SEC)
    state.heard.shift()
  let sum = 0
  let time = 0
  for (const each of state.heard) {
    sum += each.power * each.dt
    time += each.dt
  }
  const mean = sum / Math.max(time, TWIN_BARS_LEVEL_SEC)
  const share = mean > 1e-12 ? clamp(1 - (10 * Math.log10(mean)) / -60, 0, 1) : 0
  // A pixel at a time: what is left of a pulse in a second's mean does not make the foot shiver.
  if (share === 0 || Math.abs(share - state.share) * wide >= 1) state.share = share
  return state.share
}

const twinBars = plateDisplay<TwinBarsState>({
  place: 'window',
  columns: 2,
  params: ['beat', 'ears', 'bar', 'mallet', 'decay', 'scatter', 'damp', 'tone'],
  live: { signal: true, notes: true },
  info: 'Top, the first seconds of a key: the swell each ear is given, left above the line and right below, over the swell of the two bars summed. Under it, how long each overtone rings on a scale of seconds, dashed for a key let go. The foot is the level over the last second.',
  init: () => ({ stroke: null, lit: -Infinity, heard: [], share: 0 }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const set = twinBarsSettings((name) => frame.value(name))
    const at = twinBarsLayout(frame)
    const note = frame.powered ? followed(state, frame.notes, frame.now) : null
    if (!frame.powered) state.stroke = null
    const hz = state.stroke?.hz ?? C4_HZ
    const gain = state.stroke?.gain ?? 1

    // The words: the material, the pair (lit while a key is held), the key and how far apart the bars are.
    const made = materialOf(set.material)
    text(frame, made.name, at.head.left, at.head.baseline)
    if (frame.powered && frame.notes.some((each) => each.released === null))
      state.lit = frame.now + TWIN_BARS_LIT_SEC
    const lit = frame.powered && frame.now < state.lit
    const pairX = at.head.left + 28
    for (const row of [0, 1])
      fillRect(
        ctx,
        { x: pairX + row, y: at.head.baseline - 6 + 4 * row, w: 9, h: 2 },
        lit ? colours.accent : colours.ink,
        lit ? 1 : INK.back,
      )
    text(frame, pitchName(hz), pairX + 14, at.head.baseline, { alpha: INK.text })
    text(frame, beatText(set.beat), at.head.right, at.head.baseline, { align: 'right' })

    // The upper lane: the pair over the first seconds, standing still.
    const lane = at.beat
    const span = twinBarsSpan(set.beat)
    const middle = lane.y + lane.h / 2
    const half = lane.h / 2 - 1
    const left: Point[] = []
    const right: Point[] = []
    const above: Point[] = []
    const below: Point[] = []
    const steps = Math.max(2, Math.round(lane.w * 2))
    for (let i = 0; i <= steps; i++) {
      const x = lane.x + (i / steps) * lane.w
      const pair = twinBarsPair((i / steps) * span, set, hz, frame.sampleRate)
      const sum = twinBarsSum(pair) * half
      above.push([x, middle - sum])
      below.push([x, middle + sum])
      left.push([x, middle - twinBarsEar(pair, set.ears, true) * half])
      right.push([x, middle + twinBarsEar(pair, set.ears, false) * half])
    }
    fillBetween(ctx, above, below, colours.ink, INK.fill)
    rule(ctx, lane.x, middle, lane.x + lane.w, middle, { colour: colours.ink, alpha: INK.rule })
    trace(ctx, left, { colour: colours.ink, width: 1.2 })
    trace(ctx, right, { colour: colours.ink, width: 1.2 })
    // Beside it, what each ear holds: its own bar strong, the other bar faint.
    const { same } = twinBarsEars(set.ears)
    const own = same * half
    fillRect(ctx, { x: at.shares.x, y: middle - 1 - own, w: at.shares.w, h: own }, colours.ink)
    fillRect(
      ctx,
      { x: at.shares.x, y: middle - 1 - half, w: at.shares.w, h: half - own },
      colours.ink,
      INK.fill,
    )
    fillRect(ctx, { x: at.shares.x, y: middle + 1, w: at.shares.w, h: own }, colours.ink)
    fillRect(
      ctx,
      { x: at.shares.x, y: middle + 1 + own, w: at.shares.w, h: half - own },
      colours.ink,
      INK.fill,
    )
    text(frame, 'L', at.head.left, middle - 3)
    text(frame, 'R', at.head.left, middle + 10)
    label(frame, secondsText(span), lane.x + lane.w, middle + 3, 'right')

    // The lower lane: every mode's fall on a scale of seconds, the fundamental of a key let go dashed.
    const ring = at.ring
    for (const seconds of [0.1, 1, 10]) {
      const x = twinBarsRingX(seconds, ring)
      rule(ctx, x, ring.y, x, ring.y + ring.h, { colour: colours.ink, alpha: INK.grid })
      text(frame, seconds === 10 ? '10 s' : String(seconds), x, at.scale, {
        align: 'center',
        alpha: INK.text,
      })
    }
    const floor = ring.y + ring.h
    rule(ctx, ring.x, floor, ring.x + ring.w, floor, { colour: colours.ink, alpha: INK.rule })
    const modes = twinBarsModes(set, hz, gain, 0, frame.sampleRate)
    clipped(ctx, { x: ring.x, y: ring.y - 1, w: ring.w, h: ring.h + 2 }, () => {
      for (let k = modes.length - 1; k >= 0; k--) {
        const fromDb = 20 * Math.log10(modes[k].level)
        trace(ctx, fallPoints(fromDb, modes[k].seconds, ring), {
          colour: colours.ink,
          width: k === 0 ? 1.5 : 1,
          alpha: k === 0 ? INK.trace : INK.back,
        })
      }
      const letGo = twinBarsRing(set.material, 0, set.decay, twinBarsLetGo(set.decay, set.damp))
      trace(ctx, fallPoints(0, letGo, ring), {
        colour: colours.ink,
        width: 1,
        alpha: INK.text,
        dash: [2, 2],
      })
    })

    levelFoot(frame, at.foot, heardShare(state, frame, at.foot.w))

    // The marks, last: where the followed stroke is in its ring, and in its swell while the beat is slow.
    if (!note) return
    const fallen = twinBarsFallDb(set, note.age, note.released)
    if (fallen > TWIN_BARS_FLOOR_DB)
      dot(ctx, twinBarsRingX(note.age, ring), ringY(fallen, ring), 2.5, colours.accent, {
        ring: colours.ink,
      })
    if (set.beat > TWIN_BARS_MARK_MOST_HZ || note.age >= span) return
    const pair = twinBarsPair(note.age, set, hz, frame.sampleRate)
    const x = lane.x + (note.age / span) * lane.w
    dot(ctx, x, middle - twinBarsEar(pair, set.ears, true) * half, 2, colours.accent)
    dot(ctx, x, middle + twinBarsEar(pair, set.ears, false) * half, 2, colours.accent)
  },
})

export const TWIN_BARS_FACES: Readonly<Record<string, PlateFace>> = {
  'twin-bars': { display: twinBars, face: ['beat', 'ears', 'bar', 'decay'] },
}
