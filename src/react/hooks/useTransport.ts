// Transport state through `Transport.onChange`, the playhead sampled on
// frames at a bounded rate while playing, and the controls bound.

import { useCallback, useMemo } from 'react'

import { type TransportLoop, type TransportPosition } from '../../core/transport/anchor'
import { type Transport, type TransportState } from '../../core/transport/Transport'
import { frameIntervalMs, useFrameSampled } from '../frame'
import { useExternalSnapshot } from '../store'
import { useEnginePart, useFrameScheduler } from './useEngine'

export interface UseTransportOptions {
  /** Playhead refresh rate while playing (default 30). */
  fps?: number
}

export interface TransportControls {
  start(at?: number): void
  pause(): void
  /** Returns to 0; `fadeSec` is handed to listeners for their fade-out. */
  stop(options?: { fadeSec?: number }): void
  seek(positionSec: number): void
  setLoop(loop: Partial<TransportLoop>): void
  /** Play when stopped or paused, pause when playing. */
  toggle(): void
}

export interface TransportSnapshot {
  state: TransportState
  playing: boolean
  paused: boolean
  stopped: boolean
  loop: Readonly<TransportLoop>
  /** Where the transport is, refreshed at `fps` while playing. */
  position: TransportPosition
  positionSec: number
  iteration: number
  finished: boolean
}

export type UseTransportResult = TransportSnapshot & TransportControls & { transport: Transport }

interface TransportStateSnapshot {
  state: TransportState
  loopEnabled: boolean
  loopLengthSec: number
  /** Position at the last change; the resting position when not playing. */
  positionSec: number
  iteration: number
  finished: boolean
}

/**
 * Transport state, playhead and controls. Defaults to the provided engine's
 * transport; pass one explicitly to bind another.
 */
export function useTransport(
  transport?: Transport,
  options: UseTransportOptions = {},
): UseTransportResult {
  const target = useEnginePart(transport, (engine) => engine.transport, 'useTransport')
  const frame = useFrameScheduler()

  const subscribe = useCallback(
    (onChange: () => void) => target.onChange(() => onChange()),
    [target],
  )
  const read = useCallback((): TransportStateSnapshot => {
    const position = target.position()
    return {
      state: target.state,
      loopEnabled: target.loop.enabled,
      loopLengthSec: target.loop.lengthSec,
      positionSec: position.positionSec,
      iteration: position.iteration,
      finished: position.finished,
    }
  }, [target])
  const snapshot = useExternalSnapshot(subscribe, read)

  const playing = snapshot.state === 'playing'
  const samplePosition = useCallback((): TransportPosition => target.position(), [target])
  const sampled = useFrameSampled(playing, frameIntervalMs(options.fps), samplePosition, frame)
  const resting = useMemo<TransportPosition>(
    () => ({
      positionSec: snapshot.positionSec,
      iteration: snapshot.iteration,
      finished: snapshot.finished,
    }),
    [snapshot.positionSec, snapshot.iteration, snapshot.finished],
  )
  const position = playing ? sampled : resting

  const controls = useMemo<TransportControls>(
    () => ({
      start: (at) => target.start(at),
      pause: () => target.pause(),
      stop: (stopOptions) => target.stop(stopOptions),
      seek: (positionSec) => target.seek(positionSec),
      setLoop: (loop) => target.setLoop(loop),
      toggle: () => {
        if (target.state === 'playing') target.pause()
        else target.start()
      },
    }),
    [target],
  )

  const loop = useMemo<Readonly<TransportLoop>>(
    () => ({ enabled: snapshot.loopEnabled, lengthSec: snapshot.loopLengthSec }),
    [snapshot.loopEnabled, snapshot.loopLengthSec],
  )

  return {
    transport: target,
    state: snapshot.state,
    playing,
    paused: snapshot.state === 'paused',
    stopped: snapshot.state === 'stopped',
    loop,
    position,
    positionSec: position.positionSec,
    iteration: position.iteration,
    finished: position.finished,
    ...controls,
  }
}
