// Displays of the instruments that play recorded sound: samples, grains and tape.
//
// A display is handed the knobs, the notes and the sound that comes out, and
// nothing of the recording itself. So none of these draws a waveform. Each
// draws what the knobs say of the recording (the stretch of it that plays, the
// grains taken from it, the tape it is on) and lights where the notes that
// sound are reading it, worked out from each note's age the way the device
// moves its read head. What the recording sounds like is left to the level at
// the foot.

import {
  INK,
  clamp,
  dot,
  fillRect,
  gainToDb,
  ground,
  handle,
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
import { levelFoot, outShare } from './instrument-parts'
import { secondsText } from './tails'

type Size = Pick<DisplayView, 'width' | 'height'>
type Paint = Pick<DisplayFrame, 'ctx' | 'colours'>

// --- What the four share -----------------------------------------------------

/** `kit::Adsr` (env.h): the attack heads for 1.3 and is cut off at 1; a release falls 60 dB in its time. */
const ADSR_ATTACK_TARGET = 1.3
const ADSR_SIXTY_DB = 6.907755279
/** Under this a note is out: 60 dB down, which is what a Release time is the time to. */
const NOTE_OUT = 0.001
/** `kit::Adsr`, `kIdleLevel`: a voice is still counted as sounding until it is 100 dB down, 5/3 of a Release time. */
const ADSR_IDLE = 1e-5
/** Both stores call a sound of fewer frames than this empty (`adopt_store`), and then no key plays. */
const STORE_LEAST_FRAMES = 16
const NO_NOTES: readonly DisplayNote[] = []

/**
 * How long the sound a sample device plays is, in seconds: `builtIn` while it
 * was handed none (`handed` null), else what its store kept of the one it was
 * handed, and 0 for one too short to play.
 *
 * `kit::SampleStore::commit` keeps `storeFrames` frames and drops the rest.
 * How many seconds that is depends on the rate the sound was handed at, which
 * a frame does not say. A sound decoded for the device comes at the rate the
 * device runs at, so that rate is taken.
 */
export function soundSeconds(
  handed: number | null,
  builtIn: number,
  storeFrames: number,
  sampleRate: number,
): number {
  if (handed === null) return builtIn
  if (!(handed * sampleRate >= STORE_LEAST_FRAMES)) return 0
  return Math.min(handed, storeFrames / sampleRate)
}

/** `kit::Adsr::next` in its attack: the level `seconds` after the key went down. */
export function adsrAttackLevel(seconds: number, attack: number): number {
  if (seconds >= attack) return 1
  if (seconds <= 0) return 0
  const rest = Math.pow((ADSR_ATTACK_TARGET - 1) / ADSR_ATTACK_TARGET, seconds / attack)
  return Math.min(1, ADSR_ATTACK_TARGET * (1 - rest))
}

/**
 * `kit::Adsr` as these instruments set it (a sustain of 1, so there is no
 * decay): the level of a note played `age` seconds ago and let go `released`
 * seconds ago (null while it is held). A key let go in its attack falls from
 * where the attack had got to.
 */
export function adsrLevel(
  age: number,
  released: number | null,
  attack: number,
  release: number,
): number {
  if (released === null) return adsrAttackLevel(age, attack)
  const after = clamp(released, 0, age)
  return adsrAttackLevel(age - after, attack) * Math.exp((-ADSR_SIXTY_DB * after) / release)
}

/**
 * How high a level is drawn, 0..1: its square root, so half the height is
 * 12 dB down. An attack then still reads as a rise, and a release is seen for
 * the whole of its time.
 */
export const lightOf = (level: number): number => Math.sqrt(clamp(level, 0, 1))

/** A small arrow head at (x, y) pointing along (dx, dy), which is one unit long. */
function arrowHead(frame: Paint, x: number, y: number, dx: number, dy: number, size = 3.5): void {
  const { ctx } = frame
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x - dx * size - dy * size * 0.6, y - dy * size + dx * size * 0.6)
  ctx.lineTo(x - dx * size + dy * size * 0.6, y - dy * size - dx * size * 0.6)
  ctx.closePath()
  ctx.fill()
}

/**
 * `kit::Svf` as a low-pass at a Q of `kSqrtHalf`, which is the Tone of the
 * sampler, the zone sampler and the grain synth: what it leaves of a
 * frequency, as a gain.
 */
export function toneGain(hz: number, toneHz: number): number {
  const ratio = hz / toneHz
  return 1 / Math.sqrt(1 + ratio * ratio * ratio * ratio)
}

/** What a Tone mark spans: these frequencies from left to right, and a cut down to this many dB at its foot. */
export const TONE_MARK_LOW_HZ = 50
export const TONE_MARK_HIGH_HZ = 20000
export const TONE_MARK_FLOOR_DB = -24
const TONE_MARK_STEPS = 14
/** A Tone mark's size, and the narrowest display that has room for it between two words. */
const TONE_MARK_WIDE = 28
const TONE_MARK_HIGH = 8
const TONE_MARK_ROOM = 170

/**
 * Tone, small: what the low-pass leaves of every frequency, low at the left.
 * The filter lies over everything the device plays and a display is not told
 * what pitches are in a recording, so it is drawn by itself and not on the
 * notes.
 */
function toneMark(frame: Paint, box: Box, toneHz: number): void {
  const { ctx, colours } = frame
  const base = box.y + box.h
  ctx.beginPath()
  ctx.moveTo(box.x, base)
  for (let step = 0; step <= TONE_MARK_STEPS; step++) {
    const u = step / TONE_MARK_STEPS
    const hz = TONE_MARK_LOW_HZ * Math.pow(TONE_MARK_HIGH_HZ / TONE_MARK_LOW_HZ, u)
    const down = clamp(gainToDb(toneGain(hz, toneHz)) / TONE_MARK_FLOOR_DB, 0, 1)
    ctx.lineTo(box.x + u * box.w, box.y + down * box.h)
  }
  ctx.lineTo(box.x + box.w, base)
  ctx.closePath()
  ctx.globalAlpha = INK.fill
  ctx.fillStyle = colours.ink
  ctx.fill()
  ctx.globalAlpha = INK.text
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.globalAlpha = 1
}

// --- Sampler -----------------------------------------------------------------

/** `sampler.h`, `kDefaultFrames` over `kDefaultRate`: the sound it is built with lasts this long. */
export const SAMPLER_SOUND_SEC = 143892 / 48000
/** `sampler.h`, `kStoreFrames`: the frames of a loaded sound it keeps. */
export const SAMPLER_STORE_FRAMES = 1500000
/** `sampler.h`: middle C plays the sound at its own pitch; 16 keys at once. */
const SAMPLER_MIDDLE_C = 261.6256
const SAMPLER_VOICES = 16
/** `sampler.h`, `process`: the wow's rate and share of the motor, the flutter's, and the motor's depth of 30 cents. */
const SAMPLER_WOW_HZ = 0.8
const SAMPLER_WOW_SHARE = 0.7
const SAMPLER_FLUTTER_HZ = 6.3
const SAMPLER_FLUTTER_SHARE = 0.08
const SAMPLER_WOBBLE_CENTS = 30

const SAMPLER_LOOPS = ['Once', 'Loop', 'Ping-pong'] as const

/** The region a key plays, in shares of the sound. */
export interface SamplerRegion {
  start: number
  end: number
  /** 0 plays it once, 1 jumps back, 2 turns round. */
  mode: number
  reverse: boolean
  /** The crossfade's length; 0 where there is none. */
  fade: number
  /** Where a pass that reaches End jumps to, and where one that reaches Start (in reverse) jumps to. */
  loopStart: number
  loopEnd: number
}

/**
 * `Sampler::update_region`: Start and End in either order, the crossfade no
 * longer than half the region and only on a Forward loop, and the loop's start
 * moved in where the sound has no lead-in for the crossfade. Crossfade is
 * time in the sound itself, so the share of it that it takes depends on how
 * long the sound is: `soundSec`.
 */
export function samplerRegion(
  start: number,
  end: number,
  loop: number,
  crossfadeMs: number,
  reverse: boolean,
  soundSec = SAMPLER_SOUND_SEC,
): SamplerRegion {
  const a = clamp(Math.min(start, end), 0, 1)
  const b = clamp(Math.max(start, end), 0, 1)
  const mode = clamp(Math.round(loop), 0, 2)
  let fade = mode === 1 ? crossfadeMs / 1000 / soundSec : 0
  if (fade > (b - a) / 2) fade = (b - a) / 2
  return {
    start: a,
    end: b,
    mode,
    reverse,
    fade,
    loopStart: Math.max(a, fade),
    loopEnd: Math.min(b, 1 - fade),
  }
}

/** Shares of the sound a key at `hz` reads in a second: `voice.ratio` times Tune and Fine, over the sound's length. */
export function samplerSpeed(hz: number, tune: number, fine: number, soundSec = SAMPLER_SOUND_SEC) {
  return ((hz / SAMPLER_MIDDLE_C) * Math.pow(2, (tune + fine / 100) / 12)) / soundSec
}

/**
 * `Sampler::play`: where a head is that has read `travelled` of the sound
 * since its key went down, and which way it is going. `done` when a region
 * played once has been played.
 */
