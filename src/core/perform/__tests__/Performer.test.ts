import { describe, expect, it } from 'vitest'

import {
  MockAudioBuffer,
  asAudioContext,
  createMockContext,
  type MockAudioContext,
  type MockAudioParam,
  type MockGainNode,
} from '../../../testing'
import { createEngine, type Engine } from '../../Engine'
import { TempoMap } from '../../time/TempoMap'
import { RIDE_ARRIVAL_TIME_CONSTANT } from '../../tracks/ChannelStrip'
import {
  DIAL_RIDE_LAYER,
  Performer,
  SCENE_RIDE_LAYER,
  type PerformEvent,
  type PerformerOptions,
} from '../Performer'
import { emptyPerformSet, type PerformScene, type PerformSet } from '../set'

// 120 BPM in four: a beat is 0.5 s and a bar 2 s. The piece is 8 bars (16 s)
// and loops. The audio clock starts at 100.
const START = 100
const BAR = 2

function scene(id: string, overrides: Partial<PerformScene> = {}): PerformScene {
  return { id, name: id, rides: {}, dials: {}, ...overrides }
}

function twoScenes(): PerformSet {
  return {
    ...emptyPerformSet(),
    scenes: [scene('dawn', { rides: { a: 1, b: 0 } }), scene('night', { rides: { a: 0.5, b: 1 } })],
  }
}

/** What a ride was told the last time it was moved: its approach, then its arrival if it has one. */
function lastWord(param: MockAudioParam | null) {
  const events = param?.events ?? []
  const from = events.map((event) => event.method).lastIndexOf('cancelScheduledValues')
  return events.slice(from + 1).filter((event) => event.method === 'setTargetAtTime')
}

interface Rig {
  ctx: MockAudioContext
  engine: Engine
  performer: Performer
  events: PerformEvent[]
  /** Move the audio clock and run one scheduler pass, which ticks the performer. */
  advance: (sec: number) => void
  /** A track's ride on a layer, as the graph was told. */
  ride: (track: string, layer?: string) => MockAudioParam | null
  /** The last approach a ride was given: [value, at, timeConstant]. */
  approach: (track: string, layer?: string) => unknown[] | undefined
  /** The short approach that closes it when the morph ends, if it was given one. */
  arrival: (track: string, layer?: string) => unknown[] | undefined
}

function rig(set: PerformSet = twoScenes(), options: Partial<PerformerOptions> = {}): Rig {
  const ctx = createMockContext({ sampleRate: 48_000, currentTime: START })
  const engine = createEngine({
    context: asAudioContext(ctx),
    loop: { enabled: true, lengthSec: 8 * BAR },
    setIntervalFn: () => 0 as unknown as ReturnType<typeof setInterval>,
    clearIntervalFn: () => {},
  })
  engine.addAudioTrack('a')
  engine.addAudioTrack('b')
  const performer = new Performer({ engine, set, ...options })
  const events: PerformEvent[] = []
  performer.onEvent((event) => events.push(event))
  const ride = (track: string, layer: string = SCENE_RIDE_LAYER): MockAudioParam | null => {
    const node = engine.track(track).strip.rideNode(layer) as unknown as MockGainNode | null
    return node?.gain ?? null
  }
  return {
    ctx,
    engine,
    performer,
    events,
    advance: (sec) => {
      ctx.advanceClock(sec)
      engine.scheduler.tick('timer')
    },
    ride,
    approach: (track, layer) => lastWord(ride(track, layer))[0]?.args,
    arrival: (track, layer) => lastWord(ride(track, layer))[1]?.args,
  }
}

