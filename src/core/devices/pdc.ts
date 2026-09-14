// Plugin delay compensation (R12). Devices report what they delay the signal
// by; this module turns those reports into sample counts, provides the delay
// stage that makes up the difference (`AlignmentDelay`, a Device wrapping one
// DelayNode so it can sit in any insert chain), and computes the per-path
// latency report the engine exposes: every track, group and bus with its own
// insert latency, what it adds up to on the way to the master output, and how
// far behind the longest path it arrives.
//
// What is compensated and what is not:
// - Chains inside a `Rack` are aligned automatically to the longest chain.
// - `engine.alignLatency()` delays clip, instrument and return tracks so every
//   one arrives at the output together with the longest path.
// - Live-input tracks are monitored undelayed: they are reported, never
//   delayed, unless a host asks for it explicitly.
// - Plain buses (raw sources connect to `bus.input`), element tracks (no
//   strip), and sends into returns are reported but not aligned.
// - A device's latency counts whether or not it is bypassed, so toggling
//   bypass never moves delay lines.

import { type ParamSpec } from '../params'
import { type Device } from './Device'

/** Longest delay one alignment stage can add (the DelayNode's `maxDelayTime`). */
export const PDC_MAX_DELAY_SECONDS = 1

/** `Device.id` of every alignment stage; the report lists them as compensation, not latency. */
export const ALIGNMENT_DELAY_ID = 'pdc-delay'

/** The slice of a device the latency arithmetic reads. */
export type LatencySource = Pick<Device, 'latencySec' | 'latencySamples'>

/** Round seconds to whole samples, never negative. */
export function secondsToSamples(seconds: number, sampleRate: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0) return 0
  return Math.round(seconds * sampleRate)
}

/**
 * Sample-exact latency of one device at `sampleRate`: its `latencySamples`
 * when it reports one, otherwise `latencySec` rounded to samples.
 */
export function deviceLatencySamples(device: LatencySource, sampleRate: number): number {
  if (typeof device.latencySamples === 'number' && Number.isFinite(device.latencySamples)) {
    return Math.max(0, Math.round(device.latencySamples))
  }
  return secondsToSamples(device.latencySec, sampleRate)
}

/** Total latency of an insert chain, alignment stages excluded (they are compensation). */
export function chainLatencySamples(devices: Iterable<LatencySource>, sampleRate: number): number {
  let total = 0
  for (const device of devices) {
    if (isAlignmentDelay(device)) continue
    total += deviceLatencySamples(device, sampleRate)
  }
  return total
}

/** Total delay the alignment stages in a chain add. */
export function chainCompensationSamples(devices: Iterable<unknown>): number {
  let total = 0
  for (const device of devices) if (isAlignmentDelay(device)) total += device.delaySamples
  return total
}

export function isAlignmentDelay(device: unknown): device is AlignmentDelay {
  return device instanceof AlignmentDelay
}

export interface AlignmentDelayOptions {
  /** Initial delay. */
  delaySamples?: number
  /** `maxDelayTime` of the DelayNode. Default `PDC_MAX_DELAY_SECONDS`. */
  maxDelaySec?: number
}

/**
 * A pure delay line as a Device: one DelayNode (input and output), no
 * parameters, zero reported latency because what it adds is compensation.
 * Changes are structural (a path's alignment changed), so the new delay is
 * set at the current time rather than ramped — ramping a delay time would
 * pitch-shift the signal.
 */
export class AlignmentDelay implements Device {
  readonly id = ALIGNMENT_DELAY_ID
  readonly params: Readonly<Record<string, ParamSpec>> = {}
  readonly latencySec = 0
  readonly latencySamples = 0
  readonly node: DelayNode
  readonly maxDelaySamples: number
  private readonly context: BaseAudioContext
  private samples = 0
  private bypassed = false
  private disposed = false

  constructor(context: BaseAudioContext, options: AlignmentDelayOptions = {}) {
    this.context = context
    const maxDelaySec = options.maxDelaySec ?? PDC_MAX_DELAY_SECONDS
    this.maxDelaySamples = Math.max(0, Math.floor(maxDelaySec * context.sampleRate))
    this.node = context.createDelay(maxDelaySec)
    this.node.delayTime.value = 0
    if (options.delaySamples) this.setDelaySamples(options.delaySamples)
  }

  get input(): AudioNode {
    return this.node
  }

  get output(): AudioNode {
    return this.node
  }

  /** Current compensation in samples (0 while bypassed). */
  get delaySamples(): number {
    return this.bypassed ? 0 : this.samples
  }

  get delaySec(): number {
    return this.delaySamples / this.context.sampleRate
  }

  /** Set the delay; clamped to `maxDelaySamples`. Returns what was applied. */
  setDelaySamples(samples: number): number {
    const clamped = Number.isFinite(samples)
      ? Math.min(this.maxDelaySamples, Math.max(0, Math.round(samples)))
      : 0
    if (clamped !== this.samples) {
      this.samples = clamped
      if (!this.bypassed) this.write(clamped)
    }
    return clamped
  }

  setParam(name: string, _value: number): void {
    throw new Error(`live-mix: ${this.id} has no parameter "${name}"`)
  }

  getParam(name: string): number {
    throw new Error(`live-mix: ${this.id} has no parameter "${name}"`)
  }

  get bypass(): boolean {
    return this.bypassed
  }

