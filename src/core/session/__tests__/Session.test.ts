import { describe, expect, it } from 'vitest'

import {
  MockAudioBuffer,
  asAudioContext,
  createMockContext,
  type MockAudioContext,
  type MockBufferSource,
} from '../../../testing'
import { createEngine, type Engine } from '../../Engine'
import { seededRandom } from '../../../score/__tests__/fixtures'
import { loadScore } from '../../../score/loadScore'
import { type Operation } from '../../../score/operations'
import { createScore, defaultStrip, masterDestination, type Score } from '../../../score/schema'
import { ScoreDocument } from '../../../score/ScoreDocument'
import { type ScoreRenderer } from '../../../score/ScoreRenderer'
import { TempoMap } from '../../time/TempoMap'
import { type ScoreFollowAction } from '../followActions'
import { Session, type SessionOptions } from '../Session'
import { defaultSlot, type ScoreSlot, type SlotClip } from '../Slot'

// 120 BPM 4/4: a bar is 2 s. The transport starts at audio-clock 100.
const START = 100

function slotClip(sourceId: string, overrides: Partial<SlotClip> = {}): SlotClip {
  return {
    sourceId,
    offsetSec: 0,
    durationSec: 4,
    fadeInSec: 0,
    fadeOutSec: 0,
    fadeCurve: 'linear',
    gainDb: 0,
    ...overrides,
  }
}

/** Two audio tracks, two scenes: kick has a loop in `verse` and a one-shot in `chorus`; pad has a loop in `verse` and a stop in `chorus`. */
function gridScore(): Score {
  const score = createScore({ id: 'set' })
  score.sources = [
    { id: 'a', durationSec: 10 },
    { id: 'b', durationSec: 10 },
  ]
  score.tracks = [
    {
      kind: 'audio',
      id: 'kick',
      name: 'Kick',
      destination: masterDestination(),
      strip: defaultStrip(),
      clips: [],
    },
    {
      kind: 'audio',
      id: 'pad',
      name: 'Pad',
      destination: masterDestination(),
      strip: defaultStrip(),
      clips: [],
    },
  ]
  score.scenes = [
    { id: 'verse', name: 'Verse' },
    { id: 'chorus', name: 'Chorus' },
  ]
  score.slots = [
    defaultSlot({
      id: 'kick-verse',
      track: 'kick',
      scene: 'verse',
      clip: slotClip('a', { loop: true }),
    }),
    defaultSlot({ id: 'kick-chorus', track: 'kick', scene: 'chorus', clip: slotClip('b') }),
    defaultSlot({
      id: 'pad-verse',
      track: 'pad',
      scene: 'verse',
      clip: slotClip('a', { loop: true }),
    }),
    defaultSlot({ id: 'pad-chorus', track: 'pad', scene: 'chorus', clip: null }),
  ]
  return score
}

interface Rig {
  ctx: MockAudioContext
  engine: Engine
  document: ScoreDocument
  renderer: ScoreRenderer
  session: Session
  /** Move the audio clock and run one scheduler pass (which ticks the session). */
  advance: (sec: number) => Promise<void>
  /** Let the renderer apply pending document changes to the engine. */
  settle: () => Promise<void>
  /** The arrangement clips on a track, by id. */
  clips: (track: string) => { id: string; startSec: number; durationSec: number }[]
  sources: () => MockBufferSource[]
  labels: () => string[]
}

