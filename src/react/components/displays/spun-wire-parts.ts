// The arithmetic of Spun Wire's display: what the device
// (cpp/devices/spun-wire/spun_wire.h) makes of its knobs, under the names it
// has there, and the wheel run as the device runs it, with no wander in it.

import { normalizeParam } from '../../../core/params'
import { clamp, follow, type Box } from '../display-kit'
import { type DisplayFrame, type DisplayNote, type DisplayView } from '../plate-display'
import { type HeardLevel } from './instrument-parts'

const TURN = Math.PI * 2

export const READS =
  'tuning gesture plucker hub spin melt rise coast gear strung lacing wobble gauge ring edge point rim release'
const COUNTED = ['tuning', 'gesture', 'plucker', 'hub', 'gear', 'strung']
/** The knobs the display reads, the choices and the counts as whole numbers. */
export type SpunSet = Readonly<Record<string, number>>
export const spunSet = (read: (name: string) => number): SpunSet =>
  Object.fromEntries(
    READS.split(' ').map((name) => [
      name,
      COUNTED.includes(name) ? Math.round(read(name)) : read(name),
    ]),
  )

export const TUNINGS = ['Unison', 'Octaves', 'Overtones', 'Fan']
export const GESTURES = ['Driven', 'Thrown', 'One turn', 'Rocked']
export const THROWN = 1
export const ONE_TURN = 2
export const ROCKED = 3
export const CARD = 1
export const NAIL = 2
export const AIR = 3
/** `ratios`: each wire against the key. */
export const SPUN_RATIOS: readonly (readonly number[])[] = [
  [1, 1, 1, 1, 1, 1],
  [1, 2, 4, 0.5, 2, 8],
  [1, 3, 5, 7, 9, 6],
  [1, 1.5, 0.75, 2.25, 0.5, 0.375],
]
/** Of `Plucker` and `Hub`: what each makes of the wires' ring; `kUneven`: how far a wire stands back. */
const TOUCH_RING = [1, 0.008, 3, 0.5]
const HUB_RING = [1.6, 0.6, 0.07]
export const UNEVEN = [0, 0.8, 0.4, 1, 0.2, 0.7]
const STOP = 0.12
export const TOP_SPEED = 90
export const TICK = 1 / 240

export const wrap = (value: number, round: number): number => ((value % round) + round) % round

/** `wire_hz`: a wire over 5 kHz is strung an octave lower, one under 26 Hz an octave higher. */
export function spunHz(key: number, ratio: number): number {
  let hz = key * ratio
  while (hz > 5000) hz *= 0.5
  while (hz < 26 && hz < key) hz *= 2
  return hz
}

/** `design`: how long a wire at `hz` rings to -60 dB while its key is down, in seconds. */
export function spunRing(set: SpunSet, hz: number): number {
  const touch = TOUCH_RING[set.plucker]
  const said = touch < 1 ? Math.pow(set.ring, 0.75) : set.ring
  const ring = clamp(said * HUB_RING[set.hub] * touch * (1.1 - 0.75 * set.gauge), 0.012, 50)
  return ring * clamp(Math.pow(hz / 330, -0.3), 0.4, 2)
}

/** `melted`: how far a wheel at this many passes a second is rubbed and no longer plucked. */
export function spunMelted(set: SpunSet, speed: number): number {
  if (speed < 0.5 || set.gesture === ONE_TURN) return 0
  const t = clamp((Math.log2(speed / set.melt) - (set.plucker === CARD ? 1.5 : 0) + 1.5) / 3, 0, 1)
  return t * t * (3 - 2 * t)
}

/** `geared`: how fast the wheel goes that stands `rank` keys over the lowest one held. */
export function spunGeared(gear: number, rank: number): number {
  if (gear === 2) return (3 + rank) / 3
  if (gear === 3) return 1 + rank
  return gear === 4 ? 1 / (1 + rank) : 1
}

export interface SpunRun {
  /** The speed every `TICK`, in passes a second. */
  speeds: number[]
  /** The plucks: when, and how hard, 0..1. */
  plucks: { at: number; force: number }[]
  /** When the key is let go or, thrown, the wheel is: what comes after is the coast. */
  turns: number
}

