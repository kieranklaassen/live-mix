// The bench's first table: every preset of every effect by itself, on the
// three dry sounds and pushed. It is what the lexicon (./lexicon) is written
// from and what the builder leaves out of every pack before it draws: a
// preset that is silent, runs away or roars alone does the same in a chain.
//
//   CHAIN_BENCH=probe pnpm vitest run src/dsp/factory/chain-packs/bench/probe.test.ts
//   CHAIN_BENCH=probe CHAIN_BENCH_DEVICE=tape-loop ...      one device
//   CHAIN_BENCH=probe CHAIN_BENCH_SHARD=0/4 ...             a quarter of the devices
//
// Skipped in a normal run. Writes tmp/chain-bench/probe-<shard or device>.json and .txt.

import { mkdirSync, writeFileSync } from 'node:fs'

import { describe, it } from 'vitest'

import { type FactoryChain } from '../../types'
import { BENCH_EFFECTS, presetNames } from './effects'
import { BENCH_INPUTS, chainFacts, chainFaults, type ChainFacts } from './measure'

const on = process.env.CHAIN_BENCH === 'probe'
const onlyDevice = process.env.CHAIN_BENCH_DEVICE
const [shard, shards] = (process.env.CHAIN_BENCH_SHARD ?? '0/1').split('/').map(Number)

export interface ProbeRow {
  device: string
  preset: string
  faults: string[]
  facts: {
    on: Record<
      string,
      {
        lu: number
        fromDry: number
        peakDb: number
        tailDb: number
        centroidHz: number
        widthDb: number
        attackSec: number
      }
    >
    growsDb: number
    ringsDb: number
    hotPeakDb: number
    restDb: number
    costPct: number
  }
}

const f = (value: number, digits = 1) => (Number.isFinite(value) ? value.toFixed(digits) : '-inf')

function row(device: string, preset: string, facts: ChainFacts): ProbeRow {
  return {
    device,
    preset,
    faults: chainFaults(facts, 'texture'),
    facts: {
      on: Object.fromEntries(
        BENCH_INPUTS.map((id) => {
          const heard = facts.on[id]
          return [
            id,
            {
              lu: heard.lu,
              fromDry: heard.fromDry,
              peakDb: heard.measured.peakDb,
              tailDb: heard.measured.tailDb,
              centroidHz: heard.measured.centroidHz,
              widthDb: heard.measured.widthDb,
              attackSec: heard.measured.attackSec,
            },
          ]
        }),
      ),
      growsDb: facts.stress.growsDb,
      ringsDb: facts.stress.ringsDb,
      hotPeakDb: facts.stress.hotPeakDb,
      restDb: facts.stress.restDb,
      costPct: Math.max(...BENCH_INPUTS.map((id) => facts.on[id].costPct)),
    },
  }
}

function line(r: ProbeRow): string {
  const each = BENCH_INPUTS.map((id) => {
    const heard = r.facts.on[id]
    return `${id} ${f(heard.lu)} LU, ${f(heard.fromDry)} dB off dry, tail ${f(heard.tailDb, 0)} dB, centroid ${f(heard.centroidHz, 0)} Hz, width ${f(heard.widthDb, 0)} dB`
  }).join(' | ')
  return (
    `  "${r.preset}": ${each} | half a minute on: ${f(r.facts.ringsDb, 0)} dB of its loudest, ` +
    `left ${f(r.facts.restDb, 0)} dBFS, ${f(r.facts.costPct)}% rt` +
    (r.faults.length > 0 ? `  [${r.faults.join(', ')}]` : '')
  )
}

describe.skipIf(!on)('chain bench: every effect preset alone', () => {
  it('probes', async () => {
    const effects = BENCH_EFFECTS.filter(
      (device) => !onlyDevice || device.id === onlyDevice,
    ).filter((_, index) => index % shards === shard)
    const rows: ProbeRow[] = []
    const text: string[] = []
    for (const device of effects) {
      text.push(`## ${device.id}`)
      for (const preset of presetNames(device)) {
        const chain: FactoryChain = {
          id: 'probe',
          name: 'Probe',
          category: 'texture',
          description: '',
          effects: [{ deviceId: device.id, preset }],
        }
        const r = row(device.id, preset, await chainFacts(chain))
        rows.push(r)
        text.push(line(r))
      }
      text.push('')
    }
    mkdirSync('tmp/chain-bench', { recursive: true })
    const tag = onlyDevice ?? `${shard}-of-${shards}`
    writeFileSync(`tmp/chain-bench/probe-${tag}.json`, JSON.stringify(rows))
    writeFileSync(`tmp/chain-bench/probe-${tag}.txt`, `${text.join('\n')}\n`)
  }, 3_600_000)
})