  /** Bypassing an alignment stage removes its delay (and restores it on return). */
  set bypass(enabled: boolean) {
    if (this.bypassed === enabled) return
    this.bypassed = enabled
    this.write(enabled ? 0 : this.samples)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.node.disconnect()
  }

  private write(samples: number): void {
    if (this.disposed) return
    this.node.delayTime.setValueAtTime(samples / this.context.sampleRate, this.context.currentTime)
  }
}

export type LatencyPathKind =
  'track' | 'live-input' | 'instrument' | 'return' | 'group' | 'bus' | 'master'

/** What the report needs to know about one path (the engine assembles these). */
export interface LatencyPathInput {
  /** Unique key, e.g. `track/music`; `destination` refers to another path's key. */
  key: string
  name: string
  kind: LatencyPathKind
  /** The path's insert chain (for the master: inserts then the limiter). */
  devices: readonly (LatencySource & { id: string })[]
  /** Key of the path this one feeds, or null at the terminus (or an external node). */
  destination: string | null
  /** May receive an alignment stage. Default true; the engine sets false for live inputs. */
  alignable?: boolean
}

export interface DeviceLatency {
  id: string
  latencySamples: number
  /** True for alignment stages: listed for completeness, counted as compensation. */
  compensation: boolean
}

export interface PathLatency {
  key: string
  name: string
  kind: LatencyPathKind
  /** Latency of this path's own devices (racks included; compensation excluded). */
  ownSamples: number
  /** Alignment delay inserted in this path. */
  compensationSamples: number
  /** Own latency plus every downstream path's, i.e. how late this path's signal reaches the output. */
  latencySamples: number
  /** `latencySamples` plus every alignment delay on the way — when the signal actually arrives. */
  arrivalSamples: number
  arrivalSec: number
  /** Extra delay this path would need to arrive with the latest one; 0 for the latest. */
  deficitSamples: number
  devices: DeviceLatency[]
  destination: string | null
  alignable: boolean
}

export interface LatencyReport {
  sampleRate: number
  /** The master chain's own latency (inserts and limiter): what even a zero-latency track lags by. */
  masterSamples: number
  /** The longest raw path latency. */
  maxLatencySamples: number
  /** The latest arrival, compensation included: what `alignLatency` brings every alignable path to. */
  maxArrivalSamples: number
  paths: PathLatency[]
}

function describeDevices(
  devices: readonly (LatencySource & { id: string })[],
  sampleRate: number,
): DeviceLatency[] {
  return devices.map((device) =>
    isAlignmentDelay(device)
      ? { id: device.id, latencySamples: device.delaySamples, compensation: true }
      : {
          id: device.id,
          latencySamples: deviceLatencySamples(device, sampleRate),
          compensation: false,
        },
  )
}

/**
 * Resolve every path's latency to the output by following `destination`
 * links. Unknown destinations count as the terminus; a routing cycle is
 * broken at its first repeated path (latency accumulates once).
 */
export function buildLatencyReport(
  inputs: readonly LatencyPathInput[],
  sampleRate: number,
): LatencyReport {
  const byKey = new Map<string, LatencyPathInput>()
  for (const input of inputs) {
    if (byKey.has(input.key)) throw new Error(`live-mix: duplicate latency path "${input.key}"`)
    byKey.set(input.key, input)
  }
  const own = new Map<string, { latency: number; compensation: number }>()
  for (const input of inputs) {
    own.set(input.key, {
      latency: chainLatencySamples(input.devices, sampleRate),
      compensation: chainCompensationSamples(input.devices),
    })
  }
  const totals = new Map<string, { latency: number; arrival: number }>()
  const resolve = (key: string, trail: Set<string>): { latency: number; arrival: number } => {
    const cached = totals.get(key)
    if (cached) return cached
    const input = byKey.get(key)
    const here = own.get(key)
    if (!input || !here) return { latency: 0, arrival: 0 }
    let downstream = { latency: 0, arrival: 0 }
    if (input.destination !== null && !trail.has(input.destination)) {
      trail.add(key)
      downstream = resolve(input.destination, trail)
      trail.delete(key)
    }
    const total = {
      latency: here.latency + downstream.latency,
      arrival: here.latency + here.compensation + downstream.arrival,
    }
    totals.set(key, total)
    return total
  }
  for (const input of inputs) resolve(input.key, new Set())

  let maxLatencySamples = 0
  let maxArrivalSamples = 0
  for (const total of totals.values()) {
    maxLatencySamples = Math.max(maxLatencySamples, total.latency)
    maxArrivalSamples = Math.max(maxArrivalSamples, total.arrival)
  }
  const master = inputs.find((input) => input.kind === 'master')
  const paths = inputs.map((input): PathLatency => {
    const here = own.get(input.key) ?? { latency: 0, compensation: 0 }
    const total = totals.get(input.key) ?? { latency: 0, arrival: 0 }
    return {
      key: input.key,
      name: input.name,
      kind: input.kind,
      ownSamples: here.latency,
      compensationSamples: here.compensation,
      latencySamples: total.latency,
      arrivalSamples: total.arrival,
      arrivalSec: total.arrival / sampleRate,
      deficitSamples: maxArrivalSamples - total.arrival,
      devices: describeDevices(input.devices, sampleRate),
      destination: input.destination,
      alignable: input.alignable ?? true,
    }
  })
  return {
    sampleRate,
    masterSamples: master ? (own.get(master.key)?.latency ?? 0) : 0,
    maxLatencySamples,
    maxArrivalSamples,
    paths,
  }
}