export function samplerHead(
  region: SamplerRegion,
  travelled: number,
): { at: number; forwards: boolean; done: boolean } {
  const { start, end, mode, reverse } = region
  const length = end - start
  const from = reverse ? end : start
  const way = reverse ? -1 : 1
  if (length <= 0) return { at: from, forwards: !reverse, done: mode === 0 }
  if (travelled < length || mode === 0) {
    return {
      at: from + way * Math.min(travelled, length),
      forwards: !reverse,
      done: travelled >= length,
    }
  }
  if (mode === 1) {
    // Every pass after the first runs from where the jump lands.
    const lap = reverse ? region.loopEnd - start : end - region.loopStart
    const into = lap > 0 ? (travelled - length) % lap : 0
    return {
      at: reverse ? region.loopEnd - into : region.loopStart + into,
      forwards: !reverse,
      done: false,
    }
  }
  const phase = travelled % (2 * length)
  const out = phase < length
  return {
    at: from + way * (out ? phase : 2 * length - phase),
    forwards: out !== reverse,
    done: false,
  }
}

/** `Sampler::note_on`: how loud a key played as hard as `gain` is, for the Velocity knob. */
export const samplerVelocity = (gain: number, amount: number): number => 1 - amount + amount * gain

interface SamplerParts {
  /** The whole sound, from its first frame at the left to its last at the right. */
  band: Box
  /** Tone, small, in the row of the words: between them where there is room, else in place of the figure. */
  tone: Box
  /** Whether the figure has room beside it. */
  figure: boolean
  foot: Box
}

function samplerParts(view: Size): SamplerParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const band: Box = { x: all.x + 3, y: all.y + 24, w: all.w - 6, h: all.h - 24 - 17 }
  const figure = view.width >= TONE_MARK_ROOM
  return {
    band,
    tone: {
      x: figure ? all.x + (all.w - TONE_MARK_WIDE) / 2 : band.x + band.w + 2 - TONE_MARK_WIDE,
      y: band.y - 15 - TONE_MARK_HIGH,
      w: TONE_MARK_WIDE,
      h: TONE_MARK_HIGH,
    },
    figure,
    foot: { x: all.x, y: all.y + all.h - 6, w: all.w, h: 5 },
  }
}

const sampler = plateDisplay({
  place: 'window',
  columns: 2,
  params: [
    'start',
    'end',
    'loop',
    'crossfade',
    'reverse',
    'tune',
    'fine',
    'attack',
    'release',
    'tone',
    'wobble',
    'velocity',
  ],
  live: { signal: true, notes: true },
  info: 'The sound from its first moment at the left to its last, and the stretch of it the keys play, with the way a head runs through it and where a loop jumps back. Each note that sounds is a lit head as tall as it is loud. The small curve at the top is Tone. Drag the two edges to set Start and End.',
  draw(frame) {
    const { ctx, colours } = frame
    ground(frame)
    const { band, tone, figure, foot } = samplerParts(frame)
    // The knobs give places as shares of the sound, and a head moves through
    // it in seconds: how far a share is in time hangs on the sound's length.
    const sound = soundSeconds(
      frame.sampleSeconds,
      SAMPLER_SOUND_SEC,
      SAMPLER_STORE_FRAMES,
      frame.sampleRate,
    )
    // `Sampler::note_on`: with nothing in the store no key plays. The picture is then drawn as for the built-in sound, unlit.
    const empty = sound <= 0
    const seconds = empty ? SAMPLER_SOUND_SEC : sound
    const region = samplerRegion(
      frame.value('start'),
      frame.value('end'),
      frame.value('loop'),
      frame.value('crossfade'),
      frame.value('reverse') >= 0.5,
      seconds,
    )
    const tune = frame.value('tune')
    const fine = frame.value('fine')
    const attack = frame.value('attack')
    const release = frame.value('release')
    const wobble = clamp(frame.value('wobble'), 0, 1)
    const amount = frame.value('velocity')
    const xOf = (share: number): number => band.x + clamp(share, 0, 1) * band.w
    const top = band.y
    const base = band.y + band.h
    const left = xOf(region.start)
    const right = xOf(region.end)
    const { reverse, mode } = region

    // The whole sound: a tape with a mark at every tenth of it.
    ctx.globalAlpha = INK.rule
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.strokeRect(band.x + 0.5, top + 0.5, band.w - 1, band.h - 1)
    ctx.globalAlpha = 1
    for (let tenth = 0; tenth <= 10; tenth++) {
      const x = xOf(tenth / 10)
      rule(ctx, x, base + 1, x, base + (tenth % 5 === 0 ? 5 : 3), {
        colour: colours.ink,
        alpha: INK.back,
      })
    }

    // The stretch the keys play, and in it what middle C lets through on its
    // first pass: the attack takes this much of the recording's own start.
    fillRect(ctx, { x: left, y: top, w: right - left, h: band.h }, colours.ink, INK.ground)
    const speed = samplerSpeed(SAMPLER_MIDDLE_C, tune, fine, seconds)
    ctx.beginPath()
    ctx.moveTo(reverse ? right : left, base)
    const wide = Math.max(1, right - left)
    for (let px = 0; px <= wide; px += 2) {
      const into = Math.min(px, wide)
      const level = adsrAttackLevel(into / band.w / speed, attack)
      ctx.lineTo(reverse ? right - into : left + into, base - lightOf(level) * band.h)
      if (level >= 1) break
    }
    ctx.lineTo(reverse ? left : right, top)
    ctx.lineTo(reverse ? left : right, base)
    ctx.closePath()
    ctx.globalAlpha = INK.fill
    ctx.fillStyle = colours.ink
    ctx.fill()
    ctx.globalAlpha = 1
    const edge = { colour: colours.ink, alpha: INK.trace, width: 1.5 }
    rule(ctx, left, top - 2, left, base + 2, edge)
    rule(ctx, right, top - 2, right, base + 2, edge)

    // The crossfade of a Forward loop: the end of each pass falls away while
    // the stretch that leads into the jump's landing comes up under it.
    if (region.fade > 0) {
      const lands = reverse ? region.loopEnd : region.loopStart
      const lead = reverse ? lands + region.fade : lands - region.fade
      const leaves = reverse ? region.start : region.end
      const fades = reverse ? leaves + region.fade : leaves - region.fade
      ctx.beginPath()
      ctx.moveTo(xOf(lead), base)
      ctx.lineTo(xOf(lands), top)
      ctx.lineTo(xOf(lands), base)
      ctx.closePath()
      ctx.globalAlpha = INK.fill
      ctx.fillStyle = colours.ink
      ctx.fill()
      ctx.globalAlpha = 1
      rule(ctx, xOf(lead), base, xOf(lands), top, { colour: colours.ink, alpha: INK.back })
      rule(ctx, xOf(fades), top, xOf(leaves), base, { colour: colours.ink, alpha: INK.back })
    }

    // The way a head runs: an arrow through the region, as unsteady as the
    // motor makes the pitch (the wow and the flutter at the pace a head at
    // middle C meets them; where in its turn the motor is, nobody says).
    const middle = top + band.h * 0.56
    const sway = (wobble * SAMPLER_WOBBLE_CENTS * band.h) / 240
    const inset = Math.min(9, wide / 4)
    const from = left + inset
    const to = right - inset
    if (to - from > 4) {
      const yOf = (x: number): number => {
        const seconds = Math.abs(x - (reverse ? to : from)) / band.w / speed
        return (
          middle -
          sway *
            (SAMPLER_WOW_SHARE * Math.sin(2 * Math.PI * SAMPLER_WOW_HZ * seconds) +
              SAMPLER_FLUTTER_SHARE * Math.sin(2 * Math.PI * SAMPLER_FLUTTER_HZ * seconds))
        )
      }
      ctx.beginPath()
      for (let x = from; x < to; x += 1.5) {
        if (x === from) ctx.moveTo(x, yOf(x))
        else ctx.lineTo(x, yOf(x))
      }
      ctx.lineTo(to, yOf(to))
      ctx.globalAlpha = INK.trace
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1.25
      ctx.lineJoin = 'round'
      ctx.stroke()
      ctx.fillStyle = colours.ink
      if (!reverse || mode === 2) arrowHead(frame, to + 2, yOf(to), 1, 0)
      if (reverse || mode === 2) arrowHead(frame, from - 2, yOf(from), -1, 0)
      ctx.globalAlpha = 1
    }

    // A Forward loop jumps: from the edge a pass ends on, over the region, to where the next begins.
    if (mode === 1) {
      const leaves = reverse ? left : right
      const lands = xOf(reverse ? region.loopEnd : region.loopStart)
      const rise = clamp(Math.abs(leaves - lands) * 0.2, 4, 9)
      ctx.beginPath()
      ctx.moveTo(leaves, top - 3)
      ctx.bezierCurveTo(leaves, top - 3 - rise, lands, top - 3 - rise, lands, top - 4)
      ctx.setLineDash([2, 2])
      ctx.globalAlpha = INK.text
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = colours.ink
      ctx.globalAlpha = 1
      arrowHead(frame, lands, top - 0.5, 0, 1, 4.5)
    }

    // The heads of the notes that sound: where each has read to, as tall as it is loud.
    const notes = frame.notes
    let lit = 0
    for (let index = notes.length - 1; index >= 0 && lit < SAMPLER_VOICES && !empty; index--) {
      const note = notes[index]
      const level = adsrLevel(note.age, note.released, attack, release)
      if (level < NOTE_OUT) continue
      const head = samplerHead(region, note.age * samplerSpeed(note.frequency, tune, fine, seconds))
      if (head.done) continue
      lit++
      const x = xOf(head.at)
      const y = base - Math.max(2, lightOf(level * samplerVelocity(note.gain, amount)) * band.h)
      ctx.beginPath()
      ctx.moveTo(x, base)
      ctx.lineTo(x, y)
      ctx.strokeStyle = colours.accent
      ctx.lineWidth = 1.75
      ctx.lineCap = 'butt'
      ctx.stroke()
      ctx.fillStyle = colours.accent
      arrowHead(frame, x + (head.forwards ? 4 : -4), y, head.forwards ? 1 : -1, 0, 4)
    }

    levelFoot(frame, foot, outShare(frame))

    // The words: how it plays, Tone, and where there is room the stretch that plays.
    const words = band.y - 15
    text(frame, `${SAMPLER_LOOPS[mode]}${reverse ? ' reversed' : ''}`, band.x - 2, words)
    toneMark(frame, tone, frame.value('tone'))
    if (figure) {
      text(
        frame,
        `${Math.round(region.start * 100)} to ${Math.round(region.end * 100)} %`,
        band.x + band.w + 2,
        words,
        { align: 'right' },
      )
    }

    for (const point of samplerHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: samplerHandles,
})

function samplerHandles(view: DisplayView): DisplayHandle[] {
  const { band } = samplerParts(view)
  const shareOf = (x: number): number => clamp((x - band.x) / band.w, 0, 1)
  // Start stands high on its edge and End low on its own, so the two can be told apart where they meet.
  return [
    {
      key: 'start',
      name: 'Start',
      x: band.x + clamp(view.value('start'), 0, 1) * band.w,
      y: band.y + band.h * 0.3,
      drag: (toX) => ({ start: shareOf(toX) }),
      reset: () => ({ start: view.spec('start')?.default ?? 0.15 }),
    },
    {
      key: 'end',
      name: 'End',
      x: band.x + clamp(view.value('end'), 0, 1) * band.w,
      y: band.y + band.h * 0.78,
      drag: (toX) => ({ end: shareOf(toX) }),
      reset: () => ({ end: view.spec('end')?.default ?? 0.85 }),
    },
  ]
}

// --- Zone Sampler ------------------------------------------------------------

/** The keys the map is drawn over: a piano's 88, A0 to C8. The device takes any key; one beyond these is drawn at the end. */
const ZONE_LOW_KEY = 21
const ZONE_HIGH_KEY = 108
/** `zone_sampler.h`: 48 recordings sound at once. */
const ZONE_VOICES = 48
/** The map's rows are how hard a key is played, in eight steps up to as hard as can be; its columns every third key. */
const ZONE_ROWS = 8
const ZONE_COLUMN_KEYS = 3
const BLACK_KEYS: readonly boolean[] = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0].map(
  (step) => step === 1,
)

/** `ZoneSampler::start`: how loud a key played as hard as `gain` is, for the Velocity knob. */
export const zoneVelocity = (gain: number, amount: number): number => 1 - amount + amount * gain

/** The key a pitch is, with its fraction: `kit::hz_to_midi`. */
const keyOf = (hz: number): number => 69 + 12 * Math.log2(Math.max(hz, 1) / 440)
const hzOf = (key: number): number => 440 * Math.pow(2, (key - 69) / 12)

/**
 * How loud a key comes out: played as hard as `gain`, sounding `semitones`
 * from its own pitch (Tune and Fine), through the Tone filter at the pitch it
 * sounds at. `ZoneSampler::start` plays a zone as far from its root as the
 * key is, so a key sounds at its own pitch: on the three looped tones the
 * device is built with (roots C3, C4 and C5, every key in one of them), and
 * on a made instrument whose zones follow the keys.
 *
 * A display is not told the zones of a made instrument: which keys have a
 * recording of their own, a zone's gain, its touch layers, whether its sound
 * loops or follows the keys at all. So the keyboard marks no zones and the
 * map is the two knobs' doing alone. Every key plays (`ZoneSampler::pick`
 * takes the nearest zone), and a sound without a loop that ends under a held
 * key shows only at the foot.
 */
export function zoneLevel(
  key: number,
  gain: number,
  amount: number,
  semitones: number,
  toneHz: number,
): number {
  return zoneVelocity(gain, amount) * toneGain(hzOf(key + semitones), toneHz)
}

interface ZoneParts {
  /** The map: keys across, how hard they are played upwards. */
  map: Box
  keys: Box
  /** The shape of a note in time, in the corner. */
  shape: Box
  foot: Box
}

function zoneParts(view: Size): ZoneParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const foot: Box = { x: all.x, y: all.y + all.h - 6, w: all.w, h: 5 }
  const keys: Box = { x: all.x + 2, y: foot.y - 3 - 11, w: all.w - 4, h: 11 }
  const top = all.y + 14
  return {
    map: { x: keys.x, y: top, w: keys.w, h: keys.y - 6 - top },
    keys,
    shape: { x: all.x + all.w - 46, y: all.y + 1, w: 44, h: 9 },
    foot,
  }
}