async function rig(
  options: Partial<SessionOptions> = {},
  edit: (score: Score) => void = () => {},
): Promise<Rig> {
  const ctx = createMockContext({ sampleRate: 48_000, currentTime: START })
  const engine = createEngine({
    context: asAudioContext(ctx),
    setIntervalFn: () => 0 as unknown as ReturnType<typeof setInterval>,
    clearIntervalFn: () => {},
  })
  const buffer = new MockAudioBuffer(2, 48_000 * 10, 48_000) as unknown as AudioBuffer
  await engine.samples.load('a', buffer)
  await engine.samples.load('b', buffer)
  const score = gridScore()
  edit(score)
  const document = new ScoreDocument(score, { now: () => 0 })
  const renderer = loadScore(engine, document, {
    onError: (error) => {
      throw error
    },
  })
  await renderer.whenIdle()
  // No `tempo` option: the session reads the document's tempo map (120 BPM, 4/4 by default).
  const session = new Session({ document, engine, random: seededRandom(1), ...options })
  const settle = (): Promise<void> => renderer.whenIdle()
  // Microtasks (the renderer applying an edit) run before the next timer tick
  // does, so pending document changes reach the engine before the clock moves.
  const advance = async (sec: number): Promise<void> => {
    await settle()
    ctx.advanceClock(sec)
    engine.scheduler.tick('timer')
    await settle()
  }
  const clips = (track: string) => {
    const t = document.score.tracks.find((candidate) => candidate.id === track)
    if (t?.kind !== 'audio') return []
    return t.clips.map(({ id, startSec, durationSec }) => ({ id, startSec, durationSec }))
  }
  return {
    ctx,
    engine,
    document,
    renderer,
    session,
    advance,
    settle,
    clips,
    sources: () => ctx.sources,
    labels: () => document.history.undoStack.map((entry) => entry.label),
  }
}

function contextAt(sec: number): number {
  return START + sec
}

