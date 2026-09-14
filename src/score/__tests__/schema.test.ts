import { describe, expect, it } from 'vitest'

import { devices } from '../../core/devices'
import {
  SCORE_FORMAT_VERSION,
  ScoreValidationError,
  allDevices,
  createScore,
  defaultStrip,
  findDevice,
  masterDestination,
  migrateScore,
  normaliseScore,
  parseScore,
  serializeScore,
  targetKey,
  validateScore,
} from '../schema'
import { demoScore } from './fixtures'

describe('createScore', () => {
  it('is an empty, valid document at the current format', () => {
    const score = createScore({ id: 's', name: 'New' })
    expect(score.format).toBe(SCORE_FORMAT_VERSION)
    expect(validateScore(score)).toEqual([])
    expect(score.master).toEqual({ level: 1, inserts: [] })
    expect(score.transport.loop).toEqual({ enabled: false, lengthSec: null })
  })

  it('defaultStrip is unity with nothing attached', () => {
    expect(defaultStrip()).toEqual({
      level: 1,
      pan: 0,
      inputGain: 1,
      mute: false,
      solo: false,
      soloSafe: false,
      inserts: [],
      sends: [],
    })
  })
})

describe('serializeScore / parseScore', () => {
  it('round-trips the demo score exactly', () => {
    const score = demoScore()
    const json = serializeScore(score)
    const parsed = parseScore(json)
    expect(parsed).toEqual(normaliseScore(score))
    expect(serializeScore(parsed)).toBe(json)
  })

  it('is stable: field order and list copies do not change the output', () => {
    const score = demoScore()
    const shuffled = JSON.parse(
      JSON.stringify({
        ...score,
        tracks: score.tracks.map((track) => Object.fromEntries(Object.entries(track).reverse())),
        master: { inserts: score.master.inserts, level: score.master.level },
      }),
    ) as typeof score
    expect(serializeScore(shuffled)).toBe(serializeScore(score))
  })

  it('accepts an already parsed object', () => {
    const score = demoScore()
    expect(parseScore(JSON.parse(serializeScore(score)))).toEqual(normaliseScore(score))
  })

  it('sorts clips by start and drops a linear curve marker', () => {
    const score = demoScore()
    const track = score.tracks[0]
    if (track.kind !== 'audio') throw new Error('fixture')
    track.clips.reverse()
    score.lanes[0].breakpoints[0].curve = 'linear'
    const parsed = parseScore(serializeScore(score))
    const parsedTrack = parsed.tracks[0]
    if (parsedTrack.kind !== 'audio') throw new Error('fixture')
    expect(parsedTrack.clips.map((clip) => clip.id)).toEqual(['a1', 'b1'])
    expect(parsed.lanes[0].breakpoints[0]).toEqual({ timeSec: 0, value: 0.2 })
  })
})

