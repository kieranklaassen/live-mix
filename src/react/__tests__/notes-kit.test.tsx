// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ChangedMark, ContextChip, ReferenceChip } from '../components/chips'
import { Glyph } from '../components/Glyph'
import { NoteBubble, NotePin, NoteSpan, NoteTab, PictureMark } from '../components/notes'

afterEach(cleanup)

describe('NoteTab', () => {
  it('is filled for a person’s open note, with an arrow once it is sent', () => {
    const { container, rerender } = render(<NoteTab number={3} />)
    const tab = container.querySelector('.lm-notetab')
    expect(tab).toHaveTextContent('3')
    expect(tab).not.toHaveClass('lm-notetab--agent')
    expect(tab).not.toHaveClass('lm-notetab--resolved')
    expect(tab?.querySelector('svg')).toBeNull()
    rerender(<NoteTab number={3} state="sent" />)
    expect(tab?.querySelector('.lm-glyph--sent')).not.toBeNull()
  })

  it('is outlined for an agent’s note, and grey with a tick when resolved', () => {
    const { container, rerender } = render(<NoteTab number={4} from="agent" />)
    const tab = container.querySelector('.lm-notetab')
    expect(tab).toHaveClass('lm-notetab--agent')
    rerender(<NoteTab number={4} state="resolved" />)
    expect(tab).toHaveClass('lm-notetab--resolved')
    expect(tab?.querySelector('.lm-glyph--tick')).not.toBeNull()
  })
})

