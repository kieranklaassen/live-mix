// Parts the bank's sounds and the generated ones are both built from: the
// two that let a steady tone loop without a swell, and a few effects set the
// way a looping sound needs them.

import { type PatchDevice } from '../../core/devices/patch'
import { noteFrequency } from '../patch-render'

/**
 * A tone that does not move at all is the same wave at both ends of its loop,
 * and the equal-power fold, right for two unrelated stretches, then adds them
 * in amplitude: a swell of up to 3 dB at every pass (or a dip, when the ends
 * meet out of phase). These two take it away. `wholeCycles` moves a note by
 * less than two cents to the pitch that fits a whole number of cycles into
 * the loop, so every partial meets itself in phase; `quarterTurn` then shifts
 * everything up by a quarter of a cycle per loop, far too little to hear, so
 * every partial meets itself a quarter turn on, where amplitudes add in power.
 */
export function wholeCycles(note: number, loopSec: number): number {
  const cycles = Math.round(noteFrequency(note) * loopSec)
  return 69 + 12 * Math.log2(cycles / loopSec / 440)
}

export const quarterTurn = (loopSec: number): PatchDevice => ({
  deviceId: 'freq-shifter',
  params: {
    shift: 0,
    fine: 1 / (4 * loopSec),
    mode: 0,
    feedback: 0,
    lfoDepth: 0,
    tone: 16000,
    width: 0,
    mix: 1,
  },
})

/**
 * A pure fifth, two cents wider than the keyboard's: what a generated drone
 * holds over its root, so the two do not beat against each other.
 */
export const PURE_FIFTH = 12 * Math.log2(3 / 2)

export const zita = (preset: 'Room' | 'Hall' | 'Cathedral', mix: number): PatchDevice => ({
  deviceId: 'zita-rev1',
  preset,
  params: { mix },
})

/** A slow swell in level at an exact rate, so it comes round with the loop. */
export const breathe = (rate: number, depth: number): PatchDevice => ({
  deviceId: 'tremolo',
  params: { mode: 0, rate, depth, shape: 0, phase: 0, drift: 0, smooth: 0.5 },
})

/**
 * Rounds off the clicks and crackles of a weather texture, which are 20 dB
 * above the bed they sit on: without it the bed is very quiet once the sound
 * is brought to the bank's peak level.
 */
export const soften = (driveDb: number): PatchDevice => ({
  deviceId: 'saturator',
  params: { curve: 3, driveDb, outputDb: -6, oversample: 1 },
})