describe('Performer: scenes', () => {
  it('goes to a scene at once while the transport is stopped, over the morph', () => {
    const { performer, approach, arrival, ride, events } = rig()
    expect(performer.go('dawn')).toBe(true)
    // Two bars at 120 is 4 s; the approach runs through four time constants in that.
    expect(approach('a')).toEqual([1, START, 1])
    expect(approach('b')).toEqual([0, START, 1])
    // And when the morph ends the sound is out, not 2% in.
    expect(arrival('b')).toEqual([0, START + 4, RIDE_ARRIVAL_TIME_CONSTANT])
    expect(ride('a', DIAL_RIDE_LAYER)).toBeNull()
    expect(performer.state).toMatchObject({ scene: 'dawn', queued: null, rides: { a: 1, b: 0 } })
    expect(events.filter((event) => event.type === 'scene')).toEqual([
      { type: 'scene', scene: 'dawn', at: START },
    ])
  })

  it('says no to a scene the set does not have', () => {
    const { performer, ride } = rig()
    expect(performer.go('dusk')).toBe(false)
    expect(ride('a')).toBeNull()
    expect(performer.state.queued).toBeNull()
  })

  it('waits for the bar: asked 300 ms before it, the morph starts on the line', () => {
    const { engine, performer, advance, approach, ride } = rig()
    engine.transport.start()
    advance(3.7)
    performer.go('night')
    expect(performer.state).toMatchObject({ scene: null, queued: 'night' })
    expect(performer.state.queuedInBeats).toBeCloseTo(0.6)
    // Still a note here: nothing has reached the graph.
    expect(ride('a')).toBeNull()
    advance(0.1) // 3.8: 200 ms before the line, outside the 120 ms lookahead
    expect(ride('a')).toBeNull()
    advance(0.1) // 3.9: inside it
    expect(approach('a')).toEqual([0.5, START + 4, 1])
    expect(approach('b')).toEqual([1, START + 4, 1])
    expect(performer.state).toMatchObject({ scene: 'night', queued: null, queuedInBeats: null })
  })

  it('goes at once when asked exactly on a line, or with no grid', () => {
    const { engine, performer, advance, approach } = rig()
    engine.transport.start()
    advance(4)
    performer.go('dawn')
    expect(approach('b')).toEqual([0, START + 4, 1])
    advance(0.7)
    performer.go('night', { quantize: 'none', morphBars: 0 })
    expect(approach('b')?.[0]).toBe(1)
    expect(approach('b')?.[1]).toBeCloseTo(START + 4.7)
    // No morph still is not a step.
    expect(approach('b')?.[2]).toBe(0.005)
  })

  it('gives way to the last scene asked for', () => {
    const { engine, performer, advance, approach, events } = rig()
    engine.transport.start()
    advance(0.5)
    performer.go('dawn')
    performer.go('night')
    advance(1.45)
    expect(approach('a')).toEqual([0.5, START + 2, 1])
    expect(events.filter((event) => event.type === 'scene').map((event) => event.scene)).toEqual([
      'night',
    ])
  })

  it('can be called off while it waits', () => {
    const { engine, performer, advance, ride } = rig()
    engine.transport.start()
    advance(0.5)
    performer.go('dawn')
    performer.cancel()
    advance(1.5)
    expect(ride('a')).toBeNull()
    expect(performer.state).toMatchObject({ scene: null, queued: null })
  })

  it('leaves a track the scene does not name where it is', () => {
    const set = twoScenes()
    set.scenes.push(scene('half', { rides: { a: 0 } }))
    const { performer, ride, approach } = rig(set)
    performer.go('night')
    const before = ride('b')?.events.length
    performer.go('half')
    expect(approach('a')?.[0]).toBe(0)
    expect(ride('b')?.events.length).toBe(before)
    expect(performer.state.rides).toEqual({ a: 0, b: 1 })
  })

  it('takes its morph from the move, then the scene, then the set', () => {
    const set = twoScenes()
    set.morphBars = 4
    set.scenes[1].morphBars = 1
    const { performer, approach } = rig(set)
    performer.go('dawn')
    expect(approach('a')?.[2]).toBe(2) // the set's 4 bars: 8 s over four time constants
    performer.go('night')
    expect(approach('a')?.[2]).toBe(0.5) // the scene's 1 bar
    performer.go('night', { morphBars: 8 })
    expect(approach('a')?.[2]).toBe(4)
  })

  it('lands on the first bar of the next pass when the line is the end of the loop', () => {
    const { engine, performer, advance, approach } = rig()
    engine.transport.start()
    advance(15.2) // in the last bar of the 16 s pass
    performer.go('dawn')
    expect(performer.state.queuedInBeats).toBeCloseTo(1.6)
    advance(0.7)
    expect(approach('b')).toEqual([0, START + 16, 1])
  })

  it('waits for the next line from where a seek put the playhead', () => {
    const { engine, performer, advance, approach, ride } = rig()
    engine.transport.start()
    advance(0.5)
    performer.go('dawn')
    engine.transport.seek(5)
    expect(ride('b')).toBeNull()
    expect(performer.state.queuedInBeats).toBeCloseTo(2)
    advance(0.95)
    // The seek pinned the transport at 100.5 on position 5; the line at 6 is a second on.
    expect(approach('b')?.[0]).toBe(0)
    expect(approach('b')?.[1]).toBeCloseTo(START + 1.5)
  })

  it("finds the next line on a move's own grid after a seek, not on the set's", () => {
    const { engine, performer, advance, approach, ride } = rig()
    engine.transport.start()
    advance(0.3)
    performer.go('dawn', { quantize: 'beat' })
    performer.ride('a', 0.25, { quantize: 'beat' })
    engine.transport.seek(5.2)
    expect(ride('b')).toBeNull()
    // Position 5.2 s is beat 10.4: the next beat is 0.6 on, the next bar 1.6.
    expect(performer.state.queuedInBeats).toBeCloseTo(0.6)
    advance(0.25)
    expect(approach('b')?.[0]).toBe(0)
    expect(approach('b')?.[1]).toBeCloseTo(START + 0.6)
    expect(approach('a')?.[1]).toBeCloseTo(START + 0.6)
  })

  it('goes at once when the transport stops under a scene that waits', () => {
    const { engine, performer, advance, approach } = rig()
    engine.transport.start()
    advance(0.5)
    performer.go('dawn')
    engine.transport.stop()
    expect(approach('b')?.[0]).toBe(0)
    expect(approach('b')?.[1]).toBeCloseTo(START + 0.5)
    expect(performer.state).toMatchObject({ scene: 'dawn', queued: null })
  })

  it.each(['tempo first', 'stretch first'] as const)(
    'keeps a line in beats, so a tempo that moves does not move it (%s)',
    (order) => {
      let bpm = 120
      const { engine, performer, advance, approach, ride } = rig(twoScenes(), {
        tempo: () => TempoMap.constant(bpm),
      })
      engine.transport.start()
      advance(0.5)
      performer.go('dawn') // the bar at beat 4
      expect(performer.state.queuedInBeats).toBeCloseTo(3)
      // The host halves the tempo: the timeline stretches under the playhead.
      // Its tempo map and its transport change one after the other.
      if (order === 'tempo first') bpm = 60
      engine.transport.rescale(2)
      bpm = 60
      expect(ride('b')).toBeNull()
      advance(0.04)
      expect(performer.state.queuedInBeats).toBeCloseTo(2.96)
      advance(2.91) // three beats at 1 s each
      expect(approach('b')?.[0]).toBe(0)
      expect(approach('b')?.[1]).toBeCloseTo(START + 3.5)
    },
  )
})

