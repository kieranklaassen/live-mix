// The master is a `Bus`, not a `ChannelStrip`: it has a ramped `setLevel`
// but keeps no value and announces nothing, so its fader is uncontrolled and
// seeded from the gain node. Its meter is the engine's own (analyser peak,
// LUFS and true peak once `installLufsMeter` resolved).

import { type CSSProperties } from 'react'

import { type MasterBus } from '../../core/buses/MasterBus'
import { InsertList } from './ChannelStripView'
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
import { cx } from './tokens'

export interface MasterStripViewProps {
  master: MasterBus
  name?: string
  fps?: number
  faderMinDb?: number
  faderMaxDb?: number
  className?: string
  style?: CSSProperties
  'data-testid'?: string
}

export function MasterStripView({
  master,
  name = 'Master',
  fps,
  faderMinDb = FADER_MIN_DB,
  faderMaxDb = FADER_MAX_DB,
  className,
  style,
  'data-testid': testId,
}: MasterStripViewProps) {
  return (
    <section
      className={cx('lm-strip', 'lm-strip--master', className)}
      style={style}
      aria-label={`${name} strip`}
      data-testid={testId}
    >
      <InsertList inserts={master.inserts} />
      <div className="lm-strip__fader-row">
        <Fader
          label="Master level"
          hideLabel
          defaultValue={levelToFaderDb(master.gainNode.gain.value, faderMinDb, faderMaxDb)}
          min={faderMinDb}
          max={faderMaxDb}
          step={0.1}
          unit="dB"
          taper="fader"
          ticks={[normalizeValue(0, faderMinDb, faderMaxDb, 'fader')]}
          format={(db) => (db <= faderMinDb ? '-∞ dB' : formatControlValue(db, 'dB'))}
          className="lm-strip__fader"
          onChange={(db) => master.setLevel(faderDbToLevel(db, faderMinDb))}
          data-testid={testId ? `${testId}-fader` : undefined}
        />
        <Meter source={master} fps={fps} label={`${name} level`} className="lm-strip__meter" />
      </div>
      <h3 className="lm-strip__name">{name}</h3>
    </section>
  )
}
