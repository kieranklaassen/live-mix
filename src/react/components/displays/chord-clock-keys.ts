// The clocks of Chord Clock, as its display follows them: what the device does
// with its keys, worked out from the knobs and the notes it was sent
// (`cpp/devices/chord-clock`, whose names are given).

import { clamp } from '../display-kit'
import { type DisplayFrame } from '../plate-display'
import { type HeardLevel } from './instrument-parts'

export const MIDDLE_C = 261.6256
const rows = (table: string) => table.split(',').map((row) => row.split(' ').map(Number))
/** `material`, `resonator`: attack, sustain, fall, release and ring of each. */
export const PULSE_NAMES = ['Tap', 'Drop', 'Bow', 'Breath', 'Pluck']
export const PULSES = rows(
  '1 .85 2.5 1 1,2.5 1 2 1.7 .75,5.5 1 2 .36 1.1,5 1 2 2.2 .22,.05 .05 .75 .4 1.9',
)
export const BODY_NAMES = ['wood', 'glass', 'skin', 'air']
export const BODIES = rows('1 1 2 1 .55,1.6 .9 5 2 2.6,.3 .22 .9 .45 .42,3.5 1 2 .32 .16')
const PATH_RELEASE = [1, 0.4, 0.5, 2.8]
export const [STEPS, SLOWING, TURN] = [1, 2, 3]
/** `kFractions`: the fraction of each semitone, for threes, fives, sevens, nines and elevens. */
const FRACTIONS = [
  '1/1 256/243 9/8 32/27 81/64 4/3 729/512 3/2 128/81 27/16 16/9 243/128',
  '1/1 16/15 9/8 6/5 5/4 4/3 45/32 3/2 8/5 5/3 9/5 15/8',
  '1/1 15/14 8/7 7/6 5/4 4/3 7/5 3/2 14/9 12/7 7/4 15/8',
  '1/1 16/15 10/9 7/6 9/7 4/3 10/7 3/2 14/9 5/3 16/9 27/14',
  '1/1 22/21 11/10 11/9 14/11 4/3 11/8 3/2 11/7 18/11 11/6 21/11',
].map((row) => row.split(' ').map((each) => each.split('/').map(Number)))

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
const wrap = (x: number): number => x - Math.floor(x + 0.5)

/** `ratio_of`: the whole ratio of a key so many semitones above the lowest. */
export function clockRatio(family: number, semitones: number): [number, number] {
  const [over, q] = FRACTIONS[Math.round(family) - 1][semitones % 12]
  const p = over * 2 ** Math.floor(semitones / 12)
  return [p / gcd(p, q), q / gcd(p, q)]
}

/** The knobs as the device applies them. */
export function clockKnobs(value: (name: string) => number) {
  const [pulse, body] = [PULSES[Math.round(value('pulse'))], BODIES[Math.round(value('body'))]]
  const attack = clamp(value('attack') * Math.min(pulse[0] * body[0], 5.5), 0.004, 10)
  const path = Math.round(value('path'))
  return { value, pulse, body, path, attack, slow: 2 ** -value('slowness') }
}
export type ClockKnobs = ReturnType<typeof clockKnobs>

/** `path_below`: octaves under its pitch a key's quickening pulses are, `u` of Quicken in. */
export function clockBelow(path: number, slowness: number, u: number): number {
  if (path === STEPS) {
    const steps = Math.ceil(slowness - 0.001)
    return Math.max(slowness - Math.min(Math.floor(Math.min(u, 1) * (steps + 0.999)), steps), 0)
  }
  if (path !== TURN) return slowness * (path === SLOWING ? Math.min(u, 1) : 1 - Math.min(u, 1))
  const there = 1 - Math.abs(2 * (u - Math.floor(u)) - 1)
  return slowness * (1 - there * there * (3 - 2 * there))
}

type Notes = DisplayFrame['notes']
/**
 * `Voice`: a sounding key, `p/q` to the lowest, its pulses so far and where
 * they are wanted, and along how much of Quicken its Path is.
 */
const fresh = { p: 1, q: 1, offset: 0, phase: 0, target: 0, placed: false, path: 0 }
const newKey = (note: Notes[number]) => ({ note, aim: note.frequency, ...fresh })
export type ClockKey = ReturnType<typeof newKey>
/** The clocks together; the pattern is back after `turn` pulses of the lowest key, the anchor. */
export function clockState() {
  const clocks = { anchor: null as ClockKey | null, anchorHz: MIDDLE_C, master: 0, turn: 4 }
  return { ...clocks, keys: [] as ClockKey[], heard: [] as HeardLevel['heard'], shown: 0 }
}
export type ClockState = ReturnType<typeof clockState>

/** `place_keys`: who is lowest, and where everybody's ratio puts them. */
function placeKeys(state: ClockState, value: ClockKnobs['value']): void {
  const held = state.keys.filter((key) => key.note.released === null)
  if (held.length === 0) return
  const bass = held.reduce((low, key) => (key.note.frequency < low.note.frequency ? key : low))
  if (bass !== state.anchor)
    state.master = bass.placed ? Math.round(bass.target) + wrap(bass.phase) : bass.phase
  state.anchor = bass
  state.anchorHz = bass.note.frequency
  state.turn = 1
  for (const key of held) {
    const hz = key.note.frequency
    const semitones = Math.floor(12 * Math.log2(hz / state.anchorHz) + 0.5)
    ;[key.p, key.q] = clockRatio(value('ratios'), semitones)
    key.aim = hz * ((state.anchorHz * key.p) / key.q / hz) ** value('agree')
    key.offset = (semitones * 0.618034) % 1
    if (value('agree') >= 0.995 || !key.placed) key.target = (state.master * key.p) / key.q
    key.placed = true
    const together = (state.turn / gcd(state.turn, key.q)) * key.q
    if (together <= 4096) state.turn = together
  }
  if (state.turn < 2) state.turn = 4
}

