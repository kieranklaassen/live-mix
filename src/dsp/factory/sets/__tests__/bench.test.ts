// Not a test: the bench the set of an instrument is written at. Skipped unless asked for.
//
//   SET_BENCH=<instrument id> [SET_ONLY=<part of an id>] pnpm vitest run src/dsp/factory/sets/__tests__/bench.test.ts
//     every preset of one set, with what it breaks in capitals: its words or its patch, its levels on
//     its own preview, its nearest neighbour in the set and in the bank, a name that is taken, and
//     what the set breaks as a whole. Only a preset whose patch or phrase changed is rendered again.
//     Written to tmp/bench/<id>.txt, with the level each preset's volume is off by in
//     tmp/bench/<id>.trim.json. SET_NAMES=<file> is a list of names that are taken: [name, id][].

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, it } from 'vitest'

import {
  measureAudio,
  printDistance,
  soundPrint,
  type SoundPrint,
} from '../../../__tests__/render-support'
import { STOCK_WASM_DEVICES } from '../../../registry'
import {
  levelProblems,
  patchSettings,
  presetProblems,
  renderCompared,
  renderPackPreset,
  repeatedSettings,
} from '../../packs/__tests__/support'
import { previewPhrase } from '../../phrases'
import { FACTORY_PRESETS } from '../../presets'
import { setId, setPresets, type InstrumentSet } from '../set'
import { SET_LIMITS, setProblems } from './support'

const asked = process.env.SET_BENCH ?? ''
const only = process.env.SET_ONLY ?? ''
const DIR = join('tmp', 'bench')

interface Kept {
  stamp: string
  name: string
  print: SoundPrint
  peakDb: number
  loudestDb: number
  dc: number
}
const read = <T>(file: string, none: T): T =>
  existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as T) : none
const rounded = (print: SoundPrint): SoundPrint => ({
  bands: print.bands.map((v) => Math.round(v * 10) / 10),
  level: print.level.map((v) => Math.round(v * 10) / 10),
  width: print.width.map((v) => Math.round(v * 10) / 10),
})

describe('set bench', () => {
  it.skipIf(asked === '')(
    'set',
    async () => {
      mkdirSync(DIR, { recursive: true })
      // eslint-disable-next-line no-restricted-syntax -- which set is asked for is only known when the bench runs
      const { SET } = (await import(`../${asked}.ts`)) as { SET: InstrumentSet }
      const knobs = Object.keys(
        STOCK_WASM_DEVICES.find((device) => device.id === asked)?.params ?? {},
      ).filter((knob) => knob !== 'volume')
      const lines: string[] = []
      const presets = [
        ...FACTORY_PRESETS.filter(({ instrument }) => instrument.deviceId === asked),
        ...setPresets(SET),
      ]
      const file = join(DIR, `${asked}.prints.json`)
      const kept = read<Record<string, Kept>>(file, {})
      const taken = new Map(
        read<[string, string][]>(process.env.SET_NAMES ?? '', []).map(([name, id]) => [
          name.toLowerCase(),
          id,
        ]),
      )
      const mine: Record<string, Kept> = {}
      const problemsOf = new Map<string, string[]>()
      const counts = { words: 0, level: 0, alike: 0, taken: 0 }
      let since = Date.now()
      for (const preset of presets) {
        const own = preset.id.startsWith(`${setId(asked)}-`)
        const problems = own ? presetProblems(setId(asked), preset) : []
        if (problems.length > 0) counts.words += 1
        const first = own ? taken.get(preset.name.toLowerCase()) : undefined
        if (first && first !== preset.id) {
          problems.push(`TAKEN by ${first}`)
          counts.taken += 1
        }
        problemsOf.set(preset.id, problems)
        const stamp = JSON.stringify([patchSettings(preset), previewPhrase(preset)])
        const known = kept[preset.id]
        let entry: Kept | undefined =
          known?.stamp === stamp ? { ...known, name: preset.name } : undefined
        if (!entry && problems.some((p) => p.startsWith('{') || p.includes('render'))) continue
        if (!entry && preset.id.includes(only)) {
          const { peakDb, loudestDb, dc } = measureAudio(await renderPackPreset(preset))
          const print = rounded(soundPrint(await renderCompared(preset)))
          entry = { stamp, name: preset.name, print, peakDb, loudestDb, dc }
          if (Date.now() - since > 30_000) {
            writeFileSync(file, JSON.stringify({ ...kept, ...mine }))
            since = Date.now()
          }
        }
        if (entry) mine[preset.id] = entry
      }
      writeFileSync(file, JSON.stringify(mine))
      const trims: Record<string, number> = {}
      const near: number[] = []
      for (const preset of presets) {
        const own = preset.id.startsWith(`${setId(asked)}-`)
        const entry = mine[preset.id]
        const problems = problemsOf.get(preset.id) ?? []
        if (!own) continue
        if (!entry) {
          if (problems.length > 0) lines.push(`${preset.id.padEnd(52)} !! ${problems.join(' | ')}`)
          continue
        }
        const { peakDb, loudestDb } = entry
        const level = levelProblems(entry as never)
        if (level.length > 0) {
          counts.level += 1
          trims[preset.name] = Math.round(Math.min(-26 - loudestDb, -8.7 - peakDb) * 2) / 2
        }
        problems.push(...level)
        let nearest = ['', Infinity] as [string, number]
        for (const [id, other] of Object.entries(mine)) {
          if (id === preset.id) continue
          const distance = printDistance(entry.print, other.print)
          if (distance < nearest[1]) nearest = [id, distance]
        }
        near.push(nearest[1])
        if (nearest[1] < SET_LIMITS.nearestDb) {
          problems.push('ALIKE')
          counts.alike += 1
        }
        lines.push(
          `${preset.id.padEnd(52)} peak ${peakDb.toFixed(1)} loud ${loudestDb.toFixed(1)}` +
            `  near ${nearest[1].toFixed(2)} ${nearest[0]}` +
            (problems.length > 0 ? `  !! ${problems.join(' | ')}` : ''),
        )
      }
      writeFileSync(join(DIR, `${asked}.trim.json`), JSON.stringify(trims))
      lines.push('')
      const own = setPresets(SET)
      for (const repeat of repeatedSettings(own)) lines.push(`!! SAME settings ${repeat}`)
      const names = own.map((p) => p.name.toLowerCase())
      for (const name of new Set(names.filter((n, i) => names.indexOf(n) !== i)))
        lines.push(`!! TWICE name "${name}"`)
      for (const problem of setProblems(SET, knobs)) lines.push(`!! SET ${problem}`)
      near.sort((a, b) => a - b)
      lines.push(
        `nearest neighbour: median ${(near[near.length >> 1] ?? 0).toFixed(2)} dB, tenth ${(near[Math.floor(near.length / 10)] ?? 0).toFixed(2)}`,
      )
      lines.push(
        `${own.length} presets; words ${counts.words}, level ${counts.level}, alike ${counts.alike}, taken ${counts.taken}`,
      )
      writeFileSync(join(DIR, `${asked}.txt`), lines.join('\n') + '\n')
    },
    7_200_000,
  )
})
