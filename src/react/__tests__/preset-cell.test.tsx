// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { type Preset } from '../../core/devices/presets'
import { type ParamSpec } from '../../core/params'
import { DevicePresetCell, PresetCell, presetLabel } from '../components/PresetCell'
import { createTestEngine } from './harness'

afterEach(cleanup)

const spec = (min: number, max: number, def: number): ParamSpec => ({
  id: 0,
  name: '',
  min,
  max,
  default: def,
  taper: 'linear',
  unit: '',
})
const SPECS = { threshold: spec(-60, 0, -24), ratio: spec(1, 20, 4), makeupDb: spec(0, 24, 0) }
const START = { threshold: -24, ratio: 4, makeupDb: 0 }
const preset = (name: string, params: Record<string, number>): Preset => ({
  name,
  deviceId: 'compressor',
  deviceVersion: 1,
  params,
})
const GENTLE = preset('Voice, gentle', { threshold: -18, ratio: 2 })
const EVEN = preset('Voice, even', { threshold: -22, ratio: 3, makeupDb: 2 })
const BROADCAST = preset('Voice, broadcast', { threshold: -26, ratio: 4, makeupDb: 4 })
const PRESETS = [GENTLE, EVEN, BROADCAST]

describe('presetLabel', () => {
  it('names the preset the values are on, the start, or none', () => {
    expect(presetLabel(PRESETS, { threshold: -22, ratio: 3, makeupDb: 2 }, SPECS).label).toBe(
      'Voice, even',
    )
    expect(presetLabel(PRESETS, START, SPECS)).toEqual({ on: null, label: 'Default' })
    expect(presetLabel(PRESETS, { ...START, ratio: 9 }, SPECS)).toEqual({
      on: null,
      label: 'No preset',
    })
  })

  it('names a preset the device no longer lists while the values are still on it', () => {
    const retired = [preset('Voice, soft', { threshold: -12 })]
    expect(presetLabel(PRESETS, { ...START, threshold: -12 }, SPECS, { retired }).label).toBe(
      'Voice, soft',
    )
  })
})

/** The cell over values a test keeps, as an app keeps them in its own document. */
function Held({
  start,
  onPick,
}: {
  start: Record<string, number>
  onPick: (preset: Preset) => void
}) {
  const [values, setValues] = useState(start)
  return (
    <>
      <PresetCell
        name="Compressor"
        presets={PRESETS}
        values={values}
        specs={SPECS}
        onPick={(picked) => {
          onPick(picked)
          setValues({ ...START, ...picked.params })
        }}
        cellProps={(cell) => (cell === 'name' ? { 'data-action': 'apply_preset' } : undefined)}
        data-testid="fxp"
      />
      <button type="button" onClick={() => setValues((was) => ({ ...was, ratio: 9 }))}>
        turn a knob
      </button>
    </>
  )
}

