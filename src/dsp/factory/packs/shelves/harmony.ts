// The packs of this shelf, each preset stamped with its pack: a chunk of its own (../index).

import { type FactoryPreset } from '../../types'
import { PRESETS as COLOUR_NOTE } from '../colour-note'
import { PRESETS as MIRROR_OF_D } from '../mirror-of-d'
import { PRESETS as BELLS_HELD_OPEN } from '../bells-held-open'
import { PRESETS as REEDS_NEVER_STOP } from '../reeds-never-stop'
import { PRESETS as SUSPENSION_CHAINS } from '../suspension-chains'
import { PRESETS as HEXATONIC_POLES } from '../hexatonic-poles'
import { PRESETS as FALLING_FIFTHS } from '../falling-fifths'
import { PRESETS as ONE_NOTE_MANY_NAMES } from '../one-note-many-names'
import { PRESETS as FALLING_INNER_LINE } from '../falling-inner-line'
import { PRESETS as ONE_NOTE_TWELVE_FLOORS } from '../one-note-twelve-floors'
import { PRESETS as BORROWED_LIGHT } from '../borrowed-light'
import { PRESETS as ROOTLESS_OVER_PEDAL } from '../rootless-over-pedal'
import { PRESETS as HARMONIC_TWINS } from '../harmonic-twins'
import { PRESETS as KEYS_COME_ROUND } from '../keys-come-round'
import { PRESETS as AXIS_TWINS } from '../axis-twins'
import { PRESETS as UNDECIDED_THIRD } from '../undecided-third'
import { PRESETS as SECONDS_AS_HOME } from '../seconds-as-home'
import { PRESETS as TABLE_SONG_THIRDS } from '../table-song-thirds'
import { PRESETS as THREE_PEDALS } from '../three-pedals'
import { PRESETS as LAMENT_GROUNDS } from '../lament-grounds'
import { PRESETS as DOMINANT_LADDERS } from '../dominant-ladders'
import { PRESETS as CADENCE_CARDS } from '../cadence-cards'
import { PRESETS as CHORD_SHED } from '../chord-shed'
import { PRESETS as TWENTY_EIGHT_SLASHES } from '../twenty-eight-slashes'
import { PRESETS as DISPERSED_PARTS } from '../dispersed-parts'
import { PRESETS as SLACKENED_STRINGS } from '../slackened-strings'
import { PRESETS as WALK_UP_AMENS } from '../walk-up-amens'
import { PRESETS as WHITE_KEY_PLANING } from '../white-key-planing'
import { PRESETS as STACKED_FOURTHS } from '../stacked-fourths'
import { PRESETS as SLOW_WALTZ_SEVENTHS } from '../slow-waltz-sevenths'
import { PRESETS as ONE_LINE_CHOIRS } from '../one-line-choirs'
import { PRESETS as OVER_A_PLAYED_BASS } from '../over-a-played-bass'
import { PRESETS as MANY_ROOMS_ONE_SPINE } from '../many-rooms-one-spine'
import { PRESETS as ONE_VOICE_MOVES } from '../one-voice-moves'

const stamped = (pack: string, presets: readonly FactoryPreset[]): FactoryPreset[] =>
  presets.map((preset) => ({ ...preset, pack }))

/** In the order of `FACTORY_PACKS`. */
export const HARMONY: readonly FactoryPreset[] = [
  ...stamped('colour-note', COLOUR_NOTE),
  ...stamped('mirror-of-d', MIRROR_OF_D),
  ...stamped('bells-held-open', BELLS_HELD_OPEN),
  ...stamped('reeds-never-stop', REEDS_NEVER_STOP),
  ...stamped('suspension-chains', SUSPENSION_CHAINS),
  ...stamped('hexatonic-poles', HEXATONIC_POLES),
  ...stamped('falling-fifths', FALLING_FIFTHS),
  ...stamped('one-note-many-names', ONE_NOTE_MANY_NAMES),
  ...stamped('falling-inner-line', FALLING_INNER_LINE),
  ...stamped('one-note-twelve-floors', ONE_NOTE_TWELVE_FLOORS),
  ...stamped('borrowed-light', BORROWED_LIGHT),
  ...stamped('rootless-over-pedal', ROOTLESS_OVER_PEDAL),
  ...stamped('harmonic-twins', HARMONIC_TWINS),
  ...stamped('keys-come-round', KEYS_COME_ROUND),
  ...stamped('axis-twins', AXIS_TWINS),
  ...stamped('undecided-third', UNDECIDED_THIRD),
  ...stamped('seconds-as-home', SECONDS_AS_HOME),
  ...stamped('table-song-thirds', TABLE_SONG_THIRDS),
  ...stamped('three-pedals', THREE_PEDALS),
  ...stamped('lament-grounds', LAMENT_GROUNDS),
  ...stamped('dominant-ladders', DOMINANT_LADDERS),
  ...stamped('cadence-cards', CADENCE_CARDS),
  ...stamped('chord-shed', CHORD_SHED),
  ...stamped('twenty-eight-slashes', TWENTY_EIGHT_SLASHES),
  ...stamped('dispersed-parts', DISPERSED_PARTS),
  ...stamped('slackened-strings', SLACKENED_STRINGS),
  ...stamped('walk-up-amens', WALK_UP_AMENS),
  ...stamped('white-key-planing', WHITE_KEY_PLANING),
  ...stamped('stacked-fourths', STACKED_FOURTHS),
  ...stamped('slow-waltz-sevenths', SLOW_WALTZ_SEVENTHS),
  ...stamped('one-line-choirs', ONE_LINE_CHOIRS),
  ...stamped('over-a-played-bass', OVER_A_PLAYED_BASS),
  ...stamped('many-rooms-one-spine', MANY_ROOMS_ONE_SPINE),
  ...stamped('one-voice-moves', ONE_VOICE_MOVES),
]
