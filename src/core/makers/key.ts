// Counting in the steps of a key: where a note stands in a scale, and which
// note stands so many steps from it. A step index counts scale notes from
// the root at or above MIDI note 0, so index 0 is the lowest root and the
// next octave's root is `steps.length`.

import { type MakerKey } from './types'

export function mod(value: number, by: number): number {
  return ((value % by) + by) % by
}

/** A key as a maker can count in it: a whole root, steps rising from 0 and inside the octave. */
export function cleanKey(key: MakerKey | undefined, fallback: MakerKey): MakerKey {
  if (!key || !Number.isFinite(key.root) || !Array.isArray(key.steps)) return fallback
  const steps = [...new Set((key.steps as readonly number[]).map((step) => Math.round(step)))]
    .filter((step) => step > 0 && step < 12)
    .sort((a, b) => a - b)
  return { root: mod(Math.round(key.root), 12), steps: [0, ...steps] }
}

/** The note at a step index. */
export function noteAt(key: MakerKey, index: number): number {
  const size = key.steps.length
  const whole = Math.round(index)
  return key.root + 12 * Math.floor(whole / size) + key.steps[mod(whole, size)]
}

/** The step index of the scale note nearest to `note`; halfway between two, the lower. */
export function indexOf(key: MakerKey, note: number): number {
  const size = key.steps.length
  const octave = Math.floor((note - key.root) / 12)
  let best = octave * size
  let distance = Infinity
  // The octave the note is in, and the first note of the one above.
  for (let i = octave * size; i <= (octave + 1) * size; i += 1) {
    const away = Math.abs(noteAt(key, i) - note)
    if (away < distance - 1e-9) {
      best = i
      distance = away
    }
  }
  return best
}

/** The scale note nearest to `note`; halfway between two, the lower. */
export function snapNote(key: MakerKey, note: number): number {
  return noteAt(key, indexOf(key, note))
}

/** Whether `note` is a note of the key. */
export function inKey(key: MakerKey, note: number): boolean {
  return Math.abs(snapNote(key, note) - note) < 1e-9
}

/** The note `steps` scale steps from `note`, which is taken to its nearest scale note first. */
export function stepFrom(key: MakerKey, note: number, steps: number): number {
  return noteAt(key, indexOf(key, note) + Math.round(steps))
}

/** The pitch class of a degree of the key: 0 is the root. */
export function degreeClass(key: MakerKey, degree: number): number {
  return mod(key.root + key.steps[mod(Math.round(degree), key.steps.length)], 12)
}

/**
 * The triad on a degree of the key, as pitch classes: the degree, the key's
 * note nearest to a third above it and the key's note nearest to a fifth. In
 * a seven-note scale they are every other step, as a triad is written.
 */
export function triadOn(key: MakerKey, degree: number): [number, number, number] {
  const size = key.steps.length
  const at = mod(Math.round(degree), size)
  const above = (i: number) =>
    key.steps[mod(at + i, size)] + (at + i >= size ? 12 : 0) - key.steps[at]
  const root = degreeClass(key, at)
  if (size === 7) return [root, mod(root + above(2), 12), mod(root + above(4), 12)]
  const nearest = (wanted: readonly number[]): number => {
    let best = wanted[0]
    let distance = Infinity
    for (let i = 1; i < size; i += 1) {
      const away = Math.min(...wanted.map((want, rank) => Math.abs(above(i) - want) + rank * 0.1))
      if (away < distance) {
        best = above(i)
        distance = away
      }
    }
    return best
  }
  return [root, mod(root + nearest([4, 3]), 12), mod(root + nearest([7, 6, 8]), 12)]
}

/** The note of pitch class `pitchClass` nearest to `note`; halfway, the lower. */
export function nearestOfClass(pitchClass: number, note: number): number {
  const up = mod(pitchClass - note, 12)
  return up < 6 ? note + up : note + up - 12
}

/**
 * The note of pitch class `pitchClass` a patch's `home` note becomes in
 * another key: from five semitones under it to six over it, the way the bank
 * moves into a key (`factoryTranspose`). A register set so moves with the
 * notes, where one counted in octaves from C would jump at some key.
 */
export function classNear(pitchClass: number, home: number): number {
  const up = mod(pitchClass - home, 12)
  return up > 6 ? home + up - 12 : home + up
}

/** The highest note under `note` (or at it, with `at`) whose pitch class is among `classes`. */
export function below(classes: readonly number[], note: number, at = false): number {
  let best = -Infinity
  for (const pitchClass of classes) {
    const down = mod(note - pitchClass, 12)
    best = Math.max(best, note - (down < 1e-9 && !at ? 12 : down))
  }
  return best
}

/** The lowest note over `note` (or at it, with `at`) whose pitch class is among `classes`. */
export function above(classes: readonly number[], note: number, at = false): number {
  let best = Infinity
  for (const pitchClass of classes) {
    const up = mod(pitchClass - note, 12)
    best = Math.min(best, note + (up < 1e-9 && !at ? 12 : up))
  }
  return best
}

/**
 * The degree of the key its scale reads the same from in both directions:
 * the second of major (D on the white keys), and the same note in each of
 * its modes. The first degree in scales that have none.
 */
export function mirrorDegree(key: MakerKey): number {
  const size = key.steps.length
  for (let degree = 0; degree < size; degree += 1) {
    const turned = key.steps.map((step) => mod(2 * key.steps[degree] - step, 12))
    if (turned.every((step) => key.steps.includes(step))) return degree
  }
  return 0
}
