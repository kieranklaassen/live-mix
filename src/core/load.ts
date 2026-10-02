// How much of real time the engine's own worklet processors take (R38).
//
// A browser gives a page no figure for its audio thread, and the thread
// cannot time itself: the only clock in an AudioWorkletGlobalScope ticks in
// milliseconds, a third of a render quantum, and its ticks fall in step with
// the audio callbacks. So the processors mark when they are at work in a
// shared cell and a worker looks at that cell at random moments; the share of
// looks that find a processor at work is the share of time it takes. That
// needs shared memory, which a page only has when it is cross-origin
// isolated; anywhere else nothing is measured, and `measurable` says so.
//
// What this covers is the processors that carry a mark (every WASM device and
// the plug-in bridge), not the browser's own nodes (sample playback, gains,
// filters, convolution), which no page can see.

import { LOAD_CELLS, LOAD_CELL_RUN, type LoadSlot } from './load-mark'

export { LOAD_CELL_BUSY, LOAD_CELL_RUN, loadCells, type LoadSlot } from './load-mark'

/** How many processors can carry a mark at once; the ones past it go unmeasured. */
export const LOAD_SLOT_LIMIT = 1024

/** One processor's place in the probe. */
export interface LoadClaim {
  /** For `processorOptions.load`; absent where load cannot be measured. */
  readonly slot: LoadSlot | undefined
  /** What the processor holds in memory, once known. */
  memoryBytes: number
  release(): void
}

/** Every processor of one kind, together. */
export interface DeviceLoad {
  /** The kind: a device id such as `zita-rev1`. */
  label: string
  /** How many of them are running. */
  count: number
  /** Their share of real time over the last interval, 0..1; 0 where it is not measured. */
  load: number
  /** What they hold in memory together, in bytes. */
  memoryBytes: number
}

export interface LoadReading {
  /** Every marked processor's share of real time over the interval, together, 0..1. */
  load: number
  /** How many looks the figure rests on. */
  samples: number
}

/** What the sampler reports each interval: looks that found each slot at work, and looks in all. */
export interface LoadSamplerReport {
  counts: ArrayLike<number>
  total: number
}

/** The sampler as the probe sees it; a worker in a browser, a stand-in under test. */
export interface LoadSampler {
  onreport: ((report: LoadSamplerReport) => void) | null
  stop(): void
}

export interface LoadSamplerInit {
  buffer: SharedArrayBuffer
  /** Seconds between reports. */
  intervalSec: number
  /** Where the bundled sampler worker is, when not beside the built core entry. */
  url?: URL | string
}

export type LoadSamplerFactory = (init: LoadSamplerInit) => LoadSampler

/** Default location of the bundled sampler worker, relative to the built core entry. Call lazily. */
export function defaultLoadSamplerUrl(): string {
  return new URL('./worklets/load-sampler.js', import.meta.url).href
}

/** Message that starts the sampler worker. */
export interface LoadSamplerStart {
  buffer: SharedArrayBuffer
  /** The worker samples for as long as the run cell holds this. */
  run: number
  slots: number
  reportMs: number
}

const workerSampler: LoadSamplerFactory = ({ buffer, intervalSec, url }) => {
  const location =
    url === undefined ? defaultLoadSamplerUrl() : typeof url === 'string' ? url : url.href
  const worker = new Worker(location)
  const cells = new Int32Array(buffer)
  const run = Atomics.add(cells, LOAD_CELL_RUN, 1) + 1
  const sampler: LoadSampler = {
    onreport: null,
    stop: () => {
      // The worker never returns to its event loop while it samples, so it is told through the shared cell.
      Atomics.compareExchange(cells, LOAD_CELL_RUN, run, run + 1)
      worker.onmessage = null
    },
  }
  worker.onmessage = (event: MessageEvent<LoadSamplerReport>) => sampler.onreport?.(event.data)
  // A page that cannot load the worker measures nothing; it must not break over it.
  worker.onerror = (event) => event.preventDefault()
  const start: LoadSamplerStart = {
    buffer,
    run,
    slots: LOAD_SLOT_LIMIT,
    reportMs: intervalSec * 1000,
  }
  worker.postMessage(start)
  return sampler
}

/** Whether this context renders against the clock: an offline render has no real time to take a share of. */
function isRealtime(context: BaseAudioContext): boolean {
  return typeof (context as Partial<OfflineAudioContext>).startRendering !== 'function'
}

function canShareMemory(): boolean {
  const scope = globalThis as { crossOriginIsolated?: boolean; Worker?: unknown }
  return (
    typeof SharedArrayBuffer === 'function' &&
    scope.crossOriginIsolated === true &&
    typeof scope.Worker === 'function'
  )
}

interface Claim extends LoadClaim {
  label: string
  index: number
}

export interface LoadProbeOptions {
  /** Overrides the check for an isolated page and a real-time context (tests). */
  measurable?: boolean
  createSampler?: LoadSamplerFactory
}

