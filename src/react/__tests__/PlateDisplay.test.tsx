// @vitest-environment jsdom
// A plate's display as the plate runs it: where it stands, when it is drawn
// (once per change at rest, on frames while it runs and can be seen), what it
// is given to read, and a drag on one of its handles as one undo step.

import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { type Device, type MeteredDevice } from '../../core/devices/Device'
import { NODE_DEVICES } from '../../core/devices/native'
import { DeviceRegistry } from '../../core/devices/registry'
import { Arbiter } from '../../score/Arbiter'
import { loadScore } from '../../score/loadScore'
import { ScoreDocument } from '../../score/ScoreDocument'
import { demoScore } from '../../score/__tests__/fixtures'
import { MockAudioBuffer, type MockAnalyserNode, type MockGainNode } from '../../testing'
import { DeviceChainView } from '../components/DeviceChainView'
import { printedMeters } from '../components/DevicePanel'
import { DevicePlate } from '../components/DevicePlate'
import { PlateDisplayLayer, settledDisplays } from '../components/PlateDisplay'
import { DEVICE_SKINS, QUIET_SKIN, type DeviceSkin } from '../components/device-skins'
import {
  DisplayTaps,
  runningDisplays,
  type DisplayFrame,
  type DisplayView,
  type PlateDisplay,
} from '../components/plate-display'
import { LiveMixProvider } from '../hooks/useEngine'
import { recordingContext, type RecordingContext } from './display-harness'
import { createTestEngine, type TestEngine } from './harness'

let canvas: RecordingContext

