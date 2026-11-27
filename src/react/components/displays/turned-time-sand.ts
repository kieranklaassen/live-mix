// The arithmetic of the Turned Time display, which is the device's own
// (`cpp/devices/turned-time/turned_time.h`; the functions carry its names): how
// a glass runs, turns and comes back (`move`), how far a sound has faded at a
// place of its sand (`fade_at`), and how loud each partial is there (`shape`,
// `levels`). What the device does to all partials of a note alike, the evening
// of a walk and the level of a strike, is left out: the picture is of one walk
// against itself. The small wandering of a hovering glass is left out too.

import { clamp, type Box } from '../display-kit'

/** What reads a knob. */
export type TimeValue = (name: string) => number

// --- The bodies ------------------------------------------------------------------

/** A row of `build_tables`: what the display reads of a body. */
export interface TimeBody {
  name: string
  /** How much faster than the others it fades. */
  drain: number
  places: readonly number[]
  levels: readonly number[]
  fading: readonly number[]
  spark: readonly number[]
  side: readonly number[]
}

/** A string or a reed: 16 harmonics, and 8 more two or three apart. */
const harmonic = (of: (place: number, k: number) => number): number[] =>
  Array.from({ length: 24 }, (_, k) => of(k < 16 ? k + 1 : Math.floor(16.01 + 2.5 * (k - 15)), k))
const bow = (n: number): number => Math.abs(Math.sin(Math.PI * n * 0.19)) + 0.06
const odd = (n: number): number => n % 2

/** The bodies, as Body counts them. */
export const TIME_BODIES: readonly TimeBody[] = [
  {
    name: 'Bell',
    drain: 1,
    places: [1, 0.5, 1.498, 2, 2.52, 3, 4, 5.04, 6.02, 7.1, 8.25, 9.6, 11.1, 12.9],
    levels: [0, -8, -13, -5, -14, -9, -14, -19, -21, -25, -27, -30, -33, -36],
    fading: [1, 0.75, 1.3, 1.35, 1.5, 1.6, 1.9, 2.1, 2.3, 2.5, 2.7, 2.9, 3.1, 3.3],
    spark: [0, 0, 3, 3, 6, 6, 9, 11, 12, 14, 15, 16, 17, 18],
    side: [-11, -14, 4, 4, 3, 2, 8, 3, 9, 3, 8, 3, 6, 3],
  },
  {
    name: 'Bar',
    drain: 2.2,
    places: [1, 2, 4, 6.4, 9.9, 13.6, 17.9, 22],
    levels: [0, -44, -26, -50, -42, -54, -60, -64],
    fading: [1, 1.2, 1.9, 2.2, 2.6, 3, 3.2, 3.4],
    spark: [0, 2, 16, 18, 24, 26, 26, 26],
    side: [-24, 34, 12, 24, 16, 16, 16, 16],
  },
  {
    name: 'String',
    drain: 1.45,
    places: harmonic((n) => n * Math.sqrt(1 + 0.00006 * n * n)),
    levels: harmonic((n) => -6.2 * Math.log2(n) + 20 * Math.log10(bow(n)) + 4),
    fading: harmonic((n) => 1 + 0.4 * Math.log2(n)),
    spark: harmonic((n) => Math.min(5.5 * Math.log2(n), 15)),
    side: harmonic((_, k) => (k % 2 ? 8 : -22)),
  },
  {
    name: 'Skin',
    drain: 2.3,
    places: [1, 1.504, 1.993, 2.494, 2.98, 3.5, 4.06, 4.6, 5.2, 5.9, 6.7, 0.5],
    levels: [0, -8, -10, -16, -18, -22, -26, -29, -32, -35, -38, 0],
    fading: [1, 1.25, 1.6, 2, 2.3, 2.6, 2.8, 3, 3.2, 3.4, 3.6, 1.2],
    spark: [0, 5, 7, 11, 12, 14, 15, 16, 17, 18, 19, 4],
    side: [-12, 6, -14, 10, -10, 12, -8, 12, -8, 12, -8, -24],
  },
  {
    name: 'Glass',
    drain: 0.7,
    places: [1, 2, 4, 6.64, 9.45, 12.6, 16.2, 20.4],
    levels: [-13, -40, 0, -6, -8, -13, -18, -24],
    fading: [1, 1, 1.05, 1.15, 1.25, 1.45, 1.6, 1.8],
    spark: [0, 2, 3, 5, 5, 8, 9, 10],
    side: [-14, 24, -16, 6, -14, 6, 2, 2],
  },
  {
    name: 'Reed',
    drain: 0.42,
    places: harmonic((n) => n),
    levels: harmonic(
      (n) =>
        -Math.log2(n) -
        (odd(n) ? 0 : 14 * Math.exp(-0.1 * n)) -
        16 * Math.max(Math.log2(n) - 2.33, 0),
    ),
    fading: harmonic((n) => 1 + 0.25 * Math.log2(n)),
    spark: harmonic((n) => 0.8 * Math.log2(n)),
    side: harmonic((n) => (odd(n) ? -22 : 12)),
  },
]
const REED = 5
export const TIME_NECKS = ['soften', 'strike', 'hover', 'pass'] as const
export const TIME_SOFTEN = 0
export const TIME_STRIKE = 1
const HOVER = 2
export const TIME_PASS = 3
const EMPTY_GLASS = 1
const LET_GO = 2

