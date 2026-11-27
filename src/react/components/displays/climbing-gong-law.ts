// The law of Climbing Gong as its display needs it: what a held key's four
// registers do over the sixteen seconds after a stroke.
//
// It is the device's own (`climbing_gong.h`, `metals.h`, `beaters.h`; the names
// are theirs), in steps of a hundredth of a second in place of its tick, with a
// roll's strokes even and the pairs of modes without their beat. Levels are
// against a full stroke's ground register (`kRef`), as the device reports them.

import { clamp } from '../display-kit'

/** `Spec`: one metal. */
interface Metal {
  name: string
  ratio: readonly number[]
  ground: readonly number[]
  fold: number
  gain: number
  lean: number
  /** The ground's own, 1, and the three rungs'. */
  reach: readonly number[]
  lowRing: number
  highRing: number
  rush: number
  contact: number
  pace: number
}
export const GONG_METALS: readonly Metal[] = [
  {
    name: 'Fifths',
    ratio: [1, 1.5, 2, 2.25, 3, 4, 4.5, 6, 8, 9, 12, 13.5, 16, 18, 24, 27, 32, 36],
    ground: [1.3, 0.7, 0.5, 0.08, 0.41, 0.15],
    fold: 2,
    gain: 1,
    lean: -0.2,
    reach: [1, 1.05, 1.2, 1.7],
    lowRing: 0.9,
    highRing: 0.9,
    rush: 0,
    contact: 1.3,
    pace: 0.8,
  },
  {
    name: 'Harmonic',
    ratio: [1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 16, 18, 20, 24, 25, 30, 32],
    ground: [1.5, 0.3, 0.2, 0.1, 0.08, 0.06],
    fold: 2,
    gain: 1,
    lean: -0.6,
    reach: [1, 2.2, 2.4, 3],
    lowRing: 1.6,
    highRing: 2.4,
    rush: 0,
    contact: 1.6,
    pace: 0.65,
  },
  {
    name: 'Sixths',
    ratio: [
      1,
      5 / 3,
      2,
      8 / 3,
      10 / 3,
      5,
      16 / 3,
      20 / 3,
      8,
      10,
      32 / 3,
      40 / 3,
      16,
      20,
      64 / 3,
      80 / 3,
      32,
      40,
    ],
    ground: [1.5, 0.5, 0.06, 0.3, 0.06, 0.06],
    fold: 2,
    gain: 1.12,
    lean: -0.4,
    reach: [1, 0.55, 0.5, 0.5],
    lowRing: 0.45,
    highRing: 0.4,
    rush: 0,
    contact: 1.6,
    pace: 1.6,
  },
  {
    name: 'Golden',
    ratio: [
      1, 1.618034, 2.618034, 3.236068, 4.236068, 5.236068, 6.854102, 8.472136, 9.472136, 11.09017,
      13.708204, 15.326238, 17.944272, 20.562306, 22.18034, 24.798374, 29.034442, 33.27051,
    ],
    ground: [0.15, 0.5, 0.26, 0.23, 1.5, 1.5],
    fold: 2.618034,
    gain: 1.48,
    lean: 1.2,
    reach: [1, 0.67, 0.6, 0.6],
    lowRing: 0.65,
    highRing: 2.4,
    rush: 0,
    contact: 0.3,
    pace: 1.8,
  },
  {
    name: 'Silver',
    ratio: [
      1, 2.414214, 2.828427, 3.414214, 4.828427, 5.828427, 6.828427, 8.242641, 9.656854, 11.656854,
      14.071068, 16.485281, 19.313709, 23.313709, 28.142136, 33.970563, 39.79899, 46.627417,
    ],
    ground: [0.07, 0.43, 0.06, 0.06, 0.06, 1.5],
    fold: 2.414214,
    gain: 1.23,
    lean: 1.3,
    reach: [1, 0.55, 2.4, 3],
    lowRing: 0.45,
    highRing: 1.9,
    rush: 0,
    contact: 0.3,
    pace: 0.5,
  },
  {
    name: 'Plate',
    ratio: [
      1, 1.273, 1.73, 2.328, 2.897, 3.91, 4.11, 5.07, 6.3, 7.42, 8.93, 10.36, 12.19, 14.63, 16.91,
      20.77, 25.31, 30.19,
    ],
    ground: [0.15, 0.11, 0.06, 1.34, 1.36, 0.14],
    fold: 2,
    gain: 1.42,
    lean: 0.8,
    reach: [1, 1.13, 2.4, 3],
    lowRing: 1.6,
    highRing: 2.4,
    rush: 0.9,
    contact: 0.3,
    pace: 0.5,
  },
]

