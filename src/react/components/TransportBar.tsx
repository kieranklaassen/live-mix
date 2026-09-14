// Play/pause, stop, the position readout and the loop toggle over
// `useTransport`. Extra controls (a tempo field, a record button) go in as
// children after the built-in ones.

import { type CSSProperties, type ReactNode } from 'react'

import { type Transport } from '../../core/transport/Transport'
import { useTransport } from '../hooks/useTransport'
import { formatTimeSec } from './control-math'
import { ToggleButton } from './Toggle'
import { cx } from './tokens'

export interface TransportBarProps {
  /** Defaults to the provided engine's transport. */
  transport?: Transport
  /** Playhead refresh rate while playing (default 30). */
  fps?: number
  showStop?: boolean
  showLoop?: boolean
  /** Fade handed to `stop` (seconds). */
  stopFadeSec?: number
  children?: ReactNode
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

export function TransportBar({
  transport,
  fps,
  showStop = true,
  showLoop = true,
  stopFadeSec,
  children,
  className,
  style,
  'data-testid': testId,
}: TransportBarProps) {
  const t = useTransport(transport, { fps })

  return (
    <div
      className={cx('lm-transport', `lm-transport--${t.state}`, className)}
      style={style}
      role="toolbar"
      aria-label="Transport"
      data-testid={testId}
    >
      <ToggleButton
        pressed={t.playing}
        onPressedChange={() => t.toggle()}
        label={t.playing ? 'Pause' : 'Play'}
        className="lm-transport__button lm-transport__button--play"
        data-testid={testId ? `${testId}-play` : undefined}
      >
        <span aria-hidden="true">{t.playing ? '❚❚' : '▶'}</span>
      </ToggleButton>
      {showStop ? (
        <button
          type="button"
          aria-label="Stop"
          onClick={() => t.stop(stopFadeSec === undefined ? undefined : { fadeSec: stopFadeSec })}
          className="lm-button lm-button--neutral lm-transport__button lm-transport__button--stop"
          data-testid={testId ? `${testId}-stop` : undefined}
        >
          <span aria-hidden="true">■</span>
        </button>
      ) : null}
      <output className="lm-transport__time" aria-label="Position" aria-live="off">
        {formatTimeSec(t.positionSec)}
      </output>
      {showLoop ? (
        <ToggleButton
          pressed={t.loop.enabled}
          onPressedChange={(enabled) => t.setLoop({ enabled })}
          label="Loop"
          title={`Loop ${formatTimeSec(t.loop.lengthSec)}`}
          className="lm-transport__button lm-transport__button--loop"
          data-testid={testId ? `${testId}-loop` : undefined}
        >
          <span aria-hidden="true">⟲</span>
          <span className="lm-transport__loop-length">{formatTimeSec(t.loop.lengthSec)}</span>
        </ToggleButton>
      ) : null}
      {t.loop.enabled && t.iteration > 0 ? (
        <span className="lm-transport__iteration" title="Loop pass">
          ×{t.iteration + 1}
        </span>
      ) : null}
      {children}
    </div>
  )
}
