// A min/max peak outline as one SVG polygon, from the peaks the `SampleStore`
// computes at decode time (`computePeaks`) — nothing here decodes or reads
// audio. Scales to any box through `preserveAspectRatio="none"`.

import { type CSSProperties } from 'react'

import { type Clip } from '../../core/clips/Clip'
import { slicePeaks, type WaveformPeaks } from '../../core/clips/peaks'
import { type LoadedSample } from '../../core/tracks/SampleStore'
import { cx, tokenRef } from './tokens'

export interface WaveformProps {
  peaks: WaveformPeaks
  /** CSS size; defaults fill the parent. */
  width?: number | string
  height?: number | string
  /** Fill colour; defaults to the `text` token. */
  fill?: string
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

/** SVG path of the outline: the maxima left to right, the minima back. */
export function waveformPath(peaks: WaveformPeaks): string {
  const count = Math.min(peaks.min.length, peaks.max.length)
  if (count === 0) return ''
  const parts: string[] = []
  for (let index = 0; index < count; index += 1) {
    const y = 1 - Math.min(1, Math.max(-1, peaks.max[index]))
    parts.push(`${index === 0 ? 'M' : 'L'} ${index} ${y.toFixed(4)}`)
  }
  for (let index = count - 1; index >= 0; index -= 1) {
    const y = 1 - Math.min(1, Math.max(-1, peaks.min[index]))
    parts.push(`L ${index} ${y.toFixed(4)}`)
  }
  parts.push('Z')
  return parts.join(' ')
}

/** The peaks covering a clip's audible slice of a loaded sample, or null without peaks. */
export function clipPeaks(sample: LoadedSample | undefined, clip: Clip): WaveformPeaks | null {
  if (!sample?.peaks) return null
  return slicePeaks(sample.peaks, clip.offsetSec, clip.durationSec, sample.durationSec)
}

export function Waveform({
  peaks,
  width = '100%',
  height = '100%',
  fill,
  className,
  style,
  'data-testid': testId,
}: WaveformProps) {
  const count = Math.min(peaks.min.length, peaks.max.length)
  return (
    <svg
      className={cx('lm-waveform', className)}
      style={style}
      width={width}
      height={height}
      viewBox={`0 0 ${Math.max(1, count - 1)} 2`}
      preserveAspectRatio="none"
      aria-hidden="true"
      data-testid={testId}
    >
      {count > 0 ? (
        <path d={waveformPath(peaks)} fill={fill ?? tokenRef('text', '#1A1A1A')} stroke="none" />
      ) : null}
    </svg>
  )
}
