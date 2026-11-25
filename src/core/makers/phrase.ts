// A maker played over a phrase from start to end, as a patch that has one is
// rendered: the phrase's notes go in on their own seconds, and what comes out
// is a phrase again. The same maker a person plays (./player.ts), so a
// rendered sound has the notes its preset plays.

import { type PatchMaker } from '../devices/patch'
import { describeMaker, makerParams } from './table'
import { type MadeEvent, type NoteMakerDescriptor } from './types'

/** A note as a phrase has it, with the voice that plays it. */
export interface MadePhraseNote {
  atSec: number
  durSec: number
  note: number
  gain: number
  /** The part of the patch's maker that plays it; absent, the patch's own instrument. */
  part?: string
}

/** The notes a maker is played: a phrase's. */
export interface PlayedNote {
  atSec: number
  durSec: number
  note: number
  gain?: number
}

export interface MakePhraseOptions {
  /** How long the maker is kept at work, in seconds. A note still sounding there is written to its end there. */
  durationSec: number
  /** The velocity of a note that names none (default 0.8). */
  defaultGain?: number
  /** Where maker ids are looked up (default: the library's own). */
  describe?: (makerId: string) => NoteMakerDescriptor | undefined
}

/**
 * The phrase a patch's maker makes of `notes`. Throws for a maker there is
 * none of. A maker that is bypassed hands the notes back as they are.
 */
export function makePhrase(
  notes: readonly PlayedNote[],
  maker: PatchMaker,
  options: MakePhraseOptions,
): MadePhraseNote[] {
  const gainOf = (note: PlayedNote): number => note.gain ?? options.defaultGain ?? 0.8
  if (maker.bypass) return notes.map((note) => ({ ...note, gain: gainOf(note) }))
  const descriptor = (options.describe ?? describeMaker)(maker.makerId)
  if (!descriptor) throw new Error(`live-mix: unknown note maker "${maker.makerId}"`)
  const engine = descriptor.create({
    params: makerParams(descriptor, maker),
    key: maker.key,
    parts: Object.keys(maker.parts ?? {}),
  })

  const inputs: { atSec: number; on: boolean; id: number; note: number; gain: number }[] = []
  notes.forEach((note, id) => {
    if (!Number.isFinite(note.atSec) || !Number.isFinite(note.durSec) || note.durSec <= 0) return
    const atSec = Math.max(0, note.atSec)
    const gain = gainOf(note)
    inputs.push({ atSec, on: true, id, note: note.note, gain })
    inputs.push({ atSec: atSec + note.durSec, on: false, id, note: note.note, gain })
  })
  // A note that ends where the next begins has ended when it does.
  inputs.sort((a, b) => a.atSec - b.atSec || Number(a.on) - Number(b.on))

  const made: MadePhraseNote[] = []
  const open = new Map<number, MadePhraseNote>()
  const take = (event: MadeEvent): void => {
    if (event.on) {
      const note: MadePhraseNote = {
        atSec: event.atSec,
        durSec: 0,
        note: event.note,
        gain: event.gain,
      }
      if (event.part !== undefined) note.part = event.part
      open.set(event.id, note)
      made.push(note)
      return
    }
    const note = open.get(event.id)
    if (!note) return
    open.delete(event.id)
    note.durSec = event.atSec - note.atSec
  }

  const end = options.durationSec
  for (const input of inputs) {
    if (input.atSec > end) break
    if (input.on) engine.noteOn(input.atSec, input.id, input.note, input.gain)
    else engine.noteOff(input.atSec, input.id)
    engine.advance(input.atSec, take)
  }
  engine.advance(end, take)
  for (const note of open.values()) note.durSec = end - note.atSec
  return made.filter((note) => note.durSec > 0)
}
