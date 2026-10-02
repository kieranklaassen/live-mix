// Not a test: the bench the factory bank is written at. Skipped unless asked for.
//
//   FACTORY_REPORT=devices pnpm vitest run src/dsp/factory/__tests__/report.test.ts
//     every stock WASM device with its parameters and presets
//   FACTORY_REPORT=presets [FACTORY=<part of an id>] [FACTORY_DEVICE=<instrument id>] pnpm vitest run …
//     each preset's preview as it leaves the patch (not normalised), measured
//   FACTORY_REPORT=sounds [FACTORY=<part of an id>] pnpm vitest run …
//     each factory sound as rendered, measured and classified
//   FACTORY_REPORT=chains [FACTORY=<part of an id>] pnpm vitest run …
//     each effect chain on a dry piano phrase, measured against the dry phrase
//   FACTORY_REPORT=generated [FACTORY=<kind>] [FACTORY_SEEDS=<how many, default 8>] [FACTORY_FROM=<first seed>] pnpm vitest run …
//     generated sounds, that many seeds of each kind in keys and on chords that go round,
//     measured and classified; `fold` is the level of the folded start against the same
//     stretch rendered straight, which a loop that swells at its seam shows as +3 dB
//   FACTORY_REPORT=keys [FACTORY=<part of an id>] pnpm vitest run …
//     each factory sound in all twelve keys, measured and classified
//   FACTORY_REPORT=packs FACTORY_PACK=<pack id> [FACTORY=<part of an id>] pnpm vitest run …
//     each preset of one pack as it leaves the patch, with its instrument, its cost, and in
//     capitals where it leaves a pack's limits (PEAK, LOUD, QUIET, DC; SLOW over 12 % of real
//     time); then what the pack still lacks: its count, instruments short of two, names and
//     settings that come twice. Written to tmp/factory-packs-<pack id>.txt
//
// The report is written to tmp/factory-<mode>-<filter or all>.txt (and printed, when the reporter shows
// test output). FACTORY_WAV=<dir> also writes what was rendered as WAV files.

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, it } from 'vitest'

import { onsetEnvelope } from '../../../core/analysis/onsets'
import { analyzeSound, soundFeatures } from '../../../core/analysis/sound-kind'
import { encodeWav, type PlanarAudio } from '../../../core/render/encode'
import { compileFromDisk, formatMeasurement, measureAudio } from '../../__tests__/render-support'
import { renderPatch } from '../../patch-render'
import { STOCK_WASM_DEVICES } from '../../registry'
import {
  FACTORY_CHAINS,
  FACTORY_MODES,
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
import { FACTORY_PACK_SIZE } from '../packs'
import {
  PACK_INSTRUMENTS,
  PACK_LIMITS,
  levelProblems,
  renderPackPreset,
  repeatedSettings,
} from '../packs/__tests__/support'
import { type FactoryPreset } from '../types'
import { CHAIN_TEST_PATCH, CHAIN_TEST_PHRASE } from './chain-input'

const mode = process.env.FACTORY_REPORT
const only = process.env.FACTORY ?? ''
const onlyDevice = process.env.FACTORY_DEVICE
const onlyPack = process.env.FACTORY_PACK
const wavDir = process.env.FACTORY_WAV
const lines: string[] = []
const say = (line: string) => lines.push(line)

function publish(): void {
  mkdirSync('tmp', { recursive: true })
  writeFileSync(
    join('tmp', `factory-${mode}-${onlyPack ?? onlyDevice ?? (only || 'all')}.txt`),
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
        (p) => p.id.includes(only) && (!onlyDevice || p.instrument.deviceId === onlyDevice),
      )
      for (const preset of chosen) {
        const [audio, cost] = await timed(PREVIEW_SECONDS, () =>
          renderPatch(preset, {
            phrase: previewPhrase(preset),
            durationSec: PREVIEW_SECONDS,
            compile: compileFromDisk,
            sliceMs: 0,
          }),
        )
        keep(preset.id, audio)
        say(`${preset.id.padEnd(28)} ${formatMeasurement(measureAudio(audio))}  ${cost}`)
      }
      publish()
    },
    600_000,
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
      for (const sound of FACTORY_SOUNDS.filter((s) => s.id.includes(only))) {
        const [audio, cost] = await timed(sound.durationSec, () =>
          renderFactorySound(sound, { compile: compileFromDisk, sliceMs: 0 }),
        )
        keep(sound.id, audio)
        const analysis = analyzeSound(audio.channels, audio.sampleRate)
        const seam = sound.loopCrossfadeSec
          ? `  seam ${Math.abs(audio.channels[0][0] - (audio.channels[0].at(-1) ?? 0)).toFixed(4)}`
          : ''
        say(
          `${sound.id.padEnd(28)} ${formatMeasurement(measureAudio(audio))}  ` +
            `kind ${analysis.kind}${analysis.kind === sound.kind ? '' : ` (says ${sound.kind})`}${seam}  ${cost}`,
        )
      }
      publish()
    },
    900_000,
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
      say(`${'(dry input)'.padEnd(28)} ${formatMeasurement(measureAudio(dry))}`)
      for (const chain of FACTORY_CHAINS.filter((c) => c.id.includes(only))) {
        const [audio, cost] = await timed(seconds, () =>
          renderPatch(chain, {
            input: dry,
            durationSec: seconds,
            compile: compileFromDisk,
            sliceMs: 0,
          }),
        )
        keep(chain.id, audio)
        say(`${chain.id.padEnd(28)} ${formatMeasurement(measureAudio(audio))}  ${cost}`)
      }
      publish()
    },
    600_000,
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
      for (const sound of FACTORY_SOUNDS.filter((s) => s.id.includes(only))) {
        for (let transpose = -5; transpose <= 6; transpose += 1) {
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
            `${sound.id.padEnd(24)} ${String(transpose).padStart(2)} ` +
              `${transposeFactorySound(sound, transpose).name.padEnd(24)} ` +
              `${formatMeasurement(measureAudio(audio))}  ` +
              `kind ${analysis.kind}${analysis.kind === sound.kind ? '' : ' (WRONG)'}${seam}`,
          )
        }
      }
      publish()
    },
    3_600_000,
  )
})
