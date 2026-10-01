// The space a track's clips can be sent into (`Clip.spaceDb`): a long, dark
// room with no early slap, so a clip sent far into it reads as distant rather
// than as a room of its own. It is a convolution with a generated impulse:
// noise that swells in, decays to −60 dB over `decaySec` and dulls as it
// goes, different left and right so the tail is wide.
//
// Each audio track convolves for itself, ahead of its strip, so its inserts,
// fader and mute act on the space as they do on the dry clips. Every track
// reads the same impulse, and convolution is linear, so the tracks still
// sound as if they shared one room.

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
}

export const DEFAULT_SPACE: Required<SpaceOptions> = {
  decaySec: 5,
  predelaySec: 0.02,
  attackSec: 0.04,
  brightHz: 7000,
  darkHz: 900,
  lowCutHz: 160,
  seed: 0x5eed,
}

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
  }
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

/** One channel of the room: its samples, scaled so they sum to unit energy. */
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
  // The last tenth runs out to nothing, so the impulse does not end on a step.
  const runOut = Math.max(1, Math.round(tail * 0.1))
  const lowCut = space.lowCutHz > 0 ? Math.exp((-2 * Math.PI * space.lowCutHz) / sampleRate) : 0

  let low = 0
  let lower = 0
  let cutIn = 0
  let cutOut = 0
  let energy = 0
  for (let i = 0; i < tail; i += 1) {
    const along = i / tail
    const t = i / sampleRate
    // A low-pass (two poles) that closes as the tail goes on: the top end dies first.
    const cutoffHz = space.brightHz * (space.darkHz / space.brightHz) ** along
    const a = 1 - Math.exp((-2 * Math.PI * Math.min(cutoffHz, sampleRate * 0.45)) / sampleRate)
    const b = 1 - a
    low += a * (random() - low)
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
    const value = sample * swell * decay * end
    data[predelay + i] = value
    energy += value * value
  }
  // Unit energy: a steady sound sent in at 0 dB comes back as loud as it went in.
  const scale = energy > 0 ? 1 / Math.sqrt(energy) : 0
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