/**
 * A note's shape in time, small: the attack's rise, a moment held, the
 * release's fall. Each takes as much room as its knob is turned up, so a
 * millisecond and eight seconds both show.
 */
function envelopeMark(
  frame: Paint,
  box: Box,
  attackAt: number,
  releaseAt: number,
  attack: number,
  release: number,
): void {
  const { ctx, colours } = frame
  const hold = 5
  const room = box.w - hold - 4
  const rise = 2 + clamp(attackAt, 0, 1) * room * 0.45
  const fall = 2 + clamp(releaseAt, 0, 1) * room * 0.55
  const base = box.y + box.h
  const left = box.x + box.w - rise - hold - fall
  ctx.beginPath()
  ctx.moveTo(left, base)
  for (let step = 1; step <= 8; step++) {
    const u = step / 8
    ctx.lineTo(left + u * rise, base - lightOf(adsrAttackLevel(u * attack, attack)) * box.h)
  }
  ctx.lineTo(left + rise + hold, box.y)
  for (let step = 1; step <= 8; step++) {
    const u = step / 8
    ctx.lineTo(
      left + rise + hold + u * fall,
      base - lightOf(adsrLevel(attack + u * release, u * release, attack, release)) * box.h,
    )
  }
  ctx.lineTo(left + rise + hold + fall, base)
  ctx.closePath()
  ctx.globalAlpha = INK.fill
  ctx.fillStyle = colours.ink
  ctx.fill()
  ctx.globalAlpha = INK.text
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.globalAlpha = 1
}

/** Semitones as they are said, with a real minus: "+12 st", "−0.5 st". */
function semitonesText(semitones: number): string {
  const rounded = Math.round(semitones * 100) / 100
  return `${rounded < 0 ? '−' : '+'}${String(Math.abs(rounded))} st`
}

const zoneSampler = plateDisplay({
  place: 'window',
  columns: 2,
  params: ['tune', 'fine', 'attack', 'release', 'tone', 'velocity'],
  live: { signal: true, notes: true },
  info: 'The keyboard, and over it a map of how loud each key comes out by how hard it is played: Velocity thins the soft rows, Tone the high keys. A note is a lit dot at its key and its touch, and the arrow on the keys is how far Tune moves the pitch.',
  draw(frame) {
    const { ctx, colours } = frame
    ground(frame)
    const { map, keys, shape, foot } = zoneParts(frame)
    const semitones = frame.value('tune') + frame.value('fine') / 100
    const attack = frame.value('attack')
    const release = frame.value('release')
    const tone = frame.value('tone')
    const amount = frame.value('velocity')
    const span = ZONE_HIGH_KEY - ZONE_LOW_KEY + 1
    const slot = keys.w / span
    const xOfKey = (key: number): number =>
      keys.x + (clamp(key, ZONE_LOW_KEY - 0.5, ZONE_HIGH_KEY + 0.5) - ZONE_LOW_KEY + 0.5) * slot
    const row = map.h / ZONE_ROWS
    const yOfTouch = (gain: number): number =>
      Math.min(map.y + map.h - 1, map.y + (1 - clamp(gain, 0, 1)) * map.h + row / 2)

    // The map: a dot for every third key at each of eight touches, as large as that key comes out loud.
    const most = Math.min(ZONE_COLUMN_KEYS * slot, row) * 0.43
    ctx.beginPath()
    for (let key = ZONE_LOW_KEY + 1; key <= ZONE_HIGH_KEY; key += ZONE_COLUMN_KEYS) {
      const x = xOfKey(key)
      const through = toneGain(hzOf(key + semitones), tone)
      for (let step = 1; step <= ZONE_ROWS; step++) {
        const gain = step / ZONE_ROWS
        const radius = Math.max(0.35, most * lightOf(zoneVelocity(gain, amount) * through))
        const y = yOfTouch(gain)
        ctx.moveTo(x + radius, y)
        ctx.arc(x, y, radius, 0, Math.PI * 2)
      }
    }
    ctx.globalAlpha = INK.back
    ctx.fillStyle = colours.ink
    ctx.fill()
    ctx.globalAlpha = 1

    // The keyboard: every key a slot, the black ones filled, a line where two white ones meet.
    fillRect(ctx, keys, colours.ink, INK.ground)
    for (let key = ZONE_LOW_KEY; key <= ZONE_HIGH_KEY; key++) {
      const step = key % 12
      const x = keys.x + (key - ZONE_LOW_KEY) * slot
      if (BLACK_KEYS[step]) {
        fillRect(ctx, { x, y: keys.y, w: slot, h: keys.h * 0.62 }, colours.ink, INK.text)
      } else if (step === 0 || step === 5) {
        rule(ctx, x, keys.y, x, keys.y + keys.h, {
          colour: colours.ink,
          alpha: step === 0 ? INK.back : INK.rule,
        })
      }
    }
    ctx.globalAlpha = INK.rule
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.strokeRect(keys.x + 0.5, keys.y + 0.5, keys.w - 1, keys.h - 1)
    ctx.globalAlpha = 1

    // Tune and Fine: from middle C to the pitch it plays.
    const lane = keys.y - 3
    const fromX = xOfKey(60)
    const toX = xOfKey(60 + semitones)
    dot(ctx, fromX, lane, 1.5, colours.ink)
    if (Math.abs(toX - fromX) > 0.01) {
      const way = toX > fromX ? 1 : -1
      rule(ctx, fromX, lane, toX, lane, { colour: colours.ink, width: 1.25 })
      ctx.fillStyle = colours.ink
      arrowHead(frame, toX + way, lane, way, 0, Math.min(3.5, Math.abs(toX - fromX) + 1))
    }

    // The notes that sound: each lights its key, and a dot stands where the map is read for it,
    // over the pitch it sounds at and as high as it was played hard.
    const notes = frame.notes
    let lit = 0
    for (let index = notes.length - 1; index >= 0 && lit < ZONE_VOICES; index--) {
      const note = notes[index]
      const envelope = adsrLevel(note.age, note.released, attack, release)
      if (envelope < NOTE_OUT) continue
      lit++
      const key = keyOf(note.frequency)
      const level = envelope * zoneLevel(key, note.gain, amount, semitones, tone)
      const x = xOfKey(key + semitones)
      const y = yOfTouch(note.gain)
      const radius = 1.5 + 3 * lightOf(level)
      const struck = xOfKey(Math.round(key))
      fillRect(
        ctx,
        { x: struck - Math.max(slot, 2) / 2, y: keys.y + 1, w: Math.max(slot, 2), h: keys.h - 2 },
        colours.accent,
      )
      ctx.beginPath()
      ctx.moveTo(struck, keys.y)
      ctx.lineTo(x, y)
      ctx.globalAlpha = 0.4 + 0.6 * lightOf(envelope)
      ctx.strokeStyle = colours.accent
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.globalAlpha = 1
      dot(ctx, x, y, radius, colours.accent)
    }

    levelFoot(frame, foot, outShare(frame))

    // The words: how far the keys are tuned, beside the shape every note has.
    text(frame, semitonesText(semitones), map.x - 1, shape.y + shape.h - 1)
    envelopeMark(frame, shape, frame.at('attack'), frame.at('release'), attack, release)
  },
})

