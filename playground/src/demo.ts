// The demo session as a score (U28): four tracks, a group, a return, a few
// insert devices, sends and clips over synthesised tones. `loadScore` makes
// the engine follow the document, the agent controller (U29) edits the
// document, and the offline bounce (U33) renders the same document — three
// renderers of one source of truth, which is the point of the playground.
//
// It runs on the library's recording mock context by default — so the page
// renders without an audio permission and headless — and on a real
// AudioContext when asked. In mock mode the clock is advanced by a timer and
// the analysers are fed levels so meters and the playhead move.

import {
  AgentController,
  DeviceRegistry,
  ScoreDocument,
  Session,
  createEngine,
  createScore,
  defaultStrip,
  devices,
  loadScore,
  renderScore,
  type AgentTrack,
  type AudioTrack,
  type Clip,
  type DeviceCreateOptions,
  type Engine,
  type RenderResult,
  type ReturnTrack,
  type Score,
  type ScoreDevice,
  type ScoreRenderer,
  type ScoreSlot,
  type ScoreSource,
  type SlotClip,
} from '@kieranklaassen/live-mix'
import { STOCK_WASM_DEVICES, type AssetOverrides } from '@kieranklaassen/live-mix/dsp'
import {
  asAudioContext,
  createMockContext,
  type MockAudioContext,
} from '@kieranklaassen/live-mix/testing'

export type DemoMode = 'mock' | 'live'

export interface Demo {
  mode: DemoMode
  engine: Engine
  /** The source of truth the engine follows and the agent edits. */
  document: ScoreDocument
  renderer: ScoreRenderer
  /** The U29 tool surface over the document and the engine. */
  agent: AgentController
  /** The U31 session grid performing the document's scenes and slots. */
  session: Session
  tracks: AudioTrack[]
  returns: ReturnTrack[]
  dispose(): void
}

export const LOOP_SEC = 16
/** The score id of the music track the agent's intents act on. */
export const MUSIC_ROLE = 'pad'

/**
 * The playground imports the library from `src/`, where the dsp entry's
 * `new URL('../worklets/wasm-device.js', import.meta.url)` has nothing to point
 * at (the processor is bundled into `dist/worklets/` by `pnpm build`). The Vite
 * config serves that folder at `worklets/` next to the page (dev and build),
 * and every WASM factory here gets the explicit `processorUrl` override — the
 * same escape hatch a consumer uses when its bundler cannot resolve the asset
 * (KTD3).
 */
function wasmProcessorUrl(): string {
  return new URL('worklets/wasm-device.js', document.baseURI).href
}

/**
 * The registry each demo engine creates devices from: the stock node devices
 * (and the rack) always; the WASM devices only where a real AudioWorklet
 * exists — the mock context cannot construct an `AudioWorkletNode`, so its add
 * picker must not offer one.
 */
function demoRegistry(wasm: boolean): DeviceRegistry {
  const registry = new DeviceRegistry(devices.list())
  if (!wasm) return registry
  for (const descriptor of STOCK_WASM_DEVICES) {
    registry.register({
      ...descriptor,
      create: (context, options) => {
        const request: DeviceCreateOptions & AssetOverrides = {
          processorUrl: wasmProcessorUrl(),
          ...options,
        }
        return descriptor.create(context, request)
      },
    })
  }
  return registry
}

// --- Synthesised sources -------------------------------------------------------

interface Tone {
  id: string
  title: string
  frequencies: number[]
  durationSec: number
  kind: 'pad' | 'pluck' | 'noise' | 'bass'
  /** Library metadata for the agent's steer ladder (intensity 1..3, Camelot key). */
  intensity: number
  camelot: string
}

const TONES: Tone[] = [
  {
    id: 'pad-Cmaj',
    title: 'Pad in C',
    frequencies: [261.63, 329.63, 392.0, 523.25],
    durationSec: 8,
    kind: 'pad',
    intensity: 2,
    camelot: '8B',
  },
  {
    id: 'pad-Fmaj',
    title: 'Pad in F',
    frequencies: [174.61, 220.0, 261.63, 349.23],
    durationSec: 8,
    kind: 'pad',
    intensity: 1,
    camelot: '7B',
  },
  {
    id: 'pad-Gmaj',
    title: 'Pad in G',
    frequencies: [196.0, 246.94, 293.66, 392.0],
    durationSec: 8,
    kind: 'pad',
    intensity: 3,
    camelot: '9B',
  },
  {
    id: 'keys-arp',
    title: 'Keys arpeggio',
    frequencies: [523.25, 659.25, 783.99, 1046.5],
    durationSec: 4,
    kind: 'pluck',
    intensity: 2,
    camelot: '8B',
  },
  {
    id: 'drums-loop',
    title: 'Drum loop',
    frequencies: [60],
    durationSec: 2,
    kind: 'noise',
    intensity: 3,
    camelot: '8B',
  },
  {
    id: 'bass-line',
    title: 'Bass line',
    frequencies: [65.41, 87.31],
    durationSec: 8,
    kind: 'bass',
    intensity: 2,
    camelot: '8B',
  },
]

