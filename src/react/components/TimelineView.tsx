// The arrangement: one lane per clip source with the clips placed in seconds,
// what is sounding and upcoming from `useSchedule` (the Scheduler's own
// window function, so the view shows exactly what will play), the loop
// region and a playhead sampled from the transport. Read-only apart from
// seeking by clicking the ruler.

import { useCallback, useRef, type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react'

import { type Clip } from '../../core/clips/Clip'
import { type ClipList } from '../../core/tracks/ClipList'
import { type SampleStore } from '../../core/tracks/SampleStore'
import { type Transport } from '../../core/transport/Transport'
import { useSchedule, type ClipSource } from '../hooks/useClips'
import { useMaybeEngine } from '../hooks/useEngine'
import { useTransport } from '../hooks/useTransport'
import { useExternalSnapshot } from '../store'
import { formatTimeSec } from './control-math'
import { cx } from './tokens'
import { clipPeaks, Waveform } from './Waveform'

export interface TimelineLane {
  name: string
  source: ClipSource
}

/** A lane spec, or anything with a name and clips (an `AudioTrack`, an `ElementTrack`). */
export type TimelineLaneInput = TimelineLane | (ClipSource & { readonly name: string })

export interface TimelineViewProps {
  /** Defaults to the provided engine's audio tracks. */
  lanes?: readonly TimelineLaneInput[]
  /** Defaults to the provided engine's transport. */
  transport?: Transport
  /** Horizontal scale (default 40). */
  pixelsPerSecond?: number
  /** Visible length; defaults to the last clip end, the loop length or the playhead + 8 s, at least 16 s. */
  durationSec?: number
  /** How far ahead clips count as upcoming (default 8). */
  horizonSec?: number
  /** Playhead refresh rate while playing (default 30). */
  fps?: number
  /** Click the ruler or a lane background to seek (default true). */
  seekOnClick?: boolean
  /** Where to find decoded samples for waveforms; defaults to the provided engine's store. */
  samples?: SampleStore | null
  showWaveforms?: boolean
  onClipClick?: (clip: Clip, lane: TimelineLane) => void
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

function toLane(input: TimelineLaneInput): TimelineLane {
  return 'source' in input ? input : { name: input.name, source: input }
}

function listOf(source: ClipSource): ClipList {
  return 'clips' in source ? source.clips : source
}

/** The same array instance while its members are the same, so subscriptions do not churn. */
function useStableArray<T>(items: readonly T[]): readonly T[] {
  const ref = useRef(items)
  if (
    ref.current.length !== items.length ||
    items.some((item, index) => item !== ref.current[index])
  ) {
    ref.current = items
  }
  return ref.current
}

/** The latest clip end across every lane, re-read when any lane's clips change. */
function useLastClipEnd(lanes: readonly TimelineLane[]): number {
  const lists = useStableArray(lanes.map((lane) => listOf(lane.source)))
  const subscribe = useCallback(
    (onChange: () => void) => {
      const unsubscribes = lists.map((list) => list.subscribe(() => onChange()))
      return () => {
        for (const unsubscribe of unsubscribes) unsubscribe()
      }
    },
    [lists],
  )
  const read = useCallback((): number => {
    let end = 0
    for (const list of lists) {
      for (const clip of list.all()) end = Math.max(end, clip.startSec + clip.durationSec)
    }
    return end
  }, [lists])
  return useExternalSnapshot(subscribe, read, Object.is)
}

/** Ruler ticks: every second, labelled every `major` seconds. */
export function rulerTicks(
  durationSec: number,
  pixelsPerSecond: number,
): { sec: number; major: boolean }[] {
  const every =
    pixelsPerSecond >= 60 ? 1 : pixelsPerSecond >= 25 ? 2 : pixelsPerSecond >= 10 ? 5 : 10
  const major = every * 5
  const ticks: { sec: number; major: boolean }[] = []
  for (let sec = 0; sec <= durationSec; sec += every) ticks.push({ sec, major: sec % major === 0 })
  return ticks
}

export function TimelineView({
  lanes,
  transport,
  pixelsPerSecond = 40,
  durationSec,
  horizonSec = 8,
  fps,
  seekOnClick = true,
  samples,
  showWaveforms = true,
  onClipClick,
  className,
  style,
  'data-testid': testId,
}: TimelineViewProps) {
  const engine = useMaybeEngine()
  const laneList = (lanes ?? engine?.tracks ?? []).map(toLane)
  const store = samples === undefined ? (engine?.samples ?? null) : samples
  const t = useTransport(transport, { fps })
  const lastEnd = useLastClipEnd(laneList)

  const length =
    durationSec ??
    Math.max(16, lastEnd + 2, t.loop.enabled ? t.loop.lengthSec : 0, t.positionSec + 8)
  const widthPx = length * pixelsPerSecond

  const seekAt = (event: MouseEvent<HTMLElement>): void => {
    if (!seekOnClick) return
    const rect = event.currentTarget.getBoundingClientRect()
    const sec = Math.max(0, (event.clientX - rect.left) / pixelsPerSecond)
    t.seek(Math.min(length, sec))
  }

  const seekByKey = (event: KeyboardEvent<HTMLElement>): void => {
    if (!seekOnClick) return
    const step = event.shiftKey ? 0.1 : 1
    switch (event.key) {
      case 'ArrowRight':
        t.seek(Math.min(length, t.positionSec + step))
        break
      case 'ArrowLeft':
        t.seek(Math.max(0, t.positionSec - step))
        break
      case 'Home':
        t.seek(0)
        break
      default:
        return
    }
    event.preventDefault()
  }

  return (
    <div
      className={cx('lm-timeline', t.playing && 'lm-timeline--playing', className)}
      style={style}
      data-testid={testId}
    >
      <div className="lm-timeline__names">
        <div className="lm-timeline__corner" aria-hidden="true" />
        {laneList.map((lane) => (
          <div key={lane.name} className="lm-timeline__lane-name" title={lane.name}>
            {lane.name}
          </div>
        ))}
      </div>
      <div className="lm-timeline__scroll">
        <div className="lm-timeline__canvas" style={{ width: widthPx }}>
          <div
            className="lm-timeline__ruler"
            role={seekOnClick ? 'slider' : undefined}
            aria-label={seekOnClick ? 'Position' : undefined}
            aria-valuemin={seekOnClick ? 0 : undefined}
            aria-valuemax={seekOnClick ? length : undefined}
            aria-valuenow={seekOnClick ? t.positionSec : undefined}
            aria-valuetext={seekOnClick ? formatTimeSec(t.positionSec) : undefined}
            tabIndex={seekOnClick ? 0 : undefined}
            onClick={seekAt}
            onKeyDown={seekByKey}
            data-testid={testId ? `${testId}-ruler` : undefined}
          >
            {rulerTicks(length, pixelsPerSecond).map((tick) => (
              <span
                key={tick.sec}
                className={cx('lm-timeline__tick', tick.major && 'lm-timeline__tick--major')}
                style={{ left: tick.sec * pixelsPerSecond }}
              >
                {tick.major ? (
                  <span className="lm-timeline__tick-label">{formatTimeSec(tick.sec)}</span>
                ) : null}
              </span>
            ))}
          </div>
          {t.loop.enabled ? (
            <div
              className="lm-timeline__loop"
              style={{ left: 0, width: t.loop.lengthSec * pixelsPerSecond }}
              aria-hidden="true"
            />
          ) : null}
          <div className="lm-timeline__lanes">
            {laneList.map((lane) => (
              <TimelineLaneView
                key={lane.name}
                lane={lane}
                transport={t.transport}
                pixelsPerSecond={pixelsPerSecond}
                horizonSec={horizonSec}
                samples={showWaveforms ? store : null}
                onClipClick={onClipClick}
                onBackgroundClick={seekAt}
                data-testid={testId ? `${testId}-lane-${lane.name}` : undefined}
              />
            ))}
          </div>
          <div
            className="lm-timeline__playhead"
            style={{ left: t.positionSec * pixelsPerSecond }}
            aria-hidden="true"
            data-testid={testId ? `${testId}-playhead` : undefined}
          />
        </div>
      </div>
    </div>
  )
}

interface TimelineLaneViewProps {
  lane: TimelineLane
  transport: Transport
  pixelsPerSecond: number
  horizonSec: number
  samples: SampleStore | null
  onClipClick?: (clip: Clip, lane: TimelineLane) => void
  onBackgroundClick: (event: MouseEvent<HTMLElement>) => void
  'data-testid'?: string
}

function TimelineLaneView({
  lane,
  transport,
  pixelsPerSecond,
  horizonSec,
  samples,
  onClipClick,
  onBackgroundClick,
  'data-testid': testId,
}: TimelineLaneViewProps) {
  const schedule = useSchedule(lane.source, { transport, horizonSec, fps: 10 })
  const { clips } = schedule
  const sounding = new Set(schedule.sounding.map((view) => view.clip.id))
  const upcoming = new Set(schedule.upcoming.map((view) => view.clip.id))

  return (
    <div
      className="lm-timeline__lane"
      role="list"
      aria-label={`${lane.name} clips`}
      onClick={onBackgroundClick}
      data-testid={testId}
    >
      {clips.map((clip) => {
        const peaks = samples ? clipPeaks(samples.peek(clip.sourceId), clip) : null
        return (
          <div
            key={clip.id}
            role="listitem"
            className={cx(
              'lm-timeline__clip',
              sounding.has(clip.id) && 'lm-timeline__clip--sounding',
              upcoming.has(clip.id) && 'lm-timeline__clip--upcoming',
              clip.loop && 'lm-timeline__clip--loop',
            )}
            style={{
              left: clip.startSec * pixelsPerSecond,
              width: clip.durationSec * pixelsPerSecond,
            }}
            title={`${clip.sourceId} · ${formatTimeSec(clip.startSec)} – ${formatTimeSec(clip.startSec + clip.durationSec)}`}
            onClick={
              onClipClick
                ? (event) => {
                    event.stopPropagation()
                    onClipClick(clip, lane)
                  }
                : undefined
            }
            data-clip-id={clip.id}
          >
            {peaks && peaks.min.length > 0 ? (
              <Waveform peaks={peaks} className="lm-timeline__waveform" />
            ) : null}
            <span className="lm-timeline__clip-name">{clip.sourceId}</span>
          </div>
        )
      })}
    </div>
  )
}
