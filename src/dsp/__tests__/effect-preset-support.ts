// What an effect's own presets are held to, and how they are measured: each
// one is rendered on the dry phrase a chain preview plays, with nothing else
// in the chain, and compared with the dry phrase and with its siblings. A
// preset is worth a place in the list only when it can be told from both.

import { describe, expect, it } from 'vitest'

import { type PlanarAudio } from '../../core/render/encode'
import { type Patch } from '../../core/devices/patch'
import { CHAIN_PREVIEW_INPUT_SECONDS, PREVIEW_SECONDS } from '../factory'
import { CHAIN_PREVIEW_PATCH, CHAIN_PREVIEW_PHRASE } from '../factory/phrases'
import { isWasmDescriptor, type WasmDeviceDescriptor } from '../descriptor'
import { renderPatch } from '../patch-render'
import { STOCK_WASM_DEVICES } from '../registry'
import { compileFromDisk, measureAudio, type AudioMeasurement } from './render-support'

const node = { sampleRate: 48000, compile: compileFromDisk, sliceMs: 0 }

/** The library's own effects: every device with a module that is not an instrument. */
export const EFFECTS: readonly WasmDeviceDescriptor[] = STOCK_WASM_DEVICES.filter(
  (descriptor): descriptor is WasmDeviceDescriptor =>
    descriptor.category !== 'instrument' && isWasmDescriptor(descriptor),
)

/** How many presets of its own an effect comes with at the least. */
export const PRESETS_EACH = 16

/**
 * The effects that come with fewer: each has too few controls, or controls
 * that do too little apart, for sixteen settings a listener would tell from
 * one another.
 */
export const FEWER_PRESETS: Readonly<Record<string, number>> = {
  'ambient-limiter': 10,
  'plate-reverb': 10,
  'ether-reverb': 14,
  'fdn-reverb': 14,
  'fet-limiter': 8,
  'spectral-drifter': 14,
  'stereo-widener': 6,
  'hall-reverb': 12,
}

/**
 * Presets that leave the sound close to how it came, on purpose: the settings
 * a host's mixer starts a channel's EQ and compressor on, by the channel's
 * name, and a master limiter's ways of doing one job, which part company only
 * while it is leaned on. They are held to every rule but the two about being
 * told apart by ear, and no sibling is faulted for sounding like one of them.
 */
export const QUIET_PRESETS: Readonly<Record<string, readonly string[]>> = {
  'ambient-comp': ['Level', 'Glue', 'Keys', 'Mic'],
  'ambient-eq': ['Open', 'Layer', 'Drone', 'Texture', 'Keys', 'Voice', 'Master'],
  'ambient-limiter': ['Master', 'Streaming', 'Slow tide', 'Wall only'],
}

/** The longest a preset's name may be: what a row of a preset list shows whole. */
export const LONGEST_NAME = 24

/** The dry electric piano every effect preset is heard on. */
export async function renderProbe(): Promise<PlanarAudio> {
  const dry = await renderPatch(CHAIN_PREVIEW_PATCH, {
    ...node,
    phrase: CHAIN_PREVIEW_PHRASE,
    durationSec: CHAIN_PREVIEW_INPUT_SECONDS,
  })
  const fade = Math.round(0.05 * dry.sampleRate)
  for (const channel of dry.channels) {
    for (let i = 0; i < fade; i += 1) channel[channel.length - 1 - i] *= i / fade
  }
  return dry
}

/** How far over full scale the bright probe peaks: a mix that is too hot, which is what a limiter is for. */
const HOT_PEAK = 10 ** (4 / 20)

/**
 * A second thing to hear a preset on: bright saws swelling in under the same
 * piano, dense, with energy to the top of the spectrum, and four dB over full
 * scale. The piano alone is dull and quiet, so a preset that cuts the highs,
 * or one that only works on a loud signal, does nothing to it.
 */
