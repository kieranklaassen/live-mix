// Mock Web Audio nodes. Every node records connect/disconnect targets;
// sources record start/stop calls. With `configureMocks({ spy })` those
// methods are also runner spies, so `toHaveBeenCalledWith` assertions from
// the Breathwork Live harness work unchanged.

import { spyOn } from './configure'
import { MockAudioParam } from './mock-audio-param'

/** Records every call made through a method so tests can assert on it. */
export class CallRecorder {
  readonly calls: unknown[][] = []

  record(args: unknown[]): void {
    this.calls.push(args)
  }

  get count(): number {
    return this.calls.length
  }

  get last(): unknown[] | undefined {
    return this.calls[this.calls.length - 1]
  }

  calledWith(...args: unknown[]): boolean {
    return this.calls.some(
      (call) => call.length >= args.length && args.every((arg, index) => call[index] === arg),
    )
  }
}

let nextNodeId = 1

/** Base for every mock node: records connect/disconnect targets. */
export class MockAudioNode {
  readonly id: number = nextNodeId++
  readonly kind: string
  readonly connectCalls = new CallRecorder()
  readonly disconnectCalls = new CallRecorder()
  /** Live set of nodes this node currently feeds. */
  readonly outputs = new Set<MockAudioNode>()
  numberOfInputs = 1
  numberOfOutputs = 1
  channelCount = 2
  channelCountMode = 'max'
  channelInterpretation = 'speakers'

  constructor(kind: string) {
    this.kind = kind
    this.connect = spyOn(this.connect.bind(this))
    this.disconnect = spyOn(this.disconnect.bind(this))
  }

  connect(target: MockAudioNode | MockAudioParam, ...rest: unknown[]): MockAudioNode {
    this.connectCalls.record([target, ...rest])
    if (target instanceof MockAudioNode) this.outputs.add(target)
    return target as MockAudioNode
  }

  disconnect(...args: unknown[]): void {
    this.disconnectCalls.record(args)
    const [target] = args
    if (target instanceof MockAudioNode) this.outputs.delete(target)
    else this.outputs.clear()
  }

  isConnectedTo(target: MockAudioNode): boolean {
    return this.outputs.has(target)
  }

  /** True if `target` is reachable from this node through live connections. */
  reaches(target: MockAudioNode, seen = new Set<MockAudioNode>()): boolean {
    if (this === target) return true
    if (seen.has(this)) return false
    seen.add(this)
    for (const next of this.outputs) if (next.reaches(target, seen)) return true
    return false
  }
}

export class MockGainNode extends MockAudioNode {
  readonly gain = new MockAudioParam(1)
  constructor() {
    super('gain')
  }
}

export class MockAudioBuffer {
  readonly numberOfChannels: number
  readonly length: number
  readonly sampleRate: number
  readonly duration: number
  private channels: Float32Array[] | null = null

  constructor(numberOfChannels: number, length: number, sampleRate: number) {
    this.numberOfChannels = numberOfChannels
    this.length = length
    this.sampleRate = sampleRate
    this.duration = sampleRate > 0 ? length / sampleRate : 0
  }

  /** Channel data is allocated on first access so long fixture buffers stay cheap. */
  getChannelData(channel: number): Float32Array {
    this.channels ??= Array.from(
      { length: this.numberOfChannels },
      () => new Float32Array(this.length),
    )
    return this.channels[channel] ?? new Float32Array(this.length)
  }

  copyFromChannel(destination: Float32Array, channel: number, startInChannel = 0): void {
    destination.set(
      this.getChannelData(channel).subarray(startInChannel, startInChannel + destination.length),
    )
  }

  copyToChannel(source: Float32Array, channel: number, startInChannel = 0): void {
    this.getChannelData(channel).set(source, startInChannel)
  }
}

export class MockBufferSource extends MockAudioNode {
  buffer: MockAudioBuffer | null = null
  loop = false
  loopStart = 0
  loopEnd = 0
  readonly playbackRate = new MockAudioParam(1)
  readonly detune = new MockAudioParam(0)
  readonly startCalls = new CallRecorder()
  readonly stopCalls = new CallRecorder()
  onended: (() => void) | null = null

  constructor() {
    super('buffer-source')
    this.start = spyOn(this.start.bind(this))
    this.stop = spyOn(this.stop.bind(this))
  }

  start(...args: unknown[]): void {
    this.startCalls.record(args)
  }

  stop(...args: unknown[]): void {
    this.stopCalls.record(args)
  }

