// Not a test: the bench the factory bank is written at. Skipped unless asked for.
//
//   FACTORY_REPORT=devices pnpm vitest run src/dsp/factory/__tests__/report.test.ts
//     every stock WASM device with its parameters and presets
//   FACTORY_REPORT=presets [FACTORY=<part of an id>] [FACTORY_DEVICE=<instrument id>] [FACTORY_CATEGORY=<group>] pnpm vitest run …
//     each preset's preview as it leaves the patch (not normalised), measured
//   FACTORY_REPORT=sounds [FACTORY=<part of an id>] [FACTORY_NUMBERS=<first>-<last>] pnpm vitest run …
//     each factory sound as rendered, measured and classified, with how it starts, ends and
//     comes round, and in capitals where it leaves what a sound is held to (KIND, QUIET, LOUD,
//     DC, WIDE, NAME over 24 characters in some key, SLOW over 12 % of real time; a loop: SEAM,
//     FOLD over 1.5 dB; a sound that ends: STEP-IN, CUT, LATE)
//   FACTORY_REPORT=chains [FACTORY=<part of an id>] pnpm vitest run …
//     each effect chain on a dry piano phrase, measured against the dry phrase
//   FACTORY_REPORT=generated [FACTORY=<kind>] [FACTORY_SEEDS=<how many, default 8>] [FACTORY_FROM=<first seed>] pnpm vitest run …
//     generated sounds, that many seeds of each kind in keys and on chords that go round,
//     measured and classified; `fold` is the level of the folded start against the same
//     stretch rendered straight, which a loop that swells at its seam shows as +3 dB
//   FACTORY_REPORT=keys [FACTORY=<part of an id>] [FACTORY_NUMBERS=<first>-<last>] [FACTORY_KEYS=-5,6] pnpm vitest run …
//     each factory sound in all twelve keys, or in the ones FACTORY_KEYS names as semitones
//     from the bank's own, measured and classified
//   FACTORY_REPORT=sounds|keys FACTORY_PACK=<pack id> […] pnpm vitest run …
//     the same for one pack's sounds (../sound-packs/<pack id>.ts, read alone), then what
//     the pack breaks as a whole (its count, a kind it is short of, its seconds, names and
//     recipes that come twice), what each recipe breaks before it is rendered, and the
//     sounds that are nearest each other. OFFKEY marks a pitched sound with over a quarter
//     of its power on the black keys: partials that are meant, or a note the key lacks
//   FACTORY_REPORT=variants [FACTORY=<part of an id>] [FACTORY_NUMBERS=<first>-<last>] [FACTORY_EVERY=<n>] [FACTORY_SEEDS=<how many, default 2>] [FACTORY_AMOUNT=<0..1, default 1>] [FACTORY_KIND=chords|speed|pattern|touch] [FACTORY_PACK=<pack id>] pnpm vitest run …
//     each factory sound beside that many variants of it (../vary.ts), by every kind of
//     difference at that amount or by the one kind named: what the variant does (which chord,
//     how fast, how many rests), how far it is from the sound in dB (`soundPrint`), its loudness
//     against the sound's, and in capitals where a variant leaves what the sound is held to
//     (KIND, SEAM, STEP-IN, CUT, LATE, OFFKEY) or is louder or quieter by over 2 dB (LEVEL), or
//     cannot be told from the sound (SAME)
//   FACTORY_REPORT=packs FACTORY_PACK=<pack id> [FACTORY=<part of an id>] pnpm vitest run …
//     each preset of one pack as it leaves the patch, with its instrument, its cost, and in
//     capitals where it leaves a pack's limits (PEAK, LOUD, QUIET, DC; SLOW over 12 % of real
//     time); then what the pack still lacks: its count, instruments short of two, names and
//     settings that come twice. Written to tmp/factory-packs-<pack id>.txt
//
// The report is written to tmp/factory-<mode>-<filter or all>.txt (and printed, when the reporter shows
// test output). FACTORY_WAV=<dir> also writes what was rendered as WAV files.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, it } from 'vitest'

