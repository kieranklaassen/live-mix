// One score, two renderers (R22, AE6): a compiled script loaded on a live
// engine (real clock, timer-driven scheduler and lane writers) and bounced
// through `renderScore` must hand the graph the same source starts/stops and
// AudioParam events. Then the timing the mocks recorded is checked against
// the compiled timeline: crossfade overlaps, duck dips at cue times.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  MockAudioBuffer,
  advance,
  asAudioContext,
  configureMocks,
  createMockContext,
  createMockOfflineContext,
  scheduleSnapshotOf,
  type MockOfflineAudioContext,
  type ScheduleSnapshot,
} from '../../../testing'
import { type OfflineContextFactory } from '../../../core/render/OfflineRenderer'
import { readWavInfo } from '../../../core/render/encode'
import { dbToGain } from '../../../core/devices/native/units'
import { CROSSFADE_SECONDS } from '../../../core/tracks/AudioTrack'
import { createEngine } from '../../../core/Engine'
import { loadScore } from '../../../score/loadScore'
import { renderScore, renderableScore } from '../../../score/renderScore'
import { type Score, type ScoreSource } from '../../../score/schema'
import {
  SCRIPT_DUCK_DB,
  SCRIPT_MUSIC_DB,
  compileScriptDetailed,
  type CompiledScript,
} from '../compile'
import { renderScriptToWav } from '../render'
import { shortLibrary, shortScript } from './fixtures'

const SAMPLE_RATE = 48000

/** A one-cue-per-part script: enough for the schedule comparison, quick to simulate. */
function compiled(): CompiledScript {
  const script = shortScript()
  script.sections.forEach((section) => {
    section.durationSec = 60
    section.cues = section.cues.slice(0, 2).map((cue, index) => ({ ...cue, atSec: index * 25 }))
    if (section.holds)
      section.holds = [
        { atSec: 30, durationSec: 12, kind: 'inhale' },
        { atSec: 46, durationSec: 10, kind: 'exhale' },
      ]
    if (section.role === 'active') section.cues[1].kind = 'sound-release'
  })
  script.sections[2].cues[1].kind = 'closing'
  return compileScriptDetailed(script, shortLibrary(), {
    breathGuide: { source: { id: 'noise', url: '/noise.mp3', durationSec: 4 } },
  })
}

function bufferFor(source: ScoreSource): AudioBuffer {
  const seconds = source.durationSec ?? 10
  return new MockAudioBuffer(
    2,
    Math.round(seconds * SAMPLE_RATE),
    SAMPLE_RATE,
  ) as unknown as AudioBuffer
}

let contexts: MockOfflineAudioContext[] = []
const factory: OfflineContextFactory = ({ numberOfChannels, length, sampleRate }) => {
  const ctx = createMockOfflineContext({ numberOfChannels, length, sampleRate })
  contexts.push(ctx)
  return ctx as unknown as ReturnType<OfflineContextFactory>
}

beforeEach(() => {
  contexts = []
  vi.useFakeTimers()
  configureMocks({ advanceTimers: vi.advanceTimersByTimeAsync })
})
afterEach(() => {
  configureMocks({})
  vi.useRealTimers()
})

async function liveSnapshot(score: Score, seconds: number) {
  const live = createMockContext({ sampleRate: SAMPLE_RATE })
  const engine = createEngine({ context: asAudioContext(live), tickMs: 50 })
  const renderer = loadScore(engine, renderableScore(score), { resolveSource: bufferFor })
  await renderer.whenIdle()
  for (const source of score.sources) await engine.samples.load(source.id, bufferFor(source))
  engine.transport.start(0)
  await advance(live, seconds)
  const snapshot = scheduleSnapshotOf(live)
  const gains = live.gains.map((gain) =>
    gain.gain.events.map((e) => [e.method, ...e.args] as const),
  )
  engine.dispose()
  return { snapshot, gains }
}