const probes = new WeakMap<BaseAudioContext, LoadProbe>()

/**
 * The marks handed out on one context, and the sampler that reads them.
 * Devices claim a mark when they are made (`LoadProbe.for(context).claim`),
 * and `EngineStats` starts the sampler while somebody watches.
 */
export class LoadProbe {
  /** The context's probe, made on first use. */
  static for(context: BaseAudioContext): LoadProbe {
    let probe = probes.get(context)
    if (!probe) {
      probe = new LoadProbe({ measurable: isRealtime(context) && canShareMemory() })
      probes.set(context, probe)
    }
    return probe
  }

  /** Whether load can be measured here at all. */
  readonly measurable: boolean
  private readonly createSampler: LoadSamplerFactory
  private buffer: SharedArrayBuffer | null = null
  private readonly claims = new Set<Claim>()
  private readonly free: number[] = []
  private nextIndex = 1
  private sampler: LoadSampler | null = null
  private loads = new Map<string, number>()

  constructor(options: LoadProbeOptions = {}) {
    this.measurable = options.measurable ?? canShareMemory()
    this.createSampler = options.createSampler ?? workerSampler
  }

  /** A mark for one processor of kind `label`; release it when the processor goes. */
  claim(label: string): LoadClaim {
    const index = this.measurable ? this.takeIndex() : 0
    const claims = this.claims
    const free = this.free
    const claim: Claim = {
      label,
      index,
      slot: index > 0 ? { buffer: this.cells(), slot: index } : undefined,
      memoryBytes: 0,
      release: () => {
        if (!claims.delete(claim)) return
        if (index > 0) free.push(index)
      },
    }
    claims.add(claim)
    return claim
  }

  /** The marked processors by kind, costliest first, then by name; loads are the last interval's. */
  devices(): DeviceLoad[] {
    const kinds = new Map<string, DeviceLoad>()
    for (const claim of this.claims) {
      let kind = kinds.get(claim.label)
      if (!kind) {
        kind = {
          label: claim.label,
          count: 0,
          load: this.loads.get(claim.label) ?? 0,
          memoryBytes: 0,
        }
        kinds.set(claim.label, kind)
      }
      kind.count += 1
      kind.memoryBytes += claim.memoryBytes
    }
    return [...kinds.values()].sort(
      (a, b) => b.load - a.load || b.memoryBytes - a.memoryBytes || a.label.localeCompare(b.label),
    )
  }

  /**
   * Sample until the returned function is called, handing `onReading` the
   * share of real time the marked processors took every `intervalSec`.
   * Does nothing where load cannot be measured, or while it already runs.
   */
  start(
    intervalSec: number,
    onReading: (reading: LoadReading) => void,
    url?: URL | string,
  ): () => void {
    if (!this.measurable || this.sampler) return () => {}
    const sampler = this.createSampler({ buffer: this.cells(), intervalSec, url })
    this.sampler = sampler
    sampler.onreport = (report) => {
      if (report.total <= 0) return
      const loads = new Map<string, number>()
      const labels = new Map<number, string>()
      for (const claim of this.claims) if (claim.index > 0) labels.set(claim.index, claim.label)
      let busy = 0
      for (let index = 1; index < report.counts.length; index += 1) {
        const count = report.counts[index]
        if (!count) continue
        busy += count
        const label = labels.get(index)
        if (label !== undefined) loads.set(label, (loads.get(label) ?? 0) + count / report.total)
      }
      this.loads = loads
      onReading({ load: busy / report.total, samples: report.total })
    }
    return () => {
      if (this.sampler !== sampler) return
      sampler.onreport = null
      sampler.stop()
      this.sampler = null
      this.loads = new Map()
    }
  }

  private cells(): SharedArrayBuffer {
    this.buffer ??= new SharedArrayBuffer(LOAD_CELLS * Int32Array.BYTES_PER_ELEMENT)
    return this.buffer
  }

  private takeIndex(): number {
    const reused = this.free.pop()
    if (reused !== undefined) return reused
    if (this.nextIndex >= LOAD_SLOT_LIMIT) return 0
    const index = this.nextIndex
    this.nextIndex += 1
    return index
  }
}

const moduleMemory = new WeakMap<WebAssembly.Module, Promise<number>>()

/**
 * What one instance of a device module holds: its memory is fixed in size, so
 * a throwaway instance (never initialised, never run) says it. Asked once per
 * module; 0 when the module cannot be instantiated with no imports.
 */
export function wasmMemoryBytes(module: WebAssembly.Module): Promise<number> {
  let known = moduleMemory.get(module)
  if (!known) {
    known = WebAssembly.instantiate(module, {}).then(
      (instance) => {
        const memory = instance.exports.memory
        return memory instanceof WebAssembly.Memory ? memory.buffer.byteLength : 0
      },
      () => 0,
    )
    moduleMemory.set(module, known)
  }
  return known
}