  /** Simulate the source reaching its end (fires `onended`). */
  finish(): void {
    this.onended?.()
  }
}

export class MockAnalyserNode extends MockAudioNode {
  fftSize = 2048
  minDecibels = -100
  maxDecibels = -30
  smoothingTimeConstant = 0.8
  /** Test-controlled instantaneous signal level (fills the time-domain buffer). */
  level = 0

  constructor() {
    super('analyser')
  }

  get frequencyBinCount(): number {
    return this.fftSize / 2
  }

  getFloatTimeDomainData(array: Float32Array): void {
    array.fill(this.level)
  }

  getByteTimeDomainData(array: Uint8Array): void {
    array.fill(128 + Math.round(this.level * 127))
  }

  getFloatFrequencyData(array: Float32Array): void {
    array.fill(this.level > 0 ? 20 * Math.log10(this.level) : -Infinity)
  }

  getByteFrequencyData(array: Uint8Array): void {
    array.fill(Math.round(this.level * 255))
  }
}

export class MockConvolverNode extends MockAudioNode {
  buffer: MockAudioBuffer | null = null
  normalize = true
  constructor() {
    super('convolver')
  }
}

export class MockBiquadFilterNode extends MockAudioNode {
  type = 'lowpass'
  readonly frequency = new MockAudioParam(350)
  readonly Q = new MockAudioParam(1)
  readonly gain = new MockAudioParam(0)
  readonly detune = new MockAudioParam(0)
  constructor() {
    super('biquad')
  }
}

export class MockDelayNode extends MockAudioNode {
  readonly delayTime = new MockAudioParam(0)
  constructor() {
    super('delay')
  }
}

export class MockDynamicsCompressorNode extends MockAudioNode {
  readonly threshold = new MockAudioParam(-24)
  readonly knee = new MockAudioParam(30)
  readonly ratio = new MockAudioParam(12)
  readonly attack = new MockAudioParam(0.003)
  readonly release = new MockAudioParam(0.25)
  reduction = 0
  constructor() {
    super('dynamics-compressor')
  }
}

export class MockStereoPannerNode extends MockAudioNode {
  readonly pan = new MockAudioParam(0)
  constructor() {
    super('stereo-panner')
  }
}

export class MockOscillatorNode extends MockAudioNode {
  type = 'sine'
  readonly frequency = new MockAudioParam(440)
  readonly detune = new MockAudioParam(0)
  readonly startCalls = new CallRecorder()
  readonly stopCalls = new CallRecorder()
  onended: (() => void) | null = null

  constructor() {
    super('oscillator')
    this.start = spyOn(this.start.bind(this))
    this.stop = spyOn(this.stop.bind(this))
  }

  start(...args: unknown[]): void {
    this.startCalls.record(args)
  }

  stop(...args: unknown[]): void {
    this.stopCalls.record(args)
  }
}

export class MockMediaStream {
  readonly id: string
  constructor(id = 'mock-stream') {
    this.id = id
  }
  getAudioTracks(): unknown[] {
    return []
  }
}

export class MockMediaStreamDestination extends MockAudioNode {
  readonly stream = new MockMediaStream('mix-stream')
  constructor() {
    super('media-stream-destination')
  }
}

export class MockMediaStreamSource extends MockAudioNode {
  readonly mediaStream: unknown
  constructor(mediaStream: unknown) {
    super('media-stream-source')
    this.mediaStream = mediaStream
  }
}

export class MockMediaElementSource extends MockAudioNode {
  readonly mediaElement: unknown
  constructor(mediaElement: unknown) {
    super('media-element-source')
    this.mediaElement = mediaElement
  }
}

export class MockMessagePort {
  readonly posted = new CallRecorder()
  onmessage: ((event: { data: unknown }) => void) | null = null

  constructor() {
    this.postMessage = spyOn(this.postMessage.bind(this))
  }

  postMessage(message: unknown, transfer?: unknown[]): void {
    this.posted.record([message, transfer])
  }

  /** Deliver a message as if it came from the other side of the port. */
  receive(data: unknown): void {
    this.onmessage?.({ data })
  }

  start(): void {}
  close(): void {}
}

export class MockAudioWorkletNode extends MockAudioNode {
  readonly name: string
  readonly options: unknown
  readonly port = new MockMessagePort()
  readonly parameters = new Map<string, MockAudioParam>()
  onprocessorerror: ((event: unknown) => void) | null = null

  constructor(name: string, options: unknown) {
    super('audio-worklet')
    this.name = name
    this.options = options
  }
}
