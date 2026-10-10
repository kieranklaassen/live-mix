// The display of the FM Bass: two operators, one bending the other, with feedback and a sub.
//
// It has one voice, so it has one comb: the partials of the note that sounds,
// standing where they sound, low to the left. What makes the instrument is how
// far the one sine bends the other, and that it bends furthest at the strike:
// the comb is wide where a key is struck and closes to what Body leaves of it.
// So the comb is drawn twice at rest, as hairlines for the strike and as bars
// for what stays, and a played note is the bars in the accent on their way
// from the one to the other. Under it lies the same note along time, its
// brightness inside its loudness. The keys are played through again as the
// device takes them: of several held keys the comb stands on the one the
// voice plays, and it slides there as the voice does.

import {
  INK,
  clamp,
  crisp,
  dot,
  gainToDb,
  ground,
  handle,
  label,
  rule,
  text,
  type Box,
} from '../display-kit'
import {
  plateDisplay,
  type DisplayFrame,
  type DisplayHandle,
  type DisplayNote,
  type DisplayView,
  type PlateFace,
} from '../plate-display'
import { levelFoot, outShare, pitchName } from './instrument-parts'
import { secondsText } from './tails'

type Size = Pick<DisplayView, 'width' | 'height'>
type Paint = Pick<DisplayFrame, 'ctx' | 'colours'>

const TAU = 2 * Math.PI

/** `fm_bass.h`, `kModSteps`: the modulator's pitch in halves of the key's, for the ratios 1/2, 1, 2, 3, 4, 5 and 7. */
const FM_BASS_STEPS = [1, 2, 4, 6, 8, 10, 14] as const
const FM_BASS_RATIOS = ['1/2', '1', '2', '3', '4', '5', '7'] as const
/** `fm_bass.h`, `kMaxIndex`, `kMaxFeedback` and `kBendFloor`: the bend in radians at Depth 1 under the hardest key, the modulator's bend on itself at Feedback 1, and the share of the bend the softest key has. */
const FM_BASS_MAX_INDEX = 8
const FM_BASS_MAX_FEEDBACK = 1
const FM_BASS_BEND_FLOOR = 0.4
/** `fm_bass.h`, `kStrikeSeconds`, `kHoldFromSeconds`, `kSixtyDb`, `kBiteNepers`, `kSilent`: the strike, the Decay from which a key holds, the two falls and where a note ends. */
const FM_BASS_STRIKE_SEC = 0.002
const FM_BASS_HOLD_FROM_SEC = 19.9
const SIXTY_DB = 6.907755279
const FM_BASS_BITE_NEPERS = 4.605170186
const FM_BASS_SILENT = 1e-5
/** `FmBass::advance_contours`: under this the bend is nothing. */
const FM_BASS_UNBENT = 1e-6
/** `fm_bass.h`, `kRoomUsed`, `kStartHz`, `kMaxHeld`: the share of the band the bend may fill, the pitch the voice rests at, and the keys the stack holds. */
const FM_BASS_ROOM_USED = 0.9
const FM_BASS_START_HZ = 55
const FM_BASS_KEYS_MOST = 16
/** `FmBass::note_on`: the pitches a key is kept between. */
const FM_BASS_KEY_LOW_HZ = 8
const FM_BASS_KEY_HIGH_HZ = 12000

/** `FmBass::play_top`: the share of the bend a key played as hard as `gain` has. The softest still bends. */
export function fmBassBendTouch(gain: number): number {
  return FM_BASS_BEND_FLOOR + (1 - FM_BASS_BEND_FLOOR) * clamp(gain, 0, 1)
}

/** `FmBass::play_top`: how loud a key played as hard as `gain` is, 1 for the hardest. */
export function fmBassTouch(gain: number): number {
  return 0.35 + 0.65 * clamp(gain, 0, 1)
}

/** `FmBass::apply`, `kDepth`: the index in radians a key struck as hard as `gain` starts at. Depth counts by its square. */
export function fmBassIndex(depth: number, gain: number): number {
  const knob = clamp(depth, 0, 1)
  return FM_BASS_MAX_INDEX * knob * knob * fmBassBendTouch(gain)
}

/** `FmBass::apply`, `kFeedback`: the radians the modulator bends itself by. The knob is finer towards the top. */
export function fmBassFeedback(feedback: number): number {
  const knob = clamp(feedback, 0, 1)
  return FM_BASS_MAX_FEEDBACK * knob * (2 - knob)
}

/** A smooth step, with no slope at either end: the shape of the strike. */
const rise = (t: number): number => t * t * (3 - 2 * t)

/**
 * `FmBass::advance_contours`, the bend's fall: 1 at the strike, `since`
 * seconds after it 99 % of the way to nothing in the Bite time. The strike
 * takes it to 1 from `from`, where it stood, in 2 ms.
 */
export function fmBassBend(since: number, bite: number, from = 1): number {
  if (since < 0) return 0
  if (since < FM_BASS_STRIKE_SEC) return from + (1 - from) * rise(since / FM_BASS_STRIKE_SEC)
  const bend = Math.exp((-FM_BASS_BITE_NEPERS * (since - FM_BASS_STRIKE_SEC)) / bite)
  return bend < FM_BASS_UNBENT ? 0 : bend
}

/** `FmBass::process`: the index where the bend stands. It falls from `top` to Body times that, and never passes the cap of the pitch. */
export function fmBassIndexAt(top: number, body: number, bend: number, cap = Infinity): number {
  return Math.min(top * (body + (1 - body) * bend), cap)
}

/**
 * `FmBass::advance_contours`, the loudness: `since` seconds after the last
 * strike, `up` seconds after the last held key went up (null while one is
 * down). A strike of 2 ms from `from`, where it stood; 60 dB down after Decay
 * while a key is held, none of it with Decay at the top; and from the key up
 * 60 dB in Release, or in Decay where that is shorter. Under `kSilent` the
 * note has ended.
 */
