// What a pack's chains are held to, for its own test file (one per pack, so
// they run side by side). What can be read off a chain is checked for every
// one on every run; what needs it rendered is checked for every tenth, or
// for all of them with FACTORY_CHAIN_PACKS=all, which is how a pack is
// checked before it ships. The bench that draws a pack (../bench) holds every
// chain to tighter limits on three dry sounds before it is written at all.

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { validatePatch } from '../../../../core/devices/patch'
import { DeviceRegistry } from '../../../../core/devices/registry'
import { type PlanarAudio } from '../../../../core/render/encode'
import { compileFromDisk, measureAudio } from '../../../__tests__/render-support'
import { canRenderPatch, peakOf, renderPatch } from '../../../patch-render'
import { STOCK_WASM_DEVICES } from '../../../registry'
import { CHAIN_TEST_PATCH, CHAIN_TEST_PHRASE } from '../../__tests__/chain-input'
import { chainProblems } from '../../__tests__/support'
import { FACTORY_CHAIN_PACK_SIZE, factoryPack } from '../../packs'
import { patchSettings } from '../../packs/__tests__/support'
import { type FactoryChain, type FactoryChainCategory } from '../../types'

export const CHAIN_PACK_LIMITS = {
  /** Chains of each group a pack has at least, so every group can be asked of every pack. */
  perGroup: 5,
  /** Characters of a name at most: what the bank keeps its own chains to. */
  name: 20,
  /** Characters of a description at most: it is one line at the foot of a list. */
  description: 140,
  /** Effects of a chain: at least and at most. One effect on one preset is already in the list of effects. */
  effects: [2, 4],
} as const

export const CHAIN_GROUPS: readonly FactoryChainCategory[] = [
  'space',
  'echo',
  'tape',
  'motion',
  'texture',
  'pitch',
  'master',
]

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/
const registry = new DeviceRegistry(STOCK_WASM_DEVICES)
const node = { compile: compileFromDisk, sliceMs: 0 } as const
const everyChain = process.env.FACTORY_CHAIN_PACKS === 'all'

/** A chain as it is written: its effects, their presets and what each sets beside its preset. */
export function chainWritten(chain: FactoryChain): string {
  return JSON.stringify(
    chain.effects.map((effect) => [
      effect.deviceId,
      effect.preset ?? '',
      effect.bypass === true,
      Object.entries(effect.params ?? {}).sort(([a], [b]) => a.localeCompare(b)),
    ]),
  )
}

/** A chain's effects and their presets in order, whatever each sets beside its preset. */
export const chainSignature = (chain: FactoryChain): string =>
  chain.effects.map((effect) => `${effect.deviceId}:${effect.preset ?? ''}`).join(' > ')

/** What can be read off one chain that a pack's chain may not be: empty when it is in order. */
export function packChainProblems(pack: string, chain: FactoryChain): string[] {
  const problems: string[] = []
  if (!KEBAB.test(chain.id)) problems.push('ID not kebab-case')
  if (!chain.id.startsWith(`${pack}-`)) problems.push('ID does not start with its pack')
  if (chain.pack !== undefined && chain.pack !== pack) problems.push('PACK is another pack')
  if (chain.name.length < 3) problems.push('NAME too short')
  if (chain.name.length > CHAIN_PACK_LIMITS.name) {
    problems.push(`NAME is ${chain.name.length} of ${CHAIN_PACK_LIMITS.name} characters`)
  }
  if (/\d$/.test(chain.name)) problems.push('NAME ends in a number of a series')
  if (!/^[A-Z].{24,}\.$/.test(chain.description)) problems.push('WORDS a description is a sentence')
  if (chain.description.length > CHAIN_PACK_LIMITS.description) {
    problems.push(
      `WORDS description is ${chain.description.length} of ${CHAIN_PACK_LIMITS.description} characters`,
    )
  }
  if (!CHAIN_GROUPS.includes(chain.category)) problems.push(`GROUP "${chain.category}" is not one`)
  if ('instrument' in chain && chain.instrument !== undefined)
    problems.push('INSTRUMENT on a chain')
  const [least, most] = CHAIN_PACK_LIMITS.effects
  if (chain.effects.length < least || chain.effects.length > most) {
    problems.push(`EFFECTS ${chain.effects.length}, ${least} to ${most}`)
  }
  const devices = chain.effects.map((effect) => effect.deviceId)
  if (new Set(devices).size !== devices.length) problems.push('EFFECTS one effect twice')
  if (chain.effects.some((effect) => effect.preset === undefined)) {
    problems.push('PRESET an effect without one')
  }
  for (const issue of validatePatch(chain, registry)) {
    problems.push(`INVALID ${issue.path} ${issue.message}`)
  }
  if (!canRenderPatch(chain)) problems.push('INVALID a device that is not a WASM device')
  return problems
}

