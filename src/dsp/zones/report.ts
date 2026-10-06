// What a format reader gives back besides the zone map, and what a writer
// gives back besides the text: nothing a file asks for is dropped silently.

import { type ZoneMap } from './zone-map'

/** Something a file asks for that a zone map cannot say. */
export interface UnsupportedFeature {
  /** The opcode, attribute or element as the file names it (`ampeg_decay`, `sample@tags`, `<effects>`). */
  name: string
  /** How many zones (or places in the file) asked for it. */
  count: number
}

/** A file read into a zone map. Reading never throws: a file that makes no sense gives no zones and says why. */
export interface ParsedInstrument {
  map: ZoneMap
  /** Envelope times the file sets for the whole instrument, for the device's Attack and Release. */
  hints: { attackSec?: number; releaseSec?: number }
  unsupported: UnsupportedFeature[]
  warnings: string[]
}

/** A zone map written out as a file's text. */
export interface WrittenInstrument {
  text: string
  /** What the format could not hold. */
  warnings: string[]
}

/** Counts what a reader could not use, by name, in the order first met. */
export class Tally {
  private readonly counts = new Map<string, number>()

  add(name: string): void {
    this.counts.set(name, (this.counts.get(name) ?? 0) + 1)
  }

  list(): UnsupportedFeature[] {
    return [...this.counts.entries()].map(([name, count]) => ({ name, count }))
  }
}

/** The value most of `values` share, and whether they all do. */
export function mostCommon(values: readonly number[]): { value?: number; uniform: boolean } {
  const counts = new Map<number, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  let best: number | undefined
  let most = 0
  for (const [value, count] of counts) {
    if (count > most) {
      best = value
      most = count
    }
  }
  return { value: best, uniform: counts.size <= 1 }
}

/** A number as a file wants it: no exponent, no trailing zeros, six decimals at most. */
export function formatNumber(value: number): string {
  if (Number.isInteger(value)) return String(value)
  return value.toFixed(6).replace(/\.?0+$/, '')
}

const NOTE_OFFSETS: Readonly<Record<string, number>> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }

/** A key as a number or a note name (`c4`, `F#3`, `eb2`); `middleC` is the octave number of key 60. */
export function parseKey(text: string, middleC = 4): number | undefined {
  const trimmed = text.trim()
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed)
  const match = /^([a-gA-G])([#b]?)(-?\d+)$/.exec(trimmed)
  if (!match) return undefined
  const accidental = match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0
  return (Number(match[3]) - middleC + 5) * 12 + NOTE_OFFSETS[match[1].toLowerCase()] + accidental
}
