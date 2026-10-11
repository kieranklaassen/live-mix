// Two rows a pane lists: long-running work, and a call somebody made. Each
// is two lines of one row of the module. A job says what it is, how far along
// it is and how it ended. A call says who made it (a shape and a name), what
// was called, when, and whether it was done or refused, in the words it was
// refused with. Presentational: the host owns the jobs and the log.

import { type HTMLAttributes, type ReactNode } from 'react'

import { Progress, StateMark, WhoMark, type StateMarkState, type Who } from './marks'
import { TextButton } from './TextButton'
import { cx } from './tokens'

export type JobRowState = 'running' | 'done' | 'failed' | 'cancelled' | 'waiting'

const JOB_MARKS: Record<JobRowState, StateMarkState> = {
  running: 'busy',
  done: 'on',
  failed: 'failed',
  cancelled: 'off',
  waiting: 'off',
}

const JOB_WORDS: Record<JobRowState, string> = {
  running: 'Running',
  done: 'Done',
  failed: 'Failed',
  cancelled: 'Cancelled',
  waiting: 'Waiting',
}

export interface JobRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: string
  state: JobRowState
  /** 0 … 1 while running; null or left out when the job cannot say. */
  progress?: number | null
  /** What it is doing, the time left, when and how large it ended, or why it failed. */
  note?: string
  /** Shows Cancel while the job runs. */
  onCancel?: () => void
  /** A control of the host's own at the end of the first line (Show in Finder, Try again, or its own Cancel). */
  action?: ReactNode
  'data-testid'?: string
}

export function JobRow({
  title,
  state,
  progress,
  note,
  onCancel,
  action,
  className,
  ...rest
}: JobRowProps) {
  const running = state === 'running'
  const share = typeof progress === 'number' && Number.isFinite(progress) ? progress : null
  return (
    <div className={cx('lm-job', `lm-job--${state}`, className)} {...rest}>
      <div className="lm-job__line">
        <StateMark state={JOB_MARKS[state]} />
        <span className="lm-job__title" title={title}>
          {title}
        </span>
        {running && onCancel ? (
          <TextButton cell onClick={onCancel} aria-label={`Cancel ${title}`}>
            Cancel
          </TextButton>
        ) : null}
        {action}
      </div>
      <div className="lm-job__line lm-job__line--second">
        {running && share !== null ? (
          <>
            <Progress value={share} label={`Progress of ${title}`} />
            <span className="lm-num">{Math.round(Math.min(Math.max(share, 0), 1) * 100)}%</span>
          </>
        ) : null}
        <span className={cx('lm-job__note', state === 'failed' && 'lm-job__note--failed')}>
          {note ?? JOB_WORDS[state]}
        </span>
      </div>
    </div>
  )
}

export type LogRowOutcome = { ok: true; text?: string } | { ok: false; error: string }

export interface LogRowUndo {
  /** "Undo" on the newest changing row, "Undo to here" on an older one. */
  label: string
  /** Says how many steps go, on an older row. */
  title?: string
  onUndo: () => void
}

export interface LogRowProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  who: Who
  /** Who made the call, by name. */
  name: string
  /** What was called, in a few words. */
  title: string
  /** When, already formatted. */
  time: string
  outcome: LogRowOutcome
  /** The arguments as one line of JSON; the host gives them when the row is opened. */
  args?: string
  undo?: LogRowUndo
  /** The pointer is on the row: the host lights what the call changed. */
  hovered?: boolean
  /** A control of the host's own at the end of the second line. */
  action?: ReactNode
  'data-testid'?: string
}

export function LogRow({
  who,
  name,
  title,
  time,
  outcome,
  args,
  undo,
  hovered = false,
  action,
  className,
  ...rest
}: LogRowProps) {
  return (
    <div className={cx('lm-log', hovered && 'lm-log--hovered', className)} {...rest}>
      <div className="lm-log__line">
        <WhoMark who={who} />
        <span className="lm-log__who">{name}</span>
        <span className="lm-log__title" title={title}>
          {title}
        </span>
        <span className="lm-num lm-log__time">{time}</span>
      </div>
      <div className="lm-log__line lm-log__line--second">
        {outcome.ok ? (
          <span className="lm-log__outcome">Done{outcome.text ? `: ${outcome.text}` : ''}</span>
        ) : (
          <span className="lm-log__outcome lm-log__outcome--refused">Refused: {outcome.error}</span>
        )}
        {undo ? (
          <TextButton cell onClick={undo.onUndo} title={undo.title}>
            {undo.label}
          </TextButton>
        ) : null}
        {action}
      </div>
      {args ? <div className="lm-log__args">{args}</div> : null}
    </div>
  )
}
