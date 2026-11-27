// The rows of the Ringing Order display: who rings when. The arithmetic is the device's own
// (`cpp/devices/ringing-order/ringing_order.h`; the functions carry the names of
// what they follow there). The device's clock starts with the first key that
// finds nothing sounding and runs on while anything sounds, so it is known from
// the notes. Times are counted in rows on that clock, as the device counts
// them; how loud a ringer is after its blow is in `ringing-order-sound.ts`.

import { clamp } from '../display-kit'

/** The knobs the rows depend on, by their parameters' names. */
export const RINGING_PARAMS = [
  'ringers',
  'method',
  'row',
  'gap',
  'overlap',
  'voice',
  'series',
  'tower',
  'weight',
  'swing',
  'cover',
  'muffle',
  'body',
  'tilt',
  'attack',
  'release',
] as const

export type RingingSettings = Record<(typeof RINGING_PARAMS)[number], number>

export const ringingSettings = (value: (name: string) => number): RingingSettings => {
  const set = Object.fromEntries(
    RINGING_PARAMS.map((name) => [name, value(name)]),
  ) as RingingSettings
  for (const name of ['ringers', 'method', 'voice', 'series', 'tower'] as const)
    set[name] = Math.round(set[name])
  return set
}

export const METHOD = { rounds: 0, hunt: 1, treble: 2, dodge: 3, contrary: 4, long: 5 }
const TOWER = { together: 0, canon: 1, opposed: 2, inTurn: 3 }
export const RINGING_METHODS = ['Rounds', 'Hunt', 'Treble', 'Dodge', 'Contrary', 'Long']
export const RINGING_TOWERS = ['Together', 'Canon', 'Opposed', 'In turn']

export const SIXTY_DB = 6.907755279
const BACK = 0.22

export const smooth = (t: number): number => t * t * (3 - 2 * t)
const dbGain = (db: number): number => Math.pow(10, db / 20)
const mod = (a: number, n: number): number => ((a % n) + n) % n

/** A key of the tower: its place in it, when it came in (in rows on the clock), and when it was let go. */
export interface RingingKey {
  id: number
  hz: number
  gain: number
  slot: number
  /** How many keys are held, this one with them, and where it stands among them. */
  keys: number
  rank: number
  entry: number
  off: number
  /** Whether other keys were held as it came in. */
  joined: boolean
}

/** How long a key is heard after it is let go, in seconds: its release down to 1e-5, where the device puts it out. */
export const ringingTail = (set: RingingSettings): number =>
  (set.release * Math.log(1e5)) / SIXTY_DB

interface Played {
  id: number
  frequency: number
  gain: number
  age: number
  released: number | null
}

/**
 * The keys that sound, or did in the last `past` seconds, oldest first, as the device
 * seats them: each in the lowest place no sounding key has.
 */
export function ringingKeys(
  set: RingingSettings,
  notes: readonly Played[],
  clock: number,
  past = 0,
): RingingKey[] {
  const tail = ringingTail(set)
  const sounding = notes
    .filter((note) => note.released === null || note.released < tail + past)
    .slice(-12)
  const seats: number[] = []
  for (const [k, note] of sounding.entries()) {
    const there = sounding
      .slice(0, k)
      .map((other, j) =>
        other.released === null || other.released - note.age < tail ? seats[j] : -1,
      )
    let slot = 0
    while (there.includes(slot)) slot += 1
    seats.push(slot)
  }
  return sounding.map((note, k) => {
    const others = sounding.filter((other, j) => j === k || other.released === null)
    return {
      id: note.id,
      hz: note.frequency,
      gain: note.gain,
      slot: seats[k],
      keys: others.length,
      rank: others.filter((other) => seats[sounding.indexOf(other)] < seats[k]).length,
      entry: clock - note.age / set.row,
      off: note.released === null ? Infinity : clock - note.released / set.row,
      joined: sounding
        .slice(0, k)
        .some((other) => other.released === null || other.released < note.age),
    }
  })
}

/** Four keys as they would stand in the tower, for a picture with nothing played. */
export const ringingGhosts = (): RingingKey[] =>
  [146.83, 220, 349.23, 523.25].map((hz, slot) => ({
    ...{ id: -1 - slot, hz, gain: 0.7, slot, keys: 4, rank: slot },
    ...{ entry: -Infinity, off: Infinity, joined: false },
  }))

