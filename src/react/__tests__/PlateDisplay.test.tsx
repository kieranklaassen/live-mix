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
import { settledDisplays } from '../components/PlateDisplay'
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

    // A double press puts it back where the device starts.
    const now = display.handles?.(view(display.draw))[0]
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
})
