// Instrument presets, one file per instrument. A browser groups them by
// category; within a category they keep the order they have here.

import { type FactoryPreset } from '../types'
import { ACOUSTIC_GUITAR_PRESETS } from './acoustic-guitar'
import { ATMOSPHERE_PRESETS } from './atmosphere'
import { AURORA_PRESETS } from './aurora'
import { BOWED_STRING_PRESETS } from './bowed-string'
import { CHAMBER_STRINGS_PRESETS } from './chamber-strings'
import { CHOIR_PRESETS } from './choir'
import { CHORD_HARP_PRESETS } from './chord-harp'
import { CLARINET_PRESETS } from './clarinet'
import { DRONE_PRESETS } from './drone'
import { DUSK_PRESETS } from './dusk'
import { EMBER_PRESETS } from './ember'
import { FELT_PIANO_PRESETS } from './felt-piano'
import { FLUTE_PRESETS } from './flute'
import { FM_GLASS_PRESETS } from './fm-glass'
import { GRAIN_SYNTH_PRESETS } from './grain-synth'
import { GUITAR_PRESETS } from './guitar'
import { HANDPAN_PRESETS } from './handpan'
import { HARP_PRESETS } from './harp'
import { HORNS_PRESETS } from './horns'
import { LADDER_BASS_PRESETS } from './ladder-bass'
import { MALLETS_PRESETS } from './mallets'
import { MODAL_BELLS_PRESETS } from './modal-bells'
import { ORGAN_PRESETS } from './organ'
import { OUTDOORS_PRESETS } from './outdoors'
import { PEDAL_STEEL_PRESETS } from './pedal-steel'
import { SAMPLER_PRESETS } from './sampler'
import { STRING_MACHINE_PRESETS } from './string-machine'
import { TANPURA_PRESETS } from './tanpura'
import { TAPE_ORCHESTRA_PRESETS } from './tape-orchestra'
import { THESIS_PRESETS } from './thesis'
import { TINE_PIANO_PRESETS } from './tine-piano'
import { WAVETABLE_PRESETS } from './wavetable'
import { WEST_COAST_PRESETS } from './west-coast'
import { ZITHER_PRESETS } from './zither'

export const FACTORY_PRESETS: readonly FactoryPreset[] = [
  ...EMBER_PRESETS,
  ...WAVETABLE_PRESETS,
  ...STRING_MACHINE_PRESETS,
  ...FELT_PIANO_PRESETS,
  ...TINE_PIANO_PRESETS,
  ...FM_GLASS_PRESETS,
  ...MODAL_BELLS_PRESETS,
  ...BOWED_STRING_PRESETS,
  ...CHOIR_PRESETS,
  ...ORGAN_PRESETS,
  ...THESIS_PRESETS,
  ...DRONE_PRESETS,
  ...SAMPLER_PRESETS,
  ...GRAIN_SYNTH_PRESETS,
  ...ATMOSPHERE_PRESETS,
  ...HANDPAN_PRESETS,
  ...AURORA_PRESETS,
  ...MALLETS_PRESETS,
  ...FLUTE_PRESETS,
  ...DUSK_PRESETS,
  ...CLARINET_PRESETS,
  ...LADDER_BASS_PRESETS,
  ...ACOUSTIC_GUITAR_PRESETS,
  ...CHORD_HARP_PRESETS,
  ...HARP_PRESETS,
  ...CHAMBER_STRINGS_PRESETS,
  ...HORNS_PRESETS,
  ...PEDAL_STEEL_PRESETS,
  ...TANPURA_PRESETS,
  ...GUITAR_PRESETS,
  ...TAPE_ORCHESTRA_PRESETS,
  ...WEST_COAST_PRESETS,
  ...ZITHER_PRESETS,
  ...OUTDOORS_PRESETS,
]