import { onsetEnvelope } from '../../../core/analysis/onsets'
import { analyzeSound, soundFeatures } from '../../../core/analysis/sound-kind'
import { encodeWav, type PlanarAudio } from '../../../core/render/encode'
import { validatePatch, type Patch } from '../../../core/devices/patch'
import { DeviceRegistry } from '../../../core/devices/registry'
import {
  compileFromDisk,
  formatMeasurement,
  measureAudio,
  printDistance,
  soundPrint,
  type SoundPrint,
} from '../../__tests__/render-support'
import { canRenderPatch, peakOf, renderPatch, type Phrase } from '../../patch-render'
import { STOCK_WASM_DEVICES } from '../../registry'
import {
  FACTORY_CHAINS,
  FACTORY_CHAIN_CATEGORIES,
  FACTORY_MODES,
  FACTORY_PRESET_CATEGORIES,
  FACTORY_PRESETS,
  FACTORY_SOUNDS,
  GENERATED_KINDS,
  PREVIEW_SECONDS,
  generateSound,
  previewPhrase,
  renderFactorySound,
  renderGeneratedSound,
  transposeFactorySound,
  type FactoryMode,
} from '..'
import { FACTORY_PACK_SIZE, FACTORY_SOUND_PACK_SIZE, loadFactoryPacks } from '../packs'
import {
  PACK_INSTRUMENTS,
  PACK_LIMITS,
  levelProblems,
  renderPackPreset,
  repeatedSettings,
} from '../packs/__tests__/support'
import {
  SOUND_PACK_LIMITS,
  packSoundProblems,
  soundPackProblems,
} from '../sound-packs/__tests__/support'
import { type FactoryPreset, type FactorySound } from '../types'
import { VARIATION_KINDS, describeVariant, type SoundVariation } from '../vary'
import { CHAIN_TEST_PATCH, CHAIN_TEST_PHRASE } from './chain-input'
import { KIND_LOUDNESS, blackKeyShare, longestName, measureEnds } from './sound-measure'
import { BANK_LIMITS, chainProblems, nearestPrints, presetProblems } from './support'

const mode = process.env.FACTORY_REPORT
const only = process.env.FACTORY ?? ''
const onlyDevice = process.env.FACTORY_DEVICE
const onlyPack = process.env.FACTORY_PACK
const onlyCategory = process.env.FACTORY_CATEGORY
const withPacks = process.env.FACTORY_WITH_PACKS === '1'
const wavDir = process.env.FACTORY_WAV
const DRY = '(dry input)'
const registry = new DeviceRegistry(STOCK_WASM_DEVICES)
const [firstNumber, lastNumber = firstNumber] = (process.env.FACTORY_NUMBERS ?? '')
  .split('-')
  .map((part) => (part === '' ? undefined : Number(part)))
const numbered = (number: number): boolean =>
  firstNumber === undefined || (number >= firstNumber && number <= (lastNumber ?? firstNumber))
/** The keys the `keys` report renders, as semitones from the bank's own: all twelve unless FACTORY_KEYS names some. */
const keysAsked = process.env.FACTORY_KEYS
  ? process.env.FACTORY_KEYS.split(',').map(Number)
  : [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6]
/** Above this share of power on the black keys a pitched sound is flagged for a look (see `blackKeyShare`). */
const OFF_KEY_SHARE = 0.25
const lines: string[] = []
const say = (line: string) => lines.push(line)

/**
 * The sounds a report is about: the bank's, or with FACTORY_PACK one pack's,
 * read from its own module and no other, so one pack is measured while
 * another is being written.
 */
async function soundsAsked(): Promise<readonly FactorySound[]> {
  if (!onlyPack) return FACTORY_SOUNDS
  // eslint-disable-next-line no-restricted-syntax -- which pack is asked for is only known when the bench runs
  const module = (await import(`../sound-packs/${onlyPack}.ts`)) as {
    SOUNDS: readonly FactorySound[]
  }
  return module.SOUNDS
}

/** What a pack of sounds breaks as a whole, and which of the chosen ones sound alike. */
function saySoundPack(
  pack: string,
  sounds: readonly FactorySound[],
  chosen: readonly FactorySound[],
  prints: ReadonlyMap<string, SoundPrint>,
): void {
  const seconds = sounds.reduce((sum, sound) => sum + sound.durationSec, 0)
  say(
    `\n${sounds.length} of ${FACTORY_SOUND_PACK_SIZE} sounds, ${seconds.toFixed(0)} s of ` +
      `${SOUND_PACK_LIMITS.seconds} at most`,
  )
  for (const problem of soundPackProblems(sounds)) say(problem)
  for (const sound of chosen) {
    for (const problem of packSoundProblems(pack, sound, registry)) say(`${sound.id}: ${problem}`)
  }
  const chosenIds = new Set(chosen.map((sound) => sound.id))
  if (prints.size > 1) {
    say(`\nnearest in sound (dB apart; under ${SOUND_PACK_LIMITS.alikeDb} is one sound twice)`)
    for (const { id, nearest, distance } of nearestPrints(prints)) {
      if (!chosenIds.has(id) || distance >= SOUND_PACK_LIMITS.alikeDb + 1) continue
      say(
        `${id.padEnd(40)} ${distance.toFixed(1).padStart(5)}  ${nearest}` +
          (distance < SOUND_PACK_LIMITS.alikeDb ? '  ALIKE' : ''),
      )
    }
  }
}

function publish(): void {
  mkdirSync('tmp', { recursive: true })
  writeFileSync(
    join(
      'tmp',
      `factory-${mode}-${onlyPack ?? onlyDevice ?? onlyCategory ?? process.env.FACTORY_NUMBERS ?? (only || 'all')}.txt`,
    ),
    `${lines.join('\n')}\n`,
  )
  console.log(lines.join('\n'))
}

