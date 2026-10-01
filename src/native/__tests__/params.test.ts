import { describe, expect, it } from 'vitest'

import { isChoiceParam } from '../../react/components/control-math'
import {
  fromNormalised,
  isExposedNativeParam,
  nativeParamKey,
  nativeParamSpec,
  nativeParamSpecs,
  tidyParamText,
  toNormalised,
} from '../params'
import { fakeReverbParams } from '../../testing/fake-plugin-host'

describe('native parameter mapping', () => {
  it('keeps the plug-in order although every VST3 id is a number', () => {
    const specs = nativeParamSpecs(fakeReverbParams())
    // Ids 100, 7, 30 would sort 7, 30, 100 as bare object keys.
    expect(Object.keys(specs)).toEqual(['p100', 'p7', 'p30'])
    expect(nativeParamKey({ id: '100' })).toBe('p100')
  })

  it('leaves out what cannot be automated and the plug-in bypass', () => {
    const [, , , sampleRate, bypass] = fakeReverbParams()
    expect(isExposedNativeParam(sampleRate)).toBe(false)
    expect(isExposedNativeParam(bypass)).toBe(false)
  })

  it('a continuous parameter is 0..1 with the plug-in unit', () => {
    const spec = nativeParamSpec(fakeReverbParams()[0])
    expect(spec).toMatchObject({
      id: 0,
      index: 0,
      pluginParamId: '100',
      name: 'Decay',
      min: 0,
      max: 1,
      default: 0.25,
      taper: 'linear',
      unit: 's',
      steps: 0,
    })
    expect(spec.choices).toBeUndefined()
    expect(toNormalised(spec, 0.4)).toBe(0.4)
    expect(toNormalised(spec, 7)).toBe(1)
    expect(fromNormalised(spec, -1)).toBe(0)
  })

  it('a few labelled steps become a choice the panel steps through', () => {
    const spec = nativeParamSpec(fakeReverbParams()[2])
    expect(spec).toMatchObject({ min: 0, max: 2, default: 0, steps: 3, unit: '' })
    expect(spec.choices).toEqual(['Hall', 'Plate', 'Room'])
    expect(isChoiceParam(spec)).toBe(true)
    expect(toNormalised(spec, 1)).toBe(0.5)
    expect(toNormalised(spec, 2)).toBe(1)
    expect(fromNormalised(spec, 0.5)).toBe(1)
    expect(fromNormalised(spec, 0.74)).toBe(1)
    expect(fromNormalised(spec, 0.76)).toBe(2)
  })
})

describe('tidyParamText', () => {
  it('rounds a number printed with every digit and keeps its unit', () => {
    expect(tidyParamText('220.000000 Hz')).toBe('220 Hz')
    expect(tidyParamText('2000.000000 Hz')).toBe('2000 Hz')
    expect(tidyParamText('0.000000 dB')).toBe('0.00 dB')
    expect(tidyParamText('-12.345678 dB')).toBe('-12.3 dB')
    expect(tidyParamText('-0.000400')).toBe('0.00')
    expect(tidyParamText('0.707107')).toBe('0.71')
  })

  it('leaves alone what a plug-in worded with care', () => {
    for (const text of ['2.4 s', '50 %', 'Plate', '12.25 kHz', '1/8 dotted', '48000', '']) {
      expect(tidyParamText(text)).toBe(text)
    }
  })
})
