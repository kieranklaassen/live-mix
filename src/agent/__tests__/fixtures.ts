// Shared fixtures for the agent tests: valid tool arguments for every score
// operation against the U28 demo score, a library on the intensity ladder,
// and a rig that wires an engine on the recording mocks, a document rendered
// onto it, and an AgentController over both.

import { type Device } from '../../core/devices/Device'
import { NODE_DEVICES } from '../../core/devices/native'
import { DeviceRegistry, type DeviceDescriptor } from '../../core/devices/registry'
import { DUCKER_PARAMS } from '../../core/devices/native/ducker-abi'
import { createEngine, type Engine } from '../../core/Engine'
import { type Operation, type OperationType } from '../../score/operations'
import { loadScore } from '../../score/loadScore'
import { defaultStrip, masterDestination, type Score } from '../../score/schema'
import { ScoreDocument } from '../../score/ScoreDocument'
import { type ScoreRenderer } from '../../score/ScoreRenderer'
import { clip, demoScore } from '../../score/__tests__/fixtures'
import {
  MockAudioBuffer,
  asAudioContext,
  createMockContext,
  type MockAudioContext,
} from '../../testing'
import { AgentController, type AgentControllerOptions } from '../AgentController'
import { type AgentTrack } from '../types'

/** Valid arguments for every operation tool, each applicable to `demoScore()`. */
export const OPERATION_ARGS: Record<OperationType, Record<string, unknown>> = {
  'score.rename': { name: 'Evening' },
  'transport.loop': { enabled: true, lengthSec: 30 },
  'tempo.set': {
    segments: [
      { atSec: 0, bpm: 90 },
      { atSec: 30, bpm: 100, beatsPerBar: 3 },
    ],
  },
  'elementTrack.add': {
    track: {
      id: 'bed',
      name: 'Bed',
      destination: { kind: 'master' },
      clips: [clip('bed1', 'a', 0, { durationSec: 10 })],
    },
  },
  'elementTrack.remove': { id: 'bed' },
  'elementTrack.route': { id: 'bed', destination: { kind: 'group', id: 'drums' } },
  'elementTrack.setClips': { id: 'bed', clips: [clip('bed2', 'a', 2, { durationSec: 6 })] },
  'source.add': { source: { id: 'c', url: '/c.mp3', durationSec: 12 } },
  'source.remove': { id: 'c' },
  'track.add': {
    track: {
      kind: 'live',
      id: 'guitar',
      name: 'Guitar',
      destination: { kind: 'master' },
      strip: defaultStrip(),
    },
  },
  'track.remove': { id: 'pad' },
  'track.move': { id: 'pad', index: 0 },
  'group.add': {
    group: { id: 'beds', name: 'Beds', destination: { kind: 'master' }, strip: defaultStrip() },
  },
  'group.remove': { id: 'drums' },
  'group.move': { id: 'drums', index: 0 },
  'return.add': {
    return: {
      id: 'plate',
      name: 'Plate',
      destination: { kind: 'master' },
      strip: defaultStrip(),
      device: { id: 'plate-verb', deviceId: 'convolver-reverb', params: {}, bypass: false },
    },
  },
  'return.remove': { id: 'hall' },
  'return.move': { id: 'hall', index: 0 },
  'strip.rename': { id: 'kick', name: 'Kick drum' },
  'strip.route': { id: 'pad', destination: { kind: 'group', id: 'drums' } },
  'strip.set': { owner: 'kick', param: 'level', value: 0.6 },
  'strip.mute': { owner: 'kick', mute: true },
  'strip.solo': { owner: 'kick', solo: true },
  'strip.soloSafe': { owner: 'pad', soloSafe: true },
  'clip.add': { track: 'pad', clip: clip('a3', 'a', 8) },
  'clip.remove': { track: 'kick', id: 'b1' },
  'clip.move': { track: 'kick', id: 'b1', startSec: 6 },
  'clip.trim': { track: 'kick', id: 'b1', durationSec: 2 },
  'clip.update': { track: 'kick', id: 'b1', patch: { gainDb: -6, loop: true } },
  'clip.replaceFrom': { track: 'kick', fromSec: 4, clips: [clip('n1', 'a', 4)] },
  'device.add': {
    owner: 'pad',
    device: { id: 'pad-filter', deviceId: 'filter', params: { frequency: 800 }, bypass: false },
  },
  'device.remove': { id: 'kick-filter' },
  'device.move': { id: 'kick-filter', index: 0 },
  'device.setParam': { device: 'kick-filter', param: 'frequency', value: 1200 },
  'device.setParams': { device: 'kick-filter', params: { frequency: 900, q: null } },
  'device.preset': { device: 'glue', preset: null, params: { ratio: 2 } },
  'device.bypass': { device: 'kick-filter', bypass: true },
  'send.add': { owner: 'pad', target: 'hall', level: 0.2 },
  'send.remove': { owner: 'kick', target: 'hall' },
  'send.set': { owner: 'kick', target: 'hall', level: 0.5 },
  'lane.add': {
    lane: {
      id: 'kick-level',
      target: { kind: 'strip', owner: 'kick', param: 'level' },
      breakpoints: [{ timeSec: 0, value: 0.5 }],
    },
  },
  'lane.remove': { id: 'pad-level' },
  'lane.setBreakpoints': {
    id: 'pad-level',
    breakpoints: [
      { timeSec: 0, value: 0.1 },
      { timeSec: 2, value: 0.9, curve: 'smooth' },
    ],
  },
  'lane.addBreakpoint': { id: 'pad-level', breakpoint: { timeSec: 8, value: 0.3 } },
  'lane.removeBreakpoint': { id: 'pad-level', timeSec: 4 },
  'modulator.add': { modulator: { id: 'm1', kind: 'macro', value: 0.5 } },
  'modulator.remove': { id: 'lfo1' },
  'modulator.update': { id: 'lfo1', patch: { rateHz: 1, shape: 'triangle' } },
  'route.add': {
    route: {
      id: 'r2',
      source: 'lfo1',
      target: { kind: 'strip', owner: 'pad', param: 'pan' },
      depth: 0.5,
      polarity: 'bipolar',
    },
  },
  'route.remove': { id: 'r1' },
  'route.update': { id: 'r1', depth: -0.5, polarity: 'unipolar' },
  'transport.quantize': { quantize: 2 },
  'scene.add': { scene: { id: 'chorus', name: 'Chorus' } },
  'scene.remove': { id: 'verse' },
  'scene.move': { id: 'verse', index: 0 },
  'scene.rename': { id: 'verse', name: 'Intro' },
  'slot.add': {
    slot: {
      id: 'kick-verse',
      track: 'kick',
      scene: 'verse',
      clip: {
        sourceId: 'a',
        offsetSec: 0,
        durationSec: 4,
        fadeInSec: 0,
        fadeOutSec: 0.1,
        fadeCurve: 'linear',
        gainDb: 0,
        loop: true,
      },
      quantize: 'bar',
      launchMode: 'toggle',
      legato: false,
      follow: { a: 'next', b: 'stop', chance: 0.7, time: { unit: 'bars', value: 4 } },
    },
  },
  'slot.remove': { id: 'kick-verse' },
  'slot.update': { id: 'kick-verse', patch: { legato: true, quantize: null, follow: null } },
  batch: {
    ops: [
      { type: 'strip.mute', owner: 'kick', mute: true },
      { type: 'strip.set', owner: 'pad', param: 'level', value: 0.5 },
    ],
    label: 'two edits',
  },
}

