import { describe, expect, it } from 'vitest'

import { type Clip } from '../../core/clips/Clip'
import {
  OPERATION_TYPES,
  ScoreOperationError,
  apply,
  applyWithInverse,
  coalesceKey,
  describeOperation,
  invert,
  isOperation,
  type Operation,
} from '../operations'
import {
  defaultStrip,
  findDevice,
  findTrack,
  masterDestination,
  normaliseScore,
  parseScore,
  serializeScore,
  validateScore,
  type ParamTarget,
  type Score,
  type ScoreDevice,
  type ScoreTrack,
} from '../schema'
import { clip, demoScore, pick, seededRandom } from './fixtures'

const canon = (score: Score): Score => normaliseScore(score)

function audio(score: Score, id: string): Extract<ScoreTrack, { kind: 'audio' }> {
  const track = findTrack(score, id)
  if (track?.kind !== 'audio') throw new Error(`no audio track ${id}`)
  return track
}

describe('apply', () => {
  const base = demoScore()

  it('never mutates its input and shares untouched branches', () => {
    const before = serializeScore(base)
    const after = apply(base, { type: 'strip.set', owner: 'kick', param: 'level', value: 0.5 })
    expect(serializeScore(base)).toBe(before)
    expect(after.tracks[0].strip.level).toBe(0.5)
    expect(after.tracks[1]).toBe(base.tracks[1])
    expect(after.groups).toBe(base.groups)
  })

  it('adds and removes tracks, cascading lanes and routes on them', () => {
    const removed = apply(base, { type: 'track.remove', id: 'kick' })
    expect(findTrack(removed, 'kick')).toBeUndefined()
    expect(removed.routes).toEqual([])
    expect(findDevice(removed, 'kick-filter')).toBeUndefined()
    const padless = apply(base, { type: 'track.remove', id: 'pad' })
    expect(padless.lanes).toEqual([])
    expect(validateScore(removed)).toEqual([])
  })

  it('dissolving a group re-routes its members to where it fed', () => {
    const dissolved = apply(base, { type: 'group.remove', id: 'drums' })
    expect(findTrack(dissolved, 'kick')?.destination).toEqual(masterDestination())
    expect(validateScore(dissolved)).toEqual([])
  })

  it('removing a return drops every send to it', () => {
    const gone = apply(base, { type: 'return.remove', id: 'hall' })
    expect(gone.tracks.every((track) => track.strip.sends.length === 0)).toBe(true)
    expect(validateScore(gone)).toEqual([])
  })

  it('refuses to route a group into its own subtree', () => {
    const nested = apply(base, {
      type: 'group.add',
      group: {
        id: 'g2',
        name: '',
        destination: { kind: 'group', id: 'drums' },
        strip: defaultStrip(),
      },
    })
    expect(() =>
      apply(nested, { type: 'strip.route', id: 'drums', destination: { kind: 'group', id: 'g2' } }),
    ).toThrow(ScoreOperationError)
    expect(() =>
      apply(nested, {
        type: 'strip.route',
        id: 'drums',
        destination: { kind: 'group', id: 'drums' },
      }),
    ).toThrow(/loop/)
  })

  it('keeps clips sorted and normalised', () => {
    const added = apply(base, {
      type: 'clip.add',
      track: 'kick',
      clip: clip('z', 'a', 2, { loop: false }),
    })
    expect(audio(added, 'kick').clips.map((c) => c.id)).toEqual(['a1', 'z', 'b1'])
    expect('loop' in audio(added, 'kick').clips[1]).toBe(false)
    const moved = apply(added, { type: 'clip.move', track: 'kick', id: 'z', startSec: 9 })
    expect(audio(moved, 'kick').clips.map((c) => c.id)).toEqual(['a1', 'b1', 'z'])
  })

  it('clip.replaceFrom keeps what starts before the cut and refuses clips before it', () => {
    const replaced = apply(base, {
      type: 'clip.replaceFrom',
      track: 'kick',
      fromSec: 3,
      clips: [clip('n1', 'b', 3), clip('n2', 'a', 8)],
    })
    expect(audio(replaced, 'kick').clips.map((c) => c.id)).toEqual(['a1', 'n1', 'n2'])
    expect(() =>
      apply(base, {
        type: 'clip.replaceFrom',
        track: 'kick',
        fromSec: 3,
        clips: [clip('n', 'a', 1)],
      }),
    ).toThrow(/starts before/)
  })

  it('clip ops need an audio track and a known source', () => {
    expect(() =>
      apply(base, { type: 'clip.add', track: 'voice', clip: clip('x', 'a', 0) }),
    ).toThrow(/live track/)
    expect(() =>
      apply(base, { type: 'clip.add', track: 'kick', clip: clip('x', 'zz', 0) }),
    ).toThrow(/no source/)
    expect(() => apply(base, { type: 'source.remove', id: 'a' })).toThrow(/used by a clip/)
  })

  it('device ops address instances by id wherever they live', () => {
    let score = apply(base, { type: 'device.setParam', device: 'glue', param: 'ratio', value: 3 })
    expect(findDevice(score, 'glue')?.device.params).toEqual({ ratio: 3 })
    score = apply(score, { type: 'device.preset', device: 'glue', preset: 'Voice' })
    expect(findDevice(score, 'glue')?.device).toMatchObject({ preset: 'Voice', params: {} })
    score = apply(score, {
      type: 'device.setParams',
      device: 'glue',
      params: { knee: 1, ratio: 2 },
    })
    score = apply(score, { type: 'device.setParams', device: 'glue', params: { knee: null } })
    expect(findDevice(score, 'glue')?.device.params).toEqual({ ratio: 2 })
    score = apply(score, { type: 'device.bypass', device: 'hall-verb', bypass: true })
    expect(score.returns[0].device.bypass).toBe(true)
    expect(() => apply(score, { type: 'device.remove', id: 'hall-verb' })).toThrow(/own device/)
    score = apply(score, {
      type: 'device.add',
      owner: 'kick',
      device: { id: 'kick-eq', deviceId: 'eq3', params: {}, bypass: false },
      index: 0,
    })
    expect(score.tracks[0].strip.inserts.map((d) => d.id)).toEqual(['kick-eq', 'kick-filter'])
    score = apply(score, { type: 'device.move', id: 'kick-eq', index: 1 })
    expect(score.tracks[0].strip.inserts.map((d) => d.id)).toEqual(['kick-filter', 'kick-eq'])
    score = apply(score, { type: 'device.remove', id: 'kick-filter' })
    expect(score.routes).toEqual([])
  })

  it('the master takes a level and inserts but no pan, mute or sends', () => {
    const score = apply(base, { type: 'strip.set', owner: 'master', param: 'level', value: 0.5 })
    expect(score.master.level).toBe(0.5)
    expect(() =>
      apply(base, { type: 'strip.set', owner: 'master', param: 'pan', value: 0 }),
    ).toThrow()
    expect(() => apply(base, { type: 'strip.mute', owner: 'master', mute: true })).toThrow()
    expect(() =>
      apply(base, { type: 'send.add', owner: 'master', target: 'hall', level: 1 }),
    ).toThrow()
  })

  it('lanes: one per parameter, breakpoints deduped by time and sorted', () => {
    expect(() =>
      apply(base, {
        type: 'lane.add',
        lane: {
          id: 'dup',
          target: { kind: 'strip', owner: 'pad', param: 'level' },
          breakpoints: [],
        },
      }),
    ).toThrow(/already targets/)
    let score = apply(base, {
      type: 'lane.addBreakpoint',
      id: 'pad-level',
      breakpoint: { timeSec: 2, value: 0.5 },
    })
    expect(score.lanes[0].breakpoints.map((point) => point.timeSec)).toEqual([0, 2, 4])
    score = apply(score, {
      type: 'lane.addBreakpoint',
      id: 'pad-level',
      breakpoint: { timeSec: 2, value: 0.9 },
    })
    expect(score.lanes[0].breakpoints[1].value).toBe(0.9)
    score = apply(score, { type: 'lane.removeBreakpoint', id: 'pad-level', timeSec: 2 })
    expect(score.lanes[0].breakpoints).toHaveLength(2)
    expect(() =>
      apply(score, { type: 'lane.removeBreakpoint', id: 'pad-level', timeSec: 2 }),
    ).toThrow()
  })

  it('modulators: patches are checked against the kind; removal drops routes', () => {
    expect(() => apply(base, { type: 'modulator.update', id: 'lfo1', patch: { seed: 3 } })).toThrow(
      /no "seed"/,
    )
    const score = apply(base, {
      type: 'modulator.update',
      id: 'lfo1',
      patch: { rateHz: 2, shape: 'saw' },
    })
    expect(score.modulators[0]).toMatchObject({ rateHz: 2, shape: 'saw' })
    expect(apply(score, { type: 'modulator.remove', id: 'lfo1' }).routes).toEqual([])
  })

  it('batch applies in order and fails atomically', () => {
    const score = apply(base, {
      type: 'batch',
      ops: [
        { type: 'strip.set', owner: 'kick', param: 'level', value: 0.1 },
        { type: 'strip.mute', owner: 'kick', mute: true },
      ],
    })
    expect(score.tracks[0].strip).toMatchObject({ level: 0.1, mute: true })
    expect(() =>
      apply(base, {
        type: 'batch',
        ops: [
          { type: 'strip.set', owner: 'kick', param: 'level', value: 0.1 },
          { type: 'strip.mute', owner: 'nobody', mute: true },
        ],
      }),
    ).toThrow(ScoreOperationError)
  })

  it('every applied result stays valid', () => {
    const ops: Operation[] = [
      { type: 'score.rename', name: 'x' },
      { type: 'transport.loop', enabled: true, lengthSec: 16 },
      { type: 'source.add', source: { id: 'c' } },
      { type: 'track.move', id: 'kick', index: 2 },
      { type: 'group.move', id: 'drums', index: 0 },
      { type: 'return.move', id: 'hall', index: 0 },
      { type: 'strip.rename', id: 'kick', name: 'Kick 2' },
      { type: 'strip.solo', owner: 'kick', solo: true },
      { type: 'strip.soloSafe', owner: 'pad', soloSafe: true },
      { type: 'clip.trim', track: 'kick', id: 'a1', offsetSec: 1, durationSec: 2 },
      { type: 'clip.update', track: 'kick', id: 'a1', patch: { fadeCurve: 'linear', loop: true } },
      { type: 'send.set', owner: 'kick', target: 'hall', level: null },
      { type: 'send.remove', owner: 'voice', target: 'hall' },
      { type: 'lane.setBreakpoints', id: 'pad-level', breakpoints: [{ timeSec: 1, value: 1 }] },
      { type: 'route.update', id: 'r1', depth: -0.5, polarity: 'unipolar' },
      { type: 'lane.remove', id: 'pad-level' },
      { type: 'route.remove', id: 'r1' },
    ]
    let score = base
    for (const op of ops) {
      score = apply(score, op)
      expect(validateScore(score), op.type).toEqual([])
    }
    expect(score.name).toBe('x')
    expect(score.transport.loop).toEqual({ enabled: true, lengthSec: 16 })
  })

  it('describes operations, lists their types, and recognises them', () => {
    expect(OPERATION_TYPES).toContain('clip.replaceFrom')
    expect(new Set(OPERATION_TYPES).size).toBe(OPERATION_TYPES.length)
    expect(isOperation({ type: 'clip.add' })).toBe(true)
    expect(isOperation({ type: 'clip.explode' })).toBe(false)
    expect(isOperation(null)).toBe(false)
    expect(describeOperation({ type: 'strip.mute', owner: 'kick', mute: true })).toBe('mute kick')
    expect(describeOperation({ type: 'batch', ops: [], label: 'paint' })).toBe('paint')
    expect(describeOperation({ type: 'batch', ops: [{ type: 'score.rename', name: 'x' }] })).toBe(
      '1 operations',
    )
    expect(
      describeOperation({
        type: 'route.add',
        route: {
          id: 'r',
          source: 'lfo',
          target: { kind: 'device', device: 'd', param: 'mix' },
          depth: 1,
          polarity: 'unipolar',
        },
      }),
    ).toBe('route lfo → device:d:mix')
  })

  it('coalesce keys mark continuous gestures only', () => {
    expect(coalesceKey({ type: 'strip.set', owner: 'kick', param: 'level', value: 1 })).toBe(
      'strip.set|kick|level',
    )
    expect(coalesceKey({ type: 'device.setParam', device: 'd', param: 'p', value: 1 })).toBe(
      'device.setParam|d|p',
    )
    expect(coalesceKey({ type: 'clip.move', track: 't', id: 'c', startSec: 1 })).toBe(
      'clip.move|t|c',
    )
    expect(coalesceKey({ type: 'clip.trim', track: 't', id: 'c', durationSec: 1 })).toBe(
      'clip.trim|t|c|durationSec',
    )
    expect(coalesceKey({ type: 'strip.mute', owner: 'kick', mute: true })).toBeNull()
    expect(coalesceKey({ type: 'track.remove', id: 'kick' })).toBeNull()
  })
})

