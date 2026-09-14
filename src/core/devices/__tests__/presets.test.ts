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