/** Fill an AudioBuffer with a tone so waveforms have a shape. */
function synthesize(buffer: AudioBuffer, tone: Tone): void {
  const rate = buffer.sampleRate
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel)
    let seed = 1234 + channel
    for (let i = 0; i < data.length; i += 1) {
      const t = i / rate
      let sample = 0
      switch (tone.kind) {
        case 'pad': {
          for (const f of tone.frequencies) sample += Math.sin(2 * Math.PI * f * t)
          sample *= 0.12 * (0.7 + 0.3 * Math.sin(2 * Math.PI * 0.25 * t))
          break
        }
        case 'pluck': {
          const step = Math.floor(t * 4) % tone.frequencies.length
          const phase = (t * 4) % 1
          sample = Math.sin(2 * Math.PI * tone.frequencies[step] * t) * Math.exp(-phase * 6) * 0.3
          break
        }
        case 'noise': {
          seed = (seed * 1664525 + 1013904223) >>> 0
          const beat = (t * 2) % 1
          const hit = Math.exp(-beat * 18)
          sample =
            ((seed / 0xffffffff) * 2 - 1) * hit * 0.35 + Math.sin(2 * Math.PI * 60 * t) * hit * 0.4
          break
        }
        case 'bass': {
          const note = tone.frequencies[Math.floor(t / 4) % tone.frequencies.length]
          sample =
            Math.sign(Math.sin(2 * Math.PI * note * t)) * 0.18 * Math.min(1, t % 4 < 3.8 ? 1 : 0)
          break
        }
        default: {
          const _exhaustive: never = tone.kind
          sample = _exhaustive
        }
      }
      data[i] = sample
    }
  }
}

/** What the score renderer decodes for a source: a synthesised buffer at the context's rate. */
function resolveTone(sampleRate: number) {
  return (source: ScoreSource): AudioBuffer | undefined => {
    const tone = TONES.find((candidate) => candidate.id === source.id)
    if (!tone) return undefined
    const buffer = new AudioBuffer({
      numberOfChannels: 2,
      length: Math.floor(tone.durationSec * sampleRate),
      sampleRate,
    })
    synthesize(buffer, tone)
    return buffer
  }
}

/** The tones as a library the agent's `steer_music` ladder can pick from. */
export const DEMO_LIBRARY: AgentTrack[] = TONES.filter((tone) => tone.kind === 'pad').map(
  (tone) => ({
    id: tone.id,
    title: tone.title,
    intensity: tone.intensity,
    camelot: tone.camelot,
    durationSec: tone.durationSec,
  }),
)

// --- The score -------------------------------------------------------------------

function clip(
  id: string,
  sourceId: string,
  startSec: number,
  durationSec: number,
  extra: Partial<Clip> = {},
): Clip {
  return {
    id,
    sourceId,
    startSec,
    offsetSec: 0,
    durationSec,
    fadeInSec: 0.05,
    fadeOutSec: 0.2,
    fadeCurve: 'equalPower',
    gainDb: 0,
    ...extra,
  }
}

function device(id: string, deviceId: string, params: Record<string, number> = {}): ScoreDevice {
  return { id, deviceId, params, bypass: false }
}

function slotClip(sourceId: string, durationSec: number, extra: Partial<SlotClip> = {}): SlotClip {
  return {
    sourceId,
    offsetSec: 0,
    durationSec,
    fadeInSec: 0.05,
    fadeOutSec: 0.2,
    fadeCurve: 'equalPower',
    gainDb: 0,
    ...extra,
  }
}

function slot(
  scene: string,
  track: string,
  clip: SlotClip | null,
  extra: Partial<ScoreSlot> = {},
): ScoreSlot {
  return {
    id: `${scene}-${track}`,
    scene,
    track,
    clip,
    launchMode: 'trigger',
    legato: false,
    ...extra,
  }
}

