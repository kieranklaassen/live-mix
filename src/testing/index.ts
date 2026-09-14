// `@kieranklaassen/live-mix/testing` — a recording Web Audio mock.
//
// Lifted from Breathwork Live's musicEngine.test.ts harness and made
// framework-free: every AudioParam automation call and every node
// connect/start/stop is recorded so tests assert behaviour at the AudioParam
// boundary (what the graph was told to do) rather than on internals. Works in
// plain Node under any test runner; no jsdom, no vi.fn.

export interface ParamEvent {
  method: string
  args: unknown[]
}

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

export class MockAudioParam {
  value = 1
  readonly events: ParamEvent[] = []

  private record(method: string, args: unknown[]) {
    this.events.push({ method, args })
  }

  setValueAtTime(...args: unknown[]): this {
    this.record('setValueAtTime', args)
    return this
  }
  linearRampToValueAtTime(...args: unknown[]): this {
    this.record('linearRampToValueAtTime', args)
    return this
  }
  exponentialRampToValueAtTime(...args: unknown[]): this {
    this.record('exponentialRampToValueAtTime', args)
    return this
  }
  setValueCurveAtTime(...args: unknown[]): this {
    this.record('setValueCurveAtTime', args)
    return this
  }
  setTargetAtTime(...args: unknown[]): this {
    this.record('setTargetAtTime', args)
    return this
  }
  cancelScheduledValues(...args: unknown[]): this {
    this.record('cancelScheduledValues', args)
    return this
  }
  cancelAndHoldAtTime(...args: unknown[]): this {
    this.record('cancelAndHoldAtTime', args)
    return this
  }

  eventsFor(method: string): ParamEvent[] {
    return this.events.filter((e) => e.method === method)
  }

  lastEvent(method: string): ParamEvent | undefined {
    const events = this.eventsFor(method)
    return events[events.length - 1]
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

  constructor(kind: string) {
    this.kind = kind
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

  /** True if `target` is reachable from this node through recorded connections. */
  reaches(target: MockAudioNode, seen = new Set<MockAudioNode>()): boolean {
    if (this === target) return true
    if (seen.has(this)) return false
    seen.add(this)
    for (const next of this.outputs) if (next.reaches(target, seen)) return true
    return false
  }
}

export class MockGainNode extends MockAudioNode {
  readonly gain = new MockAudioParam()
  constructor() {
    super('gain')
  }
}

export class MockAudioBuffer {
  readonly numberOfChannels: number
  readonly length: number
  readonly sampleRate: number
  readonly duration: number
  private readonly channels: Float32Array[]

  constructor(numberOfChannels: number, length: number, sampleRate: number) {
    this.numberOfChannels = numberOfChannels
    this.length = length
    this.sampleRate = sampleRate
    this.duration = sampleRate > 0 ? length / sampleRate : 0
    this.channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length))
  }

  getChannelData(channel: number): Float32Array {
    return this.channels[channel] ?? new Float32Array(this.length)
  }
}

export class MockBufferSource extends MockAudioNode {
  buffer: MockAudioBuffer | null = null
  loop = false
  loopStart = 0
  loopEnd = 0
  readonly playbackRate = new MockAudioParam()
  readonly startCalls = new CallRecorder()
  readonly stopCalls = new CallRecorder()
  onended: (() => void) | null = null