beforeEach(() => {
  canvas = recordingContext()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => canvas.ctx)
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const BASE: DeviceSkin = {
  name: 'Sweep',
  plate: '#23566b',
  ink: '#e6f1ee',
  accent: '#8fe0d0',
  finish: 'grain',
  cap: 'pointer',
}

const INFO = 'The response of the filter from the lowest note to the highest, as it stands.'

function still(draw = vi.fn()): PlateDisplay {
  return { place: 'window', columns: 1, params: ['frequency'], info: INFO, draw }
}

function live(
  draw: (frame: DisplayFrame) => void = vi.fn(),
  ask: PlateDisplay['live'] = { meters: true, signal: true },
): PlateDisplay {
  return { place: 'strip', params: ['frequency'], live: ask, info: INFO, draw }
}

/** One point: across is the frequency's place in its range, up and down the resonance. */
function withHandle(extra: Partial<PlateDisplay> = {}): PlateDisplay {
  return {
    place: 'window',
    columns: 1,
    params: ['frequency', 'q'],
    info: INFO,
    draw: vi.fn(),
    handles: (view: DisplayView) => {
      const frequency = view.spec('frequency')
      const q = view.spec('q')
      if (!frequency || !q) return []
      return [
        {
          key: 'cutoff',
          name: 'Cutoff',
          x:
            ((view.value('frequency') - frequency.min) / (frequency.max - frequency.min)) *
            view.width,
          y: (1 - (view.value('q') - q.min) / (q.max - q.min)) * view.height,
          drag: (x: number, y: number) => ({
            frequency: frequency.min + (x / view.width) * (frequency.max - frequency.min),
            q: q.min + (1 - y / view.height) * (q.max - q.min),
          }),
          wheel: (steps: number) => ({ q: view.value('q') + steps }),
          reset: () => ({ frequency: frequency.default, q: q.default }),
        },
      ]
    },
    ...extra,
  }
}

async function make(fixture: TestEngine, id = 'filter'): Promise<Device> {
  return fixture.engine.devices.create(id, fixture.engine.context)
}

/** A filter that reports readings, as a compiled device with meters does. */
async function makeMetered(fixture: TestEngine) {
  const unwatch = vi.fn()
  const device = Object.assign(await make(fixture), {
    meters: {
      reduction: { name: 'Gain reduction', unit: 'dB' },
      phase: { name: 'LFO phase', display: true as const },
    },
    meter: vi.fn((name: string) => (name === 'phase' ? 0.25 : -3)),
    watchMeters: vi.fn(() => unwatch),
  })
  return { device: device as unknown as MeteredDevice, unwatch }
}

describe('a plate with a display', () => {
  it('stands a window beside two rows of knobs, in place of a picture', async () => {
    const fixture = createTestEngine()
    const device = await make(fixture)
    render(
      <DevicePlate
        device={device}
        skin={{ ...BASE, display: still(), face: ['frequency', 'q'] }}
        data-testid="plate"
      />,
      { wrapper: fixture.wrapper },
    )
    const plate = screen.getByTestId('plate')
    expect(plate).toHaveClass('lm-plate--display', 'lm-plate--window')
    expect(plate.style.width).toBe('280px')
    expect(plate.querySelector('.lm-plate__picture')).toBeNull()
    const display = screen.getByTestId('plate-display')
    expect(display.tagName).toBe('CANVAS')
    expect(display).toHaveClass('lm-plate__display', 'lm-plate__display--window')
    expect(display.style).toMatchObject({
      left: '8px',
      top: '8px',
      width: '176px',
      height: '100px',
    })
    // The canvas is for the eye; what it shows is said in the info view.
    expect(display).toHaveAttribute('aria-hidden', 'true')
    expect(display.dataset.lmInfo).toContain(INFO)
    expect(screen.getAllByRole('slider').map((knob) => knob.getAttribute('aria-label'))).toEqual([
      'Frequency',
      'Q',
    ])
    // The knobs start where the window ends.
    expect(plate.style.getPropertyValue('--lm-plate-knobs-left')).toBe('188px')
    expect(screen.getByTestId('plate-more')).toHaveTextContent('+2')
  })

  it('lays a strip under four knobs, and as wide as the row when the plate is opened', async () => {
    const fixture = createTestEngine()
    const device = await make(fixture, 'parametric-eq')
    render(
      <DevicePlate
        device={device}
        skin={{ ...BASE, display: { ...live(), params: ['lowCut'] } }}
        data-testid="plate"
      />,
      { wrapper: fixture.wrapper },
    )
    const plate = screen.getByTestId('plate')
    expect(plate).toHaveClass('lm-plate--strip')
    expect(plate.style.width).toBe('280px')
    expect(screen.getAllByRole('slider')).toHaveLength(4)
    const display = screen.getByTestId('plate-display')
    expect(display.style).toMatchObject({
      left: '8px',
      top: '60px',
      width: '224px',
      height: '48px',
    })
    fireEvent.click(screen.getByTestId('plate-more'))
    // Fourteen knobs take two rows; the strip stands beside them at the plate's working height.
    expect(screen.getAllByRole('slider')).toHaveLength(14)
    expect(screen.getByTestId('plate-display').style).toMatchObject({
      top: '8px',
      width: '184px',
      height: '100px',
    })
  })

  it('gives every stock display a plate through the stock skins', () => {
    expect(DEVICE_SKINS['parametric-eq'].display?.place).toBe('window')
    expect(DEVICE_SKINS['ambient-comp'].display?.handles).toBeDefined()
    expect(DEVICE_SKINS.tremolo.display?.live?.meters).toBe(true)
    expect(DEVICE_SKINS.tremolo.face).toEqual(['rate', 'depth', 'shape', 'mode'])
    expect(QUIET_SKIN.display).toBeUndefined()
  })

  it('prints a reading in the foot only where no display draws it', async () => {
    const fixture = createTestEngine()
    const { device } = await makeMetered(fixture)
    expect(printedMeters(device).map(([name]) => name)).toEqual(['reduction'])
    const plain = render(<DevicePlate device={device} skin={BASE} data-testid="plate" />, {
      wrapper: fixture.wrapper,
    })
    expect(screen.getByTestId('plate-meter-reduction')).toBeInTheDocument()
    expect(screen.queryByTestId('plate-meter-phase')).toBeNull()
    plain.unmount()
    render(
      <DevicePlate
        device={device}
        skin={{ ...BASE, display: still(), face: ['frequency', 'q'] }}
        data-testid="plate"
      />,
      { wrapper: fixture.wrapper },
    )
    expect(screen.queryByTestId('plate-meter-reduction')).toBeNull()
  })
})

describe('when a display is drawn', () => {
  it('at rest: once, and again only when a parameter it reads moves', async () => {
    const fixture = createTestEngine()
    const device = await make(fixture)
    const draw = vi.fn()
    render(
      <DevicePlate
        device={device}
        skin={{ ...BASE, display: still(draw), face: ['frequency', 'q'] }}
        data-testid="plate"
      />,
      { wrapper: fixture.wrapper },
    )
    expect(draw).toHaveBeenCalled()
    // Nothing runs: no frame is asked for.
    expect(runningDisplays()).toBe(0)
    expect(fixture.frames.size).toBe(0)
    const frame = draw.mock.calls.at(-1)?.[0] as DisplayFrame
    expect(frame).toMatchObject({ width: 176, height: 100, signal: null, dt: 0, powered: true })
    expect(frame.value('frequency')).toBe(device.getParam('frequency'))
    expect(frame.at('frequency')).toBeGreaterThan(0)
    expect(frame.spec('frequency')?.max).toBe(device.params.frequency.max)
    // A name the device lacks reads as nothing, not as an error.
    expect([frame.value('nope'), frame.at('nope'), frame.spec('nope')]).toEqual([0, 0, undefined])
    expect([frame.meter('reduction'), frame.hasMeter('reduction')]).toEqual([0, false])

    const drawn = draw.mock.calls.length
    act(() => device.setParam('frequency', 9000))
    expect(draw.mock.calls.length).toBeGreaterThan(drawn)
    expect((draw.mock.calls.at(-1)?.[0] as DisplayFrame).value('frequency')).toBe(9000)
  })

  it('running: on frames while the device is on, with its readings watched, and not after', async () => {
    const fixture = createTestEngine()
    const { device, unwatch } = await makeMetered(fixture)
    const draw = vi.fn()
    const view = render(
      <DevicePlate device={device} skin={{ ...BASE, display: live(draw) }} data-testid="plate" />,
      { wrapper: fixture.wrapper },
    )
    expect(runningDisplays()).toBe(1)
    expect(device.watchMeters).toHaveBeenCalledTimes(1)
    const before = draw.mock.calls.length
    act(() => fixture.frames.flush(1000))
    act(() => fixture.frames.flush(1040))
    expect(draw.mock.calls.length).toBe(before + 2)
    const frame = draw.mock.calls.at(-1)?.[0] as DisplayFrame
    expect(frame.dt).toBeCloseTo(0.04)
    expect(frame.now).toBeCloseTo(1.04)
    expect([frame.meter('phase'), frame.hasMeter('phase')]).toEqual([0.25, true])
    expect(frame.meter('reduction')).toBe(-3)
    // The sound at the device: its output is tapped; nothing was said of what feeds it.
    expect(frame.signal).toMatchObject({ input: null, spectrum: null, left: null, right: null })
    expect(frame.signal?.output).toMatchObject({ peak: 0, rms: 0 })

    // Switched off, it stops and lets the readings go; drawn once more, at rest.
    act(() => {
      device.bypass = true
    })
    expect(runningDisplays()).toBe(0)
    expect(unwatch).toHaveBeenCalledTimes(1)
    expect((draw.mock.calls.at(-1)?.[0] as DisplayFrame).powered).toBe(false)
    expect((draw.mock.calls.at(-1)?.[0] as DisplayFrame).signal).toBeNull()
    act(() => {
      device.bypass = false
    })
    expect(runningDisplays()).toBe(1)
    view.unmount()
    expect(runningDisplays()).toBe(0)
    expect(unwatch).toHaveBeenCalledTimes(2)
    expect(fixture.frames.size).toBe(0)
  })

  it('at 30 frames a second unless it asks for 60', async () => {
    const fixture = createTestEngine()
    const device = await make(fixture)
    const slow = vi.fn()
    const fast = vi.fn()
    render(
      <>
        <DevicePlate device={device} skin={{ ...BASE, display: live(slow, {}) }} />
        <DevicePlate device={device} skin={{ ...BASE, display: live(fast, { fps: 60 }) }} />
      </>,
      { wrapper: fixture.wrapper },
    )
    // One loop for both.
    expect(runningDisplays()).toBe(2)
    expect(fixture.frames.size).toBe(1)
    const [slowBefore, fastBefore] = [slow.mock.calls.length, fast.mock.calls.length]
    for (let n = 0; n < 12; n++) act(() => fixture.frames.flush(5000 + (n * 1000) / 60))
    expect(fast.mock.calls.length - fastBefore).toBe(12)
    expect(slow.mock.calls.length - slowBefore).toBe(6)
  })

  it('goes on drawing the other displays when one of them throws', async () => {
    const fixture = createTestEngine()
    const device = await make(fixture)
    let broken = false
    const bad = vi.fn(() => {
      if (broken) throw new Error('a display that cannot draw')
    })
    const good = vi.fn()
    render(
      <>
        <DevicePlate device={device} skin={{ ...BASE, display: live(bad, {}) }} />
        <DevicePlate device={device} skin={{ ...BASE, display: live(good, {}) }} />
      </>,
      { wrapper: fixture.wrapper },
    )
    act(() => fixture.frames.flush(5000))
    broken = true
    const [badBefore, goodBefore] = [bad.mock.calls.length, good.mock.calls.length]
    // What it threw is still to be seen, and the frame after it is asked for.
    expect(() => fixture.frames.flush(5100)).toThrow('a display that cannot draw')
    expect(fixture.frames.size).toBe(1)
    expect(good.mock.calls.length - goodBefore).toBe(1)
    act(() => fixture.frames.flush(5200))
    act(() => fixture.frames.flush(5300))
    expect(good.mock.calls.length - goodBefore).toBe(3)
    // The one that threw is asked no more.
    expect(bad.mock.calls.length - badBefore).toBe(1)
  })

  it('only while it can be seen', async () => {
    let seen: ((entries: { isIntersecting: boolean }[]) => void) | null = null
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
          seen = callback
        }
        observe(): void {}
        disconnect(): void {}
      },
    )
    const fixture = createTestEngine()
    const device = await make(fixture)
    render(<DevicePlate device={device} skin={{ ...BASE, display: live() }} />, {
      wrapper: fixture.wrapper,
    })
    // Not yet known to be in view: it waits.
    expect(runningDisplays()).toBe(0)
    act(() => seen?.([{ isIntersecting: true }]))
    expect(runningDisplays()).toBe(1)
    act(() => seen?.([{ isIntersecting: false }]))
    expect(runningDisplays()).toBe(0)
  })

  it('standing still, hears a short sound that came and went between two listenings', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    try {
      const fixture = createTestEngine()
      const { device } = await makeMetered(fixture)
      const analysers = fixture.ctx.analysers.length
      const skin = { ...BASE, display: live(vi.fn(), { meters: true, settle: 1 }) }
      render(<DevicePlate device={device} skin={skin} />, { wrapper: fixture.wrapper })
      const [tap] = fixture.ctx.analysers.slice(analysers)
      let now = 1000
      const frames = (seconds: number): void => {
        for (let n = 0; n < seconds * 10; n++) act(() => fixture.frames.flush((now += 100)))
      }
      frames(1.5)
      expect([runningDisplays(), settledDisplays()]).toEqual([0, 1])

      // A stab that was over before the newest window began: a reading's 2048 samples hold none of it.
      const read = vi.fn((array: Float32Array) => {
        array.fill(0)
        if (array.length > 2048) array.fill(0.3, 0, array.length - 2048)
      })
      tap.getFloatTimeDomainData = read
      act(() => {
        vi.advanceTimersByTime(100)
      })
      expect([runningDisplays(), settledDisplays()]).toEqual([1, 0])
      // It listened over more than the time between two listenings, and no further than it must.
      const listened = read.mock.calls[0][0].length
      expect(listened / fixture.ctx.sampleRate).toBeGreaterThan(0.1)
      expect(listened).toBe(8192)

      // Running again it reads the newest window, as before.
      frames(0.2)
      expect(tap.fftSize).toBe(2048)
      expect(read.mock.calls.at(-1)?.[0].length).toBe(2048)
      frames(1.5)
      expect([runningDisplays(), settledDisplays()]).toEqual([0, 1])
    } finally {
      vi.useRealTimers()
    }
  })

  it('stands still after some seconds of silence, and runs again at the first sound', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    try {
      const fixture = createTestEngine()
      const { device, unwatch } = await makeMetered(fixture)
      const draw = vi.fn()
      const analysers = fixture.ctx.analysers.length
      const skin = { ...BASE, display: live(draw, { meters: true, settle: 2 }) }
      const plate = <DevicePlate device={device} skin={skin} data-testid="plate" />
      const view = render(plate, { wrapper: fixture.wrapper })
      // It reads no levels, and is tapped all the same: the tap says when there is no sound.
      const [tap, ...others] = fixture.ctx.analysers.slice(analysers)
      expect(others).toHaveLength(0)
      let now = 1000
      const frames = (seconds: number): void => {
        for (let n = 0; n < seconds * 10; n++) act(() => fixture.frames.flush((now += 100)))
      }

      // With sound it runs on, however long.
      tap.level = 0.5
      frames(3)
      expect([runningDisplays(), settledDisplays()]).toEqual([1, 0])
      expect((draw.mock.calls.at(-1)?.[0] as DisplayFrame).signal).toBeNull()

      // In silence it runs for as long as it says, then asks for no frames and no readings.
      tap.level = 0
      frames(1.5)
      expect([runningDisplays(), settledDisplays()]).toEqual([1, 0])
      frames(1)
      expect([runningDisplays(), settledDisplays()]).toEqual([0, 1])
      expect(fixture.frames.size).toBe(0)
      expect(unwatch).toHaveBeenCalledTimes(1)
      const drawn = draw.mock.calls.length

      // Drawn again with nothing changed, and listening to more silence, it stays as it is.
      view.rerender(plate)
      act(() => {
        vi.advanceTimersByTime(600)
      })
      expect([runningDisplays(), settledDisplays()]).toEqual([0, 1])
      expect(draw.mock.calls.length).toBe(drawn)

      // The first sound sets it running, with its readings watched again.
      tap.level = 0.3
      act(() => {
        vi.advanceTimersByTime(200)
      })
      expect([runningDisplays(), settledDisplays()]).toEqual([1, 0])
      expect(device.watchMeters).toHaveBeenCalledTimes(2)

      // So does a knob it reads, for as long again.
      tap.level = 0
      frames(2.5)
      expect([runningDisplays(), settledDisplays()]).toEqual([0, 1])
      act(() => device.setParam('frequency', 900))
      expect([runningDisplays(), settledDisplays()]).toEqual([1, 0])
      frames(2.5)
      expect([runningDisplays(), settledDisplays()]).toEqual([0, 1])

      // Taken away while it stands, it leaves nothing listening.
      view.unmount()
      expect([runningDisplays(), settledDisplays()]).toEqual([0, 0])
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('hears what feeds the device when it stands in a chain', async () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const first = await make(fixture)
    const second = await make(fixture, 'delay')
    pad.strip.addInsert(first)
    pad.strip.addInsert(second)
    const draws = [vi.fn(), vi.fn()]
    const analysers = fixture.ctx.analysers.length
    render(
      <DeviceChainView
        strip={pad}
        skin={(device) => ({
          ...BASE,
          display: live(draws[device === first ? 0 : 1], { signal: true }),
        })}
      />,
      { wrapper: fixture.wrapper },
    )
    // Two taps for each: on what feeds it and on what it puts out.
    const taps = fixture.ctx.analysers.slice(analysers)
    expect(taps).toHaveLength(4)
    for (const tap of taps) tap.level = 0.5
    act(() => fixture.frames.flush(100))
    for (const draw of draws) {
      const frame = draw.mock.calls.at(-1)?.[0] as DisplayFrame
      expect(frame.signal?.input?.peak).toBeCloseTo(0.5)
      expect(frame.signal?.output.peak).toBeCloseTo(0.5)
      expect(frame.signal?.output.wave).toHaveLength(2048)
    }
  })
})

