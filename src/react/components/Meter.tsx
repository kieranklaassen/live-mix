// Level bars on the dB scale the DSP reports (`gainToDb` of the analyser
// peak/RMS, the `LufsMeter`'s LUFS and dBTP), with a peak-hold marker. Reads
// a `MeterSource` through `useMeter`, or draws an explicit `reading` — what a
// test, a server render or a demo without audio passes.

import { useRef, type CSSProperties } from 'react'

import { gainToDb } from '../../core/devices/native/units'
import { useMeter, type MeterSnapshot, type MeterSource } from '../hooks/useMeter'
import { dbToMeterPosition, LUFS_FLOOR, METER_FLOOR_DB } from './control-math'
import { cx } from './tokens'

export type MeterBarKind = 'peak' | 'rms' | 'lufs' | 'truePeak'

export type MeterOrientation = 'vertical' | 'horizontal'

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
  /** Above this dB the peak bar takes the `meter-hot` colour (default −6). */
  hotDb?: number
  /** Peak-hold time in ms (default 1500; 0 disables the marker). */
  holdMs?: number
  showReadout?: boolean
  label?: string
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

function nowMs(): number {
  return typeof performance === 'object' ? performance.now() : Date.now()
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
  holdMs = 1500,
  showReadout = true,
  label = 'Level',
  className,
  style,
  'data-testid': testId,
}: MeterBarsProps) {
  const vertical = orientation === 'vertical'
  const kinds: readonly MeterBarKind[] =
    bars ?? (reading.hasLufs ? ['peak', 'rms', 'lufs', 'truePeak'] : ['peak', 'rms'])

  // Peak hold: the highest peak of the last `holdMs`, kept in a ref because it
  // is derived from readings over time, not from state.
  const hold = useRef({ db: Number.NEGATIVE_INFINITY, at: 0 })
  const time = nowMs()
  if (holdMs > 0) {
    if (reading.peakDb >= hold.current.db || time - hold.current.at > holdMs) {
      hold.current = { db: reading.peakDb, at: time }
    }
  }
  const holdDb = holdMs > 0 ? hold.current.db : Number.NEGATIVE_INFINITY
  const clipping = reading.peakDb >= 0 || reading.truePeakDb > 0

  return (
    <div
      className={cx(
        'lm-meter',
        vertical ? 'lm-meter--vertical' : 'lm-meter--horizontal',
        clipping && 'lm-meter--clip',
        className,
      )}
      style={style}
      role="meter"
      aria-label={label}
      aria-valuemin={floorDb}
      aria-valuemax={0}
      aria-valuenow={Number.isFinite(reading.peakDb) ? reading.peakDb : floorDb}
      aria-valuetext={`${formatDb(reading.peakDb)} dBFS`}
      data-testid={testId}
    >
      <div className="lm-meter__bars">
        {kinds.map((kind) => {
          const db = barDb(reading, kind)
          const floor = kind === 'lufs' ? lufsFloor : floorDb
          const position = dbToMeterPosition(db, floor, 0)
          const hot = kind !== 'lufs' && db > hotDb
          const size = `${position * 100}%`
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
                style={vertical ? { height: size } : { width: size }}
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
