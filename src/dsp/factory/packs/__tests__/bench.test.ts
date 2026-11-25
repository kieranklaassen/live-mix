// Not a test: the bench a pack of one thing is written at. Skipped unless asked for.
//
//   PACK_BENCH=<pack id> [PACK_ONLY=<part of an id>] pnpm vitest run src/dsp/factory/packs/__tests__/bench.test.ts
//     every preset of one pack (../<pack id>.ts, read alone), in capitals where it breaks something:
//     what its words or its patch break, its levels on its own preview, its nearest neighbour of the
//     same instrument in the pack, in the rest of the library and in any other pack that has been at
//     the bench, names that are taken, and what the pack breaks as a whole. Only a preset whose patch
//     or phrase changed is rendered again. Written to tmp/bench/<pack id>.txt, with the level each
//     preset's volume is off by in tmp/bench/<pack id>.trim.json
//   PACK_BENCH=library PACK_SHARD=<n>/<of> pnpm vitest run …
//     the prints of everything that has shipped, once, before any pack is at the bench

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, it } from 'vitest'

import {
  measureAudio,
  printDistance,
  soundPrint,
  type SoundPrint,
} from '../../../__tests__/render-support'
import { previewPhrase } from '../../phrases'
import { FACTORY_PRESETS } from '../../presets'
import { type FactoryPreset } from '../../types'
import { FACTORY_PACK_SIZE, loadFactoryPacks } from '../index'
import {
  FOCUSED_LIMITS,
  focusProblems,
  levelProblems,
  patchSettings,
  presetProblems,
  renderCompared,
  renderPackPreset,
  repeatedSettings,
} from './support'

const asked = process.env.PACK_BENCH ?? ''
const only = process.env.PACK_ONLY ?? ''
const DIR = join('tmp', 'bench')

interface Kept {
  stamp: string
  deviceId: string
  name: string
  print: SoundPrint
  peakDb?: number
  loudestDb?: number
  dc?: number
}
type Prints = Record<string, Kept>

const rounded = (print: SoundPrint): SoundPrint => ({
  bands: print.bands.map((v) => Math.round(v * 10) / 10),
  level: print.level.map((v) => Math.round(v * 10) / 10),
  width: print.width.map((v) => Math.round(v * 10) / 10),
})
const read = (file: string): Prints =>
  existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Prints) : {}

/** Words that name a maker, a product, a player or a record: none is in a name or a line of the library. */
const NAMED =
  /\b(roland|moog|yamaha|korg|rhodes|wurlitzer|steinway|fender|gibson|juno|jupiter|prophet|oberheim|mellotron|hammond|leslie|buchla|eventide|lexicon|strymon|boss|ableton|suzuki|omnichord|solina|casio|akai|technics|bosendorfer|bechstein|bluthner|neumann|neve|ssl|marshall|vox|eno|budd|reich|satie|debussy|ravel|bach|chopin|coltrane|coleman|evans|messiaen|feldman|ligeti|cage|takemitsu|schubert|purcell|monteverdi|machaut|dufay|ockeghem|bartok|kodaly|riley|oliveros|radigue|partch|harrison|tallis|byrd|dowland|couperin|rameau|scriabin|stravinsky|wagner|beatles|radiohead|aphex|burial|grouper|basinski|hecker|sakamoto|frahm|arnalds)\b/i

