// Renders a patch to audio with no audio context: each WASM device module is
// instantiated here and driven through the device ABI (cpp/common/device_api.h),
// the way the worklet drives it, one block after another. Notes land on the
// exact frame they are written for, so a render is a pure function of the
// patch and the phrase: the same samples in a browser, in Node and in CI.
//
// That is what a preset preview and a factory sound are made of: a phrase
// played on the patch's instrument through its effects, or a recording run
// through an effect chain. Only WASM devices can be rendered this way; a
// patch with a Web Audio node device in it has to be heard live.

import { type DeviceDescriptor } from '../core/devices'
import { type Patch, type PatchDevice, patchDeviceParams } from '../core/devices/patch'
import { type PlanarAudio } from '../core/render/encode'
import { type DeviceExports } from './abi'
import { compileWasm, type WasmSource } from './assets'
import { isWasmDescriptor, type WasmDeviceDescriptor } from './descriptor'
import { noteFrequency } from './note-frequency'
import { describeStockWasmDevice } from './registry'

/** One note of a phrase, timed from the start of the render. */
export interface PhraseNote {
  atSec: number
  durSec: number
  /** MIDI note number; fractions are allowed. */
  note: number
  /** Velocity, 0..1 (default `DEFAULT_PHRASE_GAIN`). */
  gain?: number
}

/** What is played on a patch's instrument. */
export interface Phrase {
  notes: readonly PhraseNote[]
}

/** How a loop's end is added to its start: at equal power, or at equal amplitude. */
export type LoopFold = 'power' | 'linear'

/** The velocity a phrase note plays at when it names none: what an on-screen key sends. */
export const DEFAULT_PHRASE_GAIN = 0.8

export { noteFrequency }

export interface RenderPatchOptions {
  /** Length of the returned audio in seconds. */
  durationSec: number
  /** Default 48000. */
  sampleRate?: number
  /** What the instrument plays. Without one an instrument patch renders silence. */
  phrase?: Phrase
  /** What an effect chain processes (mono or stereo, at `sampleRate`); silence follows it. */
  input?: PlanarAudio
  /** The sound a sample instrument (granular synth, sampler) plays, at any rate. */
  sample?: PlanarAudio
  /**
   * Rendered and thrown away before the returned audio starts, so a loop
   * begins with the attack over and the reverb already full.
   */
  skipSec?: number
  /**
   * Make the audio loop without a seam: this much more is rendered past the
   * end and crossfaded over the start (equal power).
   */
  loopCrossfadeSec?: number
  /**
   * How the fold adds the two stretches (default `'power'`). Equal power is
   * right for two unrelated stretches; `'linear'` for a phrase that is played
   * round again, where the stretch past the end is the start once more and
   * equal power would swell by 3 dB.
   */
  loopFold?: LoopFold
  /** Linear fades at the two ends, in seconds (default 0 in, 0 out). */
  fadeInSec?: number
  fadeOutSec?: number
  /** Scale the result so its peak sits at this level, in dBFS. Silence stays silence. */
  normalizePeakDb?: number
  /** Where device ids are looked up (default: the stock WASM devices). */
  describe?: (deviceId: string) => DeviceDescriptor | undefined
  /** How a device module is compiled (default `compileWasm`, cached per URL). */
  compile?: (source: WasmSource, descriptor: WasmDeviceDescriptor) => Promise<WebAssembly.Module>
  /**
   * Hand the thread back after this many milliseconds of rendering, so a page
   * stays responsive (default 12). `0` renders in one go.
   */
  sliceMs?: number
  signal?: AbortSignal
}

const BLOCK = 128

/** True when every device of the patch is a WASM device `renderPatch` can run. */
export function canRenderPatch(
  patch: Patch,
  describe: (deviceId: string) => DeviceDescriptor | undefined = describeStockWasmDevice,
): boolean {
  const devices = patch.instrument ? [patch.instrument, ...patch.effects] : patch.effects
  return devices.every((device) => {
    const descriptor = describe(device.deviceId)
    return descriptor !== undefined && isWasmDescriptor(descriptor)
  })
}

/** One device module, instantiated and set to its patch state. */
class Stage {
  readonly inLeft: Float32Array
  readonly inRight: Float32Array
  readonly outLeft: Float32Array
  readonly outRight: Float32Array

  constructor(
    readonly device: DeviceExports,
    readonly id: string,
  ) {
    const memory = device.memory.buffer
    // The module's memory is fixed and its buses are static, so these views
    // stay valid for the whole render.
    this.inLeft = new Float32Array(memory, device.device_in_left(), BLOCK)
    this.inRight = new Float32Array(memory, device.device_in_right(), BLOCK)
    this.outLeft = new Float32Array(memory, device.device_out_left(), BLOCK)
    this.outRight = new Float32Array(memory, device.device_out_right(), BLOCK)
  }

