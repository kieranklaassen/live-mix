// Every effect's own presets: that there are plenty, that each is written
// soundly, and (in the files beside this one) that each sounds.
//
// The presets are measured in `effect-presets.sounds-<n>.test.ts`, six files
// with a share of the effects each. The bench they are written at is here,
// skipped unless asked for:
//
//   EFFECT_PRESETS=all pnpm vitest run src/dsp/__tests__/effect-presets.test.ts
//   EFFECT_PRESETS=tape-echo,chorus pnpm vitest run src/dsp/__tests__/effect-presets.test.ts
//
// writes tmp/effect-presets-<what>.txt: one line per preset with its level,
// tail, colour and width, how far it is from the dry phrase and from the
// effect as it starts, and the sibling it is nearest to. A line that reads
// `ok ~` is one of `QUIET_PRESETS`, which is not asked to be told apart.

import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { validatePatch } from '../../core/devices/patch'
import { presetParams, resolvePreset } from '../../core/devices/presets'
import { DeviceRegistry } from '../../core/devices/registry'
import { createScore, validateScore } from '../../score/schema'
import { STOCK_WASM_DEVICES, registerStockWasmDevices } from '../index'
import {
  EFFECTS,
  FEWER_PRESETS,
  LONGEST_NAME,
  PRESETS_EACH,
  QUIET_PRESETS,
  SOUND_SHARES,
  formatEffect,
  invalidValues,
  readEffect,
  renderProbes,
} from './effect-preset-support'

const asked = process.env.EFFECT_PRESETS

const presetsOf = (descriptor: (typeof EFFECTS)[number]) =>
  Object.entries(descriptor.presets ?? {}) as [string, Record<string, number>][]

describe('effect presets', () => {
  it('come with every effect, sixteen at the least but for the few that say why not', () => {
    const short = EFFECTS.filter(
      (descriptor) => presetsOf(descriptor).length < (FEWER_PRESETS[descriptor.id] ?? PRESETS_EACH),
    ).map((descriptor) => `${descriptor.id} has ${presetsOf(descriptor).length}`)
    expect(short).toEqual([])
    for (const id of Object.keys(FEWER_PRESETS)) {
      expect(
        EFFECTS.map((descriptor) => descriptor.id),
        `${id} is an effect`,
      ).toContain(id)
    }
  })

  it('are named in a few words, no two of an effect alike', () => {
    const problems: string[] = []
    for (const descriptor of EFFECTS) {
      const seen = new Set<string>()
      for (const [name] of presetsOf(descriptor)) {
        const at = `${descriptor.id} "${name}"`
        if (name !== name.trim() || name === '') problems.push(`${at} has space around it`)
        if (name.length > LONGEST_NAME)
          problems.push(`${at} is longer than ${LONGEST_NAME} characters`)
        if (seen.has(name.toLowerCase())) problems.push(`${at} is there twice`)
        seen.add(name.toLowerCase())
      }
    }
    expect(problems).toEqual([])
  })

  it('set controls the effect has, to values in their range', () => {
    const problems = EFFECTS.flatMap((descriptor) =>
      presetsOf(descriptor).flatMap(([name, params]) =>
        invalidValues(descriptor, params).map(
          (problem) => `${descriptor.id} "${name}": ${problem}`,
        ),
      ),
    )
    expect(problems).toEqual([])
  })

  it('put the knobs somewhere of their own: no two of an effect are the same settings', () => {
    const problems: string[] = []
    for (const descriptor of EFFECTS) {
      const seen = new Map<string, string>()
      for (const [name, params] of presetsOf(descriptor)) {
        // A preset lists what it changes; the rest is where the effect starts.
        const whole = presetParams(descriptor, {
          name,
          deviceId: descriptor.id,
          deviceVersion: 1,
          params,
        })
        const key = JSON.stringify(
          Object.keys(whole)
            .sort()
            .map((param) => [param, whole[param]]),
        )
        const twin = seen.get(key)
        if (twin) problems.push(`${descriptor.id} "${name}" is the settings of "${twin}"`)
        seen.set(key, name)
      }
    }
    expect(problems).toEqual([])
  })

  it('keep the names they were saved under: a former name leads to a preset of today', () => {
    const problems: string[] = []
    for (const descriptor of STOCK_WASM_DEVICES) {
      const names = Object.keys(descriptor.presets ?? {})
      for (const [former, current] of Object.entries(descriptor.formerPresets ?? {})) {
        const at = `${descriptor.id} "${former}"`
        if (names.includes(former)) problems.push(`${at} is also a preset of today`)
        if (!names.includes(current)) problems.push(`${at} leads to "${current}", no preset`)
      }
    }
    expect(problems).toEqual([])
    const tapeEcho = STOCK_WASM_DEVICES.find((descriptor) => descriptor.id === 'tape-echo')
    expect(tapeEcho && resolvePreset(tapeEcho, 'Space echo').name).toBe('Warm repeats')

    // What was saved under the old name is still a sound score and a sound patch.
    const registry = registerStockWasmDevices(new DeviceRegistry())
    const saved = { id: 'echo-1', deviceId: 'tape-echo', preset: 'Warm repeats', params: {} }
    const score = createScore()
    score.master.inserts.push({ ...saved, bypass: false })
    expect(validateScore(score, { devices: registry })).toEqual([])
    score.master.inserts[0].preset = 'No such echo'
    expect(validateScore(score, { devices: registry }).map((issue) => issue.message)).toEqual([
      'tape-echo has no preset "No such echo"',
    ])
    const patch = { id: 'old', name: 'Old', category: 'echo', description: '', effects: [saved] }
    expect(validatePatch(patch, registry)).toEqual([])
  })

  it('excuses from being told apart only presets that are there', () => {
    for (const [id, names] of Object.entries(QUIET_PRESETS)) {
      const descriptor = EFFECTS.find((effect) => effect.id === id)
      expect(descriptor, `${id} is an effect`).toBeDefined()
      for (const name of names)
        expect(Object.keys(descriptor?.presets ?? {}), `${id} "${name}"`).toContain(name)
    }
  })

  it('are measured, every effect in one of the files beside this one', () => {
    const here = dirname(fileURLToPath(import.meta.url))
    const files = readdirSync(here).filter((file) =>
      /^effect-presets\.sounds-\d+\.test\.ts$/.test(file),
    )
    expect(files.sort()).toEqual(
      Array.from(
        { length: SOUND_SHARES },
        (_, share) => `effect-presets.sounds-${share + 1}.test.ts`,
      ),
    )
  })
})

describe.skipIf(!asked)('effect preset bench', () => {
  it('reads the presets', async () => {
    const ids = asked === 'all' ? null : (asked ?? '').split(',')
    const probes = await renderProbes()
    const lines: string[] = []
    for (const descriptor of EFFECTS) {
      if (ids && !ids.includes(descriptor.id)) continue
      lines.push(formatEffect(await readEffect(descriptor, probes)), '')
    }
    mkdirSync('tmp', { recursive: true })
    const file = join('tmp', `effect-presets-${(asked ?? '').replace(/,/g, '+').slice(0, 60)}.txt`)
    writeFileSync(file, `${lines.join('\n')}\n`)
    console.log(lines.join('\n'))
  }, 1_800_000)
})
