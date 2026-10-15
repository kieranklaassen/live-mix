// What the visuals follow, worked out once a frame from the piece and from what is heard.
//
// Two things feed it. The piece itself says which strokes stand at the playhead, how loud each is painted and of
// which kind and colour: that is known whether or not anything plays, on a station that makes no sound too, and it
// is what tells one stroke from another, since the engine has no meter for a single stroke. What is heard (the
// level and the spectrum of the master, `ear.ts`) says how loud the whole really is and where its energy sits, and
// is used while the piece plays and audio runs. Without it the same is estimated from the strokes, so a stopped
// piece still shows its picture at the playhead.
//
// Pure but for the buffers it keeps: no React, no DOM, no audio.

import {
  KIND_SLOTS,
  MAP_H,
  MAP_W,
  SPECTRUM_BANDS,
  quietSignals,
  type KindSlot,
  type VisualSignals,
} from './frame'

/** A colour as red, green and blue, each 0 to 1. */
export type Rgb = readonly [number, number, number]

/** A stroke as the follower needs it. */
export interface FollowedStroke {
  id: string
  startSec: number
  durationSec: number
  fadeInSec: number
  fadeOutSec: number
  /** Where it is in the room, 0 at the back to 1 at the front, and how much of the room it takes up. */
  depth: number
  thickness: number
  /** How loud it is painted, 0 to 1; 0 for one that is muted. */
  gain: number
  slot: KindSlot
  colour: Rgb
  /** Where its hits fall, in seconds into one pass of its sound: for a beat, so that each hit shows. None: one hit as a pass begins. */
  onsets?: readonly number[]
  /** Where the stroke repeats its sound: how long one pass is, and how far into a pass the stroke begins. */
  repeatSec?: number
  phaseSec?: number
}

/** What is heard now, when audio runs. */
export interface Heard {
  /** The level of the whole mix, 0 to 1. */
  level: number
  /** The spectrum, low to high: `SPECTRUM_BANDS` levels, each 0 to 1. */
  bands: Float32Array
}

export interface FollowInput {
  /** How long since the frame before, in seconds. */
  dtSec: number
  /** Where the playhead is, in seconds from the start of the piece, and how long the piece is. */
  playheadSec: number
  pieceSec: number
  playing: boolean
  strokes: readonly FollowedStroke[]
  /** Null where nothing can be heard: before audio starts, and on a station that makes no sound. */
  heard: Heard | null
  energy: number
  space: number
  tone: number
  /** How loud the live input is, 0 to 1. */
  input: number
}

export interface Followed {
  signals: VisualSignals
  /** How loud each stroke is now, by its id. */
  strokeLevels: ReadonlyMap<string, number>
}

/** The colour a kind has while no sound of that kind plays. */
const KIND_AT_REST: Readonly<Record<KindSlot, Rgb>> = {
  drone: [0.25, 0.62, 0.68],
  pad: [0.5, 0.36, 0.72],
  texture: [0.74, 0.56, 0.3],
  melodic: [0.42, 0.68, 0.34],
  hits: [0.78, 0.36, 0.32],
}

/** Where a kind's energy sits in the spectrum when it has to be guessed: the band it is strongest in, and how wide. */
const KIND_BANDS: Readonly<Record<KindSlot, readonly [middle: number, wide: number]>> = {
  drone: [1.5, 2],
  pad: [5, 3],
  texture: [10, 5],
  melodic: [8, 2.5],
  hits: [6, 7],
}

/**
 * How fast a level comes up to what it reads, and how fast it falls back, in seconds. A sound that comes in shows
 * with it; one that goes leaves the picture a little after, so nothing flickers.
 */