describe('pack bench', () => {
  it.skipIf(asked !== 'library')(
    'library',
    async () => {
      mkdirSync(DIR, { recursive: true })
      const [shard, of] = (process.env.PACK_SHARD ?? '1/1').split('/').map(Number)
      const shipped = [...FACTORY_PRESETS, ...(await loadFactoryPacks())]
      const file = join(DIR, `library-${shard}.prints.json`)
      const prints = read(file)
      for (const preset of shipped.filter((_p, index) => index % of === shard - 1)) {
        const stamp = patchSettings(preset)
        if (prints[preset.id]?.stamp === stamp.length + ':' + stamp.slice(0, 60)) continue
        prints[preset.id] = {
          stamp: stamp.length + ':' + stamp.slice(0, 60),
          deviceId: preset.instrument.deviceId,
          name: preset.name,
          print: rounded(soundPrint(await renderCompared(preset))),
        }
      }
      writeFileSync(file, JSON.stringify(prints))
    },
    7_200_000,
  )

  it.skipIf(asked === '' || asked === 'library')(
    'pack',
    async () => {
      mkdirSync(DIR, { recursive: true })
      // Its own module and no other, so one pack is measured while another is being written.
      // eslint-disable-next-line no-restricted-syntax -- which pack is asked for is only known when the bench runs
      const { PRESETS } = (await import(`../${asked}.ts`)) as { PRESETS: readonly FactoryPreset[] }
      const lines: string[] = []
      const say = (line: string) => lines.push(line)
      const file = join(DIR, `${asked}.prints.json`)
      const kept = read(file)
      const taken = new Map<string, string>()
      const others: [string, Kept][] = []
      for (const other of readdirSync(DIR)) {
        if (!other.endsWith('.prints.json') || other === `${asked}.prints.json`) continue
        for (const [id, entry] of Object.entries(read(join(DIR, other)))) {
          others.push([id, entry])
          taken.set(entry.name.toLowerCase(), id)
        }
      }
      const mine: Prints = {}
      const trims: Record<string, number> = {}
      const counts = { words: 0, level: 0, alike: 0, taken: 0 }
      for (const preset of PRESETS) {
        const problems = presetProblems(asked, preset)
        counts.words += problems.length > 0 ? 1 : 0
        if (NAMED.test(`${preset.name} ${preset.description}`)) problems.push('NAMED')
        const first = taken.get(preset.name.toLowerCase())
        if (first) {
          problems.push(`TAKEN by ${first}`)
          counts.taken += 1
        }
        const stamp = JSON.stringify([patchSettings(preset), previewPhrase(preset)])
        const known = kept[preset.id]
        let entry: Kept | undefined =
          known?.stamp === stamp ? { ...known, name: preset.name } : undefined
        if (!entry && problems.some((p) => p.startsWith('{') || p.includes('render'))) {
          say(`${preset.id.padEnd(46)} ${problems.join(' | ')}`)
          continue
        }
        if (!entry && preset.id.includes(only)) {
          const measured = measureAudio(await renderPackPreset(preset))
          entry = {
            stamp,
            deviceId: preset.instrument.deviceId,
            name: preset.name,
            print: rounded(soundPrint(await renderCompared(preset))),
            peakDb: measured.peakDb,
            loudestDb: measured.loudestDb,
            dc: measured.dc,
          }
        }
        if (!entry) continue
        mine[preset.id] = entry
        const { peakDb = 0, loudestDb = 0, dc = 0 } = entry
        const level = levelProblems({ peakDb, loudestDb, dc } as never)
        counts.level += level.length > 0 ? 1 : 0
        // Up or down to the middle of the band, and under the peak whatever that leaves.
        if (level.length > 0)
          trims[preset.id] = Math.round(Math.min(-26 - loudestDb, -8.7 - peakDb) * 2) / 2
        problems.push(...level)
        const near = (from: [string, Kept][]) =>
          from
            .filter(([id, e]) => id !== preset.id && e.deviceId === entry.deviceId)
            .map(([id, e]) => [id, printDistance(entry.print, e.print)] as const)
            .sort((a, b) => a[1] - b[1])[0]
        const own = near(Object.entries(mine))
        const out = near(others)
        const nearest = own && (!out || own[1] < out[1]) ? own : out
        if (nearest && nearest[1] < FOCUSED_LIMITS.nearestDb) {
          problems.push('ALIKE')
          counts.alike += 1
        }
        say(
          `${preset.id.padEnd(46)} ${entry.deviceId.padEnd(16)} peak ${peakDb.toFixed(1)} loud ${loudestDb.toFixed(1)}` +
            `  near ${nearest ? `${nearest[1].toFixed(2)} ${nearest[0]}` : '-'}` +
            (problems.length > 0 ? `  !! ${problems.join(' | ')}` : ''),
        )
      }
      writeFileSync(file, JSON.stringify(mine))
      writeFileSync(join(DIR, `${asked}.trim.json`), JSON.stringify(trims))
      say('')
      for (const repeat of repeatedSettings(PRESETS)) say(`!! SAME settings ${repeat}`)
      const names = PRESETS.map((p) => p.name.toLowerCase())
      for (const name of new Set(names.filter((n, i) => names.indexOf(n) !== i)))
        say(`!! TWICE name "${name}"`)
      const ids = PRESETS.map((p) => p.id)
      for (const id of new Set(ids.filter((n, i) => ids.indexOf(n) !== i))) say(`!! TWICE id ${id}`)
      for (const problem of focusProblems(PRESETS)) say(`!! PACK ${problem}`)
      const tally = new Map<string, number>()
      for (const p of PRESETS)
        tally.set(p.instrument.deviceId, (tally.get(p.instrument.deviceId) ?? 0) + 1)
      say(
        `instruments: ${[...tally]
          .sort((a, b) => b[1] - a[1])
          .map(([id, n]) => `${id} ${n}`)
          .join(', ')}`,
      )
      const fx = new Map<string, number>()
      for (const p of PRESETS)
        for (const e of p.effects) fx.set(e.deviceId, (fx.get(e.deviceId) ?? 0) + 1)
      say(
        `effects: ${[...fx]
          .sort((a, b) => b[1] - a[1])
          .map(([id, n]) => `${id} ${n}`)
          .join(', ')}`,
      )
      say(
        `${PRESETS.length} of ${FACTORY_PACK_SIZE} presets; words ${counts.words}, level ${counts.level}, alike ${counts.alike}, taken ${counts.taken}`,
      )
      writeFileSync(join(DIR, `${asked}.txt`), lines.join('\n') + '\n')
    },
    3_600_000,
  )
})