/** `hunt`: the order after so many changes from lowest first. */
export function ringingHunt(n: number, changes: number): number[] {
  const order = Array.from({ length: n }, (_, p) => p)
  for (let c = 0; c < mod(changes, 2 * n); c += 1)
    for (let p = c & 1; p + 1 < n; p += 2) [order[p], order[p + 1]] = [order[p + 1], order[p]]
  return order
}

/** `spaced`: the time of place p in its row, even or each half row drawn towards its first blow. */
export function ringingSpaced(p: number, n: number, swing: number): number {
  const half = p * 2 < n ? 0 : (n + 1) >> 1
  return (half + (p - half) * (1 - 0.9 * swing)) / n
}

export interface RingingBlow {
  /** In rows from the row's start. */
  at: number
  ringer: number
  gain: number
  /** Which of a row's lines it is on: Contrary has two, which meet in the middle. */
  line: number
  middle?: boolean
}

/** `build_row`: the blows of one row of a key, none where it is not its turn, and how far forward it stands. */
export function ringingRow(
  set: RingingSettings,
  key: Pick<RingingKey, 'slot' | 'keys' | 'rank'>,
  row: number,
): { blows: RingingBlow[]; front: number } {
  const { ringers: n, method, tower, swing } = set
  let turn = row
  let part = 1
  let front = 1
  if (tower === TOWER.opposed && key.keys > 1) {
    if (mod(row + key.slot, 2) !== 0) return { blows: [], front: BACK }
    turn = Math.floor(row / 2)
    part = 1.3
  } else if (tower === TOWER.inTurn) {
    if (mod(row, key.keys) !== key.rank) return { blows: [], front: BACK }
    turn = Math.floor(row / key.keys)
    part = key.keys > 1 ? 1.4 : 1
  } else if (tower === TOWER.canon && mod(row, 2) !== 0) front = BACK
  const last = n - 1
  const lead = clamp(dbGain(-set.tilt), 1, 2.4)
  const blows: RingingBlow[] = []
  const add = (at: number, ringer: number, gain: number, line = 0): void => {
    if (blows.length < 16) blows.push({ at: clamp(at, 0, 0.9999), ringer, gain, line })
  }
  if (method === METHOD.rounds) {
    for (let p = 0; p < n; p += 1)
      add(0.3 * ringingSpaced(p, n, swing), last - p, 0.14 + (1.2 * p) / last)
  } else if (method === METHOD.hunt) {
    const order = ringingHunt(n, turn)
    for (let p = 0; p < n; p += 1) add(ringingSpaced(p, n, swing), order[p], 1)
  } else if (method === METHOD.treble) {
    const low = clamp(n >> 1, 2, last)
    const order = ringingHunt(low, turn)
    add(0, last, lead)
    for (let p = 0; p < low; p += 1) add(0.5 + 0.12 * ringingSpaced(p, low, swing), order[p], 0.6)
  } else if (method === METHOD.dodge) {
    const low = n - 2 - mod(turn * 2 + 1, last)
    for (let p = 0; p < 16; p += 1)
      add(ringingSpaced(p, 16, swing), low + ((p + 1) & 1), p === 0 ? 1.4 : 1.1)
  } else if (method === METHOD.contrary) {
    for (let p = 0; p < n; p += 1) {
      const middle = 1 - Math.abs((2 * p) / last - 1)
      const gain = 0.1 + 2 * middle * middle
      add(ringingSpaced(p, n, swing), p, gain)
      blows[blows.length - 1].middle = last - p === p
      if (last - p !== p) add(ringingSpaced(p, n, swing), last - p, gain, 1)
    }
  } else {
    const stride = n === 3 ? 2 : n === 6 ? 5 : 3
    for (let h = 0; h < 2; h += 1) {
      const i = mod((2 * turn + h) * stride + last, n)
      add(0.5 * h, i, i === 0 ? 1.1 : 1.6)
    }
  }
  const half = (blows.length + 1) >> 1
  let power = 0
  for (const [b, blow] of blows.entries()) {
    const place = blows.length > 1 ? b / (blows.length - 1) : 0
    let gain = dbGain(-22 * Math.abs(set.weight) * (set.weight > 0 ? place : 1 - place))
    if (method !== METHOD.long) gain *= b === 0 || b === half ? 1 + 0.45 * swing : 1 - 0.45 * swing
    blow.gain *= gain
    power += gain * gain
    if (tower === TOWER.canon) blow.ringer = (blow.ringer + 2 * (key.slot >> 1)) % n
    if ((tower === TOWER.opposed || tower === TOWER.canon) && key.slot & 1) {
      blow.ringer = last - blow.ringer
      if (method === METHOD.treble && b === 0) blow.gain *= 1.2 / lead
    }
  }
  const even = [0.8, 1, 1.6, 1.35, 1.6, 0.9][method]
  const makeUp = Math.min(1.4, Math.pow(power / blows.length, -0.4))
  for (const blow of blows) blow.gain *= makeUp * part * even
  return { blows, front }
}

