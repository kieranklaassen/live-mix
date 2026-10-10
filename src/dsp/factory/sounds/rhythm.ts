// What a sound that keeps time is written with: rows of steps, the way a
// drum machine shows a bar, laid out as the strokes of a phrase that is
// played round (`cycled` in ./recipe.ts). Everything is written at 120, in
// four: a beat is half a second and a bar two, so a loop of whole bars is a
// whole number of seconds and comes round on a bar line at any tempo it is
// played at (`FactorySound.bpm`, ../tempo.ts).
//
//   ...bars(2, [
//     row(KIT.kick,  'X... .... x... ....'),
//     row(KIT.hat,   '..o. ..o. ..o. ..o-'),
//   ])
//
// A row is as many steps as it has marks and is repeated until the loop is
// full; sixteen steps to the bar unless it says otherwise, so a row of
// twelve with `per: 12` is triplets and a row of five with `per: 5` goes
// five to the bar against the four of the rest.

import { type FactorySound } from '../types'
import { cycled, type Stroke } from './recipe'

/** The tempo every sound that keeps time is written at, beats per minute. */
export const WRITTEN_BPM = 120
/** Seconds in a bar of four at the written tempo. */
export const BAR_SEC = (4 * 60) / WRITTEN_BPM

/** How hard each mark of a row is struck: an accent, a stroke, a soft one, a ghost. */
const TOUCH: Readonly<Record<string, number>> = { X: 1, x: 0.8, o: 0.55, '-': 0.3 }

/** The keys of a kit in the octave it is written in: the same twelve places on every kit (../kits.ts). */
export const KEYS = {
  C: 60,
  Cs: 61,
  D: 62,
  Ds: 63,
  E: 64,
  F: 65,
  Fs: 66,
  G: 67,
  Gs: 68,
  A: 69,
  As: 70,
  B: 71,
} as const

/** The drums of the drum kit by the key each is on. */
export const KIT = {
  kick: KEYS.C,
  sub: KEYS.Cs,
  snare: KEYS.D,
  brush: KEYS.Ds,
  rim: KEYS.E,
  hat: KEYS.F,
  shaker: KEYS.Fs,
  open: KEYS.G,
  clap: KEYS.Gs,
  lowTom: KEYS.A,
  tick: KEYS.As,
  highTom: KEYS.B,
} as const

/** The faults of the glitch kit by the key each is on. */
export const FAULT = {
  click: KEYS.C,
  double: KEYS.Cs,
  pop: KEYS.D,
  crackle: KEYS.Ds,
  pip: KEYS.E,
  cut: KEYS.F,
  static: KEYS.Fs,
  buzz: KEYS.G,
  zap: KEYS.Gs,
  chirp: KEYS.A,
  stutter: KEYS.As,
  bit: KEYS.B,
} as const

export interface RowOptions {
  /** Steps to the bar (default 16): 12 for triplets, 8 for eighths, 5 for five against the bar. */
  per?: number
  /** How long the key is held, in steps (default half a step). Nothing to a kit, which rings as it will. */
  hold?: number
  /** How late every second step comes, as a share of a step: 0 is straight, 1/3 a full shuffle. */
  swing?: number
  /** Seconds the whole row is laid back by: a snare a hair behind the beat. */
  lateSec?: number
}

/** One row of a pattern: where its marks fall in one turn of it, before it is repeated over a loop. */
export interface Row {
  /** The note of every stroke, or the notes its strokes take in turn, round and round. */
  notes: readonly number[]
  /** The gain of each step; 0 for a rest. */
  steps: readonly number[]
  stepSec: number
  holdSec: number
  swingSec: number
  lateSec: number
}

/**
 * A row of steps on one note, or on several taken in turn (a broken chord).
 * `X` is an accent, `x` a stroke, `o` a soft one, `-` a ghost and `.` a rest;
 * spaces and bar lines are there to read by.
 */
export function row(
  note: number | readonly number[],
  marks: string,
  { per = 16, hold = 0.5, swing = 0, lateSec = 0 }: RowOptions = {},
): Row {
  const steps = [...marks.replace(/[\s|]/g, '')].map((mark) => {
    if (mark === '.') return 0
    const gain = TOUCH[mark]
    if (gain === undefined) throw new Error(`live-mix: "${mark}" is no mark of a pattern row`)
    return gain
  })
  const stepSec = BAR_SEC / per
  return {
    notes: typeof note === 'number' ? [note] : note,
    steps,
    stepSec,
    holdSec: hold * stepSec,
    swingSec: swing * stepSec,
    lateSec,
  }
}

/** The strokes of rows repeated over `count` bars. A row that does not fit a whole number of times is a mistake. */
export function strokesOf(count: number, rows: readonly Row[]): Stroke[] {
  const loopSec = count * BAR_SEC
  const strokes: Stroke[] = []
  for (const each of rows) {
    const turnSec = each.steps.length * each.stepSec
    const turns = loopSec / turnSec
    if (each.steps.length === 0 || Math.abs(turns - Math.round(turns)) > 1e-9) {
      throw new Error(`live-mix: a row of ${each.steps.length} steps does not fill ${count} bars`)
    }
    let struck = 0
    for (let turn = 0; turn < Math.round(turns); turn += 1) {
      each.steps.forEach((gain, step) => {
        if (gain === 0) return
        const atSec =
          turn * turnSec + step * each.stepSec + (step % 2 === 1 ? each.swingSec : 0) + each.lateSec
        strokes.push([atSec, each.holdSec, each.notes[struck % each.notes.length], gain])
        struck += 1
      })
    }
  }
  return strokes.sort((a, b) => a[0] - b[0] || a[2] - b[2])
}

export interface BarsOptions {
  /**
   * Passes rendered and dropped before the one that is the sound (default 1):
   * two or three where an echo or a room outlasts the loop, so the sound is
   * the loop as it is once it has been going a while.
   */
  passes?: number
  /** Seconds the next pass is folded over the start (default 0.03): short, so a hit on the first beat stays a hit. */
  crossfadeSec?: number
}

/** A loop of `count` bars that keeps time: the rows played round, written at 120. */
export function bars(
  count: number,
  rows: readonly Row[],
  { passes = 1, crossfadeSec = 0.03 }: BarsOptions = {},
): Pick<
  FactorySound,
  'phrase' | 'durationSec' | 'skipSec' | 'loopCrossfadeSec' | 'loopFold' | 'bpm'
> {
  return {
    ...cycled(count * BAR_SEC, strokesOf(count, rows), { passes, crossfadeSec }),
    bpm: WRITTEN_BPM,
  }
}
