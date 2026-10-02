// The space a track's clips can be sent into (`Clip.spaceDb`): a long, dark
// room with no early slap, so a clip sent far into it reads as distant rather
// than as a room of its own. It is a convolution with a generated impulse:
// noise that swells in, decays to −60 dB over `decaySec` and dulls as it
// goes, different left and right so the tail is wide.
//
// The room is dark, so it gives back more of a sound's low mids than of its
// top. Its level is set where musical sound has its weight (`SPACE_LEVEL_LOW_HZ`
// to `SPACE_LEVEL_HIGH_HZ`): a steady sound there, sent in at 0 dB, comes
// back as loud as it went in, and hiss comes back quieter than that.
//
// Each audio track convolves for itself, ahead of its strip, so its inserts,
// fader and mute act on the space as they do on the dry clips. Every track
// reads the same impulse, and convolution is linear, so the tracks still
// sound as if they shared one room.
//
// A room can have a character beyond its length and colour. `grain` thins
// the tail from smooth noise into separate echoes, so it sounds rough. Two
// settings act on the way through instead of on the impulse (`SpaceRoom`
// below): `driveDb` pushes what is sent into a saturator before the room, so
// what sits far back is gritty and the room smears the grit; `driftCents`
// lets the tail wander in pitch, like a room heard off a tape. An engine's
// room can be changed while it plays (`Engine.setSpace`): what is ringing in
// the old room rings out there, and what is sent from then on goes to the
// new one.

/** What the generated room is like. */
export interface SpaceOptions {
  /** Seconds for the tail to fall 60 dB. Default 5. */
  decaySec?: number
  /** Silence ahead of the tail, in seconds. Default 0.02. */
  predelaySec?: number
  /** How long the tail takes to swell in, in seconds. Default 0.04. */
  attackSec?: number
  /** Where the tail's top end starts, in Hz. Default 7000. */
  brightHz?: number
  /** Where the tail's top end has fallen to by `decaySec`, in Hz. Default 900. */
  darkHz?: number
  /** Below this the tail is thinned out so many clips do not pile up as rumble, in Hz. Default 160. */
  lowCutHz?: number
  /** Seed of the noise: the same seed is the same room, sample for sample. */
  seed?: number
  /**
   * How loud the room comes back, in dB against the level described above:
   * at 0 a steady low-mid sound sent in at 0 dB comes back as loud as it
   * went in. Default 0, `MIN_SPACE_LEVEL_DB` to `MAX_SPACE_LEVEL_DB`.
   */
  levelDb?: number
  /**
   * How rough the tail is, 0..1. At 0 it is smooth noise; toward 1 it thins
   * into separate echoes (`GRAIN_ECHOES_PER_SEC` a second at 1), which sound
   * like gravel. Default 0.
   */
  grain?: number
  /**
   * How hard a sound is pushed on its way into the room, in dB. At 0 it goes
   * in clean. Above that it is saturated first: a sound at
   * `SPACE_DRIVE_LEVEL_DB` comes back as loud as it went in, quieter sound
   * comes up and louder is held. Default 0, at most `MAX_SPACE_DRIVE_DB`.
   */
  driveDb?: number
  /**
   * How far the room's tail drifts in pitch, in cents either way. 0 is a
   * still room. Default 0, at most `MAX_SPACE_DRIFT_CENTS`.
   */
  driftCents?: number
  /** How fast the tail drifts, in Hz. Default 0.5. */
  driftHz?: number
}

export const DEFAULT_SPACE: Required<SpaceOptions> = {
  decaySec: 5,
  predelaySec: 0.02,
  attackSec: 0.04,
  brightHz: 7000,
  darkHz: 900,
  lowCutHz: 160,
  seed: 0x5eed,
  levelDb: 0,
  grain: 0,
  driveDb: 0,
  driftCents: 0,
  driftHz: 0.5,
}

/** How far a room's level can be set under and over the stock room's, in dB. */
export const MIN_SPACE_LEVEL_DB = -24
export const MAX_SPACE_LEVEL_DB = 12
/** How many separate echoes a second the tail of a room at `grain` 1 is made of. */
export const GRAIN_ECHOES_PER_SEC = 120
/** The most a room's drive can push, in dB. */
export const MAX_SPACE_DRIVE_DB = 36
/** A steady sound at this level, sent into a driven room, comes back as loud as it went in. */
export const SPACE_DRIVE_LEVEL_DB = -18
/** The furthest a room's tail can drift in pitch, in cents either way. */
export const MAX_SPACE_DRIFT_CENTS = 50

