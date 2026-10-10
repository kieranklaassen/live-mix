// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { type Device, type EditorDevice } from '../../core/devices/Device'
import { DeviceChainView } from '../components/DeviceChainView'
import { DevicePlate, plateLayout } from '../components/DevicePlate'
import {
  DEVICE_SKINS,
  PLATE_FINISHES,
  PlateFinishLayer,
  QUIET_SKIN,
  deviceSkin,
  hostedSkin,
  isDarkPlate,
  type DeviceSkin,
} from '../components/device-skins'
import { controlGestureInfo, infoParagraphs, resolveInfo } from '../components/info'
import { Knob, type KnobCap } from '../components/Knob'
import { type PlateDisplay } from '../components/plate-display'
import { HOSTED_PLATES, PLATE_PALETTES } from '../components/plate-palettes'
import { MissingNativeDevice } from '../../native/missing'
import { recordingContext, stockDescriptors } from './display-harness'
import { createTestEngine, type TestEngine } from './harness'

afterEach(cleanup)

async function make(fixture: TestEngine, id = 'filter'): Promise<Device> {
  return fixture.engine.devices.create(id, fixture.engine.context)
}

/** A stock device with a window of its own, the way a hosted plug-in has one. */
async function makeHosted(fixture: TestEngine, id = 'filter'): Promise<EditorDevice> {
  return Object.assign(await make(fixture, id), {
    openEditor: vi.fn().mockResolvedValue(undefined),
    closeEditor: vi.fn().mockResolvedValue(undefined),
  })
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
  const stock = stockDescriptors()

  it('skins devices that exist, with face knobs and picture parameters they have', () => {
    for (const [id, skin] of Object.entries(DEVICE_SKINS)) {
      const params = Object.keys(stock.get(id)?.params ?? {})
      expect(params.length, `${id} is a stock device`).toBeGreaterThan(0)
      // Four knobs over a picture or a strip, two for each column beside a window.
      const room = skin.display?.place === 'window' ? 2 * (skin.display.columns ?? 2) : 4
      if (skin.picture || skin.display)
        expect(skin.face, `${id} face`).toHaveLength(Math.min(room, params.length))
      for (const name of [...(skin.face ?? []), ...(skin.picture?.params ?? [])])
        expect(params, `${id} has ${name}`).toContain(name)
      // No knob stands on a face twice.
      expect(new Set(skin.face).size, `${id} face`).toBe(skin.face?.length ?? 0)
      // A label is for any knob the plate can show: one on its face or one behind its +n cell.
      for (const name of Object.keys(skin.labels ?? {}))
        expect(params, `${id} labels a knob it has`).toContain(name)
      expect(PLATE_FINISHES).toContain(skin.finish)
    }
  })

  it('has a plate of its own for every stock effect', () => {
    for (const descriptor of stock.values()) {
      if (descriptor.category === 'instrument' || descriptor.kind === 'rack') continue
      expect(Object.hasOwn(DEVICE_SKINS, descriptor.id), `${descriptor.id} has a skin`).toBe(true)
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
      const skin = DEVICE_SKINS[id]
      expect(skin?.picture ?? skin?.display, `${id} has a plate that shows something`).toBeDefined()
    }
    // No two plates share a colour: each is told apart at a glance.
    const plates = Object.values(DEVICE_SKINS).map((skin) => skin.plate)
    expect(new Set(plates).size).toBe(plates.length)
  })

  it('draws every picture at any setting, and differently as the settings move', () => {
    for (const [id, skin] of Object.entries(DEVICE_SKINS)) {
      const picture = skin.picture
      if (!picture) continue
      const drawn = [0, 0.4, 1].map((position) =>
        renderToStaticMarkup(<svg>{picture.draw(() => position)}</svg>),
      )
      for (const markup of drawn) {
        expect(markup.length, id).toBeGreaterThan(40)
        expect(markup, id).not.toMatch(/NaN|undefined|Infinity/)
      }
      expect(new Set(drawn).size, `${id} follows its settings`).toBe(3)
    }
  })

  it('gives a device its own skin, else the quiet one, and none to a plug-in that is missing', async () => {
    const fixture = createTestEngine()
    const filter = await make(fixture)
    expect(deviceSkin(filter)).toBe(DEVICE_SKINS.filter)
    expect(deviceSkin(filter, { filter: SKIN })).toBe(SKIN)
    expect(deviceSkin(filter, {})).toBe(QUIET_SKIN)
    // A name every object has is not a skin.
    expect(deviceSkin(Object.assign(filter, { id: 'toString' }))).toBe(QUIET_SKIN)
    expect(deviceSkin(new MissingNativeDevice(fixture.engine.context, 'plugin:gone'))).toBeNull()
  })

  it('gives a hosted plug-in a case by its id: the same one every time, and all eight in use', async () => {
    const fixture = createTestEngine()
    const hosted = await makeHosted(fixture)
    const skin = deviceSkin(hosted)
    expect(skin).not.toBeNull()
    expect(skin).not.toBe(QUIET_SKIN)
    expect(deviceSkin(hosted)).toBe(skin)
    expect(hostedSkin(hosted)).toBe(skin)
    expect(skin?.picture).toBeDefined()
    expect(PLATE_FINISHES).toContain(skin?.finish)
    // A table of skins does not reach it: its id is not the kit's to know.
    expect(deviceSkin(hosted, { filter: SKIN })).toBe(skin)

    const another = (id: string): Device => Object.assign(Object.create(hosted) as Device, { id })
    const plates = new Set<string>()
    for (let n = 0; n < 200; n++) {
      const id = `vst3:Plug-in ${n}`
      const plate = hostedSkin(another(id)).plate
      // Another instance of the same plug-in is the same colour.
      expect(hostedSkin(another(id)).plate).toBe(plate)
      plates.add(plate)
    }
    expect([...plates].sort()).toEqual(HOSTED_PLATES.map((palette) => palette.plate).sort())
  })

  it("keeps the hosted cases apart from each other and from the kit's own plates", () => {
    const hosted: string[] = HOSTED_PLATES.map((palette) => palette.plate)
    expect(hosted).toHaveLength(8)
    expect(new Set(hosted).size).toBe(8)
    const own: string[] = Object.values(PLATE_PALETTES).map((palette) => palette.plate)
    for (const plate of hosted) expect(own, plate).not.toContain(plate)
  })

  it("draws a plug-in's window at any setting, and for a plug-in with no parameters", async () => {
    const fixture = createTestEngine()
    const hosted = await makeHosted(fixture)
    const picture = hostedSkin(hosted).picture
    // A slider for each of its first three parameters.
    expect(picture?.params).toEqual(Object.keys(hosted.params).slice(0, 3))
    const drawn = [0, 0.4, 1].map((position) =>
      renderToStaticMarkup(<svg>{picture?.draw(() => position)}</svg>),
    )
    for (const markup of drawn) {
      expect(markup.length).toBeGreaterThan(40)
      expect(markup).not.toMatch(/NaN|undefined|Infinity/)
    }
    expect(new Set(drawn).size).toBe(3)

    const bare = Object.assign(await makeHosted(fixture), { params: {}, panelParams: undefined })
    const empty = hostedSkin(bare).picture
    expect(empty?.params).toEqual([])
    const window = renderToStaticMarkup(<svg>{empty?.draw(() => 0.5)}</svg>)
    expect(window).toContain('<rect')
    expect(window).not.toMatch(/NaN|undefined|Infinity/)
  })

  /** How far apart two colours written as #rrggbb are, as the contrast ratio of WCAG 2. */
  const contrast = (a: string, b: string): number => {
    const channel = (hex: string, at: number): number => {
      const c = parseInt(hex.slice(at, at + 2), 16) / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    }
    const light = (hex: string): number =>
      0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5)
    const [high, low] = [light(a), light(b)].sort((x, y) => y - x)
    return (high + 0.05) / (low + 0.05)
  }

  it('keeps both inks readable on every plate: the words, and the lamp and marks in the accent', () => {
    for (const [id, palette] of Object.entries(PLATE_PALETTES)) {
      expect(contrast(palette.ink, palette.plate), `${id} ink on its plate`).toBeGreaterThan(3.8)
      // A lit lamp and a display's mark for now are small: three to one tells them from the plate.
      expect(contrast(palette.accent, palette.plate), `${id} accent on its plate`).toBeGreaterThan(
        3,
      )
    }
  })

  it("tells the Convolver's accent from its ink, which its display draws side by side", () => {
    // The display draws the curve the device is set to in the ink and what rings now in the
    // accent, one over the other: two to one between them, and still three to one on the plate.
    const { plate, ink, accent } = PLATE_PALETTES['convolver-reverb']
    expect(contrast(accent, ink)).toBeGreaterThanOrEqual(2)
    expect(contrast(accent, plate)).toBeGreaterThanOrEqual(3)
    // Nothing else of the skin is other than it was.
    expect([plate, ink]).toEqual(['#5a4c85', '#f6f3ff'])
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

/** A plate without a display: its knobs start at the plate's edge. */
const AT_REST = { knobsLeft: 4, display: null }

describe('plateLayout', () => {
  it('keeps a plate on whole cells and widens it with its knobs', () => {
    expect(plateLayout(4, true)).toEqual({
      ...AT_REST,
      rows: 1,
      columns: 4,
      column: 48,
      width: 240,
    })
    expect(plateLayout(2, true).width).toBe(240)
    expect(plateLayout(10, true)).toEqual({
      ...AT_REST,
      rows: 1,
      columns: 10,
      column: 48,
      width: 540,
    })
    // Past twelve the knobs take two rows and the picture stands clear beside them.
    expect(plateLayout(20, true)).toEqual({
      ...AT_REST,
      rows: 2,
      columns: 10,
      column: 48,
      width: 740,
    })
    expect(plateLayout(4, false)).toEqual({
      ...AT_REST,
      rows: 1,
      columns: 4,
      column: 56,
      width: 280,
    })
    expect(plateLayout(8, false)).toEqual({
      ...AT_REST,
      rows: 2,
      columns: 4,
      column: 56,
      width: 280,
    })
    expect(plateLayout(14, false)).toEqual({
      ...AT_REST,
      rows: 2,
      columns: 7,
      column: 56,
      width: 440,
    })
  })

  it('gives a window its height and the knobs two rows beside it', () => {
    // Two columns of knobs: the window is 128 wide and the knobs start where it ends.
    expect(plateLayout(4, false, { place: 'window', columns: 2 })).toEqual({
      rows: 2,
      columns: 2,
      column: 48,
      width: 280,
      knobsLeft: 140,
      display: { left: 8, top: 8, width: 128, height: 100 },
    })
    expect(plateLayout(2, false, { place: 'window', columns: 1 }).display?.width).toBe(176)
    expect(plateLayout(6, false, { place: 'window', columns: 3 }).display?.width).toBe(80)
    for (const columns of [1, 2, 3] as const)
      expect(plateLayout(columns * 2, false, { place: 'window', columns }).width).toBe(280)
    // Opened, the knobs run on in their two rows and the window keeps its size.
    const opened = plateLayout(12, false, { place: 'window', columns: 2 })
    expect(opened.display).toEqual({ left: 8, top: 8, width: 128, height: 100 })
    expect(opened.rows).toBe(2)
    expect(opened.width % 20).toBe(0)
  })

  it('lays a strip under one row of knobs, as wide as the row', () => {
    // A face of four is as wide as a plate with a window, and its knobs share that room.
    const rest = plateLayout(4, false, { place: 'strip' })
    expect(rest).toMatchObject({ rows: 1, columns: 4, column: 58, width: 280 })
    expect(rest.width).toBe(plateLayout(4, false, { place: 'window', columns: 2 }).width)
    expect(rest.display).toEqual({ left: 8, top: 60, width: 224, height: 48 })
    // Opened in one row the strip runs under all of it; the right-hand column stays the plate's.
    const opened = plateLayout(9, false, { place: 'strip' })
    expect(opened.rows).toBe(1)
    expect(opened.column).toBe(48)
    expect(opened.display).toMatchObject({ left: 8, top: 60, height: 48 })
    expect(opened.display?.width).toBe(opened.width - 56)
    // Past twelve knobs they take two rows and the strip stands beside them at full height.
    const many = plateLayout(20, false, { place: 'strip' })
    expect(many.rows).toBe(2)
    expect(many.display).toMatchObject({ top: 8, width: 184, height: 100 })
  })

  it('stands an upright plate 220 by 300, the display over two rows of knobs', () => {
    const strip = { place: 'strip' } as const
    const top = { left: 8, top: 8, width: 204, height: 100 }
    const large = { height: 300, knobsTop: 110, row: 56, knob: 36 }
    const usual = { ...large, knob: 30 }
    const face = { rows: 2, width: 220, knobsLeft: 8, display: top }
    // Up to four knobs stand two abreast and are larger; a lone one has the middle.
    expect(plateLayout(1, false, strip, true)).toEqual({
      ...face,
      columns: 1,
      column: 204,
      upright: large,
    })
    for (const knobs of [2, 4])
      expect(plateLayout(knobs, false, strip, true)).toEqual({
        ...face,
        columns: 2,
        column: 102,
        upright: large,
      })
    // Five and six stand three abreast, eight four abreast, at the usual size.
    for (const knobs of [5, 6])
      expect(plateLayout(knobs, false, strip, true)).toEqual({
        ...face,
        columns: 3,
        column: 68,
        upright: usual,
      })
    expect(plateLayout(8, false, strip, true)).toEqual({
      ...face,
      columns: 4,
      column: 51,
      upright: usual,
    })
    // The display is the same box whichever place it has on a flat plate, and a picture leaves the top to itself.
    expect(plateLayout(8, false, { place: 'window', columns: 3 }, true).display).toEqual(top)
    expect(plateLayout(8, true, undefined, true)).toEqual({
      ...face,
      columns: 4,
      column: 51,
      display: null,
      upright: usual,
    })
  })

  it('gives an upright plate without a display four rows of four from the top', () => {
    const plain = { height: 300, knobsTop: 8, row: 50, knob: 30 }
    for (const knobs of [9, 16])
      expect(plateLayout(knobs, false, undefined, true)).toEqual({
        rows: 4,
        columns: 4,
        column: 51,
        width: 220,
        knobsLeft: 8,
        display: null,
        upright: plain,
      })
    // Opened past sixteen it widens by columns, and the rows stand in the middle.
    expect(plateLayout(20, false, undefined, true)).toEqual({
      rows: 4,
      columns: 5,
      column: 51,
      width: 280,
      knobsLeft: 12,
      display: null,
      upright: plain,
    })
  })

  it('widens an opened upright plate by columns, and stretches the display with it', () => {
    const strip = { place: 'strip' } as const
    const usual = { height: 300, knobsTop: 110, row: 56, knob: 30 }
    expect(plateLayout(12, false, strip, true)).toEqual({
      rows: 2,
      columns: 6,
      column: 51,
      width: 340,
      knobsLeft: 17,
      display: { left: 8, top: 8, width: 324, height: 100 },
      upright: usual,
    })
    expect(plateLayout(20, false, strip, true)).toEqual({
      rows: 2,
      columns: 10,
      column: 51,
      width: 540,
      knobsLeft: 15,
      display: { left: 8, top: 8, width: 524, height: 100 },
      upright: usual,
    })
  })

  it('lays a flat plate as before, whether or not it is asked', () => {
    const cases: [number, boolean, Pick<PlateDisplay, 'place' | 'columns'> | undefined][] = [
      [4, true, undefined],
      [20, true, undefined],
      [8, false, undefined],
      [14, false, undefined],
      [4, false, { place: 'window', columns: 2 }],
      [12, false, { place: 'window', columns: 2 }],
      [4, false, { place: 'strip' }],
      [9, false, { place: 'strip' }],
      [20, false, { place: 'strip' }],
    ]
    for (const [knobs, pictured, display] of cases) {
      const flat = plateLayout(knobs, pictured, display)
      expect(plateLayout(knobs, pictured, display, false)).toEqual(flat)
      expect(flat.upright).toBeUndefined()
    }
    expect(plateLayout(8, false)).toEqual({
      ...AT_REST,
      rows: 2,
      columns: 4,
      column: 56,
      width: 280,
    })
    expect(plateLayout(9, false, { place: 'strip' })).toMatchObject({
      rows: 1,
      columns: 9,
      column: 48,
      width: 480,
      knobsLeft: 4,
    })
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

  it("names no value for a double-click on a knob that carries the device's own words", async () => {
    const fixture = createTestEngine()
    // A device that words one of its values itself, as a hosted plug-in does: for the value now.
    const device = Object.assign(await make(fixture), {
      paramText: (name: string) => (name === 'q' ? '9.6 s' : undefined),
    })
    render(<DevicePlate device={device} skin={SKIN} />, { wrapper: fixture.wrapper })
    const gesture = (name: string): string | undefined =>
      infoParagraphs(resolveInfo(screen.getByRole('slider', { name }))?.text ?? '').at(-1)
    expect(screen.getByRole('slider', { name: 'Q' })).toHaveAttribute('aria-valuetext', '9.6 s')
    expect(gesture('Q')).toBe(controlGestureInfo({}))
    expect(gesture('Q')).toMatch(/returns it to its default\.$/)
    // The knob the kit words itself still names its default.
    expect(gesture('Freq')).toBe(controlGestureInfo({ reset: '1.00 kHz' }))
  })

  it('says which device and parameter each part is, as a panel does, for a host that maps controllers', async () => {
    const fixture = createTestEngine()
    const device = await make(fixture)
    render(<DevicePlate device={device} skin={SKIN} data-testid="plate" />, {
      wrapper: fixture.wrapper,
    })
    const plate = screen.getByTestId('plate')
    expect(plate).toHaveAttribute('data-lm-device', 'filter')
    const named = () =>
      [...plate.querySelectorAll('[data-lm-param]')].map((knob) =>
        knob.getAttribute('data-lm-param'),
      )
    expect(named()).toEqual(['frequency', 'q'])
    expect(screen.getByRole('slider', { name: 'Freq' }).closest('[data-lm-param]')).toHaveAttribute(
      'data-lm-param',
      'frequency',
    )
    expect(screen.getByTestId('plate-power')).toHaveAttribute('data-lm-power')
    // Opened, every control is named, not only the face.
    fireEvent.click(screen.getByTestId('plate-more'))
    expect(named().sort()).toEqual(['frequency', 'gain', 'q', 'type'])
  })

  it('lists its presets among the tools, or gives the foot to a picker the host draws', async () => {
    const fixture = createTestEngine()
    const device = await make(fixture)
    const { unmount } = render(<DevicePlate device={device} skin={SKIN} data-testid="plate" />, {
      wrapper: fixture.wrapper,
    })
    const list = screen.getByTestId('plate-preset')
    expect(list.closest('.lm-plate__tools')).not.toBeNull()
    expect(screen.getByTestId('plate').querySelector('.lm-plate__presets')).toBeNull()
    fireEvent.change(list, { target: { value: 'Presence peak' } })
    expect(device.getParam('gain')).toBe(4)
    // A preset is every knob: this one names no gain, so the gain goes back to its start.
    fireEvent.change(list, { target: { value: 'Low-pass gentle' } })
    expect(device.getParam('gain')).toBe(0)
    unmount()

    render(
      <DevicePlate
        device={device}
        skin={SKIN}
        presetPicker={<button type="button">Presets of mine</button>}
        onRemove={() => {}}
        data-testid="plate"
      />,
      { wrapper: fixture.wrapper },
    )
    expect(screen.queryByTestId('plate-preset')).toBeNull()
    const picker = screen.getByRole('button', { name: 'Presets of mine' })
    // On the foot itself, in view without the pointer on the plate, and not among the tools that come and go.
    expect(picker.parentElement).toHaveClass('lm-plate__presets')
    expect(picker.closest('.lm-plate__tools')).toBeNull()
    expect(picker.closest('.lm-plate__foot')).toHaveClass('lm-plate__foot--picker')
    // The foot is full beside a picker: the tools stand above it, and the name is on the foot whole.
    const tools = screen.getByTestId('plate-remove').closest('.lm-plate__tools')
    expect(tools).toHaveClass('lm-plate__tools--above')
    expect(tools?.closest('.lm-plate__foot')).toBeNull()
    expect(tools?.nextElementSibling).toHaveClass('lm-plate__foot')
  })

  it('says when the column at its right is its own, so the tools can stand there', async () => {
    const fixture = createTestEngine()
    const device = await make(fixture)
    // Over a picture the tools keep their row, where there is no knob's name to cover.
    const pictured = render(<DevicePlate device={device} skin={SKIN} data-testid="plate" />, {
      wrapper: fixture.wrapper,
    })
    expect(screen.getByTestId('plate')).not.toHaveClass('lm-plate--plain')
    pictured.unmount()

    // Without a picture or a display it has two rows of knobs and a free column beside them.
    const plain: DeviceSkin = { ...SKIN, picture: undefined }
    const bare = render(<DevicePlate device={device} skin={plain} data-testid="plate" />, {
      wrapper: fixture.wrapper,
    })
    expect(screen.getByTestId('plate')).toHaveClass('lm-plate--plain')
    expect(screen.getByTestId('plate')).not.toHaveClass('lm-plate--editor')
    bare.unmount()

    // A plate with a window of its own has two cells in that column, and says so.
    render(<DevicePlate device={await makeHosted(fixture)} skin={plain} data-testid="plate" />, {
      wrapper: fixture.wrapper,
    })
    expect(screen.getByTestId('plate')).toHaveClass('lm-plate--plain', 'lm-plate--editor')
  })

  it('is in hand once a finger presses it, until a press lands anywhere else', async () => {
    const fixture = createTestEngine()
    const device = await make(fixture)
    render(
      <>
        <DevicePlate device={device} skin={SKIN} onRemove={() => {}} data-testid="plate" />
        <button type="button">Elsewhere</button>
      </>,
      { wrapper: fixture.wrapper },
    )
    const plate = screen.getByTestId('plate')
    // A pointer is on the plate while it works there, so a mouse takes nothing in hand.
    fireEvent.pointerDown(screen.getByTestId('plate-remove'), { pointerType: 'mouse' })
    expect(plate).not.toHaveClass('lm-plate--held')
    fireEvent.pointerDown(plate, { pointerType: 'touch' })
    expect(plate).toHaveClass('lm-plate--held')
    // A second press on the plate, on one of its tools, keeps it in hand.
    fireEvent.pointerDown(screen.getByTestId('plate-remove'), { pointerType: 'touch' })
    expect(plate).toHaveClass('lm-plate--held')
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Elsewhere' }), {
      pointerType: 'touch',
    })
    expect(plate).not.toHaveClass('lm-plate--held')
  })

  it('keeps its own preset list away for a picker that draws nothing, and gives it no room', async () => {
    const fixture = createTestEngine()
    const device = await make(fixture)
    const { container } = render(
      <DevicePlate
        device={device}
        skin={SKIN}
        presetPicker={null}
        onRemove={() => {}}
        data-testid="plate"
      />,
      { wrapper: fixture.wrapper },
    )
    expect(screen.queryByTestId('plate-preset')).toBeNull()
    expect(container.querySelector('.lm-plate__presets')).toBeNull()
    expect(container.querySelector('.lm-plate__tools--above')).toBeNull()
    expect(container.querySelector('.lm-plate__foot')).not.toHaveClass('lm-plate__foot--picker')
    expect(screen.getByTestId('plate-remove').parentElement).toHaveClass('lm-plate__tools')
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
    const long = screen.getByTestId('plate-frequency')
    expect(long).toHaveClass('lm-plate__knob--tight')
    // It keeps the size of its neighbours and gives up width: twelve letters in a column of 48.
    expect(Number(long.style.getPropertyValue('--lm-plate-squeeze'))).toBeCloseTo(
      48 / (12 * 5.6),
      3,
    )
    // Two short words take two lines at the usual size.
    const short = screen.getByTestId('plate-q')
    expect(short).not.toHaveClass('lm-plate__knob--tight')
    expect(short.style.getPropertyValue('--lm-plate-squeeze')).toBe('')
  })

  it('sets a word of eight letters closer and no narrower', async () => {
    const fixture = createTestEngine()
    const device = await make(fixture)
    render(
      <DevicePlate
        device={device}
        skin={{ ...SKIN, labels: { frequency: 'Feedback' } }}
        data-testid="plate"
      />,
      { wrapper: fixture.wrapper },
    )
    const knob = screen.getByTestId('plate-frequency')
    expect(knob).toHaveClass('lm-plate__knob--tight')
    expect(knob.style.getPropertyValue('--lm-plate-squeeze')).toBe('')
  })

  it("opens a hosted plug-in's own window from a cell, and has no such cell for any other device", async () => {
    const fixture = createTestEngine()
    const hosted = await makeHosted(fixture, 'parametric-eq')
    const { unmount } = render(
      <DevicePlate device={hosted} skin={hostedSkin(hosted)} data-testid="plate" />,
      { wrapper: fixture.wrapper },
    )
    const heading = screen.getByTestId('plate').getAttribute('aria-label')
    const edit = screen.getByRole('button', { name: `Open ${heading} editor` })
    expect(edit).toBe(screen.getByTestId('plate-editor'))
    expect(edit).toHaveTextContent('Edit')
    expect(edit).toHaveAttribute('data-lm-info')
    // The cell that opens the rest of the knobs stands under it.
    expect(screen.getAllByRole('slider')).toHaveLength(4)
    expect(screen.getByTestId('plate-more')).toHaveClass('lm-plate__more--second')
    expect(screen.getByTestId('plate').querySelector('.lm-plate__picture')).not.toBeNull()
    fireEvent.click(edit)
    expect(hosted.openEditor).toHaveBeenCalledTimes(1)
    expect(hosted.closeEditor).not.toHaveBeenCalled()

    // A plug-in that cannot show its window: the plate stays, and nothing is thrown.
    vi.mocked(hosted.openEditor).mockRejectedValueOnce(new Error('no window'))
    fireEvent.click(edit)
    await act(async () => {
      await Promise.resolve()
    })
    expect(hosted.openEditor).toHaveBeenCalledTimes(2)
    expect(screen.getByTestId('plate-editor')).toBeInTheDocument()
    unmount()

    const plain = await make(fixture, 'parametric-eq')
    render(<DevicePlate device={plain} skin={SKIN} data-testid="plate" />, {
      wrapper: fixture.wrapper,
    })
    expect(screen.queryByRole('button', { name: /editor$/ })).toBeNull()
    expect(screen.queryByTestId('plate-editor')).toBeNull()
    expect(screen.getByTestId('plate-more')).not.toHaveClass('lm-plate__more--second')
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

describe('DevicePlate upright', () => {
  beforeEach(() => {
    // jsdom has no canvas to draw on: the display is given one that takes every call.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => recordingContext().ctx,
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /** A display that draws nothing, in a strip as most of the kit's are. */
  const DISPLAY: PlateDisplay = {
    place: 'strip',
    params: [],
    info: 'What the device does, as it stands.',
    draw: () => {},
  }
  const SHOWN: DeviceSkin = { ...SKIN, picture: undefined, display: DISPLAY }

  it('stands 220 by 300 with a face of eight knobs, the ones its skin chose first', async () => {
    const fixture = createTestEngine()
    const device = await make(fixture, 'parametric-eq')
    const all = Object.keys(device.params)
    expect(all.length).toBeGreaterThan(8)
    // A skin picks four for a flat plate; upright there is room for four more.
    const chosen = [all[5], all[2], all[9], all[0]]
    render(
      <DevicePlate
        device={device}
        skin={{ ...SHOWN, face: chosen, labels: undefined }}
        upright
        data-testid="plate"
      />,
      { wrapper: fixture.wrapper },
    )
    const plate = screen.getByTestId('plate')
    expect(plate).toHaveClass('lm-plate--upright', 'lm-plate--display')
    expect(plate.style.width).toBe('220px')
    expect(plate.style.height).toBe('300px')
    expect(plate.style.getPropertyValue('--lm-plate-rows')).toBe('2')
    expect(plate.style.getPropertyValue('--lm-plate-columns')).toBe('4')
    expect(plate.style.getPropertyValue('--lm-plate-column')).toBe('51px')
    expect(plate.style.getPropertyValue('--lm-plate-knobs-left')).toBe('8px')
    expect(plate.style.getPropertyValue('--lm-plate-knobs-top')).toBe('110px')
    expect(plate.style.getPropertyValue('--lm-plate-row')).toBe('56px')
    const shown = (): (string | undefined)[] =>
      [...plate.querySelectorAll<HTMLElement>('.lm-plate__knob')].map(
        (knob) => knob.dataset.lmParam,
      )
    const others = all.filter((name) => !chosen.includes(name))
    expect(shown()).toEqual([...chosen, ...others.slice(0, 4)])
    // The display has the top, across the plate.
    expect(screen.getByTestId('plate-display').style).toMatchObject({
      left: '8px',
      top: '8px',
      width: '204px',
      height: '100px',
    })
    // The cell counts what the face of eight leaves, and opens the plate by columns.
    const more = screen.getByTestId('plate-more')
    expect(more).toHaveTextContent(`+${all.length - 8}`)
    fireEvent.click(more)
    expect(shown()).toEqual([...chosen, ...others])
    expect(plate.style.height).toBe('300px')
    const columns = Math.ceil(all.length / 2)
    expect(plate.style.getPropertyValue('--lm-plate-columns')).toBe(String(columns))
    expect(plate.style.width).toBe(`${plateLayout(all.length, false, DISPLAY, true).width}px`)
    expect(screen.getByTestId('plate-display').style.width).toBe(
      `${parseInt(plate.style.width, 10) - 16}px`,
    )
  })

  it('lies flat, as it always did, unless it is asked to stand', async () => {
    const fixture = createTestEngine()
    const device = await make(fixture)
    render(<DevicePlate device={device} skin={SHOWN} data-testid="plate" />, {
      wrapper: fixture.wrapper,
    })
    const plate = screen.getByTestId('plate')
    expect(plate).not.toHaveClass('lm-plate--upright')
    expect(plate.style.height).toBe('')
    expect(plate.style.width).toBe('280px')
    expect(plate.style.getPropertyValue('--lm-plate-knobs-top')).toBe('')
    expect(plate.style.getPropertyValue('--lm-plate-row')).toBe('')
    expect(screen.getAllByRole('slider')).toHaveLength(2)
    expect(screen.getByTestId('plate-display').style).toMatchObject({ top: '60px', height: '48px' })
  })

  it('has larger knobs, two abreast, where there are four or fewer', async () => {
    const fixture = createTestEngine()
    const device = await make(fixture)
    const few = render(<DevicePlate device={device} skin={SHOWN} upright data-testid="plate" />, {
      wrapper: fixture.wrapper,
    })
    // The filter has four knobs: all of them are on the face, and no cell opens more.
    expect(screen.getAllByRole('slider')).toHaveLength(4)
    expect(screen.queryByTestId('plate-more')).toBeNull()
    expect(screen.getByTestId('plate').style.getPropertyValue('--lm-plate-columns')).toBe('2')
    expect(screen.getByTestId('plate').style.getPropertyValue('--lm-plate-column')).toBe('102px')
    for (const knob of screen.getAllByRole('slider'))
      expect(knob.querySelector('svg')).toHaveAttribute('width', '36')
    few.unmount()

    render(
      <DevicePlate
        device={await make(fixture, 'parametric-eq')}
        skin={SHOWN}
        upright
        data-testid="plate"
      />,
      { wrapper: fixture.wrapper },
    )
    expect(screen.getAllByRole('slider')).toHaveLength(8)
    for (const knob of screen.getAllByRole('slider'))
      expect(knob.querySelector('svg')).toHaveAttribute('width', '30')
  })

  it("stands the tools and the host's preset picker in rows of their own, off the foot", async () => {
    const fixture = createTestEngine()
    const device = await make(fixture)
    const picked = render(
      <DevicePlate
        device={device}
        skin={SHOWN}
        upright
        presetPicker={<button type="button">Presets of mine</button>}
        actions={<button type="button">Swap</button>}
        onRemove={() => {}}
        data-testid="plate"
      />,
      { wrapper: fixture.wrapper },
    )
    const plate = screen.getByTestId('plate')
    const foot = plate.querySelector('.lm-plate__foot')
    const picker = screen.getByRole('button', { name: 'Presets of mine' })
    expect(picker.parentElement).toHaveClass('lm-plate__presets')
    expect(picker.closest('.lm-plate__foot')).toBeNull()
    expect(picker.closest('.lm-plate__tools')).toBeNull()
    expect(screen.queryByTestId('plate-preset')).toBeNull()
    const tools = screen.getByTestId('plate-remove').closest('.lm-plate__tools')
    expect(tools).toHaveClass('lm-plate__tools--above')
    expect(tools).toContainElement(screen.getByRole('button', { name: 'Swap' }))
    expect(tools?.closest('.lm-plate__foot')).toBeNull()
    // From the top: the tools, the presets, then the foot with the name and the lamp alone.
    expect(tools?.nextElementSibling).toBe(picker.parentElement)
    expect(picker.parentElement?.nextElementSibling).toBe(foot)
    expect(foot).toContainElement(screen.getByRole('heading', { name: 'Sweep' }))
    expect(foot).toContainElement(screen.getByTestId('plate-power'))
    expect(foot?.children).toHaveLength(2)
    picked.unmount()

    // With no picker of the host's the kit's own list is among the tools, in their row, and no row is kept for presets.
    render(<DevicePlate device={device} skin={SHOWN} upright data-testid="plate" />, {
      wrapper: fixture.wrapper,
    })
    const list = screen.getByTestId('plate-preset')
    expect(list.closest('.lm-plate__tools')).toHaveClass('lm-plate__tools--above')
    expect(list.closest('.lm-plate__foot')).toBeNull()
    expect(screen.getByTestId('plate').querySelector('.lm-plate__presets')).toBeNull()
  })

  it('stands a plate with a picture and one with neither, each with its own rows', async () => {
    const fixture = createTestEngine()
    const device = await make(fixture, 'parametric-eq')
    const pictured = render(
      <DevicePlate device={device} skin={SKIN} upright data-testid="plate" />,
      {
        wrapper: fixture.wrapper,
      },
    )
    // A picture has the top as a display has: eight knobs in two rows under it.
    expect(screen.getByTestId('plate')).toHaveClass('lm-plate--upright', 'lm-plate--pictured')
    expect(screen.getByTestId('plate').querySelector('.lm-plate__picture')).not.toBeNull()
    expect(screen.getAllByRole('slider')).toHaveLength(8)
    expect(screen.getByTestId('plate').style.getPropertyValue('--lm-plate-knobs-top')).toBe('110px')
    pictured.unmount()

    // With neither the knobs start at the top: sixteen in four rows of four, closer together.
    render(<DevicePlate device={device} skin={QUIET_SKIN} upright data-testid="plate" />, {
      wrapper: fixture.wrapper,
    })
    const plate = screen.getByTestId('plate')
    expect(plate).toHaveClass('lm-plate--upright', 'lm-plate--plain')
    const all = Object.keys(device.params)
    expect(screen.getAllByRole('slider')).toHaveLength(Math.min(16, all.length))
    expect(plate.style.width).toBe('220px')
    expect(plate.style.height).toBe('300px')
    expect(plate.style.getPropertyValue('--lm-plate-rows')).toBe('4')
    expect(plate.style.getPropertyValue('--lm-plate-knobs-top')).toBe('8px')
    expect(plate.style.getPropertyValue('--lm-plate-row')).toBe('50px')
    for (const knob of screen.getAllByRole('slider'))
      expect(knob.querySelector('svg')).toHaveAttribute('width', '30')
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

  it('draws a hosted plug-in as a plate too, with the cell that opens its window', async () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const hosted = await makeHosted(fixture)
    const gone = new MissingNativeDevice(fixture.engine.context, 'plugin:gone')
    pad.strip.addInsert(hosted)
    pad.strip.addInsert(gone)
    render(<DeviceChainView strip={pad} skin={deviceSkin} data-testid="chain" />, {
      wrapper: fixture.wrapper,
    })
    const plate = screen.getByTestId('chain-device-0')
    expect(plate).toHaveClass('lm-plate')
    expect(plate.style.getPropertyValue('--lm-plate')).toBe(hostedSkin(hosted).plate)
    fireEvent.click(screen.getByTestId('chain-device-0-editor'))
    expect(hosted.openEditor).toHaveBeenCalledTimes(1)
    // A plug-in that is missing keeps the panel, which says why.
    expect(screen.getByTestId('chain-device-1')).toHaveClass('lm-device')
  })

  it('hands each device and its place to the host for a preset picker, on a plate and on a panel', async () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const trim = await make(fixture, 'utility')
    const filter = await make(fixture)
    const delay = await make(fixture, 'delay')
    for (const device of [trim, filter, delay]) pad.strip.addInsert(device)
    render(
      <DeviceChainView
        strip={pad}
        pinned={1}
        skin={(device) => (device.id === 'filter' ? SKIN : null)}
        presetPicker={(device, index) => (
          <button type="button" data-testid={`mine-${index}`}>
            {device.id}
          </button>
        )}
        data-testid="chain"
      />,
      { wrapper: fixture.wrapper },
    )
    // The place counts the devices shown, past what is pinned.
    expect(screen.getByTestId('mine-0')).toHaveTextContent('filter')
    expect(screen.getByTestId('mine-1')).toHaveTextContent('delay')
    expect(screen.getByTestId('chain-device-0')).toContainElement(screen.getByTestId('mine-0'))
    expect(screen.getByTestId('chain-device-1')).toContainElement(screen.getByTestId('mine-1'))
    expect(screen.queryByRole('combobox', { name: /preset$/ })).toBeNull()
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

  it('stands its plates upright when asked, and leaves a panel as it is', async () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    pad.strip.addInsert(await make(fixture))
    pad.strip.addInsert(await make(fixture, 'delay'))
    const skin = (device: Device): DeviceSkin | null => (device.id === 'filter' ? SKIN : null)
    const flat = render(<DeviceChainView strip={pad} skin={skin} data-testid="chain" />, {
      wrapper: fixture.wrapper,
    })
    expect(screen.getByTestId('chain-device-0')).not.toHaveClass('lm-plate--upright')
    expect(screen.getByTestId('chain-device-0').style.height).toBe('')
    flat.unmount()

    render(<DeviceChainView strip={pad} skin={skin} upright data-testid="chain" />, {
      wrapper: fixture.wrapper,
    })
    const plate = screen.getByTestId('chain-device-0')
    expect(plate).toHaveClass('lm-plate', 'lm-plate--upright')
    expect(plate.style.width).toBe('220px')
    expect(plate.style.height).toBe('300px')
    // The chain's own tools are in the row above the presets, as on any upright plate.
    expect(screen.getByTestId('chain-later-0').closest('.lm-plate__tools')).toHaveClass(
      'lm-plate__tools--above',
    )
    const panel = screen.getByTestId('chain-device-1')
    expect(panel).toHaveClass('lm-device')
    expect(panel).not.toHaveClass('lm-plate--upright')
  })
})