export async function renderBrightProbe(dry: PlanarAudio): Promise<PlanarAudio> {
  const saws = await renderPatch(
    {
      id: 'effect-preset-bright-probe',
      name: 'Bright probe',
      category: 'probe',
      description: 'Dry saws.',
      instrument: { deviceId: 'string-machine', preset: 'Dry saws' },
      effects: [],
    },
    {
      ...node,
      phrase: {
        notes: [
          { atSec: 0, durSec: 5.4, note: 45 },
          { atSec: 0.8, durSec: 4.6, note: 57 },
          { atSec: 1.6, durSec: 3.8, note: 64 },
          { atSec: 2.4, durSec: 3, note: 69 },
          { atSec: 3.2, durSec: 2.2, note: 73 },
        ],
      },
      durationSec: CHAIN_PREVIEW_INPUT_SECONDS,
    },
  )
  const fade = Math.round(0.05 * dry.sampleRate)
  let peak = 0
  const channels = dry.channels.map((channel, index) => {
    const other = saws.channels[index] ?? saws.channels[0]
    const out = new Float32Array(channel.length)
    for (let i = 0; i < out.length; i += 1) {
      const end = Math.min(1, (out.length - 1 - i) / fade)
      out[i] = channel[i] + other[i] * end
      peak = Math.max(peak, Math.abs(out[i]))
    }
    return out
  })
  for (const channel of channels) {
    for (let i = 0; i < channel.length; i += 1) channel[i] *= HOT_PEAK / peak
  }
  return { sampleRate: dry.sampleRate, channels }
}

/** The probe with silence after it, as long as a rendered preset. */
export function paddedProbe(dry: PlanarAudio): PlanarAudio {
  const frames = Math.round(PREVIEW_SECONDS * dry.sampleRate)
  return {
    sampleRate: dry.sampleRate,
    channels: dry.channels.map((channel) => {
      const out = new Float32Array(frames)
      out.set(channel.subarray(0, frames))
      return out
    }),
  }
}

/** One effect on one of its presets (or as it starts, with `null`), over the probe. */
export function renderEffectPreset(
  descriptor: WasmDeviceDescriptor,
  preset: string | null,
  dry: PlanarAudio,
): Promise<PlanarAudio> {
  const patch: Patch = {
    id: 'effect-preset-probe',
    name: 'Effect preset probe',
    category: 'probe',
    description: 'One effect on the dry phrase.',
    effects: [{ deviceId: descriptor.id, ...(preset === null ? {} : { preset }) }],
  }
  return renderPatch(patch, { ...node, input: dry, durationSec: PREVIEW_SECONDS })
}

const FFT = 2048
const BANDS = 18
const LOW_HZ = 50
const HIGH_HZ = 16000

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

/**
 * A sound as a grid of levels: the power in each of eighteen bands, frame by
 * frame, for the middle and for the sides. Two sounds whose grids agree are
 * heard as the same thing; a delay of a few samples or a turned phase, which
 * a sample-by-sample difference would count, does not show here.
 */
export interface SoundPrint {
  /** dB per frame per band, mid then side. */
  cells: Float32Array
  frames: number
}

export function soundPrint(audio: PlanarAudio): SoundPrint {
  const [left, right = left] = audio.channels
  const frames = Math.floor(left.length / FFT)
  const cells = new Float32Array(frames * BANDS * 2)
  const edges: number[] = []
  for (let band = 0; band <= BANDS; band += 1) {
    const hz = LOW_HZ * (HIGH_HZ / LOW_HZ) ** (band / BANDS)
    edges.push(Math.max(1, Math.round((hz * FFT) / audio.sampleRate)))
  }
  const re = new Float64Array(FFT)
  const im = new Float64Array(FFT)
  for (let frame = 0; frame < frames; frame += 1) {
    for (let side = 0; side < 2; side += 1) {
      for (let i = 0; i < FFT; i += 1) {
        const l = left[frame * FFT + i]
        const r = right[frame * FFT + i]
        const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / FFT)
        re[i] = (side === 0 ? (l + r) / 2 : (l - r) / 2) * window
        im[i] = 0
      }
      fft(re, im)
      for (let band = 0; band < BANDS; band += 1) {
        let power = 0
        const end = Math.max(edges[band] + 1, edges[band + 1])
        for (let bin = edges[band]; bin < end; bin += 1)
          power += re[bin] * re[bin] + im[bin] * im[bin]
        cells[(frame * 2 + side) * BANDS + band] = 10 * Math.log10(power / (FFT * FFT) + 1e-20)
      }
    }
  }
  return { cells, frames }
}

/** How far down from the loudest cell of either sound a cell still counts. */
const RANGE_DB = 50

/**
 * How unlike two sounds are: the mean difference in dB over every cell that
 * is within fifty dB of the loudest in either. Nought is the same sound; one
 * is about the least a listener notices; past three they are plainly two
 * different sounds.
 */