describe('Performer: single rides', () => {
  it('brings one track out on the bar and leaves the scene in play', () => {
    const { engine, performer, advance, approach, ride } = rig()
    performer.go('night')
    engine.transport.start()
    advance(0.5)
    performer.ride('b', 0)
    expect(performer.state.queuedRides).toEqual({ b: 0 })
    expect(performer.state.rides).toEqual({ a: 0.5, b: 1 })
    advance(1.45)
    expect(approach('b')).toEqual([0, START + 2, 1])
    expect(ride('a')?.eventsFor('cancelScheduledValues')).toHaveLength(1)
    expect(performer.state).toMatchObject({ scene: 'night', rides: { a: 0.5, b: 0 } })
    expect(performer.state.queuedRides).toEqual({})
  })

  it('gives way to a scene that speaks for the same track', () => {
    const { engine, performer, advance, approach } = rig()
    engine.transport.start()
    advance(0.5)
    performer.ride('b', 0.25, { quantize: 2 })
    performer.go('night')
    advance(1.45)
    expect(approach('b')?.[0]).toBe(1)
    advance(2)
    expect(approach('b')?.[0]).toBe(1)
    expect(performer.state.queuedRides).toEqual({})
  })

  it('captures what is sounding as a scene', () => {
    const set = twoScenes()
    set.dials = [{ id: 'energy', name: 'Energy', value: 0.5, targets: [] }]
    const { performer } = rig(set)
    performer.go('night')
    performer.ride('a', 0)
    performer.dial('energy', 0.9)
    expect(performer.capture({ id: 'kept', name: 'Kept', tracks: ['a', 'b', 'c'] })).toEqual({
      id: 'kept',
      name: 'Kept',
      rides: { a: 0, b: 1, c: 1 },
      dials: { energy: 0.9 },
    })
  })
})

