// The page side of the engine load test: real WASM devices in a real
// AudioContext, the engine's own figure for what they take of real time, and
// a second figure to hold it against: the same modules run in a worker at
// the audio thread's pace, timed with the worker's clock. The page is served twice (see
// serve.mjs): cross-origin isolated, where the engine can measure, and plain,
// where it cannot and must say so.

import { createEngine, type EngineStatsSnapshot } from '@kieranklaassen/live-mix'
import {
  SHIMMER_DEVICE,
  HALL_REVERB_DEVICE,
  createShimmer,
  createHallReverb,
  type Device,
} from '@kieranklaassen/live-mix/dsp'

export interface LoadResult {
  isolated: boolean
  /** The last few snapshots, one per update interval. */
  snapshots: EngineStatsSnapshot[]
  /** Share of real time each kind of device should take, from the worker's timing. */
  expected: Record<string, number>
  /** Bytes one instance of each module holds. */
  memory: Record<string, number>
  /** The snapshot after every device was disposed. */
  after: EngineStatsSnapshot
}

const QUANTUM = 128
const KINDS: {
  definition: { id: string; wasm: () => unknown }
  count: number
  create: (context: BaseAudioContext) => Promise<Device>
}[] = [
  { definition: HALL_REVERB_DEVICE, count: 4, create: (context) => createHallReverb(context) },
  { definition: SHIMMER_DEVICE, count: 2, create: (context) => createShimmer(context) },
]

// Runs device modules over noise the way the audio thread does: one block of
// each, then idle until the next quantum is due, so every block starts on a
// cold cache as it does there. (Run flat out, the same modules take about
// half the time per block.) Answers with the milliseconds a block of every
// instance of each module takes together.
const BENCH = `
onmessage = async (event) => {
  const { modules, sampleRate, frames, blocks } = event.data
  const devices = []
  for (const { module, count } of modules) {
    for (let index = 0; index < count; index += 1) {
      const { exports } = await WebAssembly.instantiate(module, {})
      exports._initialize?.()
      exports.device_init(sampleRate, exports.device_max_block_frames())
      devices.push({ module, exports })
    }
  }
  const noise = Float32Array.from({ length: frames }, () => Math.random() * 0.2 - 0.1)
  const nap = new Int32Array(new SharedArrayBuffer(4))
  const quantumMs = (frames / sampleRate) * 1000
  const spent = new Map()
  for (let block = -200; block < blocks; block += 1) {
    const due = performance.now() + quantumMs
    for (const { module, exports } of devices) {
      // The device clears its inputs every block.
      new Float32Array(exports.memory.buffer, exports.device_in_left(), frames).set(noise)
      new Float32Array(exports.memory.buffer, exports.device_in_right(), frames).set(noise)
      const started = performance.now()
      exports.device_process(frames)
      if (block >= 0) spent.set(module, (spent.get(module) ?? 0) + performance.now() - started)
    }
    Atomics.wait(nap, 0, 0, Math.max(0, due - performance.now()))
  }
  postMessage(modules.map(({ module }) => spent.get(module) / blocks))
}`

function bench(
  modules: { module: WebAssembly.Module; count: number }[],
  sampleRate: number,
): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(URL.createObjectURL(new Blob([BENCH], { type: 'text/javascript' })))
    worker.onmessage = (event) => {
      resolve(event.data)
      worker.terminate()
    }
    worker.onerror = (event) => reject(new Error(event.message))
    worker.postMessage({ modules, sampleRate, frames: QUANTUM, blocks: 1500 })
  })
}

async function compile(url: URL | string): Promise<WebAssembly.Module> {
  return WebAssembly.compile(await (await fetch(url)).arrayBuffer())
}

/** What one instance of a device module holds; its memory never grows. */
async function instanceBytes(module: WebAssembly.Module): Promise<number> {
  const { exports } = await WebAssembly.instantiate(module, {})
  return (exports.memory as WebAssembly.Memory).buffer.byteLength
}

async function measure(seconds: number): Promise<LoadResult> {
  const context = new AudioContext()
  await context.resume()
  const engine = createEngine({ context, stats: { updateIntervalSec: 1 } })

  // Noise into every device, the devices into a silent sum: they all run, nothing is heard.
  const noise = context.createBuffer(2, context.sampleRate, context.sampleRate)
  for (let channel = 0; channel < 2; channel += 1) {
    const data = noise.getChannelData(channel)
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 0.2 - 0.1
  }
  const source = new AudioBufferSourceNode(context, { buffer: noise, loop: true })
  const sink = new GainNode(context, { gain: 0 })
  sink.connect(context.destination)

  const expected: Record<string, number> = {}
  const memory: Record<string, number> = {}
  const devices: Device[] = []
  const quantumMs = (QUANTUM / context.sampleRate) * 1000
  const modules = await Promise.all(
    KINDS.map(async ({ definition, count }) => ({
      module: await compile(definition.wasm() as URL),
      count,
    })),
  )
  // Timed before the devices exist, so the two never compete for the processor.
  const timed = globalThis.crossOriginIsolated ? await bench(modules, context.sampleRate) : null
  for (const [kind, { definition, count, create }] of KINDS.entries()) {
    expected[definition.id] = timed ? timed[kind] / quantumMs : 0
    memory[definition.id] = await instanceBytes(modules[kind].module)
    for (let index = 0; index < count; index += 1) {
      const device = await create(context)
      source.connect(device.input)
      device.output.connect(sink)
      devices.push(device)
    }
  }
  source.start()

  const snapshots: EngineStatsSnapshot[] = []
  const unsubscribe = engine.stats.subscribe((snapshot) => snapshots.push(snapshot))
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000))
  // The first interval starts while the devices are still being made.
  const running = snapshots.slice(1)
  for (const device of devices) device.dispose()
  await new Promise((resolve) => setTimeout(resolve, 3200))
  const after = engine.stats.snapshot()
  unsubscribe()
  engine.dispose()
  await context.close()
  return {
    isolated: globalThis.crossOriginIsolated,
    snapshots: running,
    expected,
    memory,
    after,
  }
}

declare global {
  interface Window {
    loadHarness?: { measure: typeof measure }
  }
}

window.loadHarness = { measure }
