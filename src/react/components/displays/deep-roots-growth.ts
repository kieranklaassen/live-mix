// What grows in the picture of Deep Roots: the keys and the roots it shows on a
// frame, each root on its way to what the law gives it (`deep-roots-law.ts`) at
// the pace the device gives it (`cpp/devices/deep-roots/deep_roots.h`: `birth`,
// `root_tick`, `pace_`).

import { clamp, follow } from '../display-kit'
import { type DisplayFrame } from '../plate-display'
import {
  DEEP_LIFE,
  DEEP_SOILS,
  deepCrowds,
  deepPlan,
  type DeepAsk,
  type DeepLaw,
} from './deep-roots-law'
import { type HeardLevel } from './instrument-parts'

/** The top of Decay: no decay at all. */
export const DEEP_FOREVER = 40
const SIXTY_DB = 6.9
const PULSE_PEAK = 0.1
/** A root that has come down to this is not drawn any more. */
const GONE = 0.01

export interface DeepSettings extends DeepLaw {
  leaf: number
  soil: number
  balance: number
  stagger: number
  attack: number
  release: number
  rootTone: number
  grain: number
  decay: number
  pulse: number
}

export const DEEP_CHOSEN = ['leaf', 'soil'] as const
export const DEEP_READ = [
  ...['series', 'reach', 'branching', 'growth', 'meeting', 'fit', 'tolerance', 'floor'],
  ...['balance', 'stagger', 'attack', 'release', 'rootTone', 'grain', 'decay', 'pulse'],
]

export function deepSettings(value: (name: string) => number): DeepSettings {
  const chosen = (name: string): number => clamp(Math.floor(value(name) + 0.5), 0, 4)
  const pairs: [string, number][] = [
    ...DEEP_CHOSEN.map((name): [string, number] => [name, chosen(name)]),
    ...DEEP_READ.map((name): [string, number] => [name, value(name)]),
  ]
  const settings: Record<string, number> = Object.fromEntries(pairs)
  return settings as unknown as DeepSettings
}

/** One pulse of a root, as `root_tick` gives it: at which rate it comes and how loud it is at a place in it. */
export function deepPulse(pulse: number, hz: number, seconds: number): number {
  const share = clamp(pulse * 16, 0, 1)
  const depth = share * share * (3 - 2 * share) * (0.86 + 0.14 * pulse)
  const octave = Math.log2(hz / 110)
  const rate = 0.25 * Math.pow(2, 5 * pulse) * Math.pow(2, octave - Math.floor(octave + 0.5))
  const at = (PULSE_PEAK + rate * Math.max(seconds, 0)) % 1
  const u = at < PULSE_PEAK ? at / PULSE_PEAK : 1 - (at - PULSE_PEAK) / (1 - PULSE_PEAK)
  const shape = at < PULSE_PEAK ? u * u * (3 - 2 * u) : u * u * (0.35 + 0.65 * u)
  return 1 - depth + depth * 1.45 * shape
}

// --- What grows ----------------------------------------------------------------

export interface DeepKey {
  id: number
  start: number
  hz: number
  gain: number
  released: number | null
  /** When its roots set out. */
  from: number
  /** What letting go has left of its leaf and of its roots. */
  leaf: number
  roots: number
  x: number
}

export interface DeepRoot {
  key: DeepKey | null
  parents: DeepKey[]
  num: number
  den: number
  hz: number
  goalHz: number
  goal: number
  power: number
  velocity: number
  from: number
  up: number
  x: number
}

export interface DeepState extends HeardLevel {
  keys: DeepKey[]
  roots: DeepRoot[]
}

export const deepFresh = (): DeepState => ({ keys: [], roots: [], heard: [], shown: 0 })

/** `touch`, with the bass made stronger as `root_tick` does. */
const loudness = (hz: number, velocity: number): number =>
  (0.08 + 0.92 * Math.pow(velocity, 1.5)) * (1 + 0.4 * clamp((150 - hz) / 90, 0, 1))

/** The keys of this frame: the ones held, and the ones let go that are still heard. */
export function deepKeysNow(
  state: DeepState,
  frame: DisplayFrame<DeepState>,
  set: DeepSettings,
): void {
  const { now } = frame
  const soil = DEEP_SOILS[set.soil]
  const before = state.keys
  state.keys = []
  for (const note of frame.notes) {
    const start = now - note.age
    const kept = before.find((key) => key.id === note.id && Math.abs(key.start - start) < 0.1)
    // A key waits for the others that are held, and for no other.
    const from = state.keys.reduce(
      (late, other) => (other.released === null ? Math.max(late, other.from + set.stagger) : late),
      start,
    )
    const { id, frequency: hz, gain } = note
    const key = kept ?? {
      id,
      start,
      hz,
      gain,
      released: null,
      from: start,
      leaf: 1,
      roots: 1,
      x: -1,
    }
    if (!kept && set.stagger > 0) key.from = from
    key.released = note.released
    const up = note.released ?? 0
    key.leaf = Math.exp((-SIXTY_DB * up) / set.release)
    key.roots = Math.exp((-SIXTY_DB * up) / (set.release * soil.release))
    if (Math.max(key.leaf, key.roots) > GONE) state.keys.push(key)
  }
}