export function fmBassLoudness(
  since: number,
  up: number | null,
  decay: number,
  release: number,
  from = 0,
): number {
  if (since < 0) return 0
  if (since < FM_BASS_STRIKE_SEC) return from + (1 - from) * rise(since / FM_BASS_STRIKE_SEC)
  const after = since - FM_BASS_STRIKE_SEC
  const letGo = up === null ? 0 : Math.min(up, after)
  const hold = decay >= FM_BASS_HOLD_FROM_SEC
  const fall =
    (hold ? 0 : (after - letGo) / decay) + letGo / (hold ? release : Math.min(release, decay))
  const level = Math.exp(-SIXTY_DB * fall)
  return level < FM_BASS_SILENT ? 0 : level
}

/**
 * The seconds after its strike at which a note is silence, by the same
 * contour: `up` is how long after the strike the last key went up, null while
 * one is down. A held key on a Decay at the top never ends.
 */
export function fmBassEnds(up: number | null, decay: number, release: number): number {
  // What a note has to fall, in Decay times: 100 dB at 60 dB a time.
  const whole = Math.log(1 / FM_BASS_SILENT) / SIXTY_DB
  const hold = decay >= FM_BASS_HOLD_FROM_SEC
  const held = up === null ? Infinity : Math.max(0, up - FM_BASS_STRIKE_SEC)
  if (!hold && held >= whole * decay) return FM_BASS_STRIKE_SEC + whole * decay
  if (up === null) return Infinity
  const spent = hold ? 0 : held / decay
  return FM_BASS_STRIKE_SEC + held + (whole - spent) * (hold ? release : Math.min(release, decay))
}

/**
 * `FmBass::index_cap`, its fit: how many modulator pitches from the carrier
 * the sidebands above -60 dB reach, for an index of `index` radians under a
 * modulator bent back on itself by `beta`.
 */
export function fmBassReach(index: number, beta: number): number {
  const peak = 1 + 3.2 * beta * Math.sqrt(beta)
  const skirt = 1 + 0.7 * beta * beta * beta
  return index * peak + (1.6 * Math.sqrt(index) + 1.8) * skirt
}

/** `FmBass::index_cap`: the largest index in radians whose sidebands reach no further than `room` modulator pitches. */
export function fmBassIndexCap(room: number, beta: number): number {
  const peak = 1 + 3.2 * beta * Math.sqrt(beta)
  const skirt = 1 + 0.7 * beta * beta * beta
  const spare = room - 1.8 * skirt
  if (spare <= 0) return 0
  const root = (Math.sqrt(2.56 * skirt * skirt + 4 * peak * spare) - 1.6 * skirt) / (2 * peak)
  return root * root
}

/**
 * `FmBass::set_cap`: the modulator pitches there is room for above a note at
 * `hz`, up to where a sideband would fold back into the band. The voice runs
 * at four times the sample rate, twice from 60 kHz up.
 */
export function fmBassRoom(hz: number, step: number, sampleRate: number): number {
  const fold = fmBassInnerRate(sampleRate) - 0.5 * sampleRate
  return (FM_BASS_ROOM_USED * (fold - hz)) / (0.5 * hz * step)
}

/** `FmBass::init`, `inner_rate_`: the rate the voice itself runs at. */
export const fmBassInnerRate = (sampleRate: number): number =>
  sampleRate * (sampleRate < 60000 ? 4 : 2)

/** `FmBass::process`: the samples of the inner rate one cycle of the modulator takes under a key at `hz`. */
export const fmBassCycle = (hz: number, step: number, sampleRate: number): number =>
  fmBassInnerRate(sampleRate) / (0.5 * hz * step)

/**
 * `FmBass::process`, the modulator: one cycle of a sine bent by the mean of
 * its own last two outputs, stepped as the device steps it, `perCycle` samples
 * to the cycle, and read off at even steps of the cycle into `into`. That the
 * loop is a sample and a half late is not left out, even in the bass: the
 * bend alone, y = sin(turn + beta y), has an edge that grows steep without
 * end as Feedback nears the top, the lateness rounds it, and the high
 * partials are made of that edge. The first cycle forgets the silence a
 * strike starts from and the second is read.
 */
export function fmBassModulator(beta: number, perCycle: number, into: Float32Array): Float32Array {
  const points = into.length
  if (beta <= 0) {
    for (let k = 0; k < points; k++) into[k] = Math.sin((TAU * k) / points)
    return into
  }
  const step = TAU / clamp(perCycle, 2, 65536)
  let last = 0
  let before = 0
  let k = 0
  for (let j = 1; k < points; j++) {
    const turn = j * step
    const y = Math.sin(turn + 0.5 * beta * (last + before))
    // Every point of the second cycle that lies between the sample before and this one.
    for (; k < points; k++) {
      const at = TAU + (TAU * k) / points
      if (at > turn) break
      into[k] = last + (y - last) * clamp((at - turn) / step + 1, 0, 1)
    }
    before = last
    last = y
  }
  return into
}

/**
 * The points one cycle of the modulator is taken at (a power of two, for the
 * transform), and the sidebands either side of the carrier that are kept. A
 * modulator bent back on itself has a steep edge, and its sidebands fall
 * slowly: at full Feedback the hundredth is still 47 dB under the carrier,
 * where the comb's floor is. At Ratio 1/2 under a low key twice as many stand
 * inside the comb, so that many are kept.
 */
const FM_BASS_POINTS = 1024
const FM_BASS_SIDEBANDS = 240
/** The highest partial there can be, in halves of the key: the last sideband at Ratio 7. */
const FM_BASS_HALVES = 2 + FM_BASS_SIDEBANDS * FM_BASS_STEPS[FM_BASS_STEPS.length - 1]
const FM_BASS_COS = Float64Array.from({ length: FM_BASS_POINTS }, (_, k) =>
  Math.cos((TAU * k) / FM_BASS_POINTS),
)
const FM_BASS_SIN = Float64Array.from({ length: FM_BASS_POINTS }, (_, k) =>
  Math.sin((TAU * k) / FM_BASS_POINTS),
)

