// What runs in the display of Turned Time: a glass for each key, begun, turned
// and let go as the notes ask, by the device's own law (`turned-time-sand.ts`).
// The device reports only the newest glass; that one stands where it says.

import { clamp } from '../display-kit'
import { type DisplayFrame, type DisplayNote } from '../plate-display'
import { type HeardLevel } from './instrument-parts'
import {
  TIME_CHORD_SEC,
  TIME_STEP_SEC,
  timeLetGo,
  timeStart,
  timeStep,
  timeTurnOthers,
  type TimeGlass,
  type TimeSet,
} from './turned-time-sand'

/** How much of the past is drawn. */
export const TIME_PAST_SEC = 8
/** A point of a way is kept this often. */
const TRAIL_SEC = 1 / 20
const REST_HZ = 261.6256

export interface TimeRunning extends TimeGlass {
  id: number
  /** When the key went down, on the display's clock; carried on while the note says so. */
  at: number
  trail: { at: number; u: number }[]
}

export interface TimeState extends HeardLevel {
  glasses: TimeRunning[]
  clock: number
  /** When the last keys went down, and the newest one's place in its chord. */
  keys: number[]
  order: number
  said: { words: string; at: number }
}

/** Every glass on to `until`, with a point of its way now and then. */
function runOn(set: TimeSet, glasses: readonly TimeRunning[], from: number, until: number): void {
  const steps = Math.min(Math.ceil((until - from) / TIME_STEP_SEC - 1e-6), 8000)
  for (let i = 1; i <= steps; i++) {
    const dt = (until - from) / steps
    for (const glass of glasses) {
      timeStep(set, glass, dt)
      const at = from + i * dt
      const last = glass.trail[glass.trail.length - 1]
      if (!last || at - last.at >= TRAIL_SEC || i === steps) {
        // The newest point is where it is now; it is kept once the one before it is old enough.
        const before = glass.trail[glass.trail.length - 2]
        if (before && last.at - before.at < TRAIL_SEC) glass.trail.pop()
        glass.trail.push({ at, u: glass.u })
      }
    }
  }
}

function strike(set: TimeSet, state: TimeState, note: DisplayNote, at: number): void {
  const last = state.keys[state.keys.length - 1]
  state.order = last !== undefined && at - last < TIME_CHORD_SEC ? state.order + 1 : 0
  state.keys.push(at)
  // A glass of this pitch is struck again.
  state.glasses = state.glasses.filter((one) => Math.abs(one.hz / note.frequency - 1) > 1e-4)
  const glass = timeStart(set, note.frequency, note.gain, state.order)
  const running: TimeRunning = { ...glass, id: note.id, at, trail: [{ at, u: glass.u }] }
  if (set.turn === 0) timeTurnOthers(set, state.glasses, note.frequency, running)
  state.glasses.push(running)
  if (state.glasses.length > 12) state.glasses.shift()
}

/** The keys as they run: what the notes ask for, by the device's law, and the newest where the device says it is. */
export function timeFollow(frame: DisplayFrame<TimeState>, set: TimeSet): TimeRunning | null {
  const { state, now, powered } = frame
  if (!powered) {
    state.glasses = []
    state.keys = []
    return null
  }
  const known = (note: DisplayNote): TimeRunning | undefined =>
    state.glasses.find((one) => one.id === note.id && Math.abs(one.at - (now - note.age)) < 0.1)
  const fresh = frame.notes.filter(
    (note) =>
      !known(note) && (note.released ?? 0) < 2 * set.release && now - note.age > state.clock - 0.2,
  )
  fresh.sort((a, b) => b.age - a.age)
  if (state.glasses.length === 0 && fresh.length > 0) state.clock = now - fresh[0].age
  for (const note of frame.notes) {
    const glass = known(note)
    if (!glass) continue
    glass.at = now - note.age
    if (glass.held && note.released !== null) {
      timeLetGo(set, glass)
      if (set.turn === 2) timeTurnOthers(set, state.glasses, glass.hz, glass)
    }
  }
  for (const note of fresh) {
    const at = clamp(now - note.age, state.clock, now)
    runOn(set, state.glasses, state.clock, at)
    state.clock = at
    strike(set, state, note, now - note.age)
  }
  runOn(set, state.glasses, state.clock, now)
  state.clock = now
  state.keys = state.keys.filter((at) => now - at < TIME_PAST_SEC && at <= now)
  state.glasses = state.glasses.filter((one) => one.envelope > 1e-6)
  for (const glass of state.glasses)
    glass.trail = glass.trail.filter(({ at }) => now - at < TIME_PAST_SEC + 0.1)
  const newest = state.glasses[state.glasses.length - 1] ?? null
  if (newest && frame.meter('level') > 0) {
    newest.u = clamp(frame.meter('place'), -2, 2)
    newest.speed = clamp(frame.meter('way'), -1, 1)
    newest.trail[newest.trail.length - 1].u = newest.u
  }
  return newest
}

/** One key struck as the picture begins, and run to its end. */
export function timeAlone(set: TimeSet, now: number): TimeRunning {
  const at = now - TIME_PAST_SEC
  const glass = timeStart(set, REST_HZ, 0.75, set.apart > 0 ? 1 : 0)
  const running: TimeRunning = { ...glass, id: -1, at, trail: [{ at, u: glass.u }] }
  runOn(set, [running], at, now)
  return running
}
