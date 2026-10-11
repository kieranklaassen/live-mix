// The one pattern for telling a person something in place: empty, loading,
// refused, failed, or needing a permission. A mark, a title that says what
// happened, a line that says what it means or what to do, and at most one
// button. The danger tone is for what stops the person. It is called
// `InlineNote` because `NotePin`, `NoteSpan` and `NoteBubble` are notes of
// another kind: what a person or an agent says about the work.

import { type HTMLAttributes, type ReactNode } from 'react'

import { Glyph } from './Glyph'
import { cx } from './tokens'

export interface InlineNoteProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  tone?: 'plain' | 'danger'
  /** What happened. */
  title: string
  /** What it means, or what to do. */
  children?: ReactNode
  /** One button at most (a `TextButton`). */
  action?: ReactNode
  /** `alert` interrupts a screen reader, `status` waits its turn; without one the note is plain text. */
  role?: 'status' | 'alert'
  'data-testid'?: string
}

export function InlineNote({
  tone = 'plain',
  title,
  children,
  action,
  role,
  className,
  ...rest
}: InlineNoteProps) {
  return (
    <div
      role={role}
      className={cx('lm-inline-note', tone === 'danger' && 'lm-inline-note--danger', className)}
      {...rest}
    >
      <Glyph kind={tone === 'danger' ? 'alert' : 'info'} className="lm-inline-note__mark" />
      <div className="lm-inline-note__body">
        <p className="lm-inline-note__title">{title}</p>
        {children ? <p className="lm-inline-note__text">{children}</p> : null}
      </div>
      {action}
    </div>
  )
}
