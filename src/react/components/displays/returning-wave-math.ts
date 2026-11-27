// Returning Wave's own arithmetic, for its display: the modes a key throws, how
// they turn, what is read off them and how time passes. It is the device's
// (`cpp/devices/returning-wave/wave_modes.h` and `returning_wave.h`; the names
// in backticks are its own), with the levels, the body and the air left out.

import { clamp } from '../display-kit'
import { type DisplayNote } from '../plate-display'

export const TAU = Math.PI * 2
/** `kModes`, `kBins`, `kTickSeconds`. */
export const WAVE_MODES = 24
export const WAVE_BINS = 2 * WAVE_MODES + 4
export const TICK = 256 / 48000
const RING = 1
const BOWL = 2
export const FADING = 4
const CRESTS = 1
const FLOW = 2

/** The knobs the picture is drawn from. */
// prettier-ignore
export const WAVE_KNOBS = [
  'walls', 'reading', 'width', 'throw', 'place', 'second', 'gap', 'return',
  'clock', 'start', 'freeze', 'leak', 'blur', 'attack', 'release',
] as const
type Knob = (typeof WAVE_KNOBS)[number]
export type WaveSettings = Readonly<Record<Knob, number>>

export function waveSettings(value: (name: string) => number): WaveSettings {
  const set = {} as Record<Knob, number>
  for (const name of WAVE_KNOBS) set[name] = value(name)
  for (const name of ['walls', 'reading', 'clock'] as const) set[name] = Math.floor(set[name] + 0.5)
  return set
}

/** `make_law`: the energy of a mode in turns a return, the number of the first, and what a wall does to the wave. */
export function waveLaw(walls: number) {
  const base = walls === RING ? -WAVE_MODES / 2 : walls === BOWL ? 0 : 1
  const energy = Array.from({ length: WAVE_MODES }, (_, i) => {
    const n = i + base
    const pair = Math.floor(i / 2) + 1
    if (walls === BOWL) return 1.5 * n
    if (walls === 3) return 2 * pair * pair + (i % 2 ? 0.5 : -0.5) * (1 + 0.11 * pair)
    return walls === FADING ? -1400 / ((n + 3) * (n + 3)) : 0.5 * n * n
  })
  return { base, energy, mirror: walls === RING ? 0 : walls === BOWL ? 1 : -1, walls }
}
type Law = ReturnType<typeof waveLaw>

export const wavePlace = (place: number): number => Math.PI * (0.03 + 0.47 * place)
/** `throw_packet`: how far along the second wave starts, in radians from the wall. */
export const waveSecondAt = (set: WaveSettings): number =>
  wavePlace(set.place) + (Math.PI - 2 * wavePlace(set.place)) * (0.1 + 0.9 * set.gap)

/** `throw_packet`, `add_packet`, `finish_packet`: the modes of the wave a key of this touch throws. */
export function wavePacket(law: Law, set: WaveSettings, hit: number) {
  const re = new Float64Array(WAVE_MODES)
  const im = new Float64Array(WAVE_MODES)
  const add = (spread: number, push: number, place: number, weight: number): void => {
    for (let i = 0; i < WAVE_MODES; i++) {
      const n = i + law.base
      const on = weight * Math.exp(-((n - push) ** 2) / (4 * spread * spread))
      const back = law.mirror * weight * Math.exp(-((n + push) ** 2) / (4 * spread * spread))
      re[i] += on * Math.cos((push - n) * place) + back * Math.cos((push + n) * place)
      im[i] += on * Math.sin((push - n) * place) + back * Math.sin((push + n) * place)
    }
  }
  const spread = 8 * Math.pow(0.12, set.width) * (0.72 + 0.4 * hit)
  const reach = set.reading === CRESTS ? 0.45 : 1
  const push = reach * 17 * set.throw * (0.45 + 0.8 * hit) * (law.base < 0 ? 0.45 : 1)
  add(spread, push, wavePlace(set.place), 1)
  if (set.second > 0) {
    const stripes = Math.min(push + reach * (1.5 + 13 * set.gap), WAVE_MODES + law.base - 1)
    add(spread * 0.7, stripes, waveSecondAt(set), 2.4 * Math.pow(set.second, 1.1))
  }
  let total = 0
  let middle = 0
  for (let i = 0; i < WAVE_MODES; i++) {
    const power = re[i] * re[i] + im[i] * im[i]
    total += power
    middle += power * i
  }
  if (!(total > 1e-12)) re[0] = total = 1
  const scale = 1 / Math.sqrt(total)
  for (let i = 0; i < WAVE_MODES; i++) {
    re[i] *= scale
    im[i] *= scale
  }
  return { re, im, centre: clamp(Math.floor(middle / total + 0.5), 0, WAVE_MODES - 1) }
}
type Packet = ReturnType<typeof wavePacket>

/** `pace_at`: the wave lingers where it is whole, and a little in two, three and four copies. */
export function wavePace(journey: number): number {
  const way = journey - Math.floor(journey)
  const from = Math.min(way, 1 - way)
  const near = (at: number, wide: number): number => 1 / (1 + ((from - at) / wide) ** 2)
  return (
    1.36 /
    (1 + 8 * near(0, 0.008) + 4 * near(0.5, 0.006) + 3 * near(1 / 3, 0.004) + 2 * near(0.25, 0.003))
  )
}

