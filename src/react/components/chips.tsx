// What goes with an ask, what an answer points at, and what an agent just
// changed. A `ContextChip` is one thing sent along with what a person asks:
// what is selected, a note, or a frame, with an x that leaves it out. A
// `ReferenceChip` is a moment, a span or an item named in an answer, as a
// button that goes there. A `ChangedMark` sits on something an agent changed
// until the person's next act.

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react'

import { Glyph } from './Glyph'
import { NoteTab, type NoteFrom, type NoteState } from './notes'
import { cx } from './tokens'

export interface ContextChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  kind: 'selection' | 'note' | 'frame'
  /** Rendered first on a selection (the item's `Glyph`). */
  glyph?: ReactNode
  /** The note's number, on a note chip. */
  number?: number
  noteState?: NoteState
  noteFrom?: NoteFrom
  /** The item's name, or the start of the note's text. */
  text: string
  /** Its times, already formatted. */
  time?: string
  /** A thumbnail of the marked frame, 28 by 16 px. */
  frameUrl?: string
  /** Shows the x, which leaves the chip out of this one ask. */
  onRemove?: () => void
  /** Attributes for the x (`data-*`, a `title`). */
  removeProps?: ButtonHTMLAttributes<HTMLButtonElement> & Record<`data-${string}`, string>
  'data-testid'?: string
}

export function ContextChip({
  kind,
  glyph,
  number,
  noteState,
  noteFrom,
  text,
  time,
  frameUrl,
  onRemove,
  removeProps,
  className,
  ...rest
}: ContextChipProps) {
  return (
    <span className={cx('lm-chip', `lm-chip--${kind}`, className)} {...rest}>
      {frameUrl ? <img className="lm-chip__frame" src={frameUrl} alt="" /> : null}
      {number === undefined ? null : <NoteTab number={number} state={noteState} from={noteFrom} />}
      {glyph}
      <span className="lm-chip__text">{text}</span>
      {time ? <span className="lm-num">{time}</span> : null}
      {onRemove ? (
        <button
          type="button"
          className="lm-chip__x"
          aria-label={`Leave out ${text}`}
          onClick={onRemove}
          {...removeProps}
        >
          <Glyph kind="close" size={8} />
        </button>
      ) : null}
    </span>
  )
}

export interface ReferenceChipProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick'
> {
  kind: 'moment' | 'span' | 'item'
  /** A time, two times, or an item's name. */
  label: string
  /** Rendered before the label on an item. */
  glyph?: ReactNode
  /** Goes there: the host moves the playhead, selects the range, or selects the item. */
  onGo: () => void
}

export const ReferenceChip = forwardRef<HTMLButtonElement, ReferenceChipProps>(
  function ReferenceChip({ kind, label, glyph, onGo, className, ...rest }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={cx('lm-ref', `lm-ref--${kind}`, className)}
        onClick={onGo}
        {...rest}
      >
        {glyph}
        {label}
      </button>
    )
  },
)

export interface ChangedMarkProps {
  /** The agent inside the app, or one from outside (default `agent`). */
  who?: 'agent' | 'outside'
  /** Accessible name (default says an agent changed this). */
  label?: string
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

/** An 11 px square holding the agent's own square; the host places it at an item's top left. */
export function ChangedMark({
  who = 'agent',
  label,
  className,
  style,
  'data-testid': testId,
}: ChangedMarkProps) {
  const name = label ?? (who === 'outside' ? 'Changed by an outside agent' : 'Changed by the agent')
  return (
    <span
      role="img"
      aria-label={name}
      className={cx('lm-changed', who === 'outside' && 'lm-changed--outside', className)}
      style={style}
      data-testid={testId}
    />
  )
}
