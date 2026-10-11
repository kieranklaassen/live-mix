// One word of a transcript, as a button at the reading size. Its state says
// what the word is to the edit: selected, removed (struck through on a wash,
// still readable and focusable so it can be restored), a filler (a dotted
// underline), or the word at the playhead (a solid underline). A removed
// pause shows its length in mono. A removal is a run of words in the removed
// state; on a timeline the same removal is a `CutSeam`. Every other attribute
// and the ref go to the `button`.

import { forwardRef, type ButtonHTMLAttributes } from 'react'

import { cx } from './tokens'

export type TranscriptWordState = 'rest' | 'selected' | 'removed' | 'filler' | 'now'

export interface TranscriptWordProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onSelect'
> {
  text: string
  state?: TranscriptWordState
  /** The word is a pause: its text is a length, drawn in mono. */
  pause?: boolean
  /** A press. The event says whether Shift was held, for a host that extends a selection. */
  onSelect?: (event: { shiftKey: boolean }) => void
  /** A double press: the host corrects the word's text in place. */
  onEdit?: () => void
}

export const TranscriptWord = forwardRef<HTMLButtonElement, TranscriptWordProps>(
  function TranscriptWord(
    { text, state = 'rest', pause = false, onSelect, onEdit, className, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={state === 'selected'}
        className={cx(
          'lm-word',
          state !== 'rest' && `lm-word--${state}`,
          pause && 'lm-word--pause',
          className,
        )}
        onClick={(event) => onSelect?.({ shiftKey: event.shiftKey })}
        onDoubleClick={() => onEdit?.()}
        {...rest}
      >
        {text}
      </button>
    )
  },
)