/** What the partials are worked out on: one cycle of the modulator, the carrier's turn under it, and the partials as they add up. */
export interface FmBassBench {
  /** What the wave was worked out for: it is not worked out again for the same. */
  beta: number
  cycle: number
  wave: Float32Array
  turnRe: Float64Array
  turnIm: Float64Array
  re: Float64Array
  im: Float64Array
}

export const fmBassBench = (): FmBassBench => ({
  beta: -1,
  cycle: -1,
  wave: new Float32Array(FM_BASS_POINTS),
  turnRe: new Float64Array(FM_BASS_POINTS),
  turnIm: new Float64Array(FM_BASS_POINTS),
  re: new Float64Array(FM_BASS_HALVES + 1),
  im: new Float64Array(FM_BASS_HALVES + 1),
})

/** The partials of one note: how strong each multiple of half the key is (1 is the sub's pitch, 2 the key), 1 being the bare carrier. */
export interface FmBassComb {
  /** What it was worked out for: it is not worked out again for the same. */
  step: number
  index: number
  beta: number
  cycle: number
  sub: number
  levels: Float32Array
  /** The highest of them that is there. */
  top: number
}

export const fmBassComb = (): FmBassComb => ({
  step: -1,
  index: -1,
  beta: -1,
  cycle: -1,
  sub: -1,
  levels: new Float32Array(FM_BASS_HALVES + 1),
  top: 0,
})

/** A sine is the same wave at every pitch: without Feedback the cycle's length is not asked about. */
const cycleOf = (beta: number, perCycle: number): number => (beta > 0 ? perCycle : 0)

/** One cycle of the modulator at `beta`, `perCycle` samples long, on the bench, unless it stands there already. */
function fmBassWave(bench: FmBassBench, beta: number, perCycle: number): Float32Array {
  const cycle = cycleOf(beta, perCycle)
  if (bench.beta !== beta || bench.cycle !== cycle) {
    fmBassModulator(beta, cycle, bench.wave)
    bench.beta = beta
    bench.cycle = cycle
  }
  return bench.wave
}

/**
 * A Fourier transform of `FM_BASS_POINTS` complex points in place, by halves:
 * point n becomes the sum of every point k turned back by n k of a cycle. A
 * sum taken sideband by sideband costs a hundred times as much, and the comb
 * of a sounding note is worked out again on every frame of its Bite.
 */
function fmBassTransform(re: Float64Array, im: Float64Array): void {
  const points = FM_BASS_POINTS
  for (let i = 1, j = 0; i < points; i++) {
    let bit = points >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i >= j) continue
    const keptRe = re[i]
    const keptIm = im[i]
    re[i] = re[j]
    im[i] = im[j]
    re[j] = keptRe
    im[j] = keptIm
  }
  for (let size = 2; size <= points; size <<= 1) {
    const stride = points / size
    for (let start = 0; start < points; start += size) {
      for (let k = 0; k < size / 2; k++) {
        const cos = FM_BASS_COS[k * stride]
        const sin = -FM_BASS_SIN[k * stride]
        const a = start + k
        const b = a + size / 2
        const turnedRe = re[b] * cos - im[b] * sin
        const turnedIm = re[b] * sin + im[b] * cos
        re[b] = re[a] - turnedRe
        im[b] = im[a] - turnedIm
        re[a] += turnedRe
        im[a] += turnedIm
      }
    }
  }
}

/**
 * `FmBass::process` taken apart: the carrier at the key, its phase moved
 * `index` radians by a modulator at `step` halves of the key, and the sub.
 * A sideband stands `step` halves from the next; the ones that fall under
 * nought are heard at the same pitch above it, turned over, and take from or
 * add to what stands there. The sub goes in upside down, as in the device, so
 * with Ratio 1/2 it adds to the partial the bend puts an octave under the key.
 * Under a sine the sidebands are Bessel functions of the index; a modulator
 * that bends itself is no sine, so they are read off its wave, which is
 * `perCycle` samples of the inner rate long (`fmBassCycle`).
 */
export function fmBassPartials(
  bench: FmBassBench,
  step: number,
  index: number,
  beta: number,
  sub: number,
  perCycle: number,
  into: FmBassComb,
): FmBassComb {
  const cycle = cycleOf(beta, perCycle)
  const same =
    into.step === step && into.index === index && into.beta === beta && into.cycle === cycle
  if (same && into.sub === sub) return into
  into.step = step
  into.index = index
  into.beta = beta
  into.cycle = cycle
  into.sub = sub
  const { turnRe, turnIm, re, im } = bench
  const wave = fmBassWave(bench, beta, cycle)
  re.fill(0)
  im.fill(0)
  for (let k = 0; k < FM_BASS_POINTS; k++) {
    const turn = index * wave[k]
    turnRe[k] = Math.cos(turn)
    turnIm[k] = Math.sin(turn)
  }
  fmBassTransform(turnRe, turnIm)
  // Under a sine no sideband past the device's fit is above -60 dB. The fit is not asked about a
  // modulator that bends itself: it says where the device caps the index, and the sidebands of
  // such a modulator in the bass reach several times as far above the comb's floor.
  const most =
    index < 1e-4
      ? 0
      : beta > 0
        ? FM_BASS_SIDEBANDS
        : Math.min(FM_BASS_SIDEBANDS, Math.ceil(fmBassReach(index, 0)) + 1)
  let top = 2
  for (let n = -most; n <= most; n++) {
    const at = n < 0 ? n + FM_BASS_POINTS : n
    const sideRe = turnRe[at] / FM_BASS_POINTS
    const sideIm = turnIm[at] / FM_BASS_POINTS
    const half = 2 + n * step
    if (half > 0) {
      re[half] += sideRe
      im[half] += sideIm
      top = Math.max(top, half)
    } else if (half < 0) {
      re[-half] -= sideRe
      im[-half] += sideIm
      top = Math.max(top, -half)
    }
    // At nought it is a level and not a tone: the device's DC blocker takes it off.
  }
  re[1] -= sub
  for (let half = 1; half <= top; half++) into.levels[half] = Math.hypot(re[half], im[half])
  into.levels.fill(0, top + 1, Math.max(top, into.top) + 1)
  into.top = top
  return into
}

