// The builder: draws a pack's hundred chains from its palette, brings each
// to level, measures it and keeps or refuses it, and writes the pack's
// module. Nothing is heard: a chain is kept on the bench's figures alone.
//
//   CHAIN_BENCH=bank pnpm vitest run src/dsp/factory/chain-packs/bench/build.test.ts
//     Measures the bank's own chains once, so that no pack repeats one of them.
//     CHAIN_BENCH_SHARD=0/4 splits it over processes.
//   CHAIN_BENCH=build CHAIN_BENCH_PACK=oxide pnpm vitest run .../build.test.ts
//     Draws what the pack still lacks (tmp/chain-bench/packs/oxide.json holds what it has),
//     writes tmp/chain-bench/oxide.txt and, once it has its hundred, ../oxide.ts.
//     CHAIN_BENCH_FRESH=1    forgets what the pack has and starts again.
//     CHAIN_BENCH_COUNT=20   a sample of twenty, measured, written to tmp/chain-bench/sample-oxide.txt only.
//     CHAIN_BENCH_DRY=1      draws and names without measuring: to read a palette's words.
//   CHAIN_BENCH=settle pnpm vitest run .../build.test.ts
//     Packs drawn side by side have not seen each other. This goes through them in the
//     order of the packs and takes out of each what an earlier pack already has: a name,
//     an id, the same effects on the same presets, or a sound within the twin limit. It also
//     holds every chain to the lexicon, the recipes and its palette as they are now (a preset
//     that no longer fits its slot goes; a sentence is said again in the lexicon's present
//     words), and takes out what a reader struck (tmp/chain-bench/struck.json).
//     Draw every pack again afterwards, one at a time: that fills what was taken out and
//     writes each module anew.
//
// Skipped in a normal run. The table of every preset alone (./probe.test.ts) has to be there.

import { existsSync, readFileSync } from 'node:fs'

import { format, resolveConfig } from 'prettier'
import { describe, expect, it } from 'vitest'

import { type PatchDevice } from '../../../../core/devices/patch'
import { FACTORY_CHAINS } from '../../chains'
import { FACTORY_PACKS } from '../../packs'
import { PACK_PRESETS } from '../../packs/all'
import { FACTORY_PRESETS } from '../../presets'
import { PACK_SOUNDS } from '../../sound-packs/all'
import { FACTORY_SOUNDS } from '../../sounds'
import { type FactoryChain, type FactoryChainCategory } from '../../types'
import {
  candidates,
  chainClash,
  chainTraits,
  drawChain,
  fits,
  freshState,
  key,
  noteDrawn,
  ownRecipe,
  sharedRecipes,
  signature,
  spread,
  type Candidate,
  type Drawn,
  type DrawRecipe,
} from './draw'
import { LEXICON } from './lexicon'
import { type Trait } from './lexicon/types'
import { keysTrim, LEVEL, otherTrim, trimmed } from './level'
import {
  BENCH_INPUTS,
  benchInputs,
  chainDistance,
  chainFaults,
  chainFacts,
  hearChain,
  hearingsFaults,
  keysFaults,
  stressChain,
  stressFaults,
  twinLimit,
  type ChainHearing,
} from './measure'
import { GROUPS, paletteProblems } from './palette-check'
import { type PackPalette } from './palettes/types'
import { seeded, seedOf, weighted } from './random'
import { RECIPES } from './recipes'
import {
  bankPath,
  BENCH_DIR,
  packPath,
  readBank,
  readOtherPacks,
  readPack,
  readProbe,
  write,
  type BankRow,
  type Kept,
  type Prints,
} from './store'
import { chainName, chainSentence, freshNames, nameNouns, nameStands, slug } from './words'

const mode = process.env.CHAIN_BENCH
const packId = process.env.CHAIN_BENCH_PACK ?? ''
const sample = Number(process.env.CHAIN_BENCH_COUNT ?? 0)
const dry = process.env.CHAIN_BENCH_DRY === '1'
const fresh = process.env.CHAIN_BENCH_FRESH === '1'
const [shard, shards] = (process.env.CHAIN_BENCH_SHARD ?? '0/1').split('/').map(Number)

const HOURS = 3 * 60 * 60 * 1000
const f = (value: number, digits = 1) => (Number.isFinite(value) ? value.toFixed(digits) : '-inf')