// --- Grain -------------------------------------------------------------------

/** `grain_synth.h`, `kDefaultFrames` over `kDefaultRate`: the sound it is built with lasts this long. */
export const GRAIN_SOUND_SEC = 127938 / 32000
/** `grain_synth.h`, `kStoreFrames`: the frames of a loaded sound it keeps. */
export const GRAIN_STORE_FRAMES = 1 << 20
/** `grain_synth.h`: middle C reads the sound at its own pitch; 8 keys, 20 grains a key, 64 grains in all. */
const GRAIN_MIDDLE_C = 261.6256
const GRAIN_VOICES = 8
const GRAINS_PER_VOICE = 20
const GRAIN_BUDGET = 64

/** `GrainSynth::plan_grains`: how many grains overlap on each of `sounding` keys. */
export function grainDensity(density: number, sounding: number): number {
  return clamp(density, 1, GRAIN_BUDGET / Math.max(1, sounding))
}

/** `GrainSynth::plan_grains`: the share of a grain each of its two fades takes; half is a bell. */
export const grainEdge = (shape: number): number => 0.5 * (1 - 0.92 * clamp(shape, 0, 1))

/** `GrainSynth::render`: a grain's window, `phase` of the way through it. */
export function grainWindow(phase: number, edge: number): number {
  const ramp = clamp(Math.min(phase, 1 - phase) / edge, 0, 1)
  return ramp * ramp * (3 - 2 * ramp)
}

/** `GrainSynth::spawn`: how far to either side of the reading point a grain may start, as a share of the sound. */
export const grainSpray = (spray: number): number => 0.5 * spray * spray

/** `GrainSynth::note_on`: how loud a key played as hard as `gain` is. */
export const grainVelocity = (gain: number): number => 0.35 + 0.65 * gain

/** `GrainSynth::fill`: how many grains a key starts with, already spread through their windows. */
export const grainsAtStart = (density: number): number => Math.ceil(0.999 * density)

/** A share of the sound, wrapped into it as `GrainSynth::wrap` does. */
const wrapShare = (share: number): number => share - Math.floor(share)

/** What the grains are made by, as the knobs set it. */
export interface GrainSettings {
  /** How long the sound is, in seconds: Scan and a grain's stretch are shares of it. */
  sound: number
  position: number
  /** Scan: shares of the sound a second. */
  scan: number
  /** Size in seconds. */
  size: number
  spray: number
  /** Detune: the cents a grain may be thrown off its pitch, either way. */
  detune: number
  octaves: number
  reverse: number
  spread: number
}

/**
 * One grain: the stretch of the sound it reads, which way, where it lies
 * between left (−1) and right (1), and the cents Detune threw it off its pitch.
 */
export interface Grain {
  start: number
  span: number
  reverse: boolean
  pan: number
  cents: number
}

/**
 * A number in 0..1 for a grain, in place of the device's own dice: which grain
 * is where is thrown per voice in the device and nobody outside can know it.
 * So the grains drawn are a cloud with the device's figures (how many, how
 * long, how wide a scatter, how far out of tune, how many reversed), not its
 * very grains.
 *
 * It is a hash and not a sequence: the same note, grain and throw give the
 * same number on every frame, so the same frame is always the same picture and
 * a grain keeps its place for as long as it is open. A note's grains are
 * numbered by the device's own pace, one every Size over Density.
 */
function grainDice(seed: number, grain: number, which: number): number {
  let x =
    (Math.imul(seed | 0, 0x9e3779b1) ^
      Math.imul(grain | 0, 0x85ebca6b) ^
      Math.imul(which + 1, 0xc2b2ae35)) >>>
    0
  x ^= x >>> 16
  x = Math.imul(x, 0x7feb352d) >>> 0
  x ^= x >>> 15
  x = Math.imul(x, 0x846ca68b) >>> 0
  x ^= x >>> 16
  return (x >>> 8) / 16777216
}

/**
 * `GrainSynth::spawn`: a grain started with the reading point at `centre`, on
 * a key `ratio` times middle C. Detune throws it so many cents up or down at
 * most. An octave up reads twice the stretch, an octave down half; a grain
 * that would run off the end is pulled back.
 */
export function grainSpawn(
  into: Grain,
  seed: number,
  index: number,
  centre: number,
  ratio: number,
  settings: GrainSettings,
): Grain {
  into.cents = settings.detune > 0 ? settings.detune * (grainDice(seed, index, 4) * 2 - 1) : 0
  let rate = ratio * Math.pow(2, into.cents / 1200)
  const octave = grainDice(seed, index, 0)
  if (octave < settings.octaves) rate *= octave < 0.5 * settings.octaves ? 2 : 0.5
  into.reverse = grainDice(seed, index, 1) < settings.reverse
  into.span = (rate * settings.size) / settings.sound
  const thrown = (grainDice(seed, index, 2) * 2 - 1) * grainSpray(settings.spray)
  const start = wrapShare(centre + thrown)
  into.start = into.span < 1 ? clamp(start, 0, 1 - into.span) : start
  into.pan = settings.spread * (grainDice(seed, index, 3) * 2 - 1)
  return into
}

interface GrainParts {
  /** The sound from left to right, and what is heard of it from the left side (top) to the right (bottom). */
  cloud: Box
  /** The baseline of the words, clear of the handle that stands on the cloud's top. */
  words: number
  /** Tone, small, in the row of the words: between them where there is room, else in place of the left one. */
  tone: Box
  /** Whether the left word has room beside it. */
  scanned: boolean
  foot: Box
}

function grainParts(view: Size): GrainParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const foot: Box = { x: all.x, y: all.y + all.h - 6, w: all.w, h: 5 }
  const top = all.y + 15
  const words = all.y + 9
  const scanned = view.width >= TONE_MARK_ROOM
  return {
    cloud: { x: all.x + 10, y: top, w: all.w - 13, h: foot.y - 8 - top },
    words,
    tone: {
      x: scanned ? all.x + (all.w - TONE_MARK_WIDE) / 2 : all.x + 1,
      y: words - TONE_MARK_HIGH,
      w: TONE_MARK_WIDE,
      h: TONE_MARK_HIGH,
    },
    scanned,
    foot,
  }
}

/** Half the thickness of a grain drawn at full level, in px. */
const GRAIN_HALF = 3
/**
 * How far off its line the head of a grain a semitone out of tune stands, in
 * px. The way there goes by the root of the cents, so that the few cents that
 * thicken a cloud can be seen beside the many that blur its pitch.
 */
const GRAIN_DETUNE_PX = 5
/** The top of the Detune knob, in cents: a grain thrown that far has its head `GRAIN_DETUNE_PX` off its line. */
const GRAIN_DETUNE_MOST = 100
/** The scan of a grain's start round either end of the sound: the turn before, this one, the turn after. */
const GRAIN_TURNS = [-1, 0, 1] as const

