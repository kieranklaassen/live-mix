// The session grid for React: scenes, tracks and slot states from a
// `Session`, refreshed through its change events, with the launch controls
// bound. Headless — the styled grid is the U25 kit's.

import { useCallback, useMemo } from 'react'

import { type LaunchQuantize } from '../../core/session/launch'
import { type ScoreScene } from '../../core/session/Scene'
import { type LaunchOptions, type Session, type SlotStatus } from '../../core/session/Session'
import { type ScoreSlot, type SlotState } from '../../core/session/Slot'
import { type ScoreAudioTrack } from '../../score/schema'
import { useExternalSnapshot } from '../store'

export interface SessionControls {
  launchScene(sceneId: string, options?: LaunchOptions): void
  launchSlot(slotId: string, options?: LaunchOptions): void
  releaseSlot(slotId: string, options?: LaunchOptions): void
  stopSlot(slotId: string, options?: LaunchOptions): void
  stopTrack(trackId: string, options?: LaunchOptions): void
  stopAll(options?: LaunchOptions): void
  setQuantize(quantize: LaunchQuantize): void
}

/** One grid cell: the slot there (if any) and its state. */
export interface SessionCell {
  track: string
  scene: string
  slot: ScoreSlot | null
  status: SlotStatus | null
  state: SlotState
}

export interface SessionSnapshot {
  /** Rows, in score order. */
  scenes: readonly ScoreScene[]
  /** Columns: the score's audio tracks, in order. */
  tracks: readonly ScoreAudioTrack[]
  /** Every slot's status, in score order. */
  statuses: readonly SlotStatus[]
  /** `cells[sceneIndex][trackIndex]`. */
  cells: readonly (readonly SessionCell[])[]
  quantize: LaunchQuantize
  /** Bumped on every change. */
  version: number
}

export type UseSessionResult = SessionSnapshot & SessionControls & { session: Session }

/** The grid a `Session` performs: rows, columns, cell states and the launch controls. */
export function useSession(session: Session): UseSessionResult {
  const subscribe = useCallback(
    (onChange: () => void) => session.onChange(() => onChange()),
    [session],
  )
  const read = useCallback((): number => session.version, [session])
  const version = useExternalSnapshot(subscribe, read, Object.is)

  const snapshot = useMemo((): SessionSnapshot => {
    const { score } = session
    const tracks = session.tracks()
    const statuses = session.statuses()
    const byId = new Map(statuses.map((status) => [status.slotId, status] as const))
    const cells = score.scenes.map((scene) =>
      tracks.map((track): SessionCell => {
        const slot = score.slots.find((s) => s.track === track.id && s.scene === scene.id) ?? null
        const status = slot ? (byId.get(slot.id) ?? null) : null
        return { track: track.id, scene: scene.id, slot, status, state: status?.state ?? 'empty' }
      }),
    )
    return { scenes: score.scenes, tracks, statuses, cells, quantize: session.quantize, version }
  }, [session, version])

  const controls = useMemo<SessionControls>(
    () => ({
      launchScene: (sceneId, options) => session.launchScene(sceneId, options),
      launchSlot: (slotId, options) => session.launchSlot(slotId, options),
      releaseSlot: (slotId, options) => session.releaseSlot(slotId, options),
      stopSlot: (slotId, options) => session.stopSlot(slotId, options),
      stopTrack: (trackId, options) => session.stopTrack(trackId, options),
      stopAll: (options) => session.stopAll(options),
      setQuantize: (quantize) => session.setQuantize(quantize),
    }),
    [session],
  )

  return { session, ...snapshot, ...controls }
}

export interface SlotControls {
  /** Press the slot (launch, or stop for a `toggle` slot that plays). */
  launch(options?: LaunchOptions): void
  /** Release the slot (stops a `gate` slot). */
  release(options?: LaunchOptions): void
  stop(options?: LaunchOptions): void
}

export type UseSlotResult = SlotControls & {
  /** The slot record, or null when the id is not in the score. */
  slot: ScoreSlot | null
  status: SlotStatus | null
  state: SlotState
  playing: boolean
  queued: boolean
  stopping: boolean
}

/** One slot's state and controls. */
export function useSlot(session: Session, slotId: string): UseSlotResult {
  const subscribe = useCallback(
    (onChange: () => void) => session.onChange(() => onChange()),
    [session],
  )
  const read = useCallback((): number => session.version, [session])
  const version = useExternalSnapshot(subscribe, read, Object.is)

  const view = useMemo(() => {
    const slot = session.score.slots.find((s) => s.id === slotId) ?? null
    const status = slot ? session.status(slotId) : null
    const state: SlotState = status?.state ?? 'empty'
    return {
      slot,
      status,
      state,
      playing: state === 'playing',
      queued: state === 'queued',
      stopping: status?.stopping ?? false,
    }
  }, [session, slotId, version])

  const controls = useMemo<SlotControls>(
    () => ({
      launch: (options) => session.launchSlot(slotId, options),
      release: (options) => session.releaseSlot(slotId, options),
      stop: (options) => session.stopSlot(slotId, options),
    }),
    [session, slotId],
  )

  return { ...view, ...controls }
}