/** Operations that must precede a sample for it to fit the demo score. */
const addBed: Operation = {
  type: 'elementTrack.add',
  track: { id: 'bed', name: 'Bed', destination: { kind: 'master' }, clips: [] },
}

const addVerse: Operation = { type: 'scene.add', scene: { id: 'verse', name: 'Verse' } }
const addKickVerse: Operation = {
  type: 'slot.add',
  slot: {
    id: 'kick-verse',
    track: 'kick',
    scene: 'verse',
    clip: null,
    launchMode: 'trigger',
    legato: false,
  },
}

export const OPERATION_PRELUDE: Partial<Record<OperationType, Operation[]>> = {
  'source.remove': [{ type: 'source.add', source: { id: 'c', url: '/c.mp3', durationSec: 12 } }],
  'elementTrack.remove': [addBed],
  'elementTrack.route': [addBed],
  'elementTrack.setClips': [addBed],
  'scene.remove': [addVerse],
  'scene.move': [addVerse],
  'scene.rename': [addVerse],
  'slot.add': [addVerse],
  'slot.remove': [addVerse, addKickVerse],
  'slot.update': [addVerse, addKickVerse],
}

/** A small library across the ladder; every key sits with 8A or its neighbours except 3B. */
export function library(): AgentTrack[] {
  return [
    {
      id: 101,
      title: 'Still Water',
      intensity: 1,
      camelot: '7A',
      durationSec: 180,
      url: '/101.mp3',
    },
    { id: 102, title: 'Low Tide', intensity: 1, camelot: '9B', durationSec: 200, url: '/102.mp3' },
    { id: 103, title: 'Far Shore', intensity: 1, camelot: '3B', durationSec: 150, url: '/103.mp3' },
    {
      id: 201,
      title: 'Slow Pulse',
      intensity: 2,
      camelot: '8A',
      durationSec: 240,
      url: '/201.mp3',
    },
    {
      id: 202,
      title: 'Warm Current',
      intensity: 2,
      camelot: '8B',
      durationSec: 210,
      url: '/202.mp3',
    },
    { id: 301, title: 'Rising', intensity: 3, camelot: '9A', durationSec: 220, url: '/301.mp3' },
    { id: 302, title: 'Open Sky', intensity: 3, camelot: '7B', durationSec: 190, url: '/302.mp3' },
  ]
}

