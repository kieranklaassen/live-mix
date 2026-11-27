// Which note the display of Ridge Lines shows: the newest, where the device
// says its rows stand, carried on between two readings at the speed of Travel.

import { clamp, trackPhase, type PhaseTrack } from '../display-kit'
import { type DisplayFrame, type DisplayNote } from '../plate-display'
import { type HeardLevel } from './instrument-parts'
import { type RidgeNote, type RidgeStill } from './ridge-lines-overtones'
import { ridgeSpeeds, type Ask, type RidgeSight } from './ridge-lines-rows'

/** The note at rest, and where its rows stand: where they stand with Travel at zero. */
const REST_HZ = 261.6256
export const REST: RidgeNote = { hz: REST_HZ, gain: 0.7, level: 1, struck: 0, turns: [0.3, 0.3] }

export interface RidgeState extends HeardLevel {
  still: RidgeStill | null
  sight: readonly [RidgeSight, RidgeSight]
  middle: PhaseTrack | null
  far: PhaseTrack | null
}

/** The newest note, as the device reports it and the notes date it. */
export function newestNote(frame: DisplayFrame<RidgeState>, ask: Ask): RidgeNote | null {
  const { state } = frame
  const hz = frame.meter('key')
  if (!frame.powered || !(hz >= 8)) {
    state.middle = state.far = null
    return null
  }
  let note: DisplayNote | null = null
  for (const each of frame.notes)
    if (Math.abs(each.frequency / hz - 1) < 1e-3 && (!note || each.age <= note.age)) note = each
  const [middle, far] = ridgeSpeeds(ask)
  state.middle = trackPhase(state.middle, frame.meter('middle'), middle, frame.dt)
  state.far = trackPhase(state.far, frame.meter('far'), far, frame.dt)
  const stroke = clamp(1 - 0.2 * Math.log2(Math.max(ask('attack'), 0.004) * 125), 0, 1)
  const falls = clamp(0.1 * ask('decay'), 0.06, 0.8)
  return {
    hz,
    gain: note?.gain ?? REST.gain,
    level: clamp(frame.meter('level'), 0, 1),
    struck: stroke * Math.exp(-(note?.age ?? 1) / falls),
    turns: [state.middle.phase, state.far.phase],
  }
}
