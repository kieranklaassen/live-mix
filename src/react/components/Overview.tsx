// The whole of a timeline in one row: its cuts, its notes, the playhead, and
// a box for the part the lanes show. Pressing or dragging in it moves the box
// and reports where the lanes should start. Everything is placed by its share
// of the duration, so the row is as wide as its host makes it.

import { useRef, type CSSProperties, type HTMLAttributes, type PointerEvent } from 'react'

import { cx } from './tokens'

export interface OverviewProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onScroll'> {
  /** Seconds the row stands for. */
  duration: number
  /** Seconds at the left and right edge of what the lanes show. */
  windowStart: number
  windowEnd: number
  /** Seconds. */
  playhead: number
  cuts?: readonly number[]
  notes?: readonly number[]
  /** Called with the second the lanes should start at while the box is dragged. */
  onScroll?: (start: number) => void
  'data-testid'?: string
}

const share = (time: number, duration: number): string =>
  `${(duration > 0 ? Math.min(Math.max(time / duration, 0), 1) : 0) * 100}%`

export function Overview({
  duration,
  windowStart,
  windowEnd,
  playhead,
  cuts,
  notes,
  onScroll,
  className,
  style,
  ...rest
}: OverviewProps) {
  // Where in the box the press landed, in seconds, while a drag is under way.
  const grab = useRef<number | null>(null)
  const span = Math.max(0, windowEnd - windowStart)

  const timeAt = (event: PointerEvent<HTMLDivElement>): number => {
    const box = event.currentTarget.getBoundingClientRect()
    return box.width > 0 ? ((event.clientX - box.left) / box.width) * duration : 0
  }
  const scrollTo = (time: number, offset: number): void => {
    onScroll?.(Math.min(Math.max(time - offset, 0), Math.max(0, duration - span)))
  }

  const box: CSSProperties = {
    left: share(windowStart, duration),
    width: share(span, duration),
  }

  return (
    <div
      className={cx('lm-overview', className)}
      style={style}
      onPointerDown={(event) => {
        const time = timeAt(event)
        // A press on the box keeps hold of it where it was pressed; one beside it centres the box there.
        grab.current = time >= windowStart && time <= windowEnd ? time - windowStart : span / 2
        event.currentTarget.setPointerCapture?.(event.pointerId)
        scrollTo(time, grab.current)
      }}
      onPointerMove={(event) => {
        if (grab.current !== null) scrollTo(timeAt(event), grab.current)
      }}
      onPointerUp={() => {
        grab.current = null
      }}
      onPointerCancel={() => {
        grab.current = null
      }}
      {...rest}
    >
      <span className="lm-overview__window" style={box} aria-hidden="true" />
      {cuts?.map((cut, index) => (
        <span
          key={`cut-${index}`}
          className="lm-overview__cut"
          style={{ left: share(cut, duration) }}
          aria-hidden="true"
        />
      ))}
      {notes?.map((note, index) => (
        <span
          key={`note-${index}`}
          className="lm-overview__note"
          style={{ left: share(note, duration) }}
          aria-hidden="true"
        />
      ))}
      <span
        className="lm-overview__playhead"
        style={{ left: share(playhead, duration) }}
        aria-hidden="true"
      />
    </div>
  )
}
