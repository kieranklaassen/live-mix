// The tempo a sound keeps. A sound with a beat to it (a drum loop, a pulse,
// a bass line) is written at one tempo, `FactorySound.bpm`, and played at any
// other by playing it faster or slower: every note comes sooner or later and
// is held shorter or longer, the sound is as many beats long as it was, and
// the audio is never stretched, so a drum is the same drum at 80 as at 140
// and only the gaps between the hits change. An echo set to a division of
// the beat, and an LFO that goes round with it, keep their place too.
//
// Everything here is arithmetic on the bank's own data: no audio.

import { type Patch, type PatchDevice, patchDeviceParams } from '../../core/devices/patch'
import { type Phrase } from '../patch-render'
import { describeStockWasmDevice } from '../registry'

/** The slowest and fastest a sound is ever played, beats per minute: what is asked for is kept inside them. */
export const FACTORY_TEMPO_RANGE = { min: 20, max: 480 } as const

/**
 * How many times longer everything in a sound written at `written` lasts at
 * `bpm`: 1.5 at 80 for a sound written at 120. Always 1 for a sound with no
 * tempo of its own, or when no tempo (or one that is no number) is asked for.
 */
export function tempoRatio(written: number | undefined, bpm: number | undefined): number {
  if (written === undefined || !(written > 0) || bpm === undefined || !Number.isFinite(bpm)) {
    return 1
  }
  return written / factoryTempo(bpm)
}

/** A tempo as a sound is played at it: kept inside `FACTORY_TEMPO_RANGE`. */
export function factoryTempo(bpm: number): number {
  return Math.min(FACTORY_TEMPO_RANGE.max, Math.max(FACTORY_TEMPO_RANGE.min, bpm))
}

/**
 * The parameters that are a length of time (ms or seconds: an echo's time) or
 * a rate (Hz: an LFO), and so move with the tempo of a sound that has one.
 */
const TIMED_PARAMS: Readonly<Record<string, Readonly<Record<string, 'time' | 'rate'>>>> = {
  // The wobble of the echo is an LFO too: it comes round with a loop only while it keeps to the beat.
  'analog-delay': { time: 'time', modRate: 'rate' },
  'tape-echo': { time: 'time' },
  'echo-memory': { time: 'time' },
  'reverse-delay': { time: 'time' },
  'grain-delay': { time: 'time' },
  tremolo: { rate: 'rate' },
  'auto-filter': { lfoRateHz: 'rate' },
}

function deviceAtTempo(device: PatchDevice, ratio: number): PatchDevice {
  // By the id of today: a patch may name the device by one it had before.
  const descriptor = describeStockWasmDevice(device.deviceId)
  const timed = descriptor && TIMED_PARAMS[descriptor.id]
  if (!timed || !descriptor) return device
  // What the device is set to as the patch stands: its own value, else its preset's, else the default.
  const current = patchDeviceParams(descriptor, device)
  const params: Record<string, number> = { ...device.params }
  for (const [name, kind] of Object.entries(timed)) {
    const spec = descriptor.params[name]
    if (!spec) continue
    let moved = kind === 'time' ? current[name] * ratio : current[name] / ratio
    // Out of the control's reach: the nearest octave of it that is inside, so
    // an echo that cannot be that long is half as long and still on the beat.
    while (moved > spec.max) moved /= 2
    while (moved < spec.min) moved *= 2
    params[name] = moved
  }
  return { ...device, params }
}

/** A patch with every echo time and LFO rate `ratio` times as long (see `tempoRatio`). */
export function patchAtTempo<T extends Pick<Patch, 'instrument' | 'effects'>>(
  patch: T,
  ratio: number,
): T {
  if (ratio === 1) return patch
  return {
    ...patch,
    ...(patch.instrument ? { instrument: deviceAtTempo(patch.instrument, ratio) } : {}),
    effects: patch.effects.map((effect) => deviceAtTempo(effect, ratio)),
  }
}

/** A phrase with every note `ratio` times as late and as long. */
export function phraseAtTempo(phrase: Phrase, ratio: number): Phrase {
  if (ratio === 1) return phrase
  return {
    ...phrase,
    notes: phrase.notes.map((note) => ({
      ...note,
      atSec: note.atSec * ratio,
      durSec: note.durSec * ratio,
    })),
  }
}