  loadSample(sample: PlanarAudio): void {
    const { device_sample_capacity, device_sample_buffer, device_sample_commit } = this.device
    if (!device_sample_capacity || !device_sample_buffer || !device_sample_commit) return
    if (sample.channels.length === 0) return
    const capacity = device_sample_capacity()
    const frames = Math.min(sample.channels[0].length, capacity)
    const count = Math.min(sample.channels.length, 2)
    const store = new Float32Array(this.device.memory.buffer, device_sample_buffer(), capacity * 2)
    for (let channel = 0; channel < count; channel += 1) {
      store.set(sample.channels[channel].subarray(0, frames), channel * capacity)
    }
    device_sample_commit(frames, count, sample.sampleRate)
  }
}

async function createStage(
  device: PatchDevice,
  sampleRate: number,
  options: RenderPatchOptions,
): Promise<Stage> {
  const descriptor = (options.describe ?? describeStockWasmDevice)(device.deviceId)
  if (!descriptor) throw new Error(`live-mix: unknown device "${device.deviceId}"`)
  if (!isWasmDescriptor(descriptor)) {
    throw new Error(
      `live-mix: ${descriptor.id} is not a WASM device and cannot be rendered without an audio context`,
    )
  }
  const source = descriptor.definition.wasm()
  const module = await (options.compile ? options.compile(source, descriptor) : compileWasm(source))
  const instance = await WebAssembly.instantiate(module, {})
  const exports = instance.exports as unknown as DeviceExports
  exports._initialize?.()
  exports.device_init(sampleRate, exports.device_max_block_frames())
  for (const [name, value] of Object.entries(patchDeviceParams(descriptor, device))) {
    exports.device_set_param(descriptor.params[name].id, value)
  }
  return new Stage(exports, descriptor.id)
}

interface NoteEvent {
  frame: number
  on: boolean
  id: number
  frequency: number
  gain: number
}

function phraseEvents(phrase: Phrase | undefined, sampleRate: number): NoteEvent[] {
  const events: NoteEvent[] = []
  phrase?.notes.forEach((note, id) => {
    if (!Number.isFinite(note.atSec) || !Number.isFinite(note.durSec) || note.durSec <= 0) return
    const frame = Math.max(0, Math.round(note.atSec * sampleRate))
    const frequency = noteFrequency(note.note)
    const gain = note.gain ?? DEFAULT_PHRASE_GAIN
    events.push({ frame, on: true, id, frequency, gain })
    events.push({
      frame: frame + Math.max(1, Math.round(note.durSec * sampleRate)),
      on: false,
      id,
      frequency,
      gain,
    })
  })
  // Stable: at the same frame a release sorts before the next attack only when it came first.
  return events.sort((a, b) => a.frame - b.frame)
}

