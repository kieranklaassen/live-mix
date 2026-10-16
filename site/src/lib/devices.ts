// The device catalogue: every descriptor the library ships, read once when the site is built.
// Importing the package's two entries in Node registers nothing and needs no browser; only
// `create` touches the Web Audio API, and nothing here calls it.
import fs from 'node:fs'
import path from 'node:path'
import {
  DEVICE_CATEGORIES,
  DeviceRegistry,
  devices as nodeDevices,
  type DeviceCategory,
  type DeviceDescriptor,
} from '@kieranklaassen/live-mix'
import { registerStockWasmDevices } from '@kieranklaassen/live-mix/dsp'
import { REPO_ROOT } from './site.ts'

export interface CatalogueParam {
  /** The name `setParam` takes. */
  key: string
  name: string
  min: number
  max: number
  default: number
  unit: string
  /** Labels of an enumerated control, one per whole number from `min` to `max`; empty otherwise. */
  choices: readonly string[]
  /** What turning it does, as the library words it; empty when the library says nothing. */
  description: string
}

export interface CataloguePreset {
  name: string
  /** The controls the preset sets, by key; the others stay at their defaults. */
  params: Readonly<Record<string, number>>
}

export interface CatalogueDevice {
  id: string
  name: string
  category: DeviceCategory
  /** The family's label as the library prints it in a device list. */
  family: string
  /** One sentence, as the library words it; empty when the library says nothing. */
  description: string
  /** The library ships it but has not cleared it for production (docs/devices.md). */
  experimental: boolean
  params: CatalogueParam[]
  presets: CataloguePreset[]
  /** Where its code is, from the repository's root; a folder ends in a slash. */
  source: string
}

export interface CatalogueFamily {
  id: DeviceCategory
  label: string
  devices: CatalogueDevice[]
}

/** What a device page needs to know of a lesson. */
export interface LessonRef {
  id: string
  title: string
  /** Its place in the map of the lessons, from 1. */
  number: number
  devices: readonly string[]
}

// The devices built from Web Audio nodes and the rack have no folder under cpp/: each is one file.
const TYPESCRIPT_SOURCES: Readonly<Record<string, string>> = {
  filter: 'src/core/devices/native/Filter.ts',
  eq3: 'src/core/devices/native/Eq3.ts',
  'parametric-eq': 'src/core/devices/native/ParametricEq.ts',
  compressor: 'src/core/devices/native/Compressor.ts',
  delay: 'src/core/devices/native/Delay.ts',
  'convolver-reverb': 'src/core/devices/native/ConvolverReverb.ts',
  utility: 'src/core/devices/native/Utility.ts',
  ducker: 'src/core/devices/native/WorkletDucker.ts',
  rack: 'src/core/devices/Rack.ts',
}

const inRepo = (relPath: string) => fs.existsSync(path.join(REPO_ROOT, relPath))

function sourcePath(id: string): string {
  const folder = `cpp/devices/${id}/`
  if (inRepo(folder)) return folder
  const dsp = `cpp/faust/${id}.dsp`
  if (inRepo(dsp)) return dsp
  const file = TYPESCRIPT_SOURCES[id]
  if (!file) {
    throw new Error(
      `site: device "${id}" has no folder in cpp/devices and no .dsp in cpp/faust; ` +
        'name its file in TYPESCRIPT_SOURCES (site/src/lib/devices.ts)',
    )
  }
  return file
}

const familyLabel = (category: DeviceCategory) =>
  DEVICE_CATEGORIES.find((entry) => entry.id === category)?.label ?? category

/** A descriptor as the catalogue keeps it: plain data, nothing that makes sound. */
export function describeDevice(descriptor: DeviceDescriptor): CatalogueDevice {
  return {
    id: descriptor.id,
    name: descriptor.name,
    category: descriptor.category,
    family: familyLabel(descriptor.category),
    description: descriptor.description ?? '',
    experimental: descriptor.experimental === true,
    params: Object.entries(descriptor.params).map(([key, spec]) => ({
      key,
      name: spec.name,
      min: spec.min,
      max: spec.max,
      default: spec.default,
      unit: spec.unit,
      choices: spec.choices ?? [],
      description: spec.description ?? '',
    })),
    presets: Object.entries(descriptor.presets ?? {}).map(([name, params]) => ({
      name,
      params: { ...(params as Record<string, number>) },
    })),
    source: sourcePath(descriptor.id),
  }
}

// Joined as a consumer joins them: the node devices and the rack are in the root's registry,
// the compiled ones come from ./dsp. A copy, so the library's own registry is left as it was.
const joined = registerStockWasmDevices(new DeviceRegistry(nodeDevices.list()))
const all: CatalogueDevice[] = joined.list().map(describeDevice)

/** Every device, in the registry's order. */
export function catalogue(): CatalogueDevice[] {
  return all
}

export function catalogueEntry(id: string): CatalogueDevice | undefined {
  return all.find((device) => device.id === id)
}

/** The devices by family, in the library's menu order, each family by name; empty families are left out. */
export function families(): CatalogueFamily[] {
  return DEVICE_CATEGORIES.map(({ id, label }) => ({
    id,
    label,
    devices: all
      .filter((device) => device.category === id)
      .sort((a, b) => a.name.localeCompare(b.name, 'en')),
  })).filter((family) => family.devices.length > 0)
}

/** The lessons whose frontmatter names the device, in the order of the course. */
export function lessonsUsing<L extends LessonRef>(deviceId: string, lessons: readonly L[]): L[] {
  return lessons
    .filter((lesson) => lesson.devices.includes(deviceId))
    .sort((a, b) => a.number - b.number)
}

/** A number for a table: whole numbers whole, the rest to four significant figures. */
export function formatValue(value: number): string {
  return String(Number.isInteger(value) ? value : Number(value.toPrecision(4)))
}

/** The choices of an enumerated control, else the two ends of its range. */
export function paramRange(param: CatalogueParam): string {
  if (param.choices.length > 0) return param.choices.join(', ')
  return `${formatValue(param.min)} to ${formatValue(param.max)}`
}

const choiceLabel = (param: CatalogueParam, value: number) =>
  param.choices[Math.round(value) - param.min]

/** The default as a number, or as the label of the choice it stands for. */
export function paramDefault(param: CatalogueParam): string {
  return choiceLabel(param, param.default) ?? formatValue(param.default)
}

/** What a preset sets, control by control, in the device's own order: name and value with its unit. */
export function presetSettings(
  device: CatalogueDevice,
  preset: CataloguePreset,
): { name: string; value: string }[] {
  return device.params
    .filter((param) => Object.hasOwn(preset.params, param.key))
    .map((param) => {
      const value = preset.params[param.key] as number
      // A unit that is a word stands apart ("20 ms"); a sign joins the number ("4:1", "50%").
      const unit = /^[a-z]/i.test(param.unit) ? ` ${param.unit}` : param.unit
      return { name: param.name, value: choiceLabel(param, value) ?? formatValue(value) + unit }
    })
}