const printsOf = (on: Record<(typeof BENCH_INPUTS)[number], ChainHearing>): Prints => ({
  keys: { print: on.keys.print },
  pad: { print: on.pad.print },
  bells: { print: on.bells.print },
})

describe.skipIf(mode !== 'bank')('chain bench: the bank as the bench hears it', () => {
  it(
    'measures',
    async () => {
      const rows: BankRow[] = []
      for (const [index, chain] of FACTORY_CHAINS.entries()) {
        if (index % shards !== shard) continue
        const facts = await chainFacts(chain)
        rows.push({
          id: chain.id,
          name: chain.name,
          prints: printsOf(facts.on),
          faults: chainFaults(facts, chain.category),
        })
      }
      write(bankPath(shards > 1 ? `${shard}-of-${shards}` : ''), rows)
    },
    HOURS,
  )
})

const asChain = (
  effects: readonly PatchDevice[],
  category: FactoryChainCategory,
): FactoryChain => ({
  id: 'chain-bench',
  name: 'Chain bench',
  category,
  description: '',
  effects: [...effects],
})

interface Measured {
  effects: readonly PatchDevice[]
  on: Record<(typeof BENCH_INPUTS)[number], ChainHearing>
  nearest: [string, number]
  stress: Awaited<ReturnType<typeof stressChain>>
}

/** The prints every new chain is told from: the bank's, every other pack's and this pack's so far. */
type Known = { id: string; prints: Prints }[]

/** Level a drawn chain, measure it, and say why it is refused if it is. */
async function measure(drawn: Drawn, known: Known): Promise<Measured | string> {
  const [keys, pad, bells] = await benchInputs()
  let effects = drawn.effects
  const hear = async (input: typeof keys) => {
    try {
      return await hearChain(asChain(effects, drawn.category), input)
    } catch {
      return undefined
    }
  }
  let onKeys: ChainHearing | undefined
  for (let round = 0; round < LEVEL.rounds; round += 1) {
    onKeys = await hear(keys)
    if (!onKeys) return 'NAN on keys'
    if (!Number.isFinite(onKeys.measured.lufs)) return 'SILENT on keys'
    const next = trimmed(effects, keysTrim(onKeys))
    if (!next) break
    effects = next
    // The last round's trim is not left unmeasured.
    if (round === LEVEL.rounds - 1) onKeys = await hear(keys)
  }
  if (!onKeys) return 'NAN on keys'
  const early = keysFaults(onKeys)
  if (early.length > 0) return early[0]

  let onPad = await hear(pad)
  let onBells = await hear(bells)
  if (!onPad || !onBells) return 'NAN on pad or bells'
  const down = Math.min(otherTrim(onPad), otherTrim(onBells))
  const quieter = trimmed(effects, down)
  if (quieter) {
    effects = quieter
    ;[onKeys, onPad, onBells] = [await hear(keys), await hear(pad), await hear(bells)]
    if (!onKeys || !onPad || !onBells) return 'NAN after a trim'
  }
  const on = { keys: onKeys, pad: onPad, bells: onBells }
  const faults = hearingsFaults(on, drawn.category)
  if (faults.length > 0) return faults[0]

  const prints = printsOf(on)
  let nearest: [string, number] = ['', Infinity]
  for (const other of known) {
    const apart = chainDistance(prints, other.prints)
    if (apart < nearest[1]) nearest = [other.id, apart]
  }
  if (nearest[1] < twinLimit(drawn.category)) return 'TWIN of another chain'

  let stress: Measured['stress']
  try {
    stress = await stressChain(asChain(effects, drawn.category), keys)
  } catch {
    return 'NAN when pushed'
  }
  const holds = drawn.picks.some((pick) => pick.voice.traits.includes('frozen'))
  const pushed = stressFaults(stress, holds)
  if (pushed.length > 0) return pushed[0]
  return { effects, on, nearest, stress }
}

/**
 * What a word of a name that says something of the sound is held to: the
 * traits of the preset the chain is named for; hiss and a sound held for good
 * are the whole chain's wherever they come from.
 */