export function printDistance(a: SoundPrint, b: SoundPrint): number {
  let top = -Infinity
  for (let i = 0; i < a.cells.length; i += 1) top = Math.max(top, a.cells[i], b.cells[i])
  const floor = top - RANGE_DB
  let sum = 0
  let count = 0
  for (let i = 0; i < a.cells.length; i += 1) {
    const x = Math.max(floor, a.cells[i])
    const y = Math.max(floor, b.cells[i])
    if (x === floor && y === floor) continue
    sum += Math.abs(x - y)
    count += 1
  }
  return count === 0 ? 0 : sum / count
}

export interface PresetReading {
  name: string
  /** What the manifest gets wrong: an unknown control, a value out of range, a choice between two steps. */
  invalid: string[]
  measured: AudioMeasurement
  /** Against the dry probe, on whichever of the two probes shows more. */
  fromDry: number
  /** Against the effect as it starts, likewise. */
  fromDefault: number
  /**
   * The sibling it is nearest to, and how near: on the probe that tells the
   * two apart best. Null for a quiet preset, which is not compared, and for
   * the only one of an effect that is not quiet.
   */
  nearest: { name: string; distance: number } | null
  /** One of `QUIET_PRESETS`: meant to change little. */
  quiet: boolean
  /** Any sample that is not a number. */
  broken: boolean
}

export interface EffectReading {
  id: string
  dry: AudioMeasurement
  presets: PresetReading[]
}

export function invalidValues(
  descriptor: WasmDeviceDescriptor,
  params: Readonly<Partial<Record<string, number>>>,
): string[] {
  const problems: string[] = []
  for (const [key, value] of Object.entries(params)) {
    const spec = descriptor.params[key]
    if (!spec) {
      problems.push(`${key} is not a control`)
    } else if (
      value === undefined ||
      !Number.isFinite(value) ||
      value < spec.min ||
      value > spec.max
    ) {
      problems.push(`${key} ${value} is outside ${spec.min}..${spec.max}`)
    } else if (spec.choices?.length && !Number.isInteger(value)) {
      problems.push(`${key} ${value} is between two choices`)
    }
  }
  return problems
}

/** The two probes: the dry piano the presets are levelled on, and the bright hot mix. */
export interface Probes {
  dry: PlanarAudio
  bright: PlanarAudio
}

export async function renderProbes(): Promise<Probes> {
  const dry = await renderProbe()
  return { dry, bright: await renderBrightProbe(dry) }
}

/** Every preset of one effect, rendered on both probes and compared. */
export async function readEffect(
  descriptor: WasmDeviceDescriptor,
  probes: Probes,
): Promise<EffectReading> {
  const inputs = [probes.dry, probes.bright]
  const dryPrints = inputs.map((input) => soundPrint(paddedProbe(input)))
  const defaultPrints: SoundPrint[] = []
  for (const input of inputs) {
    defaultPrints.push(soundPrint(await renderEffectPreset(descriptor, null, input)))
  }
  const names = Object.keys(descriptor.presets ?? {})
  const prints: SoundPrint[][] = []
  const presets: PresetReading[] = []
  for (const name of names) {
    const audio = await renderEffectPreset(descriptor, name, probes.dry)
    const bright = await renderEffectPreset(descriptor, name, probes.bright)
    const own = [soundPrint(audio), soundPrint(bright)]
    prints.push(own)
    presets.push({
      name,
      invalid: invalidValues(descriptor, descriptor.presets?.[name] ?? {}),
      measured: measureAudio(audio),
      fromDry: Math.max(...own.map((print, probe) => printDistance(print, dryPrints[probe]))),
      fromDefault: Math.max(
        ...own.map((print, probe) => printDistance(print, defaultPrints[probe])),
      ),
      nearest: null,
      quiet: (QUIET_PRESETS[descriptor.id] ?? []).includes(name),
      broken: [audio, bright].some((rendered) =>
        rendered.channels.some((channel) => channel.some((sample) => !Number.isFinite(sample))),
      ),
    })
  }
  presets.forEach((preset, index) => {
    if (preset.quiet) return
    for (let other = 0; other < presets.length; other += 1) {
      if (other === index || presets[other].quiet) continue
      const distance = Math.max(
        ...prints[index].map((print, probe) => printDistance(print, prints[other][probe])),
      )
      if (!preset.nearest || distance < preset.nearest.distance) {
        preset.nearest = { name: presets[other].name, distance }
      }
    }
  })
  return { id: descriptor.id, dry: measureAudio(paddedProbe(probes.dry)), presets }
}