const RISE_SEC = 0.03
const FALL_SEC = 0.12
/** How long a hit, a cue and a played note each show. */
const HIT_FALL_SEC = 0.6
const CUE_FALL_SEC = 1.2
const KEYS_FALL_SEC = 0.7
/** A cue's flare stays this long where it fell. */
const FLARE_SEC = 4
/**
 * What runs on by itself (the even time, the distance travelled) takes no frame to be longer than this: a tab that
 * was away does not jump. What follows the music is not held to it: after a long frame it stands where the music is.
 */
const LONGEST_FRAME_SEC = 0.1

const clamp01 = (value: number): number => (value > 0 ? (value < 1 ? value : 1) : 0)

const AT_THE_TOP: readonly number[] = [0]

/**
 * How long ago a stroke's last hit fell, `into` seconds after its start; Infinity where none has fallen yet. A
 * stroke that repeats its sound is hit again on every pass, and what is cut off at its end is not played.
 */
function sinceHit(stroke: FollowedStroke, into: number): number {
  const onsets = stroke.onsets && stroke.onsets.length > 0 ? stroke.onsets : AT_THE_TOP
  const played = Math.min(into, stroke.durationSec)
  const after = into - played
  const repeat = stroke.repeatSec !== undefined && stroke.repeatSec > 0 ? stroke.repeatSec : 0
  const phase = repeat > 0 ? (stroke.phaseSec ?? 0) : 0
  // How far through its sound it is, counting every pass, and where in this pass.
  const through = played + phase
  const at = repeat > 0 ? through % repeat : through
  const firstPass = repeat === 0 || through < repeat
  let last = -Infinity
  for (const onset of onsets) {
    // In the pass it began in, a hit before where it began was not played.
    if (onset <= at && onset > last && !(firstPass && onset < phase)) last = onset
  }
  if (last > -Infinity) return at - last + after
  if (firstPass) return Infinity
  // None yet in this pass: the last one of the pass before.
  let late = -Infinity
  for (const onset of onsets) if (onset < repeat && onset > late) late = onset
  if (late === -Infinity || (through < 2 * repeat && late < phase)) return Infinity
  return at + repeat - late + after
}

/**
 * How loud a stroke is at a place in the piece, 0 to 1 before its gain: rising over its fade in, falling over its
 * fade out, and ringing on a little after its end, longer the more Space there is. A hit is full at once and gone
 * soon after.
 */
export function strokeShape(
  stroke: FollowedStroke,
  sec: number,
  pieceSec: number,
  space: number,
): number {
  let into = sec - stroke.startSec
  // What rings on past the end of the piece is heard at its start.
  if (into < 0 && pieceSec > 0) into += pieceSec
  if (into < 0) return 0
  if (stroke.slot === 'hits') {
    const since = sinceHit(stroke, into)
    if (since > 3) return 0
    return since < 0.03 ? since / 0.03 : Math.exp(-(since - 0.03) / (0.25 + 0.5 * space))
  }
  if (into <= stroke.durationSec) {
    const rise = Math.min(1, into / Math.max(0.03, stroke.fadeInSec))
    const fall = Math.min(1, (stroke.durationSec - into) / Math.max(0.03, stroke.fadeOutSec))
    // Never wholly gone before its end: the tail takes over from here.
    return rise * Math.max(fall, 0.25)
  }
  const tail = (into - stroke.durationSec) / (0.4 + 2.2 * space)
  return tail < 1 ? 0.25 * (1 - tail) * (1 - tail) : 0
}

/** The same as a still shape, for the picture of the whole piece: where a stroke lies, fullest early. */
function strokeAlong(stroke: FollowedStroke, sec: number): number {
  const into = sec - stroke.startSec
  if (into < 0) return 0
  if (into <= stroke.durationSec)
    return Math.min(1, into / 0.8 + 0.2) * (1 - 0.5 * (into / Math.max(0.001, stroke.durationSec)))
  return Math.max(0, 0.5 - (into - stroke.durationSec) / 3)
}