/** `turn`: how the wheel of a key runs that is held for `hold` seconds, until it stands or `most` is over. */
export function spunRun(set: SpunSet, hold: number, most: number): SpunRun {
  const spin = Math.min(set.spin, TOP_SPEED)
  const run: SpunRun = { speeds: [], plucks: [{ at: 0, force: 1 }], turns: hold }
  let [speed, from, part, passes, coasting, resting] = [0, 1, 0, 0, false, false]
  let [swing, phase, swung] = [0.34, 0, 0]
  for (let at = 0; at < most && !resting; at += TICK) {
    const held = at < hold
    let forward = 0
    if (set.gesture === ONE_TURN) {
      speed += (spin - speed) * Math.min(1, (TICK * 6) / set.rise)
      forward = Math.max(speed, 0.08 * spin) * TICK
      resting = passes >= set.strung - 1
    } else if (set.gesture === ROCKED) {
      swing += held ? (1 - swing) * Math.min(1, (TICK * 2.2) / set.rise) : -TICK / set.coast
      resting = swing <= 0.02
      const before = swung
      phase += (TICK * spin) / 6
      swung = 6 * swing * Math.sin(phase)
      forward = swung - before
      speed = Math.abs(forward) / TICK
    } else {
      if (held && !coasting) {
        if (speed < 0.15 * spin) speed += (0.15 * spin - speed) * Math.min(1, TICK * 30)
        speed += (spin - speed) * Math.min(1, (TICK * 2.2) / set.rise)
        from = Math.max(speed, 0.5)
        coasting = set.gesture === THROWN && speed > 0.93 * spin
        if (coasting) run.turns = at
      } else {
        const braked = set.gesture === THROWN && !held ? 3 : 1
        speed -= ((TICK * 2 * braked) / set.coast) * Math.sqrt(from * Math.max(speed, 0))
        coasting = true
        resting = speed <= STOP
      }
      forward = speed * TICK
    }
    if (resting) break
    run.speeds.push(speed)
    part += forward
    const whole = Math.floor(part)
    part -= whole
    const often = speed > 20 ? Math.pow(20 / speed, 0.35) : 1
    const force =
      often * Math.sqrt(1 - spunMelted(set, speed)) * (0.55 + 0.45 * Math.min(1, speed / spin))
    for (let n = 0; n < Math.abs(whole); n++) if (force > 0.02) run.plucks.push({ at, force })
    passes += whole
  }
  return run
}

// --- The picture ---------------------------------------------------------------

export const LOW = 0.35
export const HIGH = 80

export function spunLayout(view: Pick<DisplayView, 'width' | 'height'>) {
  const w = view.width - 8
  const foot: Box = { x: 4, y: view.height - 8, w, h: 4 }
  const keys: Box = { x: 4, y: foot.y - 5, w, h: 3 }
  const r = Math.min((keys.y - 24) / 2, w * 0.27)
  const wheel = { x: 5 + r, y: keys.y - 4 - r, r }
  const left = wheel.x + r + 8
  return { wheel, lane: { x: left, y: 18, w: w + 2 - left, h: keys.y - 22 }, keys, foot }
}
/** Where a speed stands in the lane. */
export const spunY = (speed: number, lane: Box): number =>
  lane.y + lane.h * clamp(1 - Math.log(Math.max(speed, 1e-3) / LOW) / Math.log(HIGH / LOW), 0, 1)

