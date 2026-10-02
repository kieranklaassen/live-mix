// Generates everything mechanical about a "spec device": a WASM device whose
// cpp/devices/<id>/device.json carries its parameter table (`params` is an
// array there; the older hand-wired devices point at a TypeScript file
// instead and are left alone). One manifest is the single source for:
//
//   cpp/devices/<id>/params.gen.h        param enum + min/max/default tables
//   cpp/devices/<id>/device_api.gen.cpp  the flat C ABI over one static instance
//   src/dsp/devices/<id>.gen.ts          ParamSpec table, definition, descriptor, factory
//   src/dsp/devices/index.gen.ts         re-exports + GENERATED_WASM_DESCRIPTORS
//   scripts/devices.gen.sh               build and native-test entries
//   docs/devices-generated.md            the catalogue table
//
// so the C++ ids and the TypeScript ids cannot drift. The outputs are
// committed; `node scripts/gen-devices.mjs --check` (and the unit test
// src/dsp/__tests__/generated-devices.test.ts) fail when they are stale.
//
// Usage: node scripts/gen-devices.mjs [--check] [--only <id>]
//
// `--only <id>` writes just that device's own three files and leaves the
// shared lists alone: what scripts/dev-device.sh uses while one device is
// being written (several can then be in flight in one checkout).

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import prettier from 'prettier'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const devicesDir = join(root, 'cpp/devices')

export const CATEGORIES = [
  'instrument',
  'reverb',
  'delay',
  'texture',
  'pitch',
  'modulation',
  'eq',
  'dynamics',
  'drive',
  'spatial',
  'utility',
  'other',
]

const DEFAULT_MEMORY_MB = 4

