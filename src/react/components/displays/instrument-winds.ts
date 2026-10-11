// Displays of the instruments that are blown, and of the voices.
//
// What a blown thing has is a breath: it rises over the attack, holds while
// the key is down and falls over the release. Every display here has that
// envelope along its foot, drawn by the device's own times, and each note that
// sounds rides it. Above it stands the instrument itself as its knobs set it
// (a flute's air column, a reed's bore, a section's bells, an organ's ranks, a
// choir's mouths), lit by what the notes on the envelope make it sound.

import { denormalizeParam } from '../../../core/params'
import {
  INK,
  clamp,
  dot,
  gainToDb,
  ground,
  handle,
  hzText,
  lerp,
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
import { levelFoot, outShare, pitchName, pxOfCents, xOfPitch } from './instrument-parts'
import { secondsText } from './tails'

type Size = Pick<DisplayView, 'width' | 'height'>
type Paint = Pick<DisplayFrame, 'ctx' | 'colours'>

// --- The breath ----------------------------------------------------------------

/** `kit::Adsr` (env.h), `kAttackTarget`: the attack aims past full and stops when it is there. */
const ADSR_TARGET = 1.3
/** A release time is the time a level takes to fall this far, and under it a note is done. */
const DONE_DB = 60

/**
 * `kit::Adsr::next` with a sustain of 1, which is how every device here sets
 * it: the level of a note sent `age` seconds ago and let go `released` seconds
 * ago (null while it is held). It rises to full in `attack` seconds and falls
 * 60 dB in every `release` seconds from wherever it was at key up.
 */
export function breathLevel(
  age: number,
  released: number | null,
  attack: number,
  release: number,
): number {
  if (age <= 0) return 0
  const held = released === null || released < 0 ? age : age - released
  const full =
    held >= attack
      ? 1
      : ADSR_TARGET * (1 - Math.pow((ADSR_TARGET - 1) / ADSR_TARGET, Math.max(held, 0) / attack))
  if (released === null || released < 0) return full
  return full * Math.pow(10, (-3 * released) / Math.max(release, 1e-4))
}

/** A level as a share of the 60 dB a note is counted over: 1 at full, 0 when it is done. */
export const breathShare = (level: number): number => clamp(1 + gainToDb(level) / DONE_DB, 0, 1)

/** `x * x * (3 - 2 * x)`: how every vibrato here comes in after its delay, over `rise` seconds. */
export function vibratoOnset(seconds: number, delay: number, rise: number): number {
  const x = clamp((seconds - delay) / rise, 0, 1)
  return x * x * (3 - 2 * x)
}

/** What one instrument's breath is, for the strip along the foot of its display. */
interface Blown {
  /** Seconds the breath of a note at `hz` takes to arrive. */
  attack(view: DisplayView, hz: number): number
  /** A note's level now, as a share of the level it holds at. */
  level(view: DisplayView, note: DisplayNote): number
  /** The seconds of a held note the middle stretch of the strip stands for. */
  hold: number
  /**
   * What is heard of a breath at this level, where that is not the breath
   * itself (a reed sounds its square): the strip's attack is drawn by it, so
   * a note on its way up stands on the curve and not under it.
   */
  heard?(breath: number): number
  /**
   * What wavers in a held note (a vibrato, an unsteady wind) `seconds` after
   * it began, between −1 and 1 at the knob's most. Its place in its cycle is
   * not known, so it is drawn still: its shape, its rate and how it comes in.
   */
  waver?(view: DisplayView, seconds: number): number
  /**
   * How far a flutter too fast to draw as a wave takes a held note down, as a
   * share of the strip's height: it is drawn as teeth under the held line.
   */
  flutter?(view: DisplayView): number
}

interface WindParts {
  /** The baseline of the words. */
  words: number
  /** Where the instrument stands. */
  picture: Box
  /** The breath: the envelope and the notes on it. */
  breath: Box
  /** The level that comes out. */
  foot: Box
}

function windParts(view: Size): WindParts {
  const all: Box = { x: 4, y: 4, w: view.width - 8, h: view.height - 8 }
  const foot: Box = { x: all.x, y: all.y + all.h - 5, w: all.w, h: 5 }
  const high = Math.round(all.h * 0.24)
  const breath: Box = { x: all.x + 2, y: foot.y - 3 - high, w: all.w - 4, h: high }
  const top = all.y + 12
  return {
    words: all.y + 8,
    picture: { x: all.x + 2, y: top, w: all.w - 4, h: breath.y - 5 - top },
    breath,
    foot,
  }
}

/** The least and the most of the strip the attack and the release take, in pixels and as shares of its width. */
const ATTACK_LEAST = 5
const ATTACK_MOST = 0.28
const RELEASE_LEAST = 7
const RELEASE_MOST = 0.36

/**
 * How wide the three stretches of the strip are. The attack and the release
 * are as wide as their knobs are turned, so a slow swell is seen to be one;
 * the held stretch between them has the rest.
 */
function breathSpans(
  view: DisplayView,
  box: Box,
): { attack: number; hold: number; release: number } {
  const attack = lerp(ATTACK_LEAST, box.w * ATTACK_MOST, view.at('attack'))
  const release = lerp(RELEASE_LEAST, box.w * RELEASE_MOST, view.at('release'))
  return { attack, hold: box.w - attack - release, release }
}

/**
 * The two points of the breath that can be dragged: the corner the attack ends
 * at, and the middle of the release's slope. Every display here has them.
 */
function breathHandles(view: DisplayView): DisplayHandle[] {
  const box = windParts(view).breath
  const spans = breathSpans(view, box)
  const right = box.x + box.w
  const set = (name: string, position: number): Record<string, number> => {
    const spec = view.spec(name)
    return { [name]: spec ? denormalizeParam(spec, clamp(position, 0, 1)) : 0 }
  }
  return [
    {
      key: 'attack',
      name: 'Attack',
      x: box.x + spans.attack,
      y: box.y,
      drag: (toX) =>
        set('attack', (toX - box.x - ATTACK_LEAST) / (box.w * ATTACK_MOST - ATTACK_LEAST)),
      reset: () => ({ attack: view.spec('attack')?.default ?? 0.1 }),
    },
    {
      key: 'release',
      name: 'Release',
      x: right - spans.release / 2,
      y: box.y + box.h / 2,
      drag: (toX) =>
        set(
          'release',
          (2 * (right - toX) - RELEASE_LEAST) / (box.w * RELEASE_MOST - RELEASE_LEAST),
        ),
      reset: () => ({ release: view.spec('release')?.default ?? 0.4 }),
    },
  ]
}

const BREATH_STEPS = 12
/** Where the notes of one frame stand on the strip, to tell which share a place; written and read within one draw. */
const RIDERS = new Float32Array(32)

/**
 * The breath along the foot: the envelope in the ink, on a scale of 60 dB, and
 * on it a mark in the accent for each note that sounds, where that note is on
 * its way. A held note crosses the held stretch in the seconds it stands for
 * and waits at its end; a note let go runs down the release. Returns the index
 * of the last note that sounds, or −1.
 */
function breathStrip(frame: DisplayFrame, box: Box, blown: Blown): number {
  const { ctx, colours } = frame
  const foot = box.y + box.h
  const spans = breathSpans(frame, box)
  const holdX = box.x + spans.attack
  const fallX = holdX + spans.hold

  ctx.beginPath()
  ctx.moveTo(box.x, foot)
  for (let step = 1; step <= BREATH_STEPS; step++) {
    const u = step / BREATH_STEPS
    const level = breathLevel(u, null, 1, 1)
    const share = breathShare(blown.heard ? blown.heard(level) : level)
    ctx.lineTo(box.x + spans.attack * u, foot - share * box.h)
  }
  ctx.lineTo(fallX, box.y)
  ctx.lineTo(box.x + box.w, foot)
  ctx.globalAlpha = INK.fill
  ctx.fillStyle = colours.ink
  ctx.fill()
  ctx.globalAlpha = INK.text
  ctx.strokeStyle = colours.ink
  ctx.lineWidth = 1
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.globalAlpha = 1
  rule(ctx, box.x, foot, box.x + box.w, foot, { colour: colours.ink, alpha: INK.rule })

  // What wavers while a note is held, inside the held stretch and on a scale of its own.
  if (blown.waver) {
    const mid = box.y + box.h * 0.56
    const swing = box.h * 0.3
    let moves = false
    ctx.beginPath()
    for (let px = 0; px <= spans.hold; px += 0.5) {
      const value = blown.waver(frame, (px / spans.hold) * blown.hold)
      if (value !== 0) moves = true
      if (px === 0) ctx.moveTo(holdX + px, mid - value * swing)
      else ctx.lineTo(holdX + px, mid - value * swing)
    }
    if (moves) {
      ctx.globalAlpha = INK.text
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  }

  const dip = blown.flutter ? blown.flutter(frame) * box.h : 0
  if (dip > 0.3) {
    ctx.beginPath()
    ctx.moveTo(holdX, box.y)
    for (let x = holdX + 1.5, down = true; x < fallX; x += 1.5, down = !down)
      ctx.lineTo(x, down ? box.y + dip : box.y)
    ctx.globalAlpha = INK.text
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  for (const point of breathHandles(frame)) {
    handle(frame, point.x, point.y, { hot: frame.hot === point.key, radius: 3 })
  }

  let last = -1
  let riders = 0
  const notes = frame.notes
  for (let index = 0; index < notes.length; index++) {
    const note = notes[index]
    const share = breathShare(blown.level(frame, note))
    if (share <= 0) continue
    last = index
    let x: number
    if (note.released === null) {
      const attack = blown.attack(frame, note.frequency)
      x =
        note.age < attack
          ? box.x + (spans.attack * note.age) / attack
          : holdX + spans.hold * Math.min(1, (note.age - attack) / blown.hold)
    } else {
      // The release is a straight line on this scale, so a note is as far along it as it has fallen.
      x = fallX + spans.release * (1 - share)
    }
    const y = foot - share * box.h
    const radius = 1.4 + 1.2 * note.gain
    // The notes of a chord are at one place: each hangs under the one before it, as beads on one stem.
    let under = 0
    for (let earlier = 0; earlier < riders; earlier++) {
      if (Math.abs(RIDERS[earlier] - x) < 2) under++
    }
    if (riders < RIDERS.length) RIDERS[riders++] = x
    if (under === 0) rule(ctx, x, foot, x, y, { colour: colours.accent, alpha: 0.6 })
    dot(ctx, x, Math.min(y + under * 5, foot - radius), radius, colours.accent)
  }
  return last
}

/** A scatter that is the same on every frame: the places air is drawn at, as shares of a box. */
const SCATTER: readonly (readonly [number, number])[] = (() => {
  const halton = (index: number, base: number): number => {
    let share = 0
    let step = 1 / base
    for (let n = index; n > 0; n = Math.floor(n / base)) {
      share += (n % base) * step
      step /= base
    }
    return share
  }
  return Array.from({ length: 40 }, (_, index) => [halton(index + 1, 2), halton(index + 1, 3)])
})()

/**
 * Air: streaks scattered over a box, as many of the forty as `share` says. The
 * first `lit` of them are in the accent: the air of the notes that sound. With
 * `fan` they spread from the box's lower left corner, as air does that breaks
 * on an edge there.
 */
function air(frame: Paint, box: Box, share: number, lit: number, long = 1.5, fan = false): void {
  const { ctx, colours } = frame
  const count = Math.round(clamp(share, 0, 1) * SCATTER.length)
  const bright = Math.min(count, Math.round(clamp(lit, 0, 1) * SCATTER.length))
  for (const accent of [false, true]) {
    const from = accent ? 0 : bright
    const to = accent ? bright : count
    if (to <= from) continue
    ctx.beginPath()
    for (let index = from; index < to; index++) {
      const [u, v] = SCATTER[index]
      const x = box.x + u * box.w
      const rise = fan ? v * (0.2 + 0.8 * u) : v
      const y = box.y + box.h - rise * box.h
      ctx.moveTo(x, y)
      ctx.lineTo(x + long, y - (fan ? long * rise * (box.h / box.w) * 2 : 0))
    }
    ctx.globalAlpha = accent ? 1 : INK.back
    ctx.strokeStyle = accent ? colours.accent : colours.ink
    ctx.lineWidth = 1.2
    ctx.lineCap = 'round'
    ctx.stroke()
  }
  ctx.globalAlpha = 1
}

/** The pitch a display speaks of while no note sounds. */
const MIDDLE_C = 261.63

// --- Flute ---------------------------------------------------------------------

/** `flute.h`, `kVoicings`: what makes one member of the family, the columns a display can show. */
const FLUTE_TYPES = [
  {
    name: 'Concert',
    even: 1,
    stopped: false,
    bright: 1,
    air: 1,
    puff: 1,
    chiffSec: 0.03,
    speechQ: 14,
    vibratoHz: 5.4,
    scoopSec: 0.05,
  },
  {
    name: 'Low flute',
    even: 1,
    stopped: false,
    bright: 0.8,
    air: 2.2,
    puff: 0.9,
    chiffSec: 0.045,
    speechQ: 22,
    vibratoHz: 4.6,
    scoopSec: 0.06,
  },
  {
    name: 'Shakuhachi',
    even: 1,
    stopped: false,
    bright: 1.15,
    air: 1.9,
    puff: 2,
    chiffSec: 0.04,
    speechQ: 12,
    vibratoHz: 3.8,
    scoopSec: 0.06,
  },
  {
    name: 'Pan pipes',
    even: 0.1,
    stopped: true,
    bright: 1,
    air: 1.3,
    puff: 1.8,
    chiffSec: 0.025,
    speechQ: 9,
    vibratoHz: 5.8,
    scoopSec: 0.035,
  },
  {
    name: 'Wood flute',
    even: 1,
    stopped: false,
    bright: 0.7,
    air: 0.55,
    puff: 0.5,
    chiffSec: 0.02,
    speechQ: 16,
    vibratoHz: 5,
    scoopSec: 0.045,
  },
] as const
type FluteType = (typeof FLUTE_TYPES)[number]
const fluteType = (value: number): FluteType =>
  FLUTE_TYPES[clamp(Math.round(value), 0, FLUTE_TYPES.length - 1)]

/** `flute.h`: the softest touch as a share of full breath, and the pressure of the touch the pitch is true at. */
const FLUTE_SOFTEST = 0.3
const FLUTE_REFERENCE = 0.825
/** `flute.h`, `kVibratoDelay` and `kVibratoFade`: the vibrato waits for the note to settle, then fades in. */
const FLUTE_VIBRATO_DELAY = 0.15
const FLUTE_VIBRATO_FADE = 0.55

/** `Flute::start`: the breath pressure of a touch. */
export const flutePressure = (gain: number): number => FLUTE_SOFTEST + (1 - FLUTE_SOFTEST) * gain

/** `Flute::start`, `speech_coeff`: the seconds the tone lags the breath by, Q / (π·f). */
export function fluteSpeechSeconds(type: number, hz: number): number {
  return fluteType(type).speechQ / (Math.PI * Math.max(hz, 1))
}

/**
 * `Flute::control`: the ratio between neighbouring harmonics of a note at `hz`
 * blown at `pressure`. Blow sets it from `kBlowFloor` over `kBlowRange`, it
 * halves with every octave above C5 and fills out a little below, and no note
 * gets more than `kMostBrightness`.
 */
export function fluteBrightness(type: number, blow: number, hz: number, pressure: number): number {
  const register = hz > 523.25 ? 523.25 / hz : Math.min(1.5, Math.pow(523.25 / hz, 0.25))
  return Math.min(0.62, (0.08 + 0.47 * blow) * register * fluteType(type).bright * pressure)
}

/** `Flute::control`: the breath noise of a pipe at `pressure`, `kBreathLevel` at Breath 1 for the Concert flute. */
export function fluteAir(type: number, breath: number, pressure: number): number {
  return fluteType(type).air * 1.9 * breath * breath * Math.pow(Math.max(pressure, 0), 1.75)
}

/** `Flute::control`: the cents a note `seconds` old still lies under its pitch. */
export function fluteScoopCents(type: number, scoop: number, seconds: number): number {
  return -scoop * Math.exp(-Math.max(seconds, 0) / fluteType(type).scoopSec)
}

/** `Flute::control`: what is left of the chiff `seconds` into a note. */
export function fluteChiff(type: number, chiff: number, seconds: number): number {
  return chiff * Math.exp(-Math.max(seconds, 0) / fluteType(type).chiffSec)
}

/**
 * What a one pole filter of rate `b` that starts empty has of e^(−a·t) after
 * `t` seconds: b·(e^(−a·t) − e^(−b·t)) / (b − a).
 */
function followed(a: number, b: number, t: number): number {
  // Two rates the same have a limit of their own.
  if (Math.abs(b - a) < 1e-6 * b) return b * t * Math.exp(-b * t)
  return (b * (Math.exp(-a * t) - Math.exp(-b * t))) / (b - a)
}

/**
 * `Flute::control`, `voice.speech`: the tone of a note as a share of the level
 * it holds at. The tone follows the breath through one pole whose time is
 * `fluteSpeechSeconds`, so it is that filter's answer to each stretch of the
 * envelope in turn: the attack's curve, the held level, the release's fall.
 * A quick release on a low note is therefore not quick: the tone dies by its
 * own lag, 60 dB in seven of them, and not by the knob.
 */
export function fluteTone(
  type: number,
  note: Pick<DisplayNote, 'frequency' | 'age' | 'released'>,
  attack: number,
  release: number,
): number {
  if (note.age <= 0) return 0
  const rate = 1 / fluteSpeechSeconds(type, note.frequency)
  const after = note.released === null ? 0 : clamp(note.released, 0, note.age)
  const held = note.age - after
  // Up the attack the breath is 1.3·(1 − e^(−k·t)), which reaches 1 at the attack time.
  const k = Math.log(ADSR_TARGET / (ADSR_TARGET - 1)) / attack
  const up = Math.min(held, attack)
  let tone = ADSR_TARGET * (followed(0, rate, up) - followed(k, rate, up))
  if (held > attack) tone = 1 + (tone - 1) * Math.exp(-rate * (held - attack))
  if (note.released === null) return tone
  const fall = Math.log(1000) / Math.max(release, 1e-4)
  return (
    tone * Math.exp(-rate * after) +
    breathLevel(held, null, attack, release) * followed(fall, rate, after)
  )
}

/** The pitches an air column's length is told by: the longest, and where it would have no length left. */
const FLUTE_LOW_HZ = 65.41
const FLUTE_HIGH_HZ = 5588
/** How many modes of the column are drawn. */
const FLUTE_MODES = 6
/** Where in its swing the column at rest is drawn: a place where every mode shows. */
const FLUTE_REST_PHASE = 0.19

interface FluteParts {
  /** The inside of the tube, from the edge the air breaks on to its foot. */
  tube: Box
  /** Where the air that is only heard as air goes: over the edge, along the tube. */
  air: Box
}

function fluteParts(picture: Box): FluteParts {
  const high = Math.min(22, picture.h * 0.5)
  const head = 14
  const tube: Box = {
    x: picture.x + head,
    y: picture.y + picture.h - high - 2,
    w: picture.w - head - 2,
    h: high,
  }
  return {
    tube,
    air: { x: tube.x + 6, y: picture.y, w: Math.min(84, tube.w * 0.6), h: tube.y - picture.y - 3 },
  }
}

/** Where the air column of a note at `hz` ends: an octave lower is an even step longer. */
const fluteEnd = (hz: number, tube: Box): number =>
  tube.x + tube.w - (xOfPitch(hz, tube, FLUTE_LOW_HZ, FLUTE_HIGH_HZ) - tube.x)

/**
 * The air column from the edge at `from` to `to` as the pressure in it stands
 * at one moment: the modes of the pipe, mode h as strong as the harmonic it
 * sounds (`pipe_tone` in driven_pipe.h: brightness^(h-1), the even ones by the
 * type's share), each `phase` turns into its own swing. An open end has no
 * pressure and a stopped one the most, so pan pipes stand on their far end.
 */
function fluteColumn(
  ctx: CanvasRenderingContext2D,
  from: number,
  to: number,
  y: number,
  size: number,
  type: FluteType,
  brightness: number,
  phase: number,
): void {
  const steps = Math.max(12, Math.round((to - from) / 2))
  let power = 0
  for (let h = 1, level = 1; h <= FLUTE_MODES; h++, level *= brightness) {
    const mode = level * (h % 2 === 0 ? type.even : 1)
    power += mode * mode
  }
  const scale = size / Math.sqrt(power)
  const limit = Math.abs(size)
  ctx.moveTo(from, y)
  for (let step = 1; step <= steps; step++) {
    const u = step / steps
    let sum = 0
    for (let h = 1, level = 1; h <= FLUTE_MODES; h++, level *= brightness) {
      const mode = level * (h % 2 === 0 ? type.even : 1)
      sum +=
        mode *
        Math.sin(h * Math.PI * u * (type.stopped ? 0.5 : 1)) *
        Math.sin(2 * Math.PI * h * phase)
    }
    ctx.lineTo(from + (to - from) * u, y - clamp(sum * scale, -limit, limit))
  }
}

const fluteBlown: Blown = {
  attack: (view) => view.value('attack'),
  level: (view, note) =>
    Math.max(
      breathLevel(note.age, note.released, view.value('attack'), view.value('release')),
      fluteTone(view.value('type'), note, view.value('attack'), view.value('release')),
    ),
  hold: 2,
  // `Flute::control`: the vibrato is in the breath itself, at the type's own speed.
  waver: (view, seconds) =>
    view.value('vibrato') *
    vibratoOnset(seconds, FLUTE_VIBRATO_DELAY, FLUTE_VIBRATO_FADE) *
    Math.sin(2 * Math.PI * fluteType(view.value('type')).vibratoHz * seconds),
}

const flute = plateDisplay({
  place: 'window',
  columns: 2,
  params: ['type', 'breath', 'blow', 'chiff', 'attack', 'release', 'vibrato', 'scoop'],
  live: { signal: true, notes: true },
  info: 'The flute from the side: air breaks on the edge at the left, and the tube holds the air column of each note, longer for a lower one, shaped by Blow. Below, the breath with each note on it: drag its corner to set Attack and its slope to set Release.',
  handles: breathHandles,
  draw(frame) {
    const { ctx, colours } = frame
    ground(frame)
    const parts = windParts(frame)
    const { tube, air: over } = fluteParts(parts.picture)
    const typeValue = frame.value('type')
    const type = fluteType(typeValue)
    const blow = frame.value('blow')
    const breath = frame.value('breath')
    const chiff = frame.value('chiff')
    const scoop = frame.value('scoop')
    const attack = frame.value('attack')
    const release = frame.value('release')
    const mid = tube.y + tube.h / 2
    const size = tube.h / 2 - 2
    const foot = tube.x + tube.w

    // The tube: its head stopped behind the mouth hole, the hole in its upper wall, its foot open.
    const head = tube.x - 10
    const hole = tube.x - 5
    ctx.beginPath()
    ctx.moveTo(hole, tube.y)
    ctx.lineTo(head, tube.y)
    ctx.lineTo(head, tube.y + tube.h)
    ctx.lineTo(foot, tube.y + tube.h)
    ctx.moveTo(tube.x, tube.y)
    ctx.lineTo(foot, tube.y)
    ctx.globalAlpha = INK.text
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.lineJoin = 'miter'
    ctx.stroke()
    // The edge the air breaks on, and the air's way to it from the lips.
    ctx.beginPath()
    ctx.moveTo(tube.x, tube.y)
    ctx.lineTo(tube.x + 3, tube.y - 3)
    ctx.lineTo(tube.x + 3, tube.y)
    ctx.closePath()
    ctx.globalAlpha = 1
    ctx.fillStyle = colours.ink
    ctx.fill()
    for (const rise of [5, 9]) {
      rule(ctx, head - 4, tube.y - rise - 3, tube.x - 1, tube.y - 1 - (rise - 5) * 0.5, {
        colour: colours.ink,
        alpha: INK.back,
        width: 1,
      })
    }
    // A C in every octave along the tube, as the holes a finger would close; middle C stronger.
    for (let hz = 65.41; hz < 4200; hz *= 2) {
      ctx.beginPath()
      ctx.arc(fluteEnd(hz, tube), tube.y + tube.h + 0.5, 1.4, 0, Math.PI)
      ctx.globalAlpha = Math.abs(hz - MIDDLE_C) < 1 ? 1 : INK.back
      ctx.fillStyle = colours.ink
      ctx.fill()
    }
    ctx.globalAlpha = 1

    // The column of middle C at rest: where it ends (a stopper on pan pipes), and its shape as Blow sets it.
    const rest = fluteEnd(MIDDLE_C, tube)
    rule(ctx, rest, tube.y + 1, rest, tube.y + tube.h - 1, {
      colour: colours.ink,
      alpha: INK.text,
      width: type.stopped ? 3 : 1,
    })
    // Scoop: where a note starts from, flat and so longer, before it bends up into tune.
    const flat = rest + pxOfCents(scoop, tube, FLUTE_LOW_HZ, FLUTE_HIGH_HZ)
    rule(ctx, flat, tube.y + 2, flat, tube.y + tube.h - 2, {
      colour: colours.ink,
      alpha: INK.back,
      dash: [2, 2],
    })
    const still = fluteBrightness(typeValue, blow, MIDDLE_C, FLUTE_REFERENCE)
    ctx.beginPath()
    fluteColumn(ctx, tube.x, rest, mid, size, type, still, FLUTE_REST_PHASE)
    fluteColumn(ctx, tube.x, rest, mid, -size, type, still, FLUTE_REST_PHASE)
    ctx.globalAlpha = INK.back
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.lineJoin = 'round'
    ctx.stroke()
    ctx.globalAlpha = 1

    // The columns that sound: each as long as its pitch, as strong as its tone, shaped by its breath.
    let airNow = 0
    let chiffNow = 0
    for (const note of frame.notes) {
      const pressure = flutePressure(note.gain)
      const blown = pressure * breathLevel(note.age, note.released, attack, release)
      airNow += Math.pow(blown, 1.75)
      chiffNow = Math.max(chiffNow, fluteChiff(typeValue, chiff, note.age) * blown)
      const tone = fluteTone(typeValue, note, attack, release)
      const lit = breathShare(tone)
      if (lit <= 0) continue
      const end =
        fluteEnd(note.frequency, tube) -
        pxOfCents(fluteScoopCents(typeValue, scoop, note.age), tube, FLUTE_LOW_HZ, FLUTE_HIGH_HZ)
      const brightness = fluteBrightness(typeValue, blow, note.frequency, pressure * tone)
      // It swings at a pace the eye can follow, each note at its own so a chord does not move as one.
      const phase = frame.now * (0.9 + ((note.frequency * 0.37) % 0.6)) + note.frequency * 0.01
      ctx.beginPath()
      fluteColumn(ctx, tube.x, end, mid, size * (0.25 + 0.75 * lit), type, brightness, phase)
      ctx.globalAlpha = 0.3 + 0.7 * lit
      ctx.strokeStyle = colours.accent
      ctx.lineWidth = 1.75
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      ctx.stroke()
      ctx.globalAlpha = 1
      rule(ctx, end, tube.y + 1, end, tube.y + tube.h - 1, {
        colour: colours.accent,
        alpha: 0.3 + 0.7 * lit,
        width: type.stopped ? 3 : 1.5,
      })
    }

    // Breath: the air that is heard as air, past the edge. Its level goes with the square of the
    // knob; the root of it is drawn, so a little air shows as a little.
    const most = Math.sqrt(fluteAir(typeValue, breath, 1) / fluteAir(1, 1, 1))
    air(frame, over, most, most * Math.min(1, airNow), 4, true)
    // Chiff: the puff at the edge when a note starts, as large as the type makes it.
    const puff = (chiff * type.puff) / 2
    if (puff > 0) {
      for (const lit of [false, true]) {
        if (lit && chiffNow <= 0.01) continue
        ctx.beginPath()
        for (let ray = 0; ray < 5; ray++) {
          const angle = -Math.PI * (0.12 + 0.19 * ray)
          const reach = 3 + 9 * puff
          ctx.moveTo(tube.x + 3 + 3 * Math.cos(angle), tube.y - 3 + 3 * Math.sin(angle))
          ctx.lineTo(tube.x + 3 + reach * Math.cos(angle), tube.y - 3 + reach * Math.sin(angle))
        }
        ctx.globalAlpha = lit ? Math.min(1, chiffNow / Math.max(chiff, 0.01) + 0.2) : INK.back
        ctx.strokeStyle = lit ? colours.accent : colours.ink
        ctx.lineWidth = lit ? 1.5 : 1
        ctx.lineCap = 'round'
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    }

    const last = breathStrip(frame, parts.breath, fluteBlown)
    levelFoot(frame, parts.foot, outShare(frame))

    // The words: which flute, and how long the last note played took to speak (middle C while none is).
    const hz = last < 0 ? MIDDLE_C : frame.notes[last].frequency
    text(frame, type.name, parts.picture.x - 1, parts.words)
    text(
      frame,
      `${pitchName(hz)} ${secondsText(attack + fluteSpeechSeconds(typeValue, hz))}`,
      parts.picture.x + parts.picture.w + 1,
      parts.words,
      { align: 'right' },
    )
  },
})

// --- Clarinet ------------------------------------------------------------------

/** `clarinet.h`: the softest touch as a share of full breath, and the tone level of the reference touch. */
const CLARINET_SOFTEST = 0.3
const CLARINET_REFERENCE = 0.7396
/** `clarinet.h`, `kSpeechQ`: a resonance of this quality takes eight periods to build. */
const CLARINET_SPEECH_Q = 25
/** `clarinet.h`, `kToneHoleHz`: above this a cylinder's even harmonics come back. */
const CLARINET_TONE_HOLE_HZ = 1500
/** `clarinet.h`: the vibrato's rate, when it starts and how long it takes to arrive. */
const CLARINET_VIBRATO_HZ = 5
const CLARINET_VIBRATO_DELAY = 0.25
const CLARINET_VIBRATO_RISE = 0.6
/** `clarinet.h`, `kGrowlDepth`: how far a full Growl takes the breath down, 28 times a second. */
const CLARINET_GROWL_DEPTH = 0.5

/** `Clarinet::set_times`: the seconds a note at `hz` takes to speak, Attack and eight of its own periods. */
export function clarinetAttack(attack: number, hz: number): number {
  return attack + CLARINET_SPEECH_Q / (Math.PI * Math.max(hz, 1))
}

/**
 * `Clarinet::process`: the tone of a note as a share of the level it holds at.
 * The tone is the square of the breath, and the breath's envelope is given
 * twice Release, so the tone falls 60 dB in Release.
 */
export function clarinetTone(
  note: Pick<DisplayNote, 'frequency' | 'age' | 'released'>,
  attack: number,
  release: number,
): number {
  const breath = breathLevel(
    note.age,
    note.released,
    clarinetAttack(attack, note.frequency),
    2 * release,
  )
  return breath * breath
}

/**
 * `Clarinet::start`, `voice.limit`: the brightest a note at `hz` may be,
 * `brightness_limit` in driven_pipe.h. The first harmonic above half the
 * sample rate, counted for a note bent 3 % sharp, is kept 60 dB down, and no
 * note passes `kMaxBrightness`. It bites from about C6 up.
 */
export function clarinetLimit(hz: number, sampleRate: number): number {
  const below = Math.floor((0.5 * sampleRate) / Math.max(hz * 1.03, 1))
  return below < 1 ? 0 : Math.min(Math.exp(-6.907755 / below), 0.88)
}

/**
 * `Clarinet::set_tone` and `process`: the ratio between neighbouring harmonics
 * of a tone at `level`, never past `limit` (`clarinetLimit` for a note).
 */
export function clarinetBrightness(blow: number, level: number, limit = 0.88): number {
  return Math.min((lerp(0.08, 0.82, blow) / CLARINET_REFERENCE) * level, limit)
}

/**
 * `Clarinet::process`: how much of an even harmonic at `hz` sounds. A cone has
 * all of it; a cylinder only what two high-passes at the tone-hole cutoff let
 * back in, and that comes back turned in phase (about a quarter turn at the
 * cutoff), so between the two the shares do not simply add. The high-pass is
 * the kit's `OnePole`, a signal less its own low-pass, worked out as it runs
 * at the sample rate: it lets a little less through than its name says.
 */
export function clarinetEven(bore: number, hz: number, sampleRate = 48000): number {
  // One high-pass is a·(1 − z⁻¹) / (1 − a·z⁻¹); `real` and `turned` are the two parts of it.
  const a = Math.exp((-2 * Math.PI * CLARINET_TONE_HOLE_HZ) / sampleRate)
  const w = (2 * Math.PI * hz) / sampleRate
  const c = Math.cos(w)
  const s = Math.sin(w)
  const down = 1 - 2 * a * c + a * a
  const real = (a * ((1 - c) * (1 - a * c) + a * s * s)) / down
  const turned = (a * s * (1 - a)) / down
  // Two of them in a row is its square.
  const back = 1 - bore
  return Math.hypot(bore + back * (real * real - turned * turned), back * 2 * real * turned)
}

/** How many harmonics stand before the bell, and how far under full one may be and still show. */
const CLARINET_BARS = 12
const CLARINET_BAR_DB = 48

interface ClarinetParts {
  /** The pipe, from the tip of the mouthpiece to the rim of the bell. */
  pipe: Box
  /** Where the harmonics stand, past the bell. */
  bars: Box
}

function clarinetParts(picture: Box): ClarinetParts {
  const long = Math.min(84, picture.w * 0.42)
  return {
    pipe: { x: picture.x, y: picture.y, w: long, h: picture.h },
    bars: { x: picture.x + long + 6, y: picture.y, w: picture.w - long - 6, h: picture.h },
  }
}

const clarinetBlown: Blown = {
  attack: (view, hz) => clarinetAttack(view.value('attack'), hz),
  level: (view, note) => clarinetTone(note, view.value('attack'), view.value('release')),
  hold: 2,
  heard: (breath) => breath * breath,
  // `Clarinet::control`: a vibrato of pitch, a moment after the note starts.
  waver: (view, seconds) =>
    view.value('vibrato') *
    vibratoOnset(seconds, CLARINET_VIBRATO_DELAY, CLARINET_VIBRATO_RISE) *
    Math.sin(2 * Math.PI * CLARINET_VIBRATO_HZ * seconds),
  // `Clarinet::process`: the growl takes the breath down so far, and the tone is its square.
  flutter: (view) => {
    const breath = 1 - CLARINET_GROWL_DEPTH * view.value('growl')
    return 1 - breathShare(breath * breath)
  },
}

interface ClarinetState {
  /** The power of each harmonic over the notes that sound, on this frame. */
  power: Float32Array
}

const clarinet = plateDisplay<ClarinetState>({
  place: 'window',
  columns: 2,
  params: ['bore', 'blow', 'breath', 'attack', 'release', 'vibrato', 'growl'],
  live: { signal: true, notes: true },
  info: 'The pipe from reed to bell, straight for a clarinet and a cone as Bore opens it, and before the bell its overtones: every other one missing from a cylinder, more of them the harder it is blown. Below, the breath with each note on it: drag its corner for Attack, its slope for Release.',
  init: () => ({ power: new Float32Array(CLARINET_BARS) }),
  handles: breathHandles,
  draw(frame) {
    const { ctx, colours, state } = frame
    ground(frame)
    const parts = windParts(frame)
    const { pipe, bars } = clarinetParts(parts.picture)
    const bore = clamp(frame.value('bore'), 0, 1)
    const blow = frame.value('blow')
    const breath = frame.value('breath')
    const attack = frame.value('attack')
    const release = frame.value('release')
    const axis = pipe.y + pipe.h / 2

    // The pipe: the mouthpiece with its reed underneath, the bore as wide at its end as Bore opens it, the bell.
    const narrow = 4.5
    const wide = lerp(narrow, Math.min(15, pipe.h / 2 - 6), bore)
    const neck = pipe.x + 15
    const flare = pipe.x + pipe.w - 9
    const rim = pipe.x + pipe.w
    ctx.beginPath()
    ctx.moveTo(pipe.x, axis + narrow - 1)
    ctx.lineTo(neck, axis - narrow)
    ctx.lineTo(flare, axis - wide)
    ctx.quadraticCurveTo(rim - 3, axis - wide - 1, rim, axis - wide - 5)
    ctx.moveTo(pipe.x, axis + narrow - 1)
    ctx.lineTo(pipe.x + 3, axis + narrow)
    ctx.lineTo(neck, axis + narrow)
    ctx.lineTo(flare, axis + wide)
    ctx.quadraticCurveTo(rim - 3, axis + wide + 1, rim, axis + wide + 5)
    ctx.globalAlpha = INK.text
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.lineJoin = 'round'
    ctx.stroke()
    ctx.globalAlpha = 1
    rule(ctx, pipe.x - 1, axis + narrow + 3, neck - 2, axis + narrow + 1.5, {
      colour: colours.ink,
      width: 1.5,
    })
    // Its holes along the top.
    for (let hole = 1; hole <= 5; hole++) {
      const u = hole / 6
      dot(ctx, lerp(neck, flare, u), axis - lerp(narrow, wide, u), 1.3, colours.ink, {
        alpha: INK.text,
      })
    }

    // What sounds, harmonic by harmonic: each note's tone, and with it the breath for the air.
    state.power.fill(0)
    let blown = 0
    for (const note of frame.notes) {
      const tone = clarinetTone(note, attack, release)
      const pressure = CLARINET_SOFTEST + (1 - CLARINET_SOFTEST) * note.gain
      const level = pressure * pressure * tone
      // The air follows the breath, the root of the tone, so it is still there when the tone is done.
      blown += Math.sqrt(level)
      if (breathShare(tone) <= 0) continue
      const ratio = clarinetBrightness(blow, level, clarinetLimit(note.frequency, frame.sampleRate))
      for (let h = 1, part = level; h <= CLARINET_BARS; h++, part *= ratio) {
        const sounds =
          h % 2 === 0 ? part * clarinetEven(bore, h * note.frequency, frame.sampleRate) : part
        state.power[h - 1] += sounds * sounds
      }
    }

    // Breath: air in the pipe, as much as the knob lets through.
    air(
      frame,
      { x: neck, y: axis - narrow + 1.5, w: flare - neck, h: 2 * narrow - 3 },
      breath,
      breath * Math.min(1, blown),
    )

    // The harmonics of middle C at the reference touch, as Blow and Bore set them, on a scale of 48 dB.
    const pitch = bars.w / CLARINET_BARS
    const thick = Math.max(2, Math.floor(pitch * 0.55))
    const most = bars.h / 2 - 1
    const ratio = clarinetBrightness(blow, CLARINET_REFERENCE)
    rule(ctx, bars.x, axis, bars.x + bars.w, axis, { colour: colours.ink, alpha: INK.grid })
    for (let h = 1, part = 1; h <= CLARINET_BARS; h++, part *= ratio) {
      const x = Math.round(bars.x + (h - 1) * pitch)
      const level = h % 2 === 0 ? part * clarinetEven(bore, h * MIDDLE_C, frame.sampleRate) : part
      const half = Math.round(clamp(1 + gainToDb(level) / CLARINET_BAR_DB, 0, 1) * most)
      if (half > 0) {
        ctx.globalAlpha = INK.rule
        ctx.fillStyle = colours.ink
        ctx.fillRect(x, axis - half, thick, half * 2)
      }
      const lit = clamp(1 + gainToDb(Math.sqrt(state.power[h - 1])) / CLARINET_BAR_DB, 0, 1) * most
      if (lit > 0.5) {
        ctx.globalAlpha = 1
        ctx.fillStyle = colours.accent
        ctx.fillRect(x, axis - lit, thick, lit * 2)
      }
    }
    ctx.globalAlpha = 1

    const last = breathStrip(frame, parts.breath, clarinetBlown)
    levelFoot(frame, parts.foot, outShare(frame))

    // The words: the bore, and how long the last note played took to speak (middle C while none is).
    const hz = last < 0 ? MIDDLE_C : frame.notes[last].frequency
    text(
      frame,
      bore < 0.2 ? 'Cylinder' : bore > 0.8 ? 'Cone' : `${Math.round(bore * 100)}% cone`,
      parts.picture.x - 1,
      parts.words,
    )
    text(
      frame,
      `${pitchName(hz)} ${secondsText(clarinetAttack(attack, hz))}`,
      parts.picture.x + parts.picture.w + 1,
      parts.words,
      { align: 'right' },
    )
  },
})

// --- Horns ---------------------------------------------------------------------

/**
 * `bell.h`, `voicing`: the formant of each bell, whether a mute is in it, the
 * series' ratio with no pressure and at full blow, and how many periods a note
 * takes to speak.
 */
const HORN_TYPES = [
  { name: 'French horn', formantHz: 340, mute: false, soft: 0.03, hard: 0.9, periods: 8 },
  { name: 'Flugelhorn', formantHz: 800, mute: false, soft: 0.06, hard: 0.86, periods: 6 },
  { name: 'Trumpet', formantHz: 1300, mute: false, soft: 0.06, hard: 0.88, periods: 5 },
  { name: 'Muted trumpet', formantHz: 1800, mute: true, soft: 0.6, hard: 0.88, periods: 5 },
  { name: 'Low brass', formantHz: 480, mute: false, soft: 0.06, hard: 0.88, periods: 8 },
] as const
type HornType = (typeof HORN_TYPES)[number]
const hornType = (value: number): HornType =>
  HORN_TYPES[clamp(Math.round(value), 0, HORN_TYPES.length - 1)]

/** `horns.h`, `kPosition`: where the four players of a note stand at Section 1, left to right as −1 to 1. */
const HORN_POSITIONS = [-0.25, 0.25, 0.65, -0.65] as const
/** `horns.h`: player two starts to play at Section 0, three and four a third later each, each over a span of a third. */
const HORN_PLAYER_EVERY = 0.33
const HORN_PLAYER_SPAN = 0.34
/** `horns.h`: the vibrato's rate, when the first player starts it and how long it takes to arrive. */
const HORN_VIBRATO_HZ = 5.3
const HORN_VIBRATO_DELAY = 0.25
const HORN_VIBRATO_RISE = 0.65
/** The touch the bells at rest are drawn for. */
const HORN_REFERENCE_GAIN = 0.8

/** `Horns::attack_for`: the seconds a note at `hz` takes to arrive, Attack and the time the tube takes to speak. */
export function hornAttack(type: number, attack: number, hz: number): number {
  return attack + clamp(hornType(type).periods / Math.max(hz, 1), 0.005, 0.15)
}

/** `Horns::control`: how much of player `k` (0 to 3) is in the section, before the section is levelled. */
export function hornPlayer(k: number, section: number): number {
  return k === 0 ? 1 : clamp((section - (k - 1) * HORN_PLAYER_EVERY) / HORN_PLAYER_SPAN, 0, 1)
}

/**
 * `Horns::breathe` and `process`: the ratio between neighbouring harmonics of
 * a note played as hard as `gain` whose envelope stands at `envelope`. It
 * follows the pressure, so a note is brighter the louder it is. The device
 * lets it lag a rising pressure by some tens of milliseconds, under two frames
 * of a display. No note passes `cap` (`hornCap` for a note).
 */
export function hornBrightness(
  type: number,
  blow: number,
  gain: number,
  envelope: number,
  cap = 0.92,
): number {
  const t = hornType(type)
  const push = (0.2 + 0.8 * blow) * (0.15 + 0.85 * gain)
  return Math.min(t.soft + (t.hard - t.soft) * push * envelope, cap)
}

/**
 * `Horns::start`, `voice.cap`: the brightest a note at `hz` may be,
 * `brightness_cap` in driven_pipe.h at `kCapDb`. Its series is kept 50 dB down
 * where it crosses half the sample rate, and no note passes `kMaxBrightness`.
 * It bites from about C5 up, on a bright instrument blown hard.
 */
export function hornCap(hz: number, sampleRate: number): number {
  return Math.min(Math.exp((-0.11512925 * 50 * Math.max(hz, 1)) / (0.5 * sampleRate)), 0.92)
}

/** `Horns::process`: the level of the harmony voice against the note, which gives way to it. */
export function hornHarmony(harmony: number): number {
  return Math.abs(harmony) / Math.sqrt(1 + harmony * harmony)
}

const hornBlown: Blown = {
  attack: (view, hz) => hornAttack(view.value('type'), view.value('attack'), hz),
  level: (view, note) =>
    breathLevel(
      note.age,
      note.released,
      hornAttack(view.value('type'), view.value('attack'), note.frequency),
      view.value('release'),
    ),
  hold: 2,
  // `Horns::vibrato`: a waver of pitch that waits a moment and eases in.
  waver: (view, seconds) =>
    view.value('vibrato') *
    vibratoOnset(seconds, HORN_VIBRATO_DELAY, HORN_VIBRATO_RISE) *
    Math.sin(2 * Math.PI * HORN_VIBRATO_HZ * seconds),
}

/** A bell's radius as a share of the largest: the lower its formant, the larger the bell. */
const hornSize = (type: HornType): number =>
  lerp(1, 0.62, Math.log(type.formantHz / 340) / Math.log(1800 / 340))
/** A bell's throat as a share of its rim. */
const HORN_THROAT = 0.26

const horns = plateDisplay({
  place: 'window',
  columns: 2,
  params: ['type', 'blow', 'breath', 'section', 'attack', 'release', 'vibrato', 'harmony'],
  live: { signal: true, notes: true },
  info: 'The bells of the section from the front, as many and as far apart as Section sets them. Each fills from its throat as far as the tone is bright; the small bell beside it is the Harmony voice. Below, the breath with each note on it: drag its corner for Attack, its slope for Release.',
  handles: breathHandles,
  draw(frame) {
    const { ctx, colours } = frame
    ground(frame)
    const parts = windParts(frame)
    const picture = parts.picture
    const typeValue = frame.value('type')
    const type = hornType(typeValue)
    const blow = frame.value('blow')
    const breath = frame.value('breath')
    const section = clamp(frame.value('section'), 0, 1)
    const harmony = frame.value('harmony')
    const attack = frame.value('attack')
    const release = frame.value('release')

    // What the notes make the bells sound: the loudest of them, and the brightest.
    let lit = 0
    let bright = 0
    let rush = 0
    for (const note of frame.notes) {
      const envelope = breathLevel(
        note.age,
        note.released,
        hornAttack(typeValue, attack, note.frequency),
        release,
      )
      const share = breathShare(envelope)
      if (share <= 0) continue
      lit = Math.max(lit, share)
      const cap = hornCap(note.frequency, frame.sampleRate)
      bright = Math.max(bright, hornBrightness(typeValue, blow, note.gain, envelope, cap))
      rush += envelope * envelope
    }

    const most = Math.min(21, picture.h / 2 - 2)
    const radius = most * hornSize(type)
    const throat = radius * HORN_THROAT
    const cy = picture.y + picture.h / 2
    const cx = picture.x + picture.w / 2
    const reach = (picture.w / 2 - radius - 1) / 0.65
    const held = hornBrightness(typeValue, blow, HORN_REFERENCE_GAIN, 1)
    const second = hornHarmony(harmony) / Math.SQRT1_2
    // A fifth above stands up and to the right of its player, a fourth below down and to the left.
    const side = harmony > 0 ? 1 : -1
    const off = (radius + 1) * Math.SQRT1_2
    const small = radius * 0.42

    // From the outside in, so the players in the middle stand in front.
    for (const k of [3, 2, 1, 0]) {
      const weight = hornPlayer(k, section)
      if (weight <= 0) continue
      const x = cx + HORN_POSITIONS[k] * section * reach
      // The harmony voice's bell.
      if (second > 0) {
        ctx.beginPath()
        ctx.arc(x + side * off, cy - side * off, small, 0, Math.PI * 2)
        ctx.globalAlpha = INK.hush
        ctx.fillStyle = colours.plate
        ctx.fill()
        if (lit > 0) {
          ctx.globalAlpha = lit * weight * second
          ctx.fillStyle = colours.accent
          ctx.fill()
        }
        ctx.globalAlpha = weight * lerp(0.25, 1, second)
        ctx.strokeStyle = colours.ink
        ctx.lineWidth = 1
        ctx.stroke()
      }
      // The bell: its rim, the shade out to where a held note's brightness reaches, its throat.
      ctx.beginPath()
      ctx.arc(x, cy, radius, 0, Math.PI * 2)
      ctx.globalAlpha = INK.hush
      ctx.fillStyle = colours.plate
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x, cy, lerp(throat, radius, held), 0, Math.PI * 2)
      ctx.globalAlpha = INK.fill * weight
      ctx.fillStyle = colours.ink
      ctx.fill()
      if (lit > 0) {
        ctx.beginPath()
        ctx.arc(x, cy, lerp(throat, radius, bright), 0, Math.PI * 2)
        ctx.globalAlpha = lit * weight
        ctx.fillStyle = colours.accent
        ctx.fill()
      }
      ctx.beginPath()
      ctx.arc(x, cy, radius, 0, Math.PI * 2)
      ctx.globalAlpha = weight
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1.5
      ctx.stroke()
      // The throat is open; a mute fills it and more.
      ctx.beginPath()
      ctx.arc(x, cy, type.mute ? radius * 0.5 : throat, 0, Math.PI * 2)
      ctx.globalAlpha = type.mute ? weight : INK.hush
      ctx.fillStyle = type.mute ? colours.ink : colours.plate
      ctx.fill()
      ctx.globalAlpha = weight
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.globalAlpha = 1
      // Breath: air in the tube of the first player, whose lips it rushes with.
      if (k === 0) {
        const inside = radius * 0.62
        air(
          frame,
          { x: x - inside, y: cy - inside, w: 2 * inside, h: 2 * inside },
          breath * 0.6,
          breath * 0.6 * Math.min(1, rush),
        )
      }
    }

    const last = breathStrip(frame, parts.breath, hornBlown)
    levelFoot(frame, parts.foot, outShare(frame))

    // The words: which brass, and how long the last note played took to arrive (middle C while none is).
    const hz = last < 0 ? MIDDLE_C : frame.notes[last].frequency
    text(frame, type.name, picture.x - 1, parts.words)
    text(
      frame,
      `${pitchName(hz)} ${secondsText(hornAttack(typeValue, attack, hz))}`,
      picture.x + picture.w + 1,
      parts.words,
      { align: 'right' },
    )
  },
})

// --- Reed Organ ----------------------------------------------------------------

/**
 * `organ.h`: the ranks a key sounds, by the knob that draws each (the 8' is
 * always drawn) and its length in feet. The celeste is an 8' of its own, tuned
 * a little sharp, and stands last.
 */
const ORGAN_RANKS = [
  { stop: 'sub', feet: 16 },
  { stop: null, feet: 8 },
  { stop: 'octave', feet: 4 },
  { stop: 'twelfth', feet: 8 / 3 },
  { stop: 'fifteenth', feet: 2 },
  { stop: 'celeste', feet: 8 },
] as const
/** `organ.h`: the ratio between neighbouring harmonics of a rank at Reed 1. */
const ORGAN_REED_MOST = 0.75
/** `organ.h`: the rates of the bellows and the tremulant, and how far each moves the wind at its knob's most. */
const ORGAN_BELLOWS_HZ = 0.31
const ORGAN_BELLOWS_DEPTH = 0.22
const ORGAN_TREMULANT_HZ = 5.5
const ORGAN_TREMULANT_DEPTH = 0.3
/** `organ.h`, `kPumpSecondRatio`: the pump's second sine, which keeps it from repeating. */
const ORGAN_PUMP_SECOND = 0.618034
/** `Organ::control`: the quality of the low-pass Tone sets. */
const ORGAN_TONE_Q = 0.6

/** `Organ::rank`: one rank's wave at `turn` (in cycles), the series with ratio `a` at constant power. */
export function organRank(turn: number, a: number): number {
  const a2 = a * a
  const power = 1 - a2 * (0.5 + a2 * (0.125 + 0.0625 * a2))
  const x = 2 * Math.PI * turn
  return (Math.sin(x) * power) / (1 - 2 * a * Math.cos(x) + a2)
}

/** `Organ::note_on`: the most reed a rank sounding `hz` may have, so its harmonics are 60 dB down at Nyquist. */
export function organReed(reed: number, hz: number, sampleRate: number): number {
  return Math.min(reed * ORGAN_REED_MOST, Math.exp((-6.907755 * hz) / (0.5 * sampleRate)))
}

/**
 * `Organ::process`: how far the wind is from its steady pressure `seconds`
 * into a stretch of it, the bellows' uneven pump and the tremulant's shake.
 * Both run free, so only their shape is known: the pump is taken from where
 * the device starts it.
 */
export function organWind(bellows: number, tremulant: number, seconds: number): number {
  const turn = ORGAN_BELLOWS_HZ * seconds
  const pump =
    0.72 * Math.sin(2 * Math.PI * turn) +
    0.28 * Math.sin(2 * Math.PI * (0.37 + turn * ORGAN_PUMP_SECOND))
  return (
    bellows * ORGAN_BELLOWS_DEPTH * pump +
    tremulant * ORGAN_TREMULANT_DEPTH * Math.sin(2 * Math.PI * ORGAN_TREMULANT_HZ * seconds)
  )
}

/** What a low-pass of two poles at `cutHz` with quality `q` leaves of a frequency, as a gain. */
export function lowpassGain(hz: number, cutHz: number, q: number): number {
  const r2 = (hz * hz) / (cutHz * cutHz)
  return 1 / Math.sqrt((1 - r2) * (1 - r2) + r2 / (q * q))
}

/** The keys a rank's pipes are drawn for, and the lowest and highest of them. */
const ORGAN_KEYS_HZ = [65.41, 130.81, 261.63, 523.25, 1046.5] as const
const ORGAN_LOW_HZ = 65.41
const ORGAN_HIGH_HZ = 1046.5
/** The octaves a pipe's height spans, from the 16' of the lowest key down to nothing. */
const ORGAN_OCTAVES = 7.6

/** A pipe's height as a share of the tallest: an octave shorter for every halving of its length. */
function organPipe(feet: number, hz: number): number {
  const octaves =
    Math.log2(16 / feet) + Math.log2(clamp(hz, ORGAN_LOW_HZ, ORGAN_HIGH_HZ) / ORGAN_LOW_HZ)
  return 1 - octaves / ORGAN_OCTAVES
}

/** How strongly a pipe sounding `hz` is drawn under Tone: what the low-pass leaves of it, over 30 dB. */
const organToned = (hz: number, tone: number): number =>
  clamp(1 + gainToDb(lowpassGain(hz, tone, ORGAN_TONE_Q)) / 30, 0.1, 1)

const organBlown: Blown = {
  attack: (view) => view.value('attack'),
  level: (view, note) =>
    breathLevel(note.age, note.released, view.value('attack'), view.value('release')),
  hold: 4,
  waver: (view, seconds) =>
    organWind(view.value('bellows'), view.value('tremulant'), seconds) /
    (ORGAN_BELLOWS_DEPTH + ORGAN_TREMULANT_DEPTH),
}

const organ = plateDisplay({
  place: 'window',
  columns: 2,
  params: [
    'sub',
    'octave',
    'twelfth',
    'fifteenth',
    'reed',
    'celeste',
    'breath',
    'bellows',
    'tremulant',
    'attack',
    'release',
    'tone',
  ],
  live: { signal: true, notes: true },
  info: 'The ranks from the 16 foot at the left to the 2 foot, the celeste in outline, each as strong as its stop; a key lights its pipe in every rank. Under them one pipe’s wave as Reed shapes it, then the wind and each note on its breath: drag the corner for Attack, the slope for Release.',
  handles: breathHandles,
  draw(frame) {
    const { ctx, colours } = frame
    ground(frame)
    const parts = windParts(frame)
    const picture = parts.picture
    const reed = frame.value('reed')
    const tone = frame.value('tone')
    const breath = frame.value('breath')
    const attack = frame.value('attack')
    const release = frame.value('release')

    // The wind chest along the foot of the pipes: one pipe's wave, a sine for a flute and a buzz for a reed.
    const chest: Box = { x: picture.x, y: picture.y + picture.h - 8, w: picture.w, h: 8 }
    const feet = chest.y - 2
    const tall = feet - picture.y
    const a = organReed(reed, MIDDLE_C, frame.sampleRate)
    let peak = 0
    for (let step = 0; step < 48; step++) peak = Math.max(peak, Math.abs(organRank(step / 48, a)))
    const cycles = Math.max(3, Math.round(chest.w / 26))
    ctx.beginPath()
    for (let x = 0; x <= chest.w; x += 0.5) {
      const y = chest.y + chest.h / 2 - (organRank((x / chest.w) * cycles, a) / peak) * 3
      if (x === 0) ctx.moveTo(chest.x, y)
      else ctx.lineTo(chest.x + x, y)
    }
    ctx.globalAlpha = INK.text
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.lineJoin = 'round'
    ctx.stroke()
    ctx.globalAlpha = 1

    // The ranks: five pipes of each, an octave apart, as strong as the stop is drawn and as Tone leaves them.
    const gap = 5
    const wide = (picture.w - gap * (ORGAN_RANKS.length - 1)) / ORGAN_RANKS.length
    const thick = Math.max(2, Math.floor(wide / 8))
    let speaking = 0
    for (const note of frame.notes) {
      speaking += breathLevel(note.age, note.released, attack, release)
    }
    ORGAN_RANKS.forEach((rank, index) => {
      const level = rank.stop === null ? 1 : clamp(frame.value(rank.stop), 0, 1)
      const left = picture.x + index * (wide + gap)
      const span: Box = { x: left, y: 0, w: wide - thick, h: 0 }
      const xOf = (hz: number): number =>
        Math.round(xOfPitch(hz, span, ORGAN_LOW_HZ, ORGAN_HIGH_HZ))
      const sounds = (hz: number): number => (hz * 8) / rank.feet
      const hollow = rank.stop === 'celeste'
      for (const hz of ORGAN_KEYS_HZ) {
        const high = Math.max(3, Math.round(organPipe(rank.feet, hz) * tall))
        const x = xOf(hz)
        ctx.globalAlpha = lerp(0.14, 1, level) * organToned(sounds(hz), tone)
        if (hollow) {
          ctx.strokeStyle = colours.ink
          ctx.lineWidth = 1
          ctx.strokeRect(x + 0.5, feet - high + 0.5, thick - 1, high - 1)
        } else {
          ctx.fillStyle = colours.ink
          ctx.fillRect(x, feet - high, thick, high)
        }
      }
      ctx.globalAlpha = 1
      if (level <= 0) return
      // The keys that sound: each its own pipe of this rank, between the ones drawn.
      for (const note of frame.notes) {
        const share = breathShare(breathLevel(note.age, note.released, attack, release))
        if (share <= 0) continue
        const high = Math.max(3, Math.round(organPipe(rank.feet, note.frequency) * tall))
        ctx.globalAlpha = share * lerp(0.3, 1, level) * organToned(sounds(note.frequency), tone)
        ctx.fillStyle = colours.accent
        ctx.fillRect(xOf(note.frequency), feet - high, thick, high)
      }
      ctx.globalAlpha = 1
    })

    // Breath: the wind that is heard, in the chest; it follows the keys held.
    air(frame, chest, breath, breath * Math.sqrt(Math.min(speaking, 1)))

    breathStrip(frame, parts.breath, organBlown)
    levelFoot(frame, parts.foot, outShare(frame))

    // The words: how much reed is in the pipes, and where Tone cuts them.
    text(
      frame,
      reed < 0.1 ? 'Flutes' : reed > 0.9 ? 'Reeds' : `Reed ${Math.round(reed * 100)}%`,
      picture.x - 1,
      parts.words,
    )
    text(frame, hzText(tone), picture.x + picture.w + 1, parts.words, { align: 'right' })
  },
})

// --- Choir ---------------------------------------------------------------------

/**
 * `formants.h`, `kVowelTable`: the five formants of each vowel for a man's
 * voice and how wide each is, in Hz. Vowel morphs along them, a vowel every
 * quarter; Voice scales them all.
 */
const CHOIR_VOWELS = [
  { name: 'Ah', hz: [730, 1090, 2440, 3500, 4500], wide: [80, 90, 120, 130, 140] },
  { name: 'Eh', hz: [530, 1840, 2480, 3500, 4500], wide: [70, 80, 100, 120, 120] },
  { name: 'Ee', hz: [270, 2290, 3010, 3500, 4500], wide: [60, 90, 100, 120, 120] },
  { name: 'Oh', hz: [570, 840, 2410, 3500, 4500], wide: [70, 80, 100, 120, 120] },
  { name: 'Oo', hz: [300, 870, 2240, 3500, 4500], wide: [60, 70, 100, 120, 120] },
] as const
const CHOIR_FORMANTS = 5
/**
 * `formants.h`, `kHigherPoles`: the tract's resonances above the five, a
 * kilohertz apart from 5.5 kHz. They have no resonator: each lifts the weight
 * of the formants under it, by no more than five times.
 */
const CHOIR_HIGHER_POLES = 8
const CHOIR_POLE_LEAST = 0.2
/** `formants.h`: what stands for them in the sound, one broad band-pass at 8 kHz times Voice. */
const CHOIR_AIR_HZ = 8000
const CHOIR_AIR_Q = 1.5
const CHOIR_AIR_GAIN = 0.35
/** `FormantBank::set`: no formant lies under this, and neighbours are kept this ratio apart. */
const CHOIR_FORMANT_LEAST_HZ = 60
const CHOIR_FORMANT_APART = 1.1
/** `choir.h`: where the three singers of a note stand at Width 1, and how late each comes in at Ensemble 1. */
const CHOIR_POSITIONS = [0, 0.8, -0.8] as const
const CHOIR_LATE_SEC = [0, 0.045, 0.09] as const
/** `choir.h`: the third singer starts to sing at this much Ensemble; each comes up to full voice over the span. */
const CHOIR_THIRD_FROM = 0.3
const CHOIR_SINGER_SPAN = 0.4
/** `choir.h`: when the first singer's vibrato starts and how long it takes to arrive. */
const CHOIR_VIBRATO_DELAY = 0.25
const CHOIR_VIBRATO_RISE = 0.7
/** `choir.h`, `kMotionVowel`: how far along the morph a full Motion drifts the vowel, either way. */
const CHOIR_MOTION_VOWEL = 0.22
/** `choir.h`, `kTiltHz` and `kTiltOctaves`: where the softest voice's harmonics start to fall faster, and how far a full touch lifts that. */
const CHOIR_TILT_HZ = 900
const CHOIR_TILT_OCTAVES = 2.2

/**
 * `choir_dsp::vowel_at`: formant `k` (0 to 4) at `vowel` along the morph for a
 * tract of size `voice`; `wide` asks for its bandwidth, which scales with it.
 */
export function choirFormant(vowel: number, voice: number, k: number, wide = false): number {
  const scaled = clamp(vowel, 0, 1) * (CHOIR_VOWELS.length - 1)
  const index = Math.min(Math.floor(scaled), CHOIR_VOWELS.length - 2)
  const from = CHOIR_VOWELS[index]
  const to = CHOIR_VOWELS[index + 1]
  const t = scaled - index
  return (wide ? lerp(from.wide[k], to.wide[k], t) : lerp(from.hz[k], to.hz[k], t)) * voice
}

/** The bank of one draw, three figures a formant: its frequency, its damping and its weight. Written by `choirBank` and read within the same draw. */
const CHOIR_BANK = new Float64Array(3 * CHOIR_FORMANTS)

/**
 * `FormantBank::set`: the five resonators for a vowel and a voice. Each is a
 * low-pass of two poles, as sharp as its formant is narrow, and its weight is
 * what the other four do at its frequency (so the five side by side sound as
 * a tract's five in series do) lifted by the poles above.
 */
function choirBank(vowel: number, voice: number): void {
  let under = 0
  for (let k = 0; k < CHOIR_FORMANTS; k++) {
    const hz = Math.max(
      choirFormant(vowel, voice, k),
      CHOIR_FORMANT_LEAST_HZ,
      under * CHOIR_FORMANT_APART,
    )
    under = hz
    CHOIR_BANK[3 * k] = hz
    CHOIR_BANK[3 * k + 1] = clamp(choirFormant(vowel, voice, k, true) / hz, 0.005, 1)
  }
  for (let k = 0; k < CHOIR_FORMANTS; k++) {
    const own = CHOIR_BANK[3 * k] * CHOIR_BANK[3 * k]
    let weight = 1
    for (let j = 0; j < CHOIR_FORMANTS; j++) {
      const other = CHOIR_BANK[3 * j] * CHOIR_BANK[3 * j]
      if (j !== k) weight *= other / (other - own)
    }
    for (let n = 0; n < CHOIR_HIGHER_POLES; n++) {
      const pole = (5500 + 1000 * n) * voice
      weight /= Math.max(1 - own / (pole * pole), CHOIR_POLE_LEAST)
    }
    CHOIR_BANK[3 * k + 2] = weight
  }
}

/**
 * `FormantBank::process`: what the bank `choirBank` left does to a frequency,
 * in dB. The five resonators add up with their phases, which is where the
 * dips between formants come from, and the air band beside them keeps the top
 * from falling away: it is the floor the breath hisses on.
 */
function choirBankDb(hz: number, voice: number): number {
  let real = 0
  let turned = 0
  for (let k = 0; k < CHOIR_FORMANTS; k++) {
    // 1 / (1 − x² + j·d·x), x the frequency over the formant's.
    const x = hz / CHOIR_BANK[3 * k]
    const a = 1 - x * x
    const b = CHOIR_BANK[3 * k + 1] * x
    const weight = CHOIR_BANK[3 * k + 2] / (a * a + b * b)
    real += weight * a
    turned -= weight * b
  }
  // The air: j·b / (1 − x² + j·b), which is 1 at its centre.
  const x = hz / (CHOIR_AIR_HZ * voice)
  const a = 1 - x * x
  const b = x / CHOIR_AIR_Q
  const air = (CHOIR_AIR_GAIN * b) / (a * a + b * b)
  real += air * b
  turned += air * a
  return 10 * Math.log10(Math.max(real * real + turned * turned, 1e-12))
}

/** `FormantBank::process` for a vowel and a voice: what the tract does to a frequency, in dB. */
export function choirTractDb(hz: number, vowel: number, voice: number): number {
  choirBank(vowel, voice)
  return choirBankDb(hz, voice)
}

/**
 * `Choir::note_on`, `tilt_hz`, and glottal.h: the level of harmonic `h` of a
 * voice at `hz` as it leaves the folds, in dB under its fundamental's. The
 * pulse's harmonics fall 6 dB an octave, and a low-pass of one pole takes
 * more off the top the softer the note is sung: touch is vocal effort.
 */
export function choirSourceDb(h: number, hz: number, gain: number): number {
  const tilt = CHOIR_TILT_HZ * Math.pow(2, CHOIR_TILT_OCTAVES * clamp(gain, 0, 1))
  return -gainToDb(h) - 10 * Math.log10(1 + (hz * hz) / (tilt * tilt))
}

/** `Choir::control`: how much of singer `k` (0 to 2) is in the section, before the section is levelled. */
export function choirSinger(k: number, ensemble: number): number {
  if (k === 0) return 1
  return clamp((ensemble - (k === 2 ? CHOIR_THIRD_FROM : 0)) / CHOIR_SINGER_SPAN, 0, 1)
}

/** `Choir::control`: a vowel the drift has carried past either end of the morph turns back. */
const choirTurned = (vowel: number): number => (vowel < 0 ? -vowel : vowel > 1 ? 2 - vowel : vowel)

/** The vowel as it is said: its name on a vowel, the two it lies between elsewhere. */
function choirVowelName(vowel: number): string {
  const scaled = clamp(vowel, 0, 1) * (CHOIR_VOWELS.length - 1)
  const near = Math.round(scaled)
  if (Math.abs(scaled - near) < 0.2) return CHOIR_VOWELS[near].name
  const index = Math.floor(scaled)
  return `${CHOIR_VOWELS[index].name} to ${CHOIR_VOWELS[index + 1].name}`
}

/** Who a tract of this size belongs to, as the device's notes on Voice have it. */
const choirWho = (voice: number): string =>
  voice < 0.94 ? 'Basses' : voice < 1.08 ? 'Men' : voice < 1.25 ? 'Women' : 'Children'

/** The frequencies and levels the formants are drawn over. */
const CHOIR_LOW_HZ = 150
const CHOIR_HIGH_HZ = 8000
const CHOIR_TOP_DB = 32
const CHOIR_FOOT_DB = -40
/** The most harmonics of one note that are looked at; a voice has every one of them up to the top of the band. */
const CHOIR_HARMONICS = 512

const choirBlown: Blown = {
  attack: (view) => view.value('attack'),
  level: (view, note) =>
    breathLevel(note.age, note.released, view.value('attack'), view.value('release')),
  hold: 2,
  // `Choir::vibrato`: a singer finds the note first. Its depth is in cents, 60 at the knob's most.
  waver: (view, seconds) =>
    (view.value('vibrato') / 60) *
    vibratoOnset(seconds, CHOIR_VIBRATO_DELAY, CHOIR_VIBRATO_RISE) *
    Math.sin(2 * Math.PI * view.value('vibratoRate') * seconds),
}

/**
 * A mouth: an ellipse as tall as the first formant is high (the jaw drops for
 * Ah) and as wide as the second is (the lips spread for Ee and round for Oo),
 * which is how a singer makes them.
 */
function choirMouth(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  head: number,
  vowel: number,
): void {
  const tall = clamp((choirFormant(vowel, 1, 0) - 270) / (730 - 270), 0, 1)
  const spread = clamp((choirFormant(vowel, 1, 1) - 840) / (2290 - 840), 0, 1)
  ctx.beginPath()
  ctx.ellipse(x, y, head * lerp(0.2, 0.62, spread), head * lerp(0.1, 0.46, tall), 0, 0, Math.PI * 2)
}

const choir = plateDisplay({
  place: 'window',
  columns: 2,
  params: [
    'vowel',
    'voice',
    'motion',
    'breath',
    'ensemble',
    'vibrato',
    'vibratoRate',
    'attack',
    'release',
    'tone',
    'width',
  ],
  live: { signal: true, notes: true },
  info: 'The singers of a note, their mouths shaped to the vowel and their heads as large as the Voice is low, beside the formants of that vowel with the overtones of each note sung. Below, the breath with each note on it: drag its corner for Attack, its slope for Release.',
  handles: breathHandles,
  draw(frame) {
    const { ctx, colours } = frame
    ground(frame)
    const parts = windParts(frame)
    const picture = parts.picture
    const vowel = clamp(frame.value('vowel'), 0, 1)
    const voice = Math.max(frame.value('voice'), 0.1)
    const motion = frame.value('motion')
    const breath = frame.value('breath')
    const ensemble = frame.value('ensemble')
    const width = frame.value('width')
    const tone = frame.value('tone')
    const attack = frame.value('attack')
    const release = frame.value('release')

    // The singers.
    const stage: Box = {
      x: picture.x,
      y: picture.y,
      w: Math.min(92, picture.w * 0.48),
      h: picture.h,
    }
    const largest = Math.min(stage.h / 2 - 1, stage.w / 5.2)
    const head = (largest * 0.8) / voice
    const cx = stage.x + stage.w / 2
    const cy = stage.y + stage.h / 2
    const reach = (stage.w / 2 - largest) / 0.8
    for (const k of [2, 1, 0]) {
      const weight = choirSinger(k, ensemble)
      if (weight <= 0) continue
      // This singer's voice now: the loudest of the notes it has come in on.
      let sung = 0
      for (const note of frame.notes) {
        if (note.age < CHOIR_LATE_SEC[k] * ensemble) continue
        sung = Math.max(sung, breathShare(breathLevel(note.age, note.released, attack, release)))
      }
      const x = cx + CHOIR_POSITIONS[k] * width * reach
      ctx.beginPath()
      ctx.arc(x, cy, head, 0, Math.PI * 2)
      // A head is filled whole, so one that stands in front hides the part of the one behind it:
      // large heads close together read as singers in a row, not as rings laid over each other.
      ctx.globalAlpha = 1
      ctx.fillStyle = colours.plate
      ctx.fill()
      ctx.globalAlpha = weight
      ctx.strokeStyle = colours.ink
      ctx.lineWidth = 1.25
      ctx.stroke()
      for (const eye of [-1, 1]) {
        dot(ctx, x + eye * head * 0.36, cy - head * 0.3, Math.max(0.8, head * 0.08), colours.ink, {
          alpha: weight,
        })
      }
      const mouth = cy + head * 0.32
      // Motion: how far the vowel drifts either way, as the mouths it would make then.
      if (k === 0 && motion > 0) {
        for (const way of [-1, 1]) {
          choirMouth(ctx, x, mouth, head, choirTurned(vowel + way * motion * CHOIR_MOTION_VOWEL))
          ctx.globalAlpha = INK.back
          ctx.strokeStyle = colours.ink
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }
      choirMouth(ctx, x, mouth, head, vowel)
      ctx.globalAlpha = INK.back * weight
      ctx.fillStyle = colours.ink
      ctx.fill()
      if (sung > 0) {
        ctx.globalAlpha = sung * weight
        ctx.fillStyle = colours.accent
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    // The formants: what the tract does to each frequency, after the low-pass Tone puts ahead of it.
    const band: Box = {
      x: stage.x + stage.w + 5,
      y: picture.y,
      w: picture.w - stage.w - 5,
      h: picture.h,
    }
    const foot = band.y + band.h
    choirBank(vowel, voice)
    const dbOf = (hz: number): number =>
      choirBankDb(hz, voice) + gainToDb(lowpassGain(hz, tone, Math.SQRT1_2))
    const yOf = (db: number): number =>
      clamp(band.y + ((CHOIR_TOP_DB - db) / (CHOIR_TOP_DB - CHOIR_FOOT_DB)) * band.h, band.y, foot)
    const xOf = (hz: number): number => xOfPitch(hz, band, CHOIR_LOW_HZ, CHOIR_HIGH_HZ)
    ctx.beginPath()
    ctx.moveTo(band.x, foot)
    for (let px = 0; px <= band.w; px += 1.5) {
      const hz = CHOIR_LOW_HZ * Math.pow(CHOIR_HIGH_HZ / CHOIR_LOW_HZ, px / band.w)
      ctx.lineTo(band.x + px, yOf(dbOf(hz)))
    }
    ctx.lineTo(band.x + band.w, foot)
    ctx.globalAlpha = INK.fill
    ctx.fillStyle = colours.ink
    ctx.fill()
    ctx.globalAlpha = INK.text
    ctx.strokeStyle = colours.ink
    ctx.lineWidth = 1
    ctx.lineJoin = 'round'
    ctx.stroke()
    ctx.globalAlpha = 1

    // The notes that are sung: the overtones of each, as high as the voice and the tract make them,
    // a harder touch with more of the upper ones. The device then levels each note, so that one
    // with an overtone on a formant is no louder than its neighbour: the heights say where a
    // note's overtones fall, and how brightly it is lit says how loud it is.
    let rushing = 0
    for (const note of frame.notes) {
      const level = breathLevel(note.age, note.released, attack, release)
      const share = breathShare(level)
      if (share <= 0) continue
      rushing += level * level
      ctx.beginPath()
      let before = -1
      for (let h = 1; h <= CHOIR_HARMONICS; h++) {
        const hz = h * note.frequency
        if (hz > CHOIR_HIGH_HZ) break
        if (hz < CHOIR_LOW_HZ) continue
        // Up high the overtones of a low note are nearer than a pixel: one line stands for them.
        const x = Math.floor(xOf(hz)) + 0.5
        if (x === before) continue
        before = x
        ctx.moveTo(x, foot)
        ctx.lineTo(x, Math.min(foot - 1, yOf(dbOf(hz) + choirSourceDb(h, hz, note.gain))))
      }
      ctx.globalAlpha = share
      ctx.strokeStyle = colours.accent
      ctx.lineWidth = 1
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    // Breath: one noise for the whole choir, which takes on the vowel; it lies along the foot of the formants.
    air(
      frame,
      { x: band.x + 2, y: foot - 7, w: band.w - 4, h: 6 },
      breath,
      breath * Math.sqrt(Math.min(rushing, 1)),
    )

    breathStrip(frame, parts.breath, choirBlown)
    levelFoot(frame, parts.foot, outShare(frame))

    // The words: the vowel, and whose voices these are by the size of the tract.
    text(frame, choirVowelName(vowel), picture.x - 1, parts.words)
    text(frame, `${choirWho(voice)} ${voice.toFixed(2)}x`, picture.x + picture.w + 1, parts.words, {
      align: 'right',
    })
  },
})

export const WIND_INSTRUMENT_FACES: Readonly<Record<string, PlateFace>> = {
  flute: { display: flute, face: ['type', 'breath', 'blow', 'attack'] },
  clarinet: { display: clarinet, face: ['bore', 'blow', 'breath', 'attack'] },
  horns: { display: horns, face: ['type', 'blow', 'section', 'attack'] },
  organ: {
    display: organ,
    // The stops in the order of their pipes, longest first, as they stand in the device and the sections.
    face: ['reed', 'sub', 'octave', 'celeste'],
    labels: { sub: 'Sub 16', octave: 'Octave 4', twelfth: 'Twelfth', fifteenth: 'Fifteenth' },
    sections: [
      ['sub', 'octave', 'twelfth', 'fifteenth'],
      ['reed', 'celeste'],
      ['breath', 'bellows', 'tremulant'],
      ['attack', 'release', 'tone', 'volume'],
    ],
  },
  choir: {
    display: choir,
    face: ['vowel', 'voice', 'ensemble', 'attack'],
    labels: { vibratoRate: 'Vib rate' },
    sections: [
      ['vowel', 'voice', 'motion', 'breath'],
      ['ensemble', 'width'],
      ['vibrato', 'vibratoRate'],
      ['attack', 'release', 'tone', 'volume'],
    ],
  },
}
