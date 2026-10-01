// The page side of the hosted plug-in tests: a real AudioContext (and a real
// OfflineAudioContext), the built bridge worklet and pump worker from /dist,
// and the real plug-in host on the loopback interface. The page is served
// cross-origin isolated (see serve.mjs): the bridge needs shared memory.

import { holdRenderAt } from '@kieranklaassen/live-mix'
import {
  NativeDevice,
  NativeHostClient,
  scanNativeDevices,
  type NativeHostAddress,
} from '@kieranklaassen/live-mix/native'

const SAMPLE_RATE = 48000

export interface NativeHarnessArgs {
  host: NativeHostAddress
  /** Folder the test plug-ins were built into. */
  pluginDir: string
}

export interface LiveResult {
  isolated: boolean
  status: string
  bridgeLatency: number
  reportedLatency: number
  /** Lag (frames) at which the wet signal matches the dry one best. */
  measuredLag: number
  /** Frames that differ from the dry signal at that lag; an underrun costs 128. */
  mismatched: number
  compared: number
  underruns: number
  /** Level of the wet signal after the gain went to half, relative to before. */
  halved: number
  baseLatency: number
  paramNames: string[]
  gainText: string | undefined
}

export interface OfflineResult {
  latencies: number[]
  lag: number
  /** Largest difference between the render and the source delayed by `lag`. */
  maxError: number
  /** Largest sample before the first frame can have come back. */
  head: number
  underruns: number[]
  renderMs: number
}

export interface InstrumentResult {
  isInstrument: boolean
  /** Zero crossings per second while the note is held. */
  crossingsPerSec: number
  heldPeak: number
  releasedPeak: number
}

export interface InstrumentOfflineResult {
  /** The device's latency in frames: every frame below is this much late in the output. */
  lag: number
  /** The block the note was let go at, and the block the next one was struck at. */
  offFrame: number
  onFrame: number
  /** The first frame that sounds. */
  firstSound: number
  /** The silence between the two notes: its first frame and the first frame after it. */
  gapStart: number
  gapEnd: number
  peak: number
  underruns: number
}

export interface HostLossResult {
  before: string
  after: string
  /** Level of the output after the host went away: the dry signal passes. */
  dryPeak: number
}

const CAPTURE = `
class Capture extends AudioWorkletProcessor {
  constructor(options) {
    super()
    this.frames = options.processorOptions.frames
    this.a = new Float32Array(this.frames)
    this.b = new Float32Array(this.frames)
    this.n = 0
  }
  process(inputs) {
    if (this.n >= this.frames) return false
    const count = Math.min(128, this.frames - this.n)
    const a = inputs[0][0]
    const b = inputs[1][0]
    if (a) this.a.set(a.subarray(0, count), this.n)
    if (b) this.b.set(b.subarray(0, count), this.n)
    this.n += count
    if (this.n >= this.frames) this.port.postMessage({ a: this.a, b: this.b })
    return true
  }
}
registerProcessor('native-test-capture', Capture)`

/** Records `frames` of two mono signals side by side, sample-aligned. */
async function capture(
  ctx: AudioContext,
  a: AudioNode,
  b: AudioNode,
  frames: number,
): Promise<{ a: Float32Array; b: Float32Array }> {
  const node = new AudioWorkletNode(ctx, 'native-test-capture', {
    numberOfInputs: 2,
    numberOfOutputs: 0,
    processorOptions: { frames },
  })
  a.connect(node, 0, 0)
  b.connect(node, 0, 1)
  const done = await new Promise<{ a: Float32Array; b: Float32Array }>((resolve) => {
    node.port.onmessage = (event: MessageEvent<{ a: Float32Array; b: Float32Array }>) =>
      resolve(event.data)
  })
  a.disconnect(node)
  b.disconnect(node)
  return done
}

async function liveContext(): Promise<AudioContext> {
  const ctx = new AudioContext({ sampleRate: SAMPLE_RATE, latencyHint: 'interactive' })
  await ctx.resume()
  await ctx.audioWorklet.addModule(
    URL.createObjectURL(new Blob([CAPTURE], { type: 'text/javascript' })),
  )
  return ctx
}

/** A sine with a click ten times a second: easy to line up, never silent for long. */
function testSignal(ctx: BaseAudioContext, frames: number): AudioBuffer {
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i += 1) {
    data[i] = 0.25 * Math.sin((2 * Math.PI * 440 * i) / ctx.sampleRate) + (i % 4800 === 0 ? 0.6 : 0)
  }
  return buffer
}

async function connect(args: NativeHarnessArgs) {
  const client = await NativeHostClient.connect(args.host)
  const scan = await scanNativeDevices(client, { paths: [args.pluginDir], defaultPaths: false })
  const find = (name: string) => {
    const plugin = scan.plugins.find((entry) => entry.name === name && entry.format === 'VST3')
    if (!plugin) throw new Error(`${name} was not scanned`)
    return plugin
  }
  return { client, find, descriptors: scan.descriptors }
}

