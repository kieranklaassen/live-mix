// `@kieranklaassen/live-mix/testing` — a recording Web Audio mock.
//
// Lifted from Breathwork Live's musicEngine.test.ts harness and made
// framework-free: every AudioParam automation call and every node
// connect/start/stop is recorded so tests assert behaviour at the AudioParam
// boundary (what the graph was told to do) rather than on internals. Works in
// plain Node under any test runner; `configureMocks` optionally plugs in the
// runner's spy factory and fake-timer advancer.

export {
  configureMocks,
  currentMockConfiguration,
  type MockConfiguration,
  type SpyFactory,
  type TimerAdvancer,
} from './configure'
export { MockAudioParam, type AutomationEvent, type ParamEvent } from './mock-audio-param'
export {
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
  MockMediaStream,
  MockMediaStreamDestination,
  MockMediaStreamSource,
  MockMessagePort,
  MockOscillatorNode,
  MockStereoPannerNode,
} from './mock-nodes'
export {
  MockAudioContext,
  asAudioContext,
  asAudioNode,
  createMockContext,
  type MockAudioContextOptions,
} from './mock-audio-context'
export {
  MockMediaElement,
  asMediaElement,
  createMockMediaElement,
  type MockMediaElementOptions,
} from './mock-media-element'
export { advance } from './advance'