function nameTraits(picks: readonly Candidate[], lead: number): Set<Trait> {
  const whole = chainTraits(picks)
  const traits = new Set(picks[lead].voice.traits)
  for (const trait of ['noisy', 'frozen'] as const) if (whole.has(trait)) traits.add(trait)
  return traits
}

/** What the builder still has to draw for one group: the pack's own recipes first, then the shared ones. */
function scaled(count: number): number {
  return sample > 0 ? Math.max(1, Math.round((count * sample) / 100)) : count
}

const effectsLine = (effects: readonly PatchDevice[]) =>
  effects
    .map((effect) => {
      const params = Object.entries(effect.params ?? {})
        .map(([name, value]) => `${name} ${value}`)
        .join(', ')
      return `${effect.deviceId} "${effect.preset ?? ''}"${params && ` (${params})`}`
    })
    .join(' > ')

function percentiles(values: readonly number[]): string {
  if (values.length === 0) return 'none'
  const sorted = [...values].sort((a, b) => a - b)
  const at = (share: number) =>
    sorted[Math.min(sorted.length - 1, Math.floor(share * sorted.length))]
  return `least ${f(sorted[0])}, p10 ${f(at(0.1))}, p50 ${f(at(0.5))}, p90 ${f(at(0.9))}, most ${f(sorted[sorted.length - 1])}`
}

const tally = (map: Map<string, number>, id: string) => map.set(id, (map.get(id) ?? 0) + 1)
const ranked = (map: Map<string, number>) =>
  [...map].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

function report(
  palette: PackPalette,
  kept: readonly Kept[],
  refusals: Map<string, number>,
  short: string[],
  gaveUp: string[] = [],
) {
  const pack = FACTORY_PACKS.find((entry) => entry.id === palette.pack)
  const lines = [`# ${pack?.name ?? palette.pack}: ${kept.length} chains`, '']
  if (short.length > 0) lines.push(...short.map((line) => `SHORT ${line}`), '')
  if (gaveUp.length > 0) lines.push(...gaveUp.map((line) => `GAVE UP ${line}`), '')
  if (!dry) {
    lines.push(
      `Loudness on the piano, LU: ${percentiles(kept.map((row) => row.lu[0]))}`,
      `From the dry piano, dB: ${percentiles(kept.map((row) => row.fromDry[0]))}`,
      `To the nearest chain kept before it, dB: ${percentiles(kept.map((row) => row.nearest[1]).filter(Number.isFinite))}`,
      `Left after half a minute, dBFS: ${percentiles(kept.map((row) => row.restDb).filter(Number.isFinite))}`,
      '',
    )
  }
  lines.push(
    `Refused: ${
      ranked(refusals)
        .map(([why, count]) => `${why} ${count}`)
        .join(', ') || 'none'
    }`,
    '',
  )
  const devices = new Map<string, number>()
  const voices = new Map<string, number>()
  const recipes = new Map<string, number>()
  for (const row of kept) {
    tally(recipes, row.recipe)
    for (const [device, preset] of row.picks) {
      tally(devices, device)
      tally(voices, key(device, preset))
    }
  }
  lines.push(
    `Effects: ${ranked(devices)
      .map(([id, count]) => `${id} ${count}`)
      .join(', ')}`,
    '',
  )
  lines.push(
    `Presets used most: ${ranked(voices)
      .slice(0, 25)
      .map(([id, count]) => `${id} ${count}`)
      .join(', ')}`,
    `Presets used: ${voices.size}`,
    '',
    `Recipes: ${ranked(recipes)
      .map(([id, count]) => `${id} ${count}`)
      .join(', ')}`,
    '',
  )
  for (const group of GROUPS) {
    const rows = kept.filter((row) => row.chain.category === group)
    lines.push(`## ${group} (${rows.length})`, '')
    for (const row of rows) {
      lines.push(
        `${row.chain.name}  [${row.recipe}]`,
        `  ${row.chain.description}`,
        `  ${effectsLine(row.chain.effects)}`,
      )
      if (!dry) {
        lines.push(
          `  piano ${f(row.lu[0])} LU, chord ${f(row.lu[1])}, bells ${f(row.lu[2])}; ` +
            `${f(row.fromDry[0])} / ${f(row.fromDry[1])} / ${f(row.fromDry[2])} dB off dry; ` +
            `nearest ${row.nearest[0]} at ${f(row.nearest[1])} dB; left ${f(row.restDb, 0)} dBFS`,
        )
      }
      lines.push('')
    }
  }
  return lines.join('\n')
}