function keep(id: string, audio: PlanarAudio): void {
  if (!wavDir) return
  mkdirSync(wavDir, { recursive: true })
  writeFileSync(join(wavDir, `${id}.wav`), Buffer.from(encodeWav(audio)))
}

async function timed<T>(seconds: number, work: () => Promise<T>): Promise<[T, string]> {
  const start = performance.now()
  const result = await work()
  const cost = ((performance.now() - start) / (seconds * 10)).toFixed(1)
  return [result, `${cost}% rt`]
}

/** What the words of an entry break: a name too long for a row, a description that is not one short sentence. */
function sayWords(patches: readonly Patch[]): void {
  const groups = new Set<string>(
    [...FACTORY_PRESET_CATEGORIES, ...FACTORY_CHAIN_CATEGORIES].map((category) => category.id),
  )
  for (const patch of patches) {
    for (const issue of validatePatch(patch, registry)) {
      say(`INVALID ${patch.id}: ${issue.path} ${issue.message}`)
    }
    if (!canRenderPatch(patch)) say(`INVALID ${patch.id}: a device that is not a WASM device`)
    if (!groups.has(patch.category)) say(`INVALID ${patch.id}: no group "${patch.category}"`)
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(patch.id)) say(`INVALID id "${patch.id}": kebab-case`)
    if (patch.effects.length > (patch.instrument ? 4 : 5) || patch.effects.length === 0) {
      say(`INVALID ${patch.id}: ${patch.effects.length} effects`)
    }
    if (/\d$/.test(patch.name)) say(`WORDS ${patch.id}: a name does not end in a digit`)
    if (patch.name.length > 24) say(`LONG name "${patch.name}" (${patch.name.length} of 24)`)
    if (!/^[A-Z].{24,}\.$/.test(patch.description))
      say(`WORDS ${patch.id}: a description is a sentence`)
    if (patch.description.length > BANK_LIMITS.description) {
      say(
        `LONG description ${patch.id} (${patch.description.length} of ${BANK_LIMITS.description})`,
      )
    }
  }
}

/**
 * Each chosen entry with the one it sounds most like, the closest pairs first.
 * `apart` is the print that is not an entry (the dry phrase a chain is fed):
 * how far each is from it is said beside it, and it is nobody's neighbour.
 */
function sayNearest(
  prints: ReadonlyMap<string, SoundPrint>,
  chosen: ReadonlySet<string>,
  alikeDb: number,
  apart?: string,
): void {
  const from = apart === undefined ? undefined : prints.get(apart)
  const entries = new Map([...prints].filter(([id]) => id !== apart))
  say(`\nnearest in sound (dB apart; under ${alikeDb} is the same sound twice)`)
  for (const { id, nearest, distance } of nearestPrints(entries)) {
    if (!chosen.has(id)) continue
    const print = entries.get(id)
    say(
      `${id.padEnd(28)} ${distance.toFixed(1).padStart(5)}  ${nearest.padEnd(28)}` +
        (from && print ? `  ${printDistance(print, from).toFixed(1)} from the dry phrase` : '') +
        (distance < alikeDb ? '  ALIKE' : ''),
    )
  }
}