/** The room with every setting filled in and kept inside what the generator can make. */
export function resolveSpace(options: SpaceOptions = {}): Required<SpaceOptions> {
  const pick = (value: number | undefined, fallback: number, min: number, max: number): number =>
    value === undefined || !Number.isFinite(value) ? fallback : Math.min(max, Math.max(min, value))
  const brightHz = pick(options.brightHz, DEFAULT_SPACE.brightHz, 200, 20_000)
  return {
    decaySec: pick(options.decaySec, DEFAULT_SPACE.decaySec, 0.1, 30),
    predelaySec: pick(options.predelaySec, DEFAULT_SPACE.predelaySec, 0, 0.5),
    attackSec: pick(options.attackSec, DEFAULT_SPACE.attackSec, 0, 0.5),
    brightHz,
    darkHz: pick(options.darkHz, DEFAULT_SPACE.darkHz, 100, brightHz),
    lowCutHz: pick(options.lowCutHz, DEFAULT_SPACE.lowCutHz, 0, 1000),
    seed: Math.trunc(pick(options.seed, DEFAULT_SPACE.seed, 0, 0xffff_ffff)),
    levelDb: pick(options.levelDb, DEFAULT_SPACE.levelDb, MIN_SPACE_LEVEL_DB, MAX_SPACE_LEVEL_DB),
    grain: pick(options.grain, DEFAULT_SPACE.grain, 0, 1),
    driveDb: pick(options.driveDb, DEFAULT_SPACE.driveDb, 0, MAX_SPACE_DRIVE_DB),
    driftCents: pick(options.driftCents, DEFAULT_SPACE.driftCents, 0, MAX_SPACE_DRIFT_CENTS),
    driftHz: pick(options.driftHz, DEFAULT_SPACE.driftHz, 0.05, 8),
  }
}

/** The settings an impulse is generated from: two rooms that agree on these share one. */
const IMPULSE_KEYS = [
  'decaySec',
  'predelaySec',
  'attackSec',
  'brightHz',
  'darkHz',
  'lowCutHz',
  'seed',
  'levelDb',
  'grain',
] as const satisfies readonly (keyof SpaceOptions)[]

/** True when two rooms are made from the same impulse, whatever is done on the way through it. */
export function sameSpaceImpulse(a: SpaceOptions, b: SpaceOptions): boolean {
  const left = resolveSpace(a)
  const right = resolveSpace(b)
  return IMPULSE_KEYS.every((key) => left[key] === right[key])
}

/** What is done to sound on its way through a room, apart from the impulse it is convolved with. */
export type SpaceColour = Required<Pick<SpaceOptions, 'driveDb' | 'driftCents' | 'driftHz'>>

/** The colour of a room: its drive and drift, filled in and kept inside their ranges. */
export function spaceColour(options: SpaceOptions = {}): SpaceColour {
  const { driveDb, driftCents, driftHz } = resolveSpace(options)
  return { driveDb, driftCents, driftHz }
}

/**
 * The saturator a driven room's sends go through: a soft curve leaning a
 * little to one side, so it makes even harmonics as well as odd ones (the
 * offset that leaves is below the room's low cut). Its slope through zero is
 * 1, and `SPACE_DRIVE_CURVE_REACH` is as far as its table reaches: beyond
 * that it is flat to within a millionth.
 */
export const SPACE_DRIVE_CURVE_REACH = 8
const SPACE_DRIVE_BIAS = 0.25

export function spaceDriveShape(x: number): number {
  const rest = Math.tanh(SPACE_DRIVE_BIAS)
  return (Math.tanh(x + SPACE_DRIVE_BIAS) - rest) / (1 - rest * rest)
}

/** The saturator as a table for a `WaveShaperNode`, whose input runs −1 … 1 over `SPACE_DRIVE_CURVE_REACH` either way. */
export function spaceDriveCurve(points = 8193): Float32Array {
  const curve = new Float32Array(points)
  for (let i = 0; i < points; i += 1) {
    const x = ((2 * i) / (points - 1) - 1) * SPACE_DRIVE_CURVE_REACH
    curve[i] = spaceDriveShape(x)
  }
  return curve
}