async function moduleSource(palette: PackPalette, kept: readonly Kept[]): Promise<string> {
  const pack = FACTORY_PACKS.find((entry) => entry.id === palette.pack)
  const chains = GROUPS.flatMap((group) =>
    kept.filter((row) => row.chain.category === group).map((row) => row.chain),
  )
  const source =
    `// ${pack?.name ?? palette.pack}: the pack's hundred effect chains. Drawn by the bench (./bench)\n` +
    `// from the pack's palette, brought to level and measured on three dry\n` +
    `// sounds; nobody has heard them. A chain that has shipped keeps its id, its\n` +
    `// name and every value (./__tests__/shipped).\n\n` +
    `import { type FactoryChain } from '../types'\n\n` +
    `export const CHAINS: readonly FactoryChain[] = ${JSON.stringify(chains)}\n`
  const path = `src/dsp/factory/chain-packs/${palette.pack}.ts`
  return format(source, { ...(await resolveConfig(path)), filepath: path })
}

describe.skipIf(mode !== 'build')('chain bench: a pack is drawn', () => {
  it(
    'draws',
    async () => {
      // eslint-disable-next-line no-restricted-syntax -- a palette is picked by the pack's id at run time
      const module: unknown = await import(`./palettes/${packId}.ts`)
      const { PALETTE: palette } = module as { PALETTE: PackPalette }
      expect(paletteProblems(palette)).toEqual([])

      const probe = readProbe()
      const pool = candidates(probe.refused)
      const cost = (candidate: Candidate) =>
        probe.cost.get(key(candidate.device, candidate.preset)) ?? 2
      const others = readOtherPacks(packId)
      // A sample and a dry run are trials: they start from nothing and leave the pack's file alone.
      const trial = sample > 0 || dry
      const file = fresh || trial ? { pack: packId, runs: 0, kept: [] } : readPack(packId)
      const random = seeded(seedOf(packId) + file.runs * 7919)

      const everyOther = others.flatMap((other) => other.kept)
      const state = freshState([
        ...FACTORY_CHAINS.map((chain) => signature(chain.effects)),
        ...everyOther.map((row) => signature(row.chain.effects)),
      ])
      const patches = [
        ...FACTORY_CHAINS,
        ...FACTORY_PRESETS,
        ...PACK_PRESETS,
        ...FACTORY_SOUNDS,
        ...PACK_SOUNDS,
        ...everyOther.map((row) => row.chain),
      ]
      const names = freshNames(
        patches.map((patch) => patch.name),
        patches.map((patch) => patch.id),
      )
      const known: Known = dry
        ? []
        : [
            ...readBank().map((row) => ({ id: row.id, prints: row.prints })),
            ...everyOther.map((row) => ({ id: row.chain.id, prints: row.prints })),
          ]

      // What the pack already has counts as drawn: its presets, its names and its words.
      const kept: Kept[] = []
      const voiceOf = (device: string, preset: string): Candidate | undefined => {
        const voice = LEXICON.get(device)?.voices[preset]
        return voice && { device, preset, voice }
      }
      for (const row of file.kept) {
        const picks = row.picks.map(([device, preset]) => voiceOf(device, preset))
        if (picks.some((pick) => pick === undefined)) continue
        noteDrawn(
          state,
          {
            recipe: row.recipe,
            category: row.chain.category,
            lead: row.lead,
            picks: picks as Candidate[],
            effects: row.chain.effects,
          },
          true,
        )
        names.taken.add(row.chain.name.toLowerCase())
        names.ids.add(row.chain.id)
        const [head, ...rest] = row.chain.name.split(' ')
        // Which of the two it was is not kept; counting both only makes the pack spread its words further.
        names.heads.set(head, (names.heads.get(head) ?? 0) + 1)
        names.tails.set(rest.join(' '), (names.tails.get(rest.join(' ')) ?? 0) + 1)
        known.push({ id: row.chain.id, prints: row.prints })
        kept.push(row)
      }

      const refusals = new Map<string, number>()
      const short: string[] = []
      const gaveUp: string[] = []
      for (const group of GROUPS) {
        const want = scaled(palette.groups[group])
        const have = () => kept.filter((row) => row.chain.category === group).length
        const queue: DrawRecipe[] = []
        for (const own of palette.own ?? []) {
          if (own.category !== group) continue
          const drawnAlready = kept.filter((row) => row.recipe === own.id).length
          for (let i = drawnAlready; i < scaled(own.count); i += 1) queue.push(ownRecipe(own))
        }
        const shared = sharedRecipes(palette, group)
        const misses = new Map<string, number>()
        let attempts = 0
        while (have() < want && attempts < want * 20 + 80) {
          attempts += 1
          const recipe =
            queue[0] ??
            weighted(
              random,
              shared,
              (entry) =>
                entry.weight * spread(state.recipes.get(entry.id) ?? 0, entry.weight) ** 0.5,
            )
          if (!recipe) break
          const refuse = (why: string) => {
            tally(refusals, why)
            if (queue[0] !== recipe) return
            tally(misses, recipe.id)
            // A pack's own recipe that will not come out gives its places to the shared ones.
            if ((misses.get(recipe.id) ?? 0) >= 12) {
              // On paper that is the palette's fault; measured, the bench refused what it drew and the shared recipes fill in.
              ;(dry ? short : gaveUp).push(
                `own recipe "${recipe.id}" gave up with ${queue.filter((entry) => entry.id === recipe.id).length} to draw`,
              )
              for (let i = queue.length - 1; i >= 0; i -= 1) {
                if (queue[i].id === recipe.id) queue.splice(i, 1)
              }
            }
          }
          const drawn = drawChain(random, palette, recipe, pool, state, cost)
          if (!drawn) {
            refuse('NOTHING to draw')
            continue
          }
          const measured = dry ? undefined : await measure(drawn, known)
          if (typeof measured === 'string') {
            noteDrawn(state, drawn, false)
            refuse(measured)
            continue
          }
          const lead = drawn.picks[drawn.lead]
          const name = chainName(
            random,
            palette,
            nameNouns(drawn.category, lead),
            nameTraits(drawn.picks, drawn.lead),
            names,
          )
          if (!name) {
            noteDrawn(state, drawn, false)
            refuse('NO NAME left')
            continue
          }
          const effects = measured?.effects ?? drawn.effects
          const chain: FactoryChain = {
            id: `${packId}-${slug(name)}`,
            name,
            category: drawn.category,
            description: chainSentence(
              drawn.picks,
              recipe.slots.map((slot) => slot.role),
            ),
            effects: [...effects],
          }
          noteDrawn(state, drawn, true)
          const on = measured?.on
          const row: Kept = {
            chain,
            recipe: drawn.recipe,
            lead: drawn.lead,
            picks: drawn.picks.map((pick) => [pick.device, pick.preset]),
            prints: on ? printsOf(on) : ({} as Prints),
            lu: on ? BENCH_INPUTS.map((id) => on[id].lu) : [],
            peakDb: on ? BENCH_INPUTS.map((id) => on[id].measured.peakDb) : [],
            fromDry: on ? BENCH_INPUTS.map((id) => on[id].fromDry) : [],
            growsDb: measured?.stress.growsDb ?? 0,
            ringsDb: measured?.stress.ringsDb ?? 0,
            hotPeakDb: measured?.stress.hotPeakDb ?? 0,
            restDb: measured?.stress.restDb ?? 0,
            nearest: measured?.nearest ?? ['', Infinity],
          }
          kept.push(row)
          if (on) known.push({ id: chain.id, prints: row.prints })
          if (queue[0] === recipe) queue.shift()
        }
        if (have() < want) short.push(`${group}: ${have()} of ${want}`)
      }

      const text = report(palette, kept, refusals, short, gaveUp)
      if (trial) {
        write(`${BENCH_DIR}/sample-${packId}.txt`, text)
        return
      }
      write(packPath(packId), { pack: packId, runs: file.runs + 1, kept })
      write(`${BENCH_DIR}/${packId}.txt`, text)
      if (short.length === 0) {
        write(`src/dsp/factory/chain-packs/${packId}.ts`, await moduleSource(palette, kept))
      }
      expect(short).toEqual([])
    },
    HOURS,
  )
})

