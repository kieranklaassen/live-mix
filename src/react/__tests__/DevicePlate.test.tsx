// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { type Device } from '../../core/devices/Device'
import { STOCK_WASM_DEVICES } from '../../dsp'
import { DeviceChainView } from '../components/DeviceChainView'
import { DevicePlate, plateLayout } from '../components/DevicePlate'
import {
  DEVICE_SKINS,
  PLATE_FINISHES,
  PlateFinishLayer,
  QUIET_SKIN,
  deviceSkin,
  isDarkPlate,
  type DeviceSkin,
} from '../components/device-skins'
import { Knob, type KnobCap } from '../components/Knob'
import { MissingNativeDevice } from '../../native/missing'
import { createTestEngine, type TestEngine } from './harness'

afterEach(cleanup)

async function make(fixture: TestEngine, id = 'filter'): Promise<Device> {
  return fixture.engine.devices.create(id, fixture.engine.context)
}

/** A skin for the stock filter: two knobs on the face and a picture that follows the frequency. */
const SKIN: DeviceSkin = {
  name: 'Sweep',
  plate: '#23566b',
  ink: '#e6f1ee',
  accent: '#8fe0d0',
  finish: 'grain',
  cap: 'pointer',
  face: ['frequency', 'q'],
  labels: { frequency: 'Freq' },
  picture: {
    params: ['frequency'],
    draw: (at) => <circle data-testid="drawn" r={Math.round(at('frequency') * 100)} />,
  },
}

