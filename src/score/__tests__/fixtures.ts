// Shared fixtures: a small but complete score exercising every document
// feature (group, return, audio/live tracks, inserts, sends, clips, a lane,
// a modulator and a route, master insert), plus a seeded PRNG for
// property-style tests.

import { type Clip } from '../../core/clips/Clip'
import {
  createScore,
  defaultStrip,
  groupDestination,
  masterDestination,
  type Score,
} from '../schema'

export function clip(
  id: string,
  sourceId: string,
  startSec: number,
  overrides: Partial<Clip> = {},
): Clip {
  return {
    id,
    sourceId,
    startSec,
    offsetSec: 0,
    durationSec: 4,
    fadeInSec: 0.5,
    fadeOutSec: 0.5,
    fadeCurve: 'equalPower',
    gainDb: -3,
    ...overrides,
  }
}

export function demoScore(): Score {
  const score = createScore({ id: 'demo', name: 'Demo' })
  score.sources = [
    { id: 'a', url: '/a.mp3', durationSec: 10 },
    { id: 'b', durationSec: 10 },
  ]
  score.groups = [
    {
      id: 'drums',
      name: 'Drums',
      destination: masterDestination(),
      strip: defaultStrip({ level: 0.9 }),
    },
  ]
  score.returns = [
    {
      id: 'hall',
      name: 'Hall',
      destination: masterDestination(),
      device: {
        id: 'hall-verb',
        deviceId: 'convolver-reverb',
        params: { wet: 0.3 },
        bypass: false,
      },
      strip: defaultStrip({ soloSafe: true }),
    },
  ]
  score.tracks = [
    {
      kind: 'audio',
      id: 'kick',
      name: 'Kick',
      destination: groupDestination('drums'),
      strip: defaultStrip({
        level: 0.8,
        pan: -0.2,
        inserts: [
          { id: 'kick-filter', deviceId: 'filter', params: { frequency: 2000 }, bypass: false },
        ],
        sends: [{ target: 'hall', level: 0.25 }],
      }),
      clips: [clip('a1', 'a', 0), clip('b1', 'b', 4, { fadeCurve: 'linear', gainDb: 0 })],
    },
    {
      kind: 'audio',
      id: 'pad',
      name: 'Pad',
      destination: masterDestination(),
      strip: defaultStrip({ mute: true }),
      clips: [clip('a2', 'a', 1, { durationSec: 6, loop: true })],
    },
    {
      kind: 'live',
      id: 'voice',
      name: 'Voice',
      destination: masterDestination(),
      strip: defaultStrip({ sends: [{ target: 'hall', level: null }] }),
    },
  ]
  score.master = {
    level: 0.9,
    inserts: [{ id: 'glue', deviceId: 'compressor', preset: 'Glue', params: {}, bypass: false }],
  }
  score.lanes = [
    {
      id: 'pad-level',
      target: { kind: 'strip', owner: 'pad', param: 'level' },
      breakpoints: [
        { timeSec: 0, value: 0.2 },
        { timeSec: 4, value: 0.8, curve: 'smooth' },
      ],
    },
  ]
  score.modulators = [{ id: 'lfo1', kind: 'lfo', rateHz: 0.5, shape: 'sine', depth: 1, phase: 0 }]
  score.routes = [
    {
      id: 'r1',
      source: 'lfo1',
      target: { kind: 'device', device: 'kick-filter', param: 'frequency' },
      depth: 0.3,
      polarity: 'bipolar',
    },
  ]
  return score
}

/** mulberry32: a tiny seeded PRNG, enough for property-style tests. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pick<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)]
}