/** Follows the piece and what is heard from frame to frame. One of these lives as long as the page does. */
export class VisualFollower {
  /** The signals as they stand: the same object every frame, filled anew by `step`. */
  readonly signals = quietSignals()
  private readonly levels = new Map<string, number>()
  private readonly guessed = new Float32Array(SPECTRUM_BANDS)
  private flares: { at: number; x: number; y: number }[] = []
  private hitAt = -Infinity
  private cueAt = -Infinity
  private keyAt = -Infinity
  private keyGain = 0

  /** A cue was fired: every style sees it, and it leaves a flare where the playhead stood. */
  cue(): void {
    this.cueAt = this.signals.time
    this.hitAt = this.signals.time
    this.flares.push({ at: this.signals.time, x: this.signals.place, y: 0.2 + 0.6 * Math.random() })
    if (this.flares.length > 12) this.flares.shift()
  }

  /** A note was played on the keys, `gain` 0 to 1 loud. */
  note(gain = 1): void {
    this.keyAt = this.signals.time
    this.keyGain = clamp01(0.4 + 0.6 * gain)
  }

  step(input: FollowInput): Followed {
    const signals = this.signals
    const went = Math.max(0, input.dtSec)
    const dt = Math.min(LONGEST_FRAME_SEC, went)
    const { pieceSec, playheadSec, strokes } = input
    const space = clamp01(input.space)
    signals.time += dt
    signals.place = pieceSec > 0 ? clamp01(playheadSec / pieceSec) : 0
    signals.energy = clamp01(input.energy)
    signals.space = space
    signals.tone = clamp01(input.tone)

    // Each stroke, and the loudest of each kind with its colour.
    const levels = this.levels
    levels.clear()
    const kinds: Record<KindSlot, number> = { drone: 0, pad: 0, texture: 0, melodic: 0, hits: 0 }
    const colours = signals.kindColours
    let sum = 0
    this.guessed.fill(0)
    for (const stroke of strokes) {
      const level = clamp01(strokeShape(stroke, playheadSec, pieceSec, space) * stroke.gain)
      if (level < 0.004) continue
      levels.set(stroke.id, level)
      sum += level
      if (level > kinds[stroke.slot]) {
        kinds[stroke.slot] = level
        colours.set(stroke.colour, KIND_SLOTS.indexOf(stroke.slot) * 3)
      }
      const [middle, wide] = KIND_BANDS[stroke.slot]
      for (let band = 0; band < SPECTRUM_BANDS; band++) {
        const off = (band - middle) / wide
        this.guessed[band] += level * Math.exp(-off * off)
      }
    }
    KIND_SLOTS.forEach((slot, index) => {
      if (kinds[slot] === 0) colours.set(KIND_AT_REST[slot], index * 3)
    })
    if (kinds.hits > 0.6) this.hitAt = signals.time

    // By the time that really went by: a page that paints seldom is not further behind the music for it.
    const rise = 1 - Math.exp(-went / RISE_SEC)
    const fall = 1 - Math.exp(-went / FALL_SEC)
    const toward = (now: number, want: number) => {
      const to = clamp01(want)
      return now + (to - now) * (to > now ? rise : fall)
    }
    signals.drone = toward(signals.drone, kinds.drone)
    signals.pad = toward(signals.pad, kinds.pad)
    signals.texture = toward(signals.texture, kinds.texture)
    signals.melodic = toward(signals.melodic, kinds.melodic)
    signals.hits = Math.max(kinds.hits, Math.exp(-(signals.time - this.hitAt) / HIT_FALL_SEC))
    signals.cue = Math.exp(-(signals.time - this.cueAt) / CUE_FALL_SEC)
    signals.keys = this.keyGain * Math.exp(-(signals.time - this.keyAt) / KEYS_FALL_SEC)
    signals.input = toward(signals.input, input.input)

    // The whole: as heard while it plays, else as the strokes at the playhead would have it.
    const heard = input.playing ? input.heard : null
    const bands = signals.bands
    for (let band = 0; band < SPECTRUM_BANDS; band++)
      bands[band] = toward(bands[band], heard ? heard.bands[band] : this.guessed[band])
    const most = (from: number, to: number) => {
      let top = 0
      for (let band = from; band <= to; band++) top = Math.max(top, bands[band])
      return top
    }
    signals.mix = toward(signals.mix, heard ? heard.level : sum * 0.45)
    signals.low = most(0, 4)
    signals.mid = most(5, 10)
    signals.high = most(11, SPECTRUM_BANDS - 1)
    signals.travel += dt * (0.25 + 1.1 * signals.energy * (0.35 + signals.mix))

    this.flares = this.flares.filter((flare) => signals.time - flare.at < FLARE_SEC)
    this.paintMap(strokes, pieceSec)
    return { signals, strokeLevels: levels }
  }