describe('validateScore', () => {
  it('reports every dangling reference with a path', () => {
    const score = demoScore()
    const kick = score.tracks[0]
    if (kick.kind !== 'audio') throw new Error('fixture')
    kick.clips[0].sourceId = 'missing'
    kick.strip.sends[0].target = 'nowhere'
    kick.destination = { kind: 'group', id: 'ghost' }
    score.routes[0].source = 'nolfo'
    score.lanes[0].target = { kind: 'strip', owner: 'nobody', param: 'level' }
    const issues = validateScore(score)
    expect(issues.map((issue) => issue.path).sort()).toEqual(
      [
        'tracks[0].clips[0].sourceId',
        'tracks[0].strip.sends[0].target',
        'tracks[0].destination.id',
        'routes[0].source',
        'lanes[0].target.owner',
      ].sort(),
    )
  })

  it('rejects duplicate ids across tracks, groups, returns and devices', () => {
    const score = demoScore()
    score.groups[0].id = 'kick'
    score.master.inserts[0].id = 'kick-filter'
    const paths = validateScore(score).map((issue) => issue.path)
    expect(paths).toContain('groups[0].id')
    expect(paths.some((path) => path.endsWith('inserts[0].id'))).toBe(true)
  })

  it('rejects the reserved master id, self-sends, group cycles and two lanes on one param', () => {
    const score = demoScore()
    score.returns[0].strip.sends = [{ target: 'hall', level: 0.5 }]
    score.groups.push({
      id: 'g2',
      name: '',
      destination: { kind: 'group', id: 'drums' },
      strip: defaultStrip(),
    })
    score.groups[0].destination = { kind: 'group', id: 'g2' }
    score.lanes.push({ ...score.lanes[0], id: 'dup' })
    score.tracks[2].id = 'master'
    const messages = validateScore(score).map((issue) => issue.message)
    expect(messages).toContain('a return cannot send to itself')
    expect(messages.some((message) => message.includes('cycle'))).toBe(true)
    expect(messages.some((message) => message.includes('second lane'))).toBe(true)
    expect(messages).toContain('"master" is reserved')
  })

  it('checks ranges and types', () => {
    const score = demoScore()
    score.tracks[0].strip.pan = 2
    score.master.level = -1
    score.routes[0].depth = 3
    score.transport.loop.lengthSec = 0
    ;(score.tracks[1] as { kind: string }).kind = 'midi'
    const paths = validateScore(score).map((issue) => issue.path)
    expect(paths).toEqual(
      expect.arrayContaining([
        'tracks[0].strip.pan',
        'master.level',
        'routes[0].depth',
        'transport.loop.lengthSec',
        'tracks[1].kind',
      ]),
    )
  })

  it('with a registry, checks device ids, param names and presets', () => {
    const score = demoScore()
    expect(validateScore(score, { devices })).toEqual([])
    score.master.inserts[0].preset = 'Nope'
    score.tracks[0].strip.inserts[0].params.cutoff = 1
    score.returns[0].device.deviceId = 'unicorn'
    const issues = validateScore(score, { devices })
    expect(issues.map((issue) => issue.path)).toEqual([
      'master.inserts[0].preset',
      'tracks[0].strip.inserts[0].params.cutoff',
      'returns[0].device.deviceId',
    ])
  })

  it('rejects the master having a pan lane', () => {
    const score = demoScore()
    score.lanes.push({
      id: 'm',
      target: { kind: 'strip', owner: 'master', param: 'pan' },
      breakpoints: [],
    })
    expect(validateScore(score).map((issue) => issue.message)).toContain(
      'the master only has a level',
    )
  })

  it('parseScore throws a ScoreValidationError listing the issues', () => {
    expect(() => parseScore('{"format":1}')).toThrow(ScoreValidationError)
    try {
      parseScore({ ...createScore(), tracks: [{ id: 'x' }] })
    } catch (error) {
      expect(error).toBeInstanceOf(ScoreValidationError)
      expect((error as ScoreValidationError).issues.length).toBeGreaterThan(0)
      expect((error as Error).message).toContain('tracks[0]')
    }
  })
})

describe('migrateScore', () => {
  it('passes the current format through', () => {
    const score = demoScore()
    expect(migrateScore(score)).toBe(score)
  })

  it('refuses newer and unknown formats', () => {
    expect(() => migrateScore({ format: SCORE_FORMAT_VERSION + 1 })).toThrow(/newer/)
    expect(() => migrateScore({ format: 'x' })).toThrow(/unknown format/)
    expect(() => parseScore({ format: 0 })).toThrow(ScoreValidationError)
  })
})

describe('lookups', () => {
  it('finds every device with its owner and slot', () => {
    const score = demoScore()
    expect(
      allDevices(score).map((location) => [location.owner, location.slot, location.device.id]),
    ).toEqual([
      ['master', 'insert', 'glue'],
      ['kick', 'insert', 'kick-filter'],
      ['hall', 'device', 'hall-verb'],
    ])
    expect(findDevice(score, 'hall-verb')?.owner).toBe('hall')
    expect(findDevice(score, 'nope')).toBeUndefined()
  })

  it('targetKey is stable per parameter', () => {
    expect(targetKey({ kind: 'strip', owner: 'kick', param: 'pan' })).toBe('strip:kick:pan')
    expect(targetKey({ kind: 'device', device: 'd', param: 'mix' })).toBe('device:d:mix')
    expect(masterDestination()).toEqual({ kind: 'master' })
  })
})