/** `Touch`: one beater. */
interface Touch {
  name: string
  contact: number
  seconds: number
  upper: number
  level: number
  tilt: number
  ring: number
  rush: number
  reach: readonly number[]
}
export const GONG_BEATERS: readonly Touch[] = [
  {
    name: 'Felt',
    contact: 0.5,
    seconds: 0.012,
    upper: 0.3,
    level: 1,
    tilt: -0.9,
    ring: 1.2,
    rush: 0,
    reach: [1, 0.45, 0.72, 0.45],
  },
  {
    name: 'Yarn',
    contact: 0.1,
    seconds: 0.003,
    upper: 0.92,
    level: 1.15,
    tilt: 1.4,
    ring: 0.5,
    rush: 0,
    reach: [1, 0.6, 0.5, 0.4],
  },
  {
    name: 'Wood',
    contact: 0.02,
    seconds: 0.0013,
    upper: 3.6,
    level: 1,
    tilt: 2,
    ring: 0.93,
    rush: 0,
    reach: [1, 1.5, 0.5, 3],
  },
  {
    name: 'Brush',
    contact: 0.3,
    seconds: 0.22,
    upper: 0.1,
    level: 0.6,
    tilt: -0.6,
    ring: 1.2,
    rush: 0.9,
    reach: [1, 0.3, 2.8, 0.5],
  },
  {
    name: 'Bow',
    contact: 0.34,
    seconds: 0.09,
    upper: 0.5,
    level: 0.1,
    tilt: -0.6,
    ring: 0.7,
    rush: 0,
    reach: [1, 0.8, 0.35, 3],
  },
]
const BRUSH = 3
const BOW = 4
/** `kGroundTones`: the ground register's tones; each of three rungs has four. */
const GROUND = 6
const FOLD_HZ = 9000
const SIXTY_DB = 6.907755
/** What a pair has of its tone as power; the key's is nearly one mode. */
const PAIR = 0.5392
const KEY_PAIR = 0.73
const STEP = 0.01
/** The last moment round the gong, and how many steps the round has. */
export const GONG_SECONDS = 16
export const GONG_STEPS = 48
/** Where in the round a time stands, and back: the third root of time. */
export const gongTurn = (seconds: number): number => Math.cbrt(clamp(seconds / GONG_SECONDS, 0, 1))
export const gongTime = (turn: number): number => GONG_SECONDS * clamp(turn, 0, 1) ** 3
export const gongRegister = (k: number): number => (k < GROUND ? 0 : 1 + ((k - GROUND) >> 2))
export const GONG_TONES = GONG_METALS[0].ratio.length

const pick = <T>(list: readonly T[], at: number): T =>
  list[clamp(Math.floor(at + 0.5), 0, list.length - 1)]
export const gongMetal = (value: (name: string) => number): Metal =>
  pick(GONG_METALS, value('metal'))
export const gongBeater = (value: (name: string) => number): Touch =>
  pick(GONG_BEATERS, value('beater'))

/** What one stroke does over time. */
export interface GongLife {
  /** The four registers as the device reports them, at each step of the round. */
  registers: Float32Array[]
  /** The eighteen tones inside their registers, as shares of them, at each step. */
  shapes: Float32Array[]
}