describe('Session: quantised launch', () => {
  it('AE3: a slot launched 300 ms before the bar starts on the bar, sample-accurately', async () => {
    const { engine, session, advance, sources, clips } = await rig()
    engine.transport.start()
    await advance(7.7)
    session.launchSlot('kick-verse')
    expect(session.status('kick-verse').state).toBe('queued')
    expect(clips('kick')).toEqual([{ id: 'kick-verse@1', startSec: 8, durationSec: 3600 }])
    await advance(0) // the renderer placed the clip; 8 s is still outside the 0.2 s window
    expect(sources()).toHaveLength(0)
    await advance(0.15) // 7.85: the start enters the window
    expect(sources()).toHaveLength(1)
    expect(sources()[0].startCalls.last).toEqual([contextAt(8), 0])
    expect(sources()[0].loop).toBe(true)
    expect(session.status('kick-verse').state).toBe('queued')
    await advance(0.2) // 8.05
    expect(session.status('kick-verse').state).toBe('playing')
    expect(session.trackStatus('kick')).toEqual({
      track: 'kick',
      playing: 'kick-verse',
      queued: null,
    })
    expect(session.cellState('kick', 'verse')).toBe('playing')
    expect(session.cellState('pad', 'chorus')).toBe('empty')
  })

  it('quantises per slot, per call, and to beats, n bars or seconds', async () => {
    const { engine, session, document, advance, clips } = await rig({}, (score) => {
      score.slots[1].quantize = 'beat'
    })
    engine.transport.start()
    await advance(7.7)
    session.launchSlot('kick-chorus') // slot override: next beat
    expect(clips('kick')[0].startSec).toBe(8)
    document.undo()
    await advance(0.05) // 7.75
    session.launchSlot('kick-chorus', { quantize: 4 }) // call override: next 4-bar line (8 s)
    expect(clips('kick')[0].startSec).toBe(8)
    document.undo()
    session.launchSlot('kick-chorus', { quantize: { seconds: 3 } })
    expect(clips('kick')[0].startSec).toBe(9)
    document.undo()
    session.setQuantize('none')
    expect(document.score.transport.quantize).toBe('none')
    session.launchSlot('pad-verse')
    // Immediate launches sit `immediateLeadSec` ahead so the scheduler cannot skip them.
    expect(clips('pad')[0].startSec).toBeCloseTo(7.75 + session.immediateLeadSec)
  })

  it('follows the document’s tempo map, and a tempo option overrides it', async () => {
    const { engine, session, document, advance, clips } = await rig()
    engine.transport.start()
    await advance(7.7)
    document.apply({ type: 'tempo.set', segments: [{ atSec: 0, bpm: 60 }] }) // bars of 4 s
    expect(session.tempo.bpmAt(0)).toBe(60)
    session.launchSlot('kick-verse')
    expect(clips('kick')[0].startSec).toBe(8)
    document.undo()
    document.apply({ type: 'tempo.set', segments: [{ atSec: 0, bpm: 240 }] }) // bars of 1 s
    session.launchSlot('kick-chorus')
    expect(clips('kick')).toEqual([{ id: 'kick-chorus@2', startSec: 8, durationSec: 4 }])
    await advance(0.5) // 8.2
    session.launchSlot('kick-verse')
    expect(clips('kick')[1].startSec).toBe(9)

    const fixed = await rig({ tempo: TempoMap.constant(30) }) // bars of 8 s
    fixed.engine.transport.start()
    await fixed.advance(1)
    fixed.document.apply({ type: 'tempo.set', segments: [{ atSec: 0, bpm: 240 }] })
    fixed.session.launchSlot('kick-verse')
    expect(fixed.clips('kick')[0].startSec).toBe(8)
  })

  it('a grid line already reached launches with the immediate lead, not at the next line', async () => {
    const { engine, session, advance, clips } = await rig({ immediateLeadSec: 0.02 })
    engine.transport.start()
    await advance(8) // exactly on bar 4
    session.launchSlot('kick-verse')
    expect(clips('kick')[0].startSec).toBeCloseTo(8.02)
  })

  it('starts a stopped transport when autoStart is on, and leaves it alone when off', async () => {
    const { engine, session, clips } = await rig()
    expect(engine.transport.state).toBe('stopped')
    session.launchSlot('kick-verse')
    expect(engine.transport.state).toBe('playing')
    expect(clips('kick')[0].startSec).toBeCloseTo(session.immediateLeadSec)

    const quiet = await rig({ autoStart: false })
    quiet.session.launchSlot('kick-verse')
    expect(quiet.engine.transport.state).toBe('stopped')
    expect(quiet.clips('kick')).toHaveLength(1)
  })

  it('wraps a launch past the loop end into the next pass and stays queued until the seam', async () => {
    const { engine, session, advance, clips, sources } = await rig()
    engine.transport.setLoop({ enabled: true, lengthSec: 9 })
    engine.transport.start()
    await advance(8.5)
    session.launchSlot('kick-verse') // next bar is 10 s, past the 9 s loop: lands at 1 s of the next pass
    expect(clips('kick')[0].startSec).toBe(1)
    expect(session.status('kick-verse').state).toBe('queued')
    await advance(0.3) // 8.8: still this pass, still queued
    expect(session.status('kick-verse').state).toBe('queued')
    await advance(1.05) // 0.85 of pass 1: the start (1 s) is inside the window
    expect(session.status('kick-verse').state).toBe('queued')
    expect(sources()[0].startCalls.last).toEqual([contextAt(10), 0])
    await advance(0.3) // 1.15
    expect(session.status('kick-verse').state).toBe('playing')
    // Stopping a launch that is still in the next pass withdraws it.
    session.launchSlot('kick-chorus', { quantize: { seconds: 9 } }) // 9 → wraps to 0 of pass 2
    expect(session.status('kick-chorus').state).toBe('queued')
    session.stopSlot('kick-chorus')
    expect(clips('kick').some((clip) => clip.id.startsWith('kick-chorus'))).toBe(false)
  })
})

