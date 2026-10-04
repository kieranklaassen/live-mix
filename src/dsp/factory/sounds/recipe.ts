// What a factory sound is written with: the recipe (a patch written out, a
// phrase and a length), the two ways a phrase is played (held through a loop,
// or played and left to ring out) and a few instruments set the way the
// bank's sounds use them. Every file of sounds beside this one is a list of
// `sound({...})` and nothing else.

import { type PatchDevice } from '../../../core/devices/patch'
import { transposeWords } from '../words'
import { type FactorySound } from '../types'

/** A factory sound with its patch written out: the patch takes the sound's id, name and description. */
export interface Recipe extends Omit<FactorySound, 'patch'> {
  instrument: PatchDevice
  effects: readonly PatchDevice[]
}

export function sound(recipe: Recipe): FactorySound {
  const { instrument, effects, ...rest } = recipe
  const name = transposeWords(recipe.name, 0)
  const description = transposeWords(recipe.description, 0)
  const names = name !== recipe.name || description !== recipe.description
  return {
    ...rest,
    name,
    description,
    ...(names ? { words: { name: recipe.name, description: recipe.description } } : {}),
    patch: { id: recipe.id, name, category: recipe.kind, description, instrument, effects },
  }
}

/** A note of a held chord: the MIDI note, or the note with its velocity. */
export type HeldNote = number | readonly [note: number, gain: number]

/**
 * A chord held through everything that is rendered for a loop of `durationSec`:
 * the skipped start, the loop and the stretch that is folded over its start.
 */
export function looped(
  durationSec: number,
  skipSec: number,
  loopCrossfadeSec: number,
  notes: readonly HeldNote[],
): Pick<FactorySound, 'phrase' | 'durationSec' | 'skipSec' | 'loopCrossfadeSec'> {
  const durSec = skipSec + durationSec + loopCrossfadeSec + 1
  return {
    phrase: {
      notes: notes.map((entry) =>
        typeof entry === 'number'
          ? { atSec: 0, durSec, note: entry }
          : { atSec: 0, durSec, note: entry[0], gain: entry[1] },
      ),
    },
    durationSec,
    skipSec,
    loopCrossfadeSec,
  }
}

/** A note of a phrase: when, how long the key is down, which note, how hard. */
export type Stroke = readonly [atSec: number, durSec: number, note: number, gain?: number]

/** A phrase that ends inside `durationSec`. */
export function played(
  durationSec: number,
  strokes: readonly Stroke[],
  fadeOutSec?: number,
): Pick<FactorySound, 'phrase' | 'durationSec' | 'fadeOutSec'> {
  return {
    phrase: {
      notes: strokes.map(([atSec, durSec, note, gain]) => ({ atSec, durSec, note, gain })),
    },
    durationSec,
    fadeOutSec,
  }
}

/**
 * A phrase that comes round: the strokes are played once for every pass that
 * is rendered, `durationSec` apart, so what rings on from the end of one pass
 * lies under the start of the next. The first `passes` are rendered and
 * dropped (one is enough unless a tail outlasts the loop), the next is the
 * sound, and the start of the one after is folded over its start, linearly,
 * since it is the same notes again. Every stroke starts inside `durationSec`.
 */
export function cycled(
  durationSec: number,
  strokes: readonly Stroke[],
  { passes = 1, crossfadeSec = 0.25 }: { passes?: number; crossfadeSec?: number } = {},
): Pick<FactorySound, 'phrase' | 'durationSec' | 'skipSec' | 'loopCrossfadeSec' | 'loopFold'> {
  const notes = []
  for (let pass = 0; pass <= passes + 1; pass += 1) {
    for (const [atSec, durSec, note, gain] of strokes) {
      notes.push({ atSec: pass * durationSec + atSec, durSec, note, gain })
    }
  }
  return {
    phrase: { notes },
    durationSec,
    skipSec: passes * durationSec,
    loopCrossfadeSec: crossfadeSec,
    loopFold: 'linear',
  }
}

export const weather = (
  preset: string,
  params: Readonly<Record<string, number>> = {},
): PatchDevice => ({
  deviceId: 'atmosphere',
  preset,
  params: { attack: 0.5, width: 0.6, ...params },
})

export const bells = (
  preset: string,
  params: Readonly<Record<string, number>> = {},
): PatchDevice => ({
  deviceId: 'modal-bells',
  preset,
  params,
})

/** The felt piano of the single note and the phrase, in its own hall. */
export const FELT_PIANO: PatchDevice = {
  deviceId: 'felt-piano',
  preset: 'Hall',
  params: { felt: 0.7 },
}
