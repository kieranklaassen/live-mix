// Every knob of every stock device says what it does: the info view reads
// `ParamSpec.description` (or, for a name that means the same everywhere, the
// kit's own sentence), and a device added without them fails here.

import { describe, expect, it } from 'vitest'

import { NODE_DEVICES } from '../../core/devices/native'
import { type ParamSpec } from '../../core/params'
import { STOCK_WASM_DEVICES } from '../../dsp/registry'
import { paramInfo } from '../components/param-info'

const DEVICES = [...NODE_DEVICES, ...STOCK_WASM_DEVICES]
const paramsOf = (params: unknown) => Object.entries(params as Record<string, ParamSpec>)

describe('what each stock device knob does', () => {
  it('is said for every parameter of every device', () => {
    const silent = DEVICES.flatMap((device) =>
      paramsOf(device.params)
        .filter(([, spec]) => !paramInfo(spec))
        .map(([name]) => `${device.id}.${name}`),
    )
    expect(silent).toEqual([])
  })

  it('is said by the device itself, in a sentence that fits the info view', () => {
    const faults: string[] = []
    for (const device of DEVICES) {
      for (const [name, spec] of paramsOf(device.params)) {
        const text = spec.description
        const at = `${device.id}.${name}`
        if (text === undefined) faults.push(`${at}: no description`)
        else if (text.length > 170) faults.push(`${at}: ${text.length} characters`)
        else if (!/[.?]$/.test(text)) faults.push(`${at}: does not end in a full stop`)
        else if (/[–—\n]/.test(text)) faults.push(`${at}: a dash or a line break`)
      }
    }
    expect(faults).toEqual([])
  })

  it('goes with a sentence on what the device is', () => {
    expect(
      DEVICES.filter((device) => !device.description?.trim()).map((device) => device.id),
    ).toEqual([])
  })
})
