// A `Stroke` for a picture: one clip of video on a lane. The same ring and
// wash in the brush colour, and inside it the clip's own frames instead of a
// waveform: a strip of thumbnails at about a quarter strength, or flat frames
// in the brush until thumbnails exist. On top: a tick per recorded click, the
// tag with the source's name and its readouts, an automation line for a speed
// ramp, and the selected, linked, muted and missing states. Presentational
// only: geometry comes in as px and fractions; pointer handlers, `data-*` and
// the ref go to the root.

import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react'

import { brushIndex } from './Lane'
import { type StrokeAutomation } from './Stroke'
import { automationPositions } from './stroke-math'
import { cx } from './tokens'

/** How far apart frames are drawn, and how far they sit inside the ring, on a lane of each height. */
export const VIDEO_FRAME_PX = { 40: 44, 20: 14 } as const
export const VIDEO_FRAME_INSET_PX = { 40: 6, 20: 4 } as const

export interface VideoStrokeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /** Px length: the clip's time on the field's scale. */
  width: number
  /** One row of the module or two. */
  height: 20 | 40
  /** Brush colour, 1 … 6 (wraps). */
  brush?: number
  name?: string
  /** Thumbnail URLs spread along the stroke, first to last; without them it draws flat frames. */
  frames?: readonly string[]
  /** Recorded clicks as fractions of the width. */
  hits?: readonly number[]
  /** Short readouts after the name: a speed, `unlinked`. */
  tags?: readonly string[]
  /** A speed ramp: the line and its square nodes, in the automation colour. */
  automation?: StrokeAutomation | null
  selected?: boolean
  /** Another clip of its link group is selected. */
  linked?: boolean
  muted?: boolean
  /** The clip's media is not there: a dashed ring, and the tag says so. */
  missing?: boolean
  /** Px the tag sits in from the left, for a clip that starts off screen. */
  tagInset?: number
  'data-testid'?: string
}

export const VideoStroke = forwardRef<HTMLDivElement, VideoStrokeProps>(function VideoStroke(
  {
    width,
    height,
    brush = 1,
    name,
    frames,
    hits,
    tags,
    automation = null,
    selected = false,
    linked = false,
    muted = false,
    missing = false,
    tagInset,
    className,
    style,
    ...rest
  },
  ref,
) {
  const small = height === 20
  const mid = height / 2
  const framePx = VIDEO_FRAME_PX[height]
  const inset = VIDEO_FRAME_INSET_PX[height]
  const nodes = automation ? automationPositions(automation.points, width, height) : []
  const rootStyle: CSSProperties = { width, height, borderRadius: mid, ...style }
  const frameVars: Record<string, string> = { '--lm-vstroke-frame': `${framePx}px` }

  return (
    <div
      ref={ref}
      className={cx(
        'lm-vstroke',
        `lm-vstroke--b${brushIndex(brush)}`,
        small && 'lm-vstroke--small',
        selected && 'lm-vstroke--selected',
        linked && !selected && 'lm-vstroke--linked',
        muted && 'lm-vstroke--muted',
        missing && 'lm-vstroke--missing',
        className,
      )}
      style={rootStyle}
      {...rest}
    >
      <div
        className={cx('lm-vstroke__frames', !frames?.length && 'lm-vstroke__frames--flat')}
        style={{ top: inset, bottom: inset, ...(frameVars as CSSProperties) }}
        aria-hidden="true"
      >
        {frames?.map((url, index) => (
          // By its place: the same frame may stand for two places along a still clip.
          <img
            key={index}
            className="lm-vstroke__frame"
            src={url}
            alt=""
            draggable={false}
            style={{ width: framePx - 1 }}
          />
        ))}
      </div>
      {hits?.map((hit, index) => (
        <span
          key={index}
          className="lm-vstroke__hit"
          style={{ left: Math.min(Math.max(hit, 0), 1) * width }}
          aria-hidden="true"
        />
      ))}
      {nodes.length > 0 || selected ? (
        <svg
          className="lm-vstroke__svg"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          aria-hidden="true"
        >
          {nodes.length > 0 ? (
            <g className="lm-stroke__automation">
              <path
                className="lm-stroke__automation-line"
                d={`M${nodes.map(([x, y]) => `${x} ${y}`).join('L')}`}
              />
              {nodes.map(([x, y], index) => (
                <rect
                  key={index}
                  className="lm-stroke__automation-node"
                  x={x - 2.5}
                  y={y - 2.5}
                  width={5}
                  height={5}
                />
              ))}
            </g>
          ) : null}
          {selected ? (
            <path
              className="lm-stroke__grips"
              d={`M5.5 ${mid - 5}V${mid + 5}M8.5 ${mid - 5}V${mid + 5}M${width - 5.5} ${mid - 5}V${mid + 5}M${width - 8.5} ${mid - 5}V${mid + 5}`}
            />
          ) : null}
        </svg>
      ) : null}
      {name || missing || muted || tags?.length || automation?.label ? (
        <span
          className="lm-vstroke__tag"
          style={tagInset === undefined ? undefined : { left: tagInset }}
        >
          {name ? <span className="lm-vstroke__name">{name}</span> : null}
          {tags?.map((tag) => (
            <span key={tag} className="lm-vstroke__meta">
              {tag}
            </span>
          ))}
          {missing ? <span className="lm-vstroke__meta">missing</span> : null}
          {muted ? <span className="lm-vstroke__meta">muted</span> : null}
          {automation?.label ? <span className="lm-vstroke__auto">{automation.label}</span> : null}
        </span>
      ) : null}
    </div>
  )
})