// --- The knobs -------------------------------------------------------------------

/** What the display reads off the knobs, as the device applies them. */
export interface TimeSet {
  body: number
  neck: number
  turn: number
  /** Where the sand is out: 1, or 1.8 where only an empty glass turns (`limit`). */
  lim: number
  tilt: number
  /** log2 of Hz. */
  frame: number
  strike: number
  attack: number
  sand: number
  /** dB that Depth takes by the end of the sand, before a body's drain (`now_.fade`). */
  fade: number
  /** The power of the place that Pour makes of it (`now_.pour`). */
  pour: number
  apart: number
  inertia: number
  stagger: number
  split: number
  odd: boolean
  exchange: number
  memory: number
  grains: number
  ears: number
  release: number
}

const choice = (value: TimeValue, name: string, most: number): number =>
  clamp(Math.floor(value(name) + 0.5), 0, most)

export function timeSet(value: TimeValue): TimeSet {
  const [pour, split, exchange] = ['pour', 'split', 'exchange'].map(value)
  const turn = choice(value, 'turn', 2)
  return {
    body: choice(value, 'body', TIME_BODIES.length - 1),
    neck: choice(value, 'neck', TIME_NECKS.length - 1),
    turn,
    lim: turn === EMPTY_GLASS ? 1.8 : 1,
    tilt: value('tilt'),
    frame: Math.log2(Math.max(value('frame'), 1)),
    strike: value('strike'),
    attack: value('attack'),
    sand: Math.max(value('sand'), 0.01),
    fade: 4 * Math.pow(2, 3.75 * value('depth')),
    pour: Math.pow(2, (pour < 0.5 ? 2.7 : 3.2) * (pour - 0.5)),
    apart: value('apart'),
    inertia: value('inertia'),
    stagger: value('stagger'),
    split: Math.abs(split) * (2 - Math.abs(split)),
    odd: split > 0,
    exchange: exchange * (1.5 - 0.5 * exchange),
    memory: value('memory'),
    grains: value('grains'),
    ears: value('ears'),
    release: Math.max(value('release'), 0.04),
  }
}

// --- The walk along the sand -----------------------------------------------------

const SOFT_NECK = 0.55

/** How far from its beginning a place is read (`levels`): a softened neck keeps its distance, a hovering one a little. */
export function timeReach(set: TimeSet, u: number): number {
  const p = Math.abs(u)
  if (set.neck === TIME_SOFTEN) return Math.sqrt(p * p + SOFT_NECK * SOFT_NECK)
  return set.neck === HOVER ? p + 0.06 : p
}