/** A key going down or up: when (seconds, under zero for the past), and which of the notes. */
interface KeyEvent {
  at: number
  down: boolean
  index: number
}

/** Every key down and key up of `notes` in the order they came, into `into`, which is kept between frames; the count comes back. */
function keyEvents(notes: readonly DisplayNote[], into: KeyEvent[]): number {
  let count = 0
  const put = (at: number, down: boolean, index: number): void => {
    if (count === into.length) into.push({ at: 0, down: false, index: 0 })
    const event = into[count++]
    event.at = at
    event.down = down
    event.index = index
  }
  notes.forEach((note, index) => {
    // `FmBass::note_on`: a key without a pitch is not taken.
    if (Number.isNaN(note.frequency)) return
    put(-note.age, true, index)
    if (note.released === null) return
    // A key struck again while it is held is remembered as let go in that instant, but the device
    // was sent no key up: its `note_on` takes the old key off the stack itself.
    for (let later = index + 1; later < notes.length && notes[later].age >= note.released; later++)
      if (notes[later].id === note.id && notes[later].age === note.released) return
    put(-note.released, false, index)
  })
  // The ones left over from a fuller frame go to the end.
  for (let i = count; i < into.length; i++) into[i].at = Infinity
  // Which of a key up and a key down in one instant was sent first is not remembered, and the
  // device slides only if the key down was. The key up is taken first, as notes played end to end
  // are sent: one ends, the next begins, and it begins on pitch.
  into.sort((a, b) => a.at - b.at || Number(a.down) - Number(b.down) || a.index - b.index)
  return count
}

/** A move of the voice's pitch: from when (seconds after the strike), between which pitches (log2 of Hz), over how long. */
interface FmBassSlide {
  at: number
  from: number
  to: number
  seconds: number
}

/** The one voice as the keys leave it. */
export interface FmBassVoice {
  /** Seconds since the last key was struck, under zero when none was; and since the last held key went up, null while one is down. */
  since: number
  up: number | null
  /** `strike_from_` and `bend_from_`: where the loudness and the bend stood when that key was struck. */
  loudFrom: number
  bendFrom: number
  /** How hard the key that plays was struck. */
  gain: number
  /** Seconds after the strike at which the note is silence. */
  ends: number
  slides: FmBassSlide[]
  slideCount: number
  /** The stack: the keys held, oldest first, as places in the notes. */
  held: number[]
  events: KeyEvent[]
}

export const fmBassVoice = (): FmBassVoice => ({
  since: -1,
  up: null,
  loudFrom: 0,
  bendFrom: 1,
  gain: 1,
  ends: 0,
  slides: [],
  slideCount: 0,
  held: [],
  events: [],
})

/**
 * Where the voice's pitch is `after` seconds after the last strike, as log2
 * of Hz. `FmBass::advance_contours`: a slide nobody can hear any more has
 * arrived, so once the note is silence the pitch is where it was going.
 */
export function fmBassPitch(voice: FmBassVoice, after: number): number {
  let pitch = Math.log2(FM_BASS_START_HZ)
  for (let m = 0; m < voice.slideCount; m++) {
    const slide = voice.slides[m]
    if (slide.at > after) break
    const there = slide.seconds <= 0 || after >= voice.ends
    const share = there ? 1 : clamp((after - slide.at) / slide.seconds, 0, 1)
    pitch = slide.from + (slide.to - slide.from) * share
  }
  return pitch
}

/** The knobs that say how a note runs in time. */
export interface FmBassTimes {
  bite: number
  decay: number
  release: number
  glide: number
}

/**
 * The frames the engine hands the device at a time. Where a block ends is not
 * seen from here: keys nearer than half of one are more likely in one block
 * than in two, and are taken to land together.
 */
const BLOCK_FRAMES = 128

/**
 * `FmBass::note_on` and `note_off` played through again. Held keys sit on a
 * stack and the newest plays; every new key strikes loudness and bend again
 * from wherever they stand; letting the playing key go returns to the one
 * under it without a strike, and the last key up lets the note go. The pitch
 * slides only from a key that is held, in a straight line that arrives in the
 * Glide time. The top key of a chord that lands in silence does not slide:
 * nothing has sounded yet to slide from.
 */