describe('Session: stopping', () => {
  it('stop trims the placed clip to the boundary and fades the sounding voice there', async () => {
    const { engine, session, advance, sources, clips } = await rig()
    engine.transport.start()
    await advance(7.7)
    session.launchSlot('kick-verse')
    await advance(0.3) // 8: the start is handed over
    await advance(1.3) // 9.3
    const voice = sources()[0]
    expect(voice.stopCalls.last).toEqual([contextAt(8) + 3600])
    session.stopSlot('kick-verse')
    expect(session.status('kick-verse')).toMatchObject({
      state: 'playing',
      stopping: true,
      endSec: 10,
    })
    expect(clips('kick')).toEqual([{ id: 'kick-verse@1', startSec: 8, durationSec: 2 }])
    // The live voice: gain cancelled just before the boundary, ramp to 0 at it, source stopped at it.
    expect(voice.stopCalls.last).toEqual([contextAt(10)])
    const gain = engine.track('kick').voice(`kick-verse@1:0:8.000`)?.gain as unknown as {
      gain: { events: { method: string; args: unknown[] }[] }
    }
    const ramp = gain.gain.events.filter((event) => event.method === 'linearRampToValueAtTime')
    expect(ramp[ramp.length - 1].args).toEqual([0, contextAt(10)])
    await advance(0.8) // 10.1
    expect(session.status('kick-verse').state).toBe('stopped')
    expect(session.trackStatus('kick').playing).toBeNull()
  })

  it('stopping a queued launch withdraws its clip before anything sounds', async () => {
    const { engine, session, advance, sources, clips } = await rig()
    engine.transport.start()
    await advance(6.1)
    session.launchSlot('kick-verse') // at 8
    session.stopSlot('kick-verse') // next bar is also 8: nothing to play
    expect(clips('kick')).toEqual([])
    expect(session.status('kick-verse').state).toBe('stopped')
    await advance(2.5)
    expect(sources()).toHaveLength(0)
  })

  it('the clip fade-out is applied before the boundary; a zero fade de-clicks minimally', async () => {
    const { engine, session, advance, sources } = await rig({}, (score) => {
      score.slots[2].clip = slotClip('a', { loop: true, fadeOutSec: 0.5 })
    })
    engine.transport.start()
    await advance(7.9)
    session.launchScene('verse')
    await advance(0.2) // 8.1: both started
    expect(engine.track('kick').voices()).toHaveLength(1)
    expect(engine.track('pad').voices()).toHaveLength(1)
    await advance(1) // 9.1
    session.stopAll() // at 10
    const kick = engine.track('kick').voices()[0]
    const pad = engine.track('pad').voices()[0]
    expect((kick.source as unknown as MockBufferSource).stopCalls.last).toEqual([contextAt(10)])
    expect((pad.source as unknown as MockBufferSource).stopCalls.last).toEqual([contextAt(10)])
    const events = (voice: typeof pad): { method: string; args: unknown[] }[] =>
      (voice.gain as unknown as { gain: { events: { method: string; args: unknown[] }[] } }).gain
        .events
    const cancels = (voice: typeof pad): number[] =>
      events(voice)
        .filter((event) => event.method === 'cancelScheduledValues')
        .map((event) => event.args[0] as number)
    // The pad's 0.5 s fade starts half a second before the boundary; the kick's 5 ms de-click just before it.
    expect(cancels(pad).at(-1)).toBeCloseTo(contextAt(9.5))
    expect(cancels(kick).at(-1)).toBeCloseTo(contextAt(10) - 0.005)
    expect(sources().length).toBeGreaterThanOrEqual(2)
  })

  it('stop-all and stop-track are one undo step each and quantised', async () => {
    const { engine, session, document, advance, clips, labels } = await rig()
    engine.transport.start()
    await advance(7.9)
    session.launchScene('verse')
    await advance(1.2) // 9.1
    session.stopAll()
    expect(clips('kick')[0].durationSec).toBe(2)
    expect(clips('pad')[0].durationSec).toBe(2)
    expect(labels()).toEqual(['launch scene verse', 'stop all'])
    document.undo()
    expect(clips('kick')[0].durationSec).toBe(3600)
    expect(clips('pad')[0].durationSec).toBe(3600)
  })
})