/** `stroke`, `weigh` and `control_voice` for a key held for the whole round. */
export function gongLife(value: (name: string) => number, hz: number, gain: number): GongLife {
  const metal = gongMetal(value)
  const beater = gongBeater(value)
  const bowed = beater === GONG_BEATERS[BOW]
  const hardness = value('hardness')
  const place = value('place')
  const climb = value('climb')
  const back = value('fallBack')
  const gate = (x: number): number => x ** 4 / (1 + x ** 4)
  const toward = (seconds: number): number => 1 - Math.exp(-STEP / seconds)
  const hitOf = (g: number): number => g * (0.6 + 0.4 * g)

  const folded = metal.ratio.map((wanted, k) => {
    let ratio = wanted
    while (k >= GROUND && hz * ratio > FOLD_HZ && ratio > 2 * metal.fold) ratio /= metal.fold
    return ratio
  })
  const low = value('lowRing') * metal.lowRing * beater.ring
  const wanted = value('highRing') * metal.highRing
  const high = wanted / (1 + wanted / (8 * low))
  const size = clamp(220 / hz, 0.05, 6) ** 0.3
  const rings = folded.map(
    (ratio) => low * (high / low) ** (clamp(Math.log2(ratio) * 0.22, 0, 1) ** 0.7) * size,
  )
  // `shares`, as powers: what a stroke of strength one gives each tone.
  const contact = beater.contact * metal.contact * 9 ** (0.5 - hardness) * (1.35 - 0.5 * gain)
  const tilt = -1.5 + 2.6 * place + 1.2 * (hardness - 0.5) + beater.tilt
  const woken = folded.map((ratio, k) => {
    const comb = 0.6 + 0.4 * Math.abs(Math.cos(Math.PI * 0.31 * (ratio - 1) * place))
    const power = k < GROUND ? tilt + 0.6 * metal.lean : 0.6 * (tilt + metal.lean)
    const top = 0.16 * beater.upper * (0.35 + 1.3 * hardness) * (0.5 + 0.5 * gain)
    return (ratio ** power / (1 + (ratio * contact) ** 2)) * comb * (metal.ground[k] ?? top)
  })
  woken[0] = Math.max(woken[0], 0.42 * Math.max(...woken.slice(0, GROUND)))
  const given = woken.map((each, k) => 0.5 * each * each * (k === 0 ? KEY_PAIR : PAIR))
  const sums = [0, 0, 0, 0]
  given.forEach((power, k) => (sums[gongRegister(k)] += power))
  const scale = (metal.gain ** 2 * Math.sqrt(1 + 1.2 / (low * size))) / sums[0]
  given.forEach((power, k) => {
    const r = gongRegister(k)
    given[k] = power * scale * (r === 0 ? 1 : 1 / Math.max(1, sums[r] / (0.4 * sums[0])))
  })
  const direct = [0, 0, 0, 0]
  given.forEach((power, k) => (direct[gongRegister(k)] += power))
  const above = woken.slice(1, GROUND).reduce((sum, each) => sum + each * each, 0)
  const lift = clamp(Math.sqrt((woken[0] ** 2 + above) / (above + 1e-9)), 1, 16)
  const knob = value('ground')
  const key = knob < 0.5 ? 2 * knob : 0.4 + 1.2 * knob
  const heard = (k: number): number => (k === 0 ? key : 1 + (lift - 1) * Math.max(1 - key, 0))
  // `weigh`: how a rung shares what climbs, and how far it may come.
  const weights = folded.map((ratio, k) => {
    const first = folded[GROUND + 4 * (gongRegister(k) - 1)]
    const odd = (k + gongRegister(k)) & 1 ? 1 : 1.15 - 0.5 * place
    return k < GROUND ? 0 : (ratio / first) ** (-3.4 + 6 * place + 2.4 * (hardness - 0.5)) * odd
  })
  const reach = [0, 1, 2, 3].map((r) =>
    clamp(
      beater.reach[r] *
        metal.reach[r] *
        (1.2 + 1.8 * r) ** (hardness - 0.5) *
        (1.1 + 0.8 * r) ** (place - 0.3),
      0.1,
      [1, 3.2, 5, 8][r],
    ),
  )

  const roar = value('roar') + 0.5 * Math.max(metal.rush, beater.rush) * (1 - value('roar'))
  const threshold = 0.07 * 10.5 ** value('threshold')
  const climbTime = Math.max(value('climbTime') * metal.pace, 0.1)
  const gathers = (value('highRing') / 2.6) ** 0.1
  const roll = bowed ? 0 : value('roll')
  const speed = value('rollSpeed')
  const quick = (8 / speed) ** 0.4
  const hit = hitOf(gain) * beater.level * (bowed ? 1 : 1 - 0.7 * roll ** 1.5)
  const tones = given.slice(0, GROUND).map(() => 0)
  // A stroke takes its time: felt a hundredth of a second, the brush a fifth.
  const landing = clamp(
    beater.seconds * 5 ** (0.5 - hardness) * (1.3 - 0.5 * gain) * clamp(220 / hz, 0.1, 4) ** 0.5,
    0.0004,
    0.4,
  )
  let landed = 0
  const bare = direct.map((power) => Math.sqrt(power) * hit)
  const target = [0, 0, 0, 0]
  /** What the brush's noise gives the rungs, and how quickly a rung that climbs takes it back. */
  const air = [0, 0, 0, 0]
  const band = [0, 40, 110, 260].map((w) => 2.5 + 0.6 / (0.2 + climbTime) + w * roar * roar)
  const sweepTime = 1.1 - 0.7 * hardness
  let purse = 0
  let shut = 0
  let falling = false
  let lit = false
  let nextRoll = 1 / speed
  const registers = bare.map(() => new Float32Array(GONG_STEPS + 1))
  const shapes = folded.map(() => new Float32Array(GONG_STEPS + 1))
  let step = 0
  // What a step of the round shows is the mean since the step before.
  const gone = [0, 0, 0, 0]
  let passed = 0
  for (let n = 0; step <= GONG_STEPS; n++) {
    const now = n * STEP
    const share = clamp(now / landing, 0, 1)
    const come = share - Math.sin(2 * Math.PI * share) / (2 * Math.PI)
    if (come > landed)
      tones.forEach((power, k) => {
        tones[k] = (Math.sqrt(power) + Math.sqrt(given[k]) * hit * (come - landed)) ** 2
      })
    landed = come
    const energy = tones.reduce((sum, power) => sum + power, 0)
    const u = Math.sqrt(energy)
    const is = [u, ...[1, 2, 3].map((r) => Math.max(target[r], bare[r], air[r]))]
    for (let r = 0; r < 4; r++) gone[r] += is[r] ** 2
    passed += 1
    const before = step
    while (step <= GONG_STEPS && gongTime(step / GONG_STEPS) <= now + STEP / 2) {
      for (let r = 0; r < 4; r++) registers[r][step] = Math.sqrt(gone[r] / passed)
      for (let k = 0; k < GONG_TONES; k++) {
        const r = gongRegister(k)
        const rung = weights.reduce((sum, w, j) => sum + (gongRegister(j) === r ? w * w : 0), 0)
        shapes[k][step] =
          r === 0 ? (heard(k) * Math.sqrt(tones[k])) / (u + 1e-9) : weights[k] / Math.sqrt(rung)
      }
      step += 1
    }
    if (step > before) {
      gone.fill(0)
      passed = 0
    }
    // The roll, the brush and the bow give to what rings.
    nextRoll -= STEP
    if (roll > 0 && nextRoll <= 0) {
      nextRoll += 1 / speed
      const of = gain * roll ** 0.6 * (1 - Math.exp((-now * 2.2) / value('rollSwell'))) * 0.82
      const piece = 0.5 * quick + 0.45 / (1 + 0.15 * low * speed)
      const blow = hitOf(of) * beater.level
      tones.forEach((power, k) => {
        const add = given[k] * (blow * piece) ** 2
        tones[k] = Math.min(power + add, Math.max(power, (given[k] * (1.15 * blow) ** 2) / quick))
      })
      for (let r = 1; r < 4; r++)
        bare[r] = Math.max(bare[r], Math.sqrt(direct[r]) * blow * piece * 0.76)
    }
    if (beater === GONG_BEATERS[BRUSH]) {
      const first = now < 1.6 * sweepTime
      const at = now % (1.6 * sweepTime)
      const rise = clamp(at / (0.18 * sweepTime), 0, 1)
      const drawn = (rise * rise * (3 - 2 * rise) * (1 - at / (1.6 * sweepTime)) ** 2) ** 2
      const swept = (13.52 * hitOf(first ? gain : 0.57 * gain) ** 2 * drawn * STEP) / sweepTime
      tones.forEach((power, k) => (tones[k] = power + swept * 0.2025 * given[k]))
      const up = 0.15 + 0.7 * climb
      const into = [0, 0.35 + 0.35 * hardness, 0.28 + 0.6 * hardness, 0.17 + 0.36 * hardness]
      for (let r = 1; r < 4; r++) air[r] = Math.sqrt(air[r] ** 2 + swept * (up * into[r]) ** 2)
    }
    const bow = (hitOf(gain) * 0.85) / (1 + (3 * purse) / (hitOf(gain) ** 2 + 0.01))
    const bowPace = 1 / (0.32 * 4 ** (0.5 - hardness))
    // The bow's breath goes into the ground as well (`kBowFeed`).
    const breath = bowed ? 6.4 * (hitOf(gain) * (0.02 + 0.09 * hardness)) ** 2 * STEP : 0

    // The law of the climb.
    const wide = gate(u / (threshold * (lit ? 0.65 : 1)))
    shut += ((falling ? 1 : 0) - shut) * toward(0.06 + 0.15 * climbTime)
    const open = wide * (1 - shut * Math.min(1.5 * back, 1))
    if (wide > 0.7) lit = true
    if (wide < 0.3) lit = false
    let asked = 0
    const aims = [0, 0, 0, 0]
    for (let r = 1; r < 4; r++) {
      const below = Math.min(is[r - 1] / (r === 1 ? 1 : reach[r - 1]), 1.2)
      const opened = r === 1 ? open : gate(below / (threshold * 0.85))
      const far =
        climb * (0.45 + 0.75 * climb) * [0, 1.75, 1.3, 0.95][r] * (1 + 0.25 * r * roar * roar)
      const taken = far * below * (r === 1 ? 0.45 + 0.75 * below : 1)
      aims[r] = Math.min(taken, 1.5) * opened * reach[r] * gathers ** r
      asked += aims[r] ** 2
    }
    const has = Math.min(u, 1.2) * (0.5 + 0.8 * climb)
    const granted = asked > has * has ? has / Math.sqrt(asked) : 1
    for (let r = 1; r < 4; r++) {
      const ring = Math.max(rings[GROUND + 4 * (r - 1)] / SIXTY_DB, 0.01)
      const aim = Math.min(aims[r] * granted, 1.3)
      const sinks = falling ? Math.min(ring, 0.15 + 0.3 * climbTime) : ring
      target[r] +=
        (aim - target[r]) * toward(aim > target[r] ? climbTime * [0, 1, 0.75, 0.6][r] : sinks)
      bare[r] *= Math.exp(-STEP / ring)
      air[r] *= Math.exp(
        -STEP * (1 / ring + band[r] * Math.min((2 * target[r]) / (is[r] + 1e-7), 1)),
      )
    }
    // What the climb costs the ground, and what comes down again.
    const spend = (2.6 * back * (0.3 + 0.7 * back)) / (0.4 + 0.6 * climbTime)
    const cost = Math.sqrt(climb) * open * (0.1 + spend)
    purse += cost * energy * STEP * 0.97 * Math.min(4 * back, 1)
    purse *= Math.exp(-Math.min((2 * SIXTY_DB) / rings[0], 0.7) * STEP)
    if (!falling && back > 0.02 && purse > (0.08 + 0.68 * back) * (energy + purse)) falling = true
    if (falling && purse < 0.06 * (energy + purse)) falling = false
    const give = falling || open < 0.3 ? purse / (0.3 + 0.35 * climbTime) : 0
    const pump = energy > 1e-8 ? Math.min((0.5 * give) / energy, 6) : 0
    const room = clamp(3 * (1 - energy / (1.1 * hitOf(gain) ** 2 + 1e-6)), 0, 1)
    purse = Math.max(purse - 2 * pump * energy * STEP, 0)
    tones.forEach((power, k) => {
      const is = Math.sqrt(power + given[k] * breath)
      const goal = Math.sqrt(given[k]) * bow
      const fed = bowed && is < goal ? Math.min((goal - is) / (is + 1e-9), 3) * bowPace : 0
      tones[k] =
        is * is * Math.exp(2 * STEP * (fed + pump * room - 0.5 * cost - SIXTY_DB / rings[k]))
    })
  }
  return { registers, shapes }
}