const MASTER = { kind: 'master' } as const

/** The demo arrangement as a score document (format 2). */
export function demoScore(wasm: boolean): Score {
  const score = createScore({ id: 'playground', name: 'live-mix playground' })
  score.transport.loop = { enabled: true, lengthSec: LOOP_SEC }
  score.transport.quantize = 'bar' // 120 BPM default tempo → a 2 s launch grid
  score.sources = TONES.map((tone) => ({ id: tone.id, durationSec: tone.durationSec }))
  // The session grid (U31): three scenes over the four audio tracks. Launches
  // land on the tracks' arrangement lanes at the next bar; the empty cells in
  // the last row are stop buttons.
  score.scenes = [
    { id: 'calm', name: 'Calm' },
    { id: 'groove', name: 'Groove' },
    { id: 'stop', name: 'Stop' },
  ]
  score.slots = [
    slot('calm', 'pad', slotClip('pad-Fmaj', 8, { loop: true })),
    slot('calm', 'keys', slotClip('keys-arp', 4, { loop: true }), { launchMode: 'toggle' }),
    slot('groove', 'pad', slotClip('pad-Gmaj', 8, { loop: true })),
    slot('groove', 'keys', slotClip('keys-arp', 4, { loop: true }), { launchMode: 'toggle' }),
    slot('groove', 'drums', slotClip('drums-loop', 2, { loop: true })),
    slot('groove', 'bass', slotClip('bass-line', 8, { loop: true }), { legato: true }),
    slot('stop', 'pad', null),
    slot('stop', 'keys', null),
    slot('stop', 'drums', null),
    slot('stop', 'bass', null),
  ]
  score.groups = [{ id: 'rhythm', name: 'rhythm', destination: MASTER, strip: defaultStrip() }]
  // The hall is ambient-live's Dattorro plate (WASM) where a worklet can run,
  // a feedback delay on the mock context.
  score.returns = [
    {
      id: 'hall',
      name: 'hall',
      destination: MASTER,
      strip: defaultStrip({ level: 0.5, soloSafe: true }),
      device: wasm
        ? device('hall-plate', 'dattorro', { mix: 1, decay: 0.7 })
        : device('hall-delay', 'delay', { timeSec: 0.375, feedback: 0.35, mix: 1 }),
    },
  ]
  score.tracks = [
    {
      kind: 'audio',
      id: 'pad',
      name: 'pad',
      destination: MASTER,
      strip: defaultStrip({
        level: 0.8,
        inserts: [device('pad-filter', 'filter', { frequency: 2400, q: 0.9 })],
        sends: [{ target: 'hall', level: 0.4 }],
      }),
      clips: [clip('pad-1', 'pad-Cmaj', 0, 8), clip('pad-2', 'pad-Fmaj', 8, 8)],
    },
    {
      kind: 'audio',
      id: 'keys',
      name: 'keys',
      destination: MASTER,
      strip: defaultStrip({
        level: 0.6,
        pan: 0.3,
        inserts: [
          device('keys-eq', 'eq3'),
          // kkfonie's StereoWidener (WASM) after the EQ where a worklet can run.
          ...(wasm ? [device('keys-width', 'stereo-widener', { width: 0.65 })] : []),
        ],
        sends: [{ target: 'hall', level: 0.25 }],
      }),
      clips: [clip('keys-1', 'keys-arp', 2, 4), clip('keys-2', 'keys-arp', 10, 4)],
    },
    {
      kind: 'audio',
      id: 'drums',
      name: 'drums',
      destination: { kind: 'group', id: 'rhythm' },
      strip: defaultStrip({ level: 0.9, inserts: [device('drums-comp', 'compressor')] }),
      clips: [clip('drums-1', 'drums-loop', 0, LOOP_SEC, { loop: true })],
    },
    {
      kind: 'audio',
      id: 'bass',
      name: 'bass',
      destination: { kind: 'group', id: 'rhythm' },
      strip: defaultStrip({ level: 0.7, pan: -0.15 }),
      clips: [clip('bass-1', 'bass-line', 4, 8)],
    },
  ]
  return score
}

// --- The running demo -----------------------------------------------------------

