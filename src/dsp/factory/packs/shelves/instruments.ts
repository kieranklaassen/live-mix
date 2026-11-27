// The sets of the instruments, each preset stamped with its pack: a chunk of its own (../index).

import { setId, setPresets, type InstrumentSet } from '../../sets/set'
import { type FactoryPreset } from '../../types'
import { SET as COMMON_AIR } from '../../sets/common-air'
import { SET as SLOW_ACCORD } from '../../sets/slow-accord'
import { SET as CHORD_CLOCK } from '../../sets/chord-clock'
import { SET as SETTING_GLASS } from '../../sets/setting-glass'
import { SET as WIRE_LANTERN } from '../../sets/wire-lantern'
import { SET as SINGING_SAND } from '../../sets/singing-sand'

/** The tables, in the order of `FACTORY_PACKS`. */
export const SETS: readonly InstrumentSet[] = [
  COMMON_AIR,
  SLOW_ACCORD,
  CHORD_CLOCK,
  SETTING_GLASS,
  WIRE_LANTERN,
  SINGING_SAND,
]

/** In the order of `FACTORY_PACKS`. */
export const INSTRUMENTS: readonly FactoryPreset[] = SETS.flatMap((set) =>
  setPresets(set).map((preset) => ({ ...preset, pack: setId(set.device) })),
)