/** The least a preset must differ from the dry phrase and from each sibling, as `printDistance` counts. */
export const LEAST_DISTANCE = 1

/** What is wrong with a preset as measured; empty when it is fine. */
export function presetProblems(preset: PresetReading, dry: AudioMeasurement): string[] {
  const problems = [...preset.invalid]
  const m = preset.measured
  if (preset.broken) problems.push('puts out samples that are not numbers')
  if (m.peakDb > -1) problems.push(`peaks at ${m.peakDb.toFixed(1)} dBFS`)
  if (!(m.lufs > dry.lufs - 12))
    problems.push(`is ${(dry.lufs - m.lufs).toFixed(1)} LU quieter than the dry phrase`)
  if (m.lufs > dry.lufs + 6)
    problems.push(`is ${(m.lufs - dry.lufs).toFixed(1)} LU louder than the dry phrase`)
  if (Math.abs(m.dc) > 0.01) problems.push(`leaves an offset of ${m.dc.toFixed(3)}`)
  // The one preset that is the effect as it starts may leave the sound alone: it is where the knobs go home to.
  if (preset.fromDry < LEAST_DISTANCE && preset.fromDefault > 0 && !preset.quiet) {
    problems.push(
      `is ${preset.fromDry.toFixed(2)} from the dry phrase: it changes too little to hear`,
    )
  }
  if (preset.nearest && preset.nearest.distance < LEAST_DISTANCE) {
    problems.push(
      `is ${preset.nearest.distance.toFixed(2)} from "${preset.nearest.name}": the two sound alike`,
    )
  }
  return problems
}

/** A table of one effect's presets for someone writing them. */
export function formatEffect(reading: EffectReading): string {
  const f = (value: number, digits = 1) => (Number.isFinite(value) ? value.toFixed(digits) : '-inf')
  const lines = [
    `## ${reading.id}  (${reading.presets.length} presets; dry phrase ${f(reading.dry.lufs)} LUFS, peak ${f(reading.dry.peakDb)} dB, centroid ${f(reading.dry.centroidHz, 0)} Hz)`,
  ]
  for (const preset of reading.presets) {
    const m = preset.measured
    const problems = presetProblems(preset, reading.dry)
    lines.push(
      `  ${problems.length ? 'FAIL' : preset.quiet ? 'ok ~' : 'ok  '} ${preset.name.padEnd(24)} LU ${f(m.lufs - reading.dry.lufs).padStart(5)}  peak ${f(m.peakDb).padStart(5)}  ` +
        `tail ${f(m.tailDb).padStart(6)}  centroid ${f(m.centroidHz, 0).padStart(5)}  width ${f(m.widthDb).padStart(6)}  ` +
        `dry ${f(preset.fromDry, 2).padStart(5)}  default ${f(preset.fromDefault, 2).padStart(5)}  ` +
        `nearest ${(preset.nearest ? f(preset.nearest.distance, 2) : '-').padStart(5)} ${preset.nearest?.name ?? ''}`,
    )
    for (const problem of problems) lines.push(`         ${preset.name} ${problem}`)
  }
  return lines.join('\n')
}

/** How many files the renders are spread over, so they run side by side. */
export const SOUND_SHARES = 6

/**
 * The tests of one share of the effects: every preset of each rendered on
 * both probes and held to `presetProblems`. A file per share calls this with
 * its number; vitest runs files side by side and the tests of one file in
 * turn, and the renders of all the effects in turn take minutes.
 */
export function describeEffectPresetSounds(share: number): void {
  describe(`effect presets as they sound, share ${share + 1} of ${SOUND_SHARES}`, () => {
    let probes: Promise<Probes> | undefined
    const mine = EFFECTS.filter((_, index) => index % SOUND_SHARES === share)
    it.each(mine.map((descriptor) => [descriptor.id, descriptor] as const))(
      '%s: every preset sounds, at a level to play at, unlike the dry sound and unlike its siblings',
      async (_id, descriptor) => {
        probes ??= renderProbes()
        const reading = await readEffect(descriptor, await probes)
        const problems = reading.presets.flatMap((preset) =>
          presetProblems(preset, reading.dry).map((problem) => `${preset.name} ${problem}`),
        )
        expect(problems).toEqual([])
      },
      300_000,
    )
  })
}
