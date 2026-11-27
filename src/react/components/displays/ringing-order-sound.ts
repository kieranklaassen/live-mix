// How loud a ringer of Ringing Order is, and where it stands: the pitches of a
// series, what Tilt and the mouth of the voice leave of each, and what one blow
// does to a ringer until the next. The arithmetic is the device's own
// (`cpp/devices/ringing-order/ringing_order.h`), for the lowest partial of each
// ringer; who rings when is in `ringing-order-rows.ts`.

import { clamp } from '../display-kit'
import {
  METHOD,
  SIXTY_DB,
  ringingBlows,
  ringingTime,
  smooth,
  type RingingKey,
  type RingingSettings,
} from './ringing-order-rows'

/** `kTables`: of each voice the pitch of its lowest partial, its gain, length, hold, attack (times and least), mouth and lean. */
const VOICES = [
  { over: 1, gain: 1 * 1, length: 1, hold: 0, attack: 1, least: 0.003, cut: 13000, lean: 0 },
  { over: 1, gain: 1.2 * 0.5, length: 0.5, hold: 0.9, attack: 5, least: 0.01, cut: 750, lean: 0 },
  {
    over: 1.998,
    gain: 0.9 * 0.62,
    length: 0.9,
    hold: 0.3,
    attack: 4.5,
    least: 0.02,
    cut: 15000,
    lean: -3,
  },
  {
    over: 1,
    gain: 1 * 0.9,
    length: 0.45,
    hold: 0,
    attack: 0.3,
    least: 0.002,
    cut: 3800,
    lean: -2.5,
  },
  {
    over: 1,
    gain: 0.8 * 0.5,
    length: 0.5,
    hold: 0.35,
    attack: 3,
    least: 0.02,
    cut: 6000,
    lean: 0.6,
  },
  {
    over: 0.5,
    gain: 1.05 * 0.75,
    length: 0.6,
    hold: 0.5,
    attack: 4,
    least: 0.03,
    cut: 620,
    lean: 0,
  },
] as const
const SERIES = [
  [1, 2, 3, 4, 5, 6, 8, 12],
  [3, 5, 7, 9, 11, 13, 15, 17],
  [0.5, 1.5, 4.5, 6, 9, 12, 18, 27],
  [12, 15, 16, 18, 20, 24, 30, 32],
]
const [FIFTHS, CHORD_TONES] = [2, 4]
const TOP_RINGER = 4800
/** What is not its key's turn steps back over this many seconds. */
const FRONT_SEC = 0.25
/** The thickest a rope is at, and how far under it a rope is a thread, in dB. */
export const RINGING_LOUD_DB = 5
export const RINGING_SPAN_DB = 32

/** `pitch_over`: the pitch each ringer stands on, over the key's own. */
export function ringingOvers(
  set: RingingSettings,
  hz: number,
  chord: readonly number[] = [],
): number[] {
  const n = set.ringers
  const ringers = Array.from({ length: n }, (_, i) => i)
  if (set.series !== CHORD_TONES) {
    const first = Math.max(1, VOICES[set.voice].over)
    return ringers.map((i) => {
      let over = SERIES[set.series][i]
      while (over > 1.5 && over * hz * first > TOP_RINGER) over *= 0.5
      return over
    })
  }
  const tones: number[] = []
  const add = (ratio: number): void => {
    let at = ratio
    while (at >= 0.995) at *= 0.5
    while (at < 0.497) at *= 2
    for (; at < 2.05; at *= 2)
      if (!tones.some((tone) => Math.abs(tone / at - 1) < 0.006)) tones.push(at)
  }
  for (const other of chord.length > 0 ? chord : [hz]) add(other / hz)
  if (tones.length <= 3) add(1.5)
  tones.sort((a, b) => a - b)
  return ringers.map((i) => tones[Math.floor((i * (tones.length - 1)) / (n - 1) + 0.5)])
}

/** Where a ringer's lowest partial stands over its key: Glass is an octave up, Hum an octave down. */
export const ringingVoiceOver = (set: RingingSettings): number => VOICES[set.voice].over

/** `tilt` and `mouth`: what they leave of each ringer's lowest partial, in dB under the loudest. */
export function ringingTilts(
  set: RingingSettings,
  key: RingingKey,
  overs: readonly number[],
): number[] {
  const voice = VOICES[set.voice]
  const lean = set.tilt + voice.lean + (set.series === FIFTHS ? 3 : 0) + 3 * (key.gain - 0.65)
  const open = 0.55 + clamp(set.body * (0.3 + 1.05 * key.gain), 0, 1.2)
  const all = overs.map((over) => {
    const hz = key.hz * over
    const f = (hz * voice.over) / (Math.max(voice.cut, 0.55 * hz) * open)
    return lean * Math.log2(Math.max(over, 0.5) * 0.4) - 10 * Math.log10(1 + f * f * (1 + f * f))
  })
  const most = Math.max(...all)
  return all.map((db) => db - most)
}

/** How thick a rope is as a share of its room: 1 at `RINGING_LOUD_DB`, 0 at `RINGING_SPAN_DB` under it. */
export const ringingThick = (level: number): number =>
  level > 1e-6 ? clamp(1 + (20 * Math.log10(level) - RINGING_LOUD_DB) / RINGING_SPAN_DB, 0, 1) : 0