describe('PresetCell', () => {
  it('is nothing for an effect with no presets', () => {
    const { container } = render(
      <PresetCell name="Delay" presets={[]} values={{}} specs={{}} onPick={() => {}} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('says which preset the settings match, and none once a knob is turned', () => {
    render(<Held start={{ threshold: -18, ratio: 2, makeupDb: 0 }} onPick={() => {}} />)
    const name = screen.getByTestId('fxp-name')
    expect(name).toHaveTextContent('Voice, gentle')
    expect(name).toHaveAccessibleName('Compressor preset: Voice, gentle')
    expect(name).toHaveAttribute('data-action', 'apply_preset')
    fireEvent.click(screen.getByRole('button', { name: 'turn a knob' }))
    expect(name).toHaveTextContent('No preset')
  })

  it('gives any other data attribute to its three cells and to every row of the list', () => {
    render(
      <PresetCell
        name="Compressor"
        presets={PRESETS}
        values={START}
        specs={SPECS}
        onPick={() => {}}
        cellProps={(cell) => (cell === 'next' ? { 'data-step': 'on' } : undefined)}
        data-action="apply_preset"
        data-testid="fxp"
      />,
    )
    for (const part of ['name', 'previous', 'next']) {
      expect(screen.getByTestId(`fxp-${part}`)).toHaveAttribute('data-action', 'apply_preset')
    }
    expect(screen.getByTestId('fxp-next')).toHaveAttribute('data-step', 'on')
    expect(screen.getByTestId('fxp')).not.toHaveAttribute('data-action')
    fireEvent.click(screen.getByTestId('fxp-name'))
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(PRESETS.length)
    for (const row of options) expect(row).toHaveAttribute('data-action', 'apply_preset')
    // The button at the foot of the list loads the preset: it is marked as the cells are.
    expect(screen.getByTestId('fxp-picker-action')).toHaveAttribute('data-action', 'apply_preset')
    // The name says which dialog it opened, while it is open.
    expect(screen.getByTestId('fxp-name')).toHaveAttribute(
      'aria-controls',
      screen.getByRole('dialog').id,
    )
  })

  it('steps to the next and the one before, round the ends, without opening the list', () => {
    const onPick = vi.fn()
    render(<Held start={START} onPick={onPick} />)
    expect(screen.getByTestId('fxp-name')).toHaveTextContent('Default')
    fireEvent.click(screen.getByRole('button', { name: 'Next preset of Compressor' }))
    expect(onPick).toHaveBeenLastCalledWith(GENTLE)
    expect(screen.getByTestId('fxp-name')).toHaveTextContent('Voice, gentle')
    fireEvent.click(screen.getByRole('button', { name: 'Previous preset of Compressor' }))
    expect(onPick).toHaveBeenLastCalledWith(BROADCAST)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('opens the list on the preset that is on, and a pick from it is one call', () => {
    const onPick = vi.fn()
    render(<Held start={{ threshold: -22, ratio: 3, makeupDb: 2 }} onPick={onPick} />)
    fireEvent.click(screen.getByTestId('fxp-name'))
    expect(screen.getByRole('dialog', { name: 'Presets of Compressor' })).toBeInTheDocument()
    expect(screen.getByTestId('fxp')).toHaveAttribute('data-open', 'true')
    expect(screen.getByRole('option', { selected: true })).toHaveTextContent('Voice, even')
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' })
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' })
    expect(onPick).toHaveBeenCalledTimes(1)
    expect(onPick).toHaveBeenCalledWith(BROADCAST)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByTestId('fxp-name')).toHaveTextContent('Voice, broadcast')
  })

  it('of two presets that put the knobs in one place, names the one picked last', () => {
    const twin = preset('Voice, even again', { threshold: -22, ratio: 3, makeupDb: 2 })
    function Twins() {
      const [values, setValues] = useState<Record<string, number>>(START)
      return (
        <PresetCell
          name="Compressor"
          presets={[EVEN, twin]}
          values={values}
          specs={SPECS}
          onPick={(picked) => setValues({ ...START, ...picked.params })}
          data-testid="fxp"
        />
      )
    }
    render(<Twins />)
    fireEvent.click(screen.getByRole('button', { name: 'Previous preset of Compressor' }))
    expect(screen.getByTestId('fxp-name')).toHaveTextContent('Voice, even again')
  })
})

describe('DevicePresetCell', () => {
  const VIDEO = [
    preset('Voice, gentle', { threshold: -18, knee: 12, ratio: 2, attack: 0.02, release: 0.3 }),
    preset('Voice, even', { threshold: -22, ratio: 3, makeupDb: 2 }),
  ]

  it('lists an app’s presets before the device’s own, under the app’s heads', async () => {
    const fixture = createTestEngine()
    const device = await fixture.engine.devices.create('compressor', fixture.engine.context)
    render(
      <DevicePresetCell
        device={device}
        presets={VIDEO}
        groupOf={(one) => (VIDEO.includes(one) ? 'For video' : 'Compressor')}
        data-testid="fxp"
      />,
      { wrapper: fixture.wrapper },
    )
    expect(screen.getByTestId('fxp-name')).toHaveAccessibleName('Compressor preset: Default')
    fireEvent.click(screen.getByTestId('fxp-name'))
    expect(screen.getAllByRole('option').map((row) => row.textContent)).toEqual([
      'Voice, gentle',
      'Voice, even',
      'Gentle',
      'Voice',
      'Glue',
      'Limit',
    ])
    expect(
      [...document.querySelectorAll('.lm-picker__group-name')].map((head) => head.textContent),
    ).toEqual(['For video', 'Compressor'])
  })

  it('lists the app’s preset alone where one of the device’s has its name', async () => {
    const fixture = createTestEngine()
    const device = await fixture.engine.devices.create('compressor', fixture.engine.context)
    const mine = [
      preset('Glue', { threshold: -30, ratio: 2 }),
      preset('Voice, even', { threshold: -22, ratio: 3, makeupDb: 2 }),
    ]
    render(<DevicePresetCell device={device} presets={mine} data-testid="fxp" />, {
      wrapper: fixture.wrapper,
    })
    fireEvent.click(screen.getByTestId('fxp-name'))
    expect(screen.getAllByRole('option').map((row) => row.textContent)).toEqual([
      'Glue',
      'Voice, even',
      'Gentle',
      'Voice',
      'Limit',
    ])
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' })
    // The one loaded is the app's: its threshold, not the device's own Glue.
    expect(device.getParam('threshold')).toBe(-30)
    expect(screen.getByTestId('fxp-name')).toHaveTextContent('Glue')
    // And the steps go round every name once.
    const names: string[] = []
    for (let step = 0; step < 5; step += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Next preset of Compressor' }))
      names.push(screen.getByTestId('fxp-name').textContent ?? '')
    }
    expect(names).toEqual(['Voice, even', 'Gentle', 'Voice', 'Limit', 'Glue'])
  })

  it('offers only the app’s presets when told to', async () => {
    const fixture = createTestEngine()
    const device = await fixture.engine.devices.create('compressor', fixture.engine.context)
    render(<DevicePresetCell device={device} presets={VIDEO} ownOnly data-testid="fxp" />, {
      wrapper: fixture.wrapper,
    })
    fireEvent.click(screen.getByTestId('fxp-name'))
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })

  it('puts the device on a pick: what the preset names, and the rest where the device starts it', async () => {
    const fixture = createTestEngine()
    const device = await fixture.engine.devices.create('compressor', fixture.engine.context)
    act(() => device.setParam('knee', 3))
    render(<DevicePresetCell device={device} presets={VIDEO} data-testid="fxp" />, {
      wrapper: fixture.wrapper,
    })
    expect(screen.getByTestId('fxp-name')).toHaveTextContent('No preset')
    fireEvent.click(screen.getByRole('button', { name: 'Next preset of Compressor' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next preset of Compressor' }))
    expect(screen.getByTestId('fxp-name')).toHaveTextContent('Voice, even')
    expect(device.getParam('threshold')).toBe(-22)
    expect(device.getParam('makeupDb')).toBe(2)
    // "Voice, even" leaves the knee alone, so it is back where a compressor starts.
    expect(device.getParam('knee')).toBe(device.params.knee.default)
  })

  it('hands a pick to a host that takes the writes as one write of every parameter', async () => {
    const fixture = createTestEngine()
    const device = await fixture.engine.devices.create('compressor', fixture.engine.context)
    const set = vi.fn()
    render(
      <DevicePresetCell
        device={device}
        presets={VIDEO}
        writes={{ set, setBypass: () => {} }}
        data-testid="fxp"
      />,
      { wrapper: fixture.wrapper },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Next preset of Compressor' }))
    expect(set).toHaveBeenCalledTimes(1)
    const written = set.mock.calls[0][0] as Record<string, number>
    expect(Object.keys(written).sort()).toEqual(Object.keys(device.params).sort())
    expect(written.threshold).toBe(-18)
    expect(written.makeupDb).toBe(device.params.makeupDb.default)
    // The host has written nothing yet, so the device and the cell are where they were.
    expect(device.getParam('threshold')).toBe(device.params.threshold.default)
    expect(screen.getByTestId('fxp-name')).toHaveTextContent('Default')
    // Once the host writes it, the cell names the preset.
    act(() => {
      for (const [name, value] of Object.entries(written)) device.setParam(name, value)
    })
    expect(screen.getByTestId('fxp-name')).toHaveTextContent('Voice, gentle')
  })
})