/** Advance the mock clock like a running context and feed the analysers. */
function animateMock(ctx: MockAudioContext, engine: Engine): () => void {
  let last = performance.now()
  const clock = setInterval(() => {
    const now = performance.now()
    ctx.currentTime += (now - last) / 1000
    last = now
  }, 20)
  let frame = 0
  const levels = new Map<number, number>()
  const step = (): void => {
    const playing = engine.transport.state === 'playing'
    const t = ctx.currentTime
    ctx.analysers.forEach((analyser, index) => {
      const previous = levels.get(index) ?? 0
      const target = playing
        ? 0.08 +
          0.55 *
            Math.abs(Math.sin(t * (1.3 + index * 0.37) + index)) *
            (0.75 + 0.25 * Math.random())
        : 0
      const next = target > previous ? target : previous * 0.85
      levels.set(index, next)
      analyser.level = Math.min(1, next)
    })
    frame = requestAnimationFrame(step)
  }
  frame = requestAnimationFrame(step)
  return () => {
    clearInterval(clock)
    cancelAnimationFrame(frame)
  }
}

async function follow(
  engine: Engine,
  wasm: boolean,
): Promise<Omit<Demo, 'mode' | 'dispose' | 'engine'>> {
  const document = new ScoreDocument(demoScore(wasm))
  const renderer = loadScore(engine, document, {
    resolveSource: resolveTone(engine.context.sampleRate),
    onError: (error) => console.error('playground: score render failed', error),
  })
  await renderer.whenIdle()
  const agent = new AgentController({
    engine,
    document,
    roles: { music: MUSIC_ROLE },
    library: DEMO_LIBRARY,
    author: { id: 'console', kind: 'agent' },
  })
  agent.grantConsent('arrange')
  agent.grantConsent('structure')
  const session = new Session({ document, engine })
  const byName = (name: string): AudioTrack => engine.track(name)
  return {
    document,
    renderer,
    agent,
    session,
    tracks: ['pad', 'keys', 'drums', 'bass'].map(byName),
    returns: [...engine.returnTracks],
  }
}

export async function createDemo(mode: DemoMode): Promise<Demo> {
  if (mode === 'mock') {
    const ctx = createMockContext({ sampleRate: 48_000 })
    const engine = createEngine({
      context: asAudioContext(ctx),
      master: { meter: true },
      samples: { peaks: 256 },
      devices: demoRegistry(false),
    })
    const session = await follow(engine, false)
    const stop = animateMock(ctx, engine)
    return {
      mode,
      engine,
      ...session,
      dispose: () => {
        stop()
        session.session.dispose()
        session.agent.dispose()
        engine.dispose()
      },
    }
  }
  const context = new AudioContext({ latencyHint: 'interactive' })
  const engine = createEngine({
    context,
    master: { meter: true },
    samples: { peaks: 256 },
    devices: demoRegistry(true),
  })
  await engine.activateOutput()
  const session = await follow(engine, true)
  return {
    mode,
    engine,
    ...session,
    dispose: () => {
      session.session.dispose()
      session.agent.dispose()
      engine.dispose()
      void context.close()
    },
  }
}

// --- Offline bounce ---------------------------------------------------------------

export interface DemoRender {
  result: RenderResult
  /** Sample peak of the bounce in dBFS (−∞ for silence). */
  peakDb: number
  /** Whole-mix latency the render was aligned to, in samples. */
  alignedSamples: number
}

/**
 * Bounce the demo's document offline (U33): `renderScore` on an
 * `OfflineAudioContext` with the WASM devices — worklets run offline in
 * Chromium and Firefox — so the bounce is the same score the engine on screen
 * follows, agent edits included. The result's engine is disposed here; only the
 * audio survives.
 */
export async function renderDemo(
  document: ScoreDocument,
  durationSec = LOOP_SEC,
): Promise<DemoRender> {
  const sampleRate = 48_000
  const result = await renderScore(document.score, {
    durationSec,
    sampleRate,
    engine: { samples: { peaks: false }, devices: demoRegistry(true) },
    renderer: { resolveSource: resolveTone(sampleRate), devices: demoRegistry(true) },
  })
  let peak = 0
  for (const channel of result.audio.channels) {
    for (let i = 0; i < channel.length; i += 1) peak = Math.max(peak, Math.abs(channel[i]))
  }
  result.engine.dispose()
  return {
    result,
    peakDb: peak > 0 ? 20 * Math.log10(peak) : -Infinity,
    alignedSamples: result.latency.maxArrivalSamples,
  }
}