const CLOCK_STEPS = 2048
const clockTable = new Float64Array(CLOCK_STEPS + 1)
for (let i = 0; i < CLOCK_STEPS; i++)
  clockTable[i + 1] = clockTable[i] + 1 / (wavePace((i + 0.5) / CLOCK_STEPS) * CLOCK_STEPS)
/** The time one return of the journey takes, in returns as the knob says it. */
export const WAVE_TURN = clockTable[CLOCK_STEPS]

/** How much of a return's time is behind a wave that is so far on its journey, and the other way. */
export function waveClock(journey: number): number {
  const whole = Math.floor(journey)
  const at = (journey - whole) * CLOCK_STEPS
  const i = Math.min(Math.floor(at), CLOCK_STEPS - 1)
  return whole + (clockTable[i] + (clockTable[i + 1] - clockTable[i]) * (at - i)) / WAVE_TURN
}
export function waveJourney(clock: number): number {
  const whole = Math.floor(clock)
  const want = (clock - whole) * WAVE_TURN
  let low = 0
  let high = CLOCK_STEPS
  while (high - low > 1) {
    const mid = (low + high) >> 1
    if (clockTable[mid] <= want) low = mid
    else high = mid
  }
  return (
    whole + (low + (want - clockTable[low]) / (clockTable[high] - clockTable[low])) / CLOCK_STEPS
  )
}

/** `advance`: how fast the leak takes a key, and what it has left of a mode after so much of it. */
export const waveLeak = (leak: number): number => 4.5 * leak * leak * leak + 0.1 * leak
function leftOf(law: Law, mode: number, lost: number): number {
  const n = Math.abs(mode + law.base) / 6
  return lost > 0 ? Math.exp(-lost * (0.4 + 0.7 * n + 0.8 * n * n)) : 1
}

/**
 * `density`, `crests`, `make_weights`, the bowl's breath: the harmonics of what
 * is read at a place on the journey, and how far the modes are in step. `even`
 * is what of the reading stands everywhere, so that a density is never under 0.
 */
export function waveReading(
  law: Law,
  packet: Packet,
  reading: number,
  journey: number,
  pace: number,
  blur: number,
  lost = 0,
) {
  const { energy, base, mirror } = law
  const rho = new Float64Array(WAVE_BINS)
  const flow = new Float64Array(WAVE_BINS)
  const re = new Float64Array(WAVE_MODES)
  const im = new Float64Array(WAVE_MODES)
  let norm = 0
  for (let i = 0; i < WAVE_MODES; i++) {
    const turns = energy[i] * journey
    const turn = TAU * (turns - Math.floor(turns))
    const left = leftOf(law, i, lost)
    re[i] = left * (packet.re[i] * Math.cos(turn) - packet.im[i] * Math.sin(turn))
    im[i] = left * (packet.re[i] * Math.sin(turn) + packet.im[i] * Math.cos(turn))
    norm += re[i] * re[i] + im[i] * im[i]
  }
  const k = blur * 4 * pace
  const seen = (apart: number): number => (1 + (apart * k) ** 2) ** -2
  if (reading === CRESTS) {
    const turns = -energy[packet.centre] * journey
    const c = Math.cos(TAU * (turns - Math.floor(turns)))
    const s = Math.sin(TAU * (turns - Math.floor(turns)))
    for (let i = 0; i < WAVE_MODES; i++) {
      const n = 2 * Math.abs(mirror === 0 ? i + base : i) + 1
      rho[n] += seen(energy[i] - energy[packet.centre]) * (re[i] * c - im[i] * s)
    }
  } else {
    for (let m = 1; m < WAVE_MODES; m++)
      for (let i = 0; i + m < WAVE_MODES; i++) {
        const apart = energy[i + m] - energy[i]
        const w = seen(apart)
        const p = w * (re[i + m] * re[i] + im[i + m] * im[i])
        const q = w * apart * (im[i + m] * re[i] - re[i + m] * im[i])
        const sum = m + 2 * (base + i)
        rho[m] += p
        flow[m] += q / m
        if (mirror === 0) continue
        rho[sum] += mirror * p
        flow[sum] += (mirror * q) / sum
      }
    if (mirror !== 0)
      for (let i = 0; i < WAVE_MODES; i++)
        rho[2 * (i + base)] += 0.5 * mirror * (re[i] * re[i] + im[i] * im[i])
  }
  const swing = Math.sin(TAU * 1.5 * journey) ** 2
  const level = law.walls === BOWL ? 1 - 0.7 * swing : 1
  for (let n = 1; n < WAVE_BINS; n++) {
    const dim = law.walls === BOWL ? level / (1 + 0.2 * swing * n * n) : 1
    rho[n] *= dim
    flow[n] *= dim
  }
  // `wholeness`: the modes stand in step in one, two or three copies; 0 in none.
  let copies = 3
  for (; copies > 0; copies--) if (inStep(re, im, 4 - copies) > 0.6) break
  return { rho, flow, even: (0.5 * norm + rho[0]) * level, copies: copies > 0 ? 4 - copies : 0 }
}

