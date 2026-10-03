import { describe, expect, it } from 'vitest'

import { devices } from '../../core/devices'
import { NODE_DEVICES } from '../../core/devices/native'
import { DeviceRegistry } from '../../core/devices/registry'
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
  withCurrentDeviceIds,
  type Score,
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
  it('keeps a muted or reversed clip and host annotations, and writes none of them when empty', () => {
    const score = demoScore()
    const track = score.tracks[0]
    if (track.kind !== 'audio') throw new Error('fixture')
    track.clips[0] = {
      ...track.clips[0],
      muted: true,
      reversed: true,
      meta: { paint: { row: 2, auto: [[0, 1]] } },
    }
    track.clips[1] = { ...track.clips[1], muted: false, reversed: false, meta: {} }
    score.sources[0] = { ...score.sources[0], meta: { name: 'Kick', colour: '#e63946' } }
    score.sources[1] = { ...score.sources[1], meta: {} }
    score.meta = { key: { scale: 'minor', root: 2 }, chords: [0, 2, 5, 3] }
    const parsed = parseScore(serializeScore(score))
    expect(parsed.meta).toEqual({ chords: [0, 2, 5, 3], key: { root: 2, scale: 'minor' } })
    expect(Object.keys(parsed.meta ?? {})).toEqual(['chords', 'key'])
    expect('meta' in parseScore(serializeScore({ ...score, meta: {} }))).toBe(false)
    const parsedTrack = parsed.tracks[0]
    if (parsedTrack.kind !== 'audio') throw new Error('fixture')
    expect(parsedTrack.clips[0].muted).toBe(true)
    expect(parsedTrack.clips[0].reversed).toBe(true)
    expect('reversed' in parsedTrack.clips[1]).toBe(false)
    expect(parsedTrack.clips[0].meta).toEqual({ paint: { auto: [[0, 1]], row: 2 } })
    expect('muted' in parsedTrack.clips[1]).toBe(false)
    expect('meta' in parsedTrack.clips[1]).toBe(false)
    expect(parsed.sources[0].meta).toEqual({ colour: '#e63946', name: 'Kick' })
    expect('meta' in parsed.sources[1]).toBe(false)
    // Key order inside an annotation never changes the saved text.
    const reordered = structuredClone(score)
    reordered.sources[0].meta = { colour: '#e63946', name: 'Kick' }
    expect(serializeScore(reordered)).toBe(serializeScore(score))
  })
})

