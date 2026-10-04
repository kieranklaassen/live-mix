// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { type WaveformPeaks } from '../../core/clips/peaks'
import { PaintField } from '../components/PaintField'
import { SOUND_KIND_LABELS, SoundIcon } from '../components/SoundIcon'
import { Stroke } from '../components/Stroke'

afterEach(cleanup)

const peaks: WaveformPeaks = {
  min: Float32Array.from({ length: 64 }, (_, index) => -Math.abs(Math.sin(index / 5))),
  max: Float32Array.from({ length: 64 }, (_, index) => Math.abs(Math.sin(index / 5))),
}

describe('Stroke', () => {
  it('is a pill of the given size in its brush colour, with the layered waveform', () => {
    render(<Stroke width={240} height={40} brush={3} peaks={peaks} data-testid="s" />)
    const stroke = screen.getByTestId('s')
    expect(stroke).toHaveClass('lm-stroke', 'lm-stroke--b3')
    expect(stroke).toHaveStyle({ width: '240px', height: '40px', borderRadius: '20px' })
    for (const layer of ['halo', 'wave', 'bars']) {
      expect(stroke.querySelector(`.lm-stroke__${layer}`)?.getAttribute('d')).toBeTruthy()
    }
    expect(stroke.querySelector('.lm-stroke__tag')).toBeNull()
    expect(stroke.querySelector('.lm-stroke__repeat')).toBeNull()
    expect(stroke.querySelector('.lm-stroke__fade')).toBeNull()
  })

  it('wraps the brush number onto the palette', () => {
    render(<Stroke width={80} height={20} brush={8} data-testid="s" />)
    expect(screen.getByTestId('s')).toHaveClass('lm-stroke--b2')
  })

  it('tags the stroke with its kind, name and readouts', () => {
    render(
      <Stroke
        width={240}
        height={40}
        name="Tabla loop"
        kind="beat"
        tags={['96 bpm']}
        data-testid="s"
      />,
    )
    const tag = screen.getByTestId('s').querySelector('.lm-stroke__tag')
    expect(tag).toHaveTextContent('Tabla loop96 bpm')
    expect(tag?.querySelector('.lm-sound-icon--beat')).not.toBeNull()
  })

  it('shows repeats: later passes sit back behind a seam, and the tag counts them', () => {
    render(<Stroke width={300} height={40} name="Bells" repeats={3} hits={[0]} data-testid="s" />)
    const stroke = screen.getByTestId('s')
    const dim = stroke.querySelector('.lm-stroke__repeat')
    expect(dim).toHaveAttribute('x', '100')
    expect(dim).toHaveAttribute('width', '200')
    expect(stroke.querySelectorAll('.lm-stroke__seam')).toHaveLength(2)
    expect(stroke.querySelectorAll('.lm-stroke__hit')).toHaveLength(3)
    expect(stroke.querySelector('.lm-stroke__tag')).toHaveTextContent('Bells×3')
    expect(stroke.querySelector('.lm-sound-icon--loop')).not.toBeNull()
  })

  it('draws fades shaded, and unshaded when they are a crossfade', () => {
    const { rerender } = render(
      <Stroke width={200} height={40} fadeIn={0.25} fadeOut={0.1} data-testid="s" />,
    )
    const stroke = screen.getByTestId('s')
    expect(stroke.querySelectorAll('.lm-stroke__fade-curve')).toHaveLength(2)
    expect(stroke.querySelectorAll('.lm-stroke__fade-shade')).toHaveLength(2)
    expect(stroke.querySelectorAll('.lm-stroke__fade-handle')[0]).toHaveAttribute('cx', '50')
    rerender(<Stroke width={200} height={40} fadeIn={0.25} crossfade data-testid="s" />)
    expect(stroke.querySelectorAll('.lm-stroke__fade-curve')).toHaveLength(1)
    expect(stroke.querySelector('.lm-stroke__fade-shade')).toBeNull()
  })

  it('draws an automation line with a node per breakpoint and its label', () => {
    const points = [
      [0, 0.2],
      [0.5, 0.9],
      [1, 0.4],
    ] as const
    render(
      <Stroke width={200} height={40} automation={{ label: 'Reverb', points }} data-testid="s" />,
    )
    const stroke = screen.getByTestId('s')
    expect(stroke.querySelectorAll('.lm-stroke__automation-node')).toHaveLength(3)
    expect(stroke.querySelector('.lm-stroke__automation-label')).toHaveTextContent('Reverb')
  })

  it("keeps the line's word to a room from the name, or the round end, to where the word ends", () => {
    const points = [
      [0, 0.5],
      [1, 0.5],
    ] as const
    const automation = { label: 'Level', points }
    const { rerender } = render(
      <Stroke width={200} height={40} name="Rain" automation={automation} data-testid="s" />,
    )
    const stroke = screen.getByTestId('s')
    const room = () => stroke.querySelector<HTMLElement>('.lm-stroke__automation-room')
    // One row for both: the room hangs on the end of the name, however long that is.
    expect(room()?.parentElement).toHaveClass('lm-stroke__tag')
    expect(room()).toHaveTextContent('Level')
    expect(room()?.style.left).toBe('100%')
    expect(room()?.style.top).toBe('0px')
    // It is the row less the name: a length in px with 100% of the name taken off.
    const row = () =>
      /^calc\((?:-100% \+ ([\d.]+)px|([\d.]+)px - 100%)\)$/.exec(room()?.style.width ?? '')
    const rowPx = () => Number(row()?.[1] ?? row()?.[2])
    // The name starts 14 in and the word ends 16 short of the ring's inside: 198 - 16 - 14.
    expect(rowPx()).toBe(168)
    // A fade moves the name in and the word back; the room is what is between them.
    rerender(
      <Stroke
        width={200}
        height={40}
        name="Rain"
        fadeIn={0.25}
        fadeOut={0.1}
        automation={automation}
        data-testid="s"
      />,
    )
    expect(rowPx()).toBe(98)

    // No name in its row: the room starts where the round end inside the ring is as far
    // in as the word's row is from the edge, 12 down a half circle of 19.
    rerender(<Stroke width={200} height={40} automation={automation} data-testid="s" />)
    expect(room()?.parentElement).toBe(stroke)
    expect(parseFloat(room()?.style.left ?? '')).toBeCloseTo(19 - Math.sqrt(19 * 19 - 7 * 7), 6)
    expect(room()?.style.right).toBe('16px')
    expect(room()?.style.bottom).toBe('12px')
    // A tall stroke has the name above and the word below, 4 from the edge: 39 and 35.
    rerender(<Stroke width={200} height={80} name="Rain" automation={automation} data-testid="s" />)
    expect(room()?.parentElement).toBe(stroke)
    expect(parseFloat(room()?.style.left ?? '')).toBeCloseTo(39 - Math.sqrt(39 * 39 - 35 * 35), 6)
    expect(room()?.style.right).toBe('36px')
    expect(room()?.style.bottom).toBe('4px')
  })

  it('marks selected, muted and reversed strokes', () => {
    render(<Stroke width={200} height={40} name="Rain" selected muted reversed data-testid="s" />)
    const stroke = screen.getByTestId('s')
    expect(stroke).toHaveClass('lm-stroke--selected', 'lm-stroke--muted')
    expect(stroke.querySelector('.lm-stroke__grips')).not.toBeNull()
    expect(stroke.querySelector('.lm-sound-icon--reverse')).not.toBeNull()
    expect(stroke.querySelector('.lm-stroke__tag')).toHaveTextContent('Rainmuted')
  })

  it('passes pointer handlers and data attributes through to the root', () => {
    const onPointerDown = vi.fn()
    render(
      <Stroke
        width={100}
        height={20}
        data-stroke-id="a"
        onPointerDown={onPointerDown}
        data-testid="s"
      />,
    )
    const stroke = screen.getByTestId('s')
    expect(stroke).toHaveAttribute('data-stroke-id', 'a')
    fireEvent.pointerDown(stroke)
    expect(onPointerDown).toHaveBeenCalledTimes(1)
  })
})

