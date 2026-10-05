// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useRef, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DeviceChainView } from '../components/DeviceChainView'
import { DeviceFrame, DevicePanel } from '../components/DevicePanel'
import { Fader } from '../components/Fader'
import {
  controlGestureInfo,
  findInfo,
  infoName,
  infoParagraphs,
  infoProps,
  infoText,
  resolveInfo,
} from '../components/info'
import { INFO_IDLE, InfoView, useInfo } from '../components/InfoView'
import { Knob } from '../components/Knob'
import { Meter } from '../components/Meter'
import { paramInfo } from '../components/param-info'
import { DeviceToggle, ToggleButton } from '../components/Toggle'
import { createTestEngine } from './harness'

afterEach(cleanup)

const SILENT = {
  peak: 0,
  rms: 0,
  peakDb: -Infinity,
  lufs: null,
  lufsShortTerm: -Infinity,
  truePeakDb: -Infinity,
  hasMeter: false,
  hasLufs: false,
}

describe('resolveInfo', () => {
  it('reads the entry off the control, with the title it was given', () => {
    render(
      <button type="button" {...infoProps('Loop', 'Plays the loop again when it ends.')}>
        L
      </button>,
    )
    expect(resolveInfo(screen.getByRole('button'))).toEqual({
      title: 'Loop',
      text: 'Plays the loop again when it ends.',
    })
  })

  it('names a control by its label or its text when no title is given', () => {
    render(
      <>
        <button type="button" aria-label="Undo" {...infoProps(null, 'Takes back the last change.')}>
          ↶
        </button>
        <button type="button" {...infoProps(null, 'Does it again.')}>
          Redo
        </button>
      </>,
    )
    expect(resolveInfo(screen.getByRole('button', { name: 'Undo' }))?.title).toBe('Undo')
    expect(resolveInfo(screen.getByRole('button', { name: 'Redo' }))?.title).toBe('Redo')
  })

  it('takes the nearest entry: a part inside a described control is described by it', () => {
    render(
      <section {...infoProps('Reverb', 'A room around the sound.')}>
        <h3>Reverb</h3>
        <button type="button" {...infoProps('Freeze', 'Holds the tail.')}>
          <span data-testid="glyph">❄</span>
        </button>
      </section>,
    )
    expect(resolveInfo(screen.getByTestId('glyph'))?.title).toBe('Freeze')
    expect(resolveInfo(screen.getByRole('heading'))?.title).toBe('Reverb')
  })

  it('falls back to a control’s tooltip, and to its name alone when it has none', () => {
    render(
      <>
        <button type="button" title="Start over from the top">
          Rewind
        </button>
        <button type="button">Plain</button>
        <span title="not a control">text</span>
      </>,
    )
    expect(resolveInfo(screen.getByRole('button', { name: 'Rewind' }))).toEqual({
      title: 'Rewind',
      text: 'Start over from the top',
    })
    expect(resolveInfo(screen.getByRole('button', { name: 'Plain' }))).toEqual({
      title: 'Plain',
      text: '',
    })
    expect(resolveInfo(screen.getByText('text'))).toBeNull()
  })

  it('describes a field by the label around it, under the field’s own name', () => {
    render(
      <label {...infoProps(null, 'How long the stroke takes to come in.')}>
        <span>Fade in</span>
        <input type="number" defaultValue={1} />
      </label>,
    )
    const found = findInfo(screen.getByRole('spinbutton'))
    expect(found?.entry).toEqual({
      title: 'Fade in',
      text: 'How long the stroke takes to come in.',
    })
    expect(found?.source.tagName).toBe('LABEL')
  })

  it('stops at an empty entry and at the root', () => {
    render(
      <div {...infoProps('Outer', 'Outside.')}>
        <div data-testid="root">
          <div data-lm-info="">
            <span data-testid="quiet">quiet</span>
          </div>
          <span data-testid="inside">inside</span>
        </div>
      </div>,
    )
    expect(resolveInfo(screen.getByTestId('quiet'))).toBeNull()
    expect(resolveInfo(screen.getByTestId('inside'), screen.getByTestId('root'))).toBeNull()
    expect(resolveInfo(screen.getByTestId('inside'))?.title).toBe('Outer')
    expect(resolveInfo(null)).toBeNull()
  })

  it('takes a short text as a name and leaves a long one', () => {
    render(
      <>
        <button type="button"> Save now </button>
        <div data-testid="long">{'word '.repeat(30)}</div>
      </>,
    )
    expect(infoName(screen.getByRole('button'))).toBe('Save now')
    expect(infoName(screen.getByTestId('long'))).toBe('')
  })

  it('joins and splits paragraphs', () => {
    expect(infoText('One.', null, false, '', 'Two.')).toBe('One.\nTwo.')
    expect(infoParagraphs('One.\n\n Two. \n')).toEqual(['One.', 'Two.'])
  })
})

