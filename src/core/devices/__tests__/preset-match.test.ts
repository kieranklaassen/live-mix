import { describe, expect, it } from 'vitest'

import { type ParamSpec } from '../../params'
import { atDefaults, currentPreset, presetIsOn, retiredPresets, stepPreset } from '../preset-match'
import { type Preset } from '../presets'

const spec = (min: number, max: number, def: number): ParamSpec => ({
  id: 0,
  name: '',
  min,
  max,
  default: def,
  taper: 'linear',
  unit: '',
})

const SPECS = { cutoff: spec(20, 20000, 1000), mix: spec(0, 1, 0.5), drive: spec(0, 1, 0) }
const preset = (name: string, params: Record<string, number>): Preset => ({
  name,
  deviceId: 'ember',
  deviceVersion: 1,
  params,
})
const WARM = preset('Warm pad', { cutoff: 750, mix: 0.3 })
const GLASS = preset('Glass pad', { cutoff: 6000, mix: 0.3 })
const DRY = preset('Dry', { mix: 0.3 })

describe('presetIsOn', () => {
  it('is on while every parameter is where it puts it: the ones it names, and the rest where they start', () => {
    expect(presetIsOn(WARM, { cutoff: 750, mix: 0.3, drive: 0 }, SPECS)).toBe(true)
    expect(presetIsOn(WARM, { cutoff: 751, mix: 0.3, drive: 0 }, SPECS)).toBe(true)
    expect(presetIsOn(WARM, { cutoff: 900, mix: 0.3, drive: 0 }, SPECS)).toBe(false)
    // A parameter the preset does not name has left it behind once it is turned.
    expect(presetIsOn(WARM, { cutoff: 750, mix: 0.3, drive: 0.9 }, SPECS)).toBe(false)
  })

  it('takes a value as the device keeps it: in single precision, and inside the range', () => {
    expect(presetIsOn(DRY, { cutoff: 1000, mix: Math.fround(0.3), drive: 0 }, SPECS)).toBe(true)
    expect(
      presetIsOn(preset('Open', { cutoff: 40000 }), { cutoff: 20000, mix: 0.5, drive: 0 }, SPECS),
    ).toBe(true)
  })

  it('is never on for a preset that names no parameter the device has', () => {
    expect(
      presetIsOn(preset('Old', { gone: 1 }), { cutoff: 1000, mix: 0.5, drive: 0 }, SPECS),
    ).toBe(false)
  })

  it('does not take a name every object has for a parameter, or for a value', () => {
    // `toString` is no parameter of this device: a preset naming only that is not its preset.
    expect(
      presetIsOn(preset('Old', { toString: 1 }), { cutoff: 1000, mix: 0.5, drive: 0 }, SPECS),
    ).toBe(false)
    // A parameter that is called `constructor`, left alone by the preset, is where the device starts it.
    const specs = { ...SPECS, constructor: spec(0, 1, 0.25) }
    expect(presetIsOn(DRY, { cutoff: 1000, mix: 0.3, drive: 0, constructor: 0.25 }, specs)).toBe(
      true,
    )
    expect(presetIsOn(DRY, { cutoff: 1000, mix: 0.3, drive: 0, constructor: 0.5 }, specs)).toBe(
      false,
    )
  })

  it('is on for a preset that names nothing while every parameter is where the device starts it', () => {
    const start = preset('As it starts', {})
    expect(presetIsOn(start, { cutoff: 1000, mix: 0.5, drive: 0 }, SPECS)).toBe(true)
    expect(presetIsOn(start, { cutoff: 1000, mix: 0.6, drive: 0 }, SPECS)).toBe(false)
  })
})

describe('currentPreset', () => {
  const presets = [DRY, WARM, GLASS]

  it('is the preset the parameters are on, and none once one has been turned', () => {
    expect(currentPreset(presets, { cutoff: 6000, mix: 0.3, drive: 0 }, SPECS)?.name).toBe(
      'Glass pad',
    )
    expect(currentPreset(presets, { cutoff: 6000, mix: 0.4, drive: 0 }, SPECS)).toBeNull()
  })

  it('of two that fit, takes the one picked last, else the one that names more', () => {
    // The same sound written twice: once with the parameter it leaves alone spelled out.
    const spelled = preset('Dry, spelled out', { cutoff: 1000, mix: 0.3 })
    const both = [DRY, spelled, GLASS]
    const values = { cutoff: 1000, mix: 0.3, drive: 0 }
    expect(currentPreset(both, values, SPECS)?.name).toBe('Dry, spelled out')
    expect(currentPreset(both, values, SPECS, 'Dry')?.name).toBe('Dry')
    // One that was picked and no longer fits does not count.
    expect(currentPreset(both, values, SPECS, 'Glass pad')?.name).toBe('Dry, spelled out')
  })
})

describe('retiredPresets', () => {
  it('names the preset a saved score is on once that preset was retuned, apart from the listed ones', () => {
    const source = {
      id: 'ember',
      version: 1,
      params: SPECS,
      presets: { 'Warm pad': WARM.params, Dimmed: { cutoff: 400, mix: 0.3 } },
      retiredPresets: { Dim: { cutoff: 900, mix: 0.3 } },
    }
    const retired = retiredPresets(source)
    expect(retired).toEqual([preset('Dim', { cutoff: 900, mix: 0.3 })])
    const saved = { cutoff: 900, mix: 0.3, drive: 0 }
    expect(currentPreset([WARM], saved, SPECS)).toBeNull()
    expect(currentPreset(retired, saved, SPECS)?.name).toBe('Dim')
    expect(retiredPresets({ id: 'ember', version: 1, params: SPECS })).toEqual([])
    expect(retiredPresets(null)).toEqual([])
  })
})

describe('atDefaults', () => {
  it('tells a device no parameter of which has been turned', () => {
    expect(atDefaults({ cutoff: 1000, mix: 0.5, drive: 0 }, SPECS)).toBe(true)
    expect(atDefaults({ cutoff: 1000, mix: 0.5, drive: 0.1 }, SPECS)).toBe(false)
  })
})

describe('stepPreset', () => {
  const presets = [DRY, WARM, GLASS]

  it('steps to the next and the one before, round the ends', () => {
    expect(stepPreset(presets, 'Dry', 1)?.name).toBe('Warm pad')
    expect(stepPreset(presets, 'Glass pad', 1)?.name).toBe('Dry')
    expect(stepPreset(presets, 'Dry', -1)?.name).toBe('Glass pad')
  })

  it('from no preset goes to the first, or back to the last', () => {
    expect(stepPreset(presets, null, 1)?.name).toBe('Dry')
    expect(stepPreset(presets, null, -1)?.name).toBe('Glass pad')
    expect(stepPreset([], null, 1)).toBeNull()
  })
})