describe('SoundIcon', () => {
  it('is decorative unless it is given a name', () => {
    const { rerender } = render(<SoundIcon kind="pad" data-testid="i" />)
    expect(screen.getByTestId('i')).toHaveAttribute('aria-hidden', 'true')
    rerender(<SoundIcon kind="pad" label={SOUND_KIND_LABELS.pad} data-testid="i" />)
    expect(screen.getByRole('img', { name: 'Pad' })).toHaveAttribute('width', '10')
  })

  it('has a glyph and a label for every kind', () => {
    for (const kind of Object.keys(SOUND_KIND_LABELS) as (keyof typeof SOUND_KIND_LABELS)[]) {
      const { container, unmount } = render(<SoundIcon kind={kind} />)
      expect(container.querySelector('path'), kind).not.toBeNull()
      unmount()
    }
  })
})

describe('PaintField', () => {
  it('sets the cell size and major lines as variables and holds its children', () => {
    render(
      <PaintField columnPx={40} rowPx={20} majorColumns={4} majorRows={0} data-testid="f">
        <Stroke width={80} height={20} data-testid="s" />
      </PaintField>,
    )
    const field = screen.getByTestId('f')
    expect(field).toHaveClass('lm-field', 'lm-field--major-cols')
    expect(field).not.toHaveClass('lm-field--major-rows')
    expect(field.style.getPropertyValue('--lm-field-col')).toBe('40px')
    expect(field.style.getPropertyValue('--lm-field-row')).toBe('20px')
    expect(field).toContainElement(screen.getByTestId('s'))
  })
})