describe('the kit’s own controls', () => {
  it('a knob says what it does and then how it is worked', () => {
    render(
      <Knob
        label="Rate"
        defaultValue={0.8}
        min={0.01}
        max={10}
        unit="Hz"
        info="How fast the movement goes round."
      />,
    )
    const entry = resolveInfo(screen.getByRole('slider'))
    expect(entry?.title).toBe('Rate')
    expect(infoParagraphs(entry?.text ?? '')).toEqual([
      'How fast the movement goes round.',
      'Drag up or down, or scroll over it. Hold Shift for fine steps. Double-click returns it to 0.8 Hz.',
    ])
    // The label and the value belong to the knob too.
    expect(resolveInfo(screen.getByText('Rate'))?.title).toBe('Rate')
  })

  it('a knob with nothing said about it still says how it is worked; a disabled one does not', () => {
    const { rerender } = render(<Knob label="Mix" defaultValue={0.5} min={0} max={1} />)
    expect(resolveInfo(screen.getByRole('slider'))?.text).toBe(
      controlGestureInfo({ reset: '0.50' }),
    )
    rerender(<Knob label="Mix" defaultValue={0.5} min={0} max={1} disabled info="Wet and dry." />)
    expect(resolveInfo(screen.getByRole('slider'))?.text).toBe('Wet and dry.')
  })

  it('a fader names the way it is dragged and what a double-click sets', () => {
    render(
      <Fader
        label="Send"
        orientation="horizontal"
        defaultValue={0}
        min={-60}
        max={6}
        unit="dB"
        wheel={false}
        resetValue={-12}
        info="How much goes to the hall."
      />,
    )
    expect(infoParagraphs(resolveInfo(screen.getByRole('slider'))?.text ?? '')[1]).toBe(
      'Drag left or right. Hold Shift for fine steps. Double-click returns it to -12.0 dB.',
    )
  })

  it('a power switch, a toggle and a meter have entries', () => {
    render(
      <>
        <DeviceToggle pressed label="Reverb power" onPressedChange={() => {}} />
        <ToggleButton pressed={false} label="Mute" info="Silences it." onPressedChange={() => {}}>
          M
        </ToggleButton>
        <Meter reading={SILENT} label="Output" bars={['peak']} />
      </>,
    )
    expect(resolveInfo(screen.getByRole('switch'))?.title).toBe('Reverb power')
    expect(resolveInfo(screen.getByRole('switch'))?.text).toMatch(/passes through unchanged/)
    expect(resolveInfo(screen.getByRole('button', { name: 'Mute' }))).toEqual({
      title: 'Mute',
      text: 'Silences it.',
    })
    const meter = resolveInfo(screen.getByRole('meter'))
    expect(meter?.title).toBe('Output')
    expect(meter?.text).toMatch(/^How loud the signal is here\. The bar shows the peak/)
  })

  it('a device frame is described where no control of its own is', () => {
    render(
      <DeviceFrame title="Play" info="Latch and scale lock.">
        <button type="button" {...infoProps('Latch', 'Holds the keys.')}>
          Latch
        </button>
      </DeviceFrame>,
    )
    expect(resolveInfo(screen.getByRole('heading', { name: 'Play' }))).toEqual({
      title: 'Play',
      text: 'Latch and scale lock.',
    })
    expect(resolveInfo(screen.getByRole('button'))?.title).toBe('Latch')
  })

  it('a generated panel describes the device, its knobs and its buttons', async () => {
    const fixture = createTestEngine()
    const device = await fixture.engine.devices.create('delay', fixture.engine.context)
    const descriptor = fixture.engine.devices.describe('delay')
    render(<DevicePanel device={device} onRemove={() => {}} data-testid="delay" />, {
      wrapper: fixture.wrapper,
    })
    const heading = screen.getByRole('heading')
    expect(resolveInfo(heading)).toEqual({
      title: heading.textContent,
      text: descriptor?.description ?? `${heading.textContent}: one of the devices of this chain.`,
    })
    for (const slider of screen.getAllByRole('slider')) {
      const entry = resolveInfo(slider)
      expect(entry?.title).toBe(slider.getAttribute('aria-label'))
      // What it does, then how it is worked.
      expect(infoParagraphs(entry?.text ?? '')).toHaveLength(2)
    }
    expect(resolveInfo(screen.getByTestId('delay-remove'))?.title).toBe('Remove')
    expect(resolveInfo(screen.getByRole('switch'))?.text).toMatch(/^Turns .+ off and on\./)
  })

  it('a chain describes its handle, its move buttons and its picker', async () => {
    const fixture = createTestEngine()
    const track = fixture.engine.addAudioTrack('pad')
    track.strip.addInsert(await fixture.engine.devices.create('filter', fixture.engine.context))
    const { container } = render(<DeviceChainView strip={track} data-testid="chain" />, {
      wrapper: fixture.wrapper,
    })
    expect(resolveInfo(screen.getByTestId('chain-earlier-0'))?.title).toBe('Move earlier')
    expect(resolveInfo(screen.getByTestId('chain-later-0'))?.title).toBe('Move later')
    expect(resolveInfo(screen.getByTestId('chain-add'))?.title).toBe('Add device')
    expect(resolveInfo(container.querySelector('.lm-chain__handle'))?.title).toBe('Reorder')
  })

  it('a parameter is described by its device, else by what its name always means', () => {
    const spec = { id: 0, name: 'Mix', min: 0, max: 1, default: 0.5, taper: 'linear', unit: '' }
    expect(paramInfo({ ...spec, taper: 'linear' })).toMatch(/untouched sound/)
    expect(paramInfo({ ...spec, taper: 'linear', description: 'Its own words.' })).toBe(
      'Its own words.',
    )
    expect(paramInfo({ ...spec, taper: 'linear', name: 'Shape' })).toBeUndefined()
  })
})

