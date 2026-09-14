// Render-equals-live: driving an Engine from a Score through the renderer
// must produce exactly the graph, node order and AudioParam event stream that
// an app gets by calling the engine API by hand. Both paths run on the
// recording mocks against the same clock and timers; the snapshots are
// compared node for node, then again after a burst of edits applied through
// operations on one side and imperative calls on the other.

import { describe, expect, it, vi } from 'vitest'

import {
  MockAudioBuffer,
  MockAudioNode,
  MockAudioParam,
  MockBiquadFilterNode,
  MockBufferSource,
  asAudioContext,
  createMockContext,
  type MockAudioContext,
} from '../../testing'
import { deviceParamTarget } from '../../core/automation/ModMatrix'
import { Lfo } from '../../core/automation/Modulator'
import { ParamLane } from '../../core/automation/ParamLane'
import { LEVEL_RAMP_SECONDS } from '../../core/buses/Bus'
import { devices } from '../../core/devices'
import { createEngine, type Engine } from '../../core/Engine'
import { loadScore } from '../loadScore'
import { ScoreDocument } from '../ScoreDocument'
import { type ScoreRenderer } from '../ScoreRenderer'
import { demoScore } from './fixtures'

type Timer = { cb: () => void; ms: number }

function fakeTimers() {
  const intervals = new Map<number, Timer>()
  let next = 1
  return {
    setIntervalFn: vi.fn((cb: () => void, ms: number) => {
      const id = next++
      intervals.set(id, { cb, ms })
      return id as unknown as ReturnType<typeof setInterval>
    }),
    clearIntervalFn: vi.fn((id: ReturnType<typeof setInterval>) => {
      intervals.delete(id as unknown as number)
    }),
    fireAll() {
      for (const timer of [...intervals.values()]) timer.cb()
    },
  }
}

interface Rig {
  ctx: MockAudioContext
  engine: Engine
  timers: ReturnType<typeof fakeTimers>
}

async function rig(): Promise<Rig> {
  const ctx = createMockContext({ sampleRate: 48000 })
  const timers = fakeTimers()
  const engine = createEngine({ context: asAudioContext(ctx), ...timers, tickMs: 40 })
  const seconds = (n: number) => new MockAudioBuffer(2, n * 48000, 48000) as unknown as AudioBuffer
  await engine.samples.load('a', seconds(10))
  await engine.samples.load('b', seconds(10))
  return { ctx, engine, timers }
}

/** Everything the mocks recorded, with node identities replaced by creation index. */
function snapshot(ctx: MockAudioContext): unknown[] {
  const nodes = ctx.allNodes()
  const index = new Map<MockAudioNode, number>(nodes.map((node, position) => [node, position]))
  const ref = (value: unknown): unknown => {
    if (value instanceof MockAudioNode) return `#${index.get(value) ?? '?'}`
    if (value instanceof MockAudioParam) return 'param'
    return value
  }
  return nodes.map((node) => {
    const params: Record<string, unknown[][]> = {}
    for (const [key, value] of Object.entries(node)) {
      if (value instanceof MockAudioParam) {
        params[key] = value.events.map((event) => [event.method, ...event.args])
      }
    }
    const record: Record<string, unknown> = {
      kind: node.kind,
      connects: node.connectCalls.calls.map((call) => call.map(ref)),
      disconnects: node.disconnectCalls.calls.map((call) => call.map(ref)),
      params,
    }
    if (node instanceof MockBufferSource) {
      record.starts = node.startCalls.calls
      record.stops = node.stopCalls.calls
      record.loop = [node.loop, node.loopStart, node.loopEnd, node.buffer?.length]
    }
    if (node instanceof MockBiquadFilterNode) record.type = node.type
    return record
  })
}

function play(rig: Rig, steps: number, stepSec = 0.5): void {
  for (let step = 0; step < steps; step += 1) {
    rig.ctx.advanceClock(stepSec)
    rig.timers.fireAll()
  }
}

// --- The document path ------------------------------------------------------------------

async function documentPath(): Promise<Rig & { document: ScoreDocument; renderer: ScoreRenderer }> {
  const r = await rig()
  const document = new ScoreDocument(demoScore(), { now: () => 0 })
  const renderer = loadScore(r.engine, document, {
    onError: (error) => {
      throw error
    },
  })
  await renderer.whenIdle()
  return { ...r, document, renderer }
}

// --- The live path: what an app writes by hand for the same arrangement --------------------