const words = (text) => text.split(/[^A-Za-z0-9]+/).filter(Boolean)
const capitalise = (word) => word[0].toUpperCase() + word.slice(1)
const pascalCase = (text) => words(text).map(capitalise).join('')
const constCase = (text) => words(text).join('_').toUpperCase()
const snakeCase = (text) => words(text).join('_').toLowerCase()
const quote = (text) => `'${String(text).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

/** `0.35` → `0.35f`, `2` → `2.0f`: a float literal that round-trips. */
function floatLiteral(value) {
  const single = Math.fround(value)
  let text = String(value)
  if (Math.fround(Number(text)) !== single) text = single.toPrecision(9)
  if (!/[.eE]/.test(text)) text += '.0'
  return `${text}f`
}

function fail(id, message) {
  throw new Error(`gen-devices: ${id}: ${message}`)
}

/** Read and validate one manifest; returns null for a hand-wired device. */
function loadManifest(dir) {
  const path = join(devicesDir, dir, 'device.json')
  if (!existsSync(path)) return null
  const manifest = JSON.parse(readFileSync(path, 'utf8'))
  if (!Array.isArray(manifest.params)) return null

  const id = manifest.id
  if (id !== dir) fail(dir, `"id" must equal the directory name, got ${JSON.stringify(id)}`)
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(id)) fail(id, 'id must be kebab-case')
  if (!manifest.name) fail(id, 'needs a "name"')
  if (!CATEGORIES.includes(manifest.category)) {
    fail(id, `category must be one of ${CATEGORIES.join(', ')}`)
  }
  if (!manifest.description) fail(id, 'needs a one-sentence "description"')
  if (!/^[A-Z][A-Za-z0-9]*$/.test(manifest.class ?? '')) fail(id, 'needs a C++ "class" name')
  if (!manifest.header || !existsSync(join(devicesDir, dir, manifest.header))) {
    fail(id, `"header" ${manifest.header} not found in cpp/devices/${dir}`)
  }
  const sources = manifest.sources ?? []
  for (const source of sources) {
    if (!existsSync(join(root, source)))
      fail(id, `source ${source} not found (paths are repo-relative)`)
  }
  const instrument = manifest.category === 'instrument'
  if (manifest.params.length === 0) fail(id, 'needs at least one parameter')

  const keys = new Set()
  const params = manifest.params.map((param, index) => {
    const where = `param ${JSON.stringify(param.key ?? index)}`
    if (!/^[a-z][A-Za-z0-9]*$/.test(param.key ?? '')) fail(id, `${where}: key must be camelCase`)
    if (keys.has(param.key)) fail(id, `${where}: duplicate key`)
    keys.add(param.key)
    if (!param.name) fail(id, `${where}: needs a name`)
    let { min, max } = param
    const choices = param.choices
    if (choices !== undefined) {
      if (!Array.isArray(choices) || choices.length < 2)
        fail(id, `${where}: choices needs two or more labels`)
      if (min !== undefined || max !== undefined || param.taper !== undefined || param.unit) {
        fail(id, `${where}: a choice takes only key, name, choices and default`)
      }
      min = 0
      max = choices.length - 1
      if (!Number.isInteger(param.default)) fail(id, `${where}: a choice default is an index`)
    }
    const taper = param.taper ?? 'linear'
    if (taper !== 'linear' && taper !== 'log') fail(id, `${where}: taper must be linear or log`)
    for (const [field, value] of Object.entries({ min, max, default: param.default })) {
      if (typeof value !== 'number' || !Number.isFinite(value))
        fail(id, `${where}: ${field} must be a number`)
    }
    if (!(min < max)) fail(id, `${where}: needs min < max`)
    if (param.default < min || param.default > max) fail(id, `${where}: default outside the range`)
    if (taper === 'log' && min <= 0) fail(id, `${where}: a log taper needs a positive min`)
    if (
      param.description !== undefined &&
      (typeof param.description !== 'string' || !param.description.trim())
    ) {
      fail(id, `${where}: description must be a sentence or be left out`)
    }
    return {
      key: param.key,
      id: index,
      name: param.name,
      min,
      max,
      default: param.default,
      taper,
      unit: param.unit ?? '',
      choices,
      description: param.description,
    }
  })

  const meterKeys = new Set()
  if (manifest.meters !== undefined && !Array.isArray(manifest.meters)) {
    fail(id, '"meters" must be an array')
  }
  const meters = (manifest.meters ?? []).map((meter, index) => {
    const where = `meter ${JSON.stringify(meter.key ?? index)}`
    if (!/^[a-z][A-Za-z0-9]*$/.test(meter.key ?? '')) fail(id, `${where}: key must be camelCase`)
    if (meterKeys.has(meter.key)) fail(id, `${where}: duplicate key`)
    meterKeys.add(meter.key)
    if (!meter.name) fail(id, `${where}: needs a name`)
    return { key: meter.key, id: index, name: meter.name, unit: meter.unit ?? '' }
  })

  const presets = manifest.presets ?? {}
  for (const [presetName, values] of Object.entries(presets)) {
    for (const [key, value] of Object.entries(values)) {
      const param = params.find((candidate) => candidate.key === key)
      if (!param) fail(id, `preset ${JSON.stringify(presetName)} sets unknown param ${key}`)
      if (typeof value !== 'number' || value < param.min || value > param.max) {
        fail(id, `preset ${JSON.stringify(presetName)} sets ${key} to ${value}, outside its range`)
      }
    }
  }

  const memoryMb = manifest.memoryMb ?? DEFAULT_MEMORY_MB
  if (!Number.isInteger(memoryMb) || memoryMb < 1 || memoryMb > 256)
    fail(id, 'memoryMb must be 1..256')
  const test = `cpp/test/${snakeCase(id)}_test.cpp`
  if (!existsSync(join(root, test))) fail(id, `native harness ${test} not found`)

  return {
    id,
    dir,
    name: manifest.name,
    category: manifest.category,
    description: manifest.description,
    className: manifest.class,
    header: manifest.header,
    sources,
    instrument,
    samples: manifest.samples === true,
    experimental: manifest.experimental === true,
    latencySamples: manifest.latencySamples,
    memoryMb,
    params,
    meters,
    presets,
    test,
    namespace: snakeCase(id),
    constant: constCase(id),
    pascal: pascalCase(id),
  }
}

export function loadManifests(only) {
  return readdirSync(devicesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => only === undefined || name === only)
    .sort()
    .map(loadManifest)
    .filter(Boolean)
}

// --- C++ ------------------------------------------------------------------------------------

function paramsHeader(device) {
  const enumerators = device.params
    .map((param) => `  k${capitalise(param.key)} = ${param.id},`)
    .join('\n')
  const table = (field) => device.params.map((param) => floatLiteral(param[field])).join(', ')
  const comments = device.params
    .map((param) => {
      const range = param.choices
        ? param.choices.map((choice, index) => `${index} ${choice}`).join(', ')
        : `${param.min}..${param.max}${param.unit ? ` ${param.unit}` : ''}`
      return `//   ${String(param.id).padStart(2)}  ${param.key}: ${range}, default ${param.default}`
    })
    .join('\n')
  return `// GENERATED by scripts/gen-devices.mjs from device.json. Do not edit.
//
// Parameter ids and ranges of ${device.name}, shared with
// src/dsp/devices/${device.id}.gen.ts:
${comments}

#pragma once

namespace livemix {
namespace ${device.namespace} {

enum Param : int {
${enumerators}
  kNumParams = ${device.params.length},
};

inline constexpr float kParamMin[kNumParams] = {${table('min')}};
inline constexpr float kParamMax[kNumParams] = {${table('max')}};
inline constexpr float kParamDefault[kNumParams] = {${table('default')}};

}  // namespace ${device.namespace}
}  // namespace livemix
`
}