/**
 * The gains either side of the saturator at `driveDb`. `into` pushes the
 * sound in (with the table's reach taken off, since a shaper node's input is
 * −1 … 1); `outOf` brings a steady sound at `SPACE_DRIVE_LEVEL_DB` back to
 * the level it came in at, so drive changes the texture and not how loud the
 * room is. At 0 dB there is no saturator and both are 1.
 */
export function spaceDriveGains(driveDb: number): { into: number; outOf: number } {
  const db = Math.min(MAX_SPACE_DRIVE_DB, Math.max(0, Number.isFinite(driveDb) ? driveDb : 0))
  if (db <= 0) return { into: 1, outOf: 1 }
  const push = 10 ** (db / 20)
  const rms = 10 ** (SPACE_DRIVE_LEVEL_DB / 20)
  const peak = rms * Math.SQRT2
  // One cycle of a sine at the reference level, through the curve: what is
  // left once the offset has gone is what the room is fed.
  const steps = 256
  let sum = 0
  let squares = 0
  for (let i = 0; i < steps; i += 1) {
    const y = spaceDriveShape(push * peak * Math.sin((2 * Math.PI * (i + 0.5)) / steps))
    sum += y
    squares += y * y
  }
  const mean = sum / steps
  const out = Math.sqrt(Math.max(0, squares / steps - mean * mean))
  return { into: push / SPACE_DRIVE_CURVE_REACH, outOf: out > 0 ? rms / out : 1 }
}

/** The longest a drifting room's read point can sit behind, in seconds. */
export const MAX_SPACE_DRIFT_DELAY_SEC = 0.3
/** The drift is two sines: the second this many times as fast as `driftHz`, so the pair does not repeat for a long while. */
export const SPACE_DRIFT_SECOND_RATIO = 2.718
/** How much of the drift each of the two sines carries. */
const SPACE_DRIFT_SHARES = [0.7, 0.3] as const

/**
 * A drifting room as a delay whose time two sines move: the rate of each, how
 * far each moves the delay (seconds either way) and the delay they move
 * around. A delay moving at `2π · hz · depth` seconds per second shifts pitch
 * by that ratio, so the two together reach `driftCents` either way.
 */
export function spaceDrift(colour: Pick<SpaceColour, 'driftCents' | 'driftHz'>): {
  rates: [number, number]
  depths: [number, number]
  delaySec: number
} {
  const ratio = 2 ** (Math.min(MAX_SPACE_DRIFT_CENTS, Math.max(0, colour.driftCents)) / 1200) - 1
  const rates: [number, number] = [colour.driftHz, colour.driftHz * SPACE_DRIFT_SECOND_RATIO]
  const depths = rates.map(
    (hz, index) => (ratio * SPACE_DRIFT_SHARES[index]) / (2 * Math.PI * hz),
  ) as [number, number]
  // A slow, deep drift would need more delay than there is: it keeps its rate and gives up depth.
  const room = MAX_SPACE_DRIFT_DELAY_SEC / 2 - 0.001
  const reach = depths[0] + depths[1]
  if (reach > room) {
    depths[0] *= room / reach
    depths[1] *= room / reach
  }
  return { rates, depths, delaySec: depths[0] + depths[1] + 0.001 }
}

/**
 * How many echoes a second a tail at `grain` is made of on a context of
 * `sampleRate`: every sample at 0, falling by ratio to `GRAIN_ECHOES_PER_SEC`
 * at 1.
 */
export function grainEchoesPerSec(grain: number, sampleRate: number): number {
  const amount = Math.min(1, Math.max(0, grain))
  return sampleRate * (GRAIN_ECHOES_PER_SEC / sampleRate) ** amount
}

/**
 * The band the room's level is set in: between these a steady sound sent in
 * at 0 dB comes back as loud as it went in.
 */
export const SPACE_LEVEL_LOW_HZ = 150
export const SPACE_LEVEL_HIGH_HZ = 1500

/**
 * Energy of `data` weighted to the level band: through a one-pole high-pass
 * at its low end and a one-pole low-pass at its high end.
 */
function levelBandEnergy(data: Float32Array, from: number, sampleRate: number): number {
  const high = Math.exp((-2 * Math.PI * SPACE_LEVEL_LOW_HZ) / sampleRate)
  const low = 1 - Math.exp((-2 * Math.PI * SPACE_LEVEL_HIGH_HZ) / sampleRate)
  let highIn = 0
  let highOut = 0
  let lowOut = 0
  let energy = 0
  for (let i = from; i < data.length; i += 1) {
    highOut = high * (highOut + data[i] - highIn)
    highIn = data[i]
    lowOut += low * (highOut - lowOut)
    energy += lowOut * lowOut
  }
  return energy
}