function peakOf(samples: Float32Array, from = 0, to = samples.length): number {
  let peak = 0
  for (let i = from; i < to; i += 1) peak = Math.max(peak, Math.abs(samples[i]))
  return peak
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

async function untilRunning(device: NativeDevice): Promise<void> {
  for (let i = 0; i < 200 && device.status === 'connecting'; i += 1) await sleep(10)
}

async function live(args: NativeHarnessArgs): Promise<LiveResult> {
  const { client, find } = await connect(args)
  const ctx = await liveContext()
  const device = await NativeDevice.create(ctx, client, find('LiveMix Test Gain').id)
  await untilRunning(device)
  await sleep(300)

  const frames = 3 * SAMPLE_RATE
  const source = ctx.createBufferSource()
  source.buffer = testSignal(ctx, frames)
  source.connect(device.input)
  const silent = ctx.createGain()
  silent.gain.value = 0
  device.output.connect(silent).connect(ctx.destination)

  const recording = capture(ctx, source, device.output, frames)
  source.start()
  const { a: dry, b: wet } = await recording

  // The lag at which a second of the wet signal matches the dry one best.
  let measuredLag = -1
  let best = Infinity
  for (let lag = 0; lag < 12000; lag += 1) {
    let error = 0
    for (let i = SAMPLE_RATE; i < SAMPLE_RATE + 2400; i += 1) {
      const d = wet[i + lag] - dry[i]
      error += d * d
    }
    if (error < best) {
      best = error
      measuredLag = lag
    }
  }
  let mismatched = 0
  const compared = frames - measuredLag - SAMPLE_RATE / 2
  for (let i = SAMPLE_RATE / 2; i + measuredLag < frames; i += 1) {
    if (Math.abs(wet[i + measuredLag] - dry[i]) > 1e-6) mismatched += 1
  }
  const underruns = device.underruns

  // Half the gain: a quarter of the way along a 0..2 parameter.
  const [gainName] = Object.keys(device.params)
  const before = await level(ctx, device)
  device.setParam(gainName, 0.25)
  await sleep(200)
  const after = await level(ctx, device)
  const result: LiveResult = {
    isolated: crossOriginIsolated,
    status: device.status,
    bridgeLatency: device.bridgeLatencyFrames,
    reportedLatency: device.latencySamples,
    measuredLag,
    mismatched,
    compared,
    underruns,
    halved: after / before,
    baseLatency: ctx.baseLatency,
    paramNames: Object.values(device.params).map((spec) => spec.name),
    gainText: device.paramText(gainName),
  }
  device.dispose()
  await ctx.close()
  client.close()
  return result
}

/** Peak of the device's output for a steady full-scale input. */
async function level(ctx: AudioContext, device: NativeDevice): Promise<number> {
  const steady = ctx.createConstantSource()
  steady.offset.value = 0.5
  steady.connect(device.input)
  steady.start()
  await sleep(150)
  const { b } = await capture(ctx, steady, device.output, 4800)
  steady.stop()
  steady.disconnect()
  return peakOf(b, 2400)
}

async function offline(args: NativeHarnessArgs): Promise<OfflineResult> {
  const { client, find } = await connect(args)
  const frames = 4 * SAMPLE_RATE
  const ctx = new OfflineAudioContext(2, frames, SAMPLE_RATE)
  const source = ctx.createBufferSource()
  const signal = testSignal(ctx, frames)
  source.buffer = signal

  // Three instances in a row with different bridge latencies: one clock paces all.
  const plugin = find('LiveMix Test Gain')
  const devices: NativeDevice[] = []
  let tail: AudioNode = source
  for (const latencyFrames of [undefined, 256, 1024]) {
    const device = await NativeDevice.create(ctx, client, plugin.id, { latencyFrames })
    tail.connect(device.input)
    tail = device.output
    devices.push(device)
  }
  tail.connect(ctx.destination)
  source.start()

  const started = performance.now()
  const rendered = await ctx.startRendering()
  const renderMs = performance.now() - started
  const out = rendered.getChannelData(0)
  const dry = signal.getChannelData(0)
  const lag = devices.reduce((sum, device) => sum + device.latencySamples, 0)
  let maxError = 0
  for (let i = 0; i + lag < frames; i += 1) {
    maxError = Math.max(maxError, Math.abs(out[i + lag] - dry[i]))
  }
  const result: OfflineResult = {
    latencies: devices.map((device) => device.bridgeLatencyFrames),
    lag,
    maxError,
    head: peakOf(out, 0, lag),
    underruns: devices.map((device) => device.underruns),
    renderMs,
  }
  for (const device of devices) device.dispose()
  client.close()
  return result
}

async function instrument(args: NativeHarnessArgs): Promise<InstrumentResult> {
  const { client, find, descriptors } = await connect(args)
  const ctx = await liveContext()
  const plugin = find('LiveMix Test Sine')
  const descriptor = descriptors.find((entry) => entry.plugin.id === plugin.id)
  const device = await NativeDevice.create(ctx, client, plugin.id)
  await untilRunning(device)
  const silent = ctx.createGain()
  silent.gain.value = 0
  device.output.connect(silent).connect(ctx.destination)
  const reference = ctx.createConstantSource()
  reference.start()

  device.noteOn(1, 440, 1)
  await sleep(400)
  const held = (await capture(ctx, reference, device.output, SAMPLE_RATE / 2)).b
  let crossings = 0
  for (let i = 1; i < held.length; i += 1) if (held[i - 1] < 0 !== held[i] < 0) crossings += 1

  device.noteOff(1)
  await sleep(400)
  const released = (await capture(ctx, reference, device.output, SAMPLE_RATE / 4)).b
  const result: InstrumentResult = {
    isInstrument: descriptor?.category === 'instrument',
    crossingsPerSec: (crossings * SAMPLE_RATE) / held.length,
    heldPeak: peakOf(held),
    releasedPeak: peakOf(released),
  }
  device.dispose()
  await ctx.close()
  client.close()
  return result
}

/**
 * An instrument in an offline render: a note from the start, let go while the
 * render is held at one block and struck again at a later one. The test synth
 * gates without an envelope, so the frames where sound starts and stops say
 * exactly which block each message reached the plug-in on.
 */
async function instrumentOffline(args: NativeHarnessArgs): Promise<InstrumentOfflineResult> {
  const { client, find } = await connect(args)
  const frames = SAMPLE_RATE
  const offFrame = 187 * 128
  const onFrame = 300 * 128
  const ctx = new OfflineAudioContext(2, frames, SAMPLE_RATE)
  const device = await NativeDevice.create(ctx, client, find('LiveMix Test Sine').id)
  device.output.connect(ctx.destination)

  device.noteOn(1, 440, 1)
  await device.notesDelivered()
  void holdRenderAt(ctx, offFrame / SAMPLE_RATE, async () => {
    device.noteOff(1)
    await device.notesDelivered()
  })
  void holdRenderAt(ctx, onFrame / SAMPLE_RATE, async () => {
    device.noteOn(2, 440, 1)
    await device.notesDelivered()
  })
  const out = (await ctx.startRendering()).getChannelData(0)

  const sounds = (index: number): boolean => Math.abs(out[index]) > 1e-4
  const lag = device.latencySamples
  let firstSound = 0
  while (firstSound < frames && !sounds(firstSound)) firstSound += 1
  // The gap between the two notes, looked for from its middle outwards.
  const middle = lag + (offFrame + onFrame) / 2
  let gapStart = middle
  while (gapStart > 0 && !sounds(gapStart - 1)) gapStart -= 1
  let gapEnd = middle
  while (gapEnd < frames && !sounds(gapEnd)) gapEnd += 1
  const result: InstrumentOfflineResult = {
    lag,
    offFrame,
    onFrame,
    firstSound,
    gapStart,
    gapEnd,
    peak: peakOf(out),
    underruns: device.underruns,
  }
  device.dispose()
  client.close()
  return result
}

/** Starts a device, reports its status, and reports again once `gone` resolves. */
async function hostLoss(args: NativeHarnessArgs): Promise<HostLossResult> {
  const { client, find } = await connect(args)
  const ctx = await liveContext()
  const device = await NativeDevice.create(ctx, client, find('LiveMix Test Gain').id)
  await untilRunning(device)
  const before = device.status
  const silent = ctx.createGain()
  silent.gain.value = 0
  device.output.connect(silent).connect(ctx.destination)

  await (window as unknown as { stopPluginHost(): Promise<void> }).stopPluginHost()
  for (let i = 0; i < 300 && device.status !== 'stopped'; i += 1) await sleep(10)
  const after = device.status
  await sleep(100)
  const steady = ctx.createConstantSource()
  steady.offset.value = 0.5
  steady.connect(device.input)
  steady.start()
  await sleep(200)
  const { b } = await capture(ctx, steady, device.output, 4800)
  device.dispose()
  await ctx.close()
  return { before, after, dryPeak: peakOf(b, 2400) }
}

declare global {
  interface Window {
    nativeHarness?: {
      live: typeof live
      offline: typeof offline
      instrument: typeof instrument
      instrumentOffline: typeof instrumentOffline
      hostLoss: typeof hostLoss
    }
  }
}

window.nativeHarness = { live, offline, instrument, instrumentOffline, hostLoss }