describe('invert', () => {
  const base = canon(demoScore())

  it('a cascading removal inverts to a batch that restores everything at its index', () => {
    const op: Operation = { type: 'return.remove', id: 'hall' }
    const { score, inverse } = applyWithInverse(base, op)
    expect(inverse.type).toBe('batch')
    if (inverse.type !== 'batch') throw new Error('expected batch')
    expect(inverse.ops.map((child) => child.type)).toEqual(['return.add', 'send.add', 'send.add'])
    expect(canon(apply(score, inverse))).toEqual(base)
  })

  it('a removal with nothing attached inverts to a plain add at the old index', () => {
    const withSource = apply(base, { type: 'source.add', source: { id: 'c' }, index: 1 })
    const { score, inverse } = applyWithInverse(withSource, { type: 'source.remove', id: 'c' })
    expect(inverse).toEqual({ type: 'source.add', source: { id: 'c' }, index: 1 })
    expect(canon(apply(score, inverse))).toEqual(canon(withSource))
    const lane = applyWithInverse(base, { type: 'lane.remove', id: 'pad-level' })
    expect(lane.inverse).toEqual({ type: 'lane.add', lane: base.lanes[0], index: 0 })
  })

  it('setParam on an inherited value inverts to clearing it', () => {
    const { score, inverse } = applyWithInverse(base, {
      type: 'device.setParam',
      device: 'glue',
      param: 'ratio',
      value: 3,
    })
    expect(inverse).toEqual({ type: 'device.setParams', device: 'glue', params: { ratio: null } })
    expect(canon(apply(score, inverse))).toEqual(base)
  })

  it('a batch inverts to the reversed inverses', () => {
    const op: Operation = {
      type: 'batch',
      label: 'two',
      ops: [
        { type: 'track.remove', id: 'kick' },
        { type: 'group.remove', id: 'drums' },
      ],
    }
    const { score, inverse } = applyWithInverse(base, op)
    if (inverse.type !== 'batch') throw new Error('expected batch')
    expect(inverse.label).toBe('two')
    expect(inverse.ops.map((child) => child.type)).toEqual(['group.add', 'batch'])
    expect(canon(apply(score, inverse))).toEqual(base)
  })

  it('invert throws for operations that do not fit the score', () => {
    expect(() => invert(base, { type: 'clip.remove', track: 'kick', id: 'nope' })).toThrow(
      ScoreOperationError,
    )
  })
})