export function fmBassPlay(
  notes: readonly DisplayNote[],
  times: FmBassTimes,
  sampleRate: number,
  into: FmBassVoice,
): FmBassVoice {
  const count = keyEvents(notes, into.events)
  const { held } = into
  held.length = 0
  into.slideCount = 0
  into.gain = 1
  into.ends = 0
  into.loudFrom = 0
  into.bendFrom = 1
  let struck: number | null = null
  let emptied: number | null = null
  const together = (0.5 * BLOCK_FRAMES) / sampleRate
  // `FmBass::play_top`: a Glide shorter than a sample is a jump, and a slide takes whole samples.
  const samples = Math.floor(times.glide * sampleRate)
  const glide = samples >= 1 ? samples / sampleRate : 0
  const keyOf = (index: number): number =>
    Math.log2(clamp(notes[index].frequency, FM_BASS_KEY_LOW_HZ, FM_BASS_KEY_HIGH_HZ))
  const gainOf = (index: number): number =>
    Number.isNaN(notes[index].gain) ? 0.5 : clamp(notes[index].gain, 0, 1)
  const slide = (at: number, from: number, to: number, seconds: number): void => {
    if (into.slideCount === into.slides.length)
      into.slides.push({ at: 0, from: 0, to: 0, seconds: 0 })
    const next = into.slides[into.slideCount++]
    next.at = at
    next.from = from
    next.to = to
    next.seconds = seconds
  }
  for (let e = 0; e < count; e++) {
    const { at, down, index } = into.events[e]
    const since = struck === null ? -1 : at - struck
    const up = emptied === null ? null : at - emptied
    if (down) {
      // The same key again takes its old place off the stack first.
      for (let i = held.length - 1; i >= 0; i--)
        if (notes[held[i]].id === notes[index].id) held.splice(i, 1)
      const overlapping = held.length > 0
      // A full stack forgets its oldest key.
      if (held.length === FM_BASS_KEYS_MOST) held.shift()
      // A strike that came in the same block has not sounded a sample yet: all stands where it found it.
      const pending = struck !== null && since < together
      const loud = pending
        ? into.loudFrom
        : fmBassLoudness(since, up, times.decay, times.release, into.loudFrom)
      const silent = loud === 0
      const sliding = overlapping && !(pending && silent) && glide > 0
      const from = sliding ? fmBassPitch(into, since) : keyOf(index)
      const bend = silent
        ? 1
        : pending
          ? into.bendFrom
          : fmBassBend(since, times.bite, into.bendFrom)
      held.push(index)
      into.slideCount = 0
      slide(0, from, keyOf(index), sliding ? glide : 0)
      into.gain = gainOf(index)
      into.loudFrom = loud
      into.bendFrom = bend
      struck = at
      emptied = null
      into.ends = fmBassEnds(null, times.decay, times.release)
    } else {
      const place = held.indexOf(index)
      if (place < 0 || struck === null) continue
      const playing = place === held.length - 1
      held.splice(place, 1)
      if (playing && held.length > 0) {
        // Back to the key still held under it, sliding if anything still sounds.
        const under = held[held.length - 1]
        const sounds = fmBassLoudness(since, up, times.decay, times.release, into.loudFrom) > 0
        slide(since, fmBassPitch(into, since), keyOf(under), sounds ? glide : 0)
        into.gain = gainOf(under)
      }
      if (held.length === 0) {
        emptied = at
        into.ends = fmBassEnds(since, times.decay, times.release)
      }
    }
  }
  into.since = struck === null ? -1 : -struck
  into.up = emptied === null ? null : -emptied
  return into
}

// --- The picture -------------------------------------------------------------

/** The pitches the comb stands between, on a scale of octaves: from the C under the lowest bass key, eight octaves up. */
const COMB_LOW_HZ = 16.3516
const COMB_OCTAVES = 8
/** The level a partial is drawn from, in dB under the bare carrier. */
const COMB_FLOOR_DB = -48
/** The times a note's life runs between, on a scale of ratios, the strike at the left; and the times a line stands at. */
const LIFE_FROM_SEC = 0.005
const LIFE_TO_SEC = 25
const LIFE_DECADES_SEC = [0.01, 0.1, 1, 10] as const
/** A note is drawn until it is this far down. */
const LIFE_DB = 60
/** Under this share of its height a partial is not there. */
const DONE = 0.02

interface FmBassParts {
  /** The partials: pitch across, level upward, standing on its lower edge. */
  comb: Box
  /** The note along time: its loudness and, inside it, how far it is bent. */
  life: Box
  words: Box
  foot: Box
}

function fmBassParts(view: Size): FmBassParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const foot: Box = { x: all.x, y: all.y + all.h - 6, w: all.w, h: 5 }
  const top = all.y + 12
  // Under the comb a row for the keys, then the note's life down to the foot.
  const keys = 6
  const room = foot.y - 4 - top - keys - 3
  const tall = Math.max(10, Math.round(room * 0.59))
  return {
    comb: { x: all.x + 1, y: top, w: all.w - 2, h: tall },
    life: { x: all.x + 1, y: top + tall + keys + 3, w: all.w - 2, h: Math.max(8, room - tall) },
    words: { x: all.x, y: all.y, w: all.w, h: 9 },
    foot,
  }
}

const combX = (hz: number, box: Box): number =>
  box.x + (Math.log2(Math.max(hz, 1) / COMB_LOW_HZ) / COMB_OCTAVES) * box.w
const lifeX = (seconds: number, box: Box): number =>
  box.x +
  clamp(
    Math.log(Math.max(seconds, LIFE_FROM_SEC) / LIFE_FROM_SEC) /
      Math.log(LIFE_TO_SEC / LIFE_FROM_SEC),
    0,
    1,
  ) *
    box.w
const lifeSeconds = (x: number, box: Box): number =>
  LIFE_FROM_SEC * Math.pow(LIFE_TO_SEC / LIFE_FROM_SEC, clamp((x - box.x) / box.w, 0, 1))
/** How high a loudness stands in the note's life: 60 dB from top to foot. */
const loudShare = (level: number): number => clamp(1 + gainToDb(level) / LIFE_DB, 0, 1)
/** How high an index stands there: by its root, as the Depth knob counts it, so a small bend is still seen. */
const indexShare = (index: number): number => Math.sqrt(clamp(index / FM_BASS_MAX_INDEX, 0, 1))

/** How near two partials can stand at a ratio, in halves of the key: the upper and the turned-over sidebands lie between each other. */
function combGap(step: number): number {
  if (step <= 2) return step
  return Math.min(Math.abs(step - 4), 4) || step
}

/**
 * A comb into the path: every partial of a note at `hz` that is there, as a
 * hairline or as a bar as wide as its neighbours leave it room. `scale` is
 * what the loudness and the touch leave of each. A bar that is to be drawn as
 * its outline is taken in by `inset`, so the line is sharp.
 */