describe('Session: one clip per track, legato, launch modes', () => {
  it('launching a second slot on a track closes the first at the new start', async () => {
    const { engine, session, advance, sources, clips } = await rig()
    engine.transport.start()
    await advance(7.9)
    session.launchSlot('kick-verse')
    await advance(0.2) // 8.1
    await advance(1) // 9.1
    session.launchSlot('kick-chorus') // at 10
    expect(session.trackStatus('kick')).toEqual({
      track: 'kick',
      playing: 'kick-verse',
      queued: 'kick-chorus',
    })
    expect(clips('kick')).toEqual([
      { id: 'kick-verse@1', startSec: 8, durationSec: 2 },
      { id: 'kick-chorus@2', startSec: 10, durationSec: 4 },
    ])
    await advance(0.8) // 9.9: chorus enters the window
    expect(sources()).toHaveLength(2)
    expect(sources()[0].stopCalls.last).toEqual([contextAt(10)])
    expect(sources()[1].startCalls.last).toEqual([contextAt(10), 0, 4])
    await advance(0.2) // 10.1
    expect(session.status('kick-verse').state).toBe('stopped')
    expect(session.status('kick-chorus').state).toBe('playing')
    await advance(4) // 14.1: the one-shot ended
    expect(session.status('kick-chorus').state).toBe('stopped')
    expect(session.trackStatus('kick').playing).toBeNull()
  })

  it('legato enters the new clip where the old one was', async () => {
    const { engine, session, advance, sources, clips } = await rig({}, (score) => {
      score.slots[1].legato = true
    })
    engine.transport.start()
    await advance(7.9)
    session.launchSlot('kick-verse') // loop of 4 s from 8
    await advance(0.2)
    await advance(1.5) // 9.6
    session.launchSlot('kick-chorus') // at 10: 2 s into the 4 s loop → chorus enters at 2 s, 2 s left
    expect(clips('kick')[1]).toEqual({ id: 'kick-chorus@2', startSec: 10, durationSec: 2 })
    await advance(0.3) // 9.9
    expect(sources()[1].startCalls.last).toEqual([contextAt(10), 2, 2])
  })

  it('legato into a one-shot with nothing left only closes the outgoing slot', async () => {
    const { engine, session, advance, clips } = await rig({}, (score) => {
      score.slots[1].legato = true
      score.slots[1].clip = slotClip('b', { durationSec: 1 })
    })
    engine.transport.start()
    await advance(7.9)
    session.launchSlot('kick-verse')
    await advance(1.3) // 9.2
    session.launchSlot('kick-chorus') // 2 s in; the 1 s one-shot has nothing left
    expect(clips('kick')).toEqual([{ id: 'kick-verse@1', startSec: 8, durationSec: 2 }])
    expect(session.status('kick-chorus').state).toBe('stopped')
  })

  it('trigger retriggers, toggle stops, gate stops on release', async () => {
    const { engine, session, advance, clips } = await rig({}, (score) => {
      score.slots[2].launchMode = 'toggle'
      score.slots[1].launchMode = 'gate'
    })
    engine.transport.start()
    await advance(7.9)
    session.launchSlot('kick-verse')
    session.launchSlot('pad-verse')
    session.releaseSlot('kick-verse') // trigger: ignored
    session.releaseSlot('pad-verse') // toggle: ignored
    await advance(1.2) // 9.1
    session.launchSlot('kick-verse') // trigger while playing: retrigger from the top at 10
    expect(clips('kick')).toEqual([
      { id: 'kick-verse@1', startSec: 8, durationSec: 2 },
      { id: 'kick-verse@3', startSec: 10, durationSec: 3600 },
    ])
    session.launchSlot('pad-verse') // toggle while playing: stop at 10
    expect(clips('pad')).toEqual([{ id: 'pad-verse@2', startSec: 8, durationSec: 2 }])
    expect(session.status('pad-verse').stopping).toBe(true)
    session.launchSlot('pad-verse') // toggle while stopping: launch again at 10
    expect(clips('pad')).toHaveLength(2)
    await advance(1) // 10.1
    session.launchSlot('kick-chorus') // gate: press launches at 12
    await advance(1) // 11.1
    session.releaseSlot('kick-chorus') // release before it started: withdrawn
    expect(clips('kick').some((clip) => clip.id.startsWith('kick-chorus'))).toBe(false)
    session.launchSlot('kick-chorus')
    await advance(1) // 12.1
    expect(session.status('kick-chorus').state).toBe('playing')
    await advance(0.5)
    session.releaseSlot('kick-chorus') // stops at 14
    expect(session.status('kick-chorus')).toMatchObject({ stopping: true, endSec: 14 })
  })

  it('an empty slot stops its track; launching a scene stops tracks with empty slots and skips others', async () => {
    const { engine, session, advance, clips, labels } = await rig({}, (score) => {
      score.slots = score.slots.filter((slot) => slot.id !== 'kick-chorus')
    })
    engine.transport.start()
    await advance(7.9)
    session.launchScene('verse')
    await advance(1.2) // 9.1
    session.launchScene('chorus') // pad: empty slot → stop at 10; kick: no slot → untouched
    expect(clips('pad')).toEqual([{ id: 'pad-verse@2', startSec: 8, durationSec: 2 }])
    expect(clips('kick')).toEqual([{ id: 'kick-verse@1', startSec: 8, durationSec: 3600 }])
    expect(labels()).toEqual(['launch scene verse', 'launch scene chorus'])
    await advance(1) // 10.1
    session.launchSlot('pad-chorus') // an empty slot again: nothing plays, nothing to stop
    expect(clips('pad')).toHaveLength(1)
  })
})