  constructor() {
    super('buffer-source')
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
  /** Test-controlled instantaneous signal level (fills the time-domain buffer). */
  level = 0

  constructor() {
    super('analyser')
  }

  getFloatTimeDomainData(array: Float32Array): void {
    array.fill(this.level)
  }

  getByteTimeDomainData(array: Uint8Array): void {
    array.fill(128 + Math.round(this.level * 127))
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
  readonly frequency = new MockAudioParam()
  readonly Q = new MockAudioParam()
  readonly gain = new MockAudioParam()
  readonly detune = new MockAudioParam()
  constructor() {
    super('biquad')
  }
}

export class MockStereoPannerNode extends MockAudioNode {
  readonly pan = new MockAudioParam()
  constructor() {
    super('stereo-panner')
    this.pan.value = 0
  }
}

export class MockMediaStream {
  readonly id: string
  constructor(id = 'mock-stream') {
    this.id = id
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

export class MockMessagePort {
  readonly posted = new CallRecorder()
  onmessage: ((event: { data: unknown }) => void) | null = null

  postMessage(message: unknown, transfer?: unknown[]): void {
    this.posted.record([message, transfer])
  }

  /** Deliver a message as if it came from the other side of the port. */
  receive(data: unknown): void {
    this.onmessage?.({ data })
  }
}

export class MockAudioWorkletNode extends MockAudioNode {
  readonly name: string
  readonly options: unknown
  readonly port = new MockMessagePort()
  readonly parameters = new Map<string, MockAudioParam>()

  constructor(name: string, options: unknown) {
    super('audio-worklet')
    this.name = name
    this.options = options
  }
}

export class MockAudioContext {
  currentTime = 0
  sampleRate = 44100
  state: 'suspended' | 'running' | 'closed' = 'running'
  readonly destination = new MockAudioNode('destination')
  readonly gains: MockGainNode[] = []
  readonly sources: MockBufferSource[] = []
  readonly analysers: MockAnalyserNode[] = []
  readonly convolvers: MockConvolverNode[] = []
  readonly filters: MockBiquadFilterNode[] = []
  readonly panners: MockStereoPannerNode[] = []
  readonly streamDestinations: MockMediaStreamDestination[] = []
  readonly streamSources: MockMediaStreamSource[] = []
  readonly workletNodes: MockAudioWorkletNode[] = []
  readonly decodeCalls = new CallRecorder()
  readonly audioWorklet = {
    modules: [] as string[],
    addModule: (url: string): Promise<void> => {
      this.audioWorklet.modules.push(url)
      return Promise.resolve()
    },
  }

  createGain(): MockGainNode {
    const node = new MockGainNode()
    this.gains.push(node)
    return node
  }

  createBufferSource(): MockBufferSource {
    const node = new MockBufferSource()
    this.sources.push(node)
    return node
  }

  createAnalyser(): MockAnalyserNode {
    const node = new MockAnalyserNode()
    this.analysers.push(node)
    return node
  }

  createConvolver(): MockConvolverNode {
    const node = new MockConvolverNode()
    this.convolvers.push(node)
    return node
  }

  createBiquadFilter(): MockBiquadFilterNode {
    const node = new MockBiquadFilterNode()
    this.filters.push(node)
    return node
  }

  createStereoPanner(): MockStereoPannerNode {
    const node = new MockStereoPannerNode()
    this.panners.push(node)
    return node
  }

  createMediaStreamDestination(): MockMediaStreamDestination {
    const node = new MockMediaStreamDestination()
    this.streamDestinations.push(node)
    return node
  }

  createMediaStreamSource(stream: unknown): MockMediaStreamSource {
    const node = new MockMediaStreamSource(stream)
    this.streamSources.push(node)
    return node
  }

  createBuffer(channels: number, length: number, rate: number): MockAudioBuffer {
    return new MockAudioBuffer(channels, length, rate)
  }

  /**
   * Decodes to a buffer whose duration in seconds equals the byte length, so
   * fixtures can pick durations by sizing an ArrayBuffer. Mirrors the
   * Breathwork Live harness.
   */
  decodeAudioData(data: ArrayBuffer): Promise<MockAudioBuffer> {
    this.decodeCalls.record([data])
    const seconds = data.byteLength
    return Promise.resolve(new MockAudioBuffer(2, seconds * this.sampleRate, this.sampleRate))
  }

  createWorkletNode(name: string, options: unknown): MockAudioWorkletNode {
    const node = new MockAudioWorkletNode(name, options)
    this.workletNodes.push(node)
    return node
  }

  resume(): Promise<void> {
    this.state = 'running'
    return Promise.resolve()
  }

  suspend(): Promise<void> {
    this.state = 'suspended'
    return Promise.resolve()
  }

  close(): Promise<void> {
    this.state = 'closed'
    return Promise.resolve()
  }

  /** Move the audio clock forward. */
  advance(seconds: number): void {
    this.currentTime += seconds
  }
}

/** Cast helper: hand a mock to code that wants a real `AudioContext`. */
export function asAudioContext(mock: MockAudioContext): AudioContext {
  return mock as unknown as AudioContext
}

/** Cast helper for a single node. */
export function asAudioNode(mock: MockAudioNode): AudioNode {
  return mock as unknown as AudioNode
}
