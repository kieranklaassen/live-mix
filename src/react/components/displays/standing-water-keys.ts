// The keys of Standing Water that its display follows: the water of each, moved
// on from frame to frame, and which of them is shown.

import { clamp } from '../display-kit'
import { type DisplayFrame, type DisplayNote } from '../plate-display'
import { type HeardLevel } from './instrument-parts'
import { waterMove, waterStart, waterStrength, type Ask, type Water } from './standing-water-parts'

/** A key is shown for at least this long, so fast playing does not shake the picture. */
const SHOWN_SEC = 0.25
/** As many keys as the device has voices. */
const KEYS = 12
/** A key's water, and the note it is of. */
export interface KeyWater {
  id: number
  /** When it was struck, on the display's clock. */
  at: number
  water: Water
  held: boolean
}

export interface PoolState extends HeardLevel {
  keys: KeyWater[]
  /** The key whose water is shown, and since when. */
  seen: KeyWater | null
  since: number
}

/** The waters of the keys that sound, moved on to this frame. The tallest is the one that is shown. */
export function moveKeys(frame: DisplayFrame<PoolState>, ask: Ask): KeyWater | null {
  const { state, now, powered } = frame
  // A key let go is followed for as long as its water can be seen to move.
  const sounding = (note: DisplayNote): boolean =>
    note.released === null || note.released < 0.9 * ask('calm')
  const notes = powered ? frame.notes.filter(sounding).slice(-KEYS) : []
  state.keys = notes.map((note) => {
    const at = now - note.age
    const held = note.released === null
    const known = state.keys.find((key) => key.id === note.id && Math.abs(key.at - at) < 0.1)
    if (known) {
      known.held = held
      waterMove(ask, known.water, held, clamp(frame.dt, 0, 0.1))
      return known
    }
    const water = waterStart(ask, note.frequency, note.gain, note.id % 997)
    // A key struck before the plate was looked at has had its time.
    const run = (seconds: number, gate: boolean): void => {
      for (let left = Math.min(seconds, 8); left > 0; left -= 0.05)
        waterMove(ask, water, gate, Math.min(0.05, left))
    }
    run(note.age - (note.released ?? 0), true)
    run(note.released ?? 0, false)
    return { id: note.id, at, water, held }
  })
  let tallest: KeyWater | null = null
  let most = -1
  for (const key of state.keys) {
    // The one that is shown gives way only to one that stands clearly over it.
    const tall =
      waterStrength(ask, key.water) * (key.held ? 1 : 0.7) * (key === state.seen ? 1.2 : 1)
    if (tall > most && (key.held || tall > 0.004)) [tallest, most] = [key, tall]
  }
  const stays = state.seen && state.keys.includes(state.seen) && now - state.since < SHOWN_SEC
  if (tallest !== state.seen && !stays) {
    state.seen = tallest
    state.since = now
  }
  return state.seen
}