describe('Performer: dials', () => {
  function dialSet(): PerformSet {
    return {
      ...twoScenes(),
      dials: [
        {
          id: 'energy',
          name: 'Energy',
          value: 1,
          targets: [
            { kind: 'ride', track: 'b', input: { min: 0.5, max: 1 } },
            { kind: 'host', id: 'tone', output: { min: 300, max: 18_000 } },
          ],
        },
        {
          id: 'duck',
          name: 'Duck',
          value: 0,
          targets: [{ kind: 'ride', track: 'b', output: { min: 1, max: 0.5 } }],
        },
      ],
    }
  }

  it('starts every dial at rest and hands the host its targets', () => {
    const hosted: [string, number][] = []
    const { performer, ride } = rig(dialSet(), { host: (id, value) => hosted.push([id, value]) })
    expect(performer.state.dials).toEqual({ energy: 1, duck: 0 })
    expect(hosted).toEqual([['tone', 18_000]])
    // At rest both dials leave the track at 1: there is nothing to tell the graph.
    expect(ride('b', DIAL_RIDE_LAYER)).toBeNull()
  })

  it('moves a ride on its own layer, the product of every dial that moves the track', () => {
    const hosted: [string, number, number][] = []
    const { performer, approach, arrival, ride } = rig(dialSet(), {
      host: (id, value, glide) => hosted.push([id, value, glide.seconds]),
    })
    performer.go('night')
    const sceneEvents = ride('b')?.events.length
    expect(performer.dial('energy', 0.75)).toBe(true)
    expect(approach('b', DIAL_RIDE_LAYER)).toEqual([0.5, START, 0.02])
    // A dial put somewhere at once is there in a blink and has nothing left to close.
    expect(arrival('b', DIAL_RIDE_LAYER)).toBeUndefined()
    performer.dial('duck', 1, { seconds: 2 })
    expect(approach('b', DIAL_RIDE_LAYER)).toEqual([0.25, START, 0.5])
    expect(arrival('b', DIAL_RIDE_LAYER)).toEqual([0.25, START + 2, RIDE_ARRIVAL_TIME_CONSTANT])
    // The scene's own approach was not touched.
    expect(ride('b')?.events.length).toBe(sceneEvents)
    expect(hosted.at(-1)).toEqual(['tone', 300 + 0.75 * 17_700, 0.08])
    expect(performer.dialValue('energy')).toBe(0.75)
    expect(performer.dial('nothing', 1)).toBe(false)
    expect(performer.dialValue('nothing')).toBeNull()
  })

  it('does nothing for a value a dial already has', () => {
    const { performer, ride, events } = rig(dialSet())
    performer.dial('energy', 0.6)
    const before = ride('b', DIAL_RIDE_LAYER)?.events.length
    const seen = events.length
    performer.dial('energy', 0.6)
    expect(ride('b', DIAL_RIDE_LAYER)?.events.length).toBe(before)
    expect(events).toHaveLength(seen)
  })

  it('lets a scene set its dials, gliding over the morph', () => {
    const set = dialSet()
    set.scenes[0].dials = { energy: 0.5 }
    const hosted: [string, number, number, number][] = []
    const { engine, performer, advance, approach } = rig(set, {
      host: (id, value, glide) => hosted.push([id, value, glide.at, glide.seconds]),
    })
    engine.transport.start()
    advance(1.9)
    performer.go('dawn')
    expect(performer.state.dials).toEqual({ energy: 0.5, duck: 0 })
    expect(approach('b', DIAL_RIDE_LAYER)).toEqual([0, START + 2, 1])
    expect(hosted.at(-1)).toEqual(['tone', 300 + 0.5 * 17_700, START + 2, 4])
  })

  it('keeps a dial where it is when the set is edited under it', () => {
    const { performer, approach } = rig(dialSet())
    performer.dial('energy', 0.75)
    const edited = dialSet()
    edited.dials = [edited.dials[0], { id: 'new', name: 'New', value: 0.3, targets: [] }]
    performer.load(edited)
    expect(performer.state.dials).toEqual({ energy: 0.75, new: 0.3 })
    expect(approach('b', DIAL_RIDE_LAYER)?.[0]).toBe(0.5)
    // A dial that is gone lets go of its track.
    performer.load(twoScenes())
    expect(approach('b', DIAL_RIDE_LAYER)?.[0]).toBe(1)
  })
})