async function livePath(): Promise<Rig & { edit: () => void }> {
  const r = await rig()
  const { engine } = r
  const score = demoScore()

  // Master.
  engine.master.setLevel(0.9)
  const glue = await devices.create('compressor', engine.context, { preset: 'Glue', params: {} })
  engine.master.addInsert(glue)

  // Groups, returns, tracks.
  const drums = engine.addGroup('drums', { destination: engine.master })
  const verb = await devices.create('convolver-reverb', engine.context, { params: { wet: 0.3 } })
  const hall = engine.addReturnTrack('hall', { device: verb, destination: engine.master })
  const kick = engine.addAudioTrack('kick', { destination: drums })
  const pad = engine.addAudioTrack('pad', { destination: engine.master })
  const voice = engine.addLiveInputTrack('voice', { destination: engine.master })

  // Strips.
  kick.strip.setLevel(0.8)
  kick.strip.setPan(-0.2)
  pad.strip.setMute(true)
  drums.strip.setLevel(0.9)

  // Inserts.
  const filter = await devices.create('filter', engine.context, { params: { frequency: 2000 } })
  kick.strip.addInsert(filter)

  // Sends.
  kick.strip.sends.add(hall, { level: 0.25 })
  voice.strip.sends.add(hall)

  // Clips.
  const kickScore = score.tracks[0]
  const padScore = score.tracks[1]
  if (kickScore.kind !== 'audio' || padScore.kind !== 'audio') throw new Error('fixture')
  kick.clips.set(kickScore.clips)
  pad.clips.set(padScore.clips)

  // Automation: a lane on the pad fader, an LFO on the filter cutoff.
  const lfo = new Lfo({ rateHz: 0.5, shape: 'sine', depth: 1, phase: 0, startSec: 0 })
  const lane = new ParamLane({
    breakpoints: score.lanes[0].breakpoints,
    min: 0,
    max: Number.POSITIVE_INFINITY,
  })
  engine.automation.add(lane, pad.strip.fader.gain)
  engine.modulation.map(lfo, deviceParamTarget(filter, 'frequency', { base: 2000 }), {
    depth: 0.3,
    polarity: 'bipolar',
  })

  const edit = (): void => {
    kick.strip.setLevel(0.6)
    pad.strip.setMute(false)
    filter.setParam('q', 2)
    const send = kick.strip.sends.all()[0]
    send.gainNode?.gain.setTargetAtTime(0.4, engine.now(), LEVEL_RAMP_SECONDS)
    kick.clips.update('b1', { startSec: 6 })
  }
  return { ...r, edit }
}

describe('golden: rendering a score equals driving the engine by hand', () => {
  it('builds the same graph, in the same node order, with the same AudioParam events', async () => {
    const doc = await documentPath()
    const live = await livePath()
    expect(doc.ctx.allNodes().length).toBeGreaterThan(20)
    expect(snapshot(doc.ctx)).toEqual(snapshot(live.ctx))
  })

  it('plays the same: clip starts, lane writes and modulation ramps agree tick for tick', async () => {
    const doc = await documentPath()
    const live = await livePath()
    for (const r of [doc, live]) {
      r.engine.transport.start()
      play(r, 6)
    }
    const before = snapshot(doc.ctx)
    expect(before).toEqual(snapshot(live.ctx))
    // Not vacuous: sources started, the lane wrote the pad fader, the LFO moved the cutoff.
    expect(doc.ctx.sources.length).toBe(2)
    const padFader = doc.ctx.gains.find((gain) =>
      gain.gain.events.some(
        (e) => e.method === 'linearRampToValueAtTime' && gain !== doc.ctx.gains[0],
      ),
    )
    expect(padFader).toBeDefined()
    const cutoff = doc.ctx.filters[0].frequency.events
    expect(cutoff.filter((e) => e.method === 'linearRampToValueAtTime').length).toBeGreaterThan(3)
  })

  it('stays equal through edits: operations on the document, imperative calls on the engine', async () => {
    const doc = await documentPath()
    const live = await livePath()
    for (const r of [doc, live]) {
      r.engine.transport.start()
      play(r, 6)
    }
    doc.document.apply({ type: 'strip.set', owner: 'kick', param: 'level', value: 0.6 })
    doc.document.apply({ type: 'strip.mute', owner: 'pad', mute: false })
    doc.document.apply({ type: 'device.setParam', device: 'kick-filter', param: 'q', value: 2 })
    doc.document.apply({ type: 'send.set', owner: 'kick', target: 'hall', level: 0.4 })
    doc.document.apply({ type: 'clip.move', track: 'kick', id: 'b1', startSec: 6 })
    await doc.renderer.whenIdle()
    live.edit()
    expect(snapshot(doc.ctx)).toEqual(snapshot(live.ctx))

    for (const r of [doc, live]) {
      play(r, 10)
      r.engine.stop({ fadeSec: 0.5 })
      play(r, 1)
    }
    expect(snapshot(doc.ctx)).toEqual(snapshot(live.ctx))
    expect(doc.engine.transport.state).toBe('stopped')
    // The moved clip started at its new position on both sides.
    expect(doc.ctx.sources.length).toBe(3)
    const kickSend = doc.ctx.gains.find((gain) =>
      gain.gain.events.some((e) => e.method === 'setTargetAtTime' && e.args[0] === 0.4),
    )
    expect(kickSend).toBeDefined()
  })
})