function combPath(
  ctx: CanvasRenderingContext2D,
  box: Box,
  comb: FmBassComb,
  hz: number,
  scale: number,
  bars: boolean,
  inset = 0,
): void {
  const base = box.y + box.h
  const octave = box.w / COMB_OCTAVES
  const widest = clamp(octave * 0.34, 2, 8)
  const gap = combGap(comb.step)
  ctx.beginPath()
  for (let half = 1; half <= comb.top; half++) {
    const level = comb.levels[half] * scale
    if (level <= 0) continue
    const share = Math.min(1, 1 - gainToDb(level) / COMB_FLOOR_DB)
    if (share < DONE) continue
    const at = (half * hz) / 2
    if (at < COMB_LOW_HZ) continue
    const x = combX(at, box)
    if (x > box.x + box.w) break
    const y = base - share * box.h
    if (!bars) {
      ctx.moveTo(crisp(x), base)
      ctx.lineTo(crisp(x), y)
      continue
    }
    const wide = Math.round(clamp(0.62 * octave * Math.log2(1 + gap / half), 1, widest))
    const left = Math.round(x - wide / 2) + inset
    const right = Math.max(left, left + wide - 2 * inset)
    const head = Math.min(base, y + inset)
    ctx.moveTo(left, base)
    ctx.lineTo(left, head)
    ctx.lineTo(right, head)
    ctx.lineTo(right, base)
    ctx.closePath()
  }
}

/** A line along the note's life from the strike until `until`, as high as `share` says at each moment; closed down to the foot for a fill. */
function lifePath(
  ctx: CanvasRenderingContext2D,
  box: Box,
  until: number,
  share: (seconds: number) => number,
  closed: boolean,
): void {
  const base = box.y + box.h
  const edge = Math.min(box.x + box.w, lifeX(until, box))
  ctx.beginPath()
  for (let x = box.x; ; x = Math.min(edge, x + 2)) {
    const y = base - share(lifeSeconds(x, box)) * box.h
    if (x === box.x) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
    if (x >= edge) break
  }
  if (!closed) return
  ctx.lineTo(edge, base)
  ctx.lineTo(box.x, base)
  ctx.closePath()
}

function paintFill(frame: Paint, colour: string, alpha: number): void {
  const { ctx } = frame
  ctx.globalAlpha = alpha
  ctx.fillStyle = colour
  ctx.fill()
  ctx.globalAlpha = 1
}

function paintLine(
  frame: Paint,
  colour: string,
  alpha: number,
  width: number,
  dash?: readonly [number, number],
): void {
  const { ctx } = frame
  ctx.globalAlpha = alpha
  ctx.strokeStyle = colour
  ctx.lineWidth = width
  ctx.lineJoin = 'round'
  ctx.lineCap = dash ? 'butt' : 'round'
  ctx.setLineDash(dash ? [...dash] : [])
  ctx.stroke()
  ctx.setLineDash([])
  ctx.globalAlpha = 1
}

/** The knobs as the device takes them. */
interface FmBassSet extends FmBassTimes {
  ratio: number
  step: number
  depth: number
  body: number
  beta: number
  sub: number
}

function fmBassSet(view: DisplayView, into: FmBassSet): FmBassSet {
  into.ratio = clamp(Math.round(view.value('ratio')), 0, FM_BASS_STEPS.length - 1)
  into.step = FM_BASS_STEPS[into.ratio]
  into.depth = clamp(view.value('depth'), 0, 1)
  into.bite = Math.max(view.value('bite'), 0.001)
  into.body = clamp(view.value('body'), 0, 1)
  into.beta = fmBassFeedback(view.value('feedback'))
  into.sub = clamp(view.value('sub'), 0, 1)
  into.decay = Math.max(view.value('decay'), 0.001)
  into.release = Math.max(view.value('release'), 0.001)
  into.glide = clamp(view.value('glide'), 0, 1)
  return into
}

const fmBassSetting = (): FmBassSet => ({
  ratio: 1,
  step: 2,
  depth: 0,
  bite: 0.25,
  body: 0,
  beta: 0,
  sub: 0,
  decay: 1,
  release: 0.1,
  glide: 0,
})

interface FmBassState {
  set: FmBassSet
  voice: FmBassVoice
  bench: FmBassBench
  /** The partials at the strike, once the bend has fallen, and where the note that sounds is now. */
  struck: FmBassComb
  settled: FmBassComb
  now: FmBassComb
}