describe('Performer: follow rules', () => {
  function followSet(): PerformSet {
    const set = twoScenes()
    set.follow = true
    set.scenes[0].follow = { a: 'next', b: 'stay', chance: 1, after: { unit: 'bars', value: 2 } }
    return set
  }

  it('hands over on the line the rule names, counted from where the scene came in', () => {
    const { engine, performer, advance, approach, events } = rig(followSet())
    engine.transport.start()
    advance(1.9)
    performer.go('dawn') // comes in at the bar at 2 s
    expect(performer.state.followInBeats).toBeCloseTo(8.2)
    advance(3.9) // 5.8: two bars on is 6 s, outside the lookahead
    expect(performer.state.scene).toBe('dawn')
    advance(0.1)
    expect(performer.state.scene).toBe('night')
    expect(approach('a')).toEqual([0.5, START + 6, 1])
    expect(events.filter((event) => event.type === 'scene').map((event) => event.at)).toEqual([
      START + 2,
      START + 6,
    ])
    // Night has no rule: the set rests there.
    expect(performer.state.followInBeats).toBeNull()
  })

  it('draws the rule again after the same time when it stays', () => {
    const set = followSet()
    set.scenes[0].follow = { a: 'stay', b: 'next', chance: 0.5, after: { unit: 'bars', value: 1 } }
    const draws = [0.1, 0.2, 0.9]
    const { engine, performer, advance } = rig(set, { random: () => draws.shift() ?? 0 })
    performer.go('dawn')
    engine.transport.start()
    advance(1.95)
    expect(performer.state.scene).toBe('dawn')
    advance(2)
    expect(performer.state.scene).toBe('dawn')
    advance(2)
    expect(performer.state.scene).toBe('night')
  })

  it('plays the same evening from the same seed, and another from another', () => {
    const evening = (seed: number): string[] => {
      const set = twoScenes()
      set.follow = true
      set.scenes.push(scene('noon'), scene('dusk'))
      for (const each of set.scenes) {
        each.follow = { a: 'other', b: 'stay', chance: 0.8, after: { unit: 'bars', value: 1 } }
      }
      const { engine, performer, advance, events } = rig(set, { seed })
      performer.go('dawn')
      engine.transport.start()
      for (let i = 0; i < 400; i += 1) advance(0.1)
      return events.flatMap((event) => (event.type === 'scene' && event.scene ? [event.scene] : []))
    }
    const first = evening(7)
    expect(first.length).toBeGreaterThan(10)
    expect(evening(7)).toEqual(first)
    expect(evening(8)).not.toEqual(first)
  })

  it('does nothing while following is off, and starts counting when it is switched on', () => {
    const set = followSet()
    set.follow = false
    const { engine, performer, advance } = rig(set)
    performer.go('dawn')
    engine.transport.start()
    advance(5)
    expect(performer.state).toMatchObject({ scene: 'dawn', following: false, followInBeats: null })
    performer.follow(true)
    expect(performer.state.followInBeats).toBeCloseTo(8)
    advance(3.95)
    expect(performer.state.scene).toBe('night')
  })

  it('lets a hand win over a rule that is about to be drawn', () => {
    const set = followSet()
    set.scenes.push(scene('noon', { rides: { a: 0 } }))
    const { engine, performer, advance, events } = rig(set)
    performer.go('dawn')
    engine.transport.start()
    advance(3.5)
    performer.go('noon') // for the bar at 4 s, where the rule would have gone to night
    advance(0.45)
    expect(performer.state.scene).toBe('noon')
    advance(4)
    expect(events.filter((event) => event.type === 'scene').map((event) => event.scene)).toEqual([
      'dawn',
      'noon',
    ])
  })
})

