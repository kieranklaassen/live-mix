// The page side of the check that a bypassed device and an aligned strip are
// exact over a whole render. White noise made here is bounced through
// `renderScore` on a real OfflineAudioContext, and the bounce is held against
// the same noise moved later by a count of samples the spec names:
//
// - a device the score marks bypassed passes its input as late as it reports,
//   from the first sample of the render;
// - a strip the engine delays to line it up with one that holds such a device
//   comes out that many samples late, to the last sample of its sound.
//
// The noise ends half a second before the render does. A delay that lets go
// of what it holds when its source ends, or that reads between two samples,
// is in the numbers: white noise has no two neighbouring samples alike.
//
// The last measure is of the stage alone, at many counts of samples: a
// browser's delay line takes its time in seconds, and whether a count of
// samples written that way is read back whole is the browser's to say.

import {
  AlignmentDelay,
  createScore,
  defaultStrip,
  masterDestination,
  renderScore,
  renderScoreStems,
  type Clip,
  type LatencyReport,
  type Score,
  type ScoreDevice,
} from '@kieranklaassen/live-mix'
import { registerStockWasmDevices } from '@kieranklaassen/live-mix/dsp'

const NOISE_SECONDS = 1.5
/** The render goes on this long after the noise has ended. */
const AFTER_SECONDS = 0.5
/** What a head is measured over, past the first sample that sounds: 100 ms at 48 kHz. */
const HEAD_FRAMES = 4800

export interface LateCase {
  rate: 44100 | 48000
  channels: 1 | 2
  /** The device on the first strip, which the score marks bypassed. */
  deviceId: string
  /** What the device is set to: far from passing its input as it came, so a device left working shows. */
  params?: Record<string, number>
  /** How late the noise must come out, in samples. Not read from the engine. */
  delaySamples: number
}

/** A render held against the noise made `delaySamples` late. Levels are in dB under full scale, -200 for none. */
export interface LateMeasure {
  /** The largest sample of the difference over the whole render. */
  wholeDb: number
  /** The same from the first sample of the render to 100 ms past where the noise comes in. */
  headDb: number
  /** The same over the last `delaySamples` of the late noise, which sound after its source has ended; -200 where the delay is none. */
  tailDb: number
  /** The whole render against the late noise with its last `delaySamples` silent: what a delay that lets go would show. As `wholeDb` where the delay is none. */
  tailZeroedDb: number
  /** The whole render against the noise one sample later still. */
  movedByOneDb: number
  /** Whether the render has the channels and the frames asked for. */
  sameShape: boolean
}

export interface BypassedMeasure extends LateMeasure {
  /** What the strip's own devices take, as the render reports it. */
  reportedSamples: number
}

export interface AlignedMeasure {
  /** What the first strip's device takes, as the render reports it. */
  reportedSamples: number
  /** The delay the engine put on the second strip, as the render reports it. */
  compensationSamples: number
  /** The second strip by itself. */
  second: LateMeasure
  /** Both strips together, against the late noise twice over. */
  both: LateMeasure
}

const db = (sample: number): number => (sample > 0 ? 20 * Math.log10(sample) : -200)

/** White noise, the same for one rate and count of channels every time, each channel its own. */
function noise(rate: number, channels: number): Float32Array[] {
  let state = 0x1234_5678
  return Array.from({ length: channels }, () => {
    const data = new Float32Array(Math.round(NOISE_SECONDS * rate))
    for (let i = 0; i < data.length; i += 1) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0
      data[i] = 0.8 * (state / 4294967296 - 0.5)
    }
    return data
  })
}

function bufferOf(sound: readonly Float32Array[], rate: number): AudioBuffer {
  const made = new AudioBuffer({
    numberOfChannels: sound.length,
    length: sound[0].length,
    sampleRate: rate,
  })
  sound.forEach((channel, index) => made.copyToChannel(new Float32Array(channel), index))
  return made
}

/** The whole sound from 0, with no fade: its source ends where the sound does. */
function clip(id: string): Clip {
  return {
    id: `${id}-clip`,
    sourceId: 'noise',
    startSec: 0,
    offsetSec: 0,
    durationSec: NOISE_SECONDS,
    fadeInSec: 0,
    fadeOutSec: 0,
    fadeCurve: 'linear',
    gainDb: 0,
  }
}

function bypassed(spec: LateCase): ScoreDevice {
  return { id: 'held', deviceId: spec.deviceId, params: spec.params ?? {}, bypass: true }
}

/** `tracks` strips that each play the noise; the first holds the bypassed device. */
function scoreOf(spec: LateCase, tracks: readonly string[]): Score {
  const score = createScore({ id: 'late' })
  score.sources = [{ id: 'noise', durationSec: NOISE_SECONDS }]
  score.tracks = tracks.map((id, index) => ({
    kind: 'audio',
    id,
    name: id,
    destination: masterDestination(),
    strip: defaultStrip(index === 0 ? { inserts: [bypassed(spec)] } : {}),
    clips: [clip(id)],
  }))
  return score
}

/** `sound` times `gain`, `delay` samples late, in a render of `frames`: each product taken as a sample is kept. */
function late(
  sound: readonly Float32Array[],
  delay: number,
  frames: number,
  gain: number,
  silentFrom = Infinity,
): Float32Array[] {
  return sound.map((channel) => {
    const data = new Float32Array(frames)
    for (let i = 0; i < channel.length && i + delay < frames; i += 1) {
      if (i >= silentFrom) break
      data[i + delay] = gain * channel[i]
    }
    return data
  })
}