/** `blow`: what one blow does to a ringer, in seconds: how long it comes in, is held, and falls, and how loud it gets. */
export function ringingShape(
  set: RingingSettings,
  blow: { ringer: number; gain: number; back: boolean; entry: boolean; pace: number },
  over: number,
): { attack: number; hold: number; length: number; late: number; level: number } {
  const voice = VOICES[set.voice]
  const row = set.row / blow.pace
  const high = set.ringers > 1 ? blow.ringer / (set.ringers - 1) : 0
  const worn = blow.back ? Math.min(1, 2 * set.muffle) : Math.max(0, 2 * set.muffle - 1)
  const leather = worn * (0.75 + 0.25 * high)
  const fused = smooth(clamp((set.overlap - 0.8) * 5, 0, 1))
  const whole =
    row *
    voice.length *
    (1 - 0.75 * leather) *
    Math.pow(Math.max(over, 0.5), -0.5) *
    [0.45, 1, 0.5, 0.6, 0.4, 2.2][set.method]
  const lasting = set.method === METHOD.hunt || set.method === METHOD.long ? 1.5 : 0.2
  const shortest = Math.max(0.07, 0.16 * whole)
  const longest = clamp(14 * whole, 6 * shortest, 40)
  const length = shortest * Math.pow(longest / shortest, set.overlap)
  const gesture = voice.least + set.attack * voice.attack
  const swell = Math.min(gesture + fused * 0.22 * row + 0.02 * leather, 0.8 * row)
  const lift = 1 + 0.6 * (1 - set.overlap) * (1 - set.overlap)
  return {
    attack: Math.max(0.001, blow.entry ? Math.min(swell, gesture) : swell),
    hold: Math.min(length * voice.hold, 0.8 * row),
    length,
    late: length * (1 + lasting * set.overlap),
    level: blow.gain * lift * voice.gain * (1 - 0.8 * leather * (0.25 + 0.75 * high)),
  }
}

/** How loud each ringer's lowest partial is at so many moments from one time to another on the clock, linear; Tilt left out. */
export function ringingLevels(
  set: RingingSettings,
  key: RingingKey,
  overs: readonly number[],
  from: number,
  to: number,
  steps: number,
): number[][] {
  const { pace } = ringingTime(set, key.slot)
  // What rang before: Long comes back to a ringer after half as many rows as there are ringers.
  const reach = (2 + set.ringers / 2) * (1 + set.gap) * Math.max(1, key.keys)
  const { blows, fronts } = ringingBlows(set, key, from - reach / pace, to)
  const times = Array.from({ length: steps }, (_, s) => from + ((to - from) * s) / (steps - 1))
  // A key comes in at the front; whose turn it was before the picture begins is taken as it stands.
  let front =
    key.entry >= from ? 1 : (fronts.filter((each) => each.time <= from).at(-1)?.front ?? 1)
  const ahead = times.map((time, s) => {
    if (time < key.entry) return 0
    const aim = fronts.filter((each) => each.time <= time).at(-1)?.front ?? 1
    const sec = s > 0 ? (times[s] - times[s - 1]) * set.row : 0
    front = aim + (front - aim) * Math.exp(-sec / FRONT_SEC)
    const gone = Math.max(0, time - key.off) * set.row
    return front * Math.exp((-SIXTY_DB * gone) / set.release)
  })
  return overs.map((over, ringer) => {
    const mine = blows.filter((blow) => blow.ringer === ringer)
    let at = (_sec: number): number => 0
    let next = 0
    let struck = 0
    return times.map((time, s) => {
      while (next < mine.length && mine[next].time <= time) {
        const blow = mine[next]
        const was = at((blow.time - struck) * set.row)
        // As a key comes in it has not taken its own time yet.
        const shape = ringingShape(set, { ...blow, pace: blow.entry ? 1 : pace }, over)
        struck = blow.time
        // Its ringers come in as a quick roll from the lowest.
        const roll = blow.entry ? 0.005 * ringer : 0
        at = (since) => {
          const sec = Math.max(0, since - roll)
          if (sec < shape.attack) return was + (shape.level - was) * smooth(sec / shape.attack)
          const fallen = sec - shape.attack - shape.hold
          if (fallen <= 0) return shape.level
          const knee = (Math.LN2 / SIXTY_DB) * shape.length
          return fallen < knee
            ? shape.level * Math.exp((-SIXTY_DB * fallen) / shape.length)
            : 0.5 * shape.level * Math.exp((-SIXTY_DB * (fallen - knee)) / shape.late)
        }
        next += 1
      }
      return ahead[s] * at((time - struck) * set.row)
    })
  })
}

/** How loud each rope is, linear: the lowest partials of that ringer in every key together, under Tilt and the mouth. */
export function ringingRopes(
  set: RingingSettings,
  keys: readonly RingingKey[],
  from: number,
  to: number,
  steps: number,
): number[][] {
  const chord = keys.filter((key) => key.id >= 0 && key.off === Infinity).map((key) => key.hz)
  const sum = Array.from({ length: set.ringers }, () => new Array<number>(steps).fill(0))
  for (const key of keys) {
    const overs = ringingOvers(set, key.hz, chord)
    const tilts = ringingTilts(set, key, overs)
    const levels = ringingLevels(set, key, overs, from, to, steps)
    for (const [i, rope] of sum.entries()) {
      const tilt = Math.pow(10, tilts[i] / 20)
      for (let s = 0; s < steps; s += 1) rope[s] += (levels[i][s] * tilt) ** 2
    }
  }
  return sum.map((rope) => rope.map(Math.sqrt))
}
