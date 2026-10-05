// What a chain of a pack is measured on before it is kept: three dry sounds
// run through it (a sparse electric piano, a held chord, four struck bells),
// and the piano at full level for half a minute to see whether it clips,
// whether it runs away and what noise it leaves behind. Nothing here is heard: a chain is kept or refused on
// these figures alone.
//
// Node only (it reads the device modules from disk): the bench and the tests
// import it, the library does not.

import { type Patch } from '../../../../core/devices/patch'
import { type PlanarAudio } from '../../../../core/render/encode'
import {
  compileFromDisk,
  fft,
  measureAudio,
  printDistance,
  soundPrint,
  toDb,
  type AudioMeasurement,
  type SoundPrint,
} from '../../../__tests__/render-support'
import { peakOf, renderPatch, type Phrase } from '../../../patch-render'
import { CHAIN_PREVIEW_PATCH, CHAIN_PREVIEW_PHRASE, FACTORY_PHRASES } from '../../phrases'
import { type FactoryChainCategory } from '../../types'

const node = { compile: compileFromDisk, sliceMs: 0 } as const

/** The dry sounds a chain is measured on, in the order they are reported. */
export const BENCH_INPUTS = ['keys', 'pad', 'bells'] as const
export type BenchInputId = (typeof BENCH_INPUTS)[number]

/** Seconds of each dry sound that go in, and seconds that come out with the tail. */
export const BENCH_INPUT_SECONDS = 6
export const BENCH_RENDER_SECONDS = 10

/** Peak every dry sound is brought to, dBFS: what the electric piano phrase peaks at by itself. */
const INPUT_PEAK_DB = -10.6

const SOURCES: Readonly<Record<BenchInputId, { patch: Patch; phrase: Phrase }>> = {
  // The phrase a chain preview plays: attacks and gaps.
  keys: { patch: CHAIN_PREVIEW_PATCH, phrase: CHAIN_PREVIEW_PHRASE },
  // A held chord with no attack to speak of: what a swell, a gate or a slow compressor does shows here.
  pad: {
    patch: {
      id: 'chain-bench-pad',
      name: 'Chain bench pad',
      category: 'bench',
      description: 'A string ensemble, dry.',
      instrument: { deviceId: 'string-machine' },
      effects: [],
    },
    phrase: FACTORY_PHRASES.chord,
  },
  // Four struck notes high up: where shifters and grains show their edges.
  bells: {
    patch: {
      id: 'chain-bench-bells',
      name: 'Chain bench bells',
      category: 'bench',
      description: 'Struck bells, dry.',
      instrument: { deviceId: 'modal-bells' },
      effects: [],
    },
    phrase: FACTORY_PHRASES.bells,
  },
}

/**
 * A sound as the bench tells it from another: the bank's print (where the
 * energy sits as it goes on, how the level moves in tenths of a second, how
 * wide it is) and, since a tenth of a second is too coarse to see a tremolo
 * or a chop, how the level moves faster than that.
 */
export interface BenchPrint {
  print: SoundPrint
  /** Movement of the level in four bands, 2 to 4, 4 to 8, 8 to 16 and 16 to 32 Hz, dB under its steady part. */
  flutter: number[]
}

const FLUTTER_HOP_SEC = 0.004
const FLUTTER_WINDOW = 512
const FLUTTER_BANDS = [2, 4, 8, 16, 32] as const
const FLUTTER_FLOOR_DB = -50

