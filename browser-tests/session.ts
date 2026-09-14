// The scripted session both sides of the real-audio golden build: the browser
// (real AudioContext / OfflineAudioContext, real worklets and WASM) and Node
// (the recording mocks). Deterministic by construction — every sample is
// synthesised here, so the arrangement is the only input — and library-agnostic:
// the caller passes the engine and the two factories it needs, so this module
// bundles into the page and imports into Node without touching either build.

import type { Engine } from '../src/core/Engine'
import type { Clip } from '../src/core/clips/Clip'
import type { Device } from '../src/core/devices/Device'
import type { ParamLane, ParamLaneOptions } from '../src/core/automation/ParamLane'

export interface SessionSpec {
  sampleRate: number
  /** Seconds of arrangement to render / capture. */
  durationSec: number
  /** Send level from `music` into the Dattorro return; 0 leaves the return silent. Default 0.35. */
  reverbSend?: number
  /** Drive the voice fader from a lane (0.8 → 0.2 over 2–3.5 s). Default true. */
  lane?: boolean
}

export interface SessionDeps {
  /** A Dattorro reverb on the engine's context (real, or mock + wasm bytes in Node). */
  createReverb: (ctx: BaseAudioContext) => Promise<Device>
  createLane: (options: ParamLaneOptions) => ParamLane
}

export const DEFAULT_SESSION: SessionSpec = { sampleRate: 48000, durationSec: 4 }

/** A stereo buffer of a sine at `hz` with a click every 0.5 s, `seconds` long. */
export function toneBuffer(
  ctx: BaseAudioContext,
  hz: number,
  seconds: number,
  gain = 0.5,
): AudioBuffer {
  const frames = Math.round(seconds * ctx.sampleRate)
  const buffer = ctx.createBuffer(2, frames, ctx.sampleRate)
  const left = buffer.getChannelData(0)
  const right = buffer.getChannelData(1)
  const clickEvery = Math.round(0.5 * ctx.sampleRate)
  for (let i = 0; i < frames; i += 1) {
    const phase = (2 * Math.PI * hz * i) / ctx.sampleRate
    const click = i % clickEvery < 48 ? 0.4 : 0
    left[i] = gain * Math.sin(phase) + click
    right[i] = gain * Math.sin(phase * 1.005) + click
  }
  return buffer
}

function clip(id: string, sourceId: string, startSec: number, extra: Partial<Clip> = {}): Clip {
  return {
    id,
    sourceId,
    startSec,
    offsetSec: 0,
    durationSec: 2,
    fadeInSec: 0.25,
    fadeOutSec: 0.5,
    fadeCurve: 'equalPower',
    gainDb: -3,
    ...extra,
  }
}

/**
 * Two clip tracks (a crossfade on `music`, a later linear-fade `voice`), a
 * fader lane on `voice`, and a send from `music` into a Dattorro return — so
 * the graph exercises sources, envelopes, the strip, automation and a WASM
 * device in a worklet.
 */
export async function buildSession(
  engine: Engine,
  spec: SessionSpec,
  deps: SessionDeps,
): Promise<void> {
  const ctx = engine.context
  const music = engine.addAudioTrack('music', { lookaheadSec: 1 })
  const voice = engine.addAudioTrack('voice', { lookaheadSec: 1 })
  await engine.samples.load('tone-a', toneBuffer(ctx, 220, 6))
  await engine.samples.load('tone-b', toneBuffer(ctx, 330, 6))
  await engine.samples.load('tone-v', toneBuffer(ctx, 660, 6, 0.3))

  music.clips.add(clip('a', 'tone-a', 0))
  music.clips.add(clip('b', 'tone-b', 1.5))
  voice.clips.add(clip('v', 'tone-v', 2, { fadeCurve: 'linear', gainDb: 0, durationSec: 1.5 }))

  voice.strip.setLevel(0.8, { at: 0 })
  music.strip.setPan(-0.3, { at: 0 })

  const hall = engine.addReturnTrack('hall', { device: await deps.createReverb(ctx) })
  music.strip.sends.add(hall, { level: spec.reverbSend ?? 0.35 })

  if (spec.lane ?? true) {
    const lane = deps.createLane({
      breakpoints: [
        { timeSec: 2, value: 0.8 },
        { timeSec: 3.5, value: 0.2 },
      ],
    })
    engine.automation.add(lane, voice.strip.fader.gain)
  }
}