function apiSource(device) {
  const note = device.instrument
    ? `
void device_note_on(int note_id, float frequency, float gain) {
  g_device.note_on(note_id, frequency, gain);
}

void device_note_off(int note_id) { g_device.note_off(note_id); }
`
    : ''
  const samples = device.samples
    ? `
int device_sample_capacity(void) { return g_device.sample_capacity(); }

float* device_sample_buffer(void) { return g_device.sample_buffer(); }

void device_sample_commit(int frames, int channels, float sample_rate) {
  g_device.sample_commit(frames, channels, sample_rate);
}
`
    : ''
  const meters =
    device.meters.length > 0
      ? `
float device_meter(int index) { return g_device.meter(index); }
`
      : ''
  return `// GENERATED by scripts/gen-devices.mjs from device.json. Do not edit.
//
// Flat C ABI (cpp/common/device_api.h) over ${device.name} for the
// WASM/AudioWorklet boundary. The single static instance is the only global.

#include "../../common/device_api.h"
#include "${device.header}"

namespace {
livemix::${device.className} g_device;
}

extern "C" {

void device_init(float sample_rate, int /*max_block_frames*/) { g_device.init(sample_rate); }

void device_set_param(int param_id, float value) { g_device.set_param(param_id, value); }

float* device_in_left(void) { return g_device.in_left(); }

float* device_in_right(void) { return g_device.in_right(); }

float* device_out_left(void) { return const_cast<float*>(g_device.out_left()); }

float* device_out_right(void) { return const_cast<float*>(g_device.out_right()); }

int device_max_block_frames(void) { return livemix::${device.className}::kMaxBlockFrames; }

void device_process(int frames) { g_device.process(frames); }
${note}${samples}${meters}
}  // extern "C"
`
}

// --- TypeScript -----------------------------------------------------------------------------