// --- Property-style: apply(inverse(op), apply(op)) restores the score for random ops ---

interface Generated {
  op: Operation
}

function randomOp(random: () => number, score: Score, counter: { n: number }): Generated | null {
  const fresh = (): string => `n${counter.n++}`
  const owners = [...score.tracks, ...score.groups, ...score.returns]
  // Keep the document populated: most operations need something to act on.
  if (owners.length < 3) {
    const id = fresh()
    return {
      op: {
        type: 'track.add',
        track: {
          kind: 'audio',
          id,
          name: id,
          destination: masterDestination(),
          strip: defaultStrip(),
          clips: [],
        },
      },
    }
  }
  const owner = pick(random, owners)
  const audioTracks = score.tracks.filter((track) => track.kind === 'audio')
  const devices: ScoreDevice[] = [
    ...score.master.inserts,
    ...score.tracks.flatMap((track) =>
      track.kind === 'instrument' ? [track.device, ...track.strip.inserts] : track.strip.inserts,
    ),
    ...score.groups.flatMap((group) => group.strip.inserts),
    ...score.returns.flatMap((ret) => [ret.device, ...ret.strip.inserts]),
  ]
  const kinds = [
    'strip.set',
    'strip.set',
    'strip.mute',
    'strip.solo',
    'strip.soloSafe',
    'strip.rename',
    'strip.route',
    'track.add',
    'track.remove',
    'track.move',
    'group.add',
    'group.remove',
    'return.add',
    'return.remove',
    'clip.add',
    'clip.remove',
    'clip.move',
    'clip.trim',
    'clip.update',
    'clip.replaceFrom',
    'device.add',
    'device.remove',
    'device.move',
    'device.setParam',
    'device.setParams',
    'device.preset',
    'device.bypass',
    'send.add',
    'send.remove',
    'send.set',
    'lane.add',
    'lane.remove',
    'lane.setBreakpoints',
    'lane.addBreakpoint',
    'lane.removeBreakpoint',
    'modulator.add',
    'modulator.remove',
    'modulator.update',
    'route.add',
    'route.remove',
    'route.update',
    'transport.loop',
    'source.add',
    'batch',
  ] as const
  const kind = pick(random, kinds)
  const value = Math.round(random() * 100) / 100
  const destination = (): Score['tracks'][number]['destination'] =>
    score.groups.length > 0 && random() < 0.5
      ? { kind: 'group', id: pick(random, score.groups).id }
      : masterDestination()
  const someDevice = () => (devices.length ? pick(random, devices) : null)
  const someLane = () => (score.lanes.length ? pick(random, score.lanes) : null)
  const someRoute = () => (score.routes.length ? pick(random, score.routes) : null)
  const someModulator = () => (score.modulators.length ? pick(random, score.modulators) : null)
  const someSource = () => (score.sources.length ? pick(random, score.sources) : null)
  const someTrack = () => (audioTracks.length ? pick(random, audioTracks) : null)
  const someClip = (track: Extract<ScoreTrack, { kind: 'audio' }> | null): Clip | null =>
    track?.clips.length ? pick(random, track.clips) : null
  const newDevice = (): ScoreDevice => ({
    id: fresh(),
    deviceId: pick(random, ['filter', 'eq3', 'compressor', 'delay', 'utility']),
    params: random() < 0.5 ? { frequency: 100 + value * 1000 } : {},
    bypass: random() < 0.2,
  })
  const target = (): ParamTarget => {
    const device = someDevice()
    if (device && random() < 0.5)
      return {
        kind: 'device',
        device: device.id,
        param: pick(random, ['frequency', 'gain', 'mix']),
      }
    return {
      kind: 'strip',
      owner: random() < 0.1 ? 'master' : owner.id,
      param: random() < 0.1 ? 'level' : pick(random, ['level', 'pan', 'inputGain']),
    }
  }

  switch (kind) {
    case 'strip.set':
      return {
        op: {
          type: 'strip.set',
          owner: owner.id,
          param: pick(random, ['level', 'pan', 'inputGain']),
          value: value * 2 - (random() < 0.3 ? 1 : 0),
        },
      }
    case 'strip.mute':
      return { op: { type: 'strip.mute', owner: owner.id, mute: random() < 0.5 } }
    case 'strip.solo':
      return { op: { type: 'strip.solo', owner: owner.id, solo: random() < 0.5 } }
    case 'strip.soloSafe':
      return { op: { type: 'strip.soloSafe', owner: owner.id, soloSafe: random() < 0.5 } }
    case 'strip.rename':
      return { op: { type: 'strip.rename', id: owner.id, name: fresh() } }
    case 'strip.route':
      return { op: { type: 'strip.route', id: owner.id, destination: destination() } }
    case 'track.add': {
      const id = fresh()
      const track: ScoreTrack =
        random() < 0.5
          ? {
              kind: 'audio',
              id,
              name: id,
              destination: destination(),
              strip: defaultStrip({ inserts: random() < 0.5 ? [newDevice()] : [] }),
              clips: [],
            }
          : { kind: 'live', id, name: id, destination: destination(), strip: defaultStrip() }
      return {
        op: { type: 'track.add', track, index: Math.floor(random() * (score.tracks.length + 1)) },
      }
    }
    case 'track.remove':
      return score.tracks.length
        ? { op: { type: 'track.remove', id: pick(random, score.tracks).id } }
        : null
    case 'track.move':
      return score.tracks.length
        ? {
            op: {
              type: 'track.move',
              id: pick(random, score.tracks).id,
              index: Math.floor(random() * score.tracks.length),
            },
          }
        : null
    case 'group.add': {
      const id = fresh()
      return {
        op: {
          type: 'group.add',
          group: { id, name: id, destination: destination(), strip: defaultStrip() },
          index: Math.floor(random() * (score.groups.length + 1)),
        },
      }
    }
    case 'group.remove':
      return score.groups.length
        ? { op: { type: 'group.remove', id: pick(random, score.groups).id } }
        : null
    case 'return.add': {
      const id = fresh()
      return {
        op: {
          type: 'return.add',
          return: {
            id,
            name: id,
            destination: destination(),
            strip: defaultStrip({ soloSafe: true }),
            device: { id: fresh(), deviceId: 'convolver-reverb', params: {}, bypass: false },
          },
        },
      }
    }
    case 'return.remove':
      return score.returns.length
        ? { op: { type: 'return.remove', id: pick(random, score.returns).id } }
        : null
    case 'clip.add': {
      const track = someTrack()
      const source = someSource()
      if (!track || !source) return null
      return {
        op: {
          type: 'clip.add',
          track: track.id,
          clip: clip(fresh(), source.id, Math.floor(value * 20), { loop: random() < 0.3 }),
        },
      }
    }
    case 'clip.remove': {
      const track = someTrack()
      const c = someClip(track)
      return track && c ? { op: { type: 'clip.remove', track: track.id, id: c.id } } : null
    }
    case 'clip.move': {
      const track = someTrack()
      const c = someClip(track)
      return track && c
        ? { op: { type: 'clip.move', track: track.id, id: c.id, startSec: Math.floor(value * 20) } }
        : null
    }
    case 'clip.trim': {
      const track = someTrack()
      const c = someClip(track)
      return track && c
        ? {
            op: {
              type: 'clip.trim',
              track: track.id,
              id: c.id,
              offsetSec: value,
              durationSec: 1 + value,
            },
          }
        : null
    }
    case 'clip.update': {
      const track = someTrack()
      const c = someClip(track)
      return track && c
        ? {
            op: {
              type: 'clip.update',
              track: track.id,
              id: c.id,
              patch: {
                loop: random() < 0.5,
                gainDb: value * -12,
                fadeCurve: pick(random, ['linear', 'equalPower']),
              },
            },
          }
        : null
    }
    case 'clip.replaceFrom': {
      const track = someTrack()
      const source = someSource()
      if (!track || !source) return null
      const fromSec = Math.floor(value * 10)
      return {
        op: {
          type: 'clip.replaceFrom',
          track: track.id,
          fromSec,
          clips: [clip(fresh(), source.id, fromSec + 1), clip(fresh(), source.id, fromSec + 6)],
        },
      }
    }
    case 'device.add':
      return {
        op: {
          type: 'device.add',
          owner: random() < 0.2 ? 'master' : owner.id,
          device: newDevice(),
          index: 0,
        },
      }
    case 'device.remove': {
      const device = someDevice()
      return device ? { op: { type: 'device.remove', id: device.id } } : null
    }
    case 'device.move': {
      const device = someDevice()
      return device ? { op: { type: 'device.move', id: device.id, index: 0 } } : null
    }
    case 'device.setParam': {
      const device = someDevice()
      return device
        ? {
            op: {
              type: 'device.setParam',
              device: device.id,
              param: pick(random, ['frequency', 'gain', 'wet']),
              value,
            },
          }
        : null
    }
    case 'device.setParams': {
      const device = someDevice()
      return device
        ? {
            op: {
              type: 'device.setParams',
              device: device.id,
              params: { frequency: random() < 0.3 ? null : value, q: value },
            },
          }
        : null
    }
    case 'device.preset': {
      const device = someDevice()
      return device
        ? {
            op: {
              type: 'device.preset',
              device: device.id,
              preset: random() < 0.3 ? null : fresh(),
              params: random() < 0.5 ? { wet: value } : undefined,
            },
          }
        : null
    }
    case 'device.bypass': {
      const device = someDevice()
      return device
        ? { op: { type: 'device.bypass', device: device.id, bypass: random() < 0.5 } }
        : null
    }
    case 'send.add':
      return score.returns.length
        ? {
            op: {
              type: 'send.add',
              owner: owner.id,
              target: pick(random, score.returns).id,
              level: random() < 0.3 ? null : value,
              index: Math.floor(random() * (owner.strip.sends.length + 1)),
            },
          }
        : null
    case 'send.remove':
      return owner.strip.sends.length
        ? {
            op: {
              type: 'send.remove',
              owner: owner.id,
              target: pick(random, owner.strip.sends).target,
            },
          }
        : null
    case 'send.set':
      return owner.strip.sends.length
        ? {
            op: {
              type: 'send.set',
              owner: owner.id,
              target: pick(random, owner.strip.sends).target,
              level: random() < 0.3 ? null : value,
            },
          }
        : null
    case 'lane.add':
      return {
        op: {
          type: 'lane.add',
          lane: {
            id: fresh(),
            target: target(),
            breakpoints: [
              { timeSec: value * 4, value },
              { timeSec: 5, value: 1, curve: 'step' },
            ],
            defaultValue: random() < 0.5 ? value : undefined,
          },
          index: Math.floor(random() * (score.lanes.length + 1)),
        },
      }
    case 'lane.remove': {
      const lane = someLane()
      return lane ? { op: { type: 'lane.remove', id: lane.id } } : null
    }
    case 'lane.setBreakpoints': {
      const lane = someLane()
      return lane
        ? {
            op: {
              type: 'lane.setBreakpoints',
              id: lane.id,
              breakpoints: [{ timeSec: value, value }],
            },
          }
        : null
    }
    case 'lane.addBreakpoint': {
      const lane = someLane()
      return lane
        ? {
            op: {
              type: 'lane.addBreakpoint',
              id: lane.id,
              breakpoint: {
                timeSec:
                  random() < 0.5 && lane.breakpoints.length
                    ? pick(random, lane.breakpoints).timeSec
                    : value * 8,
                value,
                curve: pick(random, ['linear', 'smooth', undefined]),
              },
            },
          }
        : null
    }
    case 'lane.removeBreakpoint': {
      const lane = someLane()
      return lane?.breakpoints.length
        ? {
            op: {
              type: 'lane.removeBreakpoint',
              id: lane.id,
              timeSec: pick(random, lane.breakpoints).timeSec,
            },
          }
        : null
    }
    case 'modulator.add': {
      const id = fresh()
      const modulator = pick<Score['modulators'][number]>(random, [
        { id, kind: 'lfo', rateHz: value, shape: 'triangle', depth: value, phase: 0.25 },
        { id, kind: 'random', rateHz: 1 + value, seed: 7, smooth: true },
        { id, kind: 'macro', value },
        { id, kind: 'external-phase', phaseOffset: -0.25, depth: 1, shape: 'sine' },
      ])
      return {
        op: {
          type: 'modulator.add',
          modulator,
          index: Math.floor(random() * (score.modulators.length + 1)),
        },
      }
    }
    case 'modulator.remove': {
      const modulator = someModulator()
      return modulator ? { op: { type: 'modulator.remove', id: modulator.id } } : null
    }
    case 'modulator.update': {
      const modulator = someModulator()
      if (!modulator) return null
      const patch =
        modulator.kind === 'lfo'
          ? { rateHz: value, depth: value }
          : modulator.kind === 'random'
            ? { seed: Math.floor(value * 100), smooth: random() < 0.5 }
            : modulator.kind === 'macro'
              ? { value }
              : { phaseOffset: value }
      return { op: { type: 'modulator.update', id: modulator.id, patch } }
    }
    case 'route.add': {
      const modulator = someModulator()
      return modulator
        ? {
            op: {
              type: 'route.add',
              route: {
                id: fresh(),
                source: modulator.id,
                target: target(),
                depth: value * 2 - 1,
                polarity: pick(random, ['unipolar', 'bipolar']),
              },
              index: Math.floor(random() * (score.routes.length + 1)),
            },
          }
        : null
    }
    case 'route.remove': {
      const route = someRoute()
      return route ? { op: { type: 'route.remove', id: route.id } } : null
    }
    case 'route.update': {
      const route = someRoute()
      return route
        ? {
            op: {
              type: 'route.update',
              id: route.id,
              depth: random() < 0.5 ? value : undefined,
              polarity: random() < 0.5 ? 'bipolar' : undefined,
            },
          }
        : null
    }
    case 'transport.loop':
      return {
        op: {
          type: 'transport.loop',
          enabled: random() < 0.5,
          lengthSec: random() < 0.3 ? null : 1 + value * 30,
        },
      }
    case 'source.add':
      return {
        op: {
          type: 'source.add',
          source: { id: fresh(), url: '/x.mp3' },
          index: Math.floor(random() * (score.sources.length + 1)),
        },
      }
    case 'batch': {
      const ops: Operation[] = []
      let current = score
      for (let i = 0; i < 3; i += 1) {
        const child = randomOp(random, current, counter)
        if (!child || child.op.type === 'batch') continue
        try {
          current = apply(current, child.op)
          ops.push(child.op)
        } catch (error) {
          if (!(error instanceof ScoreOperationError)) throw error
        }
      }
      return ops.length ? { op: { type: 'batch', ops } } : null
    }
    default: {
      const exhaustive: never = kind
      return exhaustive
    }
  }
}