function flutter(audio: PlanarAudio): number[] {
  const [left, right = left] = audio.channels
  const hop = Math.max(1, Math.round(FLUTTER_HOP_SEC * audio.sampleRate))
  const points = Math.floor(left.length / hop)
  const envelope = new Float64Array(points)
  for (let at = 0; at < points; at += 1) {
    let sum = 0
    for (let i = at * hop; i < (at + 1) * hop; i += 1) {
      const mid = (left[i] + right[i]) / 2
      sum += mid * mid
    }
    envelope[at] = Math.sqrt(sum / hop)
  }
  const moving = new Float64Array(FLUTTER_BANDS.length - 1)
  let steady = 0
  const re = new Float64Array(FLUTTER_WINDOW)
  const im = new Float64Array(FLUTTER_WINDOW)
  const binHz = 1 / (FLUTTER_HOP_SEC * FLUTTER_WINDOW)
  for (let start = 0; start + FLUTTER_WINDOW <= points; start += FLUTTER_WINDOW / 2) {
    for (let i = 0; i < FLUTTER_WINDOW; i += 1) {
      re[i] = envelope[start + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / FLUTTER_WINDOW))
      im[i] = 0
    }
    fft(re, im)
    // The window's own lobe at the bottom: the level that does not move.
    for (let bin = 0; bin <= 1; bin += 1) steady += re[bin] * re[bin] + im[bin] * im[bin]
    for (let bin = 2; bin < FLUTTER_WINDOW / 2; bin += 1) {
      const hz = bin * binHz
      const band = FLUTTER_BANDS.findIndex((edge, index) => index > 0 && hz < edge) - 1
      if (hz >= FLUTTER_BANDS[0] && band >= 0) moving[band] += re[bin] * re[bin] + im[bin] * im[bin]
    }
  }
  return [...moving].map((power) =>
    power > 0 && steady > 0
      ? Math.max(FLUTTER_FLOOR_DB, 10 * Math.log10(power / steady))
      : FLUTTER_FLOOR_DB,
  )
}

export function benchPrint(audio: PlanarAudio): BenchPrint {
  return { print: soundPrint(audio), flutter: flutter(audio) }
}

/**
 * How far two sounds are apart, dB: the bank's `printDistance`, and a fifth
 * of the mean difference in how their level flutters, so that a tremolo on a
 * sound is not the same sound.
 */
export function benchDistance(a: BenchPrint, b: BenchPrint): number {
  let sum = 0
  for (let i = 0; i < a.flutter.length; i += 1) sum += Math.abs(a.flutter[i] - b.flutter[i])
  return printDistance(a.print, b.print) + 0.2 * (sum / a.flutter.length)
}

export interface BenchInput {
  id: BenchInputId
  audio: PlanarAudio
  /** The dry sound left to end by itself over the render's length: what a chain's output is compared with. */
  measured: AudioMeasurement
  print: BenchPrint
}

const scaled = (audio: PlanarAudio, gain: number): PlanarAudio => ({
  sampleRate: audio.sampleRate,
  channels: audio.channels.map((channel) => channel.map((sample) => sample * gain)),
})

/** `audio` with silence after it, `seconds` long in all. */
const padded = (audio: PlanarAudio, seconds: number): PlanarAudio => {
  const frames = Math.round(seconds * audio.sampleRate)
  return {
    sampleRate: audio.sampleRate,
    channels: audio.channels.map((channel) => {
      const out = new Float32Array(frames)
      out.set(channel.subarray(0, Math.min(frames, channel.length)))
      return out
    }),
  }
}

let inputs: Promise<readonly BenchInput[]> | undefined

/** The three dry sounds, rendered once. */
export function benchInputs(): Promise<readonly BenchInput[]> {
  inputs ??= Promise.all(
    BENCH_INPUTS.map(async (id): Promise<BenchInput> => {
      const raw = await renderPatch(SOURCES[id].patch, {
        ...node,
        phrase: SOURCES[id].phrase,
        durationSec: BENCH_INPUT_SECONDS,
        fadeOutSec: 0.05,
      })
      const audio = scaled(raw, 10 ** (INPUT_PEAK_DB / 20) / peakOf(raw.channels))
      const whole = padded(audio, BENCH_RENDER_SECONDS)
      return { id, audio, measured: measureAudio(whole), print: benchPrint(whole) }
    }),
  )
  return inputs
}

/** A chain on one dry sound. */
export interface ChainHearing {
  measured: AudioMeasurement
  /** Loudness against the dry sound, LU (above 0 is louder). */
  lu: number
  /** How far the result is from the dry sound, dB (`benchDistance`). */
  fromDry: number
  print: BenchPrint
  finite: boolean
  /** Share of real time the render took, percent: only a guide when other work shares the machine. */
  costPct: number
}