describe('DisplayTaps', () => {
  it('reads the levels, the spectrum when asked, and comes away clean', () => {
    const fixture = createTestEngine()
    const context = fixture.engine.context
    const source = context.createGain()
    const output = context.createGain()
    const before = fixture.ctx.analysers.length
    const taps = DisplayTaps.open(source, output, { spectrum: true }, context)
    expect(taps).not.toBeNull()
    const [out, into] = fixture.ctx.analysers.slice(before)
    out.level = 0.25
    into.level = 1
    const signal = taps?.read()
    expect(signal?.output.peak).toBeCloseTo(0.25)
    expect(signal?.output.rms).toBeCloseTo(0.25)
    expect(signal?.input?.peak).toBeCloseTo(1)
    expect(signal?.spectrum).toHaveLength(1024)
    expect(signal?.binHz).toBeCloseTo(48000 / 2048)
    // A chain that rebuilt itself cut the taps; mending hangs them on again.
    const feeds = (node: AudioNode, tap: MockAnalyserNode): boolean =>
      (node as unknown as MockGainNode).isConnectedTo(tap)
    expect([feeds(output, out), feeds(source, into)]).toEqual([true, true])
    output.disconnect()
    expect(feeds(output, out)).toBe(false)
    taps?.mend()
    expect(feeds(output, out)).toBe(true)
    taps?.release()
    expect([feeds(output, out), feeds(source, into)]).toEqual([false, false])
  })

  it('is nothing where analysers cannot be made, and a display goes without', () => {
    const output = { context: {} } as unknown as AudioNode
    expect(DisplayTaps.open(null, output)).toBeNull()
  })
})