describe('apply(inverse(op), apply(op)) restores the score (property-style)', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8])('seed %i: 150 random operations round-trip', (seed) => {
    const random = seededRandom(seed)
    const counter = { n: 0 }
    let score = canon(demoScore())
    let applied = 0
    let rejected = 0
    for (let step = 0; step < 150; step += 1) {
      const generated = randomOp(random, score, counter)
      if (!generated) continue
      let result
      try {
        result = applyWithInverse(score, generated.op)
      } catch (error) {
        if (!(error instanceof ScoreOperationError)) throw error
        rejected += 1
        continue
      }
      applied += 1
      const after = result.score
      expect(validateScore(after), `${generated.op.type} left an invalid score`).toEqual([])
      const restored = apply(after, result.inverse)
      expect(canon(restored), `undo of ${generated.op.type}`).toEqual(score)
      const redone = apply(restored, generated.op)
      expect(canon(redone), `redo of ${generated.op.type}`).toEqual(canon(after))
      // The inverse of the inverse re-applies cleanly too.
      const inverseInverse = invert(after, result.inverse)
      expect(canon(apply(score, inverseInverse)), `inverse² of ${generated.op.type}`).toEqual(
        canon(after),
      )
      score = canon(after)
    }
    expect(applied).toBeGreaterThan(60)
    expect(rejected).toBeLessThan(applied)
    expect(parseScore(serializeScore(score))).toEqual(score)
  })
})