describe('Performer: cues', () => {
  function cueSet(): PerformSet {
    return {
      ...emptyPerformSet(),
      cues: [
        { id: 'bell', name: 'Bell', sample: 'bell' },
        { id: 'now', name: 'Now', sample: 'bell', quantize: 'none' },
        { id: 'lost', name: 'Lost', sample: 'missing' },
      ],
    }
  }

  it('plays a sample once on the next beat', async () => {
    const { ctx, engine, performer, advance, events } = rig(cueSet())
    await engine.samples.load(
      'bell',
      new MockAudioBuffer(1, 48_000, 48_000) as unknown as AudioBuffer,
    )
    engine.transport.start()
    advance(0.3)
    expect(performer.cue('bell')).toBeCloseTo(START + 0.5)
    expect(ctx.sources).toHaveLength(1)
    expect(ctx.sources[0].startCalls.last?.[0]).toBeCloseTo(START + 0.5)
    expect(ctx.sources[0].loop).toBe(false)
    expect(events.at(-1)).toMatchObject({ type: 'cue', cue: 'bell' })
    // Each press is its own voice: a second one does not cut the first.
    expect(performer.cue('now')).toBeCloseTo(START + 0.3)
    expect(ctx.sources).toHaveLength(2)
  })

  it('plays at once while the transport is stopped', async () => {
    const { ctx, engine, performer } = rig(cueSet())
    await engine.samples.load(
      'bell',
      new MockAudioBuffer(1, 48_000, 48_000) as unknown as AudioBuffer,
    )
    expect(performer.cue('bell')).toBe(START)
    expect(ctx.sources).toHaveLength(1)
  })

  it('says nothing was played for a cue or a sample that is not there', () => {
    const { ctx, performer } = rig(cueSet())
    expect(performer.cue('lost')).toBeNull()
    expect(performer.cue('nothing')).toBeNull()
    expect(ctx.sources).toHaveLength(0)
  })

  it('plays a sample the set does not hold as a cue of the moment', async () => {
    const { ctx, engine, performer, advance, events } = rig(emptyPerformSet())
    await engine.samples.load(
      'rain',
      new MockAudioBuffer(1, 48_000, 48_000) as unknown as AudioBuffer,
    )
    engine.transport.start()
    advance(0.3)
    // On the set's cue grid (a beat) unless the call says otherwise.
    expect(performer.play({ id: 'hand-1', name: 'Rain', sample: 'rain' })).toBeCloseTo(START + 0.5)
    expect(events.at(-1)).toMatchObject({ type: 'cue', cue: 'hand-1' })
    expect(
      performer.play({ id: 'hand-1', name: 'Rain', sample: 'rain' }, { quantize: 'none' }),
    ).toBeCloseTo(START + 0.3)
    expect(ctx.sources).toHaveLength(2)
    expect(performer.play({ id: 'hand-2', name: 'Lost', sample: 'lost' })).toBeNull()
  })
})