describe('a handle on a display', () => {
  it('is taken by a press on it, sets its parameters as it is dragged, and is let go', async () => {
    const fixture = createTestEngine()
    const device = await make(fixture)
    act(() => {
      device.setParam('frequency', device.params.frequency.max / 4)
      device.setParam('q', (device.params.q.min + device.params.q.max) / 2)
    })
    const display = withHandle()
    render(
      <DevicePlate
        device={device}
        skin={{ ...BASE, display, face: ['type', 'gain'] }}
        data-testid="plate"
      />,
      { wrapper: fixture.wrapper },
    )
    const surface = screen.getByTestId('plate-display')
    expect(surface).toHaveClass('lm-plate__display--handles')
    const view = (draw: PlateDisplay['draw']) =>
      (draw as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0] as DisplayFrame
    const at = display.handles?.(view(display.draw))[0]
    expect(at).toBeDefined()
    if (!at) return

    // The pointer over it: the display says which handle is hot.
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: at.x + 2, clientY: at.y - 2 })
    expect(surface.dataset.lmHandle).toBe('cutoff')
    expect(view(display.draw).hot).toBe('cutoff')
    // Away from it: none, and a press there is the plate's to be carried by.
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: at.x + 60, clientY: at.y + 40 })
    expect(surface.dataset.lmHandle).toBeUndefined()
    const frequency = device.getParam('frequency')
    fireEvent.pointerDown(surface, {
      pointerId: 1,
      button: 0,
      clientX: at.x + 60,
      clientY: at.y + 40,
    })
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: at.x + 90, clientY: at.y })
    fireEvent.pointerUp(surface, { pointerId: 1 })
    expect(device.getParam('frequency')).toBe(frequency)

    // Taken two pixels off its middle: it does not jump to the pointer.
    fireEvent.pointerDown(surface, {
      pointerId: 2,
      button: 0,
      clientX: at.x + 2,
      clientY: at.y - 2,
    })
    expect(surface.dataset.lmHandle).toBe('cutoff')
    expect(view(display.draw)).toMatchObject({ hot: 'cutoff', dragging: true })
    expect(device.getParam('frequency')).toBe(frequency)
    fireEvent.pointerMove(surface, { pointerId: 2, clientX: at.x + 2 + 44, clientY: at.y - 2 - 25 })
    const range = device.params.frequency.max - device.params.frequency.min
    expect(device.getParam('frequency')).toBeCloseTo(frequency + (44 / 176) * range, 0)
    expect(device.getParam('q')).toBeGreaterThan((device.params.q.min + device.params.q.max) / 2)
    // Past the edge the plate clamps what the handle asks for.
    fireEvent.pointerMove(surface, { pointerId: 2, clientX: 5000, clientY: -5000 })
    expect(device.getParam('frequency')).toBe(device.params.frequency.max)
    expect(device.getParam('q')).toBe(device.params.q.max)
    fireEvent.pointerUp(surface, { pointerId: 2 })
    expect(view(display.draw).dragging).toBe(false)

    // A double press puts it back where the device starts: two presses that move nothing.
    const now = display.handles?.(view(display.draw))[0]
    for (const pointerId of [3, 4]) {
      fireEvent.pointerDown(surface, { pointerId, button: 0, clientX: now?.x, clientY: now?.y })
      fireEvent.pointerUp(surface, { pointerId })
    }
    fireEvent.doubleClick(surface, { clientX: now?.x, clientY: now?.y })
    expect(device.getParam('frequency')).toBe(device.params.frequency.default)
    expect(device.getParam('q')).toBe(device.params.q.default)
  })

  it('takes the wheel for itself over a handle, and leaves it to the page elsewhere', async () => {
    const fixture = createTestEngine()
    const device = await make(fixture)
    const display = withHandle()
    render(
      <DevicePlate
        device={device}
        skin={{ ...BASE, display, face: ['type', 'gain'] }}
        data-testid="plate"
      />,
      { wrapper: fixture.wrapper },
    )
    const surface = screen.getByTestId('plate-display')
    const frame = (display.draw as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0] as DisplayFrame
    const at = display.handles?.(frame)[0]
    const q = device.getParam('q')
    const over = new WheelEvent('wheel', {
      deltaY: -100,
      clientX: at?.x,
      clientY: at?.y,
      bubbles: true,
      cancelable: true,
    })
    act(() => void surface.dispatchEvent(over))
    expect(device.getParam('q')).toBe(q + 1)
    expect(over.defaultPrevented).toBe(true)
    const beside = new WheelEvent('wheel', {
      deltaY: -100,
      clientX: (at?.x ?? 0) + 70,
      clientY: 90,
      bubbles: true,
      cancelable: true,
    })
    act(() => void surface.dispatchEvent(beside))
    expect(device.getParam('q')).toBe(q + 1)
    expect(beside.defaultPrevented).toBe(false)
  })

  it('is one undo step for a whole drag when the score carries the device', async () => {
    const fixture = createTestEngine({ devices: new DeviceRegistry(NODE_DEVICES) })
    const buffer = new MockAudioBuffer(2, 48000 * 10, 48000) as unknown as AudioBuffer
    await fixture.engine.samples.load('a', buffer)
    await fixture.engine.samples.load('b', buffer)
    const clock = { ms: 0 }
    const document = new ScoreDocument(demoScore(), { now: () => clock.ms })
    const renderer = loadScore(fixture.engine, document, { onError: () => {} })
    await renderer.whenIdle()
    const arbiter = new Arbiter(document, {
      now: () => clock.ms,
      renderer,
      setTimeoutFn: () => 0,
      clearTimeoutFn: () => {},
    })
    const wrapper = ({ children }: { children: ReactNode }): ReactNode =>
      createElement(
        LiveMixProvider,
        { engine: fixture.engine, frame: fixture.frames, arbiter },
        children,
      )
    const filter = renderer.device('kick-filter')
    const display = withHandle()
    render(
      <DevicePlate
        device={filter}
        skin={{ ...BASE, display, face: ['type', 'gain'] }}
        data-testid="plate"
      />,
      { wrapper },
    )
    const surface = screen.getByTestId('plate-display')
    const frame = (display.draw as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0] as DisplayFrame
    const at = display.handles?.(frame)[0]
    if (!at) throw new Error('no handle')
    const logged = document.log.length

    fireEvent.pointerDown(surface, { pointerId: 1, button: 0, clientX: at.x, clientY: at.y })
    for (const step of [10, 20, 30])
      fireEvent.pointerMove(surface, { pointerId: 1, clientX: at.x + step, clientY: at.y + step })
    fireEvent.pointerUp(surface, { pointerId: 1 })
    const first = document.log.entries.slice(logged)
    expect(first).toHaveLength(3)
    for (const entry of first) {
      expect(entry.op.type).toBe('device.setParams')
      expect(entry.op).toMatchObject({ device: 'kick-filter' })
      expect(entry.author.kind).toBe('human')
      expect(entry.gesture).toBe('ui:kick-filter:drag#1')
    }
    // Both parameters travel in each step, so neither is left behind by an undo.
    expect(Object.keys((first[0].op as { params: object }).params).sort()).toEqual([
      'frequency',
      'q',
    ])

    // The next drag is another step.
    await act(() => renderer.whenIdle())
    const moved = display.handles?.(
      (display.draw as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0] as DisplayFrame,
    )[0]
    fireEvent.pointerDown(surface, {
      pointerId: 2,
      button: 0,
      clientX: moved?.x,
      clientY: moved?.y,
    })
    fireEvent.pointerMove(surface, {
      pointerId: 2,
      clientX: (moved?.x ?? 0) - 15,
      clientY: moved?.y,
    })
    fireEvent.pointerUp(surface, { pointerId: 2 })
    expect(document.log.entries.at(-1)?.gesture).toBe('ui:kick-filter:drag#2')
  })

  it('is still one undo step when the wheel is turned over the handle while it is in hand', async () => {
    const fixture = createTestEngine({ devices: new DeviceRegistry(NODE_DEVICES) })
    const buffer = new MockAudioBuffer(2, 48000 * 10, 48000) as unknown as AudioBuffer
    await fixture.engine.samples.load('a', buffer)
    await fixture.engine.samples.load('b', buffer)
    const clock = { ms: 0 }
    const document = new ScoreDocument(demoScore(), { now: () => clock.ms })
    const renderer = loadScore(fixture.engine, document, { onError: () => {} })
    await renderer.whenIdle()
    const arbiter = new Arbiter(document, {
      now: () => clock.ms,
      renderer,
      setTimeoutFn: () => 0,
      clearTimeoutFn: () => {},
    })
    const wrapper = ({ children }: { children: ReactNode }): ReactNode =>
      createElement(
        LiveMixProvider,
        { engine: fixture.engine, frame: fixture.frames, arbiter },
        children,
      )
    const filter = renderer.device('kick-filter')
    const display = withHandle()
    render(
      <DevicePlate
        device={filter}
        skin={{ ...BASE, display, face: ['type', 'gain'] }}
        data-testid="plate"
      />,
      { wrapper },
    )
    const surface = screen.getByTestId('plate-display')
    const frame = (display.draw as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0] as DisplayFrame
    const at = display.handles?.(frame)[0]
    if (!at) throw new Error('no handle')
    const logged = document.log.length
    const before = document.serialize()

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      fireEvent.pointerDown(surface, { pointerId: 1, button: 0, clientX: at.x, clientY: at.y })
      fireEvent.pointerMove(surface, { pointerId: 1, clientX: at.x + 2, clientY: at.y + 2 })
      // The other hand's finger on the wheel, the pointer still down on the point.
      const notch = new WheelEvent('wheel', {
        deltaY: -100,
        clientX: at.x + 2,
        clientY: at.y + 2,
        bubbles: true,
        cancelable: true,
      })
      act(() => void surface.dispatchEvent(notch))
      expect(notch.defaultPrevented).toBe(true)
      fireEvent.pointerMove(surface, { pointerId: 1, clientX: at.x + 4, clientY: at.y + 4 })
      // The wheel rests while the drag goes on.
      act(() => void vi.advanceTimersByTime(500))
      fireEvent.pointerMove(surface, { pointerId: 1, clientX: at.x + 6, clientY: at.y + 6 })
      fireEvent.pointerUp(surface, { pointerId: 1 })
      act(() => void vi.advanceTimersByTime(500))
    } finally {
      vi.useRealTimers()
    }
    const entries = document.log.entries.slice(logged)
    expect(entries).toHaveLength(4)
    expect(entries.map((entry) => entry.gesture)).toEqual(
      entries.map(() => 'ui:kick-filter:drag#1'),
    )
    // One undo takes the whole drag back, what the wheel turned with it.
    document.undo()
    expect(document.serialize()).toBe(before)
  })
})