/** How many dB the note itself has faded at a distance from its beginning (`fade_at`). */
export function timeFade(set: TimeSet, place: number): number {
  const soft = set.neck === TIME_SOFTEN ? 1 : 0
  let whole = set.fade * TIME_BODIES[set.body].drain * (1 + 0.5 * soft)
  if (whole > 60) whole = 60 + 0.3 * (whole - 60)
  const letOff = 0.75 * soft * Math.pow(SOFT_NECK, set.pour)
  return whole * Math.max(Math.pow(place, set.pour) - letOff, 0)
}

const wave = (x: number): number => Math.sin(2 * Math.PI * x)

/** `hearing`: how loud a hertz is, roughly. */
function hearing(hz: number): number {
  const low = hz / Math.sqrt(hz * hz + 130 * 130)
  return 0.8 * Math.pow(low, 1.5) * (1 + (0.5 * hz * hz) / (hz * hz + 2200 * 2200))
}

export interface TimePartial {
  /** log2 of its place. */
  octave: number
  /** dB at a place of the sand, below 0 the other side of the neck. */
  at(u: number): number
}

/** The partials of a note at `hz`, and how loud each is along the sand (`shape`, `levels`). */
export function timePartials(
  set: TimeSet,
  hz: number,
  gain: number,
  sampleRate: number,
): TimePartial[] {
  const body = TIME_BODIES[set.body]
  const tilt = (set.tilt > 0 ? 4.4 : 6) * set.tilt + 4 * (set.strike - 0.4) + 5 * (gain - 0.75)
  const top = Math.min(17000, 0.45 * sampleRate)
  const octaves = body.places.map(Math.log2)
  const edges = body.places.map((place) => clamp((top - hz * place) / 4000, 0, 1))
  const base = body.levels.map((level, k) => {
    const pitch = Math.log2(hz) + octaves[k]
    const off = (pitch - set.frame) / 0.5
    const throat = set.body === REED ? 12 * Math.max(pitch - 9.8, 0) : 0
    const high = 6 * (Math.max(pitch - 11.6, 0) + Math.max(pitch - 12.3, 0))
    return (
      level + tilt * Math.max(octaves[k], -0.5) + 9 * Math.exp(-0.5 * off * off) - throat - high
    )
  })
  // `power`, and what the two sides of a passed neck make of it.
  const power = (lean: number): number =>
    base.reduce(
      (sum, db, k) =>
        sum +
        hearing(hz * body.places[k]) * edges[k] * Math.pow(10, 0.1 * (db + lean * body.side[k])),
      1e-9,
    )
  const passes = set.neck === TIME_PASS
  const here = passes ? 10 * Math.log10(power(0) / power(-1.2)) - 1 : 0
  const other = passes ? 10 * Math.log10(power(0) / power(1.9)) - 1 : 0
  const soft = set.neck === TIME_SOFTEN ? 9 : 0
  const lit = set.neck === HOVER ? 5.6 : 0
  const strike = 1.5 * set.strike * (set.neck === HOVER ? 0.4 : 1) * (0.4 + 0.8 * gain)
  // How much a group that runs against the sand is brought up (`against_now`).
  const poured = set.fade * body.drain * Math.pow(0.5, set.pour) - 6
  const middle = set.odd ? 0 : 4 * set.split * (1 - set.split) * clamp(poured, 0, 7)
  const against = set.split * Math.min(0.5 * set.fade * body.drain, 8) + middle
  return octaves.map((octave, k) => {
    const over = Math.max(octave, 0)
    const group = set.split > 0 && (set.odd ? k % 2 === 1 : over > 1.2)
    const swings = over < 0.3 ? 5 : 28
    const at = (u: number): number => {
      const p = timeReach(set, u)
      const place = group ? p + (Math.max(set.lim - p, 0) - p) * set.split : p
      const swing = swings * (wave(1.2 * place - 0.28 * over) + wave(0.28 * over))
      const spark = strike * Math.exp(-5.5 * place * Math.max(set.sand, 0.7))
      const across = clamp(-9 * u, 0, 1)
      const far = passes ? across * across * (3 - 2 * across) : 0
      const side = passes
        ? far * (1.9 * body.side[k] + other) + (1 - far) * (here - 1.2 * body.side[k])
        : 0
      return (
        base[k] -
        Math.min(timeFade(set, place) * body.fading[k], 100) +
        spark * body.spark[k] +
        set.exchange * (swing > 0 ? 0.45 : 1) * swing +
        side -
        soft * over +
        lit * Math.min(over, 2.5) +
        (group ? against : 0) +
        20 * Math.log10(edges[k] + 1e-6)
      )
    }
    return { octave, at }
  })
}

