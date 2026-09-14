// One mixer strip over `useStrip`: inserts, sends, pan, the fader in dB with a
// unity tick, mute/solo, a level meter tapped off the strip's output, and the
// name. The fader converts through the same `dbToGain`/`gainToDb` the strip's
// gain nodes see (R33): what the readout says is what the fader node does.

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

import { Meter as AnalyserMeter } from '../../core/analysis/Meter'
import { isObservableDevice, type Device } from '../../core/devices/Device'
import { ChannelStrip, type StripHost } from '../../core/tracks/ChannelStrip'
import { type Send } from '../../core/tracks/Send'
import { useMaybeEngine } from '../hooks/useEngine'
import { type MeterSource } from '../hooks/useMeter'
import { useStrip } from '../hooks/useTrack'
import { neverSubscribe, useExternalSnapshot, type Subscribe } from '../store'
import {
  FADER_MAX_DB,
  FADER_MIN_DB,
  faderDbToLevel,
  formatControlValue,
  levelToFaderDb,
  normalizeValue,
} from './control-math'
import { Fader } from './Fader'
import { Knob } from './Knob'
import { Meter } from './Meter'
import { ToggleButton } from './Toggle'
import { cx } from './tokens'

export type StripKind = 'track' | 'group' | 'return' | 'live' | 'instrument' | 'master'

