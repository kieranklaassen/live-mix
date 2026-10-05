// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { type Clip } from '../../core/clips/Clip'
import { computePeaks } from '../../core/clips/peaks'
import { rulerTicks, TimelineView } from '../components/TimelineView'
import { clipPeaks, waveformPath } from '../components/Waveform'
import { createTestEngine } from './harness'

afterEach(cleanup)

function clip(id: string, startSec: number, durationSec: number, sourceId = id): Clip {
  return {
    id,
    sourceId,
    startSec,
    offsetSec: 0,
    durationSec,
    fadeInSec: 0,
    fadeOutSec: 0,
    fadeCurve: 'linear',
    gainDb: 0,
  }
}

/** Runs `body` with a ceiling on what arrays take in, so a loop that would never end throws and the run goes on. */
function withinReason<T>(body: () => T, ceiling = 200_000): T {
  const push = Array.prototype.push
  let taken = 0
  Array.prototype.push = function (this: unknown[], ...items: unknown[]): number {
    taken += items.length
    if (taken > ceiling) throw new Error('an array grew without end')
    return push.apply(this, items)
  }
  try {
    return body()
  } finally {
    Array.prototype.push = push
  }
}

describe('TimelineView', () => {
  it('draws a lane per track with clips placed in seconds and a playhead', () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    const bass = fixture.engine.addAudioTrack('bass')
    pad.clips.add(clip('intro', 0, 4))
    pad.clips.add(clip('verse', 4, 8))
    bass.clips.add({ ...clip('low', 2, 6), loop: true })
    fixture.engine.transport.seek(3)
    render(<TimelineView pixelsPerSecond={10} data-testid="tl" />, { wrapper: fixture.wrapper })
    expect(screen.getByText('pad')).toHaveClass('lm-timeline__lane-name')
    const padLane = screen.getByRole('list', { name: 'pad clips' })
    const [intro, verse] = within(padLane).getAllByRole('listitem')
    expect(intro).toHaveStyle({ left: '0px', width: '40px' })
    expect(verse).toHaveStyle({ left: '40px', width: '80px' })
    expect(intro).toHaveClass('lm-timeline__clip--sounding')
    expect(verse).toHaveClass('lm-timeline__clip--upcoming')
    expect(verse).not.toHaveClass('lm-timeline__clip--sounding')
    const low = within(screen.getByRole('list', { name: 'bass clips' })).getByRole('listitem')
    expect(low).toHaveClass('lm-timeline__clip--loop')
    expect(screen.getByTestId('tl-playhead')).toHaveStyle({ left: '30px' })
    // 16 s minimum canvas, 12 s of clips + 2 s → 16 s wide.
    expect(
      screen.getByTestId('tl').querySelector<HTMLElement>('.lm-timeline__canvas')?.style.width,
    ).toBe('160px')
  })

  it('follows clip edits, the loop region and the playhead while playing', () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    pad.clips.add(clip('a', 0, 2))
    render(<TimelineView pixelsPerSecond={10} data-testid="tl" />, { wrapper: fixture.wrapper })
    const lane = screen.getByRole('list', { name: 'pad clips' })
    expect(within(lane).getAllByRole('listitem')).toHaveLength(1)
    act(() => {
      pad.clips.add(clip('b', 20, 4))
    })
    expect(within(lane).getAllByRole('listitem')).toHaveLength(2)
    expect(
      screen.getByTestId('tl').querySelector<HTMLElement>('.lm-timeline__canvas')?.style.width,
    ).toBe('260px')

    act(() => fixture.engine.transport.setLoop({ enabled: true, lengthSec: 8 }))
    expect(
      screen.getByTestId('tl').querySelector<HTMLElement>('.lm-timeline__loop')?.style.width,
    ).toBe('80px')

    act(() => fixture.engine.transport.start())
    fixture.ctx.currentTime = 1.5
    act(() => fixture.frames.flush(1000))
    expect(screen.getByTestId('tl-playhead')).toHaveStyle({ left: '15px' })
    expect(screen.getByTestId('tl')).toHaveClass('lm-timeline--playing')
  })

  it('draws a loop that is on and has no end as no loop: the canvas keeps its length', () => {
    // A new engine's timeline has no end, and its loop is switched on as it stands by the transport bar.
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    pad.clips.add(clip('a', 0, 2))
    render(<TimelineView pixelsPerSecond={10} data-testid="tl" />, { wrapper: fixture.wrapper })
    withinReason(() => act(() => fixture.engine.transport.setLoop({ enabled: true })))
    expect(fixture.engine.transport.loop).toEqual({ enabled: true, lengthSec: Infinity })
    const timeline = screen.getByTestId('tl')
    expect(timeline.querySelector<HTMLElement>('.lm-timeline__canvas')?.style.width).toBe('160px')
    expect(timeline.querySelector('.lm-timeline__loop')).toBeNull()
    expect(screen.getByRole('slider', { name: 'Position' })).toHaveAttribute('aria-valuemax', '16')
  })

  it('seeks from the ruler by click and keyboard, and reports clip clicks', () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    pad.clips.add(clip('a', 0, 2))
    const onClipClick = vi.fn()
    render(<TimelineView pixelsPerSecond={10} onClipClick={onClipClick} data-testid="tl" />, {
      wrapper: fixture.wrapper,
    })
    const ruler = screen.getByRole('slider', { name: 'Position' })
    ruler.getBoundingClientRect = () => ({ left: 0, top: 0, width: 160, height: 18 }) as DOMRect
    fireEvent.click(ruler, { clientX: 55 })
    expect(fixture.engine.transport.position().positionSec).toBeCloseTo(5.5)
    fireEvent.keyDown(ruler, { key: 'ArrowRight' })
    expect(fixture.engine.transport.position().positionSec).toBeCloseTo(6.5)
    fireEvent.keyDown(ruler, { key: 'ArrowLeft', shiftKey: true })
    expect(fixture.engine.transport.position().positionSec).toBeCloseTo(6.4)
    fireEvent.keyDown(ruler, { key: 'Home' })
    expect(fixture.engine.transport.position().positionSec).toBe(0)
    fireEvent.click(within(screen.getByRole('list', { name: 'pad clips' })).getByRole('listitem'))
    expect(onClipClick).toHaveBeenCalledWith(pad.clips.all()[0], { name: 'pad', source: pad })
    expect(fixture.engine.transport.position().positionSec).toBe(0)
  })

  it('draws waveforms from decoded peaks when the store has them', async () => {
    const fixture = createTestEngine({ samples: { peaks: 8 } })
    const { engine } = fixture
    const pad = engine.addAudioTrack('pad')
    const buffer = fixture.ctx.createBuffer(1, 48_000, 48_000)
    const data = buffer.getChannelData(0)
    for (let index = 0; index < data.length; index += 1) data[index] = index < 24_000 ? 0.5 : -0.25
    await engine.samples.load('tone', buffer as unknown as AudioBuffer)
    pad.clips.add(clip('a', 0, 0.5, 'tone'))
    render(<TimelineView pixelsPerSecond={100} />, { wrapper: fixture.wrapper })
    const wave = screen.getByRole('listitem').querySelector('svg.lm-timeline__waveform')
    expect(wave).not.toBeNull()
    expect(wave?.querySelector('path')?.getAttribute('d')).toMatch(/^M 0 0\.5000 L 1 0\.5000/)
    const sample = engine.samples.peek('tone')
    const peaks = clipPeaks(sample, pad.clips.all()[0])
    expect(peaks?.max.length).toBe(4)
    expect(waveformPath(peaks ?? { min: new Float32Array(), max: new Float32Array() })).toContain(
      'Z',
    )
  })

  it('draws a waveform when its sound is decoded after the clip was drawn, and drops it with the sound', async () => {
    const fixture = createTestEngine({ samples: { peaks: 8 } })
    const { engine } = fixture
    const pad = engine.addAudioTrack('pad')
    pad.clips.add(clip('a', 0, 0.5, 'tone'))
    render(<TimelineView pixelsPerSecond={100} />, { wrapper: fixture.wrapper })
    const wave = (): Element | null =>
      screen.getByRole('listitem').querySelector('svg.lm-timeline__waveform')
    expect(wave()).toBeNull()
    const buffer = fixture.ctx.createBuffer(1, 48_000, 48_000)
    await act(async () => {
      await engine.samples.load('tone', buffer as unknown as AudioBuffer)
    })
    expect(wave()).not.toBeNull()
    act(() => engine.samples.forget('tone'))
    expect(wave()).toBeNull()
  })

  it('accepts explicit lanes without a provider and switches off seeking', () => {
    const fixture = createTestEngine()
    const pad = fixture.engine.addAudioTrack('pad')
    render(
      <TimelineView
        lanes={[{ name: 'Pad', source: pad }]}
        transport={fixture.engine.transport}
        seekOnClick={false}
        samples={null}
      />,
    )
    expect(screen.getByText('Pad')).toBeInTheDocument()
    expect(screen.queryByRole('slider')).toBeNull()
  })

  it('keeps one lane each for two lanes of one name when the lanes are put in another order', () => {
    const fixture = createTestEngine()
    const { engine } = fixture
    const drums = { name: 'drums', source: engine.addAudioTrack('drums') }
    const take = { name: 'voice', source: engine.addAudioTrack('take') }
    const double = { name: 'voice', source: engine.addAudioTrack('double') }
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const timeline = (lanes: (typeof drums)[]) => (
      <TimelineView lanes={lanes} transport={engine.transport} samples={null} />
    )
    const { rerender } = render(timeline([drums, take, double]))
    rerender(timeline([take, double, drums]))
    expect(screen.getAllByRole('list').map((lane) => lane.getAttribute('aria-label'))).toEqual([
      'voice clips',
      'voice clips',
      'drums clips',
    ])
    expect(screen.getAllByTitle(/^(voice|drums)$/).map((name) => name.textContent)).toEqual([
      'voice',
      'voice',
      'drums',
    ])
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
  })

  it('spaces ruler ticks by scale', () => {
    expect(rulerTicks(4, 100).map((tick) => tick.sec)).toEqual([0, 1, 2, 3, 4])
    expect(
      rulerTicks(4, 100)
        .filter((tick) => tick.major)
        .map((tick) => tick.sec),
    ).toEqual([0])
    expect(rulerTicks(20, 10).map((tick) => tick.sec)).toEqual([0, 5, 10, 15, 20])
    expect(
      rulerTicks(60, 5)
        .filter((tick) => tick.major)
        .map((tick) => tick.sec),
    ).toEqual([0, 50])
  })

  it('gives a length that has no end no ticks, and returns', () => {
    expect(withinReason(() => rulerTicks(Infinity, 40))).toEqual([])
    expect(rulerTicks(Number.NaN, 40)).toEqual([])
  })

  it('waveformPath outlines the maxima forward and the minima back', () => {
    const peaks = computePeaks([new Float32Array([1, 1, -1, -1])], 4, 2)
    expect(waveformPath(peaks)).toBe('M 0 0.0000 L 1 2.0000 L 1 2.0000 L 0 0.0000 Z')
    expect(waveformPath({ min: new Float32Array(), max: new Float32Array() })).toBe('')
  })
})
