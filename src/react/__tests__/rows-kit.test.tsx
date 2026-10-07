// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Glyph, GLYPHS, type GlyphKind } from '../components/Glyph'
import { Progress, StateMark, WhoMark } from '../components/marks'
import { JobRow, LogRow } from '../components/rows'
import { TextButton } from '../components/TextButton'
import { TranscriptWord } from '../components/TranscriptWord'

afterEach(cleanup)

describe('Glyph', () => {
  it('draws every kind the design names, in the 10 by 10 box', () => {
    const named: GlyphKind[] = [
      'display',
      'webcam',
      'microphone',
      'system-audio',
      'music',
      'voiceover',
      'title',
      'lower-third',
      'callout',
      'arrow',
      'zoom',
      'layout',
      'follows',
      'point',
      'return',
      'undo',
      'redo',
      'play',
      'add',
      'close',
      'copy',
      'find',
    ]
    for (const kind of named) {
      expect(GLYPHS[kind], kind).toMatch(/^M/)
      const { container, unmount } = render(<Glyph kind={kind} />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveClass('lm-glyph', `lm-glyph--${kind}`)
      expect(svg).toHaveAttribute('viewBox', '0 0 10 10')
      expect(svg?.querySelector('path')).toHaveAttribute('d', GLYPHS[kind])
      unmount()
    }
  })

  it('is decorative until it is named, and takes a path of its own', () => {
    const { container } = render(<Glyph kind="play" />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    render(<Glyph d="M1 1h8" label="Rule" size={8} filled />)
    const named = screen.getByRole('img', { name: 'Rule' })
    expect(named).toHaveAttribute('width', '8')
    expect(named).toHaveClass('lm-glyph--filled')
    expect(named.querySelector('path')).toHaveAttribute('d', 'M1 1h8')
  })
})

describe('Progress, StateMark and WhoMark', () => {
  it('Progress is a progress bar from 0 to 100, kept inside its ends', () => {
    const { rerender } = render(<Progress value={0.42} label="Export" />)
    const bar = screen.getByRole('progressbar', { name: 'Export' })
    expect(bar).toHaveAttribute('aria-valuenow', '42')
    expect(bar.querySelector('.lm-progress__fill')).toHaveStyle({ width: '42%' })
    rerender(<Progress value={3} label="Export" />)
    expect(bar).toHaveAttribute('aria-valuenow', '100')
    rerender(<Progress value={Number.NaN} label="Export" />)
    expect(bar).toHaveAttribute('aria-valuenow', '0')
  })

  it('StateMark takes a class per state and is decorative until it is named', () => {
    for (const state of ['off', 'on', 'busy', 'failed'] as const) {
      const { unmount } = render(<StateMark state={state} data-testid="mark" />)
      expect(screen.getByTestId('mark')).toHaveClass('lm-state', `lm-state--${state}`)
      expect(screen.getByTestId('mark')).toHaveAttribute('aria-hidden', 'true')
      unmount()
    }
    render(<StateMark state="on" label="Given" />)
    expect(screen.getByRole('img', { name: 'Given' })).toBeInTheDocument()
  })

  it('WhoMark says who by a shape, with words for a screen reader', () => {
    render(
      <>
        <WhoMark who="person" />
        <WhoMark who="agent" />
        <WhoMark who="outside" label="Claude Code" />
        <WhoMark who="agent" label="" data-testid="quiet" />
      </>,
    )
    expect(screen.getByRole('img', { name: 'A person' })).toHaveClass('lm-who--person')
    expect(screen.getByRole('img', { name: 'The agent' })).toHaveClass('lm-who--agent')
    expect(screen.getByRole('img', { name: 'Claude Code' })).toHaveClass('lm-who--outside')
    expect(screen.getByTestId('quiet')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('JobRow', () => {
  it('shows a running job with its bar, a percentage, what it is doing, and Cancel', () => {
    const onCancel = vi.fn()
    render(
      <JobRow
        title="Export"
        state="running"
        progress={0.416}
        note="2 min left"
        onCancel={onCancel}
        data-testid="job"
      />,
    )
    const job = screen.getByTestId('job')
    expect(job.querySelector('.lm-state')).toHaveClass('lm-state--busy')
    expect(within(job).getByRole('progressbar', { name: 'Progress of Export' })).toHaveAttribute(
      'aria-valuenow',
      '42',
    )
    expect(job).toHaveTextContent('42%')
    expect(job).toHaveTextContent('2 min left')
    fireEvent.click(within(job).getByRole('button', { name: 'Cancel Export' }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('draws no bar for a job that cannot say how far along it is', () => {
    render(
      <JobRow
        title="Transcribe"
        state="running"
        progress={null}
        onCancel={() => {}}
        data-testid="job"
      />,
    )
    const job = screen.getByTestId('job')
    expect(within(job).queryByRole('progressbar')).toBeNull()
    expect(job).toHaveTextContent('Running')
  })

  it('shows how a job ended, with no Cancel, and the host’s own control', () => {
    const { rerender } = render(
      <JobRow
        title="Export"
        state="done"
        note="12:04, 84 MB"
        onCancel={() => {}}
        action={<TextButton cell>Show in Finder</TextButton>}
        data-testid="job"
      />,
    )
    const job = screen.getByTestId('job')
    expect(job.querySelector('.lm-state')).toHaveClass('lm-state--on')
    expect(within(job).queryByRole('button', { name: 'Cancel Export' })).toBeNull()
    expect(within(job).getByRole('button', { name: 'Show in Finder' })).toBeInTheDocument()
    expect(job).toHaveTextContent('12:04, 84 MB')

    rerender(<JobRow title="Export" state="failed" note="The disk is full" data-testid="job" />)
    expect(job.querySelector('.lm-state')).toHaveClass('lm-state--failed')
    expect(job.querySelector('.lm-job__note')).toHaveClass('lm-job__note--failed')

    rerender(<JobRow title="Export" state="cancelled" data-testid="job" />)
    expect(job.querySelector('.lm-state')).toHaveClass('lm-state--off')
    expect(job).toHaveTextContent('Cancelled')
  })
})

describe('LogRow', () => {
  it('says who called what and when, and that it was done', () => {
    render(
      <LogRow
        who="outside"
        name="Claude Code"
        title="Split the clip"
        time="12:04:09"
        outcome={{ ok: true, text: '2 clips' }}
        data-testid="row"
      />,
    )
    const row = screen.getByTestId('row')
    expect(row.querySelector('.lm-who')).toHaveClass('lm-who--outside')
    expect(row).toHaveTextContent('Claude CodeSplit the clip12:04:09')
    expect(row.querySelector('.lm-log__outcome')).toHaveTextContent('Done: 2 clips')
    expect(row.querySelector('.lm-log__args')).toBeNull()
    expect(within(row).queryByRole('button')).toBeNull()
  })

  it('says what was refused in the words it was refused with', () => {
    render(
      <LogRow
        who="agent"
        name="Agent"
        title="Ripple delete"
        time="12:05:11"
        outcome={{ ok: false, error: 'Nothing is selected.' }}
        hovered
        data-testid="row"
      />,
    )
    const row = screen.getByTestId('row')
    expect(row).toHaveClass('lm-log--hovered')
    const outcome = row.querySelector('.lm-log__outcome')
    expect(outcome).toHaveClass('lm-log__outcome--refused')
    expect(outcome).toHaveTextContent('Refused: Nothing is selected.')
  })

  it('shows the arguments when it is given them, and Undo with its label', () => {
    const onUndo = vi.fn()
    render(
      <LogRow
        who="agent"
        name="Agent"
        title="Split the clip"
        time="12:04:09"
        outcome={{ ok: true }}
        args='{"time":4.2}'
        undo={{ label: 'Undo to here', title: 'Takes back 3 steps', onUndo }}
        data-testid="row"
      />,
    )
    const row = screen.getByTestId('row')
    expect(row.querySelector('.lm-log__args')).toHaveTextContent('{"time":4.2}')
    expect(row.querySelector('.lm-log__outcome')).toHaveTextContent(/^Done$/)
    const undo = within(row).getByRole('button', { name: 'Undo to here' })
    expect(undo).toHaveAttribute('title', 'Takes back 3 steps')
    fireEvent.click(undo)
    expect(onUndo).toHaveBeenCalledOnce()
  })
})

describe('TranscriptWord', () => {
  it('is a button at rest, and reports a press with whether Shift was held', () => {
    const onSelect = vi.fn()
    render(<TranscriptWord text="hello" onSelect={onSelect} data-action="select_words" />)
    const word = screen.getByRole('button', { name: 'hello' })
    expect(word).toHaveClass('lm-word')
    expect(word).toHaveAttribute('aria-pressed', 'false')
    expect(word).toHaveAttribute('data-action', 'select_words')
    fireEvent.click(word)
    expect(onSelect).toHaveBeenLastCalledWith({ shiftKey: false })
    fireEvent.click(word, { shiftKey: true })
    expect(onSelect).toHaveBeenLastCalledWith({ shiftKey: true })
  })

  it('takes a class per state, and a removed word can still be pressed', () => {
    const onSelect = vi.fn()
    const { rerender } = render(<TranscriptWord text="um" state="filler" />)
    const word = screen.getByRole('button', { name: 'um' })
    expect(word).toHaveClass('lm-word--filler')
    rerender(<TranscriptWord text="um" state="selected" />)
    expect(word).toHaveClass('lm-word--selected')
    expect(word).toHaveAttribute('aria-pressed', 'true')
    rerender(<TranscriptWord text="um" state="now" />)
    expect(word).toHaveClass('lm-word--now')
    rerender(<TranscriptWord text="um" state="removed" onSelect={onSelect} />)
    expect(word).toHaveClass('lm-word--removed')
    expect(word).not.toBeDisabled()
    fireEvent.click(word)
    expect(onSelect).toHaveBeenCalledOnce()
  })

  it('shows a pause as its length, and a double press corrects the word', () => {
    const onEdit = vi.fn()
    render(<TranscriptWord text="1.4 s" state="removed" pause onEdit={onEdit} />)
    const pause = screen.getByRole('button', { name: '1.4 s' })
    expect(pause).toHaveClass('lm-word--pause', 'lm-word--removed')
    fireEvent.doubleClick(pause)
    expect(onEdit).toHaveBeenCalledOnce()
  })
})