export interface ChannelStripViewProps {
  /** The strip, or anything with one (`AudioTrack`, `GroupTrack`, `ReturnTrack`, …). */
  strip: ChannelStrip | StripHost
  /** Styling hint and label; defaults to `'track'`. */
  kind?: StripKind
  /** Display name; defaults to the strip's. */
  name?: string
  /**
   * `true` (default) taps an analyser off the strip output on mount (this
   * materialises the strip's nodes); a `MeterSource` reads that instead;
   * `false` draws no meter.
   */
  meter?: MeterSource | boolean
  showPan?: boolean
  showSends?: boolean
  showInserts?: boolean
  /** Fader range in dB (defaults −60 … +6; the bottom reads −∞ and sets 0). */
  faderMinDb?: number
  faderMaxDb?: number
  fps?: number
  /** Extra controls rendered between the inserts and the pan. */
  children?: ReactNode
  onSelect?: () => void
  selected?: boolean
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

export function resolveStrip(strip: ChannelStrip | StripHost): ChannelStrip {
  return strip instanceof ChannelStrip ? strip : strip.strip
}

/** The strip's sends, or none when it cannot create nodes yet. */
export function readSends(strip: ChannelStrip): readonly Send[] {
  try {
    return strip.sends.all()
  } catch {
    return []
  }
}

/**
 * An analyser tapped off the strip output, created in an effect (never during
 * render or on the server) and disposed on unmount. Null until mounted. The
 * context comes from the provided engine, else from the output node.
 */
export function useStripMeter(
  strip: ChannelStrip,
  enabled = true,
  context?: BaseAudioContext,
): AnalyserMeter | null {
  const engine = useMaybeEngine()
  const ctx = context ?? engine?.context
  const [meter, setMeter] = useState<AnalyserMeter | null>(null)
  useEffect(() => {
    if (!enabled) return
    let tap: AnalyserMeter
    let output: AudioNode
    try {
      output = strip.output
      tap = new AnalyserMeter(ctx ?? output.context)
      output.connect(tap.input)
    } catch {
      return
    }
    setMeter(tap)
    return () => {
      setMeter(null)
      try {
        output.disconnect(tap.input)
      } catch {
        // The strip may be disposed already.
      }
      tap.dispose()
    }
  }, [strip, enabled, ctx])
  return meter
}

export const UNITY_FADER_TICK = normalizeValue(0, FADER_MIN_DB, FADER_MAX_DB, 'fader')

/** One insert's name, dimmed while bypassed (follows `ObservableDevice.onChange`). */
export function InsertChip({ device }: { device: Device }) {
  const subscribe = useMemo<Subscribe>(
    () =>
      isObservableDevice(device) ? (onChange) => device.onChange(() => onChange()) : neverSubscribe,
    [device],
  )
  const read = useCallback((): boolean => device.bypass, [device])
  const bypass = useExternalSnapshot(subscribe, read, Object.is)
  return (
    <li
      className={cx('lm-strip__insert', bypass && 'lm-strip__insert--bypassed')}
      title={device.id}
    >
      {device.id}
    </li>
  )
}

/** A strip's or bus's insert chain as chips. */
export function InsertList({ inserts }: { inserts: readonly Device[] }) {
  return (
    <ul className="lm-strip__inserts" aria-label="Inserts">
      {inserts.map((device, index) => (
        <InsertChip key={`${device.id}-${index}`} device={device} />
      ))}
    </ul>
  )
}

export function ChannelStripView({
  strip: stripOrHost,
  kind = 'track',
  name,
  meter = true,
  showPan = true,
  showSends = true,
  showInserts = true,
  faderMinDb = FADER_MIN_DB,
  faderMaxDb = FADER_MAX_DB,
  fps,
  children,
  onSelect,
  selected = false,
  className,
  style,
  'data-testid': testId,
}: ChannelStripViewProps) {
  const strip = resolveStrip(stripOrHost)
  const engine = useMaybeEngine()
  const s = useStrip(strip)
  const tapped = useStripMeter(strip, meter === true)
  const now = (): number => (engine?.context ?? strip.destination.context).currentTime
  const meterSource: MeterSource | null = meter === true ? tapped : meter === false ? null : meter
  const sends = showSends ? readSends(strip) : []
  const unityTick = normalizeValue(0, faderMinDb, faderMaxDb, 'fader')

  return (
    <section
      className={cx(
        'lm-strip',
        `lm-strip--${kind}`,
        s.mute && 'lm-strip--muted',
        s.solo && 'lm-strip--soloed',
        s.implicitlyMuted && 'lm-strip--implicit-muted',
        selected && 'lm-strip--selected',
        className,
      )}
      style={style}
      aria-label={`${name ?? s.name} strip`}
      data-testid={testId}
      onClick={onSelect}
    >
      {showInserts ? <InsertList inserts={s.inserts} /> : null}
      {children}
      {sends.length > 0 ? (
        <ul className="lm-strip__sends" aria-label="Sends">
          {sends.map((send) => (
            <li key={send.target.name} className="lm-strip__send">
              <SendControl send={send} now={now} />
            </li>
          ))}
        </ul>
      ) : null}
      {showPan ? (
        <Knob
          label="Pan"
          value={s.pan}
          defaultValue={0}
          min={-1}
          max={1}
          step={0.01}
          unit="pan"
          bipolar
          size={36}
          className="lm-strip__pan"
          onChange={(pan) => s.setPan(pan)}
          data-testid={testId ? `${testId}-pan` : undefined}
        />
      ) : null}
      <div className="lm-strip__fader-row">
        <Fader
          label="Level"
          hideLabel
          value={levelToFaderDb(s.level, faderMinDb, faderMaxDb)}
          defaultValue={0}
          min={faderMinDb}
          max={faderMaxDb}
          step={0.1}
          unit="dB"
          taper="fader"
          ticks={[unityTick]}
          format={(db) => (db <= faderMinDb ? '-∞ dB' : formatControlValue(db, 'dB'))}
          className="lm-strip__fader"
          onChange={(db) => s.setLevel(faderDbToLevel(db, faderMinDb))}
          data-testid={testId ? `${testId}-fader` : undefined}
        />
        {meterSource ? (
          <Meter
            source={meterSource}
            fps={fps}
            bars={['peak', 'rms']}
            showReadout={false}
            label={`${name ?? s.name} level`}
            className="lm-strip__meter"
          />
        ) : meter === true ? (
          <div className="lm-meter lm-meter--vertical lm-strip__meter" aria-hidden="true" />
        ) : null}
      </div>
      <div className="lm-strip__buttons">
        <ToggleButton
          pressed={s.mute}
          onPressedChange={(mute) => s.setMute(mute)}
          label="Mute"
          tone="mute"
          className="lm-strip__mute"
          data-testid={testId ? `${testId}-mute` : undefined}
        >
          M
        </ToggleButton>
        {kind === 'master' ? null : (
          <ToggleButton
            pressed={s.solo}
            onPressedChange={(solo) => s.setSolo(solo)}
            label="Solo"
            tone="solo"
            className="lm-strip__solo"
            data-testid={testId ? `${testId}-solo` : undefined}
          >
            S
          </ToggleButton>
        )}
      </div>
      <h3 className="lm-strip__name" title={name ?? s.name}>
        {name ?? s.name}
      </h3>
    </section>
  )
}

/**
 * A send: the target's name and level over a thin horizontal fader when the
 * send carries a gain node; the name alone for a direct connection (the
 * return sets the level). The gain node keeps no commanded value, so the
 * level lives here and ramps through `setTargetAtTime`.
 */
function SendControl({ send, now }: { send: Send; now: () => number }) {
  const { gainNode } = send
  const [db, setDb] = useState(() => levelToFaderDb(gainNode?.gain.value ?? 1))
  if (!gainNode) {
    return <span className="lm-strip__send-direct">→ {send.target.name}</span>
  }
  const text = db <= FADER_MIN_DB ? '-∞' : formatControlValue(db, 'dB', 0)
  return (
    <div className="lm-strip__send-control">
      <div className="lm-strip__send-head">
        <span className="lm-strip__send-name" title={send.target.name}>
          {send.target.name}
        </span>
        <span className="lm-strip__send-value">{text}</span>
      </div>
      <Fader
        label={`Send to ${send.target.name}`}
        hideLabel
        hideValue
        orientation="horizontal"
        value={db}
        defaultValue={0}
        min={FADER_MIN_DB}
        max={FADER_MAX_DB}
        step={0.1}
        unit="dB"
        taper="fader"
        format={() => text}
        onChange={(next) => {
          setDb(next)
          gainNode.gain.setTargetAtTime(faderDbToLevel(next), now(), 0.005)
        }}
        className="lm-strip__send-fader"
      />
    </div>
  )
}