describe('Performer: bars and beats', () => {
  it('reports each beat a little ahead, with the time it falls on', () => {
    const { engine, advance, events } = rig()
    engine.transport.start()
    for (let i = 0; i < 45; i += 1) advance(0.1)
    const beats = events.filter((event) => event.type === 'beat')
    const bars = events.filter((event) => event.type === 'bar')
    expect(beats.slice(0, 5).map((event) => [event.bar, event.beat, event.at])).toEqual([
      [0, 0, expect.closeTo(START)],
      [0, 1, expect.closeTo(START + 0.5)],
      [0, 2, expect.closeTo(START + 1)],
      [0, 3, expect.closeTo(START + 1.5)],
      [1, 0, expect.closeTo(START + 2)],
    ])
    expect(bars.map((event) => [event.bar, event.pass])).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
    ])
    // Never twice, never late.
    expect(new Set(beats.map((event) => event.at.toFixed(3))).size).toBe(beats.length)
  })

  it('puts a beat on the grid though the clock moves on between two readings of it', () => {
    const { ctx, engine, advance, events } = rig()
    // The thread is put aside for 3 ms after every look at the clock, as a busy page's is.
    let clock = ctx.currentTime
    Object.defineProperty(ctx, 'currentTime', {
      configurable: true,
      get: () => {
        const read = clock
        clock += 0.003
        return read
      },
      set: (value: number) => {
        clock = value
      },
    })
    engine.transport.start()
    for (let i = 0; i < 45; i += 1) advance(0.1)
    const beats = events.filter((event) => event.type === 'beat')
    expect(beats.length).toBeGreaterThan(8)
    const off = beats.map(
      (event) =>
        event.at - engine.transport.contextTimeAtElapsed((event.bar * 4 + event.beat) * 0.5),
    )
    // Never ahead of its line. One the clock has just passed when it is told is told as now.
    for (const by of off) {
      expect(by).toBeGreaterThan(-1e-6)
      expect(by).toBeLessThan(0.01)
    }
    expect(off.filter((by) => Math.abs(by) < 1e-6).length).toBeGreaterThanOrEqual(beats.length - 1)
  })

  it('tells a beat once though the clock moves on between readings and the loop changes after a jump', () => {
    const { ctx, engine, advance, events } = rig()
    // The clock has moved on a millisecond at every look, as the audio thread's does under a busy page.
    let clock = ctx.currentTime
    Object.defineProperty(ctx, 'currentTime', {
      configurable: true,
      get: () => {
        const read = clock
        clock += 0.001
        return read
      },
      set: (value: number) => {
        clock = value
      },
    })
    engine.transport.start()
    advance(0.1)
    // To just ahead of the second beat, which is told at once; then the loop
    // is made longer, which moves nothing: the beat has been told.
    const from = events.length
    engine.transport.seek(0.4)
    engine.transport.setLoop({ lengthSec: 16 * BAR })
    for (let i = 0; i < 30; i += 1) advance(0.02)
    const beats = events.slice(from).filter((event) => event.type === 'beat')
    const told = beats.map((event) => `${event.pass}:${event.bar}:${event.beat}`)
    expect(told.slice(0, 2)).toEqual(['0:0:1', '0:0:2'])
    expect(new Set(told).size).toBe(told.length)
  })

  it('counts bars from the start of each pass of the loop', () => {
    const { engine, advance, events } = rig()
    engine.transport.start()
    for (let i = 0; i < 170; i += 1) advance(0.1)
    const bars = events.filter((event) => event.type === 'bar')
    expect(bars.at(-1)).toMatchObject({ bar: 0, pass: 1 })
    expect(bars.at(-1)?.at).toBeCloseTo(START + 16)
    expect(bars.at(-2)).toMatchObject({ bar: 7, pass: 0 })
  })
})

