// Synthetic signals for the onset and sound-kind tests: deterministic (seeded
// noise), mono, at 48 kHz unless a rate is given.

export const SAMPLE_RATE = 48000

/** Mulberry32: a small seeded generator, uniform in [0, 1). */
export function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function silence(seconds: number, sampleRate = SAMPLE_RATE): Float32Array {
  return new Float32Array(Math.round(seconds * sampleRate))
}

/** White noise (hiss). */
export function whiteNoise(seconds: number, seed = 1, amplitude = 0.3): Float32Array {
  const random = seeded(seed)
  const out = silence(seconds)
  for (let i = 0; i < out.length; i++) out[i] = amplitude * (2 * random() - 1)
  return out
}

/** White noise through a one-pole low-pass: duller, like steady rain. */
export function rain(seconds: number, seed = 1): Float32Array {
  const out = whiteNoise(seconds, seed, 0.6)
  let state = 0
  for (let i = 0; i < out.length; i++) {
    state += 0.2 * (out[i] - state)
    out[i] = state
  }
  return out
}

/** Pink-ish noise (Paul Kellet's economy filter): wind, a creek. */
export function pinkNoise(seconds: number, seed = 1): Float32Array {
  const out = whiteNoise(seconds, seed, 1)
  let b0 = 0
  let b1 = 0
  let b2 = 0
  for (let i = 0; i < out.length; i++) {
    const white = out[i]
    b0 = 0.99765 * b0 + white * 0.099046
    b1 = 0.963 * b1 + white * 0.2965164
    b2 = 0.57 * b2 + white * 1.0526913
    out[i] = (b0 + b1 + b2 + white * 0.1848) * 0.1
  }
  return out
}

export function sine(seconds: number, frequency: number, amplitude = 0.5): Float32Array {
  const out = silence(seconds)
  for (let i = 0; i < out.length; i++) {
    out[i] = amplitude * Math.sin((2 * Math.PI * frequency * i) / SAMPLE_RATE)
  }
  return out
}

/** Multiplies `signal` in place by `gain(timeSec, durationSec)`. */
export function shape(
  signal: Float32Array,
  gain: (timeSec: number, durationSec: number) => number,
): Float32Array {
  const duration = signal.length / SAMPLE_RATE
  for (let i = 0; i < signal.length; i++) signal[i] *= gain(i / SAMPLE_RATE, duration)
  return signal
}

/** Adds `part` into `target` starting at `atSec`. */
export function mixInto(target: Float32Array, part: Float32Array, atSec = 0): Float32Array {
  const offset = Math.round(atSec * SAMPLE_RATE)
  for (let i = 0; i < part.length && offset + i < target.length; i++) target[offset + i] += part[i]
  return target
}

/** A plucked note: a few harmonics, 3 ms attack, exponential decay with time constant `tau`. */
export function note(frequency: number, seconds: number, tau: number, amplitude = 0.5) {
  const out = silence(seconds)
  for (let harmonic = 1; harmonic <= 3; harmonic++) {
    for (let i = 0; i < out.length; i++) {
      const t = i / SAMPLE_RATE
      out[i] +=
        (amplitude / harmonic) *
        Math.sin(2 * Math.PI * frequency * harmonic * t) *
        Math.exp(-t / tau) *
        Math.min(1, t / 0.003)
    }
  }
  return out
}

/** A noise burst with an exponential decay: a click, a hat, a snare. */
export function click(seed = 3, tau = 0.03, amplitude = 0.8, seconds = 0.12): Float32Array {
  return shape(whiteNoise(seconds, seed, amplitude), (t) => Math.exp(-t / tau))
}

/** A kick: a sine sweeping down from 200 Hz to 50 Hz under a fast decay. */
export function kick(amplitude = 0.9): Float32Array {
  const out = silence(0.25)
  let phase = 0
  for (let i = 0; i < out.length; i++) {
    const t = i / SAMPLE_RATE
    phase += (2 * Math.PI * (50 + 150 * Math.exp(-t / 0.03))) / SAMPLE_RATE
    out[i] = amplitude * Math.sin(phase) * Math.exp(-t / 0.08)
  }
  return out
}

/**
 * `seconds` of hits on a grid of `division` steps per beat at `bpm`; `hit`
 * returns the sound for a step, or null to leave it empty.
 */
export function pattern(
  seconds: number,
  bpm: number,
  hit: (step: number) => Float32Array | null,
  division = 1,
): Float32Array {
  const out = silence(seconds)
  const stepSec = 60 / bpm / division
  for (let step = 0; step * stepSec < seconds - 0.001; step++) {
    const sound = hit(step)
    if (sound) mixInto(out, sound, step * stepSec)
  }
  return out
}

/** The 10 s click train at 96 bpm: 16 decaying noise bursts, exactly 16 beats long. */
export function clickTrain96(): Float32Array {
  return pattern(10, 96, (step) => click(3 + step))
}

/** Decaying notes at irregular times; returns the signal and when each note starts. */
export function irregularNotes(seed = 11): { signal: Float32Array; times: number[] } {
  const random = seeded(seed)
  const signal = silence(9)
  const times: number[] = []
  let time = 0.15
  while (time < 8) {
    const semitone = Math.floor(random() * 12)
    mixInto(signal, note(220 * 2 ** (semitone / 12), 1.2, 0.35), time)
    times.push(time)
    time += 0.23 + random() * 0.9
  }
  return { signal, times }
}
