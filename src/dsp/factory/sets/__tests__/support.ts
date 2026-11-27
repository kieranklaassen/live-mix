// What the set of an instrument (../<id>.ts) is held to: its own test file and
// the bench it is written at (bench.test.ts) both read this.

import { describe, expect, it } from 'vitest'

import { measureAudio } from '../../../__tests__/render-support'
import { STOCK_WASM_DEVICES } from '../../../registry'
import {
  levelProblems,
  presetProblems,
  renderPackPreset,
  repeatedSettings,
} from '../../packs/__tests__/support'
import { type FactoryPreset } from '../../types'
import { setId, setPresets, setRows, type InstrumentSet } from '../set'

export const SET_LIMITS = {
  directions: 10,
  /** Presets in each direction. */
  rows: 50,
  /** Chains of effects and phrases of its own, at least. */
  chains: 40,
  phrases: 10,
  /** Presets on one chain, and presets of one effect, at most. */
  onOneChain: 25,
  onOneEffect: 150,
  /** Each of the instrument's own knobs is set by this many presets at least. */
  knob: 25,
  /** How near two presets may be on the phrase all are compared on, dB: the bank's own limit. */
  nearestDb: 1,
  /** One preset in so many is rendered by its test; all of them with FACTORY_PACKS=all, as the bench does. */
  rendered: 25,
} as const

export interface SetPreset {
  row: string
  preset: FactoryPreset
}

export function presetsWithRows(set: InstrumentSet): SetPreset[] {
  const rows = set.directions.flatMap(setRows)
  return setPresets(set).map((preset, index) => ({ preset, row: rows[index] }))
}

/** What a set breaks as a whole. */
export function setProblems(set: InstrumentSet, knobs: readonly string[]): string[] {
  const problems: string[] = []
  const presets = setPresets(set)
  if (set.directions.length !== SET_LIMITS.directions)
    problems.push(`${set.directions.length} directions`)
  for (const direction of set.directions) {
    const count = setRows(direction).length
    if (count !== SET_LIMITS.rows) problems.push(`${count} rows in ${direction.name}`)
  }
  const tally = (of: readonly string[]) => {
    const counts = new Map<string, number>()
    for (const one of of) counts.set(one, (counts.get(one) ?? 0) + 1)
    return counts
  }
  const rows = set.directions.flatMap(setRows)
  const chains = tally(rows.map((row) => row.split('|')[3].trim().split(' ')[0]))
  if (chains.size < SET_LIMITS.chains) problems.push(`${chains.size} chains in use`)
  for (const [id, count] of chains)
    if (count > SET_LIMITS.onOneChain) problems.push(`${count} presets on chain ${id}`)
  const effects = tally(presets.flatMap(({ effects }) => effects.map(({ deviceId }) => deviceId)))
  for (const [id, count] of effects)
    if (count > SET_LIMITS.onOneEffect) problems.push(`${count} presets with ${id}`)
  for (const id of Object.keys(set.chains)) if (!chains.has(id)) problems.push(`chain ${id} unused`)
  const phrases = new Set(rows.map((row) => row.split('|')[4].trim()).filter((id) => id !== '-'))
  if (phrases.size < SET_LIMITS.phrases) problems.push(`${phrases.size} phrases in use`)
  for (const id of Object.keys(set.phrases))
    if (!phrases.has(id)) problems.push(`phrase ${id} unused`)
  const set_ = tally(presets.flatMap(({ instrument }) => Object.keys(instrument.params ?? {})))
  for (const knob of knobs)
    if ((set_.get(knob) ?? 0) < SET_LIMITS.knob)
      problems.push(`knob ${knob} set by ${set_.get(knob) ?? 0}`)
  return problems
}

/** The tests of one instrument's set, called from `<id>.set.test.ts`. */
export function describeSet(set: InstrumentSet, knobs: readonly string[]): void {
  describe(`the set of ${set.device}`, () => {
    const presets = setPresets(set)

    it('is whole', () => {
      expect(setProblems(set, knobs)).toEqual([])
    })

    it("calls the choices of the instrument's knobs what the instrument does", () => {
      const device = STOCK_WASM_DEVICES.find(({ id }) => id === set.device)
      for (const [knob, names] of Object.entries(set.names))
        expect(names, knob).toEqual(device?.params[knob].choices)
    })

    it('names each preset once and sets no two alike', () => {
      expect(new Set(presets.map((preset) => preset.id)).size).toBe(presets.length)
      expect(new Set(presets.map((preset) => preset.name.toLowerCase())).size).toBe(presets.length)
      expect(repeatedSettings(presets), 'presets set exactly like another').toEqual([])
    })

    it('lists each preset properly', () => {
      const problems = presets.flatMap((preset) =>
        presetProblems(setId(set.device), preset).map((problem) => `${preset.id}: ${problem}`),
      )
      expect(problems).toEqual([])
    })

    const every = process.env.FACTORY_PACKS === 'all' ? 1 : SET_LIMITS.rendered
    it.each(
      presets
        .filter((_preset, index) => index % every === 0)
        .map((preset) => [preset.id, preset] as const),
    )(
      '%s plays at the level of the rest',
      async (_id, preset) => {
        const measured = measureAudio(await renderPackPreset(preset))
        expect(levelProblems(measured), JSON.stringify(measured)).toEqual([])
      },
      60_000,
    )
  })
}