// --- The form of the glass ---------------------------------------------------------

/** Half the width of the neck, and the dB at which a bulb is widest. */
const NECK_PX = 2.5
const WIDEST_DB = 60
const DB_BEND = 2.5

export interface TimeLayout {
  past: Box
  glass: Box
  /** The middle of the glass, and the height of the neck. */
  middle: number
  neck: number
}

export function timeLayout(size: { width: number; height: number }): TimeLayout {
  const w = clamp(Math.round(size.width * 0.4), 24, 76)
  const glass: Box = { x: size.width - 5 - w, y: 17, w, h: Math.max(size.height - 29, 20) }
  return {
    glass,
    past: { x: 5, y: glass.y, w: Math.max(glass.x - 8, 8), h: glass.h },
    middle: glass.x + glass.w / 2,
    neck: glass.y + glass.h / 2,
  }
}

/** Where a place of the sand stands: the neck in the middle, down as the sand runs. */
export const timeY = (u: number, lim: number, at: TimeLayout): number =>
  at.neck + (clamp(u / lim, -1, 1) * at.glass.h) / 2

/** Half the width of the glass where a sound has faded so far, and back. */
export function timeHalf(db: number, at: TimeLayout): number {
  const share = Math.log(1 + db / DB_BEND) / Math.log(1 + WIDEST_DB / DB_BEND)
  return NECK_PX + (at.glass.w / 2 - NECK_PX) * clamp(share, 0, 1)
}

/** Half the width of the glass at a place of the sand. */
export const timeWide = (set: TimeSet, u: number, at: TimeLayout): number =>
  timeHalf(timeFade(set, timeReach(set, u)), at)

// --- How it runs -----------------------------------------------------------------

/** A key's glass as `move` runs it. */
export interface TimeGlass {
  hz: number
  gain: number
  u: number
  speed: number
  way: 1 | -1
  lean: number
  /** dB that its returns are short of their beginning. */
  lost: number
  lostTo: number
  turnIn: number
  returning: boolean
  ended: boolean
  backRate: number
  age: number
  cross: number
  crossSeconds: number
  spoken: number
  held: boolean
  envelope: number
}

/** `kPlaces`: where the keys of a chord begin when they stand Apart. */
const PLACES = [0, -0.92, -0.46, -0.7] as const
/** Keys within this are one chord, and a glass younger than the other is not turned. */
export const TIME_CHORD_SEC = 0.09
const YOUNGEST = 0.12

/** `start`: a new key, the `order`th of its chord. */
export function timeStart(set: TimeSet, hz: number, gain: number, order: number): TimeGlass {
  const u = PLACES[order & 3] * set.apart
  const least = set.neck === TIME_SOFTEN ? 0.06 : set.body === REED ? 0.05 : 0.003
  return {
    hz,
    gain,
    u,
    speed: u < 0 ? 1 : 1 - 0.8 * set.inertia,
    way: 1,
    lean: clamp((69 + 12 * Math.log2(hz / 440) - 60) / 24, -1.3, 1.3),
    lost: 0,
    lostTo: 0,
    turnIn: -1,
    returning: false,
    ended: false,
    backRate: 1,
    age: 0,
    cross: 0,
    crossSeconds: Math.max(set.attack, least),
    spoken: 0,
    held: true,
    envelope: 1,
  }
}

