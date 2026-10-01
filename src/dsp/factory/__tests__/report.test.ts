// Not a test: the bench the factory bank is written at. Skipped unless asked for.
//
//   FACTORY_REPORT=devices pnpm vitest run src/dsp/factory/__tests__/report.test.ts
//     every stock WASM device with its parameters and presets
//   FACTORY_REPORT=presets [FACTORY=<part of an id>] pnpm vitest run …
//     each preset's preview as it leaves the patch (not normalised), measured
//   FACTORY_REPORT=sounds [FACTORY=<part of an id>] pnpm vitest run …
//     each factory sound as rendered, measured and classified
//   FACTORY_REPORT=chains [FACTORY=<part of an id>] pnpm vitest run …
//     each effect chain on a dry piano phrase, measured against the dry phrase
//
// The report is written to tmp/factory-<mode>.txt (and printed, when the reporter shows
// test output). FACTORY_WAV=<dir> also writes what was rendered as WAV files.

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, it } from 'vitest'

import { analyzeSound } from '../../../core/analysis/sound-kind'
import { encodeWav, type PlanarAudio } from '../../../core/render/encode'
import { compileFromDisk, formatMeasurement, measureAudio } from '../../__tests__/render-support'
import { renderPatch } from '../../patch-render'
import { STOCK_WASM_DEVICES } from '../../registry'
import {
  FACTORY_CHAINS,
  FACTORY_PRESETS,
  FACTORY_SOUNDS,
  PREVIEW_SECONDS,
  previewPhrase,
  renderFactorySound,
} from '..'
import { CHAIN_TEST_PATCH, CHAIN_TEST_PHRASE } from './chain-input'

const mode = process.env.FACTORY_REPORT
const only = process.env.FACTORY ?? ''
const wavDir = process.env.FACTORY_WAV
const lines: string[] = []
const say = (line: string) => lines.push(line)

function publish(): void {
  mkdirSync('tmp', { recursive: true })
  writeFileSync(join('tmp', `factory-${mode}.txt`), `${lines.join('\n')}\n`)
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
      for (const preset of FACTORY_PRESETS.filter((p) => p.id.includes(only))) {
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
})
