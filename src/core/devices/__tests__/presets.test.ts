import { describe, expect, it } from 'vitest'

import { asAudioContext, createMockContext } from '../../../testing'
import { EQ3_DESCRIPTOR, EQ3_PARAMS, createEq3 } from '../native/Eq3'
import { FILTER_DESCRIPTOR, FILTER_PARAMS, createFilter } from '../native/Filter'
import {
  PRESET_FORMAT_VERSION,
  type Preset,
  applyPreset,
  capturePreset,
  defaultPreset,
  hasPreset,
  isPreset,
  listPresets,
  parsePreset,
  presetParams,
  resolvePreset,
  serializePreset,
} from '../presets'

describe('presets', () => {
  it('materialises a descriptor table with the device id and version', () => {
    const presets = listPresets(FILTER_DESCRIPTOR)
    expect(presets.map((p) => p.name)).toEqual(Object.keys(FILTER_DESCRIPTOR.presets ?? {}))
    for (const preset of presets) {
      expect(preset.deviceId).toBe('filter')
      expect(preset.deviceVersion).toBe(FILTER_DESCRIPTOR.version)
    }
    expect(listPresets({ id: 'bare', version: 1, params: FILTER_PARAMS })).toEqual([])
  })

  it('builds the default preset from the spec defaults', () => {
    const preset = defaultPreset(EQ3_DESCRIPTOR)
    expect(preset).toEqual({
      name: 'Default',
      deviceId: 'eq3',
      deviceVersion: 1,
      params: Object.fromEntries(Object.entries(EQ3_PARAMS).map(([k, s]) => [k, s.default])),
    })
    expect(defaultPreset(EQ3_DESCRIPTOR, 'Init').name).toBe('Init')
  })

  it('resolves presets by name or validates a preset object', () => {
    const named = resolvePreset(FILTER_DESCRIPTOR, 'High-pass rumble')
    expect(named.params.frequency).toBe(80)
    expect(() => resolvePreset(FILTER_DESCRIPTOR, 'Nope')).toThrow(/no preset "Nope"/)

    const own: Preset = { name: 'x', deviceId: 'filter', deviceVersion: 1, params: { q: 2 } }
    expect(resolvePreset(FILTER_DESCRIPTOR, own)).toBe(own)
    const foreign: Preset = { ...own, deviceId: 'eq3' }
    expect(() => resolvePreset(FILTER_DESCRIPTOR, foreign)).toThrow(/is for eq3, not filter/)
    // Saved while the device went by another id: the same preset, under the id of today.
    const renamed = { ...FILTER_DESCRIPTOR, formerIds: ['eq3'] }
    expect(resolvePreset(renamed, foreign)).toEqual(own)
  })

  it('finds a renamed preset by the name it had, and lists it once under the name of today', () => {
    const renamed = { ...FILTER_DESCRIPTOR, formerPresets: { 'Rumble filter': 'High-pass rumble' } }
    expect(resolvePreset(renamed, 'Rumble filter')).toEqual(
      resolvePreset(renamed, 'High-pass rumble'),
    )
    expect(resolvePreset(renamed, 'Rumble filter').name).toBe('High-pass rumble')
    expect(listPresets(renamed).map((p) => p.name)).not.toContain('Rumble filter')
    expect(() => resolvePreset(renamed, 'Nope')).toThrow(/no preset "Nope"/)
    expect(hasPreset(renamed, 'Rumble filter')).toBe(true)
    expect(hasPreset(renamed, 'High-pass rumble')).toBe(true)
    expect(hasPreset(renamed, 'Nope')).toBe(false)
    expect(hasPreset(FILTER_DESCRIPTOR, 'Rumble filter')).toBe(false)
  })

  it('loads a retuned preset as it was under the name it had, and lists only the retune', () => {
    const retuned = {
      ...FILTER_DESCRIPTOR,
      presets: { ...FILTER_DESCRIPTOR.presets, 'Low rumble cut': { type: 1, frequency: 120 } },
      retiredPresets: { 'Rumble cut': { type: 1, frequency: 60 } },
    }
    const old = resolvePreset(retuned, 'Rumble cut')
    expect(old).toMatchObject({ name: 'Rumble cut', deviceId: 'filter' })
    expect(presetParams(retuned, old).frequency).toBe(60)
    expect(presetParams(retuned, resolvePreset(retuned, 'Low rumble cut')).frequency).toBe(120)
    expect(listPresets(retuned).map((p) => p.name)).not.toContain('Rumble cut')
    expect(hasPreset(retuned, 'Rumble cut')).toBe(true)
    expect(hasPreset(FILTER_DESCRIPTOR, 'Rumble cut')).toBe(false)
    // A name is looked up as a name, not as a property every object has.
    expect(hasPreset(retuned, 'constructor')).toBe(false)
    expect(() => resolvePreset(retuned, 'toString')).toThrow(/no preset "toString"/)
  })

  it('fills a full param map from a partial preset, clamped, dropping unknown params', () => {
    const preset: Preset = {
      name: 'old',
      deviceId: 'filter',
      deviceVersion: 1,
      params: { frequency: 99999, gain: -3, removedParam: 7 },
    }
    expect(presetParams(FILTER_DESCRIPTOR, preset)).toEqual({
      type: FILTER_PARAMS.type.default,
      frequency: FILTER_PARAMS.frequency.max,
      q: FILTER_PARAMS.q.default,
      gain: -3,
    })
  })

  it('keeps the params of a table that is only known once the device is made, as given', () => {
    const preset: Preset = {
      name: 'kept',
      deviceId: 'hosted',
      deviceVersion: 1,
      params: { p7: 0.3, frequency: 99999 },
    }
    // What is known beforehand is still clamped; the rest is the device's to clamp.
    const source = {
      id: 'hosted',
      version: 1,
      params: { frequency: FILTER_PARAMS.frequency },
      dynamicParams: true,
    }
    expect(presetParams(source, preset)).toEqual({
      p7: 0.3,
      frequency: FILTER_PARAMS.frequency.max,
    })
  })

  it('captures a live device and applies presets back, reporting skipped params', () => {
    const ctx = createMockContext()
    const source = createFilter(asAudioContext(ctx), { params: { frequency: 440, gain: 2 } })
    const captured = capturePreset(source, 'Snapshot', 3)
    expect(captured).toEqual({
      name: 'Snapshot',
      deviceId: 'filter',
      deviceVersion: 3,
      params: { type: 0, frequency: 440, q: FILTER_PARAMS.q.default, gain: 2 },
    })

    const target = createFilter(asAudioContext(ctx))
    const result = applyPreset(target, {
      ...captured,
      params: { ...captured.params, legacy: 1 },
    })
    expect(result).toEqual({ applied: ['type', 'frequency', 'q', 'gain'], skipped: ['legacy'] })
    expect(target.getParam('frequency')).toBe(440)
    expect(target.getParam('gain')).toBe(2)

    const eq = createEq3(asAudioContext(ctx))
    expect(() => applyPreset(eq, captured)).toThrow(/is for filter, not eq3/)
  })

  it('a param named as something every plain object has is unknown like any other', () => {
    const preset: Preset = {
      name: 'odd',
      deviceId: 'filter',
      deviceVersion: 1,
      params: JSON.parse('{"gain":-3,"constructor":1,"toString":2,"__proto__":3}'),
    }
    expect(presetParams(FILTER_DESCRIPTOR, preset)).toEqual({
      type: FILTER_PARAMS.type.default,
      frequency: FILTER_PARAMS.frequency.default,
      q: FILTER_PARAMS.q.default,
      gain: -3,
    })

    const target = createFilter(asAudioContext(createMockContext()))
    const changes: string[] = []
    target.onChange((change) => changes.push(change.type === 'param' ? change.name : change.type))
    expect(applyPreset(target, preset)).toEqual({
      applied: ['gain'],
      skipped: ['constructor', 'toString', '__proto__'],
    })
    expect(changes).toEqual(['gain'])
  })

  it('round-trips through JSON and rejects other formats or malformed input', () => {
    const preset: Preset = {
      name: 'Round trip',
      deviceId: 'delay',
      deviceVersion: 2,
      params: { timeSec: 0.5, mix: 0.4 },
    }
    const text = serializePreset(preset)
    expect(JSON.parse(text)).toEqual({ format: PRESET_FORMAT_VERSION, ...preset })
    expect(parsePreset(text)).toEqual(preset)
    expect(parsePreset(JSON.parse(text))).toEqual(preset)

    expect(() => parsePreset(JSON.stringify({ ...preset, format: 99 }))).toThrow(
      /unsupported preset format/,
    )
    expect(() => parsePreset(JSON.stringify(preset))).toThrow(/unsupported preset format/)
    expect(() => parsePreset('[]')).toThrow(/unsupported preset format/)
    expect(() =>
      parsePreset(JSON.stringify({ format: 1, ...preset, params: { timeSec: 'fast' } })),
    ).toThrow(/malformed preset/)
    expect(() => parsePreset(JSON.stringify({ format: 1, ...preset, name: 3 }))).toThrow(
      /malformed preset/,
    )
    expect(() => parsePreset('not json')).toThrow()
  })

  it('isPreset guards the in-memory shape', () => {
    expect(isPreset({ name: 'a', deviceId: 'b', deviceVersion: 1, params: {} })).toBe(true)
    expect(isPreset({ name: 'a', deviceId: 'b', deviceVersion: 1, params: { x: NaN } })).toBe(false)
    expect(isPreset({ name: 'a', deviceId: 'b', deviceVersion: 'v1', params: {} })).toBe(false)
    expect(isPreset({ name: 'a', deviceId: 'b', deviceVersion: 1, params: [] })).toBe(false)
    expect(isPreset(null)).toBe(false)
    expect(isPreset('preset')).toBe(false)
  })
})
