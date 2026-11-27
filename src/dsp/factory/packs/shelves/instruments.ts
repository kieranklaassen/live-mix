// The sets of the instruments, each preset stamped with its pack: a chunk of its own (../index).

import { setId, setPresets, type InstrumentSet } from '../../sets/set'
import { type FactoryPreset } from '../../types'
import { SET as WALKING_VOICES } from '../../sets/walking-voices'
import { SET as UNSUNG_VOICE } from '../../sets/unsung-voice'
import { SET as BRONZE_VOWELS } from '../../sets/bronze-vowels'
import { SET as TURNED_TIME } from '../../sets/turned-time'
import { SET as UNDERVOICE } from '../../sets/undervoice'
import { SET as DRY_BRUSH } from '../../sets/dry-brush'
import { SET as CLOSED_EYES } from '../../sets/closed-eyes'
import { SET as COMMON_AIR } from '../../sets/common-air'
import { SET as SLOW_ACCORD } from '../../sets/slow-accord'
import { SET as DEEP_ROOTS } from '../../sets/deep-roots'
import { SET as BENT_BLADE } from '../../sets/bent-blade'
import { SET as CHORD_CLOCK } from '../../sets/chord-clock'
import { SET as SETTING_GLASS } from '../../sets/setting-glass'
import { SET as STANDING_WATER } from '../../sets/standing-water'
import { SET as RINGING_ORDER } from '../../sets/ringing-order'
import { SET as SPUN_WIRE } from '../../sets/spun-wire'
import { SET as FLAME_ORGAN } from '../../sets/flame-organ'
import { SET as WIRE_LANTERN } from '../../sets/wire-lantern'
import { SET as SINGING_SAND } from '../../sets/singing-sand'

/** The tables, in the order of `FACTORY_PACKS`. */
export const SETS: readonly InstrumentSet[] = [
  WALKING_VOICES,
  UNSUNG_VOICE,
  BRONZE_VOWELS,
  TURNED_TIME,
  UNDERVOICE,
  DRY_BRUSH,
  CLOSED_EYES,
  COMMON_AIR,
  SLOW_ACCORD,
  DEEP_ROOTS,
  BENT_BLADE,
  CHORD_CLOCK,
  SETTING_GLASS,
  STANDING_WATER,
  RINGING_ORDER,
  SPUN_WIRE,
  FLAME_ORGAN,
  WIRE_LANTERN,
  SINGING_SAND,
]

/** In the order of `FACTORY_PACKS`. */
export const INSTRUMENTS: readonly FactoryPreset[] = SETS.flatMap((set) =>
  setPresets(set).map((preset) => ({ ...preset, pack: setId(set.device) })),
)