describe('a track with a loop length of its own', () => {
  function withLoop(loopLengthSec: unknown, stretch?: boolean): ReturnType<typeof demoScore> {
    const score = demoScore()
    const pad = score.tracks[1]
    if (pad.kind !== 'audio') throw new Error('fixture')
    Object.assign(pad, { loopLengthSec })
    if (stretch) pad.stretch = true
    return score
  }

  it('is valid, and survives a round trip through text', () => {
    const score = withLoop(23.5)
    expect(validateScore(score)).toEqual([])
    const parsed = parseScore(serializeScore(score))
    expect(parsed.tracks[1]).toMatchObject({ id: 'pad', loopLengthSec: 23.5 })
    expect(parsed.tracks[0]).not.toHaveProperty('loopLengthSec')
  })

  it('must be a number above 0, on a track that plays buffers', () => {
    for (const bad of [0, -1, '8', null]) {
      expect(validateScore(withLoop(bad)).map((issue) => issue.path)).toEqual([
        'tracks[1].loopLengthSec',
      ])
    }
    expect(validateScore(withLoop(8, true))).toEqual([
      { path: 'tracks[1].loopLengthSec', message: 'a stretch track has no loop of its own' },
    ])
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

  it('checks a clip chance is 0 to 1 and the seed a whole number a Uint32 holds', () => {
    const paths = (edit: (raw: ReturnType<typeof demoScore>) => void): string[] => {
      const raw = demoScore()
      edit(raw)
      return validateScore(raw).map((issue) => issue.path)
    }
    const firstClip = (raw: ReturnType<typeof demoScore>) => {
      const track = raw.tracks.find((candidate) => candidate.kind === 'audio')
      if (track?.kind !== 'audio') throw new Error('demoScore has an audio track')
      return track.clips[0]
    }
    expect(paths((raw) => (firstClip(raw).chance = 0.5))).toEqual([])
    expect(paths((raw) => (firstClip(raw).chance = 1.2))[0]).toMatch(/clips\[0\]\.chance$/)
    expect(paths((raw) => (raw.transport.seed = 4294967295))).toEqual([])
    expect(paths((raw) => (raw.transport.seed = 1.5))).toEqual(['transport.seed'])
    expect(paths((raw) => (raw.transport.seed = -1))).toEqual(['transport.seed'])
  })

  it('keeps what a device holds besides its parameters, and writes nothing for a device without', () => {
    const score = demoScore()
    score.tracks[0].strip.inserts[0].state = 'c3RhdGU='
    score.returns[0].device.state = ''
    expect(validateScore(score)).toEqual([])
    const saved = serializeScore(score)
    const back = parseScore(saved)
    expect(back.tracks[0].strip.inserts[0].state).toBe('c3RhdGU=')
    expect(back.returns[0].device.state).toBe('')
    expect('state' in back.master.inserts[0]).toBe(false)
    expect(serializeScore(back)).toBe(saved)
    expect(serializeScore(demoScore())).not.toContain('"state"')

    ;(score.master.inserts[0] as { state: unknown }).state = 7
    expect(validateScore(score).map((issue) => issue.path)).toEqual(['master.inserts[0].state'])
  })

  it("keeps a clip's placement through a round trip, a pan of 0 included", () => {
    const score = demoScore()
    const track = score.tracks[0]
    if (track.kind !== 'audio') throw new Error('fixture')
    track.clips[0] = { ...track.clips[0], pan: 0, lowpassHz: 2400, spaceDb: -9 }
    const parsed = parseScore(serializeScore(score))
    const parsedTrack = parsed.tracks[0]
    if (parsedTrack.kind !== 'audio') throw new Error('fixture')
    expect(parsedTrack.clips[0]).toMatchObject({ pan: 0, lowpassHz: 2400, spaceDb: -9 })
    for (const key of ['pan', 'lowpassHz', 'spaceDb']) {
      expect(key in parsedTrack.clips[1]).toBe(false)
    }
  })

  it("a clip's placement stays in range: pan between the sides, a cutoff of 20 Hz or more", () => {
    const score = demoScore()
    const track = score.tracks[0]
    if (track.kind !== 'audio') throw new Error('fixture')
    track.clips[0] = { ...track.clips[0], pan: 1.5, lowpassHz: 5 }
    ;(track.clips[1] as { spaceDb?: unknown }).spaceDb = 'far'
    const paths = validateScore(score).map((issue) => issue.path)
    expect(paths).toEqual(
      expect.arrayContaining([
        'tracks[0].clips[0].pan',
        'tracks[0].clips[0].lowpassHz',
        'tracks[0].clips[1].spaceDb',
      ]),
    )
  })

  it("a clip's muted and reversed flags are booleans and annotations are plain JSON", () => {
    const score = demoScore()
    const track = score.tracks[0]
    if (track.kind !== 'audio') throw new Error('fixture')
    ;(track.clips[0] as { muted?: unknown }).muted = 'yes'
    ;(track.clips[0] as { reversed?: unknown }).reversed = 1
    ;(track.clips[1] as { meta?: unknown }).meta = { at: new Date(0) }
    ;(score.sources[0] as { meta?: unknown }).meta = [1, 2]
    ;(score as { meta?: unknown }).meta = { bad: Number.NaN }
    const paths = validateScore(score).map((issue) => issue.path)
    expect(paths).toEqual(
      expect.arrayContaining([
        'tracks[0].clips[0].muted',
        'tracks[0].clips[0].reversed',
        'tracks[0].clips[1].meta',
        'sources[0].meta',
        'meta',
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

describe('withCurrentDeviceIds', () => {
  // Three stock devices under new ids, each still answering to the one it had.
  const RENAMES: Record<string, string> = {
    filter: 'tone',
    compressor: 'squeeze',
    'convolver-reverb': 'room',
  }
  const renamed = new DeviceRegistry(
    NODE_DEVICES.map((descriptor) =>
      descriptor.id in RENAMES
        ? { ...descriptor, id: RENAMES[descriptor.id], formerIds: [descriptor.id] }
        : descriptor,
    ),
  )
  /** The demo score with a device in every place one can sit. */
  function everywhere(): Score {
    const score = demoScore()
    score.groups[0].strip.inserts.push({
      id: 'bus-filter',
      deviceId: 'filter',
      params: {},
      bypass: false,
    })
    score.returns[0].strip.inserts.push({
      id: 'hall-filter',
      deviceId: 'filter',
      preset: 'High-pass rumble',
      params: {},
      bypass: true,
    })
    score.tracks.push({
      kind: 'instrument',
      id: 'keys',
      name: 'keys',
      destination: masterDestination(),
      strip: {
        ...defaultStrip(),
        inserts: [{ id: 'keys-filter', deviceId: 'filter', params: {}, bypass: false }],
      },
      device: { id: 'keys-device', deviceId: 'filter', params: { q: 2 }, bypass: false },
    })
    return score
  }

  it('names every device by its id of today, wherever it sits, and leaves the rest alone', () => {
    const score = everywhere()
    const before = allDevices(score)
    expect(
      before.map((location) => `${location.owner} ${location.slot} ${location.device.deviceId}`),
    ).toEqual([
      'master insert compressor',
      'kick insert filter',
      'keys device filter',
      'keys insert filter',
      'drums insert filter',
      'hall device convolver-reverb',
      'hall insert filter',
    ])
    // The document as it was saved still passes for the registry of today.
    expect(validateScore(score, { devices: renamed })).toEqual([])

    const moved = withCurrentDeviceIds(score, renamed)
    expect(allDevices(moved)).toEqual(
      before.map((location) => ({
        ...location,
        device: { ...location.device, deviceId: RENAMES[location.device.deviceId] },
      })),
    )
    expect(validateScore(moved, { devices: renamed })).toEqual([])
    // Nothing else moved, and the score handed in is as it was.
    expect({
      ...moved,
      master: score.master,
      tracks: score.tracks,
      groups: score.groups,
      returns: score.returns,
    }).toEqual(score)
    expect(allDevices(score)).toEqual(before)
  })

  it('is the same object when no device was renamed', () => {
    const score = everywhere()
    expect(withCurrentDeviceIds(score, devices)).toBe(score)
    const moved = withCurrentDeviceIds(score, renamed)
    expect(withCurrentDeviceIds(moved, renamed)).toBe(moved)
  })

  it('is what parseScore does when it is given the registry, and only then', () => {
    const json = serializeScore(everywhere())
    expect(parseScore(json)).toEqual(normaliseScore(everywhere()))
    expect(parseScore(json, { devices: renamed })).toEqual(
      withCurrentDeviceIds(normaliseScore(everywhere()), renamed),
    )
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
