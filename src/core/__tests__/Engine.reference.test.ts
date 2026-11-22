// A reference beside the mix, on the recording mocks: the audio tracks' own
// sound from before their strips, summed, held back as the mix is and played
// at the output in place of the mix (`engine.setHeard`).

import { describe, expect, it } from 'vitest'

import {
  MockAudioBuffer,
  asAudioContext,
  createMockContext,
  createMockOfflineContext,
  type MockAudioContext,
  type MockAudioNode,
  type MockGainNode,
  type MockOfflineAudioContext,
} from '../../testing'
import { loadScore } from '../../score/loadScore'
import { type Operation } from '../../score/operations'
import { renderScore } from '../../score/renderScore'
import { createScore, defaultStrip, masterDestination, type Score } from '../../score/schema'
import { ScoreDocument } from '../../score/ScoreDocument'
import { clip } from '../../score/__tests__/fixtures'
import { type Device } from '../devices/Device'
import { createEngine, type Engine } from '../Engine'
import { HEARD_CROSS_SECONDS } from '../output/OutputRouter'
import { type OfflineContextFactory } from '../render/OfflineRenderer'

const SR = 48000
const NOW = 2

function buffer(): AudioBuffer {
  return new MockAudioBuffer(2, 10 * SR, SR) as unknown as AudioBuffer
}

function rig(options: { meter?: boolean } = {}) {
  const mock = createMockContext({ sampleRate: SR, currentTime: NOW })
  const engine = createEngine({
    context: asAudioContext(mock),
    master: { meter: options.meter },
    setIntervalFn: () => 0 as unknown as ReturnType<typeof setInterval>,
    clearIntervalFn: () => {},
  })
  return { mock, engine }
}

function asMock(node: AudioNode): MockAudioNode {
  return node as unknown as MockAudioNode
}

function fakeDevice(mock: MockAudioContext, id: string, latencySamples = 0): Device {
  const node = mock.createGain()
  return {
    id,
    input: node as unknown as AudioNode,
    output: node as unknown as AudioNode,
    params: {},
    setParam: () => {},
    getParam: () => 0,
    bypass: false,
    latencySec: latencySamples / SR,
    latencySamples,
    dispose: () => node.disconnect(),
  }
}

/** Starts a voice by hand on an audio track. */
function play(engine: Engine, track: string, key: string): void {
  const voice = engine.track(track).play(
    key,
    {
      buffer: buffer(),
      offsetSec: 0,
      durationSec: 4,
      fadeInSec: 0,
      fadeOutSec: 0,
      fadeCurve: 'linear',
    },
    NOW,
  )
  if (!voice) throw new Error(`no voice on ${track}`)
}

/** What every audio track hands its strip, as the strips list it. */
function stripSources(engine: Engine): MockAudioNode[] {
  return engine.tracks.flatMap((track) => track.strip.sourceNodes.map(asMock))
}

function feeding(mock: MockAudioContext, target: MockAudioNode): MockAudioNode[] {
  return mock.allNodes().filter((node) => node.isConnectedTo(target))
}

/** The heard path, found from the output back: nothing in it is named by the engine. */
function heardPath(mock: MockAudioContext, engine: Engine) {
  const master = asMock(engine.master.gainNode)
  const ends = feeding(mock, mock.destination)
  const mix = ends.find((node) => master.reaches(node))
  const reference = ends.find((node) => node !== mix)
  if (!mix || !reference) throw new Error('the output is fed by fewer than two nodes')
  const delay = mock.delays.find((node) => node.isConnectedTo(reference))
  if (!delay) throw new Error('nothing delays the reference')
  const [sum] = feeding(mock, delay)
  return {
    ends,
    mix: mix as MockGainNode,
    reference: reference as MockGainNode,
    delay,
    sum,
  }
}

function sorted(nodes: readonly MockAudioNode[]): number[] {
  return nodes.map((node) => node.id).sort((a, b) => a - b)
}

/** Two audio tracks through no group, with a clip each and nothing that takes time. */
function plainScore(): Score {
  const score = createScore({ id: 'plain', name: 'Plain' })
  score.sources = [
    { id: 'a', durationSec: 10 },
    { id: 'b', durationSec: 10 },
  ]
  score.tracks = [
    {
      kind: 'audio',
      id: 'drums',
      name: 'Drums',
      destination: masterDestination(),
      strip: defaultStrip(),
      clips: [clip('d1', 'a', 0)],
    },
    {
      kind: 'audio',
      id: 'vocals',
      name: 'Vocals',
      destination: masterDestination(),
      strip: defaultStrip(),
      clips: [clip('v1', 'b', 0)],
    },
  ]
  return score
}

