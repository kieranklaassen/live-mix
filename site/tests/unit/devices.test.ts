import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { DeviceRegistry, devices as nodeDevices } from '@kieranklaassen/live-mix'
import { registerStockWasmDevices } from '@kieranklaassen/live-mix/dsp'
import {
  catalogue,
  catalogueEntry,
  describeDevice,
  families,
  formatValue,
  lessonsUsing,
  paramDefault,
  paramRange,
  presetSettings,
} from '../../src/lib/devices.ts'
import { REPO_ROOT } from '../../src/lib/site.ts'

const SITE = fileURLToPath(new URL('../..', import.meta.url))

// The registry as a consumer joins it, made here apart from the code under test.
const registry = registerStockWasmDevices(new DeviceRegistry(nodeDevices.list()))

describe('the catalogue', () => {
  it('has an entry for every id in the joined registry', () => {
    const ids = catalogue().map((device) => device.id)
    expect(ids.length).toBeGreaterThan(100)
    expect([...ids].sort()).toEqual([...registry.ids()].sort())
    expect(ids).toContain('convolver-reverb')
    expect(ids).toContain('plate-reverb')
  })

  it('groups every device once, in the order of the library’s families', () => {
    const grouped = families()
    expect(grouped[0]).toMatchObject({ id: 'instrument', label: 'Instruments' })
    expect(grouped.every((family) => family.devices.length > 0)).toBe(true)
    expect(grouped.flatMap((family) => family.devices).length).toBe(registry.ids().length)
    for (const family of grouped) {
      expect(family.devices.every((device) => device.category === family.id)).toBe(true)
    }
  })

  it('carries what the descriptor says of a device', () => {
    const plate = catalogueEntry('plate-reverb')
    const descriptor = registry.describe('plate-reverb')
    expect(plate).toMatchObject({
      name: descriptor.name,
      category: 'reverb',
      family: 'Reverb',
      description: descriptor.description,
    })
    expect(plate?.params.map((param) => param.key)).toEqual(Object.keys(descriptor.params))
    expect(plate?.params.find((param) => param.key === 'predelayMs')).toMatchObject({
      name: 'Pre-delay',
      min: 0,
      max: 250,
      default: 20,
      unit: 'ms',
      description: descriptor.params.predelayMs?.description,
    })
    expect(plate?.presets.map((preset) => preset.name)).toEqual(
      Object.keys(descriptor.presets ?? {}),
    )
  })

  it('names a source path that exists in the repository, for every device', () => {
    const missing = catalogue().filter(
      (device) => !fs.existsSync(path.join(REPO_ROOT, device.source)),
    )
    expect(missing.map((device) => `${device.id}: ${device.source}`)).toEqual([])
  })

  it('points at the folder, the .dsp file or the TypeScript file by how the device is made', () => {
    expect(catalogueEntry('plate-reverb')?.source).toBe('cpp/devices/plate-reverb/')
    expect(catalogueEntry('hall-reverb')?.source).toBe('cpp/faust/hall-reverb.dsp')
    expect(catalogueEntry('convolver-reverb')?.source).toBe(
      'src/core/devices/native/ConvolverReverb.ts',
    )
    expect(catalogueEntry('rack')?.source).toBe('src/core/devices/Rack.ts')
  })
})

describe('a control', () => {
  it('with an enumerated range lists its choices', () => {
    const type = catalogueEntry('filter')?.params.find((param) => param.key === 'type')
    expect(type?.choices).toEqual(registry.describe('filter').params.type?.choices)
    expect(type?.choices.length).toBe(8)
    expect(paramRange(type!)).toBe(type!.choices.join(', '))
    expect(paramDefault(type!)).toBe('Low pass')
  })

  it('with a range of numbers prints its ends and its default', () => {
    const q = catalogueEntry('filter')!.params.find((param) => param.key === 'q')!
    expect(paramRange(q)).toBe('0.1 to 20')
    expect(paramDefault(q)).toBe('0.7071')
    expect(formatValue(23520)).toBe('23520')
    expect(formatValue(-24)).toBe('-24')
  })

  it('is named with its value in what a preset sets', () => {
    const filter = catalogueEntry('filter')!
    const settings = presetSettings(filter, { name: 'Made up', params: { type: 1, frequency: 80 } })
    expect(settings).toEqual([
      { name: 'Type', value: 'High pass' },
      { name: 'Frequency', value: '80 Hz' },
    ])
  })
})

describe('a descriptor with nothing said', () => {
  const bare = describeDevice({
    id: 'rack',
    name: 'Bare',
    kind: 'rack',
    category: 'utility',
    version: 1,
    params: {
      mix: { id: 0, name: 'Mix', min: 0, max: 1, default: 1, taper: 'linear', unit: '' },
    },
    create: () => {
      throw new Error('never made')
    },
  })

  it('builds, with empty text where the description would be', () => {
    expect(bare.description).toBe('')
    expect(bare.params[0]?.description).toBe('')
    expect(bare.params[0]?.choices).toEqual([])
    expect(bare.presets).toEqual([])
  })

  it('is what the rack is today: the page says nothing in its place', () => {
    expect(registry.describe('rack').description).toBeUndefined()
    expect(catalogueEntry('rack')?.description).toBe('')
  })
})

describe('the lessons of a device', () => {
  const lessons = [
    { id: 'b', title: 'Second', order: 2, devices: ['plate-reverb', 'filter'] },
    { id: 'a', title: 'First', order: 1, devices: ['plate-reverb'] },
  ]

  it('are the ones whose frontmatter names it, in course order', () => {
    expect(lessonsUsing('plate-reverb', lessons).map((lesson) => lesson.id)).toEqual(['a', 'b'])
    expect(lessonsUsing('filter', lessons).map((lesson) => lesson.id)).toEqual(['b'])
  })

  it('are none for a device no lesson names, so the page shows no block', () => {
    expect(lessonsUsing('hall-reverb', lessons)).toEqual([])
    expect(lessonsUsing('plate-reverb', [])).toEqual([])
  })
})

describe('build-api.mjs', () => {
  it('puts the API reference under api/ of the built site, marked for the search', () => {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'site-api-'))
    try {
      // TypeDoc takes half a minute: a reference already written is used as it is.
      const reuse = fs.existsSync(path.join(REPO_ROOT, 'docs/api/index.html'))
      execFileSync('node', ['scripts/build-api.mjs', out], {
        cwd: SITE,
        env: { ...process.env, ...(reuse ? { SITE_API_REUSE: '1' } : {}) },
        stdio: 'pipe',
      })
      const index = path.join(out, 'api/index.html')
      expect(fs.existsSync(index)).toBe(true)
      // On the column of text, with the filter the search page tells the reference by.
      expect(fs.readFileSync(index, 'utf8')).toContain(
        '<div class="col-content" data-pagefind-body data-pagefind-filter="section:API">',
      )
      // The source is left as TypeDoc wrote it.
      expect(fs.readFileSync(path.join(REPO_ROOT, 'docs/api/index.html'), 'utf8')).not.toContain(
        'data-pagefind-body',
      )
    } finally {
      fs.rmSync(out, { recursive: true, force: true })
    }
  }, 240_000)
})