describe('Session: follow actions', () => {
  const chain = (a: ScoreFollowAction['a'], b: ScoreFollowAction['b'], chance: number, bars = 1) =>
    ({ a, b, chance, time: { unit: 'bars', value: bars } }) satisfies ScoreFollowAction

  it('next: the following slot starts on the follow boundary and the current is trimmed there', async () => {
    const { engine, session, advance, sources, clips } = await rig({}, (score) => {
      score.slots[0].follow = chain('next', 'stop', 1)
    })
    engine.transport.start()
    await advance(7.9)
    session.launchSlot('kick-verse')
    await advance(0.2) // 8.1
    expect(session.status('kick-verse').followAtSec).toBe(10)
    await advance(1.3) // 9.4: 10 is not yet inside the 0.5 s lookahead
    expect(clips('kick')).toHaveLength(1)
    await advance(0.2) // 9.6: fired
    expect(clips('kick')).toEqual([
      { id: 'kick-verse@1', startSec: 8, durationSec: 2 },
      { id: 'kick-chorus@2', startSec: 10, durationSec: 4 },
    ])
    await advance(0.3) // 9.9
    expect(sources()[0].stopCalls.last).toEqual([contextAt(10)])
    expect(sources()[1].startCalls.last).toEqual([contextAt(10), 0, 4])
    await advance(0.2) // 10.1
    expect(session.status('kick-chorus').state).toBe('playing')
    expect(session.status('kick-verse').state).toBe('stopped')
  })

  it('a seeded source makes the A/B chain deterministic and gapless', async () => {
    const play = async (seed: number): Promise<string[]> => {
      const { engine, session, advance, clips } = await rig(
        { random: seededRandom(seed) },
        (score) => {
          // verse: 50/50 again or next; chorus: 50/50 previous or again — the chain never ends
          score.slots[0].follow = chain('again', 'next', 0.5)
          score.slots[1].follow = chain('previous', 'again', 0.5)
        },
      )
      engine.transport.start()
      await advance(7.9)
      session.launchSlot('kick-verse')
      for (let i = 0; i < 80; i += 1) await advance(0.25) // 20 s of performance
      return clips('kick').map((clip) => `${clip.id} ${clip.startSec} ${clip.durationSec}`)
    }
    const first = await play(5)
    expect(first).toEqual(await play(5))
    // One bar per link: launched at 8, evaluated every 2 s, the last one still open at 28.
    expect(first.length).toBeGreaterThanOrEqual(9)
    for (let i = 1; i < first.length; i += 1) {
      const [, prevStart, prevLength] = first[i - 1].split(' ').map(Number)
      const [, nextStart] = first[i].split(' ').map(Number)
      expect(prevLength).toBe(2)
      expect(prevStart + prevLength).toBe(nextStart)
    }
    expect(first.some((entry) => entry.startsWith('kick-chorus'))).toBe(true)
    expect(first).not.toEqual(await play(9))
  })

  it('none keeps the slot playing and draws again after another follow time', async () => {
    const { engine, session, advance, clips } = await rig({}, (score) => {
      score.slots[0].follow = chain('none', 'none', 1)
    })
    engine.transport.start()
    await advance(7.9)
    session.launchSlot('kick-verse')
    await advance(0.2)
    expect(session.status('kick-verse').followAtSec).toBe(10)
    await advance(1.5) // 9.6: drawn → none → re-armed
    expect(session.status('kick-verse')).toMatchObject({ state: 'playing', followAtSec: 12 })
    expect(clips('kick')).toEqual([{ id: 'kick-verse@1', startSec: 8, durationSec: 3600 }])
  })

  it('stop ends the slot at the follow time; a follow time in seconds and the clip-end default work', async () => {
    const { engine, session, advance, clips } = await rig({}, (score) => {
      score.slots[0].follow = {
        a: 'stop',
        b: 'stop',
        chance: 1,
        time: { unit: 'seconds', value: 3 },
      }
      score.slots[1].follow = { a: 'again', b: 'again', chance: 1 } // at the 4 s clip end
    })
    engine.transport.start()
    await advance(7.9)
    session.launchSlot('kick-verse')
    await advance(0.2)
    expect(session.status('kick-verse').followAtSec).toBe(11)
    await advance(2.5) // 10.6: fired (11 < 10.6 + 0.5)
    expect(clips('kick')).toEqual([{ id: 'kick-verse@1', startSec: 8, durationSec: 3 }])
    expect(session.status('kick-verse')).toMatchObject({ stopping: true, endSec: 11 })
    await advance(0.6) // 11.2
    expect(session.status('kick-verse').state).toBe('stopped')
    session.launchSlot('kick-chorus') // at 12, follows itself at 16
    await advance(1) // 12.2
    expect(session.status('kick-chorus').followAtSec).toBe(16)
    await advance(3.5) // 15.7
    expect(clips('kick').map((clip) => clip.id)).toEqual([
      'kick-verse@1',
      'kick-chorus@2',
      'kick-chorus@3',
    ])
    expect(clips('kick')[2].startSec).toBe(16)
  })
})