describe('golden: a compiled script renders live and offline identically', () => {
  it('schedules the same sources and AudioParam events on both renderers', async () => {
    const session = compiled()
    const seconds = Math.ceil(session.durationSec) + 1
    const live = await liveSnapshot(session.score, seconds)
    await renderScore(session.score, {
      durationSec: seconds,
      sampleRate: SAMPLE_RATE,
      tickSec: 0.05,
      createContext: factory,
      renderer: { resolveSource: bufferFor },
    })
    const offline: ScheduleSnapshot = contexts[0].scheduleSnapshot()
    const clipCount = session.score.tracks.reduce(
      (n, track) => n + (track.kind === 'audio' ? track.clips.length : 0),
      0,
    )
    expect(offline.sources.length).toBe(clipCount)
    expect(offline.sources).toEqual(live.snapshot.sources)
    expect(offline.params).toEqual(live.snapshot.params)
    // Not vacuous: the duck lane and the breath lane both wrote automation.
    const laneWrites = offline.params.filter((p) =>
      p.events.some((e) => e.method === 'linearRampToValueAtTime'),
    )
    expect(laneWrites.length).toBeGreaterThanOrEqual(2)
  }, 30_000)

  it('renders deterministically and encodes to a WAV of the session length', async () => {
    const script = shortScript()
    const library = shortLibrary()
    const a = await renderScriptToWav(script, library, {
      render: { createContext: factory, renderer: { resolveSource: bufferFor }, sampleRate: 8000 },
    })
    const b = await renderScriptToWav(script, library, {
      render: { createContext: factory, renderer: { resolveSource: bufferFor }, sampleRate: 8000 },
    })
    expect(contexts[0].scheduleSnapshot()).toEqual(contexts[1].scheduleSnapshot())
    const info = readWavInfo(a.wav)
    expect(info.sampleRate).toBe(8000)
    expect(info.channelCount).toBe(2)
    expect(info.frames).toBe(Math.round(a.compiled.durationSec * 8000))
    expect(a.result.durationSec).toBeCloseTo(a.compiled.durationSec, 6)
    expect(b.wav.byteLength).toBe(a.wav.byteLength)
  }, 30_000)
})

describe('timing on the mocks', () => {
  it('starts every music clip a crossfade before the previous one ends, and the ducker dips at each cue', async () => {
    const session = compiled()
    const seconds = Math.ceil(session.durationSec) + 1
    const live = await liveSnapshot(session.score, seconds)
    const music = session.score.tracks[0]
    if (music.kind !== 'audio') throw new Error('fixture')
    // Source starts, in schedule order, carry the clips' timeline starts (context time 0 = position 0).
    const starts = live.snapshot.sources
      .map((source) => source.start[0]?.[0] as number)
      .filter((when) => when !== undefined)
      .sort((a, b) => a - b)
    for (const clip of music.clips) {
      expect(starts.some((when) => Math.abs(when - clip.startSec) < 1e-6)).toBe(true)
    }
    music.clips.slice(1).forEach((clip, index) => {
      const previous = music.clips[index]
      expect(previous.startSec + previous.durationSec - clip.startSec).toBeCloseTo(
        CROSSFADE_SECONDS,
        6,
      )
    })

    // The duck lane: the music fader ramps to base · depth at every cue's start.
    const base = dbToGain(SCRIPT_MUSIC_DB)
    const ducked = base * dbToGain(SCRIPT_DUCK_DB)
    const isRampTo = (e: readonly unknown[], value: number) =>
      e[0] === 'linearRampToValueAtTime' && Math.abs((e[1] as number) - value) < 1e-9
    const fader = live.gains.find((events) => events.some((e) => isRampTo(e, ducked))) ?? []
    expect(fader.length).toBeGreaterThan(0)
    const dips = fader.filter((e) => isRampTo(e, ducked)).map((e) => e[2] as number)
    for (const cue of session.cues) {
      expect(dips.some((at) => Math.abs(at - cue.atSec) < 1e-6)).toBe(true)
    }
    const returns = fader.filter((e) => isRampTo(e, base)).map((e) => e[2] as number)
    expect(returns.length).toBeGreaterThan(0)
    for (const at of returns) {
      expect(session.cues.some((cue) => at > cue.endSec)).toBe(true)
    }
  }, 30_000)
})