/** How long a wheel is shown with its key down, and how many pixels a second is worth before and after it turns to coast. */
export function spunScale(view: DisplayView, set: SpunSet, lane: Box) {
  const half = lane.w * 0.48
  const spec = view.spec('rise')
  const risen = (0.12 + 0.7 * (spec ? normalizeParam(spec, set.rise) : 0)) * half
  // One turn is shown whole, and a rocked wheel for one swing at least.
  const turned = set.gesture === ONE_TURN ? (set.strung + 1) / set.spin + set.rise / 4 : 0
  const least = set.gesture === ROCKED ? (6 * TURN) / set.spin : turned
  const up = Math.min(risen / set.rise, (turned > 0 ? lane.w : half) / Math.max(least, 1e-3))
  const hold = half / up
  const coast = (0.15 + 0.75 * view.at('coast')) * (lane.w - half)
  return { up, hold, down: coast / set.coast }
}
type Scale = ReturnType<typeof spunScale>
export const spunX = (at: number, turns: number, scale: Scale, lane: Box): number =>
  lane.x + Math.min(at, turns) * scale.up + Math.max(at - turns, 0) * scale.down

export interface SpunState extends HeardLevel {
  /** The wheel as it is shown, in passes, which way it goes and what was read of it last. */
  at: number
  way: number
  turn: number
  struck: number
  /** How hard each wire swings. */
  swings: number[]
  run: { of: string; run: SpunRun } | null
}
export type SpunFrame = DisplayFrame<SpunState>
export const spunNewest = (frame: SpunFrame): DisplayNote | undefined =>
  frame.notes.reduce<DisplayNote | undefined>((a, b) => (a && a.age < b.age ? a : b), undefined)

/** One frame of the wheel that is shown: where it is, and how its wires swing. */
export function spunMove(frame: SpunFrame, set: SpunSet, note: DisplayNote | undefined): void {
  const { state, dt } = frame
  const speed = frame.powered ? clamp(frame.meter('speed'), 0, TOP_SPEED) : 0
  const melt = spunMelted(set, speed)
  const hz = note?.frequency ?? 220
  const force = 0.97 * Math.pow(note?.gain ?? 0.7, 0.9)
  const touched = (pass: number, strength: number): void => {
    const wire = wrap(pass, set.strung)
    let size = force * strength * (1 - 0.95 * set.wobble * UNEVEN[wire] ** 2)
    for (let k = 0; k <= 3 && k < set.strung; k++) {
      const other = (wire + k) % set.strung
      state.swings[other] = Math.max(state.swings[other], size)
      size *= 0.95 * Math.sqrt(set.lacing)
    }
  }
  const begun = note ? frame.now - note.age : -1
  if (note && frame.powered && Math.abs(begun - state.struck) > 0.05) {
    state.struck = begun
    if (note.age < 0.2) touched(Math.floor(state.at), 1)
  }
  const reading = frame.meter('turn')
  const moved = wrap(reading - state.turn + 0.5, 1) - 0.5
  if (moved !== 0) state.way = Math.sign(moved)
  state.turn = reading
  // In step with the device while the eye can follow, and slowed above four passes a second.
  const before = Math.floor(state.at)
  state.at += state.way * dt * (speed > 4 ? 4 * Math.pow(speed / 4, 0.35) : speed)
  if (speed > 0 && speed <= 4) state.at += 0.2 * (wrap(6 * reading - state.at + 0.5, 1) - 0.5)
  const after = Math.floor(state.at)
  if (before !== after) touched(Math.max(before, after), Math.sqrt(1 - melt))
  const even = set.plucker === AIR ? 0.6 * set.lacing : 0.35 + 0.5 * set.lacing
  const level = 0.45 + 0.2 * clamp((spunRing(set, 330) - 1.5) / 3, 0, 1)
  const rub = Math.sqrt(melt) * level * force * (set.plucker >= NAIL ? 1.6 : 1)
  for (let i = 0; i < 6; i++) {
    const ring = spunRing(set, spunHz(hz, SPUN_RATIOS[set.tuning][i]))
    const loss = 1 / ring + (note?.released != null ? 1 / set.release : 0)
    const near = 0.5 + 0.5 * Math.cos((TURN * (state.at - i)) / 6)
    const rubbed = rub * (even + (1 - even) * near)
    const left =
      i < set.strung && frame.powered ? state.swings[i] * Math.exp(-6.908 * loss * dt) : 0
    state.swings[i] = i < set.strung ? follow(left, Math.max(left, rubbed), dt, 0.1, 1) : 0
  }
}