/** `keep_time`: how far a key stands behind the clock, in rows, and how fast its own rows go. */
export function ringingTime(set: RingingSettings, slot: number): { behind: number; pace: number } {
  if (set.tower === TOWER.canon)
    return { behind: 1.4 * slot, pace: [1, 0.5, 1.5, 0.33333][slot & 3] }
  if (set.tower === TOWER.together) return { behind: 0.06 * slot, pace: 1 }
  return { behind: set.tower === TOWER.opposed ? 0.03 * (slot >> 1) : 0, pace: 1 }
}

/** A blow of a key in the tower's time, in rows on the clock. */
export interface RungBlow extends RingingBlow {
  time: number
  row: number
  back: boolean
  entry: boolean
}

/** The blows of a key between two times on the clock, with the touch of every ringer as it comes in. */
export function ringingBlows(
  set: RingingSettings,
  key: RingingKey,
  from: number,
  to: number,
): { blows: RungBlow[]; fronts: { time: number; front: number }[] } {
  const whole = 1 + set.gap
  const { behind, pace } = ringingTime(set, key.slot)
  const start = Number.isFinite(key.entry) ? key.entry : 0
  const place = (time: number): number => start - behind + (time - start) * pace
  const when = (at: number): number => start + (at - start + behind) / pace
  const blows: RungBlow[] = []
  const fronts: { time: number; front: number }[] = []
  const first = Math.floor(place(Math.max(from, key.entry)) / whole)
  const everyRow = set.tower === TOWER.together || set.tower === TOWER.canon
  for (let row = first; row * whole <= place(to); row += 1) {
    const { blows: rung, front } = ringingRow(set, key, row)
    fronts.push({ time: when(row * whole), front })
    const back = mod(everyRow ? row : Math.floor(row / 2), 2) !== 0
    for (const blow of rung) {
      const time = when(row * whole + blow.at)
      if (time >= key.entry && time <= to) blows.push({ ...blow, time, row, back, entry: false })
    }
  }
  if (key.entry >= from && key.entry <= to) {
    const one = key.joined ? [1, 0.5, 0.7, 0.55][set.tower] : 1
    const full = smooth(clamp((set.overlap - 0.75) * 4, 0, 1))
    for (let ringer = set.ringers - 1; ringer >= 0; ringer -= 1) {
      const low = ringer === 0
      const touch =
        one *
        (low ? [0.5, 0.7, 0.3, 0.45, 0.4, 0.3] : [0.1, 0.28, 0.06, 0.08, 0.1, 0.15])[set.method]
      const gain = touch + full * ((low ? 0.9 : 0.65) - touch)
      blows.unshift({
        ...{ at: 0, ringer, gain, line: 0 },
        time: key.entry,
        row: -1,
        back: false,
        entry: true,
      })
    }
  }
  return { blows: blows.sort((a, b) => a.time - b.time), fronts }
}

/** How many rows a page has. */
export const RINGING_PAGE = 4

/** The page the clock is on: from which row to which, in rows on the clock. */
export function ringingPage(set: RingingSettings, clock: number): { from: number; to: number } {
  const long = RINGING_PAGE * (1 + set.gap)
  const from = Math.floor(clock / long) * long
  return { from, to: from + long }
}

/** The key whose rows are drawn: the one held longest, or the newest that sounds. */
export const ringingShown = (keys: readonly RingingKey[]): RingingKey =>
  keys.find((key) => key.off === Infinity) ?? keys[keys.length - 1]

/** The lines of an order: from blow to blow through all of it, or row by row where a row begins at its own end again. */
export function ringingLines(set: RingingSettings, blows: readonly RungBlow[]): RungBlow[][] {
  const whole = [METHOD.hunt, METHOD.dodge, METHOD.long].includes(set.method)
  const rung = blows.filter((blow) => !blow.entry)
  if (whole) return [rung]
  return [...new Set(rung.map((blow) => blow.row))].flatMap((row) =>
    [0, 1].map((line) =>
      rung.filter((blow) => blow.row === row && (blow.line === line || blow.middle)),
    ),
  )
}