/** The roots of this frame, each on its way to what the law gives it. */
export function deepRootsNow(
  state: DeepState,
  set: DeepSettings,
  now: number,
  dt: number,
): DeepAsk[] {
  const held = state.keys.filter((key) => key.released === null)
  const found = (ask: DeepAsk): DeepRoot | undefined =>
    state.roots.find((root) =>
      ask.key < 0
        ? root.key === null && Math.abs(root.goal - ask.goal) < 0.03
        : root.key === held[ask.key] && root.num === ask.num && root.den === ask.den,
    )
  const { roots } = deepPlan(set, held, (ask) => {
    const root = found(ask)
    return root ? now - root.up : null
  })
  const asked = new Set<DeepRoot>()
  const up = clamp(0.03 + 0.4 * set.growth, 0.03, 1.2)
  const down = clamp(0.06 + 0.6 * set.growth, 0.06, 0.6)
  for (const ask of roots) {
    const { num, den, goal, goalHz, power, velocity, from } = ask
    const key = ask.key < 0 ? null : held[ask.key]
    let root = found(ask)
    if (!root) {
      const grown = from + set.growth * ask.depth
      // A root asked for long after its key came down is there at once; one of a key just read was there.
      const late = held.some((each) => each.x >= 0) ? Math.max(grown, now) : grown
      const hz = key ? ask.hz : goalHz
      root = {
        key,
        parents: [],
        num,
        den,
        hz,
        goalHz,
        goal,
        power,
        velocity,
        from,
        up: late,
        x: -1,
      }
      state.roots.push(root)
    }
    asked.add(root)
    root.parents = ask.parents.map((index) => held[index])
    root.goalHz = goalHz
    root.goal = goal
    root.velocity = velocity
    root.hz = follow(root.hz, goalHz, dt, 0.35, 0.35)
    root.power = now < root.up ? power : follow(root.power, power, dt, up, down)
  }
  const ring = set.release * DEEP_SOILS[set.soil].release
  const gone = held.length > 0 ? clamp(ring, 0.1, 2.5) : ring
  for (const root of state.roots) {
    const letGo = root.key !== null && root.key.released !== null
    // A root that has not come up when its key goes, or when nobody asks for it any more, never does.
    if (now < root.up && (letGo || !asked.has(root))) root.power = 0
    // What is only dying away makes room at once.
    else if (!asked.has(root) && roots.some((ask) => deepCrowds(root.hz, ask.goalHz)))
      root.power = follow(root.power, 0, dt, 0.018, 0.018)
    else if (asked.has(root) || letGo) continue
    else if (root.key) root.power = follow(root.power, 0, dt, down, down)
    else root.power *= Math.exp((-SIXTY_DB * dt) / gone)
  }
  state.roots = state.roots.filter(
    (root) =>
      root.power > GONE && (!root.key || (state.keys.includes(root.key) && root.key.roots > GONE)),
  )
  return roots
}

/** How far a root's line has come (0..1), and how loud its tip is. */
export function deepGrown(
  root: DeepRoot,
  set: DeepSettings,
  now: number,
): { line: number; level: number } {
  const soil = DEEP_SOILS[set.soil]
  const line = root.up > root.from ? clamp((now - root.from) / (root.up - root.from), 0, 1) : 1
  if (now < root.up) return { line: now < root.from ? 0 : line, level: 0 }
  const rise = soil.quick + 0.8 * set.growth * soil.rise + 0.7 * set.attack
  const open = clamp((now - root.up) / rise, 0, 1)
  const life = DEEP_LIFE[set.leaf]
  const fall = Math.max(0, 1 / set.decay - 1 / DEEP_FOREVER + (life > 0 ? 1 / life : 0))
  const left = Math.exp(-SIXTY_DB * fall * Math.max(0, now - root.up - rise))
  const owner = root.key?.roots ?? 1
  const beat = deepPulse(set.pulse, root.goalHz, now - root.up)
  return {
    line,
    level:
      root.power *
      open *
      open *
      (3 - 2 * open) *
      left *
      owner *
      beat *
      loudness(root.hz, root.velocity),
  }
}
