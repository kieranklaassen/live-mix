// What the bank is held to beyond being valid, for its test (factory.test.ts)
// and for the bench it is written at (report.test.ts). A preset of the bank
// keeps to the levels of a pack preset (../packs/__tests__/support.ts), so the
// bank and the packs play at one loudness in one list.

import {
  type AudioMeasurement,
  printDistance,
  type SoundPrint,
} from '../../__tests__/render-support'
import { levelProblems } from '../packs/__tests__/support'

export const BANK_LIMITS = {
  /** Presets every instrument has at least. */
  perInstrument: 20,
  /** Chains every group has at least. */
  perChainGroup: 20,
  /** Characters of a description at most: it is one line at the foot of a list. */
  description: 140,
  /** Side over mid at most, dB: above it a preset loses more than half its level in mono. */
  widthDb: 0,
  /** Sample peak of a chain on the dry phrase at most, dBFS (the dry phrase peaks at -10.6). */
  chainPeakDb: -5,
  /** How far a chain's loudness may sit from the dry phrase's, LU. */
  chainLu: 4,
  /** Two presets of one instrument whose prints are closer than this are one sound under two names (`printDistance`), dB. */
  alikeDb: 1,
  /** The same for two chains on the dry phrase, which all carry that phrase and so sit closer together, dB. */
  chainAlikeDb: 0.3,
} as const

/**
 * Presets that shipped quieter than the limits and stay as they shipped: what
 * a preset loads does not change once someone may have saved a piece on it.
 */
export const QUIET_AS_SHIPPED: ReadonlySet<string> = new Set([
  'muted-echo-pattern',
  'muted-acoustic-echo',
])

/** A chain that shipped further from the dry level than the limit: a narrow radio band that fades by design. */
export const CHAIN_LEVEL_AS_SHIPPED: ReadonlySet<string> = new Set(['night-shortwave'])

/** Where a preset's raw preview leaves the bank's limits; empty when it is inside them. */
export function presetProblems(id: string, measured: AudioMeasurement): string[] {
  const problems = levelProblems(measured).filter(
    (problem) => !(problem === 'QUIET' && QUIET_AS_SHIPPED.has(id)),
  )
  if (measured.widthDb > BANK_LIMITS.widthDb) problems.push('WIDE')
  return problems
}

/** Where a chain on the dry phrase leaves the bank's limits; empty when it is inside them. */
export function chainProblems(
  id: string,
  measured: AudioMeasurement,
  dry: AudioMeasurement,
): string[] {
  const problems: string[] = []
  if (measured.peakDb > BANK_LIMITS.chainPeakDb) problems.push('PEAK')
  if (!CHAIN_LEVEL_AS_SHIPPED.has(id)) {
    if (measured.lufs - dry.lufs > BANK_LIMITS.chainLu) problems.push('LOUD')
    if (dry.lufs - measured.lufs > BANK_LIMITS.chainLu) problems.push('QUIET')
  }
  if (Math.abs(measured.dc) >= 0.01) problems.push('DC')
  return problems
}

/** For each print, the nearest other one and how far off it is, nearest pairs first. */
export function nearestPrints(
  prints: ReadonlyMap<string, SoundPrint>,
): { id: string; nearest: string; distance: number }[] {
  const entries = [...prints]
  return entries
    .map(([id, print]) => {
      let nearest = ''
      let distance = Infinity
      for (const [other, otherPrint] of entries) {
        if (other === id) continue
        const d = printDistance(print, otherPrint)
        if (d < distance) [nearest, distance] = [other, d]
      }
      return { id, nearest, distance }
    })
    .sort((a, b) => a.distance - b.distance)
}