/** Chains a reader struck by name, by pack: `{ "<pack id>": ["<chain name>", ...] }`. Not there until someone has read a pack. */
const STRUCK_PATH = `${BENCH_DIR}/struck.json`

describe.skipIf(mode !== 'settle')('chain bench: packs drawn side by side are told apart', () => {
  it('settles', async () => {
    const files = new Map(readOtherPacks('').map((file) => [file.pack, file]))
    const names = new Set(FACTORY_CHAINS.map((chain) => chain.name.toLowerCase()))
    const ids = new Set<string>()
    const signatures = new Set(FACTORY_CHAINS.map((chain) => signature(chain.effects)))
    const known: Known = readBank().map((row) => ({ id: row.id, prints: row.prints }))
    const struck = existsSync(STRUCK_PATH)
      ? (JSON.parse(readFileSync(STRUCK_PATH, 'utf8')) as Record<string, string[]>)
      : {}
    const shared = new Map(RECIPES.map((recipe) => [recipe.id, recipe]))
    const lines: string[] = []
    for (const pack of FACTORY_PACKS) {
      const file = files.get(pack.id)
      if (!file) continue
      // eslint-disable-next-line no-restricted-syntax -- a palette is picked by the pack's id at run time
      const module: unknown = await import(`./palettes/${pack.id}.ts`)
      const { PALETTE: palette } = module as { PALETTE: PackPalette }
      const own = new Map((palette.own ?? []).map((recipe) => [recipe.id, recipe]))
      const kept: Kept[] = []
      let reworded = 0
      for (const row of file.kept) {
        // The lexicon, the recipes and the palette may have been mended since the chain was drawn: it is held to them as they are now.
        const recipe = own.get(row.recipe) ?? shared.get(row.recipe)
        const picks = row.picks.map(([device, preset]): Candidate | undefined => {
          const voice = LEXICON.get(device)?.voices[preset]
          return voice && { device, preset, voice }
        })
        let why = ''
        if (struck[pack.id]?.includes(row.chain.name)) why = 'a reader struck it'
        else if (recipe?.slots.length !== picks.length) why = 'its recipe is gone'
        else if (picks.some((pick, index) => !pick || !fits(recipe.slots[index], pick)))
          why = 'a preset no longer fits its slot'
        else if (picks.filter((pick) => pick?.voice.traits.includes('heavy')).length > 1)
          why = 'two presets that each take the dry sound away'
        else if (!own.has(row.recipe) && chainClash(recipe, picks as Candidate[]))
          why = chainClash(recipe, picks as Candidate[]) ?? ''
        else if (
          !nameStands(
            palette,
            nameNouns(row.chain.category, (picks as Candidate[])[row.lead]),
            nameTraits(picks as Candidate[], row.lead),
            row.chain.name,
          )
        )
          why = 'its name is not one its words give any more'
        else if (names.has(row.chain.name.toLowerCase())) why = 'its name is taken'
        else if (ids.has(row.chain.id)) why = 'its id is taken'
        else if (signatures.has(signature(row.chain.effects)))
          why = 'its effects and presets are taken'
        else {
          const twin = known.find(
            (other) => chainDistance(row.prints, other.prints) < twinLimit(row.chain.category),
          )
          if (twin) why = `a twin of ${twin.id}`
        }
        if (why || !recipe) {
          lines.push(`${pack.id}: ${row.chain.name} out, ${why}`)
          continue
        }
        const sentence = chainSentence(
          picks as Candidate[],
          recipe.slots.map((slot) => slot.role),
        )
        if (sentence !== row.chain.description) {
          row.chain.description = sentence
          reworded += 1
        }
        names.add(row.chain.name.toLowerCase())
        ids.add(row.chain.id)
        signatures.add(signature(row.chain.effects))
        known.push({ id: row.chain.id, prints: row.prints })
        kept.push(row)
      }
      if (kept.length < file.kept.length || reworded > 0) {
        write(packPath(pack.id), { ...file, kept })
      }
      lines.push(
        `${pack.id}: ${kept.length} of ${file.kept.length} stay${reworded > 0 ? `, ${reworded} reworded` : ''}`,
      )
    }
    write(`${BENCH_DIR}/settle.txt`, lines.join('\n'))
  })
})