function nextTask(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Fold the `crossfade` frames past `frames` onto the start, so the first
 * `frames` loop without a seam: at equal power, or with `'linear'` at equal
 * amplitude (two stretches that are the same sound). Returns a `frames`-long copy.
 */
export function foldLoop(
  channel: Float32Array,
  frames: number,
  crossfade: number,
  fold: LoopFold = 'power',
): Float32Array {
  const out = channel.slice(0, frames)
  const span = Math.min(crossfade, frames, channel.length - frames)
  for (let i = 0; i < span; i += 1) {
    const along = (i + 0.5) / span
    const position = along * (Math.PI / 2)
    const [rise, fall] =
      fold === 'linear' ? [along, 1 - along] : [Math.sin(position), Math.cos(position)]
    out[i] = channel[i] * rise + channel[frames + i] * fall
  }
  return out
}

/** Peak of planar audio, linear. */
export function peakOf(channels: readonly Float32Array[]): number {
  let peak = 0
  for (const channel of channels) {
    for (const sample of channel) {
      const value = Math.abs(sample)
      if (value > peak) peak = value
    }
  }
  return peak
}

/**
 * Play `options.phrase` on the patch's instrument through its effects (or run
 * `options.input` through an effect chain) and return stereo audio. Every
 * device of the patch has to be a WASM device.
 */
export async function renderPatch(patch: Patch, options: RenderPatchOptions): Promise<PlanarAudio> {
  const sampleRate = options.sampleRate ?? 48000
  if (!(options.durationSec > 0))
    throw new Error('live-mix: renderPatch needs a positive durationSec')
  if (options.input && options.input.sampleRate !== sampleRate) {
    throw new Error(
      `live-mix: renderPatch input is at ${options.input.sampleRate} Hz, the render at ${sampleRate} Hz`,
    )
  }
  if (!patch.instrument && !options.input) {
    throw new Error(`live-mix: "${patch.id}" is an effect chain; renderPatch needs an input for it`)
  }

  const frames = Math.round(options.durationSec * sampleRate)
  const skip = Math.max(0, Math.round((options.skipSec ?? 0) * sampleRate))
  const crossfade = Math.max(0, Math.round((options.loopCrossfadeSec ?? 0) * sampleRate))
  const total = skip + frames + crossfade

  // A bypassed instrument is a switched-off note device: silence, as it is live.
  const instrument =
    patch.instrument && !patch.instrument.bypass
      ? await createStage(patch.instrument, sampleRate, options)
      : null
  const effects: Stage[] = []
  for (const device of patch.effects) {
    if (!device.bypass) effects.push(await createStage(device, sampleRate, options))
  }
  if (instrument && options.sample) instrument.loadSample(options.sample)
  if (instrument && !instrument.device.device_note_on) {
    throw new Error(`live-mix: ${instrument.id} takes no notes`)
  }

  const events = instrument ? phraseEvents(options.phrase, sampleRate) : []
  // The input as long as the render: what it lacks is the silence its tail rings into.
  const padded = (channel: Float32Array | undefined): Float32Array => {
    const out = new Float32Array(total)
    if (channel) out.set(channel.subarray(0, total))
    return out
  }
  const inputLeft = padded(options.input?.channels[0])
  const inputRight = padded(options.input?.channels[1] ?? options.input?.channels[0])
  const left = new Float32Array(total)
  const right = new Float32Array(total)
  const sliceMs = options.sliceMs ?? 12
  let sliceStart = performance.now()
  let cursor = 0
  let nextEvent = 0

  while (cursor < total) {
    while (nextEvent < events.length && events[nextEvent].frame <= cursor) {
      const event = events[nextEvent]
      if (event.on) instrument?.device.device_note_on?.(event.id, event.frequency, event.gain)
      else instrument?.device.device_note_off?.(event.id)
      nextEvent += 1
    }
    const untilEvent = nextEvent < events.length ? events[nextEvent].frame - cursor : BLOCK
    const count = Math.min(BLOCK, total - cursor, untilEvent)

    let blockLeft: Float32Array
    let blockRight: Float32Array
    if (instrument) {
      instrument.device.device_process(count)
      blockLeft = instrument.outLeft
      blockRight = instrument.outRight
    } else {
      blockLeft = inputLeft.subarray(cursor, cursor + count)
      blockRight = inputRight.subarray(cursor, cursor + count)
    }
    for (const effect of effects) {
      effect.inLeft.set(blockLeft.subarray(0, count))
      effect.inRight.set(blockRight.subarray(0, count))
      effect.device.device_process(count)
      blockLeft = effect.outLeft
      blockRight = effect.outRight
    }
    left.set(blockLeft.subarray(0, count), cursor)
    right.set(blockRight.subarray(0, count), cursor)
    cursor += count

    if (sliceMs > 0 && performance.now() - sliceStart >= sliceMs) {
      await nextTask()
      options.signal?.throwIfAborted()
      sliceStart = performance.now()
    }
  }

  const kept = [left, right].map((channel) => {
    const body = channel.subarray(skip)
    return crossfade > 0
      ? foldLoop(body, frames, crossfade, options.loopFold)
      : body.slice(0, frames)
  })

  let peak = peakOf(kept)
  if (!Number.isFinite(peak))
    throw new Error(`live-mix: "${patch.id}" rendered a non-finite sample`)
  if (options.normalizePeakDb !== undefined && peak > 0) {
    const scale = 10 ** (options.normalizePeakDb / 20) / peak
    for (const channel of kept) for (let i = 0; i < channel.length; i += 1) channel[i] *= scale
    peak *= scale
  }
  const fadeIn = Math.min(frames, Math.round((options.fadeInSec ?? 0) * sampleRate))
  const fadeOut = Math.min(frames, Math.round((options.fadeOutSec ?? 0) * sampleRate))
  for (const channel of kept) {
    for (let i = 0; i < fadeIn; i += 1) channel[i] *= i / fadeIn
    for (let i = 0; i < fadeOut; i += 1) channel[frames - 1 - i] *= i / fadeOut
  }
  return { channels: kept, sampleRate }
}
