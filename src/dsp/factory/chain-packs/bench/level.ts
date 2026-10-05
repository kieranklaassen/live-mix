// Brings a drawn chain to the level a pack plays at, with the chain's own
// controls: an output in decibels where an effect has one, else a mix turned
// down. What cannot be brought in is refused, not shipped loud.

import { patchDeviceParams, type PatchDevice } from '../../../../core/devices/patch'
import { rounded } from './draw'
import { benchEffect } from './effects'
import { LEXICON } from './lexicon'
import { CHAIN_BENCH_LIMITS, type ChainHearing } from './measure'

export const LEVEL = {
  /** Where a chain's loudness is aimed against the dry piano, LU: the middle of the bank's own chains. */
  aimLu: -0.5,
  /** How far from the aim it may sit before it is moved, LU. */
  slackLu: 2,
  /** Room left under the peak limit when a chain is turned down for its peak, dB. */
  peakRoomDb: 0.7,
  /** A trim smaller than this is not worth a parameter, dB. */
  leastDb: 0.3,
  /** The share of its preset's mix an effect keeps at least when it is turned down for level. */
  leastMix: 0.6,
  /** Rounds of measuring and trimming before a chain is given up. */
  rounds: 4,
} as const

/** Decibels the chain has to move to sit right on the piano; 0 when it is in place. */
export function keysTrim(heard: ChainHearing): number {
  let need = 0
  if (Math.abs(heard.lu - LEVEL.aimLu) > LEVEL.slackLu) need = LEVEL.aimLu - heard.lu
  const over = heard.measured.peakDb - (CHAIN_BENCH_LIMITS.peakDb - LEVEL.peakRoomDb)
  if (heard.measured.peakDb > CHAIN_BENCH_LIMITS.peakDb) need = Math.min(need, -over)
  return need
}

/** Decibels down the held chord or the bells ask for; 0 when they are inside their limits. */
export function otherTrim(heard: ChainHearing): number {
  let need = 0
  if (heard.lu > CHAIN_BENCH_LIMITS.otherLu) need = CHAIN_BENCH_LIMITS.otherLu - 1 - heard.lu
  if (heard.measured.peakDb > CHAIN_BENCH_LIMITS.otherPeakDb) {
    need = Math.min(need, CHAIN_BENCH_LIMITS.otherPeakDb - LEVEL.peakRoomDb - heard.measured.peakDb)
  }
  return need
}

/**
 * The chain moved by `db`, as nearly as its controls allow: from the last
 * effect back, the first output in decibels with room to move takes it; with
 * none, and only to turn down, the last effect's mix gives way. Undefined
 * when nothing can move it.
 */
export function trimmed(effects: readonly PatchDevice[], db: number): PatchDevice[] | undefined {
  if (Math.abs(db) < LEVEL.leastDb) return undefined
  const next = effects.map((effect) => ({ ...effect, params: { ...effect.params } }))
  let left = db
  for (let index = next.length - 1; index >= 0 && Math.abs(left) >= LEVEL.leastDb; index -= 1) {
    const effect = next[index]
    const descriptor = benchEffect(effect.deviceId)
    if (!descriptor) continue
    const now = patchDeviceParams(descriptor, effect)
    for (const trim of LEXICON.get(effect.deviceId)?.trim ?? []) {
      if (trim.kind !== 'db') continue
      const spec = descriptor.params[trim.param]
      const value = rounded(Math.min(spec.max, Math.max(spec.min, now[trim.param] + left)))
      if (Math.abs(value - now[trim.param]) < LEVEL.leastDb) continue
      left -= value - now[trim.param]
      effect.params[trim.param] = value
      break
    }
  }
  if (left < -LEVEL.leastDb) {
    // No output could take it all: the wet share of the last effect that has one comes down.
    for (let index = next.length - 1; index >= 0; index -= 1) {
      const effect = next[index]
      const descriptor = benchEffect(effect.deviceId)
      const trim = LEXICON.get(effect.deviceId)?.trim.find((entry) => entry.kind === 'mix')
      if (!descriptor || !trim) continue
      const spec = descriptor.params[trim.param]
      const now = patchDeviceParams(descriptor, effect)[trim.param]
      const preset = patchDeviceParams(descriptor, {
        deviceId: effect.deviceId,
        preset: effect.preset,
      })[trim.param]
      // An effect heard alone, with no dry sound, stays alone: its words say so.
      if (preset >= spec.max) continue
      // A mix far under its preset's is another chain than the one its words describe: it gives way a little, no more.
      const floor = Math.max(spec.min, preset * LEVEL.leastMix)
      const value = rounded(Math.max(floor, now * 10 ** (left / 20)))
      if (value >= rounded(now)) continue
      effect.params[trim.param] = value
      left = 0
      break
    }
  }
  if (Math.abs(left - db) < LEVEL.leastDb) return undefined
  return next.map((effect) => {
    const { params, ...rest } = effect
    return Object.keys(params).length > 0 ? { ...rest, params } : rest
  })
}