const turnable = (glass: TimeGlass): boolean =>
  !glass.returning && !glass.ended && glass.age >= YOUNGEST

function turn(set: TimeSet, glass: TimeGlass): void {
  glass.way = glass.way === 1 ? -1 : 1
  if (glass.u * glass.way < 0) glass.lostTo += 0.4 * (30 * (1 - set.memory) - glass.lostTo)
}

/** `turn_the_others`: an event on the key of `hz` turns the glasses within its reach, the near ones first. */
export function timeTurnOthers(
  set: TimeSet,
  glasses: readonly TimeGlass[],
  hz: number,
  self: TimeGlass,
): void {
  const spread = 0.3 * set.stagger * Math.min(set.sand, 6)
  const reach = 0.25 + 8 * (1 - set.apart) * (1 - set.apart)
  for (const glass of glasses) {
    if (glass === self || !turnable(glass)) continue
    const far = Math.abs(Math.log2(glass.hz / hz))
    if (far <= reach) glass.turnIn = Math.min(far * spread, 4)
  }
}

/** `note_off`: the key is up, and where letting go turns time its glass comes back. */
export function timeLetGo(set: TimeSet, glass: TimeGlass): void {
  glass.held = false
  if (set.turn !== LET_GO || glass.returning || glass.ended || Math.abs(glass.u) < 0.04) return
  glass.way = glass.u > 0 ? -1 : 1
  glass.backRate = Math.max(Math.abs(glass.u), 0.2) / (0.6 * Math.max(set.release, 0.1))
  glass.returning = true
  glass.turnIn = -1
}

/** `move`: the glass `dt` seconds on. */
export function timeStep(set: TimeSet, glass: TimeGlass, dt: number): void {
  glass.age += dt
  glass.lost += (glass.lostTo - glass.lost) * (1 - Math.exp(-dt / 0.1))
  if (glass.turnIn >= 0) {
    glass.turnIn -= dt
    if (glass.turnIn < 0 && turnable(glass)) turn(set, glass)
  }
  let pace = Math.pow(2, 0.9 * set.stagger * glass.lean)
  if (set.turn === LET_GO && glass.held) pace *= 0.5
  const sand = set.sand / pace
  const slow = 0.015 + 0.9 * set.inertia * set.inertia * sand
  const tau = glass.returning ? Math.min(slow, 0.05) : slow
  let rate = glass.returning ? glass.backRate : 1 / sand
  glass.speed += (glass.way - glass.speed) * (1 - Math.exp(-dt / tau))
  if (!glass.returning) {
    if (set.neck === HOVER) {
      const x = Math.min(Math.abs(glass.u) * 2.5, 1)
      rate *= 1 - 0.88 * (1 - x * x * (3 - 2 * x))
    }
    if (set.neck === TIME_SOFTEN) rate *= 0.7
    if (set.neck === TIME_PASS && glass.u < 0) rate *= 0.5
  }
  const before = glass.u
  glass.u += glass.speed * rate * (0.35 + 0.65 * glass.spoken) * dt
  if ((before < 0 && glass.u >= 0) || (before > 0 && glass.u <= 0)) {
    if (glass.returning) glass.ended = true
    glass.returning = false
  }
  if (glass.u * glass.way >= set.lim && !glass.returning) turn(set, glass)
  glass.u = clamp(glass.u, -3, 3)
  if (!glass.held && !glass.returning)
    glass.envelope *= Math.exp((-6.907755279 * dt) / (glass.ended ? 0.4 : 1) / set.release)
  glass.cross = Math.min(glass.cross + dt / glass.crossSeconds, 1)
  glass.spoken = Math.max(glass.spoken, glass.cross * glass.cross * (3 - 2 * glass.cross))
}

/** One step of a glass, and of all of them, in seconds. */
export const TIME_STEP_SEC = 1 / 200