function deviceModule(device) {
  const params = device.params
    .map((param) => {
      const fields = [
        `id: ${param.id}`,
        `name: ${quote(param.name)}`,
        `min: ${param.min}`,
        `max: ${param.max}`,
        `default: ${param.default}`,
        `taper: ${quote(param.taper)}`,
        `unit: ${quote(param.unit)}`,
      ]
      if (param.choices) fields.push(`choices: [${param.choices.map(quote).join(', ')}]`)
      if (param.description) fields.push(`description: ${quote(param.description)}`)
      return `  ${param.key}: { ${fields.join(', ')} },`
    })
    .join('\n')
  const presets = Object.entries(device.presets)
    .map(([name, values]) => {
      const body = Object.entries(values)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')
      return `    ${quote(name)}: { ${body} },`
    })
    .join('\n')
  const meta = [
    `  name: ${quote(device.name)},`,
    `  category: ${quote(device.category)},`,
    `  description: ${quote(device.description)},`,
  ]
  if (device.experimental) meta.push('  experimental: true,')
  if (presets) meta.push(`  presets: {\n${presets}\n  },`)
  const latency =
    device.latencySamples === undefined ? '' : `\n  latencySamples: () => ${device.latencySamples},`
  const metered = device.meters.length > 0
  const meterTable = metered
    ? `
export const ${device.constant}_METERS = {
${device.meters
  .map(
    (meter) =>
      `  ${meter.key}: { id: ${meter.id}, name: ${quote(meter.name)}, unit: ${quote(meter.unit)} },`,
  )
  .join('\n')}
} as const satisfies Record<string, DeviceMeterSpec>
`
    : ''
  const meterImport = metered
    ? `import { type DeviceMeterSpec } from '../../core/devices/Device'\n`
    : ''
  const meterField = metered ? `\n  meters: ${device.constant}_METERS,` : ''
  const play = device.instrument
    ? ` Play it through \`NoteDevice\`: \`noteOn(id, frequency, gain)\` / \`noteOff(id)\`.`
    : ''
  return `// GENERATED by scripts/gen-devices.mjs from cpp/devices/${device.id}/device.json. Do not edit.

${meterImport}import { type ParamSpec } from '../../core/params'
import { wasmDeviceDescriptor } from '../descriptor'
import { defineWasmDevice, WasmDevice, type WasmDeviceOptions } from '../WasmDevice'

export const ${device.constant}_PARAMS = {
${params}
} as const satisfies Record<string, ParamSpec>

export type ${device.pascal}ParamName = keyof typeof ${device.constant}_PARAMS
${meterTable}
export const ${device.constant}_DEVICE = defineWasmDevice({
  id: ${quote(device.id)},
  // Static literal so Vite can rewrite it to a hashed asset URL at build time.
  wasm: () => new URL(${quote(`../wasm/${device.id}.wasm`)}, import.meta.url),
  params: ${device.constant}_PARAMS,${latency}${meterField}
})

export const ${device.constant}_DESCRIPTOR = wasmDeviceDescriptor(${device.constant}_DEVICE, {
${meta.join('\n')}
})

export type ${device.pascal} = WasmDevice<typeof ${device.constant}_PARAMS>

/** ${device.description}${play} */
export function create${device.pascal}(
  context: BaseAudioContext,
  options: WasmDeviceOptions<typeof ${device.constant}_PARAMS> = {},
): Promise<${device.pascal}> {
  return WasmDevice.create(context, ${device.constant}_DEVICE, options)
}
`
}

function indexModule(devices) {
  const exports = devices.map((device) => `export * from './${device.id}.gen'`).join('\n')
  const imports = devices
    .map(
      (device) =>
        `import { ${device.constant}_DESCRIPTOR, ${device.constant}_DEVICE } from './${device.id}.gen'`,
    )
    .join('\n')
  const definitions = devices.map((device) => `  ${device.constant}_DEVICE,`).join('\n')
  const list = devices.map((device) => `  ${device.constant}_DESCRIPTOR,`).join('\n')
  return `// GENERATED by scripts/gen-devices.mjs from cpp/devices/*/device.json. Do not edit.

import { type DeviceDescriptor } from '../../core/devices'
import { type WasmDeviceDefinition } from '../WasmDevice'
${imports}

${exports}

/** Every generated WASM device, in id order; part of \`STOCK_WASM_DEVICES\`. */
export const GENERATED_WASM_DESCRIPTORS: readonly DeviceDescriptor[] = [
${list}
]

/** Their definitions (module location and parameter table), in the same order. */
export const GENERATED_WASM_DEFINITIONS: readonly WasmDeviceDefinition[] = [
${definitions}
]

/** What the device-agnostic tests need to know about each generated artefact. */
export const GENERATED_WASM_DEVICES = [
${devices
  .map(
    (device) =>
      `  { id: ${quote(device.id)}, instrument: ${device.instrument}, samples: ${device.samples}, meters: ${device.meters.length}, memoryMb: ${device.memoryMb} },`,
  )
  .join('\n')}
] as const
`
}

// --- shell ----------------------------------------------------------------------------------