async function scoreRig(score: Score) {
  const { mock, engine } = rig()
  await engine.samples.load('a', buffer())
  await engine.samples.load('b', buffer())
  const document = new ScoreDocument(score, { now: () => 0 })
  const errors: unknown[] = []
  const renderer = loadScore(engine, document, { onError: (error) => errors.push(error) })
  await renderer.whenIdle()
  const edit = async (...ops: Operation[]): Promise<void> => {
    for (const op of ops) document.apply(op)
    await renderer.whenIdle()
  }
  return { mock, engine, document, renderer, errors, edit }
}

describe('a reference beside the mix', () => {
  it('lives through a score.replace with the same tracks: the taps stay and the reference still plays', async () => {
    const { mock, engine, document, errors, edit } = await scoreRig(plainScore())
    const drums = engine.track('drums')
    const vocals = engine.track('vocals')
    play(engine, 'drums', 'before')
    play(engine, 'vocals', 'before')
    engine.setHeard({ source: 'reference', referenceGain: 0.5 })
    const before = heardPath(mock, engine)
    expect(sorted(feeding(mock, before.sum))).toEqual(sorted(stripSources(engine)))

    // The same two tracks, with everything a mix changes on them: a strip that
    // gets its nodes, a mute, a solo, an insert, and an insert on the mix.
    const next = structuredClone(document.score)
    next.tracks[0].strip = defaultStrip({
      level: 0.5,
      pan: -0.3,
      solo: true,
      inserts: [{ id: 'drums-filter', deviceId: 'filter', params: {}, bypass: false }],
    })
    next.tracks[1].strip = defaultStrip({ mute: true })
    next.master = {
      level: 0.8,
      inserts: [{ id: 'glue', deviceId: 'compressor', params: {}, bypass: false }],
    }
    await edit({ type: 'score.replace', score: next })
    expect(errors).toEqual([])

    expect(engine.track('drums')).toBe(drums)
    expect(engine.track('vocals')).toBe(vocals)
    expect(drums.strip.materialized).toBe(true)
    play(engine, 'drums', 'after')
    play(engine, 'vocals', 'after')
    const after = heardPath(mock, engine)
    expect(after.sum).toBe(before.sum)
    expect(after.reference).toBe(before.reference)
    expect(stripSources(engine)).toHaveLength(4)
    expect(sorted(feeding(mock, after.sum))).toEqual(sorted(stripSources(engine)))
    for (const source of stripSources(engine)) expect(source.reaches(after.reference)).toBe(true)
    // The mix, with the insert it was given, still passes its own gain and nothing else reaches the output.
    expect(engine.master.inserts).toHaveLength(1)
    expect(sorted(after.ends)).toEqual(sorted([after.mix, after.reference]))
    expect(engine.heard).toEqual({ source: 'reference', mixGain: 1, referenceGain: 0.5 })
    engine.dispose()
  })

  it('makes nothing until it is asked for, and the mix is what is heard', () => {
    const { mock, engine } = rig()
    engine.addAudioTrack('drums')
    play(engine, 'drums', 'v')
    const nodes = mock.allNodes().length
    expect(engine.heard).toEqual({ source: 'mix', mixGain: 1, referenceGain: 1 })
    expect(mock.allNodes()).toHaveLength(nodes)
    expect(feeding(mock, mock.destination)).toEqual([asMock(engine.master.gainNode)])
    engine.dispose()
  })

  it('crosses the mix and the reference over the crossing length, each to its gain, while both keep running', () => {
    const { mock, engine } = rig()
    engine.addAudioTrack('drums')
    play(engine, 'drums', 'v')

    expect(engine.setHeard({ source: 'reference', mixGain: 0.8, referenceGain: 0.5 })).toEqual({
      source: 'reference',
      mixGain: 0.8,
      referenceGain: 0.5,
    })
    const { mix, reference } = heardPath(mock, engine)
    // Made silent, and the mix at unity, so that making them moves no level.
    expect(reference.gain.value).toBe(0)
    expect(mix.gain.value).toBe(1)
    const approach = (node: MockGainNode) => node.gain.lastEvent('setTargetAtTime')?.args
    expect(approach(mix)).toEqual([0, NOW, HEARD_CROSS_SECONDS / 4])
    expect(approach(reference)).toEqual([0.5, NOW, HEARD_CROSS_SECONDS / 4])
    expect(HEARD_CROSS_SECONDS).toBeCloseTo(0.02)

    mock.currentTime = NOW + 1
    engine.setHeard({ source: 'mix' })
    expect(engine.heard).toEqual({ source: 'mix', mixGain: 0.8, referenceGain: 0.5 })
    expect(approach(mix)).toEqual([0.8, NOW + 1, HEARD_CROSS_SECONDS / 4])
    expect(approach(reference)).toEqual([0, NOW + 1, HEARD_CROSS_SECONDS / 4])

    // A gain alone moves the one that is heard and leaves the other silent.
    mock.currentTime = NOW + 2
    engine.setHeard({ mixGain: 0.6, referenceGain: 0.9 })
    expect(approach(mix)).toEqual([0.6, NOW + 2, HEARD_CROSS_SECONDS / 4])
    expect(approach(reference)?.[0]).toBe(0)
    // Every move is an approach: neither gain is ever stepped.
    for (const node of [mix, reference]) {
      expect(node.gain.events.every((event) => event.method === 'setTargetAtTime')).toBe(true)
    }

    // Both run all the while: the mix into its gain, the track's sound into the reference's.
    expect(asMock(engine.master.gainNode).reaches(mix)).toBe(true)
    for (const source of stripSources(engine)) expect(source.reaches(reference)).toBe(true)
    engine.dispose()
  })

  it('sums what each audio track hands its strip, whatever the strip does with it', () => {
    const { mock, engine } = rig()
    const drums = engine.addAudioTrack('drums')
    const vocals = engine.addAudioTrack('vocals')
    drums.strip.setLevel(0.25)
    drums.strip.addInsert(fakeDevice(mock, 'squash'))
    play(engine, 'drums', 'one')
    play(engine, 'vocals', 'one')
    engine.setHeard({ source: 'reference' })
    const { sum, reference } = heardPath(mock, engine)
    expect(stripSources(engine)).toHaveLength(2)
    expect(sorted(feeding(mock, sum))).toEqual(sorted(stripSources(engine)))

    // A voice that starts later, and a strip that gets its nodes later.
    play(engine, 'vocals', 'two')
    vocals.strip.setPan(0.5)
    vocals.strip.setMute(true)
    expect(stripSources(engine)).toHaveLength(3)
    expect(sorted(feeding(mock, sum))).toEqual(sorted(stripSources(engine)))

    // A solo shuts the other strip's gate, and every tap stays.
    drums.strip.setSolo(true)
    expect(vocals.strip.implicitlyMuted).toBe(true)
    expect(sorted(feeding(mock, sum))).toEqual(sorted(stripSources(engine)))
    for (const source of stripSources(engine)) expect(source.reaches(reference)).toBe(true)
    // Nothing of a strip is in the sum: only what goes into one.
    expect(feeding(mock, sum).some((node) => node === asMock(vocals.strip.gate))).toBe(false)
    engine.dispose()
  })

  it('taps a track added afterwards and lets go of a removed one', () => {
    const { mock, engine } = rig()
    engine.addAudioTrack('drums')
    play(engine, 'drums', 'v')
    engine.setHeard({ source: 'reference' })
    const { sum } = heardPath(mock, engine)

    engine.addAudioTrack('late')
    play(engine, 'late', 'v')
    expect(stripSources(engine)).toHaveLength(2)
    expect(sorted(feeding(mock, sum))).toEqual(sorted(stripSources(engine)))

    const [gone] = engine.track('drums').strip.sourceNodes.map(asMock)
    engine.removeTrack('drums')
    expect(gone.isConnectedTo(sum)).toBe(false)
    expect(sorted(feeding(mock, sum))).toEqual(sorted(stripSources(engine)))
    expect(feeding(mock, sum)).toHaveLength(1)
    engine.dispose()
  })

  it('taps a stretch track as it taps an audio track', () => {
    const { mock, engine } = rig()
    const early = engine.addStretchTrack('early', {
      createStretch: () => Promise.reject(new Error('not asked for in this test')),
    })
    engine.setHeard({ source: 'reference' })
    const { sum } = heardPath(mock, engine)
    const late = engine.addStretchTrack('late', {
      createStretch: () => Promise.reject(new Error('not asked for in this test')),
    })
    // What a stretch voice does when it starts: it hands its node to the strip.
    const voices = [early, late].map((track) => {
      const voice = mock.createGain()
      track.strip.connectSource(voice as unknown as AudioNode)
      return voice
    })
    expect(sorted(feeding(mock, sum))).toEqual(sorted(voices))
    engine.removeStretchTrack('early')
    expect(feeding(mock, sum)).toEqual([voices[1]])
    engine.dispose()
  })

  it('puts the mix through its gain whatever the master ends in, and keeps it there', async () => {
    // A meter at the end of the master.
    const metered = rig({ meter: true })
    metered.engine.setHeard({ source: 'reference' })
    const withMeter = heardPath(metered.mock, metered.engine)
    expect(sorted(withMeter.ends)).toEqual(sorted([withMeter.mix, withMeter.reference]))
    expect(metered.engine.master.meter).not.toBeNull()
    expect(feeding(metered.mock, withMeter.mix)).toHaveLength(1)
    metered.engine.dispose()

    // A limiter at the end of the master, and a tap on what it puts out.
    const limited = rig()
    const limiter = fakeDevice(limited.mock, 'wall')
    await limited.engine.master.installLimiter(() => limiter)
    const tap = limited.mock.createGain()
    limited.engine.master.addTap(tap as unknown as AudioNode)
    limited.engine.setHeard({ source: 'reference' })
    const withLimiter = heardPath(limited.mock, limited.engine)
    expect(sorted(withLimiter.ends)).toEqual(sorted([withLimiter.mix, withLimiter.reference]))
    expect(feeding(limited.mock, withLimiter.mix)).toEqual([asMock(limiter.output)])
    expect(asMock(limiter.output).isConnectedTo(tap)).toBe(true)
    limited.engine.dispose()

    // Nothing but the chain: an insert and a limiter that come later go ahead of the gain.
    const plain = rig()
    plain.engine.setHeard({ source: 'reference' })
    const first = heardPath(plain.mock, plain.engine)
    expect(feeding(plain.mock, first.mix)).toEqual([asMock(plain.engine.master.gainNode)])
    const insert = fakeDevice(plain.mock, 'glue')
    plain.engine.master.addInsert(insert)
    expect(feeding(plain.mock, first.mix)).toEqual([asMock(insert.output)])
    const late = fakeDevice(plain.mock, 'wall')
    await plain.engine.master.installLimiter(() => late)
    expect(feeding(plain.mock, first.mix)).toEqual([asMock(late.output)])
    plain.engine.master.removeInsert(insert)
    expect(asMock(plain.engine.master.gainNode).reaches(first.mix)).toBe(true)
    const then = heardPath(plain.mock, plain.engine)
    expect(sorted(then.ends)).toEqual(sorted([first.mix, first.reference]))
    plain.engine.dispose()
  })

  it('is in no render: a bounce of the score while the reference is heard is the mix alone', async () => {
    const contexts: MockOfflineAudioContext[] = []
    const factory: OfflineContextFactory = ({ numberOfChannels, length, sampleRate }) => {
      const ctx = createMockOfflineContext({ numberOfChannels, length, sampleRate })
      contexts.push(ctx)
      return ctx as unknown as ReturnType<OfflineContextFactory>
    }
    const bounce = (score: Score) =>
      renderScore(score, {
        durationSec: 1,
        sampleRate: SR,
        createContext: factory,
        renderer: { resolveSource: () => buffer() },
      })

    const alone = await bounce(plainScore())
    const { engine, document } = await scoreRig(plainScore())
    engine.setHeard({ source: 'reference', referenceGain: 0.5 })
    const beside = await bounce(document.score)

    const [first, second] = contexts
    const kinds = (ctx: MockOfflineAudioContext) => ctx.allNodes().map((node) => node.kind)
    expect(kinds(second)).toEqual(kinds(first))
    expect(second.delays).toHaveLength(0)
    expect(feeding(second, second.destination)).toEqual([asMock(beside.engine.master.gainNode)])
    expect(second.scheduleSnapshot()).toEqual(first.scheduleSnapshot())
    expect(beside.engine.heard.source).toBe('mix')
    alone.engine.dispose()
    beside.engine.dispose()
    engine.dispose()
  })

  it('lets go of the heard path when the engine is disposed, and makes none afterwards', () => {
    const { mock, engine } = rig()
    engine.addAudioTrack('drums')
    engine.setHeard({ source: 'reference' })
    const { mix, reference, delay, sum } = heardPath(mock, engine)
    engine.dispose()
    for (const node of [mix, reference, delay, sum]) expect(node.outputs.size).toBe(0)
    expect(() => engine.setHeard({ source: 'mix' })).toThrow(/disposed/)
  })
})