describe('Performer: taking up a performance', () => {
  it('restores the scene, the rides and the dials at once', () => {
    const set = twoScenes()
    set.dials = [
      { id: 'energy', name: 'Energy', value: 1, targets: [{ kind: 'ride', track: 'a' }] },
    ]
    const { performer, approach, arrival, events } = rig(set)
    performer.go('dawn')
    performer.restore({ scene: 'night', rides: { a: 0.25 }, dials: { energy: 0.5 } })
    expect(approach('a')).toEqual([0.25, START, 0.005])
    expect(arrival('a')).toBeUndefined()
    // A track the performance being taken up does not ride goes back to 1.
    expect(approach('b')).toEqual([1, START, 0.005])
    expect(approach('a', DIAL_RIDE_LAYER)).toEqual([0.5, START, 0.005])
    expect(performer.state).toMatchObject({
      scene: 'night',
      queued: null,
      rides: { a: 0.25 },
      dials: { energy: 0.5 },
    })
    expect(events.at(-1)).toEqual({ type: 'scene', scene: 'night', at: START })
  })

  it('puts rides back on a strip that was made anew', () => {
    const set = twoScenes()
    set.dials = [
      { id: 'energy', name: 'Energy', value: 1, targets: [{ kind: 'ride', track: 'b' }] },
    ]
    const { engine, performer, ride } = rig(set)
    performer.go('dawn')
    performer.dial('energy', 0.5)
    const before = [ride('a')?.events.length, ride('b')?.events.length]
    performer.refresh()
    // Nothing had gone: nothing is told twice.
    expect([ride('a')?.events.length, ride('b')?.events.length]).toEqual(before)
    engine.removeTrack('b')
    engine.addAudioTrack('b')
    expect(ride('b')).toBeNull()
    performer.refresh()
    expect(ride('b')?.lastEvent('setTargetAtTime')?.args[0]).toBe(0)
    expect(ride('b', DIAL_RIDE_LAYER)?.lastEvent('setTargetAtTime')?.args[0]).toBe(0.5)
  })
})

describe('Performer: leaving', () => {
  it('reset puts every ride at 1, every dial at rest and no scene in play', () => {
    const set = twoScenes()
    set.dials = [
      { id: 'energy', name: 'Energy', value: 1, targets: [{ kind: 'ride', track: 'a' }] },
    ]
    const { performer, approach, arrival, events } = rig(set)
    performer.go('dawn')
    performer.dial('energy', 0.2)
    performer.reset(2)
    expect(approach('a')).toEqual([1, START, 0.5])
    expect(approach('b')).toEqual([1, START, 0.5])
    expect(approach('a', DIAL_RIDE_LAYER)).toEqual([1, START, 0.5])
    // The piece is back whole when the reset is over.
    for (const closed of [arrival('a'), arrival('b'), arrival('a', DIAL_RIDE_LAYER)]) {
      expect(closed).toEqual([1, START + 2, RIDE_ARRIVAL_TIME_CONSTANT])
    }
    expect(performer.state).toMatchObject({
      scene: null,
      queued: null,
      rides: {},
      dials: { energy: 1 },
    })
    expect(events.at(-1)).toEqual({ type: 'scene', scene: null, at: START })
  })

  it("dispose hands a dial's host targets their resting values", () => {
    const set = twoScenes()
    set.dials = [
      {
        id: 'tone',
        name: 'Tone',
        value: 1,
        targets: [{ kind: 'host', id: 'cutoff', output: { min: 300, max: 18_000 } }],
      },
    ]
    const hosted: number[] = []
    const { performer } = rig(set, { host: (_id, value) => hosted.push(value) })
    performer.dial('tone', 0)
    performer.dispose()
    expect(hosted).toEqual([18_000, 300, 18_000])
  })

  it('dispose lets every track go and listens to nothing more', () => {
    const { engine, performer, approach, advance, events } = rig()
    performer.go('dawn')
    const seen = events.length
    performer.dispose()
    expect(approach('a')?.[0]).toBe(1)
    expect(approach('b')?.[0]).toBe(1)
    engine.transport.start()
    advance(3)
    expect(events).toHaveLength(seen)
    expect(() => performer.go('dawn')).toThrow(/disposed/)
  })

  it('goes with its engine', () => {
    const { engine, performer } = rig()
    performer.go('dawn')
    engine.dispose()
    expect(() => performer.go('dawn')).toThrow(/disposed/)
  })
})
