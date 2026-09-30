// A painted stroke: one sound on the paint field. A thin ring in the brush
// colour with the sound's own waveform inside — a soft halo, the filled
// shape, fine bars — so a bowl strike, a pad swell and steady rain read
// differently at a glance. On top of that it draws what a clip in a DAW
// shows: fades (the curve closes toward the centre line), repeats (later
// passes sit back behind a dashed seam), detected hits, an automation line,
// and the selected and muted states. Presentational only: geometry comes in
// as px and fractions, pointer handlers and `data-*` pass through to the root.

import { useMemo, type CSSProperties, type HTMLAttributes } from 'react'

import { type SoundKind } from '../../core/analysis/sound-kind'
import { type WaveformPeaks } from '../../core/clips/peaks'
import { SoundIcon } from './SoundIcon'
import {
  automationPositions,
  capInset,
  fadeGainAt,
  fadePaths,
  hitPositions,
  levelsBarsPath,
  levelsOutlinePath,
  repeatSeams,
  strokeLevels,
} from './stroke-math'
import { BRUSH_COUNT, cx } from './tokens'

export interface StrokeAutomation {
  /** What the line controls ("Level", "Reverb"). */
  label?: string
  /** Breakpoints as `[t, value]`, both 0..1 across the stroke. */
  points: readonly (readonly [number, number])[]
}

export interface StrokeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  /** Size in px; the field decides both (length is time, height is the brush size). */
  width: number
  height: number
  /** Brush colour, 1 … 6 (wraps). */
  brush?: number
  name?: string
  kind?: SoundKind
  /** One pass of the audible slice of the source. */
  peaks?: WaveformPeaks | null
  /** Passes of the source across the stroke; above 1 the sound repeats. */
  repeats?: number
  /** Fade lengths as fractions of the width. */
  fadeIn?: number
  fadeOut?: number
  /** Leave the faded part unshaded, for a fade that is a crossfade with a neighbour. */
  crossfade?: boolean
  /** Detected hits as fractions of one pass. */
  hits?: readonly number[]
  automation?: StrokeAutomation | null
  selected?: boolean
  muted?: boolean
  reversed?: boolean
  /** Linear gain applied to the drawn waveform. */
  gain?: number
  /** Short readouts after the name: tempo, gain. */
  tags?: readonly string[]
  'data-testid'?: string
}

function formatRepeats(repeats: number): string {
  return `×${Number(repeats.toFixed(1))}`
}