  /** The piece as it sounds now: each stroke a soft band where it lies, faint while it waits and bright while it plays. */
  private paintMap(strokes: readonly FollowedStroke[], pieceSec: number): void {
    const map = this.signals.map
    const light = this.light
    light.fill(0)
    if (pieceSec > 0) {
      for (const stroke of strokes) {
        const strength = 0.22 * stroke.gain + 1.1 * (this.levels.get(stroke.id) ?? 0)
        if (strength < 0.004) continue
        const reach = Math.max(0.05, stroke.thickness * 0.6 + 0.04)
        const top = Math.max(0, Math.floor((stroke.depth - reach * 2.2) * MAP_H))
        const bottom = Math.min(MAP_H - 1, Math.ceil((stroke.depth + reach * 2.2) * MAP_H))
        const left = Math.max(0, Math.floor((stroke.startSec / pieceSec) * MAP_W))
        const right = Math.min(
          MAP_W - 1,
          Math.ceil(((stroke.startSec + stroke.durationSec + 1.5) / pieceSec) * MAP_W),
        )
        for (let x = left; x <= right; x++) {
          const along = strokeAlong(stroke, ((x + 0.5) / MAP_W) * pieceSec)
          if (along <= 0) continue
          for (let y = top; y <= bottom; y++) {
            const off = ((y + 0.5) / MAP_H - stroke.depth) / reach
            const value = strength * along * Math.exp(-off * off)
            if (value < 0.004) continue
            const cell = (y * MAP_W + x) * 4
            light[cell] += value * stroke.colour[0]
            light[cell + 1] += value * stroke.colour[1]
            light[cell + 2] += value * stroke.colour[2]
            light[cell + 3] += value
          }
        }
      }
    }
    // A cue's flare stays where it fell, spreads and fades.
    const hit = KIND_SLOTS.indexOf('hits') * 3
    const colours = this.signals.kindColours
    for (const flare of this.flares) {
      const age = Math.exp(-(this.signals.time - flare.at) / 1.0)
      if (age < 0.02) continue
      const spread = 0.03 + 0.1 * (1 - age)
      for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
          const far =
            Math.hypot((x + 0.5) / MAP_W - flare.x, ((y + 0.5) / MAP_H - flare.y) * 0.56) / spread
          const value = age * Math.exp(-far * far) * 0.9
          if (value < 0.004) continue
          const cell = (y * MAP_W + x) * 4
          light[cell] += value * colours[hit]
          light[cell + 1] += value * colours[hit + 1]
          light[cell + 2] += value * colours[hit + 2]
          light[cell + 3] += value
        }
      }
    }
    for (let cell = 0; cell < MAP_W * MAP_H * 4; cell += 4) {
      const sum = light[cell + 3]
      const lit = clamp01(sum)
      const scale = sum > 1e-4 ? (lit / sum) * 255 : 0
      map[cell] = light[cell] * scale
      map[cell + 1] = light[cell + 1] * scale
      map[cell + 2] = light[cell + 2] * scale
      map[cell + 3] = lit * 255
    }
  }

  private readonly light = new Float32Array(MAP_W * MAP_H * 4)
}