describe('device skins', () => {
  const stock = new Map(STOCK_WASM_DEVICES.map((descriptor) => [descriptor.id, descriptor]))

  it('skins devices that exist, with face knobs and picture parameters they have', () => {
    for (const [id, skin] of Object.entries(DEVICE_SKINS)) {
      const params = Object.keys(stock.get(id)?.params ?? {})
      expect(params.length, `${id} is a stock device`).toBeGreaterThan(0)
      expect(skin.face, `${id} face`).toHaveLength(4)
      for (const name of [...(skin.face ?? []), ...(skin.picture?.params ?? [])])
        expect(params, `${id} has ${name}`).toContain(name)
      for (const name of Object.keys(skin.labels ?? {}))
        expect(skin.face, `${id} labels a face knob`).toContain(name)
      expect(PLATE_FINISHES).toContain(skin.finish)
    }
  })

  it('has a skin for every effect that colours the sound, the ambient ones included', () => {
    const skinned = [
      'analog-delay',
      'analog-drive',
      'cascade',
      'echo-memory',
      'glitch',
      'half-speed',
      'low-bitrate',
      'micro-looper',
      'noise-floor',
      'octaves',
      'pad-follower',
      'patina',
      'pitch-shifter',
      'radio',
      're-amp',
      'shaped-reverb',
      'stereo-detune',
      'sustainer',
      'swarm-reverb',
      'vintage-digital',
      'vinyl',
      'vowel-reverb',
    ]
    for (const id of skinned) {
      expect(stock.get(id)?.category, `${id} is a stock effect`).not.toBe('instrument')
      expect(stock.has(id), `${id} is a stock device`).toBe(true)
      expect(DEVICE_SKINS[id]?.picture, `${id} has a plate with a picture`).toBeDefined()
    }
    // No two plates share a colour: each is told apart at a glance.
    const plates = Object.values(DEVICE_SKINS).map((skin) => skin.plate)
    expect(new Set(plates).size).toBe(plates.length)
  })

  it('draws every picture at any setting, and differently as the settings move', () => {
    for (const [id, skin] of Object.entries(DEVICE_SKINS)) {
      const drawn = [0, 0.4, 1].map((position) =>
        renderToStaticMarkup(<svg>{skin.picture?.draw(() => position)}</svg>),
      )
      for (const markup of drawn) {
        expect(markup.length, id).toBeGreaterThan(40)
        expect(markup, id).not.toMatch(/NaN|undefined|Infinity/)
      }
      expect(new Set(drawn).size, `${id} follows its settings`).toBe(3)
    }
  })

  it('gives a device its own skin, else the quiet one, and none to a device that draws itself', async () => {
    const fixture = createTestEngine()
    const filter = await make(fixture)
    expect(deviceSkin(filter)).toBe(QUIET_SKIN)
    expect(deviceSkin(filter, { filter: SKIN })).toBe(SKIN)
    // A name every object has is not a skin.
    expect(deviceSkin(Object.assign(filter, { id: 'toString' }))).toBe(QUIET_SKIN)
    expect(deviceSkin(new MissingNativeDevice(fixture.engine.context, 'plugin:gone'))).toBeNull()
  })

  it('reads a hex plate as dark or light, and anything else as light', () => {
    expect([
      isDarkPlate('#23566b'),
      isDarkPlate('#efe5cf'),
      isDarkPlate('var(--lm-raised)'),
    ]).toEqual([true, false, false])
  })

  it('draws a finish under its own id, and nothing for matte', () => {
    for (const finish of PLATE_FINISHES) {
      const markup = renderToStaticMarkup(<PlateFinishLayer finish={finish} dark id="f1" />)
      if (finish === 'matte') expect(markup).toBe('')
      else expect(markup).toMatch(/id="f1".*url\(#f1\)/)
    }
  })
})

describe('plateLayout', () => {
  it('keeps a plate on whole cells and widens it with its knobs', () => {
    expect(plateLayout(4, true)).toEqual({ rows: 1, columns: 4, column: 48, width: 240 })
    expect(plateLayout(2, true).width).toBe(240)
    expect(plateLayout(10, true)).toEqual({ rows: 1, columns: 10, column: 48, width: 540 })
    // Past twelve the knobs take two rows and the picture stands clear beside them.
    expect(plateLayout(20, true)).toEqual({ rows: 2, columns: 10, column: 48, width: 740 })
    expect(plateLayout(4, false)).toEqual({ rows: 1, columns: 4, column: 56, width: 280 })
    expect(plateLayout(8, false)).toEqual({ rows: 2, columns: 4, column: 56, width: 280 })
    expect(plateLayout(14, false)).toEqual({ rows: 2, columns: 7, column: 56, width: 440 })
  })
})

describe('Knob caps', () => {
  it('draws a cap in place of the arc and turns it with the value', () => {
    const drawing = (cap?: KnobCap, value = 0.5): string => {
      const { container, unmount } = render(
        <Knob label="Time" defaultValue={value} min={0} max={1} cap={cap} />,
      )
      const capped = container.firstElementChild?.classList.contains('lm-knob--cap') ?? false
      const drawn = container.querySelector('svg')?.innerHTML ?? ''
      unmount()
      expect(capped).toBe(cap !== undefined && cap !== 'arc')
      expect(drawn).not.toMatch(/NaN/)
      return drawn
    }
    const low = drawing('pointer', 0)
    expect(low).toContain('var(--lm-plate-ink')
    expect(drawing('pointer', 1)).not.toBe(low)
    const caps = (['disc', 'dot', 'skirt', 'pointer'] as const).map((cap) => drawing(cap))
    expect(new Set(caps).size).toBe(4)
    expect(drawing()).toBe(drawing('arc'))
    expect(caps).not.toContain(drawing())
  })
})

describe('DevicePlate', () => {
  it('shows the face, carries the skin, and opens to every control', async () => {
    const fixture = createTestEngine()
    const device = await make(fixture)
    const onOpenChange = vi.fn()
    render(
      <DevicePlate device={device} skin={SKIN} onOpenChange={onOpenChange} data-testid="plate" />,
      { wrapper: fixture.wrapper },
    )
    const plate = screen.getByTestId('plate')
    expect(plate).toHaveAttribute('aria-label', 'Filter')
    expect(plate).toHaveAttribute('data-finish', 'grain')
    expect(plate.style.getPropertyValue('--lm-plate')).toBe('#23566b')
    expect(plate.style.width).toBe('240px')
    expect(screen.getByRole('heading', { name: 'Sweep' })).toBeInTheDocument()
    expect(screen.getAllByRole('slider').map((knob) => knob.getAttribute('aria-label'))).toEqual([
      'Freq',
      'Q',
    ])
    expect(plate.querySelectorAll('.lm-knob--cap')).toHaveLength(2)
    expect(plate.querySelector('.lm-plate__finish filter')).not.toBeNull()

    const more = screen.getByTestId('plate-more')
    expect(more).toHaveTextContent('+2')
    expect(more).toHaveAttribute('aria-expanded', 'false')
    expect(more).toHaveAttribute('data-lm-info')
    fireEvent.click(more)
    expect(onOpenChange).toHaveBeenCalledWith(true)
    expect(screen.getAllByRole('slider')).toHaveLength(4)
    expect(screen.getByTestId('plate-more')).toHaveAttribute('aria-expanded', 'true')
    expect(plate).toHaveClass('lm-plate--open')
    fireEvent.click(screen.getByTestId('plate-more'))
    expect(screen.getAllByRole('slider')).toHaveLength(2)
  })

  it('turns the device off and on from the lamp', async () => {
    const fixture = createTestEngine()
    const device = await make(fixture)
    render(<DevicePlate device={device} skin={SKIN} data-testid="plate" />, {
      wrapper: fixture.wrapper,
    })
    const lamp = screen.getByRole('switch', { name: 'Filter power' })
    expect(lamp).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(lamp)
    expect(device.bypass).toBe(true)
    expect(screen.getByTestId('plate')).toHaveClass('lm-plate--off')
    expect(screen.getByTestId('plate')).toHaveAttribute('data-powered', 'false')
  })

  it('redraws the picture when a parameter it reads moves, and not otherwise', async () => {
    const fixture = createTestEngine()
    const device = await make(fixture)
    const draw = vi.fn((at: (param: string) => number) => (
      <circle data-testid="drawn" r={Math.round(at('frequency') * 100)} />
    ))
    render(
      <DevicePlate
        device={device}
        skin={{ ...SKIN, picture: { params: ['frequency'], draw } }}
        defaultOpen
        data-testid="plate"
      />,
      { wrapper: fixture.wrapper },
    )
    const before = screen.getByTestId('drawn').getAttribute('r')
    const drawn = draw.mock.calls.length
    act(() => device.setParam('q', 4))
    expect(draw.mock.calls.length).toBe(drawn)
    act(() => device.setParam('frequency', 12_000))
    expect(draw.mock.calls.length).toBeGreaterThan(drawn)
    expect(screen.getByTestId('drawn').getAttribute('r')).not.toBe(before)
  })

  it('lays a plate without a picture in two rows of four, with every knob said in the info view', async () => {
    const fixture = createTestEngine()
    const device = await make(fixture, 'parametric-eq')
    render(<DevicePlate device={device} skin={QUIET_SKIN} data-testid="plate" />, {
      wrapper: fixture.wrapper,
    })
    const plate = screen.getByTestId('plate')
    expect(screen.getAllByRole('slider')).toHaveLength(8)
    expect(plate.style.getPropertyValue('--lm-plate-rows')).toBe('2')
    expect(plate.querySelector('.lm-plate__picture')).toBeNull()
    expect(plate.querySelector('.lm-plate__finish')).toBeNull()
    expect(screen.getByTestId('plate-more')).toHaveTextContent('+6')
    for (const knob of plate.querySelectorAll('.lm-knob'))
      expect(knob.getAttribute('data-lm-info')).toBeTruthy()
    expect(plate.getAttribute('data-lm-info')).toBeTruthy()
  })

  it('sets a long word under a knob tighter, so no name is cut short', async () => {
    const fixture = createTestEngine()
    const device = await make(fixture)
    render(
      <DevicePlate
        device={device}
        skin={{ ...SKIN, labels: { frequency: 'Interference', q: 'Low cut' } }}
        data-testid="plate"
      />,
      { wrapper: fixture.wrapper },
    )
    expect(screen.getByTestId('plate-frequency')).toHaveClass('lm-plate__knob--tight')
    // Two short words take two lines at the usual size.
    expect(screen.getByTestId('plate-q')).not.toHaveClass('lm-plate__knob--tight')
  })

  it('has no cell to open when the face holds everything', async () => {
    const fixture = createTestEngine()
    const device = await make(fixture)
    render(<DevicePlate device={device} skin={QUIET_SKIN} data-testid="plate" />, {
      wrapper: fixture.wrapper,
    })
    expect(screen.getAllByRole('slider')).toHaveLength(4)
    expect(screen.queryByTestId('plate-more')).toBeNull()
  })
})

describe('DeviceChainView with skins', () => {
  it('draws a plate for a device with a skin and the panel for the rest, with the same tools', async () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const filter = await make(fixture)
    const delay = await make(fixture, 'delay')
    pad.strip.addInsert(filter)
    pad.strip.addInsert(delay)
    render(
      <DeviceChainView
        strip={pad}
        skin={(device) => (device.id === 'filter' ? SKIN : null)}
        data-testid="chain"
      />,
      { wrapper: fixture.wrapper },
    )
    expect(screen.getByTestId('chain-device-0')).toHaveClass('lm-plate')
    expect(screen.getByTestId('chain-device-1')).toHaveClass('lm-device')
    // The plate moves and leaves the chain like a panel does.
    fireEvent.click(screen.getByTestId('chain-later-0'))
    expect(pad.strip.inserts).toEqual([delay, filter])
    expect(screen.getByTestId('chain-device-1')).toHaveClass('lm-plate')
    fireEvent.click(screen.getByTestId('chain-device-1-remove'))
    expect(pad.strip.inserts).toEqual([delay])
  })

  it('carries a plate by its face, under its full name, and leaves its knobs to themselves', async () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const filter = await make(fixture)
    const delay = await make(fixture, 'delay')
    pad.strip.addInsert(filter)
    pad.strip.addInsert(delay)
    render(<DeviceChainView strip={pad} skin={() => SKIN} data-testid="chain" />, {
      wrapper: fixture.wrapper,
    })
    // jsdom lays nothing out: two plates, 200 wide each.
    const items = [0, 1].map((index) => screen.getByTestId(`chain-item-${index}`))
    items.forEach((item, index) => {
      item.getBoundingClientRect = () =>
        ({ left: index * 200, right: index * 200 + 200, top: 0, bottom: 140 }) as DOMRect
    })
    const plate = screen.getByTestId('chain-device-0')
    expect(plate.dataset.lmInfo).toContain('Drag it by its face')

    // A knob on the face is turned, not carried by.
    fireEvent.pointerDown(screen.getByTestId('chain-device-0-frequency'), {
      pointerId: 1,
      button: 0,
      clientX: 40,
    })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 380 })
    fireEvent.pointerUp(window, { pointerId: 1 })
    expect(screen.queryByTestId('chain-carried')).toBeNull()
    expect(pad.strip.inserts).toEqual([filter, delay])

    // The face is: the name tag shows the skin's name, the carried name is the device's.
    fireEvent.pointerDown(plate, { pointerId: 2, button: 0, clientX: 40 })
    fireEvent.pointerMove(window, { pointerId: 2, clientX: 380 })
    expect(screen.getByTestId('chain-carried')).toHaveTextContent('Filter')
    expect(screen.getByTestId('chain-marker')).toBeInTheDocument()
    fireEvent.pointerUp(window, { pointerId: 2 })
    expect(pad.strip.inserts).toEqual([delay, filter])
    // It is the same plate in its new place.
    expect(screen.getByTestId('chain-device-1')).toBe(plate)
  })
})