function largestDifference(
  a: readonly Float32Array[],
  b: readonly Float32Array[],
  from: number,
  to: number,
): number {
  let largest = 0
  for (let channel = 0; channel < b.length; channel += 1) {
    for (let i = from; i < to; i += 1) {
      largest = Math.max(largest, Math.abs((a[channel]?.[i] ?? 0) - b[channel][i]))
    }
  }
  return largest
}

function hold(
  rendered: readonly Float32Array[],
  sound: readonly Float32Array[],
  delay: number,
  frames: number,
  gain: number,
): LateMeasure {
  const expected = late(sound, delay, frames, gain)
  const length = sound[0].length
  const ends = length + delay
  return {
    wholeDb: db(largestDifference(rendered, expected, 0, frames)),
    headDb: db(largestDifference(rendered, expected, 0, delay + HEAD_FRAMES)),
    tailDb: db(largestDifference(rendered, expected, ends - delay, ends)),
    tailZeroedDb: db(
      largestDifference(rendered, late(sound, delay, frames, gain, length - delay), 0, frames),
    ),
    movedByOneDb: db(largestDifference(rendered, late(sound, delay + 1, frames, gain), 0, frames)),
    sameShape:
      rendered.length === sound.length && rendered.every((channel) => channel.length === frames),
  }
}

function renderOptions(spec: LateCase, sound: readonly Float32Array[]) {
  return {
    durationSec: NOISE_SECONDS + AFTER_SECONDS,
    sampleRate: spec.rate,
    numberOfChannels: spec.channels,
    renderer: { resolveSource: () => bufferOf(sound, spec.rate) },
  }
}

const framesOf = (spec: LateCase): number => Math.round((NOISE_SECONDS + AFTER_SECONDS) * spec.rate)

const pathOf = (report: LatencyReport, track: string) =>
  report.paths.find((path) => path.key === `track/${track}`)

/** One strip that holds the bypassed device: the bounce is the noise as late as the device reports. */
async function measureBypassed(spec: LateCase): Promise<BypassedMeasure> {
  const sound = noise(spec.rate, spec.channels)
  const bounce = await renderScore(scoreOf(spec, ['a']), renderOptions(spec, sound))
  const rendered = bounce.audio.channels
  const reportedSamples = pathOf(bounce.latency, 'a')?.ownSamples ?? -1
  bounce.engine.dispose()
  return {
    reportedSamples,
    ...hold(rendered, sound, spec.delaySamples, framesOf(spec), 1),
  }
}

/** Two strips play the noise. The first holds the bypassed device, so the engine delays the second. */
async function measureAligned(spec: LateCase): Promise<AlignedMeasure> {
  const sound = noise(spec.rate, spec.channels)
  const stems = await renderScoreStems(scoreOf(spec, ['a', 'b']), {
    ...renderOptions(spec, sound),
    stems: ['b'],
  })
  const report = stems.b.latency
  const measured: AlignedMeasure = {
    reportedSamples: pathOf(report, 'a')?.ownSamples ?? -1,
    compensationSamples: pathOf(report, 'b')?.compensationSamples ?? -1,
    second: hold(stems.b.audio.channels, sound, spec.delaySamples, framesOf(spec), 1),
    both: hold(stems.master.audio.channels, sound, spec.delaySamples, framesOf(spec), 2),
  }
  for (const result of Object.values(stems)) result.engine.dispose()
  return measured
}

export async function measureBypassedDevices<Name extends string>(
  cases: Record<Name, LateCase>,
): Promise<Record<Name, BypassedMeasure>> {
  registerStockWasmDevices()
  const out = {} as Record<Name, BypassedMeasure>
  for (const name of Object.keys(cases) as Name[]) out[name] = await measureBypassed(cases[name])
  return out
}

export async function measureAlignedStrips<Name extends string>(
  cases: Record<Name, LateCase>,
): Promise<Record<Name, AlignedMeasure>> {
  registerStockWasmDevices()
  const out = {} as Record<Name, AlignedMeasure>
  for (const name of Object.keys(cases) as Name[]) out[name] = await measureAligned(cases[name])
  return out
}

export interface DelayCountsMeasure {
  /** The largest difference at any count, in dB under full scale; -200 for none. */
  worstDb: number
  /** The count it was at. */
  worstCount: number
  /** How many counts were rendered. */
  counts: number
}

const COUNT_FRAMES = 1024

/**
 * A short noise through one alignment stage set to each of `counts`, in a
 * render that ends as the last of the noise comes out: how far what comes
 * out is from the noise that many samples late, at the worst count.
 */
export async function measureDelayCounts(
  rate: number,
  counts: readonly number[],
): Promise<DelayCountsMeasure> {
  const sound = noise(rate, 2).map((channel) => channel.subarray(0, COUNT_FRAMES))
  let worst = 0
  let worstCount = counts[0]
  for (const count of counts) {
    const frames = count + COUNT_FRAMES
    const context = new OfflineAudioContext(2, frames, rate)
    const stage = new AlignmentDelay(context, { delaySamples: count })
    const source = context.createBufferSource()
    source.buffer = bufferOf(sound, rate)
    source.connect(stage.input)
    stage.output.connect(context.destination)
    source.start(0)
    const heard = await context.startRendering()
    const rendered = [heard.getChannelData(0), heard.getChannelData(1)]
    const difference = largestDifference(rendered, late(sound, count, frames, 1), 0, frames)
    if (difference > worst) {
      worst = difference
      worstCount = count
    }
    stage.dispose()
  }
  return { worstDb: db(worst), worstCount, counts: counts.length }
}
