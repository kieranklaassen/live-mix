// The session grid: scenes as rows, the score's audio tracks as columns, a
// slot button per cell showing its state (empty / stopped / queued / playing
// / recording, stopping), a scene launch button per row, stop buttons per
// track and for everything, and the quantise selector — all over
// `useSession` / `useSlot`, styled with the `--lm-*` tokens like the rest of
// the kit. Press = launch (a `toggle` slot that plays stops), release ends a
// `gate` slot; an empty cell is a stop for its track (the session's rule).

import { type CSSProperties } from 'react'

import { type LaunchQuantize } from '../../core/session/launch'
import { type ScoreScene } from '../../core/session/Scene'
import { type Session } from '../../core/session/Session'
import { type ScoreSlot, type SlotState } from '../../core/session/Slot'
import { useSession, useSlot, type SessionCell } from '../hooks/useSession'
import { cx } from './tokens'

export type GridQuantizeChoice = 'none' | 'beat' | 'bar' | 2 | 4 | 8

export const GRID_QUANTIZE_CHOICES: readonly GridQuantizeChoice[] = ['none', 'beat', 'bar', 2, 4, 8]

export interface GridViewProps {
  session: Session
  /** Quantise options offered in the selector. Default: none, beat, bar, 2, 4, 8 bars. */
  quantizeChoices?: readonly GridQuantizeChoice[]
  /** Hide the quantise selector. */
  hideQuantize?: boolean
  /** Hide the per-track stop row and the stop-all button. */
  hideStops?: boolean
  /** Column header text; default the track's name. */
  trackLabel?: (track: { id: string; name: string }) => string
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

export function GridView({
  session,
  quantizeChoices = GRID_QUANTIZE_CHOICES,
  hideQuantize = false,
  hideStops = false,
  trackLabel,
  className,
  style,
  'data-testid': testId,
}: GridViewProps) {
  const grid = useSession(session)
  const idOf = (suffix: string) => (testId ? `${testId}-${suffix}` : undefined)

  return (
    <div
      className={cx('lm-grid', className)}
      style={style}
      role="grid"
      aria-label="Session grid"
      aria-rowcount={grid.scenes.length + 1}
      aria-colcount={grid.tracks.length + 1}
      data-testid={testId}
    >
      <div className="lm-grid__toolbar" role="toolbar" aria-label="Session controls">
        {hideQuantize ? null : (
          <label className="lm-grid__quantize">
            <span className="lm-grid__quantize-label">Quantize</span>
            <select
              className="lm-grid__quantize-select"
              value={quantizeKey(grid.quantize)}
              onChange={(event) => grid.setQuantize(parseQuantizeKey(event.target.value))}
              aria-label="Launch quantize"
              data-testid={idOf('quantize')}
            >
              {quantizeChoices.map((choice) => (
                <option key={quantizeKey(choice)} value={quantizeKey(choice)}>
                  {quantizeLabel(choice)}
                </option>
              ))}
              {quantizeChoices.some(
                (choice) => quantizeKey(choice) === quantizeKey(grid.quantize),
              ) ? null : (
                <option value={quantizeKey(grid.quantize)}>{quantizeLabel(grid.quantize)}</option>
              )}
            </select>
          </label>
        )}
        {hideStops ? null : (
          <button
            type="button"
            className="lm-button lm-grid__stop-all"
            onClick={() => grid.stopAll()}
            data-testid={idOf('stop-all')}
          >
            Stop all
          </button>
        )}
      </div>

      <div
        className="lm-grid__table"
        style={{ gridTemplateColumns: `auto repeat(${grid.tracks.length}, minmax(0, 1fr))` }}
      >
        <div className="lm-grid__corner" role="columnheader" aria-label="Scenes" />
        {grid.tracks.map((track) => (
          <div key={track.id} className="lm-grid__track" role="columnheader" title={track.id}>
            {trackLabel ? trackLabel(track) : track.name || track.id}
          </div>
        ))}

        {grid.scenes.map((scene, sceneIndex) => (
          <SceneRow
            key={scene.id}
            session={session}
            scene={scene}
            cells={grid.cells[sceneIndex] ?? []}
            onLaunch={() => grid.launchScene(scene.id)}
            testId={idOf(`scene-${scene.id}`)}
            slotTestId={idOf('slot')}
          />
        ))}

        {hideStops ? null : (
          <>
            <div className="lm-grid__row-head lm-grid__row-head--stops" role="rowheader">
              Stop
            </div>
            {grid.tracks.map((track) => (
              <div key={track.id} className="lm-grid__cell lm-grid__cell--stop" role="gridcell">
                <button
                  type="button"
                  className="lm-button lm-grid__track-stop"
                  aria-label={`Stop ${track.name || track.id}`}
                  onClick={() => grid.stopTrack(track.id)}
                  data-testid={idOf(`stop-${track.id}`)}
                >
                  ■
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

interface SceneRowProps {
  session: Session
  scene: ScoreScene
  cells: readonly SessionCell[]
  onLaunch: () => void
  testId?: string
  /** Prefix for slot buttons: `${slotTestId}-${slot.id}`. */
  slotTestId?: string
}

function SceneRow({ session, scene, cells, onLaunch, testId, slotTestId }: SceneRowProps) {
  const anyPlaying = cells.some((cell) => cell.state === 'playing')
  const anyQueued = cells.some((cell) => cell.state === 'queued')
  return (
    <>
      <div className="lm-grid__row-head" role="rowheader">
        <button
          type="button"
          className={cx(
            'lm-button',
            'lm-grid__scene',
            anyPlaying && 'lm-grid__scene--playing',
            anyQueued && 'lm-grid__scene--queued',
          )}
          onClick={onLaunch}
          aria-label={`Launch scene ${scene.name || scene.id}`}
          data-testid={testId}
        >
          <span aria-hidden="true" className="lm-grid__scene-icon">
            ▶
          </span>
          <span className="lm-grid__scene-name">{scene.name || scene.id}</span>
        </button>
      </div>
      {cells.map((cell) =>
        cell.slot ? (
          <SlotCell key={cell.track} session={session} slot={cell.slot} testId={slotTestId} />
        ) : (
          <div key={cell.track} className="lm-grid__cell lm-grid__cell--none" role="gridcell" />
        ),
      )}
    </>
  )
}

interface SlotCellProps {
  session: Session
  slot: ScoreSlot
  testId?: string
}

function SlotCell({ session, slot, testId }: SlotCellProps) {
  const view = useSlot(session, slot.id)
  const state: SlotState = view.state
  const clip = slot.clip
  const isStop = clip === null
  const label = clip === null ? `Stop track ${slot.track}` : `${clip.sourceId} on ${slot.track}`
  const gate = slot.launchMode === 'gate'
  return (
    <div className="lm-grid__cell" role="gridcell">
      <button
        type="button"
        className={cx(
          'lm-grid__slot',
          `lm-grid__slot--${isStop ? 'stop' : state}`,
          view.stopping && 'lm-grid__slot--stopping',
          gate && 'lm-grid__slot--gate',
        )}
        aria-label={label}
        aria-pressed={view.playing || undefined}
        data-state={isStop ? 'stop' : state}
        data-testid={testId ? `${testId}-${slot.id}` : undefined}
        onPointerDown={(event) => {
          if (event.button !== 0) return
          event.preventDefault()
          // A gate must see its release even when the finger slides off the pad.
          if (gate) capturePointer(event.currentTarget, event.pointerId)
          view.launch()
        }}
        onPointerUp={() => {
          if (gate) view.release()
        }}
        onPointerCancel={() => {
          if (gate) view.release()
        }}
        onLostPointerCapture={() => {
          if (gate) view.release()
        }}
        onKeyDown={(event) => {
          if (event.key !== ' ' && event.key !== 'Enter') return
          event.preventDefault()
          if (event.repeat) return // holding the key is one press, not a retrigger
          view.launch()
        }}
        onKeyUp={(event) => {
          if (gate && (event.key === ' ' || event.key === 'Enter')) view.release()
        }}
      >
        <span aria-hidden="true" className="lm-grid__slot-icon">
          {slotIcon(isStop, state, view.stopping)}
        </span>
        {clip === null ? null : <span className="lm-grid__slot-name">{clip.sourceId}</span>}
      </button>
    </div>
  )
}

function capturePointer(element: HTMLElement, pointerId: number): void {
  try {
    element.setPointerCapture(pointerId)
  } catch {
    // Not a pointer-capturing environment (jsdom, old WebKit): release still fires on the element.
  }
}

function slotIcon(isStop: boolean, state: SlotState, stopping: boolean): string {
  if (isStop) return '■'
  if (stopping) return '◼'
  switch (state) {
    case 'playing':
      return '▶'
    case 'queued':
      return '◔'
    case 'recording':
      return '●'
    case 'stopped':
    case 'empty':
      return '▷'
    default: {
      const exhaustive: never = state
      return exhaustive
    }
  }
}

/** A stable `<option>` value for a quantise setting. */
export function quantizeKey(quantize: LaunchQuantize): string {
  if (typeof quantize === 'number') return `bars:${quantize}`
  if (typeof quantize === 'object') return `sec:${quantize.seconds}`
  return quantize
}

export function parseQuantizeKey(key: string): LaunchQuantize {
  if (key.startsWith('bars:')) return Number(key.slice(5))
  if (key.startsWith('sec:')) return { seconds: Number(key.slice(4)) }
  if (key === 'none' || key === 'beat' || key === 'bar') return key
  return 'bar'
}

export function quantizeLabel(quantize: LaunchQuantize): string {
  if (typeof quantize === 'number') return `${quantize} bars`
  if (typeof quantize === 'object') return `${quantize.seconds} s`
  switch (quantize) {
    case 'none':
      return 'Off'
    case 'beat':
      return 'Beat'
    case 'bar':
      return 'Bar'
    default: {
      const exhaustive: never = quantize
      return String(exhaustive)
    }
  }
}