describe('NotePin and NoteSpan', () => {
  it('is a button at its moment, named by its number and its words', () => {
    const onClick = vi.fn()
    render(
      <NotePin
        x={240}
        number={2}
        text="Cut the pause here"
        onClick={onClick}
        data-action="select_note"
      />,
    )
    const pin = screen.getByRole('button', { name: 'Note 2: Cut the pause here' })
    expect(pin).toHaveStyle({ left: '240px' })
    expect(pin).toHaveAttribute('aria-pressed', 'false')
    expect(pin).toHaveAttribute('data-action', 'select_note')
    expect(pin.querySelector('.lm-notepin__text')).toHaveTextContent('Cut the pause here')
    expect(pin.querySelector('.lm-noteline')).toBeNull()
    fireEvent.click(pin)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('says in its name who it is from and what state it is in', () => {
    render(
      <>
        <NotePin x={0} number={1} text="Zoom in" state="sent" />
        <NotePin x={0} number={5} text="Is this the right take?" from="agent" selected />
        <NotePin x={0} number={6} text="Trim the end" state="resolved" line={{ height: 180 }} />
      </>,
    )
    expect(screen.getByRole('button', { name: 'Note 1, sent: Zoom in' })).toBeInTheDocument()
    const fromAgent = screen.getByRole('button', {
      name: 'Note from the agent 5: Is this the right take?',
    })
    expect(fromAgent).toHaveClass('lm-notepin--agent', 'lm-notepin--selected')
    expect(fromAgent).toHaveAttribute('aria-pressed', 'true')
    const resolved = screen.getByRole('button', { name: 'Note 6, resolved: Trim the end' })
    expect(resolved).toHaveClass('lm-notepin--resolved')
    const line = resolved.querySelector('.lm-noteline')
    expect(line).toHaveClass('lm-noteline--resolved')
    expect(line).toHaveStyle({ height: '180px' })
  })

  it('draws the span a note is about as wide as it is given', () => {
    render(
      <>
        <NoteSpan x={100} width={80} data-testid="span" />
        <NoteSpan x={100} width={-4} data-testid="none" />
      </>,
    )
    expect(screen.getByTestId('span')).toHaveStyle({ left: '100px', width: '80px' })
    expect(screen.getByTestId('none')).toHaveStyle({ width: '0px' })
  })
})

describe('PictureMark and NoteBubble', () => {
  const paths = (testId: string): (string | null)[] =>
    [...screen.getByTestId(testId).querySelectorAll('path')].map((path) => path.getAttribute('d'))

  it('draws a box between two corners, in either order, with the edge under the line', () => {
    render(
      <PictureMark
        kind="box"
        points={[
          [200, 120],
          [80, 40],
        ]}
        number={2}
        data-testid="mark"
      />,
    )
    const mark = screen.getByTestId('mark')
    expect(mark).toHaveClass('lm-mark', 'lm-mark--box')
    expect(paths('mark')).toEqual(['M80 40H200V120H80Z', 'M80 40H200V120H80Z'])
    expect(mark.querySelector('.lm-mark__edge')).not.toBeNull()
    expect(mark.querySelector('.lm-mark__line')).not.toBeNull()
    // The note's tab sits where the mark starts.
    const tab = mark.querySelector('.lm-mark__tab')
    expect(tab).toHaveTextContent('2')
    expect(tab).toHaveStyle({ left: '200px', top: '120px' })
  })

  it('draws an arrow as a line with a head at its end', () => {
    render(
      <PictureMark
        kind="arrow"
        points={[
          [10, 10],
          [110, 10],
        ]}
        data-testid="mark"
      />,
    )
    const [edge] = paths('mark')
    expect(edge).toMatch(/^M10 10L110 10M/)
    // Two barbs meeting at the end, one on each side of the line.
    expect(edge).toMatch(/L110 10L[\d.]+ [\d.]+$/)
    expect(screen.getByTestId('mark').querySelector('.lm-mark__tab')).toBeNull()
  })

  it('draws a line through every point', () => {
    render(
      <PictureMark
        kind="line"
        points={[
          [0, 0],
          [10, 5],
          [20, 0],
          [30, 5],
        ]}
        data-testid="mark"
      />,
    )
    expect(paths('mark')[1]).toBe('M0 0L10 5L20 0L30 5')
  })

  it('draws nothing without a point', () => {
    const { container } = render(<PictureMark kind="box" points={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows a bubble with the note’s tab and words, and a caret only while it is written', () => {
    const { rerender } = render(
      <NoteBubble number={2} text="Blur this" style={{ left: 40, top: 60 }} data-testid="bubble" />,
    )
    const bubble = screen.getByTestId('bubble')
    expect(bubble).toHaveStyle({ left: '40px', top: '60px' })
    expect(bubble.querySelector('.lm-notetab')).toHaveTextContent('2')
    expect(bubble).toHaveTextContent('2Blur this')
    expect(bubble.querySelector('.lm-notebubble__caret')).toBeNull()
    rerender(<NoteBubble number={2} text="Blur this" editing data-testid="bubble" />)
    expect(bubble.querySelector('.lm-notebubble__caret')).not.toBeNull()
  })
})

describe('ContextChip, ReferenceChip and ChangedMark', () => {
  it('shows what is selected, with an x that leaves it out', () => {
    const onRemove = vi.fn()
    render(
      <ContextChip
        kind="selection"
        glyph={<Glyph kind="zoom" />}
        text="Zoom 2.2×"
        time="00:44.0 to 00:50.0"
        onRemove={onRemove}
        removeProps={{ 'data-action': 'leave_out_context' }}
        data-testid="chip"
      />,
    )
    const chip = screen.getByTestId('chip')
    expect(chip).toHaveClass('lm-chip', 'lm-chip--selection')
    expect(chip).toHaveTextContent('Zoom 2.2×00:44.0 to 00:50.0')
    expect(chip.querySelector('.lm-glyph--zoom')).not.toBeNull()
    const x = within(chip).getByRole('button', { name: 'Leave out Zoom 2.2×' })
    expect(x).toHaveAttribute('data-action', 'leave_out_context')
    fireEvent.click(x)
    expect(onRemove).toHaveBeenCalledOnce()
  })

  it('shows a note by its tab, and a marked frame by its thumbnail', () => {
    render(
      <>
        <ContextChip
          kind="note"
          number={3}
          noteFrom="agent"
          text="Cut the pause"
          data-testid="note"
        />
        <ContextChip
          kind="frame"
          number={4}
          text="Blur this"
          frameUrl="frame.jpg"
          data-testid="frame"
        />
      </>,
    )
    const note = screen.getByTestId('note')
    expect(note).toHaveClass('lm-chip--note')
    expect(note.querySelector('.lm-notetab')).toHaveClass('lm-notetab--agent')
    expect(within(note).queryByRole('button')).toBeNull()
    expect(screen.getByTestId('frame').querySelector('.lm-chip__frame')).toHaveAttribute(
      'src',
      'frame.jpg',
    )
  })

  it('a reference is a button that goes there', () => {
    const onGo = vi.fn()
    render(
      <>
        <ReferenceChip kind="moment" label="00:44.0" onGo={onGo} data-action="go_to_reference" />
        <ReferenceChip
          kind="item"
          label="Zoom 2.2×"
          glyph={<Glyph kind="zoom" />}
          onGo={() => {}}
        />
      </>,
    )
    const moment = screen.getByRole('button', { name: '00:44.0' })
    expect(moment).toHaveClass('lm-ref', 'lm-ref--moment')
    expect(moment).toHaveAttribute('data-action', 'go_to_reference')
    fireEvent.click(moment)
    expect(onGo).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Zoom 2.2×' })).toHaveClass('lm-ref--item')
  })

  it('a changed mark says an agent changed this, and which kind of agent by its shape', () => {
    render(
      <>
        <ChangedMark style={{ left: 0, top: 0 }} />
        <ChangedMark who="outside" />
      </>,
    )
    const inApp = screen.getByRole('img', { name: 'Changed by the agent' })
    expect(inApp).toHaveClass('lm-changed')
    expect(inApp).not.toHaveClass('lm-changed--outside')
    expect(screen.getByRole('img', { name: 'Changed by an outside agent' })).toHaveClass(
      'lm-changed--outside',
    )
  })
})