/** What a pack's chains break as a whole: empty when the pack is in order. A pack not yet drawn has none. */
export function chainPackProblems(chains: readonly FactoryChain[]): string[] {
  const problems: string[] = []
  if (chains.length === 0) return problems
  if (chains.length !== FACTORY_CHAIN_PACK_SIZE) {
    problems.push(`COUNT ${chains.length} of ${FACTORY_CHAIN_PACK_SIZE}`)
  }
  for (const group of CHAIN_GROUPS) {
    const count = chains.filter((chain) => chain.category === group).length
    if (count < CHAIN_PACK_LIMITS.perGroup) {
      problems.push(`SHORT ${group}: ${count} of ${CHAIN_PACK_LIMITS.perGroup} at least`)
    }
  }
  const twice = (values: readonly string[]): string[] => [
    ...new Set(values.filter((value, index) => values.indexOf(value) !== index)),
  ]
  for (const id of twice(chains.map((chain) => chain.id))) problems.push(`TWICE id ${id}`)
  for (const name of twice(chains.map((chain) => chain.name.toLowerCase()))) {
    problems.push(`TWICE name "${name}"`)
  }
  for (const signature of twice(chains.map(chainSignature))) {
    problems.push(`SAME effects on the same presets: ${signature}`)
  }
  for (const settings of twice(chains.map((chain) => patchSettings(chain)))) {
    const ids = chains.filter((chain) => patchSettings(chain) === settings).map((chain) => chain.id)
    problems.push(`SAME settings: ${ids.join(' = ')}`)
  }
  return problems
}

interface ShippedChain {
  name: string
  /** A digest of the chain as it is written (`chainWritten`). */
  written: string
}

const asShipped = (chain: FactoryChain): ShippedChain => ({
  name: chain.name,
  written: createHash('sha256').update(chainWritten(chain)).digest('hex').slice(0, 16),
})

const shippedFile = (pack: string): string =>
  join(dirname(fileURLToPath(import.meta.url)), 'shipped', `${pack}.json`)

/**
 * The pack's chains that have shipped, by id. A host may keep a chain's id
 * (a favourite, a recent one), and whoever loaded it once expects the same
 * effects on the same settings under the same name. With
 * UPDATE_SHIPPED_CHAINS set, chains that have no row yet are given one
 * first; a row that is there is never changed.
 */
function shippedChains(
  pack: string,
  chains: readonly FactoryChain[],
): Record<string, ShippedChain> {
  const file = shippedFile(pack)
  const shipped = existsSync(file)
    ? (JSON.parse(readFileSync(file, 'utf8')) as Record<string, ShippedChain>)
    : {}
  if (process.env.UPDATE_SHIPPED_CHAINS && chains.length > 0) {
    for (const chain of chains) shipped[chain.id] ??= asShipped(chain)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, `${JSON.stringify(shipped, null, 2)}\n`)
  }
  return shipped
}

/**
 * The tests of one pack's chains: called from `<pack id>.chains.test.ts`
 * with the chains as its own module lists them, so a pack is tested without
 * the others being read.
 */
export function describeChainPack(packId: string, chains: readonly FactoryChain[]): void {
  describe(`chains of pack ${packId}`, () => {
    it('holds as many chains as the list of packs says it does', () => {
      const pack = factoryPack(packId)
      expect(pack, `pack ${packId} is listed in FACTORY_PACKS`).toBeDefined()
      expect(pack?.chains, 'what FACTORY_PACKS says the pack holds').toBe(chains.length)
    })

    it('is a whole pack with every group in it, or not drawn yet', () => {
      expect(chainPackProblems(chains)).toEqual([])
    })

    it('keeps every chain that has shipped under its id, with its name and every value', () => {
      const shipped = shippedChains(packId, chains)
      const now = new Map(chains.map((chain) => [chain.id, asShipped(chain)]))
      for (const [id, row] of Object.entries(shipped)) {
        expect(now.get(id), `pack chain ${id}`).toEqual(row)
      }
      const missing = chains.filter((chain) => !(chain.id in shipped)).map((chain) => chain.id)
      expect(missing, 'add them with UPDATE_SHIPPED_CHAINS=1').toEqual([])
    })

    it('writes every chain as a pack chain is written', () => {
      const problems = chains.flatMap((chain) =>
        packChainProblems(packId, chain).map((problem) => `${chain.id}: ${problem}`),
      )
      expect(problems).toEqual([])
    })

    const rendered = chains.filter((_, index) => everyChain || index % 10 === 0)
    let dry: PlanarAudio | undefined
    it.skipIf(rendered.length === 0).each(rendered.map((chain) => [chain.id, chain] as const))(
      '%s changes the sound without changing its level much',
      async (_id, chain) => {
        dry ??= await renderPatch(CHAIN_TEST_PATCH, {
          ...node,
          phrase: CHAIN_TEST_PHRASE,
          durationSec: 10,
        })
        const wet = await renderPatch(chain, { ...node, input: dry, durationSec: 10 })
        expect(Number.isFinite(peakOf(wet.channels))).toBe(true)
        const after = measureAudio(wet)
        expect(chainProblems(chain.id, after, measureAudio(dry)), JSON.stringify(after)).toEqual([])
        let difference = 0
        for (let i = 0; i < wet.channels[0].length; i += 1) {
          difference = Math.max(difference, Math.abs(wet.channels[0][i] - dry.channels[0][i]))
        }
        expect(difference, 'what the chain changes').toBeGreaterThan(0.002)
      },
      // A render is under a second on a quiet machine; a runner that renders several packs at once is not one.
      60_000,
    )
  })
}