const finite = (audio: PlanarAudio): boolean =>
  audio.channels.every((channel) => channel.every((sample) => Number.isFinite(sample)))

/** RMS of both channels between two times, dBFS. */
function level(audio: PlanarAudio, fromSec: number, toSec: number): number {
  let sum = 0
  let count = 0
  for (const channel of audio.channels) {
    const end = Math.min(channel.length, Math.round(toSec * audio.sampleRate))
    for (let i = Math.round(fromSec * audio.sampleRate); i < end; i += 1) {
      sum += channel[i] * channel[i]
      count += 1
    }
  }
  return count > 0 ? toDb(Math.sqrt(sum / count)) : -Infinity
}

/** Run one dry sound through the chain and measure what comes out. */
export async function hearChain(chain: Patch, input: BenchInput): Promise<ChainHearing> {
  const started = performance.now()
  const wet = await renderPatch(chain, {
    ...node,
    input: input.audio,
    durationSec: BENCH_RENDER_SECONDS,
  })
  const costPct = (performance.now() - started) / (BENCH_RENDER_SECONDS * 10)
  const ok = finite(wet)
  const measured = measureAudio(wet)
  const print = benchPrint(wet)
  return {
    measured,
    lu: measured.lufs - input.measured.lufs,
    fromDry: benchDistance(print, input.print),
    print,
    finite: ok,
    costPct,
  }
}

/** What a chain does when it is pushed: the electric piano at full level, and half a minute to run on. */
export interface ChainStress {
  /** The last five seconds of the half minute against seconds 12 to 17, dB: above 0 it is growing. */
  growsDb: number
  /** The last five seconds against the loudest second of the first ten, dB: near 0 it never dies away. */
  ringsDb: number
  /** Sample peak with the electric piano at -1 dBFS, dBFS. */
  hotPeakDb: number
  /**
   * The last five seconds, dBFS: what is left nineteen seconds after the
   * piano stopped, which is the chain's own noise or a sound it holds. (A
   * noise device puts out nothing until it has been played into, so there
   * is no measuring this with silence going in.)
   */
  restDb: number
  finite: boolean
}

export const STRESS_SECONDS = 30

export async function stressChain(chain: Patch, keys: BenchInput): Promise<ChainStress> {
  const loud = scaled(keys.audio, 10 ** (-1 / 20) / peakOf(keys.audio.channels))
  const long = await renderPatch(chain, { ...node, input: loud, durationSec: STRESS_SECONDS })
  const loudest = Math.max(...Array.from({ length: 10 }, (_, i) => level(long, i, i + 1)))
  const middle = level(long, 12, 17)
  const end = level(long, 25, 30)
  return {
    // A run that has died away to nothing by the middle is not growing, whatever the two silences measure.
    growsDb: end > -70 ? end - middle : -Infinity,
    ringsDb: end - loudest,
    hotPeakDb: toDb(peakOf(long.channels)),
    restDb: end,
    finite: finite(long),
  }
}

/** Everything the bench knows about one chain. */
export interface ChainFacts {
  on: Record<BenchInputId, ChainHearing>
  stress: ChainStress
}

export async function chainFacts(chain: Patch): Promise<ChainFacts> {
  const [keys, pad, bells] = await benchInputs()
  return {
    on: {
      keys: await hearChain(chain, keys),
      pad: await hearChain(chain, pad),
      bells: await hearChain(chain, bells),
    },
    stress: await stressChain(chain, keys),
  }
}