describe('Session: undo, document edits and transport moves', () => {
  it('undoing a launch removes its clip, silences it and returns the slot to stopped', async () => {
    const { engine, session, document, advance, sources, clips, labels } = await rig()
    engine.transport.start()
    await advance(7.9)
    session.launchSlot('kick-verse')
    await advance(0.2) // 8.1: sounding
    expect(labels()).toEqual(['launch kick-verse'])
    document.undo()
    await advance(0)
    expect(clips('kick')).toEqual([])
    expect(session.status('kick-verse').state).toBe('stopped')
    // The scheduler cancelled the start whose clip vanished: the voice is silenced now.
    expect(sources()[0].stopCalls.count).toBe(2)
    expect(engine.track('kick').voices()).toEqual([])
    document.redo()
    await advance(0)
    expect(clips('kick')).toEqual([{ id: 'kick-verse@1', startSec: 8, durationSec: 3600 }])
    // Redo restores the document; the runtime does not re-adopt a clip it no longer tracks.
    expect(session.status('kick-verse').state).toBe('stopped')
  })

  it('undoing a switch restores the outgoing clip length and removes the incoming one', async () => {
    const { engine, session, document, advance, clips } = await rig()
    engine.transport.start()
    await advance(7.9)
    session.launchSlot('kick-verse')
    await advance(1.2)
    session.launchSlot('kick-chorus')
    expect(clips('kick').map((clip) => clip.durationSec)).toEqual([2, 4])
    document.undo()
    expect(clips('kick')).toEqual([{ id: 'kick-verse@1', startSec: 8, durationSec: 3600 }])
    expect(session.trackStatus('kick').queued).toBeNull()
  })

  it('transport stop trims open launches where the playhead was; seek does the same; pause keeps them', async () => {
    const { engine, session, advance, clips, labels } = await rig()
    engine.transport.start()
    await advance(7.9)
    session.launchSlot('kick-verse')
    await advance(0.2) // 8.1
    await advance(1.3) // 9.4
    engine.transport.pause()
    expect(session.status('kick-verse').state).toBe('playing')
    engine.transport.start()
    await advance(0.6) // 10.0
    engine.transport.stop()
    expect(clips('kick')).toEqual([{ id: 'kick-verse@1', startSec: 8, durationSec: 2 }])
    expect(session.status('kick-verse').state).toBe('stopped')
    expect(labels()).toEqual(['launch kick-verse', 'session: transport moved'])

    engine.transport.start()
    await advance(0.1)
    session.launchSlot('kick-chorus') // at 2
    engine.transport.seek(20) // never started: withdrawn
    expect(clips('kick')).toHaveLength(1)
    await advance(0.1)
    session.launchSlot('kick-chorus') // at 22
    await advance(3) // 23.1
    engine.transport.seek(5)
    expect(
      clips('kick').find((clip) => clip.id.startsWith('kick-chorus'))?.durationSec,
    ).toBeCloseTo(1.1)
  })

  it('removing the slot or its track mid-play leaves the placed clip as arrangement and forgets the launch', async () => {
    const { engine, session, document, advance, clips } = await rig()
    engine.transport.start()
    await advance(7.9)
    session.launchScene('verse')
    await advance(0.2)
    document.apply({ type: 'slot.remove', id: 'kick-verse' })
    expect(() => session.status('kick-verse')).toThrow(/no slot/)
    expect(session.trackStatus('kick').playing).toBe('kick-verse') // the launch is still sounding
    expect(clips('kick')).toHaveLength(1)
    document.apply({ type: 'track.remove', id: 'pad' })
    expect(session.trackStatus('pad')).toEqual({ track: 'pad', playing: null, queued: null })
    expect(document.score.slots.map((slot) => slot.id)).toEqual(['kick-chorus'])
  })

  it('load clears the runtime; dispose stops following', async () => {
    const { engine, session, document, advance } = await rig()
    engine.transport.start()
    await advance(7.9)
    session.launchSlot('kick-verse')
    document.load(gridScore())
    await advance(0.2)
    expect(session.status('kick-verse').state).toBe('stopped')
    const versions: number[] = []
    const off = session.onChange((s) => versions.push(s.version))
    session.launchSlot('kick-verse')
    expect(versions.length).toBeGreaterThan(0)
    off()
    session.dispose()
    expect(session.isDisposed).toBe(true)
    expect(() => session.launchSlot('kick-verse')).not.toThrow()
  })
})