function shellEntries(devices) {
  const build = devices
    .map((device) => {
      const extras = []
      if (device.instrument) extras.push('_device_note_on', '_device_note_off')
      if (device.samples) {
        extras.push('_device_sample_capacity', '_device_sample_buffer', '_device_sample_commit')
      }
      if (device.meters.length > 0) extras.push('_device_meter')
      const extra = extras.length > 0 ? `,${extras.join(',')}` : ''
      const sources = [`cpp/devices/${device.id}/device_api.gen.cpp`, ...device.sources]
      return `  MEMORY_BYTES=${device.memoryMb * 1024 * 1024} EXTRA_EXPORTS="${extra}" build_device ${device.id} \\\n    ${sources.join(' \\\n    ')}`
    })
    .join('\n')
  const tests = devices
    .map((device) => {
      const sources = [device.test, ...device.sources]
      return `  native_test ${snakeCase(device.id)}_test \\\n    ${sources.join(' \\\n    ')}`
    })
    .join('\n')
  return `#!/bin/bash
# GENERATED by scripts/gen-devices.mjs from cpp/devices/*/device.json. Do not edit.
# Sourced by scripts/build-wasm.sh (build_device) and scripts/test-native.sh
# (native_test).

build_generated_devices() {
${build || '  :'}
}

test_generated_devices() {
${tests || '  :'}
}
`
}

// --- docs -----------------------------------------------------------------------------------

function catalogue(devices) {
  const rows = devices
    .map((device) => {
      const params = device.params.map((param) => param.key).join(', ')
      const presets = Object.keys(device.presets).join(', ')
      return `| \`${device.id}\` | ${device.name} | ${device.category} | ${device.description} | ${params} | ${presets} |`
    })
    .join('\n')
  return `# Generated devices

<!-- GENERATED by scripts/gen-devices.mjs from cpp/devices/*/device.json. Do not edit. -->

The devices below are built from a manifest (\`cpp/devices/<id>/device.json\`):
the parameter table, the C ABI shim, the TypeScript module and the registry
descriptor are generated from it, and the C++ shares the kit in \`cpp/kit\`.
Measured CPU costs and the notes on each algorithm are in
[devices.md](./devices.md); adding one is the
[recipe](./recipes/adding-a-wasm-device.md).

| Device id | Name | Category | What it is | Params | Presets |
| --- | --- | --- | --- | --- | --- |
${rows}
`
}

// --- main -----------------------------------------------------------------------------------

async function format(path, source) {
  if (!/\.(ts|md)$/.test(path)) return source
  const options = await prettier.resolveConfig(path)
  return prettier.format(source, { ...options, filepath: path })
}

export async function generate(only) {
  const devices = loadManifests(only)
  if (only !== undefined && devices.length === 0) {
    throw new Error(`gen-devices: no spec device "${only}" (cpp/devices/${only}/device.json)`)
  }
  const outputs = new Map()
  for (const device of devices) {
    outputs.set(join(devicesDir, device.dir, 'params.gen.h'), paramsHeader(device))
    outputs.set(join(devicesDir, device.dir, 'device_api.gen.cpp'), apiSource(device))
    outputs.set(join(root, 'src/dsp/devices', `${device.id}.gen.ts`), deviceModule(device))
  }
  if (only === undefined) {
    outputs.set(join(root, 'src/dsp/devices/index.gen.ts'), indexModule(devices))
    outputs.set(join(root, 'scripts/devices.gen.sh'), shellEntries(devices))
    outputs.set(join(root, 'docs/devices-generated.md'), catalogue(devices))
  }
  const formatted = new Map()
  for (const [path, source] of outputs) formatted.set(path, await format(path, source))
  return { devices, outputs: formatted }
}

/** Paths (repo-relative) whose committed content differs from what the manifests produce. */
export async function staleOutputs() {
  const { outputs } = await generate()
  const stale = []
  for (const [path, source] of outputs) {
    if (!existsSync(path) || readFileSync(path, 'utf8') !== source) stale.push(relative(root, path))
  }
  return stale
}

async function main() {
  const check = process.argv.includes('--check')
  if (check) {
    const stale = await staleOutputs()
    if (stale.length > 0) {
      console.error('gen-devices: stale generated files (run node scripts/gen-devices.mjs):')
      for (const path of stale) console.error(`  ${path}`)
      process.exit(1)
    }
    console.log('gen-devices: generated files are up to date')
    return
  }
  const onlyIndex = process.argv.indexOf('--only')
  const only = onlyIndex >= 0 ? process.argv[onlyIndex + 1] : undefined
  const { devices, outputs } = await generate(only)
  let written = 0
  for (const [path, source] of outputs) {
    if (existsSync(path) && readFileSync(path, 'utf8') === source) continue
    writeFileSync(path, source)
    written += 1
  }
  console.log(`gen-devices: ${devices.length} device(s), ${written} file(s) written`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error.message ?? error)
    process.exit(1)
  })
}