/** What a chain of a pack is held to on the bench. */
export const CHAIN_BENCH_LIMITS = {
  /** Sample peak on the electric piano at most, dBFS (the dry phrase peaks at -10.6): the bank's own limit. */
  peakDb: -5,
  /** Sample peak on the held chord and the bells at most, dBFS. */
  otherPeakDb: -3,
  /** How far its loudness may sit from the dry piano's, LU: inside the bank's 4, so a pack plays at one level. */
  lu: 3.5,
  /** The same on the held chord and the bells, which a filter or a swell is free to change more. */
  otherLu: 7,
  /** Mean of the left channel at most. */
  dc: 0.01,
  /** How far from the dry sound it is at least on one of the three, dB: under it the chain does nothing to speak of. */
  fromDryDb: 1,
  /** The same for a master chain, which is meant to do little to a quiet phrase. */
  masterFromDryDb: 0.3,
  /** A half-minute run may end this much above its middle at most, dB. */
  growsDb: 1,
  /** Sample peak with the piano at -1 dBFS at most, dBFS: a chain may add to a peak, it may not multiply it. */
  hotPeakDb: 3,
  /**
   * What may be left nineteen seconds after the playing stopped, dBFS: the
   * hiss of a tape and the static of a radio are under this, a wall of noise
   * is not. A chain that holds a sound on purpose is not asked.
   */
  restDb: -30,
  /** Two chains nearer than this on the three sounds together are one chain twice, dB. */
  twinDb: 1,
} as const

/** Where one hearing leaves the limits: the piano is held tighter than the other two. */
function hearingFaults(id: BenchInputId, heard: ChainHearing): string[] {
  const faults: string[] = []
  const primary = id === 'keys'
  if (!heard.finite) faults.push(`NAN on ${id}`)
  if (!Number.isFinite(heard.measured.lufs)) return [...faults, `SILENT on ${id}`]
  const peak = primary ? CHAIN_BENCH_LIMITS.peakDb : CHAIN_BENCH_LIMITS.otherPeakDb
  if (heard.measured.peakDb > peak) faults.push(`PEAK on ${id}`)
  const lu = primary ? CHAIN_BENCH_LIMITS.lu : CHAIN_BENCH_LIMITS.otherLu
  if (heard.lu > lu) faults.push(`LOUD on ${id}`)
  if (heard.lu < -lu) faults.push(`QUIET on ${id}`)
  if (Math.abs(heard.measured.dc) >= CHAIN_BENCH_LIMITS.dc) faults.push(`DC on ${id}`)
  return faults
}

/** Where the electric piano alone already refuses a chain: the cheap first look. */
export function keysFaults(heard: ChainHearing): string[] {
  return hearingFaults('keys', heard)
}

/** Where the three hearings leave the limits, before the chain is pushed. */
export function hearingsFaults(
  on: Record<BenchInputId, ChainHearing>,
  category: FactoryChainCategory,
): string[] {
  const faults = BENCH_INPUTS.flatMap((id) => hearingFaults(id, on[id]))
  const changes = Math.max(...BENCH_INPUTS.map((id) => on[id].fromDry))
  const least =
    category === 'master' ? CHAIN_BENCH_LIMITS.masterFromDryDb : CHAIN_BENCH_LIMITS.fromDryDb
  if (changes < least) faults.push('SAME as the dry sound')
  return faults
}

/**
 * Where a pushed chain leaves the limits. `holds` is true for a chain with
 * an effect that holds a sound without end: what it leaves behind is the
 * sound, not noise.
 */
export function stressFaults(stress: ChainStress, holds = false): string[] {
  const faults: string[] = []
  if (!stress.finite) faults.push('NAN when pushed')
  if (stress.growsDb > CHAIN_BENCH_LIMITS.growsDb) faults.push('GROWS')
  if (stress.hotPeakDb > CHAIN_BENCH_LIMITS.hotPeakDb) faults.push('HOT')
  if (!holds && stress.restDb > CHAIN_BENCH_LIMITS.restDb) faults.push('NOISE')
  return faults
}

/** Why a chain is refused; empty when it is kept. */
export function chainFaults(
  facts: ChainFacts,
  category: FactoryChainCategory,
  holds = false,
): string[] {
  return [...hearingsFaults(facts.on, category), ...stressFaults(facts.stress, holds)]
}

/** How far two chains are apart on the three dry sounds together, dB. */
export function chainDistance(
  a: Record<BenchInputId, { print: BenchPrint }>,
  b: Record<BenchInputId, { print: BenchPrint }>,
): number {
  let sum = 0
  for (const id of BENCH_INPUTS) sum += benchDistance(a[id].print, b[id].print)
  return sum / BENCH_INPUTS.length
}