function inStep(re: Float64Array, im: Float64Array, m: number): number {
  let [sr, si, all] = [0, 0, 1e-12]
  for (let i = 0; i + m < WAVE_MODES; i++) {
    const r = re[i + m] * re[i] + im[i + m] * im[i]
    const q = im[i + m] * re[i] - re[i + m] * im[i]
    sr += r
    si += q
    all += Math.hypot(r, q)
  }
  return Math.hypot(sr, si) / all
}

const SINES = 4096
const sines = Float64Array.from({ length: SINES }, (_, i) => Math.sin((TAU * i) / SINES))
/** What is read at a place in the space (radians from the wall): the density, the crests or the flow. */
export function waveAt(read: WaveRead, reading: number, place: number): number {
  const step = Math.round((place / TAU) * SINES)
  const from = reading === FLOW ? read.flow : read.rho
  const quarter = reading === FLOW ? 0 : SINES / 4
  let sum = reading === 0 ? read.even : 0
  for (let n = 1; n < WAVE_BINS; n++) sum += from[n] * sines[(n * step + quarter) & (SINES - 1)]
  return sum
}
type WaveRead = ReturnType<typeof waveReading>

// --- The keys on their way -------------------------------------------------------

export interface Way {
  journey: number
  /** Freeze: where time is on its way there and back. */
  swing: number
}
export interface WaveKey extends Way {
  id: number
  struck: number
  hz: number
  hit: number
  tune: number
  stand: number
  pace: number
  start: number
  lost: number
  age: number
  held: boolean
}

/** `pass_time`: time goes on by `turns` of a return from where the wave is. */
export function waveStep(way: Way, freeze: number, turns: number, start = 0): void {
  if (freeze < 0.02) way.swing *= 0.97
  else {
    turns *= 1 - 0.96 * freeze * freeze
    way.swing = (way.swing + Math.min(turns / waveReach(freeze), 0.5)) % TAU
  }
  way.journey += turns * wavePace(way.journey + start) * Math.cos(way.swing)
}
export const waveReach = (freeze: number): number => 0.004 + (0.5 * (1 - freeze)) / freeze
export const waveFrozen = (freeze: number): number =>
  freeze < 0.02 ? 1 : 1 - 0.96 * freeze * freeze
/** `start`: how much sooner a key returns than the knob says. */
export const waveTune = (clock: number, hz: number): number =>
  clock === 1 ? clamp(Math.pow(200 / hz, 1.1), 0.1, 8) : 1
export const waveBlur = (blur: number): number => 0.03 * Math.pow(60, blur)

/** `draw`: a fading well takes the wave down over a return and gives it back over the next. */
export const waveSunk = (been: number): number => Math.exp(-2.2 * Math.sin((TAU * been) / 4) ** 2)

export interface WaveKeys {
  keys: WaveKey[]
  /** The clock all keys share, and the key it began with. */
  shared: Way
  firstHz: number
}

/** `note_on`, `control`, `advance`: the keys that sound, each brought to where the device has it at `now`. */
export function waveKeys(
  state: WaveKeys,
  notes: readonly DisplayNote[],
  set: WaveSettings,
  now: number,
  dt: number,
): void {
  const rate = waveLeak(set.leak)
  const live = notes.filter((note) => note.released === null || note.released < set.release)
  let shared = dt
  if (state.keys.length === 0 && live.length > 0) {
    state.shared = { journey: 0, swing: 0 }
    state.firstHz = live[0].frequency
    shared = live[0].age
  }
  for (; shared > 1e-6; shared -= TICK)
    waveStep(state.shared, set.freeze, Math.min(shared, TICK) / set.return, set.start)
  state.keys = live.map((note) => {
    const struck = now - note.age
    const found = state.keys.find(
      (key) => key.id === note.id && Math.abs(key.struck - struck) < 0.1,
    )
    const key = found ?? {
      ...{ id: note.id, struck, hz: note.frequency, hit: note.gain, journey: set.start, swing: 0 },
      ...{ tune: waveTune(set.clock, note.frequency), pace: 0, start: set.start, lost: 0, age: 0 },
      ...{ stand: -0.06 * Math.log2(note.frequency / state.firstHz), held: true },
    }
    const before = key.journey
    key.journey += set.start - key.start
    key.start = set.start
    for (let left = note.age - key.age; left > 1e-6; left -= TICK) {
      const tick = Math.min(left, TICK)
      const was = key.journey
      waveStep(key, set.freeze, tick / (set.return * key.tune))
      key.pace = Math.min(40, Math.abs(key.journey - was) / tick)
      key.age += tick
      key.lost += tick * rate * Math.min(key.age / set.attack, 1) ** 2
    }
    if (set.clock === 2) {
      key.journey = state.shared.journey + set.start + key.stand
      if (found && dt > 0) key.pace = Math.min(40, Math.abs(key.journey - before) / dt)
    }
    key.held = note.released === null
    return key
  })
}
