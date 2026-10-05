// What the bench keeps between runs, under tmp/chain-bench (not in the
// repository): the table of every preset alone, the bank's own chains as the
// bench hears them, and every pack's chains as they were drawn and measured.
// A pack's module (../<pack id>.ts) is written from its file here.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'

import { type FactoryChain } from '../../types'
import { key } from './draw'
import { type BenchInputId, type BenchPrint } from './measure'

export const BENCH_DIR = 'tmp/chain-bench'
const PACKS_DIR = `${BENCH_DIR}/packs`

export type Prints = Record<BenchInputId, { print: BenchPrint }>

/** One chain as the bench kept it. */
export interface Kept {
  chain: FactoryChain
  recipe: string
  lead: number
  /** Each effect's preset as it was drawn, `[device id, preset name]`. */
  picks: [string, string][]
  prints: Prints
  /** Loudness against the dry sound on the piano, the chord and the bells, LU. */
  lu: number[]
  /** Sample peak on the same three, dBFS. */
  peakDb: number[]
  /** How far it is from each dry sound, dB. */
  fromDry: number[]
  growsDb: number
  ringsDb: number
  hotPeakDb: number
  restDb: number
  /** The chain it is nearest to among all that were kept before it, and how far, dB. */
  nearest: [string, number]
}

export interface PackFile {
  pack: string
  /** How many times the builder has run on it: each run draws on from where the last stopped. */
  runs: number
  kept: Kept[]
}

const read = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T

export function write(path: string, value: unknown): void {
  mkdirSync(path.slice(0, path.lastIndexOf('/')), { recursive: true })
  writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value))
}

export const packPath = (pack: string) => `${PACKS_DIR}/${pack}.json`

export function readPack(pack: string): PackFile {
  return existsSync(packPath(pack)) ? read<PackFile>(packPath(pack)) : { pack, runs: 0, kept: [] }
}

/** Every pack the bench has a file for, but `except`. */
export function readOtherPacks(except: string): PackFile[] {
  if (!existsSync(PACKS_DIR)) return []
  return readdirSync(PACKS_DIR)
    .filter((name) => name.endsWith('.json') && name !== `${except}.json`)
    .sort()
    .map((name) => read<PackFile>(`${PACKS_DIR}/${name}`))
}

interface ProbeRow {
  device: string
  preset: string
  faults: string[]
  facts: { costPct: number }
}

export interface Probe {
  /** Presets that are silent, not finite or running away by themselves: `"<device>:<preset>"`. */
  refused: Set<string>
  /** What each preset costs alone, percent of real time. */
  cost: Map<string, number>
}

/** The table ./probe.test.ts wrote; it has to have been run. */
export function readProbe(): Probe {
  const files = existsSync(BENCH_DIR)
    ? readdirSync(BENCH_DIR).filter((name) => /^probe-.*\.json$/.test(name))
    : []
  if (files.length === 0) {
    throw new Error('chain bench: no table of the presets alone; run the probe first')
  }
  const refused = new Set<string>()
  const cost = new Map<string, number>()
  for (const file of files) {
    for (const row of read<ProbeRow[]>(`${BENCH_DIR}/${file}`)) {
      const id = key(row.device, row.preset)
      cost.set(id, row.facts.costPct)
      if (row.faults.some((fault) => /^(GROWS|NAN|SILENT)/.test(fault))) refused.add(id)
    }
  }
  return { refused, cost }
}

/** One of the bank's own chains as the bench hears it. */
export interface BankRow {
  id: string
  name: string
  prints: Prints
  faults: string[]
}

/** Where the bank's rows go: one file, or one per shard of a run split over several processes. */
export const bankPath = (shard = '') => `${BENCH_DIR}/bank${shard && `-${shard}`}.json`

export function readBank(): BankRow[] {
  const files = existsSync(BENCH_DIR)
    ? readdirSync(BENCH_DIR).filter((name) => /^bank(-.*)?\.json$/.test(name))
    : []
  if (files.length === 0) {
    throw new Error('chain bench: the bank is not measured yet; run CHAIN_BENCH=bank first')
  }
  const rows = new Map<string, BankRow>()
  for (const file of files.sort()) {
    for (const row of read<BankRow[]>(`${BENCH_DIR}/${file}`)) rows.set(row.id, row)
  }
  return [...rows.values()]
}