const fmBass = plateDisplay<FmBassState>({
  place: 'window',
  columns: 2,
  params: ['ratio', 'depth', 'bite', 'body', 'feedback', 'sub', 'decay', 'release', 'glide'],
  live: { signal: true, notes: true },
  info: 'The partials of the one voice, low at the left: hairlines at the strike, bars for what stays, and a played note closing from one to the other where its key is. Below, its brightness inside its loudness along time; the pin is how long a slide takes. Drag the handles for Depth, Bite, Body and Decay.',
  init: () => ({
    set: fmBassSetting(),
    voice: fmBassVoice(),
    bench: fmBassBench(),
    struck: fmBassComb(),
    settled: fmBassComb(),
    now: fmBassComb(),
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { comb, life, words, foot } = fmBassParts(frame)
    const set = fmBassSet(frame, state.set)
    const hold = set.decay >= FM_BASS_HOLD_FROM_SEC

    // The voice as the keys leave it, and whether it still sounds.
    const voice = fmBassPlay(frame.notes, set, frame.sampleRate, state.voice)
    const loud =
      voice.since < 0
        ? 0
        : fmBassLoudness(voice.since, voice.up, set.decay, set.release, voice.loudFrom)
    const sounding = frame.powered && loud > 0
    // At rest the comb is the hardest key at the pitch the voice rests at.
    const hz = sounding ? Math.pow(2, fmBassPitch(voice, voice.since)) : FM_BASS_START_HZ
    const gain = sounding ? voice.gain : 1
    const touch = fmBassTouch(gain)
    const top = fmBassIndex(set.depth, gain)
    const cap = fmBassIndexCap(fmBassRoom(hz, set.step, frame.sampleRate), set.beta)
    const bend = sounding ? fmBassBend(voice.since, set.bite, voice.bendFrom) : 0
    const cycle = fmBassCycle(hz, set.step, frame.sampleRate)
    const { bench } = state

    // --- The comb ---
    const combFoot = comb.y + comb.h
    rule(ctx, comb.x - 1, combFoot, comb.x + comb.w + 1, combFoot, {
      colour: colours.ink,
      alpha: INK.rule,
    })
    // A tick at every C, so an octave can be counted.
    ctx.beginPath()
    for (let octave = 1; octave < COMB_OCTAVES; octave++) {
      const x = crisp(comb.x + (octave / COMB_OCTAVES) * comb.w)
      ctx.moveTo(x, combFoot)
      ctx.lineTo(x, combFoot + 2.5)
    }
    paintLine(frame, colours.ink, INK.rule, 1)

    // The strike as hairlines, what stays of it as bars: the note closes from the one to the other.
    const struck = fmBassPartials(
      bench,
      set.step,
      Math.min(top, cap),
      set.beta,
      set.sub,
      cycle,
      state.struck,
    )
    combPath(ctx, comb, struck, hz, touch, false)
    paintLine(frame, colours.ink, sounding ? INK.back : 0.62, 1)
    const settled = fmBassPartials(
      bench,
      set.step,
      fmBassIndexAt(top, set.body, 0, cap),
      set.beta,
      set.sub,
      cycle,
      state.settled,
    )
    // While a note sounds they are its own, at its key and its touch, and the bars are outlines:
    // what the note fills at first and sinks out of as it dies.
    if (sounding) {
      combPath(ctx, comb, settled, hz, touch, true, 0.5)
      paintLine(frame, colours.ink, INK.back, 1)
    } else {
      combPath(ctx, comb, settled, hz, touch, true)
      paintFill(frame, colours.ink, 0.86)
    }
    if (sounding) {
      const now = fmBassPartials(
        bench,
        set.step,
        fmBassIndexAt(top, set.body, bend, cap),
        set.beta,
        set.sub,
        cycle,
        state.now,
      )
      combPath(ctx, comb, now, hz, touch * loud, true)
      paintFill(frame, colours.accent, 1)
    }

    // The keys under the comb: a mark where the voice is, a tick at every other key that is held.
    // Those are silent: they are what the voice goes back to when the key it plays goes up.
    const { held } = voice
    for (let k = 0; k < held.length; k++) {
      if (sounding && k === held.length - 1) continue
      const key = clamp(frame.notes[held[k]].frequency, FM_BASS_KEY_LOW_HZ, FM_BASS_KEY_HIGH_HZ)
      const x = combX(key, comb)
      if (x < comb.x || x > comb.x + comb.w) continue
      rule(ctx, x, combFoot + 1, x, combFoot + 5, { colour: colours.ink, alpha: INK.text })
    }
    const keyX = clamp(combX(hz, comb), comb.x, comb.x + comb.w)
    ctx.beginPath()
    ctx.moveTo(keyX, combFoot + 1)
    ctx.lineTo(keyX - 3, combFoot + 5.5)
    ctx.lineTo(keyX + 3, combFoot + 5.5)
    ctx.closePath()
    paintFill(frame, sounding ? colours.accent : colours.ink, sounding ? 1 : INK.text)

    // --- The note along time ---
    const lifeFoot = life.y + life.h
    for (const seconds of LIFE_DECADES_SEC) {
      const x = lifeX(seconds, life)
      rule(ctx, x, life.y, x, lifeFoot, { colour: colours.ink, alpha: INK.grid })
    }
    rule(ctx, life.x - 1, lifeFoot, life.x + life.w + 1, lifeFoot, {
      colour: colours.ink,
      alpha: INK.rule,
    })
    // Its loudness under a held key, down to where it is 60 dB under the strike; and dashed
    // under a key let go at once, where that is sooner: Release only shortens.
    const heldLoud = (seconds: number): number =>
      loudShare(fmBassLoudness(seconds, null, set.decay, set.release, 1))
    const lasts = hold ? LIFE_TO_SEC : FM_BASS_STRIKE_SEC + set.decay
    lifePath(ctx, life, lasts, heldLoud, true)
    paintFill(frame, colours.ink, INK.fill)
    lifePath(ctx, life, lasts, heldLoud, false)
    paintLine(frame, colours.ink, INK.back, 1)
    if (hold || set.release < set.decay) {
      lifePath(
        ctx,
        life,
        FM_BASS_STRIKE_SEC + set.release,
        (seconds) => loudShare(fmBassLoudness(seconds, seconds, set.decay, set.release, 1)),
        false,
      )
      paintLine(frame, colours.ink, INK.text, 1, [2, 2])
    }
    // Its brightness inside that: the hardest key's index, from Depth down to Body over Bite.
    const full = fmBassIndex(set.depth, 1)
    const restIndex = (seconds: number): number =>
      Math.min(
        indexShare(fmBassIndexAt(full, set.body, fmBassBend(seconds, set.bite))),
        heldLoud(seconds),
      )
    lifePath(ctx, life, lasts, restIndex, true)
    paintFill(frame, colours.ink, 0.3)
    lifePath(ctx, life, lasts, restIndex, false)
    paintLine(frame, colours.ink, sounding ? INK.back : INK.trace, 1.5)

    // The pin: how long the pitch takes to slide to a key pressed over another.
    if (set.glide * frame.sampleRate >= 1) {
      const x = crisp(lifeX(set.glide, life))
      rule(ctx, x, lifeFoot - 5, x, lifeFoot, { colour: colours.ink, alpha: INK.text })
      dot(ctx, x, lifeFoot - 6, 1.5, colours.ink)
    }

    if (sounding) {
      // The note that sounds, from its strike to now: as loud as its keys left it, as bright as its touch bent it.
      const up = voice.up === null ? Infinity : voice.since - voice.up
      const loudAt = (seconds: number): number =>
        fmBassLoudness(
          seconds,
          seconds > up ? seconds - up : null,
          set.decay,
          set.release,
          voice.loudFrom,
        )
      const indexAt = (seconds: number): number =>
        indexShare(fmBassIndexAt(top, set.body, fmBassBend(seconds, set.bite, voice.bendFrom), cap))
      lifePath(ctx, life, voice.since, (seconds) => loudShare(loudAt(seconds) * touch), false)
      paintLine(frame, colours.accent, 1, 1.25)
      lifePath(ctx, life, voice.since, indexAt, false)
      paintLine(frame, colours.accent, 1, 2)
      const x = lifeX(voice.since, life)
      rule(ctx, x, lifeFoot - loudShare(loud * touch) * life.h, x, lifeFoot, {
        colour: colours.accent,
      })
      dot(ctx, x, lifeFoot - indexAt(voice.since) * life.h, 2.25, colours.accent)
    }

    levelFoot(frame, foot, outShare(frame))

    // The scale of seconds is said over the note, where its loudness lies flat.
    const points = fmBassHandles(frame)
    if (life.w >= 150) lifeLabel(frame, life, points, '0.1 s', lifeX(0.1, life) + 3)
    lifeLabel(frame, life, points, '1 s', lifeX(1, life) + 3)
    if (life.w >= 150) label(frame, '10 s', life.x + life.w, life.y + 8, 'right')

    // The words: the ratio, and the key with how long it takes to die away.
    const base = words.y + 8
    const ratio = `Ratio ${FM_BASS_RATIOS[set.ratio]}`
    const stands = `${pitchName(hz)} ${hold ? 'Hold' : secondsText(set.decay)}`
    text(frame, ratio, words.x, base)
    text(frame, stands, words.x + words.w, base, { align: 'right' })

    // Between them the bending sine against one cycle of the key: as many cycles of it as Ratio says,
    // leaning as Feedback bends it back on itself.
    ctx.font = `8px ${frame.fontFamily}`
    const from = words.x + ctx.measureText(ratio).width + 7
    const to = words.x + words.w - ctx.measureText(stands).width - 7
    const wide = Math.min(56, to - from)
    if (wide >= 24) {
      const wave = fmBassWave(bench, set.beta, cycle)
      const left = Math.round((from + to - wide) / 2)
      const middle = words.y + words.h / 2 + 0.5
      ctx.beginPath()
      for (let x = 0; x <= wide * 2; x++) {
        const cycles = ((x / (wide * 2)) * set.step) / 2
        const at = Math.round((cycles - Math.floor(cycles)) * FM_BASS_POINTS) % FM_BASS_POINTS
        const y = middle - wave[at] * (words.h / 2 - 0.5)
        if (x === 0) ctx.moveTo(left, y)
        else ctx.lineTo(left + x / 2, y)
      }
      paintLine(frame, colours.ink, INK.text, 1)
    }

    for (const point of points) handle(frame, point.x, point.y, { hot: frame.hot === point.key })
  },
  handles: fmBassHandles,
})

/** How near the middle of a handle may come to a word: its ring under the pointer, and a pixel of air. */
const HANDLE_ROOM = 6

/**
 * A word of the scale along the top of the note's life, its left end at `x`,
 * unless a handle stands there: with Depth and Body high the Bite handle is
 * up among the words, and a word under a handle can be neither read nor
 * dragged past. The scale's line stays.
 */
function lifeLabel(
  frame: Pick<DisplayFrame, 'ctx' | 'colours' | 'fontFamily'>,
  life: Box,
  points: readonly DisplayHandle[],
  words: string,
  x: number,
): void {
  frame.ctx.font = `8px ${frame.fontFamily}`
  const right = x + frame.ctx.measureText(words).width + 2
  for (const point of points) {
    const beside = point.x < x - 2 - HANDLE_ROOM || point.x > right + HANDLE_ROOM
    if (!beside && point.y < life.y + 10 + HANDLE_ROOM) return
  }
  label(frame, words, x, life.y + 8)
}

/** How far in from the left edge of the note's life the Depth handle stands, so the frame does not cut it. */
const FM_BASS_DEPTH_IN = 4

function fmBassHandles(view: DisplayView): DisplayHandle[] {
  const { life } = fmBassParts(view)
  const set = fmBassSet(view, fmBassSetting())
  const foot = life.y + life.h
  // How far the bend has fallen where the Depth handle stands: Depth is read off the line there.
  const early = lifeSeconds(life.x + FM_BASS_DEPTH_IN, life)
  const fallen = set.body + (1 - set.body) * fmBassBend(early, set.bite)
  const settles = set.depth * life.h
  const dragBite = (toX: number, toY: number): Record<string, number> => {
    const bite = lifeSeconds(toX, life)
    // With no Depth there is no height for Body to be read off.
    if (settles < 1) return { bite }
    const share = clamp((foot - toY) / settles, 0, 1)
    return { bite, body: share * share }
  }
  return [
    {
      key: 'depth',
      name: 'Depth',
      x: life.x + FM_BASS_DEPTH_IN,
      y: foot - set.depth * Math.sqrt(fallen) * life.h,
      drag: (_x, toY) => ({
        depth: clamp((foot - toY) / (Math.sqrt(fallen) * life.h), 0, 1),
      }),
      reset: () => ({ depth: view.spec('depth')?.default ?? 0.65 }),
    },
    {
      key: 'bite',
      name: 'Bite and Body',
      x: lifeX(set.bite, life),
      y: foot - set.depth * Math.sqrt(set.body) * life.h,
      drag: dragBite,
      reset: () => ({
        bite: view.spec('bite')?.default ?? 0.25,
        body: view.spec('body')?.default ?? 0.25,
      }),
    },
    {
      key: 'decay',
      name: 'Decay',
      x: lifeX(set.decay, life),
      y: foot,
      drag: (toX) => ({ decay: lifeSeconds(toX, life) }),
      reset: () => ({ decay: view.spec('decay')?.default ?? 1.4 }),
    },
  ]
}

export const FM_BASS_INSTRUMENT_FACES: Readonly<Record<string, PlateFace>> = {
  'fm-bass': { display: fmBass, face: ['ratio', 'depth', 'bite', 'body'] },
}
