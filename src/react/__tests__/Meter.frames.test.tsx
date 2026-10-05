// @vitest-environment jsdom
// A meter on a source draws its own frames. These tests hold it against the
// meter it replaced, `useMeter` state rendered by React, on the same frames
// and the same clock: the two documents must read the same after every one.
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { Profiler, StrictMode, type ReactNode } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { silentReading, type MeterReading } from '../../core/analysis/loudness'
import { Meter as AnalyserMeter } from '../../core/analysis/Meter'
import { dbToGain } from '../../core/devices/native/units'
import { asAudioContext, type MockAudioWorkletNode } from '../../testing'
import { Meter, type MeterLook, type MeterOrientation, type MeterProps } from '../components/Meter'
import { useMeter } from '../hooks/useMeter'
import { createTestEngine, type TestEngine } from './harness'

/** The meter on a source as it was: every sampled reading is React state, drawn by a render. */
function RenderedMeter({ source, fps, active, ...rest }: MeterProps) {
  const reading = useMeter(source, { fps, active })
  return <Meter {...rest} reading={reading} />
}

let clock = 0

beforeEach(() => {
  clock = 1000
  vi.spyOn(performance, 'now').mockImplementation(() => clock)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

async function installLufs(fixture: TestEngine): Promise<MockAudioWorkletNode> {
  await fixture.engine.master.installLufsMeter({
    processorUrl: 'meter.js',
    createNode: (_context, name, options) =>
      fixture.ctx.createWorkletNode(name, options) as unknown as AudioWorkletNode,
  })
  return fixture.ctx.workletNodes[fixture.ctx.workletNodes.length - 1]
}

function loudness(shortTerm: number, truePeak: number): MeterReading {
  return {
    ...silentReading(),
    shortTerm,
    momentary: shortTerm,
    truePeak: [truePeak, truePeak],
    samplePeak: [truePeak * 0.9, truePeak * 0.9],
    maxTruePeak: truePeak,
  }
}

/** The two meters side by side on one engine, one set of frames and one clock. */
function mountPair(props: MeterProps, wrap?: (meter: ReactNode) => ReactNode) {
  const fixture = createTestEngine()
  const commits = { drawn: 0, rendered: 0 }
  const drawnTree = (next: MeterProps): ReactNode => (
    <Profiler id="drawn" onRender={() => (commits.drawn += 1)}>
      <Meter {...next} />
    </Profiler>
  )
  const renderedTree = (next: MeterProps): ReactNode => (
    <Profiler id="rendered" onRender={() => (commits.rendered += 1)}>
      <RenderedMeter {...next} />
    </Profiler>
  )
  const wrapped = (tree: ReactNode): ReactNode => (wrap ? wrap(tree) : tree)
  const drawn = render(wrapped(drawnTree(props)), { wrapper: fixture.wrapper })
  const rendered = render(wrapped(renderedTree(props)), { wrapper: fixture.wrapper })
  let time = 0
  return {
    fixture,
    commits,
    drawnRoot: (): HTMLElement => drawn.container.firstElementChild as HTMLElement,
    renderedRoot: (): HTMLElement => rendered.container.firstElementChild as HTMLElement,
    /** One sampled frame for both, `waitMs` later on the clock the hold reads. */
    frame(waitMs = 10): void {
      clock += waitMs
      time += 100
      act(() => fixture.frames.flush(time))
    },
    setLevel(db: number): void {
      fixture.ctx.analysers[0].level = Number.isFinite(db) ? dbToGain(db) : 0
    },
    rerender(next: MeterProps): void {
      drawn.rerender(wrapped(drawnTree(next)))
      rendered.rerender(wrapped(renderedTree(next)))
    },
    expectSame(step: string): void {
      const html = drawn.container.innerHTML
      expect(html, step).toBe(rendered.container.innerHTML)
      expect(html, step).toContain('role="meter"')
    },
  }
}

const LOOKS: readonly MeterLook[] = ['bars', 'segments']
const ORIENTATIONS: readonly MeterOrientation[] = ['vertical', 'horizontal']
const CASES = LOOKS.flatMap((look) => ORIENTATIONS.map((orientation) => [look, orientation]))

describe('Meter on a source, drawn on frames', () => {
  it.each(CASES)(
    'reads the same as the rendered meter after every frame: %s, %s',
    async (look, orientation) => {
      const props: MeterProps = {
        look: look as MeterLook,
        orientation: orientation as MeterOrientation,
        holdMs: 1000,
        'data-testid': 'out',
        className: 'strip-meter',
      }
      const pair = mountPair(props)
      const { fixture, commits } = pair
      const bars = look === 'bars'
      const root = pair.drawnRoot
      const mark = (): HTMLElement | null => root().querySelector('.lm-meter__hold')
      const lamp = (): HTMLElement | null => root().querySelector('.lm-meter__clip')
      const fill = (kind: string): HTMLElement | null =>
        root().querySelector(`.lm-meter__fill--${kind}`)
      /** Run one step, and say how many commits the drawn meter took for it. */
      const step = (name: string, run: () => void): number => {
        const before = commits.drawn
        run()
        pair.expectSame(name)
        return commits.drawn - before
      }

      pair.expectSame('mounted in silence')
      expect(mark()).toBeNull()
      expect(root()).toHaveClass('strip-meter')

      // The marker is an element: React adds it, once.
      const appears = step('a signal arrives and the marker appears', () => {
        pair.setLevel(-20)
        pair.frame()
      })
      expect(appears).toBe(1)
      expect(mark()).not.toBeNull()
      expect(mark()).not.toHaveClass('lm-meter__hold--hot')
      expect(root().querySelector('.lm-meter__bar--peak')).toHaveAttribute('title', 'Peak -20.0')

      // From here the readings are drawn with no render at all.
      const louder = step('the level rises', () => {
        pair.setLevel(-10)
        pair.frame()
      })
      expect(louder).toBe(0)
      expect(root()).toHaveAttribute('aria-valuetext', '-10.0 dBFS')

      const hot = step('the level passes the hot threshold', () => {
        pair.setLevel(-3)
        pair.frame()
      })
      expect(hot).toBe(0)
      expect(mark()).toHaveClass('lm-meter__hold--hot')
      if (bars) expect(fill('peak')).toHaveClass('lm-meter__fill--hot')
      else expect(fill('peak')).not.toHaveClass('lm-meter__fill--hot')

      const clips = step('the signal clips', () => {
        pair.setLevel(0)
        pair.frame()
      })
      expect(clips).toBe(0)
      expect(root()).toHaveClass('lm-meter--clip')
      expect(root()).toHaveClass('strip-meter')
      if (!bars) expect(lamp()).toHaveAttribute('data-on')

      const falls = step('the level falls and the marker and the lamp stay', () => {
        pair.setLevel(-30)
        pair.frame()
      })
      expect(falls).toBe(0)
      expect(root()).not.toHaveClass('lm-meter--clip')
      expect(fill('peak')).not.toHaveClass('lm-meter__fill--hot')
      expect(mark()).toHaveClass('lm-meter__hold--hot')
      expect(root().querySelector('.lm-meter__value--peak')).toHaveTextContent('0.0')
      if (!bars) expect(lamp()).toHaveAttribute('data-on')

      step('a click clears the lamp', () => {
        fireEvent.click(pair.drawnRoot())
        fireEvent.click(pair.renderedRoot())
      })
      if (!bars) expect(lamp()).not.toHaveAttribute('data-on')
      step('the parent renders at this level', () => pair.rerender(props))

      const released = step('the hold time passes and the marker comes down', () => {
        pair.setLevel(-40)
        pair.frame(1100)
      })
      expect(released).toBe(0)
      expect(mark()).not.toHaveClass('lm-meter__hold--hot')
      expect(root().querySelector('.lm-meter__value--peak')).toHaveTextContent('-40.0')

      // A LUFS meter adds two bars and a readout, which is a render. The level is
      // back where React last rendered it, with a frame drawn over that since.
      const lufs = await installLufs(fixture)
      lufs.port.receive({ type: 'reading', reading: loudness(-14, 0.5) })
      const loud = step('a LUFS meter arrives', () => {
        pair.setLevel(-30)
        pair.frame()
      })
      expect(loud).toBe(1)
      expect(root().querySelectorAll('.lm-meter__bar')).toHaveLength(4)
      expect(root().querySelector('.lm-meter__bar--peak')).toHaveAttribute('title', 'Peak -30.0')
      expect(root().querySelector('.lm-meter__value--lufs')).toHaveTextContent('-14.0 LU')

      const louderStill = step('the loudness rises and the true peak goes over', () => {
        lufs.port.receive({ type: 'reading', reading: loudness(-9, 1.2) })
        pair.frame()
      })
      expect(louderStill).toBe(0)
      expect(root().querySelector('.lm-meter__value--lufs')).toHaveTextContent('-9.0 LU')
      expect(root().querySelector('.lm-meter__bar--lufs')).toHaveAttribute('data-db', '-9.0')
      expect(root()).toHaveClass('lm-meter--clip')
      if (!bars) expect(lamp()).toHaveAttribute('data-on')

      const silent = step('silence outlasts the hold and the marker goes', () => {
        pair.setLevel(-Infinity)
        pair.frame(1100)
      })
      expect(silent).toBe(1)
      expect(mark()).toBeNull()
      expect(root().querySelector('.lm-meter__value--peak')).toHaveTextContent('-∞')

      step('a signal comes back', () => {
        lufs.port.receive({ type: 'reading', reading: loudness(-20, 0.3) })
        pair.setLevel(-12)
        pair.frame()
      })
      const moves = step('and moves', () => {
        pair.setLevel(-18)
        pair.frame()
      })
      expect(moves).toBe(0)

      // A render from above, with frames drawn since the last one.
      step('the parent renders again', () => pair.rerender(props))
      step('and a frame follows', () => {
        pair.setLevel(-7)
        pair.frame()
      })

      const turned: MeterProps = {
        ...props,
        orientation: orientation === 'vertical' ? 'horizontal' : 'vertical',
        hotDb: -9,
        floorDb: -48,
        className: 'row-meter',
      }
      step('the props change', () => pair.rerender(turned))
      expect(root()).toHaveClass('row-meter')
      expect(root()).not.toHaveClass('strip-meter')
      const after = step('and a frame follows them', () => {
        pair.setLevel(-8.5)
        pair.frame()
      })
      expect(after).toBe(0)
      step('back again, onto a level React rendered before', () => {
        pair.setLevel(-18)
        pair.frame()
        pair.rerender(props)
      })
      step('without a readout or a hold', () => {
        pair.rerender({ ...props, showReadout: false, holdMs: 0, bars: ['rms', 'peak'] })
        pair.setLevel(-2)
        pair.frame()
      })
      expect(mark()).toBeNull()
      expect(root().querySelector('.lm-meter__readout')).toBeNull()
      // The old meter rendered every one of those frames.
      expect(commits.rendered).toBeGreaterThan(commits.drawn + 8)
    },
  )

  it('takes no React commit for a frame, however many follow', () => {
    const pair = mountPair({ look: 'segments', 'data-testid': 'out' })
    pair.setLevel(-30)
    pair.frame()
    const before = { ...pair.commits }
    for (let index = 0; index < 60; index += 1) {
      pair.setLevel(-30 + (index % 25))
      pair.frame()
      pair.expectSame(`frame ${index}`)
    }
    expect(pair.commits.drawn).toBe(before.drawn)
    expect(pair.commits.rendered).toBe(before.rendered + 60)
  })

  it('draws inside the frame itself, with nothing left for React to do', () => {
    const errors = vi.spyOn(console, 'error')
    const fixture = createTestEngine()
    const { container } = render(<Meter source={fixture.engine.master} />, {
      wrapper: fixture.wrapper,
    })
    fixture.ctx.analysers[0].level = dbToGain(-20)
    act(() => fixture.frames.flush(0))
    const fill = container.querySelector<HTMLElement>('.lm-meter__fill--peak')
    const before = fill?.style.height
    fixture.ctx.analysers[0].level = dbToGain(-10)
    // No `act`: the reading is in the document when the frame returns.
    fixture.frames.flush(100)
    expect(fill?.style.height).not.toBe(before)
    expect(container.querySelector('.lm-meter__bar--peak')).toHaveAttribute('data-db', '-10.0')
    expect(errors).not.toHaveBeenCalled()
  })

  it('writes only the strings that changed', () => {
    const fixture = createTestEngine()
    const { container } = render(<Meter source={fixture.engine.master} look="segments" />, {
      wrapper: fixture.wrapper,
    })
    const root = container.firstElementChild as HTMLElement
    fixture.ctx.analysers[0].level = dbToGain(-20)
    act(() => fixture.frames.flush(0))
    const observer = new MutationObserver(() => {})
    observer.observe(root, {
      attributes: true,
      attributeOldValue: true,
      characterData: true,
      childList: true,
      subtree: true,
    })
    const written = (): string[] =>
      observer.takeRecords().map((record) => {
        const target = record.target as HTMLElement
        // Nothing is written that already stood there.
        if (record.type === 'attributes' && record.attributeName) {
          expect(target.getAttribute(record.attributeName)).not.toBe(record.oldValue)
        }
        return `${record.type}:${record.attributeName ?? ''}`
      })

    // A hundredth of a dB moves the fills and the exact value, not the figures.
    fixture.ctx.analysers[0].level = dbToGain(-20.01)
    fixture.frames.flush(100)
    expect(written().sort()).toEqual([
      'attributes:aria-valuenow',
      'attributes:style',
      'attributes:style',
    ])
    // The same reading again is no frame to draw.
    fixture.frames.flush(200)
    expect(written()).toEqual([])
    // A new figure: both bars' titles and values, the readout and the marker stay put.
    fixture.ctx.analysers[0].level = dbToGain(-25)
    fixture.frames.flush(300)
    expect(written().sort()).toEqual([
      'attributes:aria-valuenow',
      'attributes:aria-valuetext',
      'attributes:data-db',
      'attributes:data-db',
      'attributes:style',
      'attributes:style',
      'attributes:title',
      'attributes:title',
    ])
    observer.disconnect()
  })

  it('brings the held mark down in time on a reading that stands still', () => {
    const fixture = createTestEngine()
    const commits = { count: 0 }
    const { container } = render(
      <Profiler id="meter" onRender={() => (commits.count += 1)}>
        <Meter source={fixture.engine.master} holdMs={1000} />
      </Profiler>,
      { wrapper: fixture.wrapper },
    )
    const mark = (): HTMLElement | null => container.querySelector('.lm-meter__hold')
    const figure = (): Element | null => container.querySelector('.lm-meter__value--peak')
    let time = 0
    const frame = (waitMs: number): void => {
      clock += waitMs
      time += 100
      act(() => fixture.frames.flush(time))
    }
    const fill = (): HTMLElement | null => container.querySelector('.lm-meter__fill--peak')

    fixture.ctx.analysers[0].level = dbToGain(-6)
    frame(10)
    const held = mark()?.style.bottom
    expect(held).toBe(fill()?.style.height)
    // The strip is muted: silence from here on, and every sample is the one before it.
    fixture.ctx.analysers[0].level = 0
    frame(10)
    frame(500)
    expect(fill()?.style.height).toBe('0%')
    expect(mark()?.style.bottom).toBe(held)
    expect(figure()).toHaveTextContent('-6.0')
    // Its time is up, and no new reading comes to say so.
    frame(600)
    expect(mark()).toBeNull()
    expect(figure()).toHaveTextContent('-∞')

    // The same over a level that stands: the mark comes down to it, and that takes no render.
    fixture.ctx.analysers[0].level = dbToGain(-3)
    frame(10)
    fixture.ctx.analysers[0].level = dbToGain(-30)
    frame(10)
    const before = commits.count
    frame(500)
    expect(figure()).toHaveTextContent('-3.0')
    frame(600)
    expect(mark()?.style.bottom).toBe(fill()?.style.height)
    expect(figure()).toHaveTextContent('-30.0')
    expect(commits.count).toBe(before)
    // With nothing held over the reading, a still frame is no frame to draw.
    const observer = new MutationObserver(() => {})
    observer.observe(container, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    })
    frame(5000)
    expect(observer.takeRecords()).toEqual([])
    observer.disconnect()
  })

  it('renders on the server what the rendered meter does', () => {
    const fixture = createTestEngine()
    fixture.ctx.analysers[0].level = dbToGain(-9)
    for (const look of LOOKS) {
      const drawn = renderToString(<Meter source={fixture.engine.master} look={look} />)
      expect(drawn).toBe(
        renderToString(<RenderedMeter source={fixture.engine.master} look={look} />),
      )
      expect(drawn).toContain('lm-meter__hold')
    }
  })

  it('reads once and asks for no frame while it is not active', () => {
    const fixture = createTestEngine()
    fixture.ctx.analysers[0].level = dbToGain(-6)
    const { container, rerender } = render(
      <Meter source={fixture.engine.master} active={false} />,
      {
        wrapper: fixture.wrapper,
      },
    )
    expect(fixture.frames.size).toBe(0)
    const bar = container.querySelector('.lm-meter__bar--peak')
    expect(bar).toHaveAttribute('data-db', '-6.0')
    fixture.ctx.analysers[0].level = dbToGain(-3)
    rerender(<Meter source={fixture.engine.master} active />)
    expect(fixture.frames.size).toBe(1)
    expect(bar).toHaveAttribute('data-db', '-3.0')
  })

  it.each([
    ['plain', (meter: ReactNode): ReactNode => meter],
    ['StrictMode', (meter: ReactNode): ReactNode => <StrictMode>{meter}</StrictMode>],
  ])('given another source, keeps no lamp and no held mark of the last one: %s', (_name, wrap) => {
    const fixture = createTestEngine()
    const other = new AnalyserMeter(asAudioContext(fixture.ctx))
    const props: MeterProps = { look: 'segments', holdMs: 1000 }
    const { container, rerender } = render(
      wrap(<Meter {...props} source={fixture.engine.master} />),
      { wrapper: fixture.wrapper },
    )
    fixture.ctx.analysers[0].level = 1
    act(() => fixture.frames.flush(100))
    expect(container.querySelector('.lm-meter__clip')).toHaveAttribute('data-on')
    expect(container.querySelector('.lm-meter__hold')).not.toBeNull()

    // The other source has been silent all along: nothing of it clipped, and it has no peak to hold.
    rerender(wrap(<Meter {...props} source={other} />))
    clock += 10
    act(() => fixture.frames.flush(200))
    expect(container.querySelector('.lm-meter__bar--peak')).toHaveAttribute('data-db', '-∞')
    expect(container.querySelector('.lm-meter__clip')).not.toHaveAttribute('data-on')
    expect(container.querySelector('.lm-meter__hold')).toBeNull()
    expect(container.querySelector('.lm-meter__value--peak')).toHaveTextContent('-∞')
  })

  it('given another source while it is not active, reads that one once', () => {
    const fixture = createTestEngine()
    const other = new AnalyserMeter(asAudioContext(fixture.ctx))
    fixture.ctx.analysers[0].level = dbToGain(-6)
    fixture.ctx.analysers[fixture.ctx.analysers.length - 1].level = dbToGain(-20)
    const { container, rerender } = render(
      <Meter source={fixture.engine.master} active={false} />,
      { wrapper: fixture.wrapper },
    )
    expect(container.querySelector('.lm-meter__bar--peak')).toHaveAttribute('data-db', '-6.0')
    rerender(<Meter source={other} active={false} />)
    expect(fixture.frames.size).toBe(0)
    expect(container.querySelector('.lm-meter__bar--peak')).toHaveAttribute('data-db', '-20.0')
  })

  it('puts a page of meters on one frame request and on the same frames', () => {
    const fixture = createTestEngine()
    const first = render(<Meter source={fixture.engine.master} />, { wrapper: fixture.wrapper })
    act(() => fixture.frames.flush(0))
    // The rest of the page mounts a frame later.
    act(() => fixture.frames.flush(16))
    const rest = render(
      <>
        {Array.from({ length: 12 }, (_, index) => (
          <Meter key={index} source={fixture.engine.master} />
        ))}
      </>,
      { wrapper: fixture.wrapper },
    )
    expect(fixture.frames.size).toBe(1)
    const requests = fixture.frames.requests
    const figures = (): (string | null)[] =>
      [first.container, rest.container].flatMap((container) =>
        [...container.querySelectorAll('.lm-meter__bar--peak')].map((bar) =>
          bar.getAttribute('data-db'),
        ),
      )

    fixture.ctx.analysers[0].level = dbToGain(-12)
    // Inside the interval of the first: nobody moves.
    act(() => fixture.frames.flush(20))
    expect(new Set(figures())).toEqual(new Set(['-∞']))
    act(() => fixture.frames.flush(40))
    expect(figures()).toHaveLength(13)
    expect(new Set(figures())).toEqual(new Set(['-12.0']))
    expect(fixture.frames.requests).toBe(requests + 2)
  })

  it('draws the same under StrictMode', () => {
    const pair = mountPair({ look: 'segments', 'data-testid': 'out' }, (meter) => (
      <StrictMode>{meter}</StrictMode>
    ))
    for (const db of [-20, -6, 0, -40, -3]) {
      pair.setLevel(db)
      pair.frame()
      pair.expectSame(`at ${db} dB`)
    }
    fireEvent.click(pair.drawnRoot())
    fireEvent.click(pair.renderedRoot())
    pair.expectSame('after a click')
  })
})
