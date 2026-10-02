// Level bars on the dB scale the DSP reports (`gainToDb` of the analyser
// peak/RMS, the `LufsMeter`'s LUFS and dBTP), with a peak-hold marker. Reads
// a `MeterSource` through `useMeter`, or draws an explicit `reading` — what a
// test, a server render or a demo without audio passes. The `segments` look
// is a console meter: three zones fixed to the scale, cut into segments, with
// a clip lamp that stays lit.

import { useReducer, useRef, type CSSProperties } from 'react'

import { gainToDb } from '../../core/devices/native/units'
import { useMeter, type MeterSnapshot, type MeterSource } from '../hooks/useMeter'
import { dbToMeterPosition, heldPeak, LUFS_FLOOR, METER_FLOOR_DB } from './control-math'
import { infoProps } from './info'
import { cx } from './tokens'

export type MeterBarKind = 'peak' | 'rms' | 'lufs' | 'truePeak'

export type MeterOrientation = 'vertical' | 'horizontal'

/** How the bars are drawn: solid bars, or lit segments in three zones with a clip lamp. */
export type MeterLook = 'bars' | 'segments'

export interface MeterProps {
  /** What to read (defaults to the provided engine's master when `reading` is absent). */
  source?: MeterSource
  /** An explicit reading; wins over `source` and needs no engine. */
  reading?: MeterSnapshot
  fps?: number
  active?: boolean
  orientation?: MeterOrientation
  /** Bars to draw; default peak + RMS, plus LUFS and true peak when a LUFS meter is present. */
  bars?: readonly MeterBarKind[]
  /** Bottom of the dB scale (default −60). */
  floorDb?: number
  /** Bottom of the LUFS scale (default −40). */
  lufsFloor?: number
  /**
   * Above this dB the peak bar takes the `meter-hot` colour (default −6). In
   * the `segments` look it is where the hot zone starts.
   */
  hotDb?: number
  /** Where the warm zone of the `segments` look starts, in dB (default −12). */
  warmDb?: number
  /**
   * `'segments'` draws a console meter: each bar lit in segments, in three
   * zones that stay where they are on the scale, and a clip lamp past the far
   * end that stays lit until the meter is clicked. Default `'bars'`.
   */
  look?: MeterLook
  /** Peak-hold time in ms (default 1500; 0 disables the marker). */
  holdMs?: number
  showReadout?: boolean
  label?: string
  /** What is being measured, for the info view; the default says how to read the bars. */
  info?: string
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

function nowMs(): number {
  return typeof performance === 'object' ? performance.now() : Date.now()
}

/** How each bar is read, as the info view says it. */
const BAR_INFO: Record<MeterBarKind, string> = {
  peak: 'the peak, with a mark that holds the highest one for a moment',
  rms: 'the average level (RMS)',
  lufs: 'the short-term loudness in LUFS',
  truePeak: 'the true peak between samples',
}

/**
 * What a meter with these bars shows. Give `warmDb` for the `segments` look,
 * which has three zones and a clip lamp.
 */
export function meterInfo(kinds: readonly MeterBarKind[], hotDb: number, warmDb?: number): string {
  const bars = kinds.map((kind) => BAR_INFO[kind])
  const list =
    bars.length > 1 ? `${bars.slice(0, -1).join(', ')} and ${bars[bars.length - 1]}` : bars[0]
  const shown = bars.length > 1 ? `The bars show ${list}.` : `The bar shows ${list}.`
  if (warmDb === undefined) {
    return `How loud the signal is here. ${shown} Above ${hotDb} dB it changes colour; at 0 dB the signal clips.`
  }
  return `How loud the signal is here. ${shown} The scale has three zones: up to ${warmDb} dB, from ${warmDb} to ${hotDb} dB, and above ${hotDb} dB, each in its own colour. At 0 dB the signal clips, and the lamp at the end stays lit until the meter is clicked.`
}

const BAR_LABELS: Record<MeterBarKind, string> = {
  peak: 'Peak',
  rms: 'RMS',
  lufs: 'Short-term loudness',
  truePeak: 'True peak',
}

function barDb(reading: MeterSnapshot, kind: MeterBarKind): number {
  switch (kind) {
    case 'peak':
      return reading.peakDb
    case 'rms':
      return gainToDb(reading.rms)
    case 'lufs':
      return reading.lufsShortTerm
    case 'truePeak':
      return reading.truePeakDb
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
}

function formatDb(db: number, digits = 1): string {
  return Number.isFinite(db) ? db.toFixed(digits) : '-∞'
}

type MeterBarsProps = MeterProps & { reading: MeterSnapshot }

function MeterBars({
  reading,
  orientation = 'vertical',
  bars,
  floorDb = METER_FLOOR_DB,
  lufsFloor = LUFS_FLOOR,
  hotDb = -6,
  warmDb = -12,
  look = 'bars',
  holdMs = 1500,
  showReadout = true,
  label = 'Level',
  info,
  className,
  style,
  'data-testid': testId,
}: MeterBarsProps) {
  const vertical = orientation === 'vertical'
  const segments = look === 'segments'
  const kinds: readonly MeterBarKind[] =
    bars ?? (reading.hasLufs ? ['peak', 'rms', 'lufs', 'truePeak'] : ['peak', 'rms'])

  // Peak hold: the highest peak of the last `holdMs`, kept in a ref because it
  // is derived from readings over time, not from state.
  const hold = useRef({ db: Number.NEGATIVE_INFINITY, at: 0 })
  const time = nowMs()
  if (holdMs > 0) hold.current = heldPeak(hold.current, reading.peakDb, time, holdMs)
  const holdDb = holdMs > 0 ? hold.current.db : Number.NEGATIVE_INFINITY
  const clipping = reading.peakDb >= 0 || reading.truePeakDb > 0

  // The clip lamp: once the signal has clipped it stays lit until the meter is
  // clicked. A latch in a ref, like the hold; a click draws again to show it.
  const clipped = useRef(false)
  const [, redraw] = useReducer((count: number) => count + 1, 0)
  if (clipping) clipped.current = true
  const clearClip = (): void => {
    clipped.current = false
    redraw()
  }
  // Where the warm and the hot zone start, along the dB scale of the bars.
  const zones = segments
    ? ({
        '--lm-meter-warm-at': `${dbToMeterPosition(Math.min(warmDb, hotDb), floorDb, 0) * 100}%`,
        '--lm-meter-hot-at': `${dbToMeterPosition(hotDb, floorDb, 0) * 100}%`,
      } as CSSProperties)
    : null

  return (
    <div
      className={cx(
        'lm-meter',
        vertical ? 'lm-meter--vertical' : 'lm-meter--horizontal',
        segments && 'lm-meter--segments',
        clipping && 'lm-meter--clip',
        className,
      )}
      style={zones ? { ...zones, ...style } : style}
      onClick={segments ? clearClip : undefined}
      role="meter"
      aria-label={label}
      aria-valuemin={floorDb}
      aria-valuemax={0}
      aria-valuenow={Number.isFinite(reading.peakDb) ? reading.peakDb : floorDb}
      aria-valuetext={`${formatDb(reading.peakDb)} dBFS`}
      data-testid={testId}
      {...infoProps(label, info ?? meterInfo(kinds, hotDb, segments ? warmDb : undefined))}
    >
      <div className="lm-meter__bars">
        {kinds.map((kind) => {
          const db = barDb(reading, kind)
          const floor = kind === 'lufs' ? lufsFloor : floorDb
          const position = dbToMeterPosition(db, floor, 0)
          const hot = !segments && kind !== 'lufs' && db > hotDb
          const size = `${position * 100}%`
          // A segmented fill is the whole bar, cut down to the level from its far end.
          const cut = `${(1 - position) * 100}%`
          const fillStyle: CSSProperties = segments
            ? { clipPath: vertical ? `inset(${cut} 0 0 0)` : `inset(0 ${cut} 0 0)` }
            : vertical
              ? { height: size }
              : { width: size }
          return (
            <div
              key={kind}
              className={cx('lm-meter__bar', `lm-meter__bar--${kind}`)}
              title={`${BAR_LABELS[kind]} ${formatDb(db)}`}
              data-kind={kind}
              data-db={formatDb(db)}
            >
              <span
                aria-hidden="true"
                className={cx(
                  'lm-meter__fill',
                  `lm-meter__fill--${kind}`,
                  hot && 'lm-meter__fill--hot',
                )}
                style={fillStyle}
              />
              {kind === 'peak' && Number.isFinite(holdDb) ? (
                <span
                  aria-hidden="true"
                  className={cx('lm-meter__hold', holdDb > hotDb && 'lm-meter__hold--hot')}
                  style={
                    vertical
                      ? { bottom: `${dbToMeterPosition(holdDb, floor, 0) * 100}%` }
                      : { left: `${dbToMeterPosition(holdDb, floor, 0) * 100}%` }
                  }
                />
              ) : null}
            </div>
          )
        })}
        {segments ? (
          <span
            aria-hidden="true"
            className="lm-meter__clip"
            data-on={clipped.current ? '' : undefined}
            data-testid={testId ? `${testId}-clip` : undefined}
          />
        ) : null}
      </div>
      {showReadout ? (
        <div className="lm-meter__readout">
          <span className="lm-meter__value lm-meter__value--peak">{formatDb(holdDb)}</span>
          {reading.hasLufs ? (
            <span className="lm-meter__value lm-meter__value--lufs">
              {formatDb(reading.lufsShortTerm)} LU
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function SourceMeter({ source, fps, active, ...rest }: MeterProps) {
  const reading = useMeter(source, { fps, active })
  return <MeterBars reading={reading} {...rest} />
}

/** Peak / RMS / LUFS / true-peak bars for a meter source or an explicit reading. */
export function Meter(props: MeterProps) {
  if (props.reading) return <MeterBars {...props} reading={props.reading} />
  return <SourceMeter {...props} />
}