/** What the level band lets through of a single sample: the weight a flat response of unit gain has. */
function levelBandUnit(sampleRate: number): number {
  // The band's own response has rung out well inside a tenth of a second.
  const impulse = new Float32Array(Math.max(1, Math.round(sampleRate / 10)))
  impulse[0] = 1
  return levelBandEnergy(impulse, 0, sampleRate)
}

/** Mulberry32: a small seeded generator, so a render is the same every time. */
function noise(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1
  }
}

/** One channel of the room: its samples, scaled to unit gain in the level band. */
export function spaceImpulseChannel(
  sampleRate: number,
  options: SpaceOptions = {},
  channel = 0,
): Float32Array {
  const space = resolveSpace(options)
  const predelay = Math.round(space.predelaySec * sampleRate)
  const tail = Math.max(1, Math.round(space.decaySec * sampleRate))
  const data = new Float32Array(predelay + tail)
  const random = noise(space.seed + channel * 0x9e37_79b9)
  // A rough room keeps only some of the noise, picked by a generator of its
  // own, so a smooth room is the same samples whether or not grain exists.
  const keep = space.grain > 0 ? grainEchoesPerSec(space.grain, sampleRate) / sampleRate : 1
  const pick = noise((space.seed ^ 0x6a09_e667) + channel * 0x9e37_79b9)
  // The last tenth runs out to nothing, so the impulse does not end on a step.
  const runOut = Math.max(1, Math.round(tail * 0.1))
  const lowCut = space.lowCutHz > 0 ? Math.exp((-2 * Math.PI * space.lowCutHz) / sampleRate) : 0

  let low = 0
  let lower = 0
  let cutIn = 0
  let cutOut = 0
  for (let i = 0; i < tail; i += 1) {
    const along = i / tail
    const t = i / sampleRate
    // A low-pass (two poles) that closes as the tail goes on: the top end dies first.
    const cutoffHz = space.brightHz * (space.darkHz / space.brightHz) ** along
    const a = 1 - Math.exp((-2 * Math.PI * Math.min(cutoffHz, sampleRate * 0.45)) / sampleRate)
    const b = 1 - a
    const white = random()
    // What is kept is made as much louder as there is less of it, so the
    // filter after it is fed the same power either way.
    const fed = keep >= 1 ? white : (pick() + 1) / 2 < keep ? white / Math.sqrt(keep) : 0
    low += a * (fed - low)
    lower += a * (low - lower)
    // The filter thins the noise as it closes; dividing by what it lets
    // through keeps the level on the decay line, so it is the colour that
    // changes and not the length.
    let sample = lower / Math.sqrt((a ** 4 * (1 + b * b)) / (1 - b * b) ** 3)
    if (lowCut > 0) {
      const cut = lowCut * (cutOut + sample - cutIn)
      cutIn = sample
      cutOut = cut
      sample = cut
    }
    const swell = space.attackSec > 0 ? 1 - Math.exp(-t / (space.attackSec / 3)) : 1
    const decay = 10 ** (-3 * along)
    const end = i >= tail - runOut ? (tail - i) / runOut : 1
    data[predelay + i] = sample * swell * decay * end
  }
  // Unit gain where sound has its weight: a steady sound there sent in at
  // 0 dB comes back as loud as it went in. Over the whole spectrum the room
  // gives back less than it is sent, because its top end is gone early.
  const energy = levelBandEnergy(data, predelay, sampleRate)
  const unit = energy > 0 ? Math.sqrt(levelBandUnit(sampleRate) / energy) : 0
  const scale = unit * 10 ** (space.levelDb / 20)
  for (let i = predelay; i < data.length; i += 1) data[i] *= scale
  return data
}

/** The room as a stereo impulse response for a `ConvolverNode` with `normalize` off. */
export function generateSpaceImpulse(
  ctx: BaseAudioContext,
  options: SpaceOptions = {},
): AudioBuffer {
  const left = spaceImpulseChannel(ctx.sampleRate, options, 0)
  const right = spaceImpulseChannel(ctx.sampleRate, options, 1)
  const impulse = ctx.createBuffer(2, left.length, ctx.sampleRate)
  impulse.copyToChannel(left as Float32Array<ArrayBuffer>, 0)
  impulse.copyToChannel(right as Float32Array<ArrayBuffer>, 1)
  return impulse
}
