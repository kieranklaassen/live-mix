// The control module is part of the `.` entry, which imports under SSR: no
// browser global may be read at module evaluation. `navigator` and
// `WebSocket` are replaced with throwing getters before the module loads;
// only `open()` on the adapters may touch them.

import { describe, expect, it, vi } from 'vitest'

const touched = vi.hoisted(() => {
  const touched: string[] = []
  for (const name of ['navigator', 'WebSocket', 'window', 'document']) {
    Object.defineProperty(globalThis, name, {
      configurable: true,
      get() {
        touched.push(name)
        throw new Error(`${name} read at import time`)
      },
    })
  }
  return touched
})

import * as control from '../index'
import * as core from '../../../index'

describe('control module import safety', () => {
  it('evaluates without reading navigator, WebSocket, window or document', () => {
    expect(touched).toEqual([])
    expect(typeof control.ControlSurface).toBe('function')
    expect(typeof control.MidiInput).toBe('function')
    expect(typeof control.OscInput).toBe('function')
    expect(typeof core.ControlSurface).toBe('function')
  })

  it('constructs a surface and the adapters without touching the globals', () => {
    const surface = new control.ControlSurface()
    surface.map({
      source: { kind: 'cc', channel: 1, controller: 1 },
      target: { kind: 'master', control: 'level' },
    })
    expect(surface.table).toHaveLength(1)
    const midi = new control.MidiInput()
    const osc = new control.OscInput({ url: 'ws://x' })
    expect(midi.opened).toBe(false)
    expect(osc.opened).toBe(false)
    expect(touched).toEqual([])
  })

  it('reaches for the globals only from the support probes and open()', async () => {
    expect(() => control.isWebMidiSupported()).toThrow(/navigator read/)
    touched.length = 0
    // A throwing global rejects the open() promise rather than escaping synchronously.
    await expect(new control.MidiInput().open()).rejects.toThrow(/navigator read/)
    expect(touched).toEqual(['navigator'])
    touched.length = 0
    await expect(new control.OscInput({ url: 'ws://x' }).open()).rejects.toThrow(/WebSocket read/)
    expect(touched).toEqual(['WebSocket'])
  })
})
