// A recording stand-in for AudioContext. Every factory method appends the node
// to a typed list (`gains`, `sources`, …) in creation order, which is how the
// Breathwork Live harness addresses nodes (`ctx.gains[1]` is the duck bus).

import { spyOn } from './configure'
import {
  CallRecorder,
  MockAnalyserNode,
  MockAudioBuffer,
  MockAudioNode,
  MockAudioWorkletNode,
  MockBiquadFilterNode,
  MockBufferSource,
  MockConvolverNode,
  MockDelayNode,
  MockDynamicsCompressorNode,
  MockGainNode,
  MockMediaElementSource,
  MockMediaStreamDestination,
  MockMediaStreamSource,
  MockOscillatorNode,
  MockStereoPannerNode,
} from './mock-nodes'

export interface MockAudioContextOptions {
  sampleRate?: number
  currentTime?: number
  /**
   * What `decodeAudioData` returns for a given input. The default decodes an
   * `ArrayBuffer` of N bytes to a buffer N seconds long, so fixtures pick
   * durations by sizing an ArrayBuffer (Breathwork Live harness convention).
   */
  decode?: (data: ArrayBuffer, ctx: MockAudioContext) => MockAudioBuffer
}

export class MockAudioContext {
  currentTime: number
  readonly sampleRate: number
  state: 'suspended' | 'running' | 'closed' = 'running'
  readonly baseLatency = 0
  readonly outputLatency = 0
  readonly destination = new MockAudioNode('destination')
  readonly listener = {}

  readonly gains: MockGainNode[] = []
  readonly sources: MockBufferSource[] = []
  readonly oscillators: MockOscillatorNode[] = []
  readonly analysers: MockAnalyserNode[] = []
  readonly convolvers: MockConvolverNode[] = []
  readonly filters: MockBiquadFilterNode[] = []
  readonly delays: MockDelayNode[] = []
  readonly compressors: MockDynamicsCompressorNode[] = []
  readonly panners: MockStereoPannerNode[] = []
  readonly streamDestinations: MockMediaStreamDestination[] = []
  readonly streamSources: MockMediaStreamSource[] = []
  readonly elementSources: MockMediaElementSource[] = []
  readonly workletNodes: MockAudioWorkletNode[] = []
  readonly decodeCalls = new CallRecorder()
  private readonly attachedElements = new WeakSet<object>()

  readonly audioWorklet: {
    readonly modules: string[]
    addModule(url: string): Promise<void>
  }

  private readonly decode: (data: ArrayBuffer, ctx: MockAudioContext) => MockAudioBuffer

  constructor(options: MockAudioContextOptions = {}) {
    this.sampleRate = options.sampleRate ?? 44100
    this.currentTime = options.currentTime ?? 0
    this.decode =
      options.decode ??
      ((data, ctx) => new MockAudioBuffer(2, data.byteLength * ctx.sampleRate, ctx.sampleRate))
    const modules: string[] = []
    this.audioWorklet = {
      modules,
      addModule: spyOn((url: string): Promise<void> => {
        modules.push(url)
        return Promise.resolve()
      }),
    }
    this.decodeAudioData = spyOn(this.decodeAudioData.bind(this))
  }

  createGain(): MockGainNode {
    return this.track(this.gains, new MockGainNode())
  }

  createBufferSource(): MockBufferSource {
    return this.track(this.sources, new MockBufferSource())
  }

  createOscillator(): MockOscillatorNode {
    return this.track(this.oscillators, new MockOscillatorNode())
  }

  createAnalyser(): MockAnalyserNode {
    return this.track(this.analysers, new MockAnalyserNode())
  }

  createConvolver(): MockConvolverNode {
    return this.track(this.convolvers, new MockConvolverNode())
  }

  createBiquadFilter(): MockBiquadFilterNode {
    return this.track(this.filters, new MockBiquadFilterNode())
  }

  createDelay(_maxDelayTime?: number): MockDelayNode {
    return this.track(this.delays, new MockDelayNode())
  }

  createDynamicsCompressor(): MockDynamicsCompressorNode {
    return this.track(this.compressors, new MockDynamicsCompressorNode())
  }

  createStereoPanner(): MockStereoPannerNode {
    return this.track(this.panners, new MockStereoPannerNode())
  }

  createMediaStreamDestination(): MockMediaStreamDestination {
    return this.track(this.streamDestinations, new MockMediaStreamDestination())
  }

  createMediaStreamSource(stream: unknown): MockMediaStreamSource {
    return this.track(this.streamSources, new MockMediaStreamSource(stream))
  }

  /** One node per element, as in browsers (a second call throws InvalidStateError). */
  createMediaElementSource(element: unknown): MockMediaElementSource {
    if (typeof element === 'object' && element !== null) {
      if (this.attachedElements.has(element)) {
        throw new Error(
          'InvalidStateError: HTMLMediaElement already connected to a MediaElementAudioSourceNode',
        )
      }
      this.attachedElements.add(element)
    }
    return this.track(this.elementSources, new MockMediaElementSource(element))
  }

  createBuffer(channels: number, length: number, rate: number): MockAudioBuffer {
    return new MockAudioBuffer(channels, length, rate)
  }

  decodeAudioData(data: ArrayBuffer): Promise<MockAudioBuffer> {
    this.decodeCalls.record([data])
    return Promise.resolve(this.decode(data, this))
  }

  /**
   * Stand-in for `new AudioWorkletNode(ctx, name, options)`. Library code
   * constructs worklet nodes through an injectable factory so tests can point
   * it here.
   */
  createWorkletNode(name: string, options?: unknown): MockAudioWorkletNode {
    return this.track(this.workletNodes, new MockAudioWorkletNode(name, options))
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

  /** Move the audio clock forward without touching timers. */
  advanceClock(seconds: number): void {
    this.currentTime += seconds
  }

  /** Every node this context created, in creation order across kinds. */
  allNodes(): MockAudioNode[] {
    return [
      ...this.gains,
      ...this.sources,
      ...this.oscillators,
      ...this.analysers,
      ...this.convolvers,
      ...this.filters,
      ...this.delays,
      ...this.compressors,
      ...this.panners,
      ...this.streamDestinations,
      ...this.streamSources,
      ...this.elementSources,
      ...this.workletNodes,
    ].sort((a, b) => a.id - b.id)
  }

  private track<T extends MockAudioNode>(list: T[], node: T): T {
    list.push(node)
    return node
  }
}

export function createMockContext(options: MockAudioContextOptions = {}): MockAudioContext {
  return new MockAudioContext(options)
}

/** Cast helper: hand a mock to code that wants a real `AudioContext`. */
export function asAudioContext(mock: MockAudioContext): AudioContext {
  return mock as unknown as AudioContext
}

/** Cast helper for a single node. */
export function asAudioNode(mock: MockAudioNode): AudioNode {
  return mock as unknown as AudioNode
}
