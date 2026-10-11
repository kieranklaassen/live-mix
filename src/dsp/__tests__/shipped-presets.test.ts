// A saved score names the presets it loads (`{ deviceId, preset, params }`),
// and relies on a device's defaults for what it does not set. So what a name
// loads is part of every piece that was ever saved with it, and must never
// change: `shipped-presets.json` beside this file holds every preset that has
// shipped, on every device, with every parameter filled in, and this test
// holds the devices of today to it.
//
// To retune a preset, give the retune a new name and move the old values to
// the device's `retiredPresets`. To rename one, list the old name in
// `formerPresets`. A new preset, device or parameter is added to the file
// with
//
//   UPDATE_SHIPPED_PRESETS=1 pnpm vitest run src/dsp/__tests__/shipped-presets.test.ts
//
// which adds what is missing and never changes what is there.
//
// One change was made by hand: the Compressor's four presets carry more
// Make-up than they shipped with (Gentle 2 → 5.51 dB, Voice 4 → 11.85, Glue
// 1 → 2.35, Limit 0 → 3.42), from when the device began to take the browser
// node's own make-up off again. The numbers moved so that the sound of each
// name did not.

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  defaultPreset,
  type DeviceDescriptor,
  hasPreset,
  listPresets,
  presetParams,
  resolvePreset,
} from '../../core/devices'
import { registerStockWasmDevices } from '../registry'

type Shipped = Record<string, Record<string, Record<string, number>>>

const FILE = fileURLToPath(new URL('./shipped-presets.json', import.meta.url))
/** The table's row for a device as it is with no preset loaded. */
const DEFAULTS = '(default)'

/** Every device the library registers: the stock ones and the WASM ones. */
const registry = registerStockWasmDevices()

/** Every name that loads a preset of the device: listed, retired, or from before a rename. */
function loadable(descriptor: DeviceDescriptor): string[] {
  return [
    ...listPresets(descriptor).map((preset) => preset.name),
    ...Object.keys(descriptor.retiredPresets ?? {}),
    ...Object.keys(descriptor.formerPresets ?? {}),
  ]
}

/** One line per preset, so a change to the file reads as the presets it adds. */
function write(shipped: Shipped): void {
  const devices = Object.entries(shipped).map(([id, table]) => {
    const rows = Object.entries(table).map(
      ([name, params]) => `    ${JSON.stringify(name)}: ${JSON.stringify(params)}`,
    )
    return `  ${JSON.stringify(id)}: {\n${rows.join(',\n')}\n  }`
  })
  writeFileSync(FILE, `{\n${devices.join(',\n')}\n}\n`)
}

describe('shipped presets', () => {
  const shipped = JSON.parse(readFileSync(FILE, 'utf8')) as Shipped

  if (process.env.UPDATE_SHIPPED_PRESETS) {
    it('adds what is new to shipped-presets.json and changes nothing that is there', () => {
      for (const descriptor of registry.list()) {
        const table = (shipped[descriptor.id] ??= {})
        table[DEFAULTS] = { ...defaultPreset(descriptor).params, ...table[DEFAULTS] }
        for (const name of loadable(descriptor)) {
          const params = presetParams(descriptor, resolvePreset(descriptor, name))
          table[name] = { ...params, ...table[name] }
        }
      }
      write(shipped)
    })
    return
  }

  it('load what they loaded when they shipped, under every name they ever had', () => {
    const problems: string[] = []
    for (const [id, table] of Object.entries(shipped)) {
      const descriptor = registry.get(id)
      if (!descriptor) {
        problems.push(`${id}: the device is gone`)
        continue
      }
      for (const [name, was] of Object.entries(table)) {
        if (name !== DEFAULTS && !hasPreset(descriptor, name)) {
          problems.push(
            `${id} "${name}" no longer loads: list it in formerPresets or retiredPresets`,
          )
          continue
        }
        const now =
          name === DEFAULTS
            ? (defaultPreset(descriptor).params as Record<string, number>)
            : presetParams(descriptor, resolvePreset(descriptor, name))
        for (const [param, value] of Object.entries(was)) {
          // A parameter the device has dropped is not a preset's doing.
          if (!(param in descriptor.params) || now[param] === value) continue
          problems.push(
            name === DEFAULTS
              ? `${id}: the default of ${param} was ${value} and is ${now[param]}; every saved device that leaves it alone changes with it`
              : `${id} "${name}": ${param} was ${value} and is ${now[param]}; give the retune a new name and keep this one in retiredPresets`,
          )
        }
      }
    }
    expect(problems).toEqual([])
  })

  it('are all in shipped-presets.json, with every parameter', () => {
    const missing: string[] = []
    for (const descriptor of registry.list()) {
      const table = shipped[descriptor.id] ?? {}
      for (const name of [DEFAULTS, ...loadable(descriptor)]) {
        if (!table[name]) missing.push(`${descriptor.id} "${name}"`)
        else {
          for (const param of Object.keys(descriptor.params)) {
            if (!(param in table[name])) missing.push(`${descriptor.id} "${name}" ${param}`)
          }
        }
      }
    }
    // Add them: UPDATE_SHIPPED_PRESETS=1 pnpm vitest run src/dsp/__tests__/shipped-presets.test.ts
    expect(missing).toEqual([])
  })

  it('keep a retired preset out of the lists and apart from the names of today', () => {
    const problems: string[] = []
    for (const descriptor of registry.list()) {
      const listed = listPresets(descriptor).map((preset) => preset.name)
      for (const name of Object.keys(descriptor.retiredPresets ?? {})) {
        if (listed.includes(name)) problems.push(`${descriptor.id} "${name}" is retired and listed`)
        if (name in (descriptor.formerPresets ?? {})) {
          problems.push(`${descriptor.id} "${name}" is retired and a former name`)
        }
      }
    }
    expect(problems).toEqual([])
    const tape = registry.list().find((descriptor) => descriptor.id === 'tape')
    expect(tape && resolvePreset(tape, 'Studio master').params.drive).toBe(0.4)
    expect(tape && resolvePreset(tape, 'Mastering deck').params.drive).toBe(0.55)
  })
})