describe('a handle under the wheel, under a finger and under another handle', () => {
  /** Two points on a line, each where its own value says; a drag moves the one taken. */
  function twoPoints(): { display: PlateDisplay; at: { a: number; b: number } } {
    const at = { a: 40, b: 40 }
    const point = (key: 'a' | 'b') => ({
      key,
      name: key,
      x: at[key],
      y: 30,
      drag: (x: number) => {
        at[key] = x
        return { [key]: x }
      },
      wheel: (steps: number) => ({ [`${key}Width`]: steps }),
      reset: () => ({ [key]: 0 }),
    })
    return {
      display: { ...withHandle(), handles: () => [point('a'), point('b')] },
      at,
    }
  }

  async function mount(display: PlateDisplay) {
    const fixture = createTestEngine()
    const device = await make(fixture)
    const spies = { onDragStart: vi.fn(), onDrag: vi.fn(), onDragEnd: vi.fn() }
    render(
      <PlateDisplayLayer
        display={display}
        device={device}
        source={null}
        width={176}
        height={100}
        powered
        params={device.params}
        values={{}}
        heading="Sweep"
        data-testid="display"
        {...spies}
      />,
      { wrapper: fixture.wrapper },
    )
    return { surface: screen.getByTestId('display'), ...spies }
  }

  const wheel = (surface: HTMLElement, init: WheelEventInit): WheelEvent => {
    const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, ...init })
    act(() => void surface.dispatchEvent(event))
    return event
  }

  it('hands a drag one hold from its press to its end, empty at the press, and the next drag another', async () => {
    const holds: (Record<string, number> | undefined)[] = []
    const emptyAtPress: boolean[] = []
    const display: PlateDisplay = {
      ...withHandle(),
      handles: () => [
        {
          key: 'a',
          name: 'a',
          x: 40,
          y: 30,
          drag: (x: number, _y: number, hold?: Record<string, number>) => {
            if (hold && !holds.includes(hold)) emptyAtPress.push(Object.keys(hold).length === 0)
            holds.push(hold)
            // What a display keeps of its press: there again at every move.
            if (hold) hold.pressedAt ??= x
            return { a: x }
          },
        },
      ],
    }
    const { surface } = await mount(display)
    fireEvent.pointerDown(surface, { pointerId: 1, button: 0, clientX: 40, clientY: 30 })
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 50, clientY: 30 })
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 60, clientY: 30 })
    fireEvent.pointerUp(surface, { pointerId: 1, clientX: 60, clientY: 30 })
    expect(holds).toHaveLength(3)
    expect(holds[0]).toBeDefined()
    expect(holds[1]).toBe(holds[0])
    expect(holds[2]).toBe(holds[0])
    expect(holds[0]).toEqual({ pressedAt: 40 })
    fireEvent.pointerDown(surface, { pointerId: 2, button: 0, clientX: 40, clientY: 30 })
    fireEvent.pointerUp(surface, { pointerId: 2, clientX: 40, clientY: 30 })
    expect(holds).toHaveLength(4)
    expect(holds[3]).not.toBe(holds[0])
    expect(emptyAtPress).toEqual([true, true])
  })

  it('turns by the size of the wheel: a trackpad’s small events add up to the step of one notch', async () => {
    vi.useFakeTimers()
    try {
      const { display } = twoPoints()
      const { surface, onDragStart, onDrag, onDragEnd } = await mount(display)
      // Twenty-five events of 4 px are the 100 px of one notch: one step, not twenty-five.
      for (let n = 0; n < 25; n++) {
        const event = wheel(surface, { deltaY: -4, clientX: 40, clientY: 30 })
        expect(event.defaultPrevented).toBe(true)
      }
      expect(onDrag.mock.calls).toEqual([[{ bWidth: 1 }]])
      // A notch of a wheel is a step at once, and three notches in one event are three.
      wheel(surface, { deltaY: 100, clientX: 40, clientY: 30 })
      wheel(surface, { deltaY: -300, clientX: 40, clientY: 30 })
      // Lines count as a wheel sends them: three to the notch.
      wheel(surface, { deltaY: -3, deltaMode: 1, clientX: 40, clientY: 30 })
      expect(onDrag.mock.calls.slice(1)).toEqual([
        [{ bWidth: -1 }],
        [{ bWidth: 3 }],
        [{ bWidth: 1 }],
      ])
      // All of it is one turn of the wheel: one undo step, closed once the wheel rests.
      expect(onDragStart).toHaveBeenCalledTimes(1)
      expect(onDragEnd).not.toHaveBeenCalled()
      act(() => void vi.advanceTimersByTime(399))
      expect(onDragEnd).not.toHaveBeenCalled()
      act(() => void vi.advanceTimersByTime(1))
      expect(onDragEnd).toHaveBeenCalledTimes(1)
      expect(onDragEnd).toHaveBeenCalledWith(['bWidth'])
      // After a rest the next turn is another step.
      wheel(surface, { deltaY: -100, clientX: 40, clientY: 30 })
      expect(onDragStart).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('leaves a swipe that goes across to whatever the plate stands in, and a turn too small for a step costs no undo', async () => {
    vi.useFakeTimers()
    try {
      const { display } = twoPoints()
      const { surface, onDragStart, onDrag, onDragEnd } = await mount(display)
      for (let n = 0; n < 20; n++) {
        const across = wheel(surface, { deltaX: 12, deltaY: 1, clientX: 40, clientY: 30 })
        expect(across.defaultPrevented).toBe(false)
      }
      expect(onDrag).not.toHaveBeenCalled()
      // A little up and down over the point is the point's, and moves nothing yet.
      const little = wheel(surface, { deltaY: -30, clientX: 40, clientY: 30 })
      expect(little.defaultPrevented).toBe(true)
      act(() => void vi.advanceTimersByTime(500))
      expect(onDragStart).not.toHaveBeenCalled()
      expect(onDragEnd).not.toHaveBeenCalled()
      // And what was left of it is forgotten with the rest: it does not ride into the next turn.
      wheel(surface, { deltaY: -80, clientX: 40, clientY: 30 })
      expect(onDrag).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('closes an open turn of the wheel before a press takes the handle', async () => {
    vi.useFakeTimers()
    try {
      const { display } = twoPoints()
      const { surface, onDragStart, onDragEnd } = await mount(display)
      wheel(surface, { deltaY: -100, clientX: 40, clientY: 30 })
      fireEvent.pointerDown(surface, { pointerId: 1, button: 0, clientX: 40, clientY: 30 })
      expect(onDragEnd.mock.calls).toEqual([[['bWidth']]])
      expect(onDragStart.mock.calls).toEqual([[['bWidth']], [['b']]])
      fireEvent.pointerUp(surface, { pointerId: 1 })
      act(() => void vi.advanceTimersByTime(500))
      expect(onDragEnd).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('ends the drag of a handle still in hand when the display leaves the page, once', async () => {
    const { display } = twoPoints()
    const { surface, onDragStart, onDragEnd } = await mount(display)
    fireEvent.pointerDown(surface, { pointerId: 1, button: 0, clientX: 40, clientY: 30 })
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 60, clientY: 30 })
    expect(onDragStart.mock.calls).toEqual([[['b']]])
    expect(onDragEnd).not.toHaveBeenCalled()
    // Off the page with the pointer down: the browser sends the display nothing more.
    cleanup()
    expect(onDragEnd.mock.calls).toEqual([[['b']]])
    // A display that leaves with nothing in hand says nothing.
    const again = await mount(twoPoints().display)
    fireEvent.pointerDown(again.surface, { pointerId: 1, button: 0, clientX: 40, clientY: 30 })
    fireEvent.pointerUp(again.surface, { pointerId: 1, clientX: 40, clientY: 30 })
    expect(again.onDragEnd).toHaveBeenCalledTimes(1)
    cleanup()
    expect(again.onDragEnd).toHaveBeenCalledTimes(1)
  })

  it('ends the drag of a handle when its pointer is taken from the display, once', async () => {
    const { display, at } = twoPoints()
    const { surface, onDragStart, onDrag, onDragEnd } = await mount(display)
    // A plate moved along its chain is taken out of the page and put in again: the capture is lost.
    fireEvent.pointerDown(surface, { pointerId: 1, button: 0, clientX: 40, clientY: 30 })
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 60, clientY: 30 })
    fireEvent.lostPointerCapture(surface, { pointerId: 1 })
    expect(onDragEnd.mock.calls).toEqual([[['b']]])
    // The pointer still over the display moves nothing it no longer holds, and its going up ends nothing twice.
    const moved = onDrag.mock.calls.length
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 90, clientY: 30 })
    fireEvent.pointerUp(surface, { pointerId: 1, clientX: 90, clientY: 30 })
    expect(onDrag).toHaveBeenCalledTimes(moved)
    expect(at.b).toBe(60)
    expect(onDragEnd).toHaveBeenCalledTimes(1)
    // A browser says the capture is lost after every pointer up as well: that is the same end.
    fireEvent.pointerDown(surface, { pointerId: 2, button: 0, clientX: 60, clientY: 30 })
    fireEvent.pointerUp(surface, { pointerId: 2, clientX: 60, clientY: 30 })
    fireEvent.lostPointerCapture(surface, { pointerId: 2 })
    expect(onDragStart).toHaveBeenCalledTimes(2)
    expect(onDragEnd).toHaveBeenCalledTimes(2)
  })

  it('lays the handle moved last on top of one it comes to stand on, so each can be taken again', async () => {
    const { display, at } = twoPoints()
    const { surface, onDragStart } = await mount(display)
    const taken = (): string => (onDragStart.mock.calls.at(-1)?.[0] as string[])[0]
    const drag = (from: number, to: number): void => {
      fireEvent.pointerDown(surface, { pointerId: 1, button: 0, clientX: from, clientY: 30 })
      fireEvent.pointerMove(surface, { pointerId: 1, clientX: to, clientY: 30 })
      fireEvent.pointerUp(surface, { pointerId: 1 })
    }
    // Neither has been moved: the later one is on top, and is carried off.
    drag(40, 120)
    expect(taken()).toBe('b')
    expect(at).toEqual({ a: 40, b: 120 })
    // The one it covered is free, and is put down on the other.
    drag(40, 120)
    expect(taken()).toBe('a')
    expect(at).toEqual({ a: 120, b: 120 })
    // Now the one just put down is on top: a press there takes it again, not the later one.
    drag(120, 60)
    expect(taken()).toBe('a')
    expect(at).toEqual({ a: 60, b: 120 })
    // And a handle that is plainly nearer the press is taken whatever was moved last.
    drag(120, 126)
    expect(taken()).toBe('b')
    at.a = 122
    drag(121, 121)
    expect(taken()).toBe('a')
  })

  it('takes two presses that moved nothing for a double press, and two quick nudges for two nudges', async () => {
    const { display, at } = twoPoints()
    const { surface, onDrag } = await mount(display)
    const press = (by: number): void => {
      const from = at.b
      fireEvent.pointerDown(surface, { pointerId: 1, button: 0, clientX: from, clientY: 30 })
      if (by !== 0)
        fireEvent.pointerMove(surface, { pointerId: 1, clientX: from + by, clientY: 30 })
      fireEvent.pointerUp(surface, { pointerId: 1 })
    }
    // Two nudges of 3 px, which the browser counts as a double click: the second nudge stays.
    press(3)
    press(3)
    fireEvent.doubleClick(surface, { clientX: at.b, clientY: 30 })
    expect(at.b).toBe(46)
    expect(onDrag).not.toHaveBeenCalledWith({ b: 0 })
    // A nudge and then a press is not one either.
    press(0)
    fireEvent.doubleClick(surface, { clientX: at.b, clientY: 30 })
    expect(onDrag).not.toHaveBeenCalledWith({ b: 0 })
    // Two presses that move nothing are.
    press(0)
    fireEvent.doubleClick(surface, { clientX: at.b, clientY: 30 })
    expect(onDrag).toHaveBeenLastCalledWith({ b: 0 })
    // A hand wobbles a pixel while it presses: that is still a double press, and puts the point back.
    press(3)
    press(1)
    press(0)
    fireEvent.doubleClick(surface, { clientX: at.b, clientY: 30 })
    expect(onDrag).toHaveBeenLastCalledWith({ b: 0 })
    press(3)
    press(0)
    press(-1)
    fireEvent.doubleClick(surface, { clientX: at.b, clientY: 30 })
    expect(onDrag).toHaveBeenLastCalledWith({ b: 0 })
  })

  it('counts a finger’s double tap itself, on the second tap’s release, and not two nudges', async () => {
    const { display, at } = twoPoints()
    const { surface, onDrag, onDragStart, onDragEnd } = await mount(display)
    const finger = (by: number): void => {
      const from = at.b
      const touch = { pointerId: 5, pointerType: 'touch', button: 0, clientY: 30 }
      fireEvent.pointerDown(surface, { ...touch, clientX: from })
      if (by !== 0) fireEvent.pointerMove(surface, { ...touch, clientX: from + by })
      fireEvent.pointerUp(surface, { ...touch })
    }
    finger(4)
    finger(4)
    expect(at.b).toBe(48)
    expect(onDrag).not.toHaveBeenCalledWith({ b: 0 })
    // One tap is a tap.
    finger(0)
    expect(onDrag).not.toHaveBeenCalledWith({ b: 0 })
    // The second, soon after and on the same point, puts it back: as one step of its own.
    const starts = onDragStart.mock.calls.length
    finger(0)
    expect(onDrag).toHaveBeenLastCalledWith({ b: 0 })
    expect(onDragStart.mock.calls.slice(starts)).toEqual([[['b']], [['b']]])
    expect(onDragEnd).toHaveBeenCalledTimes(onDragStart.mock.calls.length)
    // A third tap begins a new pair: it does not reset again by itself.
    const drags = onDrag.mock.calls.length
    finger(0)
    expect(onDrag.mock.calls.length).toBe(drags)
    // A finger wobbles a few pixels in a tap: two such taps are still a double press.
    finger(8)
    finger(2)
    finger(-3)
    expect(onDrag).toHaveBeenLastCalledWith({ b: 0 })
  })

  it('keeps a finger that comes down on a point, and lets one beside the points scroll', async () => {
    const { display } = twoPoints()
    const { surface } = await mount(display)
    const touchStart = (x: number, y: number): Event => {
      const event = new Event('touchstart', { bubbles: true, cancelable: true })
      Object.defineProperty(event, 'changedTouches', { value: [{ clientX: x, clientY: y }] })
      act(() => void surface.dispatchEvent(event))
      return event
    }
    // On the point, and within a finger's reach of it: the browser must not scroll.
    expect(touchStart(40, 30).defaultPrevented).toBe(true)
    expect(touchStart(54, 38).defaultPrevented).toBe(true)
    // Beside the points the swipe is the browser's, to scroll what the plate stands in.
    expect(touchStart(120, 30).defaultPrevented).toBe(false)
    // No style says "never scroll from here": that would also hold the swipes beside the points.
    expect(surface.style.touchAction).toBe('')
  })
})