describe('Session without an engine', () => {
  it('edits the document and derives states from hand-driven ticks', () => {
    const document = new ScoreDocument(gridScore(), { now: () => 0 })
    const ops: Operation[] = []
    document.onChange((change) => {
      if (change.entry) ops.push(change.entry.op)
    })
    const session = new Session({ document, tempo: TempoMap.constant(120), immediateLeadSec: 0 })
    session.tick(3)
    session.launchSlot('kick-verse') // next bar from 3 s is 4 s
    expect(ops[0]).toEqual({
      type: 'clip.add',
      track: 'kick',
      clip: expect.objectContaining({ id: 'kick-verse@1', startSec: 4, loop: true }),
    })
    expect(session.status('kick-verse').state).toBe('queued')
    session.tick(4)
    expect(session.status('kick-verse').state).toBe('playing')
    session.tick(5)
    session.stopSlot('kick-verse') // at 6
    expect(ops[1]).toEqual({
      type: 'clip.trim',
      track: 'kick',
      id: 'kick-verse@1',
      durationSec: 2,
    })
    session.tick(6)
    expect(session.status('kick-verse').state).toBe('stopped')
    expect(session.statuses().map((status) => status.state)).toEqual([
      'stopped',
      'stopped',
      'stopped',
      'empty',
    ])
    const slot: ScoreSlot | undefined = document.score.slots[0]
    expect(slot?.id).toBe('kick-verse')
  })
})