/**
 * A `ducker` descriptor for the score (the dsp entry's worklet ducker has the
 * same params); instantiates as a pass-through gain so the renderer can host it.
 */
export function duckerDescriptor(): DeviceDescriptor {
  return {
    id: 'ducker',
    name: 'Ducker',
    kind: 'node',
    category: 'dynamics',
    version: 1,
    params: DUCKER_PARAMS,
    create: (context) => {
      const node = context.createGain()
      const values: Record<string, number> = {}
      const device: Device = {
        id: 'ducker',
        input: node,
        output: node,
        params: DUCKER_PARAMS,
        setParam: (name, value) => {
          values[name] = value
        },
        getParam: (name) =>
          values[name] ?? DUCKER_PARAMS[name as keyof typeof DUCKER_PARAMS].default,
        bypass: false,
        latencySec: 0,
        dispose: () => node.disconnect(),
      }
      return device
    },
  }
}

/**
 * A breathwork-shaped score: the coach's voice (live), a music track playing
 * track 201 (8A, intensity 2) from 0 to 240 s with a ducker insert, and an
 * ambience track.
 */
export function sessionScore(): Score {
  const score = demoScore()
  score.id = 'session'
  score.name = 'Evening grounding'
  score.sources = [
    { id: '201', url: '/201.mp3', durationSec: 240, analysis: { intensity: 2, camelot: '8A' } },
  ]
  score.groups = []
  score.returns = []
  score.lanes = []
  score.modulators = []
  score.routes = []
  score.master = { level: 1, inserts: [] }
  score.tracks = [
    {
      kind: 'live',
      id: 'voice',
      name: 'Voice',
      destination: masterDestination(),
      strip: defaultStrip(),
    },
    {
      kind: 'audio',
      id: 'music',
      name: 'Music',
      destination: masterDestination(),
      strip: defaultStrip({
        level: 0.8,
        inserts: [{ id: 'music-duck', deviceId: 'ducker', params: { depth: 0.5 }, bypass: false }],
      }),
      clips: [
        clip('c201', '201', 0, {
          durationSec: 240,
          fadeInSec: 2.5,
          fadeOutSec: 2.5,
          gainDb: 0,
        }),
      ],
    },
    {
      kind: 'audio',
      id: 'ambience',
      name: 'Ambience',
      destination: masterDestination(),
      strip: defaultStrip({ level: 0.4 }),
      clips: [],
    },
  ]
  return score
}

export interface Rig {
  ctx: MockAudioContext
  engine: Engine
  document: ScoreDocument
  renderer: ScoreRenderer
  controller: AgentController
  clock: { ms: number }
}

export interface RigOptions extends Partial<AgentControllerOptions> {
  score?: Score
  /** Skip rendering onto the engine (pure document tests). */
  render?: boolean
}

export async function rig(options: RigOptions = {}): Promise<Rig> {
  const ctx = createMockContext({ sampleRate: 48000 })
  const registry = new DeviceRegistry([...NODE_DEVICES, duckerDescriptor()])
  const engine = createEngine({
    context: asAudioContext(ctx),
    setIntervalFn: () => 0 as unknown as ReturnType<typeof setInterval>,
    clearIntervalFn: () => {},
    devices: registry,
  })
  const buffer = new MockAudioBuffer(2, 48000 * 10, 48000) as unknown as AudioBuffer
  for (const id of ['a', 'b', '201', '101', '102', '103', '202', '301', '302']) {
    await engine.samples.load(id, buffer)
  }
  const clock = { ms: 1_000_000 }
  const document = new ScoreDocument(options.score ?? sessionScore(), { now: () => clock.ms })
  const renderer = loadScore(engine, document, { onError: () => {} })
  if (options.render !== false) await renderer.whenIdle()
  const controllerOptions: RigOptions = { ...options }
  delete controllerOptions.score
  delete controllerOptions.render
  const controller = new AgentController({
    engine,
    document,
    roles: { voice: 'voice', music: 'music', ambience: 'ambience' },
    library: library(),
    now: () => clock.ms,
    ...controllerOptions,
  })
  return { ctx, engine, document, renderer, controller, clock }
}
