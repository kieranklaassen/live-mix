// Node-side support for the patch renderer's tests: device modules read from
// the committed artefacts (Node's fetch does not load file: URLs), and the
// measurements the factory bank is held to.

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { LoudnessAnalyzer } from '../../core/analysis/loudness'
import { type PlanarAudio } from '../../core/render/encode'
import { type WasmDeviceDescriptor } from '../descriptor'
import { type WasmSource } from '../assets'

const wasmDir = join(dirname(fileURLToPath(import.meta.url)), '../wasm')
const modules = new Map<string, Promise<WebAssembly.Module>>()

/** `RenderPatchOptions.compile` for Node: one compiled module per device id. */
export function compileFromDisk(
  _source: WasmSource,
  descriptor: WasmDeviceDescriptor,
): Promise<WebAssembly.Module> {
  let module = modules.get(descriptor.id)
  if (!module) {
    module = readFile(join(wasmDir, `${descriptor.id}.wasm`)).then((bytes) =>
      WebAssembly.compile(bytes),
    )
    modules.set(descriptor.id, module)
  }
  return module
}

export const toDb = (gain: number): number => (gain > 0 ? 20 * Math.log10(gain) : -Infinity)

export interface AudioMeasurement {
  /** Sample peak, dBFS. */
  peakDb: number
  /** BS.1770 integrated loudness, LUFS. */
  lufs: number
  /** RMS of the loudest 400 ms, dBFS. */
  loudestDb: number
  /** Seconds until the level first comes within 6 dB of its loudest 50 ms. */
  attackSec: number
  /** RMS of the last half second, dB below the loudest 400 ms (0 = still at full level). */
  tailDb: number
  /** Where the energy sits, Hz: the spectral centroid of the whole sound. */
  centroidHz: number
  /** Side energy over mid energy, dB (−Infinity is mono, 0 is as wide as it is loud). */
  widthDb: number
  /** Mean of the left channel: a DC offset when far from zero. */
  dc: number
}

function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[re[i], re[j]] = [re[j], re[i]]
      ;[im[i], im[j]] = [im[j], im[i]]
    }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const angle = (-2 * Math.PI) / size
    for (let start = 0; start < n; start += size) {
      for (let k = 0; k < size / 2; k += 1) {
        const cos = Math.cos(angle * k)
        const sin = Math.sin(angle * k)
        const a = start + k
        const b = a + size / 2
        const tr = re[b] * cos - im[b] * sin
        const ti = re[b] * sin + im[b] * cos
        re[b] = re[a] - tr
        im[b] = im[a] - ti
        re[a] += tr
        im[a] += ti
      }
    }
  }
}

function centroid(mono: Float32Array, sampleRate: number): number {
  const size = 4096
  let weighted = 0
  let total = 0
  const re = new Float64Array(size)
  const im = new Float64Array(size)
  for (let start = 0; start + size <= mono.length; start += size * 4) {
    for (let i = 0; i < size; i += 1) {
      re[i] = mono[start + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / size))
      im[i] = 0
    }
    fft(re, im)
    for (let bin = 1; bin < size / 2; bin += 1) {
      const power = re[bin] * re[bin] + im[bin] * im[bin]
      weighted += power * ((bin * sampleRate) / size)
      total += power
    }
  }
  return total > 0 ? weighted / total : 0
}

/** RMS of each `windowSec` hop of the mid signal. */
function envelope(mono: Float32Array, sampleRate: number, windowSec: number): number[] {
  const hop = Math.max(1, Math.round(windowSec * sampleRate))
  const out: number[] = []
  for (let start = 0; start + hop <= mono.length; start += hop) {
    let sum = 0
    for (let i = start; i < start + hop; i += 1) sum += mono[i] * mono[i]
    out.push(Math.sqrt(sum / hop))
  }
  return out
}

export function measureAudio(audio: PlanarAudio): AudioMeasurement {
  const [left, right = left] = audio.channels
  const frames = left.length
  const mid = new Float32Array(frames)
  let peak = 0
  let midPower = 0
  let sidePower = 0
  let sum = 0
  for (let i = 0; i < frames; i += 1) {
    const m = (left[i] + right[i]) / 2
    const s = (left[i] - right[i]) / 2
    mid[i] = m
    midPower += m * m
    sidePower += s * s
    sum += left[i]
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]))
  }
  const analyzer = new LoudnessAnalyzer(audio.sampleRate)
  analyzer.process(left, right)

  const fine = envelope(mid, audio.sampleRate, 0.05)
  const loudestFine = Math.max(...fine, 0)
  const attackIndex = fine.findIndex((value) => value >= loudestFine / 2)
  const coarse = envelope(mid, audio.sampleRate, 0.4)
  const loudest = Math.max(...coarse, 0)
  const tailFrames = Math.min(frames, Math.round(0.5 * audio.sampleRate))
  let tailSum = 0
  for (let i = frames - tailFrames; i < frames; i += 1) tailSum += mid[i] * mid[i]
  const tail = Math.sqrt(tailSum / Math.max(1, tailFrames))

  return {
    peakDb: toDb(peak),
    lufs: analyzer.read().integrated,
    loudestDb: toDb(loudest),
    attackSec: Math.max(0, attackIndex) * 0.05,
    tailDb: toDb(tail) - toDb(loudest),
    centroidHz: centroid(mid, audio.sampleRate),
    widthDb: toDb(Math.sqrt(sidePower)) - toDb(Math.sqrt(midPower)),
    dc: sum / Math.max(1, frames),
  }
}