describe('InfoView', () => {
  function Page() {
    const root = useRef<HTMLDivElement>(null)
    const [on, setOn] = useState(false)
    const [extra, setExtra] = useState(true)
    return (
      <div ref={root} data-testid="page">
        <button
          type="button"
          onClick={() => setOn(!on)}
          {...infoProps('Loop', on ? 'The loop is on.' : 'The loop is off.')}
        >
          Loop
        </button>
        {extra ? (
          <button
            type="button"
            onClick={() => setExtra(false)}
            {...infoProps('Close', 'Goes away.')}
          >
            Close
          </button>
        ) : null}
        <p data-testid="bare">nothing here</p>
        <InfoView root={root} data-testid="info" />
      </div>
    )
  }

  const title = (): string | null => screen.getByTestId('info-title').textContent
  const text = (): string | null => screen.getByTestId('info-text').textContent

  it('says what the pointer is over, and its idle line over nothing', () => {
    render(<Page />)
    expect(title()).toBe(INFO_IDLE.title)
    expect(text()).toBe(INFO_IDLE.text)
    fireEvent.pointerOver(screen.getByRole('button', { name: 'Loop' }))
    expect(title()).toBe('Loop')
    expect(text()).toBe('The loop is off.')
    fireEvent.pointerOver(screen.getByTestId('bare'))
    expect(title()).toBe(INFO_IDLE.title)
    expect(screen.getByTestId('info')).toHaveClass('lm-info--idle')
  })

  it('follows the keyboard focus and forgets when the pointer leaves', () => {
    render(<Page />)
    fireEvent.focusIn(screen.getByRole('button', { name: 'Close' }))
    expect(title()).toBe('Close')
    fireEvent.pointerLeave(screen.getByTestId('page'))
    expect(title()).toBe(INFO_IDLE.title)
  })

  it('reads a control again when a press changes what it says or takes it away', async () => {
    vi.useFakeTimers()
    try {
      render(<Page />)
      const loop = screen.getByRole('button', { name: 'Loop' })
      fireEvent.pointerOver(loop)
      fireEvent.click(loop)
      await act(async () => {
        await vi.runAllTimersAsync()
      })
      expect(text()).toBe('The loop is on.')
      const close = screen.getByRole('button', { name: 'Close' })
      fireEvent.pointerOver(close)
      expect(title()).toBe('Close')
      fireEvent.click(close)
      await act(async () => {
        await vi.runAllTimersAsync()
      })
      expect(title()).toBe(INFO_IDLE.title)
    } finally {
      vi.useRealTimers()
    }
  })

  it('forgets a control that is taken away with no press on it', async () => {
    // What the agent erases, or a button somewhere else takes away, goes with
    // no click and no key inside the part that is described.
    function Erased() {
      const root = useRef<HTMLDivElement>(null)
      const [there, setThere] = useState(true)
      return (
        <>
          <div ref={root}>
            {there ? (
              <button type="button" {...infoProps('Reverb', 'A room.')}>
                Reverb
              </button>
            ) : null}
          </div>
          <button type="button" onClick={() => setThere(false)}>
            Erase
          </button>
          <InfoView root={root} data-testid="info" />
        </>
      )
    }
    vi.useFakeTimers()
    try {
      render(<Erased />)
      fireEvent.focusIn(screen.getByRole('button', { name: 'Reverb' }))
      expect(title()).toBe('Reverb')
      fireEvent.click(screen.getByRole('button', { name: 'Erase' }))
      await act(async () => {
        await vi.runAllTimersAsync()
      })
      expect(screen.queryByRole('button', { name: 'Reverb' })).toBeNull()
      expect(title()).toBe(INFO_IDLE.title)
    } finally {
      vi.useRealTimers()
    }
  })

  it('forgets a control whose whole root is taken away and mounted again', async () => {
    function Remounted() {
      const root = useRef<HTMLDivElement>(null)
      const [turn, setTurn] = useState(0)
      return (
        <>
          <div ref={root} key={turn}>
            <button type="button" {...infoProps('Reverb', 'A room.')}>
              Reverb
            </button>
          </div>
          <button type="button" onClick={() => setTurn(turn + 1)}>
            Again
          </button>
          <InfoView root={root} data-testid="info" />
        </>
      )
    }
    vi.useFakeTimers()
    try {
      render(<Remounted />)
      const first = screen.getByRole('button', { name: 'Reverb' })
      fireEvent.focusIn(first)
      expect(title()).toBe('Reverb')
      fireEvent.click(screen.getByRole('button', { name: 'Again' }))
      await act(async () => {
        await vi.runAllTimersAsync()
      })
      expect(first.isConnected).toBe(false)
      expect(title()).toBe(INFO_IDLE.title)
      // The root that took its place is followed.
      fireEvent.pointerOver(screen.getByRole('button', { name: 'Reverb' }))
      expect(title()).toBe('Reverb')
    } finally {
      vi.useRealTimers()
    }
  })

  it('follows a root that is mounted after it', async () => {
    function Late() {
      const root = useRef<HTMLDivElement>(null)
      const [shown, setShown] = useState(false)
      return (
        <>
          <InfoView root={root} data-testid="info" />
          <button type="button" onClick={() => setShown(true)}>
            Show
          </button>
          {shown ? (
            <div ref={root}>
              <button type="button" {...infoProps('Loop', 'The loop is off.')}>
                Loop
              </button>
            </div>
          ) : null}
        </>
      )
    }
    render(<Late />)
    fireEvent.click(screen.getByRole('button', { name: 'Show' }))
    // The root is found as the page changes.
    await act(async () => {})
    fireEvent.pointerOver(screen.getByRole('button', { name: 'Loop' }))
    expect(title()).toBe('Loop')
  })

  it('draws an entry it is handed, with its paragraphs and actions', () => {
    render(
      <InfoView
        entry={{ title: 'Rate', text: 'How fast.\nDrag up or down.' }}
        actions={<button type="button">Hide</button>}
        data-testid="info"
      />,
    )
    expect(title()).toBe('Rate')
    expect(screen.getByTestId('info-text').querySelectorAll('p')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Hide' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Info' })).not.toHaveClass('lm-info--idle')
  })

  it('stops following while it is disabled', () => {
    function Probe({ disabled }: { disabled: boolean }) {
      const entry = useInfo({ disabled })
      return (
        <>
          <button type="button" {...infoProps('Loop', 'Loops.')}>
            Loop
          </button>
          <output>{entry?.title ?? 'none'}</output>
        </>
      )
    }
    const { rerender } = render(<Probe disabled={false} />)
    fireEvent.pointerOver(screen.getByRole('button'))
    expect(screen.getByRole('status')).toHaveTextContent('Loop')
    rerender(<Probe disabled />)
    expect(screen.getByRole('status')).toHaveTextContent('none')
    fireEvent.pointerOver(screen.getByRole('button'))
    expect(screen.getByRole('status')).toHaveTextContent('none')
  })
})