export function Stroke({
  width,
  height,
  brush = 1,
  name,
  kind,
  peaks = null,
  repeats = 1,
  fadeIn = 0,
  fadeOut = 0,
  crossfade = false,
  hits,
  automation = null,
  selected = false,
  muted = false,
  reversed = false,
  gain = 1,
  tags,
  className,
  style,
  ...rest
}: StrokeProps) {
  const mid = height / 2
  const looping = repeats > 1 + 1e-6
  // Transients stay sharp on anything with hits; sustained sounds are smoothed.
  const window = hits && hits.length > 0 ? 0 : 2

  const paths = useMemo(() => {
    const levels = strokeLevels({ width, height, peaks, repeats, fadeIn, fadeOut, gain, reversed })
    return {
      halo: levelsOutlinePath(levels, mid, width, 1.4, window + 1),
      wave: levelsOutlinePath(levels, mid, width, 1, window),
      bars: levelsBarsPath(
        levels.filter((_, index) => index % 2 === 0),
        mid,
      ),
    }
  }, [width, height, peaks, repeats, fadeIn, fadeOut, gain, reversed, mid, window])

  const seams = looping ? repeatSeams(repeats, width) : []
  const firstPass = width / Math.max(repeats, 1)
  const hitXs = hits ? hitPositions(hits, repeats, width, reversed) : []
  const fadeInPaths = fadeIn > 0 ? fadePaths(fadeIn, width, height) : null
  const fadeOutPaths = fadeOut > 0 ? fadePaths(fadeOut, width, height, true) : null
  const nodes = automation ? automationPositions(automation.points, width, height) : []
  const brushIndex = ((Math.round(brush) - 1 + BRUSH_COUNT * 100) % BRUSH_COUNT) + 1
  const tall = height >= 60
  const tagLeft = Math.max(6, mid - 6) + fadeIn * width
  const tagTop = tall ? 4 : mid - 8
  const autoRight = Math.max(8, mid - 4) + fadeOut * width

  const rootStyle: CSSProperties = { width, height, borderRadius: mid, ...style }

  return (
    <div
      className={cx(
        'lm-stroke',
        `lm-stroke--b${brushIndex}`,
        selected && 'lm-stroke--selected',
        muted && 'lm-stroke--muted',
        className,
      )}
      style={rootStyle}
      {...rest}
    >
      <svg
        className="lm-stroke__svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
      >
        <path className="lm-stroke__halo" d={paths.halo} />
        <path className="lm-stroke__wave" d={paths.wave} />
        <path className="lm-stroke__bars" d={paths.bars} />
        {looping ? (
          <rect
            className="lm-stroke__repeat"
            x={firstPass}
            y={0}
            width={Math.max(0, width - firstPass)}
            height={height}
          />
        ) : null}
        {seams.map((x) => (
          <g key={`seam-${x}`} className="lm-stroke__seam">
            <path className="lm-stroke__seam-line" d={`M${x + 0.5} 0V${height}`} />
            <path
              className="lm-stroke__seam-notch"
              d={`M${x - 2.5} 0H${x + 3.5}L${x + 0.5} 4ZM${x - 2.5} ${height}H${x + 3.5}L${x + 0.5} ${height - 4}Z`}
            />
          </g>
        ))}
        {hitXs.map((x, index) => {
          const top = capInset(x, width, height)
          const level = fadeGainAt(x / width, fadeIn, fadeOut)
          return (
            <g key={`hit-${index}`} className="lm-stroke__hit" opacity={0.3 + 0.7 * level}>
              <path
                className="lm-stroke__hit-line"
                d={`M${x + 0.5} ${(top + 2).toFixed(1)}V${(height - top - 2).toFixed(1)}`}
              />
              <circle
                className="lm-stroke__hit-dot"
                cx={x + 0.5}
                cy={Number((top + 3).toFixed(1))}
                r={1.5}
              />
            </g>
          )
        })}
        {[fadeInPaths, fadeOutPaths].map((fade, index) =>
          fade ? (
            <g key={index === 0 ? 'fade-in' : 'fade-out'} className="lm-stroke__fade">
              {crossfade ? null : <path className="lm-stroke__fade-shade" d={fade.shade} />}
              <path className="lm-stroke__fade-curve" d={fade.curve} />
              <circle
                className="lm-stroke__fade-handle"
                cx={fade.handle[0]}
                cy={fade.handle[1]}
                r={2.5}
              />
            </g>
          ) : null,
        )}
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
      {name ? (
        <span className="lm-stroke__tag" style={{ left: tagLeft, top: tagTop }}>
          {kind ? <SoundIcon kind={kind} size={9} /> : null}
          <span className="lm-stroke__name">{name}</span>
          {tags?.map((tag) => (
            <span key={tag} className="lm-stroke__meta">
              {tag}
            </span>
          ))}
          {looping ? (
            <>
              <SoundIcon kind="loop" size={9} />
              <span className="lm-stroke__meta">{formatRepeats(repeats)}</span>
            </>
          ) : null}
          {reversed ? <SoundIcon kind="reverse" size={9} /> : null}
          {muted ? <span className="lm-stroke__meta">muted</span> : null}
        </span>
      ) : null}
      {automation?.label ? (
        <span
          className="lm-stroke__automation-label"
          style={{ right: autoRight, bottom: tall ? 4 : mid - 8 }}
        >
          {automation.label}
        </span>
      ) : null}
    </div>
  )
}
