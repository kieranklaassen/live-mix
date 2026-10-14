// One frame of the picture, worked out from a piece's visuals and what the music does now.
//
// A frame is everything a screen needs to paint: the signals every style is handed, and the layers to paint in
// order, each with its knobs already where they stand this moment (a knob that follows something has followed it).
// It is plain data, so it can be sent to another window as it is and painted there: the picture on a second screen
// is the same frame, drawn again.
//
// Pure: no React, no DOM, no audio.

import {
  drawOrder,
  paints,
  visualBend,
  type Visual,
  type VisualKnob,
  type VisualSet,
  type VisualSource,
} from './model'
import { visualPalette, type VisualPalette } from './palettes'
import { visualStyle } from './styles'

/** The parts the spectrum is handed to a style in, low to high. */
export const SPECTRUM_BANDS = 16
/** The piece as it sounds now, as a small picture: across is the piece from start to end, down is the room. */
export const MAP_W = 64
export const MAP_H = 32

/** The kinds of sound a style tells apart, in the order it is handed their levels and colours. */
export const KIND_SLOTS = ['drone', 'pad', 'texture', 'melodic', 'hits'] as const
export type KindSlot = (typeof KIND_SLOTS)[number]

/** What the music does now. Every level is 0 to 1 and already smooth. */
export interface VisualSignals {
  /** Seconds that run on evenly, whether the piece plays or not. */
  time: number
  /** Where the playhead is, from 0 at the start of the piece to 1 at its end. */
  place: number
  /** A distance that grows all the time, faster when the music is fuller: what forward motion is drawn from. */
  travel: number
  mix: number
  low: number
  mid: number
  high: number
  drone: number
  pad: number
  texture: number
  melodic: number
  hits: number
  cue: number
  keys: number
  input: number
  energy: number
  space: number
  tone: number
  /** The spectrum, low to high: `SPECTRUM_BANDS` levels. */
  bands: Float32Array
  /** The colour of each kind in `KIND_SLOTS`, red, green and blue each 0 to 1: fifteen numbers. */
  kindColours: Float32Array
  /** `MAP_W` by `MAP_H` pixels of red, green, blue and how loud, the back of the room first. */
  map: Uint8Array
}

/** A visual as it is painted this frame. */
export type VisualLayer =
  | { paint: string; variation: 0 | 1; level: number; size: number; glow: number; hue: number }
  | { bend: 'trails'; length: number; push: number }
  | { bend: 'mirror'; fold: number }
  | { bend: 'spin'; turn: number }
  | { bend: 'grain'; amount: number }

export interface VisualFrame {
  signals: VisualSignals
  layers: VisualLayer[]
  palette: VisualPalette
  /** How much film grain lies over the picture, 0 to 1. */
  grain: number
}

const clamp01 = (value: number): number => (value > 0 ? (value < 1 ? value : 1) : 0)

/** A visual shows this much of itself at most a beat after its stretch starts and a beat before it ends. */
const EDGE_BEATS = 1

/** What a source reads now. `stroke` is the level of the stroke the visual is linked to, 0 for one that is not. */
export function sourceNow(source: VisualSource, signals: VisualSignals, stroke: number): number {
  return source === 'stroke' ? stroke : signals[source]
}

/**
 * Where a knob stands now. One that follows nothing stands where it was put. One that follows something is moved by
 * it, and where it was put says how far: with the source at rest it shows a little, with the source full it can go
 * past where it was put. Following the place in the piece, it runs from nothing at the start to where it was put at
 * the end.
 */
export function knobNow(
  knob: VisualKnob | undefined,
  signals: VisualSignals,
  stroke: number,
): number {
  if (!knob) return 0
  if (knob.follows === null) return knob.value
  if (knob.follows === 'place') return clamp01(knob.value * signals.place)
  return clamp01(knob.value * (0.15 + 1.35 * sourceNow(knob.follows, signals, stroke)))
}

/**
 * How much of a visual shows now, 0 to 1: with its stroke when it is linked to one, else for its own stretch of the
 * piece, coming in and going out over a beat.
 */
export function presenceOf(visual: Visual, beat: number, strokeLevel: number): number {
  if (visual.stroke !== null) return clamp01(1.4 * strokeLevel)
  if (visual.beats === null) return 1
  const into = beat - visual.beat
  if (into < 0 || into > visual.beats) return 0
  const edge = Math.min(EDGE_BEATS, visual.beats / 2)
  return clamp01(Math.min(into, visual.beats - into) / edge)
}

/**
 * The frame a piece's visuals come to now. `beat` is where the playhead is, in beats from the start of the piece;
 * `strokeLevels` says how loud each stroke is now, by its id (a stroke not in it is silent).
 */
export function frameOf(
  set: VisualSet,
  signals: VisualSignals,
  beat: number,
  strokeLevels: ReadonlyMap<string, number>,
): VisualFrame {
  const layers: VisualLayer[] = []
  for (const visual of drawOrder(set)) {
    const stroke = visual.stroke === null ? 0 : (strokeLevels.get(visual.stroke) ?? 0)
    const here = presenceOf(visual, beat, stroke)
    if (here < 0.01) continue
    const knob = (name: string) => knobNow(visual.knobs[name], signals, stroke)
    if (paints(visual.kind)) {
      if (!visualStyle(visual.kind)) continue
      const level = knob('level') * here
      if (level < 0.004) continue
      layers.push({
        paint: visual.kind,
        variation: visual.variation,
        level,
        size: knob('size'),
        glow: knob('glow'),
        hue: knob('colour') - 0.5,
      })
      continue
    }
    switch (visualBend(visual.kind)?.id) {
      case 'trails':
        layers.push({ bend: 'trails', length: knob('length') * here, push: knob('push') })
        break
      case 'mirror':
        layers.push({ bend: 'mirror', fold: knob('fold') * here })
        break
      case 'spin':
        layers.push({ bend: 'spin', turn: knob('turn') * here })
        break
      case 'grain':
        layers.push({ bend: 'grain', amount: knob('amount') * here })
        break
      default:
      // A kind from a later build: this one has nothing to paint it with.
    }
  }
  return { signals, layers, palette: visualPalette(set.palette), grain: set.grain }
}

/** The frame that shows one style alone, as the list shows it beside its name. */
export function sampleFrame(
  kind: string,
  variation: 0 | 1,
  signals: VisualSignals,
  palette: VisualPalette,
  grain: number,
): VisualFrame {
  return {
    signals,
    layers: visualStyle(kind)
      ? [
          {
            paint: kind,
            variation,
            level: 1,
            size: 0.5,
            glow: clamp01(0.7 * (0.15 + 1.35 * signals.energy)),
            hue: 0,
          },
        ]
      : [],
    palette,
    grain,
  }
}

/** Signals with nothing sounding: what a screen shows before the first frame arrives. */
export function quietSignals(): VisualSignals {
  return {
    time: 0,
    place: 0,
    travel: 0,
    mix: 0,
    low: 0,
    mid: 0,
    high: 0,
    drone: 0,
    pad: 0,
    texture: 0,
    melodic: 0,
    hits: 0,
    cue: 0,
    keys: 0,
    input: 0,
    energy: 0.6,
    space: 0.5,
    tone: 0.5,
    bands: new Float32Array(SPECTRUM_BANDS),
    kindColours: new Float32Array(KIND_SLOTS.length * 3),
    map: new Uint8Array(MAP_W * MAP_H * 4),
  }
}
