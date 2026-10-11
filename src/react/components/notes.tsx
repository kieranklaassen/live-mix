// A note: something said about the work, pinned where it applies. Notes
// take a colour role of their own (`--lm-note`) and, because hue alone is not
// enough, a note is also always a numbered square tab. The tab's fill says who
// and what state: filled is a person's open note, the same with an arrow has
// been sent, outlined in the note colour is an agent's, outlined in grey with
// a tick is resolved. The same tab is on the timeline, on the picture, in a
// chip and in an answer.
//
// On a picture the marks cannot use a scheme's colours, because the picture
// is whatever was recorded: they are `--lm-note-mark` with a `--lm-mark-edge`
// line around them in every theme.
//
// Presentational: the host owns the notes, their anchors and their text.

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
} from 'react'

import { Glyph } from './Glyph'
import { cx } from './tokens'

export type NoteState = 'open' | 'sent' | 'resolved'
export type NoteFrom = 'person' | 'agent'

export interface NoteTabProps {
  number: number
  state?: NoteState
  from?: NoteFrom
  className?: string
  style?: CSSProperties
}

/** The numbered square every note carries. */
export function NoteTab({
  number,
  state = 'open',
  from = 'person',
  className,
  style,
}: NoteTabProps) {
  return (
    <span
      className={cx(
        'lm-notetab',
        from === 'agent' && 'lm-notetab--agent',
        state === 'resolved' && 'lm-notetab--resolved',
        className,
      )}
      style={style}
    >
      {number}
      {state === 'sent' ? <Glyph kind="sent" size={8} /> : null}
      {state === 'resolved' ? <Glyph kind="tick" size={8} /> : null}
    </span>
  )
}

/** What a note's state is called, for its accessible name. */
function noteWords(number: number, text: string, state: NoteState, from: NoteFrom): string {
  const who = from === 'agent' ? 'Note from the agent' : 'Note'
  const how = state === 'sent' ? ', sent' : state === 'resolved' ? ', resolved' : ''
  return `${who} ${number}${how}: ${text}`
}

export interface NotePinProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Px from the left edge of the notes lane. */
  x: number
  number: number
  text: string
  state?: NoteState
  from?: NoteFrom
  /** The line down from the pin through the lanes below, `height` px long. */
  line?: { height: number }
  selected?: boolean
}

/** A note on a timeline: its tab and the start of its text at a moment. */
export const NotePin = forwardRef<HTMLButtonElement, NotePinProps>(function NotePin(
  {
    x,
    number,
    text,
    state = 'open',
    from = 'person',
    line,
    selected = false,
    className,
    style,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={selected}
      aria-label={noteWords(number, text, state, from)}
      className={cx(
        'lm-notepin',
        from === 'agent' && 'lm-notepin--agent',
        state === 'resolved' && 'lm-notepin--resolved',
        selected && 'lm-notepin--selected',
        className,
      )}
      style={{ left: x, ...style }}
      {...rest}
    >
      <NoteTab number={number} state={state} from={from} />
      <span className="lm-notepin__text">{text}</span>
      {line ? (
        <span
          className={cx('lm-noteline', state === 'resolved' && 'lm-noteline--resolved')}
          style={{ height: line.height }}
          aria-hidden="true"
        />
      ) : null}
    </button>
  )
})

export interface NoteSpanProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  x: number
  width: number
  'data-testid'?: string
}

/** The stretch of time a note is about: a wash with an edge at each end, under its pin. */
export function NoteSpan({ x, width, className, style, ...rest }: NoteSpanProps) {
  return (
    <div
      aria-hidden="true"
      className={cx('lm-notespan', className)}
      style={{ left: x, width: Math.max(0, width), ...style }}
      {...rest}
    />
  )
}

export type PicturePoint = readonly [number, number]

export interface PictureMarkProps {
  kind: 'box' | 'arrow' | 'line'
  /** Output px. A box and an arrow take two points; a line takes every point it passes through. */
  points: readonly PicturePoint[]
  /** The note's number, shown as its tab where the mark starts. */
  number?: number
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

/** The two barbs of an arrow's head at `to`, coming from `from`. */
function arrowHead(from: PicturePoint, to: PicturePoint, size = 9): string {
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0])
  const barb = (turn: number): string => {
    const x = to[0] - size * Math.cos(angle + turn)
    const y = to[1] - size * Math.sin(angle + turn)
    return `${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return `M${barb(0.45)}L${to[0]} ${to[1]}L${barb(-0.45)}`
}

/** A box, an arrow or a line drawn on a picture for a note, with the dark edge under it. */
export function PictureMark({
  kind,
  points,
  number,
  className,
  style,
  'data-testid': testId,
}: PictureMarkProps) {
  const [first, second] = points
  if (!first) return null
  let shape: string
  if (kind === 'box') {
    const other = second ?? first
    const x = Math.min(first[0], other[0])
    const y = Math.min(first[1], other[1])
    shape = `M${x} ${y}H${Math.max(first[0], other[0])}V${Math.max(first[1], other[1])}H${x}Z`
  } else {
    const through = kind === 'arrow' ? points.slice(0, 2) : points
    shape = `M${through.map(([x, y]) => `${x} ${y}`).join('L')}`
    if (kind === 'arrow' && second) shape += arrowHead(first, second)
  }
  return (
    <div
      className={cx('lm-mark', `lm-mark--${kind}`, className)}
      style={style}
      data-testid={testId}
    >
      <svg className="lm-mark__svg" width={1} height={1} aria-hidden="true">
        <path className="lm-mark__edge" d={shape} />
        <path className="lm-mark__line" d={shape} />
      </svg>
      {number === undefined ? null : (
        <NoteTab
          number={number}
          className="lm-mark__tab"
          style={{ left: first[0], top: first[1] }}
        />
      )}
    </div>
  )
}

export interface NoteBubbleProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  number: number
  text: string
  /** The note is being written: a caret after the text. */
  editing?: boolean
  'data-testid'?: string
}

/** The note's words beside its mark on a picture. One look in every theme, like the mark. */
export function NoteBubble({ number, text, editing = false, className, ...rest }: NoteBubbleProps) {
  return (
    <div className={cx('lm-notebubble', className)} {...rest}>
      <NoteTab number={number} />
      <span className="lm-notebubble__text">{text}</span>
      {editing ? <span className="lm-notebubble__caret" aria-hidden="true" /> : null}
    </div>
  )
}