describe.skipIf(!mode)('factory bench', () => {
  it.skipIf(mode !== 'devices')('devices', () => {
    for (const d of STOCK_WASM_DEVICES) {
      say(`\n## ${d.id}  (${d.name}, ${d.category}${d.experimental ? ', experimental' : ''})`)
      if (d.description) say(d.description)
      for (const [key, spec] of Object.entries(d.params)) {
        say(
          spec.choices?.length
            ? `  ${key}: choice ${spec.choices.map((label, i) => `${i}=${label}`).join(', ')}; default ${spec.default}`
            : `  ${key}: ${spec.min}..${spec.max} ${spec.unit}, default ${spec.default}${spec.taper === 'log' ? ', log' : ''}`,
        )
      }
      for (const [name, params] of Object.entries(d.presets ?? {})) {
        say(`  preset "${name}": ${JSON.stringify(params)}`)
      }
    }
    publish()
  })

  it.skipIf(mode !== 'presets')(
    'presets',
    async () => {
      const chosen = FACTORY_PRESETS.filter(
        (p) =>
          p.id.includes(only) &&
          (!onlyDevice || p.instrument.deviceId === onlyDevice) &&
          (!onlyCategory || p.category === onlyCategory),
      )
      const prints = new Map<string, SoundPrint>()
      const render = (preset: FactoryPreset) =>
        renderPatch(preset, {
          phrase: previewPhrase(preset),
          durationSec: PREVIEW_SECONDS,
          compile: compileFromDisk,
          sliceMs: 0,
        })
      for (const preset of chosen) {
        const [audio, cost] = await timed(PREVIEW_SECONDS, () => render(preset))
        keep(preset.id, audio)
        prints.set(preset.id, soundPrint(audio))
        const measured = measureAudio(audio)
        const problems = presetProblems(preset.id, measured)
        say(
          `${preset.id.padEnd(28)} ${formatMeasurement(measured)}  ${cost}` +
            (problems.length > 0 ? `  ${problems.join(' ')}` : ''),
        )
      }
      // With the packs: the same instrument's pack presets, so a new preset is not one of those again.
      if (withPacks && onlyDevice) {
        // A pack preset does not change, so its print is kept in tmp/ from one run to the next.
        const kept = join('tmp', `prints-packs-${onlyDevice}.json`)
        const known: Record<string, SoundPrint> = existsSync(kept)
          ? (JSON.parse(readFileSync(kept, 'utf8')) as Record<string, SoundPrint>)
          : {}
        const packs = await loadFactoryPacks()
        for (const preset of packs.filter((p) => p.instrument.deviceId === onlyDevice)) {
          known[preset.id] ??= soundPrint(await render(preset))
          prints.set(preset.id, known[preset.id])
        }
        mkdirSync('tmp', { recursive: true })
        writeFileSync(kept, JSON.stringify(known))
      }
      say(`\n${chosen.length} presets${onlyDevice ? ` for ${onlyDevice}` : ''}`)
      sayWords(chosen)
      const everything = [...FACTORY_PRESETS, ...(await loadFactoryPacks())]
      const names = new Map<string, string>()
      for (const preset of everything) {
        const name = preset.name.toLowerCase()
        const first = names.get(name)
        if (first === undefined) names.set(name, preset.id)
        else if (chosen.some((p) => p.id === preset.id || p.id === first)) {
          say(`TWICE name "${preset.name}": ${first} and ${preset.id}`)
        }
      }
      const chosenIds = new Set(chosen.map((p) => p.id))
      for (const repeat of repeatedSettings(everything)) {
        if (repeat.split(' = ').some((id) => chosenIds.has(id))) say(`SAME settings ${repeat}`)
      }
      sayNearest(prints, chosenIds, BANK_LIMITS.alikeDb)
      publish()
    },
    1_800_000,
  )

  it.skipIf(mode !== 'packs')(
    'packs',
    async () => {
      if (!onlyPack) throw new Error('FACTORY_REPORT=packs needs FACTORY_PACK=<pack id>')
      // Its own module and no other, so one pack is measured while another is being written.
      // eslint-disable-next-line no-restricted-syntax -- which pack is asked for is only known when the bench runs
      const module = (await import(`../packs/${onlyPack}.ts`)) as {
        PRESETS: readonly FactoryPreset[]
      }
      const presets = module.PRESETS
      for (const preset of presets.filter((p) => p.id.includes(only))) {
        const start = performance.now()
        const audio = await renderPackPreset(preset)
        const cost = (performance.now() - start) / (PREVIEW_SECONDS * 10)
        keep(preset.id, audio)
        const measured = measureAudio(audio)
        const problems = [...levelProblems(measured), ...(cost > 12 ? ['SLOW'] : [])]
        say(
          `${preset.id.padEnd(44)} ${preset.instrument.deviceId.padEnd(16)} ` +
            `${formatMeasurement(measured)}  ${cost.toFixed(1)}% rt` +
            (problems.length > 0 ? `  ${problems.join(' ')}` : ''),
        )
      }
      say(`\n${presets.length} of ${FACTORY_PACK_SIZE} presets`)
      for (const id of PACK_INSTRUMENTS) {
        const count = presets.filter((preset) => preset.instrument.deviceId === id).length
        if (count < PACK_LIMITS.perInstrument) say(`SHORT ${id}: ${count}`)
      }
      const names = presets.map((preset) => preset.name)
      for (const name of new Set(names.filter((n, index) => names.indexOf(n) !== index))) {
        say(`TWICE name "${name}"`)
      }
      for (const repeat of repeatedSettings(presets)) say(`SAME settings ${repeat}`)
      publish()
    },
    1_800_000,
  )

  it.skipIf(mode !== 'sounds')(
    'sounds',
    async () => {
      const render = { compile: compileFromDisk, sliceMs: 0 } as const
      const from = await soundsAsked()
      const chosen = from.filter((s) => s.id.includes(only) && numbered(s.number))
      const prints = new Map<string, SoundPrint>()
      for (const sound of chosen) {
        const [audio, cost] = await timed(sound.durationSec, () =>
          renderFactorySound(sound, render),
        )
        keep(sound.id, audio)
        prints.set(sound.id, soundPrint(audio))
        const measured = measureAudio(audio)
        const analysis = analyzeSound(audio.channels, audio.sampleRate)
        const envelope = onsetEnvelope(audio.channels, audio.sampleRate)
        const features = envelope
          ? soundFeatures(envelope.mono, envelope.level, audio.sampleRate, analysis.onsetsSec)
          : undefined
        const ends = measureEnds(audio)
        const problems: string[] = []
        if (analysis.kind !== sound.kind) problems.push('KIND')
        const [quietest, loudest] = KIND_LOUDNESS[sound.kind] ?? [-30, -10]
        if (measured.lufs < quietest) problems.push('QUIET')
        if (measured.lufs > loudest) problems.push('LOUD')
        if (Math.abs(measured.dc) > 0.005) problems.push('DC')
        if (measured.widthDb > -1.5) problems.push('WIDE')
        if (longestName(sound).length > 24) problems.push('NAME')
        if (Number(cost.replace('% rt', '')) > 12) problems.push('SLOW')
        const black = blackKeyShare(audio)
        // A kit is drums and noise: it has no key to be off.
        if (sound.kind !== 'texture' && !sound.kit && black > OFF_KEY_SHARE) problems.push('OFFKEY')
        let ending: string
        if (sound.loopCrossfadeSec) {
          // The folded start against the same stretch rendered straight: a loop that swells or dips at its seam.
          const straight = await renderFactorySound(
            { ...sound, loopCrossfadeSec: undefined, fadeOutSec: 0 },
            render,
          )
          const frames = Math.round(sound.loopCrossfadeSec * audio.sampleRate)
          const level = (channels: readonly Float32Array[], from: number, to: number): number => {
            let sum = 0
            for (const channel of channels)
              for (let i = from; i < to; i += 1) sum += channel[i] * channel[i]
            return Math.sqrt(sum / Math.max(1, to - from))
          }
          const total = audio.channels[0].length
          const fold =
            20 * Math.log10(level(audio.channels, 0, frames) / level(straight.channels, 0, frames))
          // Each render is brought to the bank's peak by its own gain. Past the fold the two are
          // the same audio, so their levels there give the difference in gain: taken out again.
          const gain =
            20 *
            Math.log10(
              level(audio.channels, frames, total) / level(straight.channels, frames, total),
            )
          const foldDb = fold - gain
          if (!ends.round) problems.push('SEAM')
          if (Math.abs(foldDb) > 1.5) problems.push('FOLD')
          ending =
            `round ${ends.round ? 'yes' : 'NO'}  fold ${foldDb >= 0 ? '+' : ''}${foldDb.toFixed(1)} dB  ` +
            `swing ${ends.swingDb.toFixed(1)} dB`
        } else {
          if (ends.stepIn) problems.push('STEP-IN')
          if (ends.stepOut || ends.endDb > -60) problems.push('CUT')
          if (ends.leadSec > 0.03 && sound.kind !== 'pad') problems.push('LATE')
          ending = `lead ${ends.leadSec.toFixed(3)} s  end ${ends.endDb.toFixed(0)} dB`
        }
        say(
          `${String(sound.number).padEnd(onlyPack ? 6 : 4)}${sound.id.padEnd(onlyPack ? 44 : 28)} ${sound.durationSec}s  ` +
            `${formatMeasurement(measured)}  ` +
            `kind ${analysis.kind}${analysis.kind === sound.kind ? '' : ` (says ${sound.kind})`}  ` +
            `hits ${analysis.onsetsSec.length}  flat ${features ? features.flatness.toFixed(2) : '-'}  ` +
            `tonal ${features ? features.tonality.toFixed(2) : '-'}  ` +
            `black ${(black * 100).toFixed(0)}%  ${ending}  ${cost}` +
            (problems.length > 0 ? `  ${problems.join(' ')}` : ''),
        )
      }
      if (onlyPack) saySoundPack(onlyPack, from, chosen, prints)
      publish()
    },
    1_800_000,
  )

  it.skipIf(mode !== 'variants')(
    'variants',
    async () => {
      const render = { compile: compileFromDisk, sliceMs: 0 } as const
      const every = Number(process.env.FACTORY_EVERY ?? 1)
      const seeds = Number(process.env.FACTORY_SEEDS ?? 2)
      const amount = Number(process.env.FACTORY_AMOUNT ?? 1)
      const kind = VARIATION_KINDS.find((each) => each === process.env.FACTORY_KIND)
      const variation = (seed: number): SoundVariation =>
        kind ? { seed, [kind]: amount } : { seed, amount }
      const from = await soundsAsked()
      const chosen = from.filter(
        (s, index) => s.id.includes(only) && numbered(s.number) && index % every === 0,
      )
      const apart: number[] = []
      let flagged = 0
      for (const sound of chosen) {
        const audio = await renderFactorySound(sound, render)
        const print = soundPrint(audio)
        const lufs = measureAudio(audio).lufs
        const black = blackKeyShare(audio)
        say(`${String(sound.number).padEnd(6)}${sound.id.padEnd(44)} ${sound.kind}`)
        for (let seed = 1; seed <= seeds; seed += 1) {
          const [variant, cost] = await timed(sound.durationSec, () =>
            renderFactorySound(sound, { ...render, vary: variation(seed) }),
          )
          const did = describeVariant(sound, variation(seed))
          const does = [
            did.chordSteps !== 0 ? `chord ${did.chordSteps > 0 ? '+' : ''}${did.chordSteps}` : '',
            did.octaves > 0 ? `${did.octaves} oct` : '',
            did.rate !== 1 ? `x${did.rate}` : '',
            did.rests > 0 ? `${did.rests} rest` : '',
            did.swaps > 0 ? `${did.swaps} swap` : '',
            did.laterSec > 0 ? `+${did.laterSec.toFixed(1)} s` : '',
          ]
            .filter(Boolean)
            .join(' ')
          keep(`${sound.id}~${seed}`, variant)
          const measured = measureAudio(variant)
          const analysis = analyzeSound(variant.channels, variant.sampleRate)
          const ends = measureEnds(variant)
          const distance = printDistance(print, soundPrint(variant))
          apart.push(distance)
          const problems: string[] = []
          if (analysis.kind !== sound.kind) problems.push('KIND')
          if (Math.abs(measured.lufs - lufs) > 2) problems.push('LEVEL')
          if (distance < 0.02) problems.push('SAME')
          const blackNow = blackKeyShare(variant)
          if (
            sound.kind !== 'texture' &&
            !sound.kit &&
            blackNow > OFF_KEY_SHARE &&
            blackNow > black + 0.05
          ) {
            problems.push('OFFKEY')
          }
          let ending: string
          if (sound.loopCrossfadeSec) {
            if (!ends.round) problems.push('SEAM')
            ending = `round ${ends.round ? 'yes' : 'NO'}  swing ${ends.swingDb.toFixed(1)} dB`
          } else {
            if (ends.stepIn) problems.push('STEP-IN')
            if (ends.stepOut || ends.endDb > -60) problems.push('CUT')
            if (ends.leadSec > 0.03 && sound.kind !== 'pad') problems.push('LATE')
            ending = `lead ${ends.leadSec.toFixed(3)} s  end ${ends.endDb.toFixed(0)} dB`
          }
          if (problems.length > 0) flagged += 1
          const lu = measured.lufs - lufs
          say(
            `      seed ${String(seed).padEnd(3)} ${distance.toFixed(2).padStart(5)} dB apart  ` +
              `${lu >= 0 ? '+' : ''}${lu.toFixed(1)} LU  kind ${analysis.kind}  ` +
              `black ${(blackNow * 100).toFixed(0)}%  ${ending}  ${cost}  [${does}]` +
              (problems.length > 0 ? `  ${problems.join(' ')}` : ''),
          )
        }
      }
      const sorted = [...apart].sort((a, b) => a - b)
      const at = (share: number): string =>
        sorted.length > 0 ? sorted[Math.floor(share * (sorted.length - 1))].toFixed(2) : '-'
      say(
        `\n${chosen.length} sounds, ${apart.length} variants by ${kind ?? 'every kind'} at an amount of ${amount}: ` +
          `${at(0)} to ${at(1)} dB apart, half under ${at(0.5)}; ${flagged} flagged`,
      )
      publish()
    },
    3_600_000,
  )

  it.skipIf(mode !== 'chains')(
    'chains',
    async () => {
      const seconds = 10
      const dry = await renderPatch(CHAIN_TEST_PATCH, {
        phrase: CHAIN_TEST_PHRASE,
        durationSec: seconds,
        compile: compileFromDisk,
        sliceMs: 0,
      })
      const dryMeasured = measureAudio(dry)
      say(`${DRY.padEnd(28)} ${formatMeasurement(dryMeasured)}`)
      const chosen = FACTORY_CHAINS.filter(
        (c) => c.id.includes(only) && (!onlyCategory || c.category === onlyCategory),
      )
      const prints = new Map<string, SoundPrint>([[DRY, soundPrint(dry)]])
      for (const chain of chosen) {
        const [audio, cost] = await timed(seconds, () =>
          renderPatch(chain, {
            input: dry,
            durationSec: seconds,
            compile: compileFromDisk,
            sliceMs: 0,
          }),
        )
        keep(chain.id, audio)
        prints.set(chain.id, soundPrint(audio))
        const measured = measureAudio(audio)
        const lu = measured.lufs - dryMeasured.lufs
        const problems = chainProblems(chain.id, measured, dryMeasured)
        say(
          `${chain.id.padEnd(28)} ${formatMeasurement(measured)}  ` +
            `${lu >= 0 ? '+' : ''}${lu.toFixed(1)} LU  ${cost}` +
            (problems.length > 0 ? `  ${problems.join(' ')}` : ''),
        )
      }
      say(`\n${chosen.length} chains${onlyCategory ? ` under ${onlyCategory}` : ''}`)
      sayWords(chosen)
      const names = FACTORY_CHAINS.map((chain) => chain.name.toLowerCase())
      for (const chain of chosen) {
        if (names.filter((name) => name === chain.name.toLowerCase()).length > 1) {
          say(`TWICE name "${chain.name}"`)
        }
      }
      const ids = [...FACTORY_PRESETS, ...(await loadFactoryPacks())].map((preset) => preset.id)
      for (const chain of chosen) if (ids.includes(chain.id)) say(`TWICE id ${chain.id}`)
      const chosenIds = new Set(chosen.map((c) => c.id))
      for (const repeat of repeatedSettings(FACTORY_CHAINS)) {
        if (repeat.split(' = ').some((id) => chosenIds.has(id))) say(`SAME settings ${repeat}`)
      }
      sayNearest(prints, chosenIds, BANK_LIMITS.chainAlikeDb, DRY)
      publish()
    },
    1_800_000,
  )
  it.skipIf(mode !== 'stress')(
    'stress',
    async () => {
      const node = { compile: compileFromDisk, sliceMs: 0 } as const
      const db = (gain: number) => (gain > 0 ? 20 * Math.log10(gain) : -Infinity)
      const show = (value: number) => (Number.isFinite(value) ? value.toFixed(1) : '-inf')
      const finite = (audio: PlanarAudio) =>
        audio.channels.every((channel) => channel.every((sample) => Number.isFinite(sample)))
      /** RMS of both channels between two times, dBFS. */
      const level = (audio: PlanarAudio, fromSec: number, toSec: number) => {
        let sum = 0
        let count = 0
        for (const channel of audio.channels) {
          const end = Math.min(channel.length, Math.round(toSec * audio.sampleRate))
          for (let i = Math.round(fromSec * audio.sampleRate); i < end; i += 1) {
            sum += channel[i] * channel[i]
            count += 1
          }
        }
        return count > 0 ? db(Math.sqrt(sum / count)) : -Infinity
      }
      /** What a 30 s render says once the notes are over: still ringing, or growing. */
      const afterwards = (audio: PlanarAudio, problems: string[]) => {
        const loudest = Math.max(...Array.from({ length: 10 }, (_, i) => level(audio, i, i + 1)))
        const middle = level(audio, 12, 17)
        const end = level(audio, 25, 30)
        if (end > middle + 1 && end > -70) problems.push('GROWS')
        else if (end > loudest - 20) problems.push('RINGS')
        return `at 12 s ${show(middle - loudest)} dB  at 25 s ${show(end - loudest)} dB`
      }

      if (!onlyCategory) {
        // Presets: left to ring for half a minute, played as hard as it gets, and at the ends of the keyboard.
        const hard: Phrase = {
          notes: [38, 45, 50, 57, 62, 65, 69, 72].map((note) => ({
            atSec: 0,
            durSec: 4,
            note,
            gain: 1,
          })),
        }
        const one = (note: number): Phrase => ({ notes: [{ atSec: 0, durSec: 2, note }] })
        const chosen = FACTORY_PRESETS.filter(
          (p) => p.id.includes(only) && (!onlyDevice || p.instrument.deviceId === onlyDevice),
        )
        for (const preset of chosen) {
          const problems: string[] = []
          const long = await renderPatch(preset, {
            ...node,
            phrase: previewPhrase(preset),
            durationSec: 30,
          })
          const rings = afterwards(long, problems)
          const full = await renderPatch(preset, { ...node, phrase: hard, durationSec: 6 })
          const low = await renderPatch(preset, { ...node, phrase: one(28), durationSec: 3 })
          const high = await renderPatch(preset, { ...node, phrase: one(100), durationSec: 3 })
          if (![long, full, low, high].every(finite)) problems.push('NAN')
          const fullPeak = db(peakOf(full.channels))
          if (fullPeak > -1) problems.push('HOT')
          say(
            `${preset.id.padEnd(28)} ${rings}  eight keys at full ${show(fullPeak)} dB  ` +
              `low E ${show(db(peakOf(low.channels)))} dB  high E ${show(db(peakOf(high.channels)))} dB` +
              (problems.length > 0 ? `  ${problems.join(' ')}` : ''),
          )
        }
      } else {
        // Chains: fed nothing, fed the phrase at full scale, and left to ring for half a minute.
        const dry = await renderPatch(CHAIN_TEST_PATCH, {
          ...node,
          phrase: CHAIN_TEST_PHRASE,
          durationSec: 6,
        })
        const scale = 10 ** (-1 / 20) / peakOf(dry.channels)
        const loud: PlanarAudio = {
          sampleRate: dry.sampleRate,
          channels: dry.channels.map((channel) => channel.map((sample) => sample * scale)),
        }
        const nothing: PlanarAudio = {
          sampleRate: dry.sampleRate,
          channels: [new Float32Array(dry.sampleRate), new Float32Array(dry.sampleRate)],
        }
        const chosen = FACTORY_CHAINS.filter(
          (c) => c.id.includes(only) && c.category === onlyCategory,
        )
        for (const chain of chosen) {
          const problems: string[] = []
          const long = await renderPatch(chain, { ...node, input: dry, durationSec: 30 })
          const rings = afterwards(long, problems)
          const hot = await renderPatch(chain, { ...node, input: loud, durationSec: 8 })
          const idle = await renderPatch(chain, { ...node, input: nothing, durationSec: 6 })
          if (![long, hot, idle].every(finite)) problems.push('NAN')
          const hotPeak = db(peakOf(hot.channels))
          if (hotPeak > 0) problems.push('HOT')
          const noise = level(idle, 2, 6)
          if (noise > -60) problems.push('NOISE')
          say(
            `${chain.id.padEnd(28)} ${rings}  fed at -1 dBFS peaks ${show(hotPeak)} dB  ` +
              `fed nothing ${show(noise)} dB` +
              (problems.length > 0 ? `  ${problems.join(' ')}` : ''),
          )
        }
      }
      publish()
    },
    3_600_000,
  )

  it.skipIf(mode !== 'generated')(
    'generated',
    async () => {
      const seeds = Number(process.env.FACTORY_SEEDS ?? 8)
      const from = Number(process.env.FACTORY_FROM ?? 1)
      const modes = Object.keys(FACTORY_MODES) as FactoryMode[]
      const rms = (channel: Float32Array, frames: number): number => {
        let sum = 0
        for (let i = 0; i < frames; i += 1) sum += channel[i] * channel[i]
        return Math.sqrt(sum / frames)
      }
      for (const kind of GENERATED_KINDS.filter((k) => k.includes(only))) {
        for (let seed = from; seed < from + seeds; seed += 1) {
          // Keys and chords go round with the seed, so a run covers all of them.
          const key = { root: (seed * 7) % 12, mode: modes[seed % modes.length] }
          const degree = seed % 3 === 0 ? undefined : seed % 7
          const sound = generateSound({ seed, kind, key, degree })
          const [audio, cost] = await timed(sound.durationSec, () =>
            renderGeneratedSound(sound, { compile: compileFromDisk, sliceMs: 0 }),
          )
          keep(`${kind}-${seed}`, audio)
          const analysis = analyzeSound(audio.channels, audio.sampleRate)
          const envelope = onsetEnvelope(audio.channels, audio.sampleRate)
          if (!envelope) throw new Error(`${kind} ${seed} is silent`)
          const features = soundFeatures(
            envelope.mono,
            envelope.level,
            audio.sampleRate,
            analysis.onsetsSec,
          )
          let loop = ''
          if (sound.loopCrossfadeSec) {
            const render = { compile: compileFromDisk, sliceMs: 0, phrase: sound.phrase }
            const folded = await renderPatch(sound.patch, {
              ...render,
              durationSec: sound.durationSec,
              skipSec: sound.skipSec,
              loopCrossfadeSec: sound.loopCrossfadeSec,
            })
            const straight = await renderPatch(sound.patch, {
              ...render,
              durationSec: sound.durationSec,
              skipSec: sound.skipSec,
            })
            const frames = Math.round(sound.loopCrossfadeSec * folded.sampleRate)
            const fold =
              20 * Math.log10(rms(folded.channels[0], frames) / rms(straight.channels[0], frames))
            const seam = Math.abs(audio.channels[0][0] - (audio.channels[0].at(-1) ?? 0))
            loop = `  seam ${seam.toFixed(4)}  fold ${fold >= 0 ? '+' : ''}${fold.toFixed(1)} dB`
          }
          say(
            `${`${kind} ${seed}`.padEnd(12)} ${sound.name.padEnd(30)} ` +
              `${`${key.root}${key.mode.slice(0, 3)}/${sound.degree}`.padEnd(9)} ` +
              `${formatMeasurement(measureAudio(audio))}  ` +
              `kind ${analysis.kind}${analysis.kind === kind ? '' : ' (WRONG)'}  ` +
              `flat ${features.flatness.toFixed(2)}  tonal ${features.tonality.toFixed(2)}${loop}  ${cost}`,
          )
        }
      }
      publish()
    },
    3_600_000,
  )

  it.skipIf(mode !== 'keys')(
    'keys',
    async () => {
      const from = await soundsAsked()
      for (const sound of from.filter((s) => s.id.includes(only) && numbered(s.number))) {
        for (const transpose of keysAsked) {
          const audio = await renderFactorySound(sound, {
            compile: compileFromDisk,
            sliceMs: 0,
            transpose,
          })
          keep(`${sound.id}_${transpose}`, audio)
          const analysis = analyzeSound(audio.channels, audio.sampleRate)
          const seam = sound.loopCrossfadeSec
            ? `  seam ${Math.abs(audio.channels[0][0] - (audio.channels[0].at(-1) ?? 0)).toFixed(4)}`
            : ''
          say(
            `${sound.id.padEnd(onlyPack ? 44 : 24)} ${String(transpose).padStart(2)} ` +
              `${transposeFactorySound(sound, transpose).name.padEnd(24)} ` +
              `${formatMeasurement(measureAudio(audio))}  ` +
              `kind ${analysis.kind}${analysis.kind === sound.kind ? '' : ' (WRONG)'}${seam}` +
              (sound.loopCrossfadeSec && !measureEnds(audio).round ? '  SEAM' : ''),
          )
        }
      }
      publish()
    },
    3_600_000,
  )
})