/** `advance_level`: how loud a key's tone and its pulses are. */
export function clockLevel(knobs: ClockKnobs, key: ClockKey): [tone: number, rhythm: number] {
  const { value, pulse, body, path } = knobs
  const up = key.note.released ?? 0
  const held = key.note.age - up
  const t = Math.min(held / knobs.attack, 1)
  const fused = 1 - clockBelow(path, value('slowness'), key.path) / value('slowness')
  const stays = Math.max(pulse[1] * body[1], path === STEPS ? 0 : 0.32 * fused * fused)
  const fallen = Math.exp(-Math.max(held - knobs.attack, 0) / Math.min(pulse[2], body[2]))
  const level = t < 1 ? t * (2 - t) * (0.25 + 0.75 * t) : stays + (1 - stays) * fallen
  const dies = (1.15 - 0.65 * value('slowAgain')) * 2 ** (1.6 * (0.5 - value('damping')))
  const tail = value('release') * pulse[3] * body[3] * PATH_RELEASE[path] * dies
  const going = (0.7 + 2.6 * value('slowAgain')) * (path === SLOWING ? 1.8 : 1) * value('release')
  const waits = Math.min(value('bloom') * [0.8, 1.5, 1, 1.5][path], 1) * (1 - fused)
  const open = 1.19 * value('tone') * (0.2 + 0.8 * value('tone')) * (1 - waits) ** 2
  return [open * level * Math.exp((-6.907755 * up) / tail), Math.exp((-6.907755 * up) / going)]
}

/** `render_voice`: every key's clock `dt` on, pulled to where the lowest key's wants it. */
export function clockMove(state: ClockState, notes: Notes, knobs: ClockKnobs, dt: number): void {
  const { value, slow } = knobs
  // One pitch is one voice: the newest note on it.
  const newest = new Map(notes.map((note) => [note.frequency, note]))
  // While the lowest key is held the others go where the knobs put them.
  let place = state.anchor?.note.released === null
  for (const [hz, note] of newest) {
    let key = state.keys.find((each) => each.note.frequency === hz)
    if (!key) state.keys.push((key = newKey(note)))
    if (!key.placed || key.note.id !== note.id || note.age < key.note.age) {
      place = true
      key.phase = note.age * hz * slow
      key.path = note.age / value('quicken')
    }
    key.note = note
  }
  const sounds = (key: ClockKey): boolean =>
    key.note.released === null || Math.max(...clockLevel(knobs, key)) > 0.01
  state.keys = state.keys.filter((key) => newest.has(key.note.frequency) && sounds(key))
  if (state.keys.length === 0) state.anchor = null
  if (place) placeKeys(state, value)
  const beat = state.anchorHz * slow * dt
  for (const key of state.keys) {
    const held = key.note.released === null
    const gone = (key.note.released ?? 0) / (0.35 * value('release') + 0.15)
    const rate = key.aim * slow * 2 ** (-3.5 * value('slowAgain') * (1 - Math.exp(-gone)))
    const locked = held && value('agree') >= 0.995
    const step = locked ? (beat * key.p) / key.q : rate * dt
    if (locked) key.target = (state.master * key.p) / key.q
    const error = wrap(key.target + key.offset * value('stagger') - key.phase)
    const nudge = held ? error * Math.min(dt * Math.min(0.35 * rate, 1.5), 1) : 0
    key.phase += step + clamp(nudge, -0.4 * step, 0.4 * step)
    key.target += step
    const there = knobs.path === SLOWING ? Math.min(0.05 + key.note.age / knobs.attack, 1) : 1
    key.path += (dt / value('quicken')) * there
    if (key.path > 4) key.path -= 2
  }
  state.master += beat
}

/** At most so many of the lowest key's pulses in one turn are drawn. */
export const TURN_MOST = 24

/** Where in the turn each pulse of a key is, 0 to 1, which are stressed, how long ago in turns. */
export function clockMarks(state: ClockState, key: ClockKey) {
  const turn = Math.min(state.turn, TURN_MOST)
  const pace = key.note.released === null ? key.aim / state.anchorHz : key.p / key.q
  const from = Math.floor(state.master / turn + 1e-9) * turn
  const period = key === state.anchor ? state.turn : key.p
  const marks: { share: number; home: boolean; ago: number }[] = []
  const first = Math.ceil(key.phase + (from - state.master) * pace - 1e-6)
  for (let n = first; marks.length < turn * 64; n++) {
    const at = state.master + (n - key.phase) / pace
    if (at >= from + turn - 1e-6 / pace) break
    const home = period > 1 && Math.round(key.target + n - key.phase) % period === 0
    const back = (state.master - at) / turn
    marks.push({ share: (at - from) / turn, home, ago: back < 0 ? back + 1 : back })
  }
  return marks
}