/** One line per measurement, for a report someone reads. */
export function formatMeasurement(m: AudioMeasurement): string {
  const f = (value: number, digits = 1) => (Number.isFinite(value) ? value.toFixed(digits) : '-inf')
  return (
    `peak ${f(m.peakDb)} dB  lufs ${f(m.lufs)}  loudest ${f(m.loudestDb)} dB  ` +
    `attack ${f(m.attackSec, 2)} s  tail ${f(m.tailDb)} dB  centroid ${f(m.centroidHz, 0)} Hz  ` +
    `width ${f(m.widthDb)} dB`
  )
}

/** A sound reduced to what tells it from another played on the same notes (`soundPrint`). */
export interface SoundPrint {
  /** Power in sixteen bands from 40 Hz to 16 kHz over four stretches of the sound, dB of its whole power. */
  bands: number[]
  /** Level in tenths of a second, dB under the loudest of them. */
  level: number[]
  /** Side over mid in the same four stretches, dB. */
  width: number[]
}

const PRINT_BANDS = 16
const PRINT_FLOOR_DB = -50

/**
 * What a rendered sound is like, apart from how loud it is: where its energy
 * sits as it goes on, how its level moves and how wide it is. Two presets of
 * one instrument play the same notes, so their prints differ only by what the
 * presets do, and `printDistance` says by how much.
 */
export function soundPrint(audio: PlanarAudio): SoundPrint {
  const [left, right = left] = audio.channels
  const frames = left.length
  const mid = new Float32Array(frames)
  for (let i = 0; i < frames; i += 1) mid[i] = (left[i] + right[i]) / 2

  const size = 4096
  const re = new Float64Array(size)
  const im = new Float64Array(size)
  const stretches = 4
  const power = Array.from({ length: stretches }, () => new Float64Array(PRINT_BANDS))
  const sides = new Float64Array(stretches)
  const mids = new Float64Array(stretches)
  const bandOf = (hz: number) =>
    Math.floor((Math.log2(hz / 40) / Math.log2(16000 / 40)) * PRINT_BANDS)
  let total = 0
  for (let start = 0; start + size <= frames; start += size / 2) {
    const stretch = Math.min(stretches - 1, Math.floor((start * stretches) / frames))
    for (let i = 0; i < size; i += 1) {
      re[i] = mid[start + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / size))
      im[i] = 0
      const side = (left[start + i] - right[start + i]) / 2
      sides[stretch] += side * side
      mids[stretch] += mid[start + i] * mid[start + i]
    }
    fft(re, im)
    for (let bin = 1; bin < size / 2; bin += 1) {
      const band = bandOf((bin * audio.sampleRate) / size)
      if (band < 0 || band >= PRINT_BANDS) continue
      const p = re[bin] * re[bin] + im[bin] * im[bin]
      power[stretch][band] += p
      total += p
    }
  }
  const floored = (value: number, whole: number) =>
    value > 0 && whole > 0
      ? Math.max(PRINT_FLOOR_DB, 10 * Math.log10(value / whole))
      : PRINT_FLOOR_DB

  const tenths = envelope(mid, audio.sampleRate, 0.1)
  const loudest = Math.max(...tenths, 0)
  return {
    bands: power.flatMap((stretch) => [...stretch].map((value) => floored(value, total))),
    level: tenths.map((value) => floored(value * value, loudest * loudest)),
    width: [...sides].map((side, i) => Math.max(-30, floored(side, mids[i]))),
  }
}

/**
 * How far two prints are apart, in dB: half of it the mean difference between
 * their bands, a third the mean difference in how their level moves, the rest
 * their width. Two renders of one preset are at 0; presets that are plainly
 * different sounds are several dB apart.
 */
export function printDistance(a: SoundPrint, b: SoundPrint): number {
  const apart = (x: readonly number[], y: readonly number[]) => {
    const length = Math.min(x.length, y.length)
    let sum = 0
    for (let i = 0; i < length; i += 1) sum += Math.abs(x[i] - y[i])
    return length > 0 ? sum / length : 0
  }
  return (
    0.5 * apart(a.bands, b.bands) + 0.35 * apart(a.level, b.level) + 0.15 * apart(a.width, b.width)
  )
}