/**
 * The path of a grain lying on the sound from `x0` to `x1` at the height `y`:
 * its window over the stretch it reads, `half` thick to either side where it
 * is fully open. A bell is a spindle, a flat top a bar with short ends.
 */
function grainLens(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  y: number,
  half: number,
  edge: number,
): void {
  const wide = x1 - x0
  ctx.beginPath()
  ctx.moveTo(x0, y)
  // The window bends only in its two fades: three points each, and the flat between them.
  for (let step = 1; step <= 7; step++) {
    const u = step < 4 ? (edge * step) / 3 : 1 - (edge * (7 - step)) / 3
    ctx.lineTo(x0 + u * wide, y - half * grainWindow(u, edge))
  }
  for (let step = 6; step >= 1; step--) {
    const u = step < 4 ? (edge * step) / 3 : 1 - (edge * (7 - step)) / 3
    ctx.lineTo(x0 + u * wide, y + half * grainWindow(u, edge))
  }
  ctx.closePath()
}

interface GrainState {
  grain: Grain
  settings: GrainSettings
}

const grainSynth = plateDisplay<GrainState>({
  place: 'window',
  columns: 2,
  params: [
    'position',
    'scan',
    'size',
    'density',
    'spray',
    'detune',
    'octaves',
    'shape',
    'reverse',
    'attack',
    'release',
    'spread',
    'tone',
  ],
  live: { signal: true, notes: true },
  info: 'The sound from left to right and a cloud of grains like those a key takes from it. Each lies on the stretch it reads, high for left and low for right. Its head points the way it reads, off its line by its Detune. A note lights a cloud of its own. The curve is Tone. Drag the handle to set Position.',
  init: () => ({
    grain: { start: 0, span: 0, reverse: false, pan: 0, cents: 0 },
    settings: {
      sound: GRAIN_SOUND_SEC,
      position: 0,
      scan: 0,
      size: 0,
      spray: 0,
      detune: 0,
      octaves: 0,
      reverse: 0,
      spread: 0,
    },
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { cloud, words, tone, scanned, foot } = grainParts(frame)
    // Scan and the stretch a grain reads are seconds, and the picture is in
    // shares of the sound: how far a second is hangs on the sound's length.
    const sound = soundSeconds(
      frame.sampleSeconds,
      GRAIN_SOUND_SEC,
      GRAIN_STORE_FRAMES,
      frame.sampleRate,
    )
    // `GrainSynth::spawn`: with nothing in the store no grain starts. The picture is then drawn as for the built-in sound, unlit.
    const empty = sound <= 0
    const { settings } = state
    settings.sound = empty ? GRAIN_SOUND_SEC : sound
    settings.position = clamp(frame.value('position'), 0, 1)
    settings.scan = frame.value('scan') / settings.sound
    settings.size = frame.value('size') / 1000
    settings.spray = clamp(frame.value('spray'), 0, 1)
    settings.detune = frame.value('detune')
    settings.octaves = frame.value('octaves')
    settings.reverse = frame.value('reverse')
    settings.spread = clamp(frame.value('spread'), 0, 1)
    const density = frame.value('density')
    const edge = grainEdge(frame.value('shape'))
    const attack = frame.value('attack')
    const release = frame.value('release')
    const xOf = (share: number): number => cloud.x + share * cloud.w
    const base = cloud.y + cloud.h
    // The grains lie between the left side and the right, clear of the ruler under them.
    const centre = cloud.y + (cloud.h - 4) / 2
    const reach = (cloud.h - 4) / 2 - GRAIN_HALF - 1
    const yOf = (pan: number): number => centre + pan * reach

    // The sound: a ruler along the foot with a mark at every tenth of it, and the two sides it is heard from.
    rule(ctx, cloud.x, base, cloud.x + cloud.w, base, { colour: colours.ink, alpha: INK.rule })
    for (let tenth = 0; tenth <= 10; tenth++) {
      const x = xOf(tenth / 10)
      rule(ctx, x, base - (tenth % 5 === 0 ? 4 : 2), x, base, {
        colour: colours.ink,
        alpha: INK.back,
      })
    }
    text(frame, 'L', cloud.x - 9, yOf(-1) + 3)
    text(frame, 'R', cloud.x - 9, yOf(1) + 3)

    // Where the grains of a middle C may lie: as far to either side of the reading point as Spray
    // throws their starts (round the ends too) and a grain's length on, as far left and right as Spread.
    const scatter = grainSpray(settings.spray)
    const length = Math.min(1, settings.size / settings.sound)
    const side = settings.spread * reach + GRAIN_HALF + 1
    for (const turn of GRAIN_TURNS) {
      const from = Math.max(0, settings.position - scatter + turn)
      const to = Math.min(1, settings.position + scatter + turn + length)
      if (to <= from) continue
      fillRect(
        ctx,
        { x: xOf(from), y: centre - side, w: xOf(to) - xOf(from), h: 2 * side },
        colours.ink,
        INK.ground,
      )
    }

    // The reading point, and under the ruler how far Scan carries it in a second.
    const at = xOf(settings.position)
    rule(ctx, at, cloud.y, at, base, { colour: colours.ink, alpha: INK.back })
    const carried = clamp(settings.scan * cloud.w, -cloud.w, cloud.w)
    const lane = base + 3.5
    if (Math.abs(carried) >= 1) {
      const way = carried > 0 ? 1 : -1
      rule(ctx, at, lane, at + carried, lane, { colour: colours.ink, width: 1.25 })
      ctx.fillStyle = colours.ink
      arrowHead(frame, at + carried + way, lane, way, 0, Math.min(3.5, Math.abs(carried) + 1))
    } else {
      // Frozen: it stays.
      fillRect(ctx, { x: at - 1.5, y: lane - 1.5, w: 3, h: 3 }, colours.ink)
    }

    /**
     * One grain, `phase` of the way through its window: the stretch it reads, as thick as it is
     * loud, and on it the head, which points the way it reads and is as large as the grain is open.
     * A grain Detune threw sharp has its head on a stem above its line, a flat one below.
     */
    const lay = (
      grain: Grain,
      phase: number,
      half: number,
      colour: string,
      body: number,
      head: number,
    ): void => {
      const x0 = xOf(grain.start)
      const x1 = xOf(grain.start + grain.span)
      const y = yOf(grain.pan)
      ctx.fillStyle = colour
      // Too short a stretch to have a shape is left to its head.
      if (x1 - x0 >= 2) {
        grainLens(ctx, x0, x1, y, half, edge)
        ctx.globalAlpha = body
        ctx.fill()
      }
      const size = (half + 1.5) * Math.sqrt(grainWindow(phase, edge))
      if (size >= 0.75) {
        const way = grain.reverse ? -1 : 1
        const x = x0 + (grain.reverse ? 1 - phase : phase) * (x1 - x0)
        const off = Math.sqrt(Math.abs(grain.cents) / GRAIN_DETUNE_MOST) * GRAIN_DETUNE_PX
        const lifted = grain.cents > 0 ? y - off : y + off
        ctx.globalAlpha = head
        if (off >= 0.5) ctx.fillRect(x - 0.5, Math.min(y, lifted), 1, off)
        arrowHead(frame, x + way * size * 0.5, lifted, way, 0, size)
      }
      ctx.globalAlpha = 1
    }

    ctx.save()
    ctx.beginPath()
    ctx.rect(cloud.x - 1, cloud.y - 1, cloud.w + 2, cloud.h + 2)
    ctx.clip()

    // The keys the device counts as sounding, which share its budget of grains: `plan_grains`
    // counts a voice until its envelope is done, well after its release can be heard or seen.
    const notes = empty ? NO_NOTES : frame.notes
    let sounding = 0
    let heard = 0
    for (let index = notes.length - 1; index >= 0 && sounding < GRAIN_VOICES; index--) {
      const level = adsrLevel(notes[index].age, notes[index].released, attack, release)
      if (level >= ADSR_IDLE) sounding++
      if (level >= NOTE_OUT) heard++
    }

    // At rest: the grains a key at middle C starts with, already spread through their windows.
    const alone = grainDensity(density, 1)
    const first = grainsAtStart(alone)
    for (let index = 0; index < first; index++) {
      const grain = grainSpawn(state.grain, 1, index, settings.position, 1, settings)
      lay(
        grain,
        index / alone,
        GRAIN_HALF,
        colours.ink,
        heard > 0 ? INK.grid : INK.rule,
        heard > 0 ? INK.rule : INK.trace,
      )
    }

    // The notes that sound: the grains each has open now, one started every Size over Density
    // and each open for a Size, from where Scan had carried the reading point when it started.
    const overlap = grainDensity(density, sounding)
    const interval = settings.size / overlap
    const started = grainsAtStart(overlap)
    let lit = 0
    for (let index = notes.length - 1; index >= 0 && lit < GRAIN_VOICES; index--) {
      const note = notes[index]
      const envelope = adsrLevel(note.age, note.released, attack, release)
      if (envelope < ADSR_IDLE) continue
      // It still holds a voice, and is drawn only for as long as it can be heard.
      lit++
      if (envelope < NOTE_OUT) continue
      const half = 0.5 + (GRAIN_HALF - 0.5) * lightOf(envelope * grainVelocity(note.gain))
      const ratio = note.frequency / GRAIN_MIDDLE_C
      const newest = Math.floor(note.age / interval)
      const oldest = Math.max(1 - started, Math.floor((note.age - settings.size) / interval) + 1)
      for (let k = Math.max(oldest, newest - GRAINS_PER_VOICE + 1); k <= newest; k++) {
        const born = k * interval
        const grain = grainSpawn(
          state.grain,
          note.id + 2,
          k,
          settings.position + settings.scan * Math.max(0, born),
          ratio,
          settings,
        )
        lay(grain, clamp((note.age - born) / settings.size, 0, 1), half, colours.accent, 0.4, 1)
      }
    }
    ctx.restore()

    // Where each of those notes is reading now.
    lit = 0
    for (let index = notes.length - 1; index >= 0 && lit < GRAIN_VOICES; index--) {
      const note = notes[index]
      const envelope = adsrLevel(note.age, note.released, attack, release)
      if (envelope < ADSR_IDLE) continue
      lit++
      if (envelope < NOTE_OUT) continue
      const x = xOf(wrapShare(settings.position + settings.scan * note.age))
      rule(ctx, x, base, x, base + 6, { colour: colours.accent, width: 1.5 })
    }

    levelFoot(frame, foot, outShare(frame))

    // The words: where there is room how fast it moves through the sound (the arrow under the
    // ruler says it too), then Tone, and a grain's length by how many overlap.
    const scan = frame.value('scan')
    if (scanned) {
      text(
        frame,
        scan === 0
          ? 'Frozen'
          : `Scan ${scan < 0 ? '−' : ''}${String(Math.abs(Math.round(scan * 100) / 100))}`,
        cloud.x - 9,
        words,
      )
    }
    toneMark(frame, tone, frame.value('tone'))
    text(
      frame,
      `${Math.round(frame.value('size'))} ms × ${String(Math.round(overlap * 10) / 10)}`,
      cloud.x + cloud.w + 2,
      words,
      { align: 'right' },
    )

    for (const point of grainHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: grainHandles,
})

function grainHandles(view: DisplayView): DisplayHandle[] {
  const { cloud } = grainParts(view)
  return [
    {
      key: 'position',
      name: 'Position',
      x: cloud.x + clamp(view.value('position'), 0, 1) * cloud.w,
      y: cloud.y + 1,
      drag: (toX) => ({ position: clamp((toX - cloud.x) / cloud.w, 0, 1) }),
      reset: () => ({ position: view.spec('position')?.default ?? 0.2 }),
    },
  ]
}

// --- Tape Orchestra ----------------------------------------------------------

/** `tapes.h`, `kTapes`: how many play each key, how they speak and swell, their vibrato and how far apart they tune. */
const TAPES = [
  {
    name: 'Strings',
    players: 3,
    attack: 0.045,
    swell: 0.35,
    held: 0.25,
    cents: 24,
    hz: 5.9,
    tremolo: 0.04,
    apart: 9,
  },
  {
    name: 'Cellos',
    players: 3,
    attack: 0.09,
    swell: 0.5,
    held: 0.3,
    cents: 20,
    hz: 5.2,
    tremolo: 0.04,
    apart: 8,
  },
  {
    name: 'Flutes',
    players: 3,
    attack: 0.05,
    swell: 0.25,
    held: 0.2,
    cents: 9,
    hz: 5.3,
    tremolo: 0.22,
    apart: 2.5,
  },
  {
    name: 'Horns',
    players: 4,
    attack: 0.11,
    swell: 0.9,
    held: 0.45,
    cents: 5,
    hz: 5.0,
    tremolo: 0.03,
    apart: 3,
  },
  {
    name: 'Reeds',
    players: 3,
    attack: 0.035,
    swell: 0.3,
    held: 0.2,
    cents: 8,
    hz: 5.6,
    tremolo: 0.08,
    apart: 4,
  },
  {
    name: 'Choir',
    players: 4,
    attack: 0.14,
    swell: 0.6,
    held: 0.3,
    cents: 26,
    hz: 5.4,
    tremolo: 0.06,
    apart: 9,
  },
] as const
type TapeDef = (typeof TAPES)[number]

/** `tape_orchestra.h`: a key's own tuning and level, its wow, the lurch as the tape is gripped, by Age (0..1). */
const TAPE_KEY_CENTS = 1.5
const TAPE_KEY_CENTS_AGE = 5
const TAPE_KEY_LEVEL_DB = 0.4
const TAPE_KEY_LEVEL_DB_AGE = 2
const TAPE_WOW_CENTS = 1
const TAPE_WOW_CENTS_AGE = 11
const TAPE_LURCH_CENTS = 4
const TAPE_LURCH_CENTS_AGE = 46
const TAPE_LURCH_SEC = 0.08
/** `tape_orchestra.h`: dropouts start here on the Age knob; a tape fades over its last half second; Length from here up never ends. */
const TAPE_DROPOUT_FROM_AGE = 0.45
const TAPE_RUN_OUT_SEC = 0.5
const TAPE_ENDLESS_FROM = 8.95
/** `tape_orchestra.h`: the band the tape passes at Tone 0 and Age 0, the corner the tone tilts about, and 16 keys at once. */
const TAPE_LOW_CUT_HZ = 75
const TAPE_ROLL_OFF_HZ = 7000
const TAPE_TILT_HZ = 1200
const TAPE_VOICES = 16
/** `TapeOrchestra::start`: where the lead player of a section of three, and of four, sits in its tuning. */
const TAPE_LEAD_TUNING = [0.1, -0.1] as const
/** `TapeOrchestra::start`, `kDetune` and `kSeat`: every player's place in the tuning and between left and right. */
const TAPE_TUNINGS = [
  [0.1, -1, 0.9],
  [-0.1, 1, -1, 0.4],
] as const
const TAPE_SEATS = [
  [0.3, -0.85, 0.85],
  [-0.3, 0.85, -0.85, 0.4],
] as const

/** `TapeOrchestra::scramble`. */
function tapeScramble(seed: number): number {
  let x = seed >>> 0
  x ^= x >>> 16
  x = Math.imul(x, 0x7feb352d) >>> 0
  x ^= x >>> 15
  x = Math.imul(x, 0x846ca68b) >>> 0
  x ^= x >>> 16
  return x === 0 ? 0x2545f491 : x >>> 0
}

/** `kit::Rng` (math.h): the dice a key's tape is thrown with, so the same key is the same take here as in the device. */
function tapeDice(seed: number): () => number {
  let state = seed === 0 ? 0x2545f491 : seed >>> 0
  return () => {
    state ^= state << 13
    state >>>= 0
    state ^= state >>> 17
    state ^= state << 5
    state >>>= 0
    return (state >>> 8) / 16777216
  }
}

/** What is fixed for a key on a tape: its tape's faults, and how its lead player plays. */
export interface TapeTake {
  /** The key's own tuning and level, −1..1. */
  keyCents: number
  keyLevel: number
  wowPhase: number
  wowRate: number
  swayPhase: number
  /** The lead player: place in the tuning, vibrato's pace and wait (−1..1), where its vibrato starts, its slow wander. */
  tuning: number
  pace: number
  wait: number
  vibratoPhase: number
  vibratoThrow: number
  wanderPhase: number
  wanderRate: number
  /** The dropouts on the first seconds of the tape, three numbers each: from, until, how deep. */
  drops: Float32Array
  dropCount: number
}

/** The seconds of tape a display shows: the longest a tape is. */
const TAPE_SHOWN_SEC = 9

/**
 * `TapeOrchestra::start`: the take of a key (a MIDI number) on a tape, thrown
 * with the device's own dice in the device's own order.
 */
export function tapeTake(key: number, tape: number): TapeTake {
  const seed = tapeScramble(clamp(Math.round(key), 0, 140) * 8 + tape + 1)
  const dice = tapeDice(tapeScramble(seed ^ 0x9e3779b9))
  const bipolar = (): number => dice() * 2 - 1
  const keyCents = bipolar()
  const keyLevel = bipolar()
  const wowPhase = dice()
  const wowRate = 0.3 + 0.7 * dice()
  const swayPhase = dice()
  dice() // the flutter's phase
  dice() // and its rate: 6 to 10 Hz, finer than a display can draw
  dice() // which side the section is seated from
  const vibratoPhase = dice()
  const layout = TAPES[clamp(Math.round(tape), 0, TAPES.length - 1)].players >= 4 ? 1 : 0
  const tuning = TAPE_LEAD_TUNING[layout] * (0.75 + 0.25 * dice())
  dice() // the lead's seat
  const pace = bipolar()
  const wait = bipolar()
  const vibratoThrow = bipolar()
  const wanderPhase = dice()
  dice() // the wander of its level
  const wanderRate = 0.17 + 0.3 * dice()

  // `TapeOrchestra::control_voice`: the dropouts sit at fixed places on a key's tape.
  const drop = tapeDice(tapeScramble(seed ^ 0x0badc0de))
  const drops = new Float32Array(3 * 24)
  let dropCount = 0
  let at = 0.3 + 1.5 * drop()
  while (at < TAPE_SHOWN_SEC && dropCount < 24) {
    drops[dropCount * 3] = at
    drops[dropCount * 3 + 1] = at + 0.04 + 0.12 * drop()
    drops[dropCount * 3 + 2] = 0.35 + 0.5 * drop()
    dropCount++
    at += 0.5 + 2.2 * drop()
  }
  return {
    keyCents,
    keyLevel,
    wowPhase,
    wowRate,
    swayPhase,
    tuning,
    pace,
    wait,
    vibratoPhase,
    vibratoThrow,
    wanderPhase,
    wanderRate,
    drops,
    dropCount,
  }
}

/** What the knobs make of a tape. */
export interface TapeSettings {
  tape: number
  age: number
  /** 1, or a half. */
  speed: number
  length: number
  attack: number
  /** Section and Vibrato. */
  section: number
  vibrato: number
  tone: number
}

const smoothstep = (x: number): number => {
  const t = clamp(x, 0, 1)
  return t * t * (3 - 2 * t)
}
const sine = (turns: number): number => Math.sin(2 * Math.PI * turns)

/** `TapeOrchestra::control_voice`: what is left of a tape `seconds` into it, as a gain: all of it, then a fade over the last half second. */
export function tapeRunOut(seconds: number, length: number): number {
  if (length >= TAPE_ENDLESS_FROM) return 1
  const left = clamp((length - seconds) / TAPE_RUN_OUT_SEC, 0, 1)
  return left * left
}

/** `TapeOrchestra::control`: the band the tape passes, as a gain at a key's own pitch. Speed moves the band and the pitch together. */
export function tapeBandGain(hz: number, tone: number, age: number): number {
  const low = hz / (TAPE_LOW_CUT_HZ * (1 + 0.8 * age))
  const lowCut = (low * low) / Math.sqrt((1 - low * low) ** 2 + (low / 0.9) ** 2)
  const high =
    hz / (TAPE_ROLL_OFF_HZ * Math.pow(2, tone * (tone < 0 ? 1.6 : 0.55)) * (1 - 0.5 * age))
  const rollOff = 1 / Math.sqrt((1 - high * high) ** 2 + (high / 0.62) ** 2)
  // `TapeOrchestra::shape`: the tilt adds so much of what lies above its corner.
  const amount = tone > 0 ? tone : 0.5 * tone
  const s = hz / TAPE_TILT_HZ
  const tilt = Math.hypot(1 + (amount * s * s) / (1 + s * s), (amount * s) / (1 + s * s))
  return lowCut * rollOff * tilt
}

/** `TapeOrchestra::control`: the hiss, against one key's at Hiss 1: the knob, and the power of the keys that sound. */
export const tapeHiss = (amount: number, power: number): number =>
  amount * (0.25 + 0.75 * amount) * Math.sqrt(Math.max(0, power))

/** A place on a key's tape: how far off its pitch the lead player is there, in cents, and how loud the key. */
export interface TapePoint {
  cents: number
  level: number
}

/**
 * `TapeOrchestra::start` and the band: what a key's level has all along its
 * tape, which is how loud the key's own tape is (a few tenths of a dB either
 * way, more when worn) and what the band lets through at its pitch.
 */
export function tapeSteady(take: TapeTake, hz: number, settings: TapeSettings): number {
  const own = Math.exp(
    0.1151293 * take.keyLevel * (TAPE_KEY_LEVEL_DB + TAPE_KEY_LEVEL_DB_AGE * settings.age),
  )
  return own * tapeBandGain(hz, settings.tone, settings.age)
}

/**
 * `TapeOrchestra::control_voice` for a key held from the start of its tape,
 * `seconds` of tape in: the lead player's pitch (the key's own tuning, the
 * wow, the lurch, its vibrato and wander; the flutter is left out) and the
 * level that comes off the tape (the Attack, the player's own speaking and
 * swell, the dropouts, the end of the tape, the band at the key's pitch).
 * The players behind the lead and the leveller are not in it. `steady` is
 * `tapeSteady` of the same key, for a caller that walks along a tape and need
 * not work it out at every step.
 */
export function tapeAt(
  into: TapePoint,
  take: TapeTake,
  hz: number,
  seconds: number,
  settings: TapeSettings,
  steady = tapeSteady(take, hz, settings),
): TapePoint {
  const def: TapeDef = TAPES[clamp(Math.round(settings.tape), 0, TAPES.length - 1)]
  const { age, section } = settings
  // What the machine does keeps its own pace; what is on the tape runs at the tape's.
  const real = seconds / settings.speed
  const wow =
    0.8 * sine(take.wowPhase + take.wowRate * seconds) +
    0.2 * sine(take.swayPhase + take.wowRate * 0.37 * seconds)
  const lurch = real < TAPE_LURCH_SEC ? 0.5 + 0.5 * Math.cos((Math.PI * real) / TAPE_LURCH_SEC) : 0
  const tight = Math.min(1, Math.sqrt(350 / hz))
  const apart = clamp(section * 5, 0, 1)
  const since = seconds - (0.3 + 0.2 * section * take.wait)
  const shake =
    smoothstep(since * 2) *
    settings.vibrato *
    (1 + 0.2 * section * take.wait) *
    sine(
      take.vibratoPhase +
        0.5 * apart * take.vibratoThrow +
        def.hz * (1 + 0.12 * section * take.pace) * seconds,
    )
  into.cents =
    take.keyCents * (TAPE_KEY_CENTS + TAPE_KEY_CENTS_AGE * age) +
    wow * (TAPE_WOW_CENTS + TAPE_WOW_CENTS_AGE * age) -
    lurch * (TAPE_LURCH_CENTS + TAPE_LURCH_CENTS_AGE * age * age) +
    def.apart * section * tight * take.tuning +
    3 * section * tight * sine(take.wanderPhase + take.wanderRate * seconds) +
    def.cents * shake

  // The lead speaks through two poles of 0.4 of the tape's attack and swells through one of 0.35 of its swell.
  const spoken = seconds / (def.attack * 0.4)
  const speaks = 1 - (1 + spoken) * Math.exp(-spoken)
  const swells = 1 - def.held * Math.exp(-seconds / (def.swell * 0.35))
  let dropped = 0
  if (age > TAPE_DROPOUT_FROM_AGE) {
    const wear = smoothstep((age - TAPE_DROPOUT_FROM_AGE) / (1 - TAPE_DROPOUT_FROM_AGE))
    for (let index = 0; index < take.dropCount; index++) {
      if (seconds >= take.drops[index * 3] && seconds < take.drops[index * 3 + 1])
        dropped = take.drops[index * 3 + 2] * wear
    }
  }
  into.level =
    adsrAttackLevel(real, settings.attack) *
    speaks *
    swells *
    (1 + def.tremolo * shake) *
    (1 - dropped) *
    tapeRunOut(seconds, settings.length) *
    steady
  return into
}

/** The keys whose tapes stand in the rack at rest: every eighth from C2 to C6. A played key's tape lies where its pitch is among them. */
const TAPE_LOW_KEY = 36
const TAPE_HIGH_KEY = 84
const TAPE_RACK_STEP = 8
/** A cent off pitch is drawn this many pixels up: several times the scale the keys lie on, so a wobble of a few cents is seen. */
const TAPE_PX_PER_CENT = 0.07
/** Half the thickness of a tape at full level, in pixels. */
const TAPE_HALF = 1.5
/** A tape is drawn a point every so many pixels: close enough that a vibrato of 7 Hz still bends it as it should. */
const TAPE_STEP_PX = 1.5
/** The specks of hiss one key brings at Hiss 1. */
const TAPE_SPECKS = 90

interface TapeParts {
  /** The tapes: seconds of tape from the heads at the left, keys from low at the foot. */
  rack: Box
  /** The section, small: its players by where they sit and how they tune. */
  section: Box
  foot: Box
}

function tapeParts(view: Size): TapeParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const foot: Box = { x: all.x, y: all.y + all.h - 6, w: all.w, h: 5 }
  const top = all.y + 14
  return {
    rack: { x: all.x + 6, y: top, w: all.w - 9, h: foot.y - 6 - top },
    section: { x: all.x + all.w / 2 - 14, y: all.y, w: 28, h: 11 },
    foot,
  }
}

interface TapeState {
  takes: Map<number, TapeTake>
  /** The two edges of the tape being drawn, x and y by turns. */
  upper: Float32Array
  lower: Float32Array
  point: TapePoint
}

function tapeTakeOf(state: TapeState, key: number, tape: number): TapeTake {
  const name = key * 8 + tape
  let take = state.takes.get(name)
  if (!take) {
    // Every key that was ever played is kept; a long evening on every tape is still a few hundred.
    if (state.takes.size > 1200) state.takes.clear()
    take = tapeTake(key, tape)
    state.takes.set(name, take)
  }
  return take
}

const tapeSettingsOf = (view: DisplayView): TapeSettings => ({
  tape: clamp(Math.round(view.value('tape')), 0, TAPES.length - 1),
  age: clamp(view.value('age'), 0, 1),
  speed: view.value('speed') > 0.5 ? 0.5 : 1,
  length: view.value('length'),
  attack: view.value('attack'),
  section: clamp(view.value('players'), 0, 1),
  vibrato: clamp(view.value('vibrato'), 0, 1),
  tone: view.value('tone'),
})

const tapeOrchestra = plateDisplay<TapeState>({
  place: 'window',
  columns: 2,
  params: [
    'tape',
    'age',
    'hiss',
    'tone',
    'speed',
    'length',
    'attack',
    'release',
    'players',
    'vibrato',
    'spread',
  ],
  live: { signal: true, notes: true },
  info: 'A rack of tapes, low keys at the foot, each drawn along its length as thick as it plays loud and as unsteady as Age and Vibrato make its pitch. A played key lights its tape as far as it has run. The dots at the top are the players of a key. Drag the handle to set Length.',
  init: () => ({
    takes: new Map<number, TapeTake>(),
    upper: new Float32Array(2 * 1024),
    lower: new Float32Array(2 * 1024),
    point: { cents: 0, level: 0 },
  }),
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const { rack, section, foot } = tapeParts(frame)
    const settings = tapeSettingsOf(frame)
    const def = TAPES[settings.tape]
    const release = frame.value('release')
    const endless = settings.length >= TAPE_ENDLESS_FROM
    const xOfTape = (seconds: number): number => rack.x + (seconds / TAPE_SHOWN_SEC) * rack.w
    const yOfKey = (key: number): number =>
      rack.y +
      rack.h -
      4 -
      ((clamp(key, TAPE_LOW_KEY, TAPE_HIGH_KEY) - TAPE_LOW_KEY) / (TAPE_HIGH_KEY - TAPE_LOW_KEY)) *
        (rack.h - 8)

    /** One tape from `since` seconds in as far as `upTo`: a ribbon about its lane. */
    const ribbon = (
      key: number,
      hz: number,
      since: number,
      upTo: number,
      colour: string,
      alpha: number,
    ): void => {
      const take = tapeTakeOf(state, key, settings.tape)
      const lane = yOfKey(key)
      const until = Math.min(upTo, endless ? TAPE_SHOWN_SEC : settings.length, TAPE_SHOWN_SEC)
      if (until <= since) return
      const from = xOfTape(since)
      const to = xOfTape(until)
      const steps = Math.min(1023, Math.max(1, Math.ceil((to - from) / TAPE_STEP_PX)))
      const { upper, lower, point } = state
      const steady = tapeSteady(take, hz, settings)
      for (let step = 0; step <= steps; step++) {
        const seconds = since + ((until - since) * step) / steps
        tapeAt(point, take, hz, seconds, settings, steady)
        const y = lane - point.cents * TAPE_PX_PER_CENT
        const half = Math.max(0.2, TAPE_HALF * lightOf(point.level))
        upper[step * 2] = lower[step * 2] = from + ((to - from) * step) / steps
        upper[step * 2 + 1] = y - half
        lower[step * 2 + 1] = y + half
      }
      ctx.beginPath()
      ctx.moveTo(upper[0], upper[1])
      for (let step = 1; step <= steps; step++) ctx.lineTo(upper[step * 2], upper[step * 2 + 1])
      for (let step = steps; step >= 0; step--) ctx.lineTo(lower[step * 2], lower[step * 2 + 1])
      ctx.closePath()
      ctx.globalAlpha = alpha
      ctx.fillStyle = colour
      ctx.fill()
      ctx.globalAlpha = 1
    }

    // The heads at the left, a mark at every second as the machine runs (twice as many at half
    // speed), and where the tape ends.
    rule(ctx, rack.x - 2, rack.y, rack.x - 2, rack.y + rack.h, {
      colour: colours.ink,
      alpha: INK.text,
      width: 2,
    })
    const base = rack.y + rack.h
    for (let second = 1; second * settings.speed <= TAPE_SHOWN_SEC; second++) {
      const x = xOfTape(second * settings.speed)
      rule(ctx, x, base + 1, x, base + (second % 5 === 0 ? 5 : 3), {
        colour: colours.ink,
        alpha: INK.back,
      })
    }
    if (!endless) {
      const x = xOfTape(settings.length)
      rule(ctx, x, rack.y, x, base, { colour: colours.ink, alpha: INK.back, dash: [2, 2] })
    }

    ctx.save()
    ctx.beginPath()
    ctx.rect(rack.x - 1, rack.y - 1, rack.w + 2, rack.h + 2)
    ctx.clip()

    // The rack at rest.
    for (let key = TAPE_LOW_KEY; key <= TAPE_HIGH_KEY; key += TAPE_RACK_STEP) {
      ribbon(key, hzOf(key), 0, TAPE_SHOWN_SEC, colours.ink, INK.back)
    }

    // The keys that sound: each tape lit as far as it has run, as bright as the note still is.
    const notes = frame.notes
    let lit = 0
    let power = 0
    for (let index = notes.length - 1; index >= 0 && lit < TAPE_VOICES; index--) {
      const note = notes[index]
      const envelope = adsrLevel(note.age, note.released, settings.attack, release)
      const run = note.age * settings.speed
      const left = tapeRunOut(run, settings.length)
      if (envelope < NOTE_OUT || left <= 0) continue
      lit++
      power += (envelope * left) ** 2
      const hz = clamp(note.frequency, 16, 0.19 * frame.sampleRate)
      const key = clamp(Math.floor(keyOf(hz) + 0.5), 0, 140)
      // A key between the rack's own has its tape drawn too, from where it is read on to its end.
      if ((key - TAPE_LOW_KEY) % TAPE_RACK_STEP !== 0 || key < TAPE_LOW_KEY || key > TAPE_HIGH_KEY)
        ribbon(key, hz, run, TAPE_SHOWN_SEC, colours.ink, INK.back)
      // `TapeOrchestra::start`: a key played as hard as `gain` is 0.35 + 0.65 gain loud.
      const loud = lightOf(envelope * (0.35 + 0.65 * note.gain))
      ribbon(key, hz, 0, run, colours.accent, 0.35 + 0.65 * loud)
      if (run <= TAPE_SHOWN_SEC) {
        const x = xOfTape(run)
        const lane = yOfKey(key)
        rule(ctx, x, lane - 3.5, x, lane + 3.5, { colour: colours.accent, width: 1.5 })
      }
    }

    // Hiss: specks over the rack, as many as there is of it. At rest what one key would bring, in
    // the ink; with keys down what they bring together, lit and never twice in the same place.
    const amount = clamp(frame.value('hiss'), 0, 1)
    const specks = Math.min(600, Math.round(TAPE_SPECKS * tapeHiss(amount, lit > 0 ? power : 1)))
    if (specks > 0) {
      const throwOf = lit > 0 ? Math.floor(frame.now * 30) : 0
      ctx.globalAlpha = lit > 0 ? 0.9 : INK.back
      ctx.fillStyle = lit > 0 ? colours.accent : colours.ink
      for (let speck = 0; speck < specks; speck++) {
        ctx.fillRect(
          rack.x + grainDice(throwOf, speck, 0) * (rack.w - 1),
          rack.y + grainDice(throwOf, speck, 1) * (rack.h - 1),
          1,
          1,
        )
      }
      ctx.globalAlpha = 1
    }
    ctx.restore()

    // The section of a key: its players, apart from left to right by Spread and up and down by how
    // far Section lets them tune apart, the lead the largest.
    const layout = def.players >= 4 ? 1 : 0
    const spread = clamp(frame.value('spread'), 0, 1)
    const middle = section.y + section.h / 2
    rule(ctx, section.x, middle, section.x + section.w, middle, {
      colour: colours.ink,
      alpha: INK.grid,
    })
    for (let player = def.players - 1; player >= 0; player--) {
      dot(
        ctx,
        section.x + section.w / 2 + TAPE_SEATS[layout][player] * spread * (section.w / 2 - 2),
        middle - TAPE_TUNINGS[layout][player] * settings.section * (section.h / 2 - 2),
        player === 0 ? 2 : 1.5,
        colours.ink,
        { alpha: player === 0 ? 1 : INK.text },
      )
    }

    levelFoot(frame, foot, outShare(frame))

    // The words: which tape, and how long it lasts as the machine runs.
    const words = rack.y - 5
    text(frame, def.name, rack.x - 5, words)
    const lasts = endless ? 'no end' : secondsText(settings.length / settings.speed)
    text(frame, settings.speed < 1 ? `half, ${lasts}` : lasts, rack.x + rack.w + 2, words, {
      align: 'right',
    })

    for (const point of tapeHandles(frame)) {
      handle(frame, point.x, point.y, { hot: frame.hot === point.key })
    }
  },
  handles: tapeHandles,
})

function tapeHandles(view: DisplayView): DisplayHandle[] {
  const { rack } = tapeParts(view)
  return [
    {
      key: 'length',
      name: 'Length',
      x: rack.x + (clamp(view.value('length'), 0, TAPE_SHOWN_SEC) / TAPE_SHOWN_SEC) * rack.w,
      y: rack.y + rack.h / 2,
      drag: (toX) => ({ length: clamp(((toX - rack.x) / rack.w) * TAPE_SHOWN_SEC, 2, 9) }),
      reset: () => ({ length: view.spec('length')?.default ?? 9 }),
    },
  ]
}

export const SAMPLE_INSTRUMENT_FACES: Readonly<Record<string, PlateFace>> = {
  'tape-orchestra': { display: tapeOrchestra, face: ['tape', 'speed', 'length', 'age'] },
  'zone-sampler': { display: zoneSampler, face: ['attack', 'release', 'tone', 'velocity'] },
  'grain-synth': {
    display: grainSynth,
    face: ['position', 'scan', 'size', 'density'],
    sections: [
      ['position', 'scan', 'spray'],
      ['size', 'density', 'shape', 'reverse'],
      ['detune', 'octaves'],
      ['attack', 'release'],
      ['spread', 'tone', 'volume'],
    ],
  },
  sampler: {
    display: sampler,
    face: ['start', 'end', 'loop', 'tune'],
    sections: [
      ['start', 'end', 'loop', 'crossfade', 'reverse'],
      ['tune', 'fine', 'wobble'],
      ['attack', 'release', 'velocity'],
      ['tone', 'volume'],
    ],
  },
}
