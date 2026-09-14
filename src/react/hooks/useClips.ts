// Clip lists for arrangement views, over `ClipList.subscribe`, and the
// scheduler's view of them — what is sounding and what starts inside a
// horizon — recomputed from the same pure window function the Scheduler
// uses, so a timeline draws exactly what will play.

import { useCallback, useMemo } from 'react'

import { type Clip } from '../../core/clips/Clip'
import { type ClipList } from '../../core/tracks/ClipList'
import { type Transport } from '../../core/transport/Transport'
import { startsInWindow } from '../../core/transport/window'
import { useExternalSnapshot } from '../store'
import { useTransport } from './useTransport'

/** Anything with clips: an `AudioTrack`, an `ElementTrack`, or a `ClipList` itself. */
export type ClipSource = ClipList | { readonly clips: ClipList }

function listOf(source: ClipSource): ClipList {
  return 'clips' in source ? source.clips : source
}

export interface ClipControls {
  add(clip: Clip): Clip
  update(id: string, patch: Partial<Omit<Clip, 'id'>>): Clip | undefined
  remove(id: string): boolean
  /** Replace the whole list. */
  set(clips: readonly Clip[]): void
  /** Drop every clip starting at or after `sec` and add `clips` in their place. */
  replaceFrom(sec: number, clips: readonly Clip[]): void
  clear(): void
}

export type UseClipsResult = ClipControls & {
  list: ClipList
  /** Sorted by start. A new array after every mutation. */
  clips: readonly Clip[]
}

/** The clips of a track (or list) and the operations that edit them. */
export function useClips(source: ClipSource): UseClipsResult {
  const list = listOf(source)
  const subscribe = useCallback((onChange: () => void) => list.subscribe(() => onChange()), [list])
  const read = useCallback((): readonly Clip[] => list.all(), [list])
  const clips = useExternalSnapshot(subscribe, read, Object.is)
  const controls = useMemo<ClipControls>(
    () => ({
      add: (clip) => list.add(clip),
      update: (id, patch) => list.update(id, patch),
      remove: (id) => list.remove(id),
      set: (next) => list.set(next),
      replaceFrom: (sec, next) => list.replaceFrom(sec, next),
      clear: () => list.clear(),
    }),
    [list],
  )
  return { list, clips, ...controls }
}

export interface UseScheduleOptions {
  /** How far ahead of the playhead `upcoming` looks, in seconds (default 8). */
  horizonSec?: number
  /** Playhead refresh rate while playing (default 10). */
  fps?: number
  /** The transport to read the position from; defaults to the provided engine's. */
  transport?: Transport
}

export interface ScheduledClipView {
  clip: Clip
  /** Seconds from the playhead until the clip starts (negative while it is sounding). */
  startsInSec: number
  /** Loop pass the start belongs to. */
  iteration: number
}

export interface ScheduleSnapshot {
  positionSec: number
  iteration: number
  playing: boolean
  /** Clips whose span covers the playhead, in start order. */
  sounding: readonly ScheduledClipView[]
  /** Clip starts inside `[playhead, playhead + horizonSec)`, soonest first, wrapping into the next loop pass. */
  upcoming: readonly ScheduledClipView[]
}

export type UseScheduleResult = ScheduleSnapshot & { clips: readonly Clip[] }

/**
 * What a track is playing and about to play, for grids and timelines.
 * Refreshes with the clip list and, while playing, at `fps`.
 */
export function useSchedule(
  source: ClipSource,
  options: UseScheduleOptions = {},
): UseScheduleResult {
  const { clips } = useClips(source)
  const horizonSec = options.horizonSec ?? 8
  const transport = useTransport(options.transport, { fps: options.fps ?? 10 })
  const { positionSec, iteration, playing, loop } = transport

  const schedule = useMemo((): ScheduleSnapshot => {
    const sounding: ScheduledClipView[] = []
    for (const clip of clips) {
      if (clip.startSec <= positionSec && positionSec < clip.startSec + clip.durationSec) {
        sounding.push({ clip, startsInSec: clip.startSec - positionSec, iteration })
      }
    }
    const byId = new Map(clips.map((clip) => [clip.id, clip] as const))
    const upcoming: ScheduledClipView[] = []
    for (const hit of startsInWindow({
      clips,
      positionSec,
      lookaheadSec: horizonSec,
      iteration,
      loop,
    })) {
      const clip = byId.get(hit.clipId)
      if (clip) upcoming.push({ clip, startsInSec: hit.startsInSec, iteration: hit.iteration })
    }
    return { positionSec, iteration, playing, sounding, upcoming }
  }, [clips, positionSec, iteration, playing, loop, horizonSec])

  return { clips, ...schedule }
}
