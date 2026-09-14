// The demo session: four tracks, a group, a return with a delay, a few insert
// devices, sends and clips over synthesised tones. It runs on the library's
// recording mock context by default — so the page renders without an audio
// permission and headless — and on a real AudioContext when asked. In mock
// mode the clock is advanced by a timer and the analysers are fed levels so
// meters and the playhead move.

import {
  createEngine,
  type Engine,
  type Clip,
  type ReturnTrack,
  type AudioTrack,
} from '@kieranklaassen/live-mix'
import {
  asAudioContext,
  createMockContext,
  type MockAudioContext,
} from '@kieranklaassen/live-mix/testing'

export type DemoMode = 'mock' | 'live'

export interface Demo {
  mode: DemoMode
  engine: Engine
  tracks: AudioTrack[]
  returns: ReturnTrack[]
  dispose(): void
}

const LOOP_SEC = 16

interface Tone {
  id: string
  frequencies: number[]
  durationSec: number
  kind: 'pad' | 'pluck' | 'noise' | 'bass'
}

const TONES: Tone[] = [
  { id: 'pad-Cmaj', frequencies: [261.63, 329.63, 392.0, 523.25], durationSec: 8, kind: 'pad' },
  { id: 'pad-Fmaj', frequencies: [174.61, 220.0, 261.63, 349.23], durationSec: 8, kind: 'pad' },
  { id: 'keys-arp', frequencies: [523.25, 659.25, 783.99, 1046.5], durationSec: 4, kind: 'pluck' },
  { id: 'drums-loop', frequencies: [60], durationSec: 2, kind: 'noise' },
  { id: 'bass-line', frequencies: [65.41, 87.31], durationSec: 8, kind: 'bass' },
]

/** Fill an AudioBuffer (real or mock) with a tone so waveforms have a shape. */
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

async function buildSession(
  engine: Engine,
): Promise<{ tracks: AudioTrack[]; returns: ReturnTrack[] }> {
  const { context } = engine
  for (const tone of TONES) {
    const buffer = context.createBuffer(
      2,
      Math.floor(tone.durationSec * context.sampleRate),
      context.sampleRate,
    )
    synthesize(buffer, tone)
    await engine.samples.load(tone.id, buffer)
  }

  const pad = engine.addAudioTrack('pad')
  const keys = engine.addAudioTrack('keys')
  const drums = engine.addAudioTrack('drums')
  const bass = engine.addAudioTrack('bass')
  engine.addGroup('rhythm', { members: [drums, bass] })

  const hall = engine.addReturnTrack('hall', {
    device: await engine.devices.create('delay', context, {
      params: { timeSec: 0.375, feedback: 0.35, mix: 1 },
    }),
  })

  pad.strip.addInsert(
    await engine.devices.create('filter', context, { params: { frequency: 2400, q: 0.9 } }),
  )
  keys.strip.addInsert(await engine.devices.create('eq3', context))
  drums.strip.addInsert(await engine.devices.create('compressor', context))
  pad.strip.sends.add(hall, { level: 0.4 })
  keys.strip.sends.add(hall, { level: 0.25 })

  pad.strip.setLevel(0.8)
  keys.strip.setLevel(0.6)
  keys.strip.setPan(0.3)
  drums.strip.setLevel(0.9)
  bass.strip.setLevel(0.7)
  bass.strip.setPan(-0.15)
  hall.strip.setLevel(0.5)

  pad.clips.add(clip('pad-1', 'pad-Cmaj', 0, 8))
  pad.clips.add(clip('pad-2', 'pad-Fmaj', 8, 8))
  keys.clips.add(clip('keys-1', 'keys-arp', 2, 4))
  keys.clips.add(clip('keys-2', 'keys-arp', 10, 4))
  drums.clips.add(clip('drums-1', 'drums-loop', 0, LOOP_SEC, { loop: true }))
  bass.clips.add(clip('bass-1', 'bass-line', 4, 8))

  engine.transport.setLoop({ enabled: true, lengthSec: LOOP_SEC })
  return { tracks: [pad, keys, drums, bass], returns: [hall] }
}

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

export async function createDemo(mode: DemoMode): Promise<Demo> {
  if (mode === 'mock') {
    const ctx = createMockContext({ sampleRate: 48_000 })
    const engine = createEngine({
      context: asAudioContext(ctx),
      master: { meter: true },
      samples: { peaks: 256 },
    })
    const session = await buildSession(engine)
    const stop = animateMock(ctx, engine)
    return {
      mode,
      engine,
      ...session,
      dispose: () => {
        stop()
        engine.dispose()
      },
    }
  }
  const context = new AudioContext({ latencyHint: 'interactive' })
  const engine = createEngine({ context, master: { meter: true }, samples: { peaks: 256 } })
  await engine.activateOutput()
  const session = await buildSession(engine)
  return {
    mode,
    engine,
    ...session,
    dispose: () => {
      engine.dispose()
      void context.close()
    },
  }
}
