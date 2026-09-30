// A mixer strip laid on its side for the grid themes: one 20 px row with a
// brush swatch, the name, mute and solo, a horizontal level fader and a
// meter. It reads and writes the same `useStrip` state as `ChannelStripView`,
// so a row and a full strip over one track stay in step.

import { type CSSProperties, type ReactNode } from 'react'

import { type ChannelStrip, type StripHost } from '../../core/tracks/ChannelStrip'
import { type MeterSource } from '../hooks/useMeter'
import { useStrip } from '../hooks/useTrack'
import { resolveStrip, useStripMeter } from './ChannelStripView'
import {
  FADER_MAX_DB,
  FADER_MIN_DB,
  faderDbToLevel,
  formatControlValue,
  levelToFaderDb,
  normalizeValue,
} from './control-math'
import { Fader } from './Fader'
import { Meter } from './Meter'
import { ToggleButton } from './Toggle'
import { BRUSH_COUNT, cx } from './tokens'

export interface ChannelRowViewProps {
  /** The strip, or anything with one (`AudioTrack`, `ReturnTrack`, …). */
  strip: ChannelStrip | StripHost
  /** Display name; defaults to the strip's. */
  name?: string
  /** Brush colour of the swatch, 1 … 6 (wraps); omit for no swatch. */
  brush?: number
  /** As on `ChannelStripView`: `true` taps the strip, `false` draws no meter. */
  meter?: MeterSource | boolean
  showSolo?: boolean
  faderMinDb?: number
  faderMaxDb?: number
  fps?: number
  /** Rendered before the name, after the swatch (an icon). */
  children?: ReactNode
  onSelect?: () => void
  selected?: boolean
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

export function ChannelRowView({
  strip: stripOrHost,
  name,
  brush,
  meter = true,
  showSolo = true,
  faderMinDb = FADER_MIN_DB,
  faderMaxDb = FADER_MAX_DB,
  fps,
  children,
  onSelect,
  selected = false,
  className,
  style,
  'data-testid': testId,
}: ChannelRowViewProps) {
  const strip = resolveStrip(stripOrHost)
  const s = useStrip(strip)
  const tapped = useStripMeter(strip, meter === true)
  const meterSource: MeterSource | null = meter === true ? tapped : meter === false ? null : meter
  const label = name ?? s.name
  const brushIndex =
    brush === undefined ? null : ((Math.round(brush) - 1 + BRUSH_COUNT * 100) % BRUSH_COUNT) + 1

  return (
    <section
      className={cx(
        'lm-row',
        s.mute && 'lm-row--muted',
        s.solo && 'lm-row--soloed',
        s.implicitlyMuted && 'lm-row--implicit-muted',
        selected && 'lm-row--selected',
        className,
      )}
      style={style}
      aria-label={`${label} strip`}
      data-testid={testId}
      onClick={onSelect}
    >
      {brushIndex === null ? null : (
        <span
          className={cx('lm-row__swatch', `lm-row__swatch--b${brushIndex}`)}
          aria-hidden="true"
        />
      )}
      {children}
      <h3 className="lm-row__name" title={label}>
        {label}
      </h3>
      <ToggleButton
        pressed={s.mute}
        onPressedChange={(mute) => s.setMute(mute)}
        label="Mute"
        tone="mute"
        className="lm-row__mute"
        data-testid={testId ? `${testId}-mute` : undefined}
      >
        M
      </ToggleButton>
      {showSolo ? (
        <ToggleButton
          pressed={s.solo}
          onPressedChange={(solo) => s.setSolo(solo)}
          label="Solo"
          tone="solo"
          className="lm-row__solo"
          data-testid={testId ? `${testId}-solo` : undefined}
        >
          S
        </ToggleButton>
      ) : null}
      <Fader
        label="Level"
        hideLabel
        hideValue
        orientation="horizontal"
        value={levelToFaderDb(s.level, faderMinDb, faderMaxDb)}
        defaultValue={0}
        min={faderMinDb}
        max={faderMaxDb}
        step={0.1}
        unit="dB"
        taper="fader"
        ticks={[normalizeValue(0, faderMinDb, faderMaxDb, 'fader')]}
        format={(db) => (db <= faderMinDb ? '-∞ dB' : formatControlValue(db, 'dB'))}
        className="lm-row__fader"
        onChange={(db) => s.setLevel(faderDbToLevel(db, faderMinDb))}
        onChangeStart={() => s.touch('level')}
        onChangeEnd={() => s.release('level')}
        data-testid={testId ? `${testId}-fader` : undefined}
      />
      {meterSource ? (
        <Meter
          source={meterSource}
          fps={fps}
          orientation="horizontal"
          bars={['peak']}
          showReadout={false}
          label={`${label} level`}
          className="lm-row__meter"
        />
      ) : null}
    </section>
  )
}
