import { describe, expect, it } from 'vitest'

import { ScoreDocument } from '../ScoreDocument'
import { type Operation } from '../operations'
import { patchEffectOps, patchInstrumentOps, scoreDeviceFromPatch } from '../patch'
import { MASTER_OWNER, createScore, defaultStrip, masterDestination, type Score } from '../schema'

const CHAIN = {
  effects: [
    { deviceId: 'tape', preset: 'Quarter inch', params: { mix: 0.4 } },
    { deviceId: 'tape' },
    { deviceId: 'hall', bypass: true },
  ],
} as const

function scoreWithTrack(): Score {
  const score = createScore({ id: 'test' })
  score.tracks = [
    {
      kind: 'audio',
      id: 'pad',
      name: 'Pad',
      destination: masterDestination(),
      strip: defaultStrip({
        inserts: [
          { id: 'pad-trim', deviceId: 'utility', params: {}, bypass: false },
          { id: 'tape-1', deviceId: 'tape', params: { mix: 1 }, bypass: false },
          { id: 'echo-1', deviceId: 'echo', params: {}, bypass: false },
        ],
      }),
      clips: [],
    },
  ]
  score.lanes = [
    {
      id: 'wet',
      target: { kind: 'device', device: 'echo-1', param: 'mix' },
      defaultValue: 0,
      breakpoints: [],
    },
  ]
  return score
}

function batch(ops: Operation[]): Operation {
  return { type: 'batch', ops, label: 'Load chain' }
}

describe('scoreDeviceFromPatch', () => {
  it('declares a patch device under an instance id', () => {
    expect(scoreDeviceFromPatch('tape-3', CHAIN.effects[0])).toEqual({
      id: 'tape-3',
      deviceId: 'tape',
      preset: 'Quarter inch',
      params: { mix: 0.4 },
      bypass: false,
    })
    expect(scoreDeviceFromPatch('hall-1', CHAIN.effects[2])).toEqual({
      id: 'hall-1',
      deviceId: 'hall',
      params: {},
      bypass: true,
    })
  })
})

describe('patchEffectOps', () => {
  it('replaces a track’s effects after the pinned inserts, with ids nothing else has', () => {
    const document = new ScoreDocument(scoreWithTrack())
    document.apply(batch(patchEffectOps(document.score, 'pad', CHAIN, { pinned: 1 })))

    const inserts = document.score.tracks[0].strip.inserts
    expect(inserts.map((device) => device.id)).toEqual(['pad-trim', 'tape-2', 'tape-3', 'hall-1'])
    expect(inserts[1]).toMatchObject({ preset: 'Quarter inch', params: { mix: 0.4 } })
    expect(inserts[3].bypass).toBe(true)
    // The lane that drove the removed echo went with it.
    expect(document.score.lanes).toEqual([])
  })

  it('is one undo step as a batch', () => {
    const document = new ScoreDocument(scoreWithTrack())
    const before = document.score
    document.apply(batch(patchEffectOps(document.score, 'pad', CHAIN, { pinned: 1 })))
    document.undo()
    expect(document.score.tracks[0].strip.inserts).toEqual(before.tracks[0].strip.inserts)
    expect(document.score.lanes).toEqual(before.lanes)
    expect(document.canUndo).toBe(false)
  })

  it('loads onto the master and replaces what a load before it put there', () => {
    const document = new ScoreDocument(scoreWithTrack())
    document.apply(batch(patchEffectOps(document.score, MASTER_OWNER, CHAIN)))
    expect(document.score.master.inserts.map((device) => device.id)).toEqual([
      'tape-2',
      'tape-3',
      'hall-1',
    ])
    document.apply(
      batch(patchEffectOps(document.score, MASTER_OWNER, { effects: [{ deviceId: 'tape' }] })),
    )
    expect(document.score.master.inserts.map((device) => device.id)).toEqual(['tape-4'])
  })

  it('refuses an owner the score does not have', () => {
    expect(() => patchEffectOps(scoreWithTrack(), 'nobody', CHAIN)).toThrow(/no "nobody"/)
  })
})

describe('patchInstrumentOps', () => {
  const PRESET = {
    instrument: { deviceId: 'dunes', preset: 'Slow', params: { tone: 0.3 } },
    effects: [{ deviceId: 'tape' }, { deviceId: 'hall', params: { mix: 0.5 } }],
  } as const

  function scoreWithKeys(): Score {
    const score = scoreWithTrack()
    score.tracks.push({
      kind: 'instrument',
      id: 'keys',
      name: 'Keys',
      destination: masterDestination(),
      strip: defaultStrip({
        level: 0.6,
        inserts: [{ id: 'echo-2', deviceId: 'echo', params: {}, bypass: false }],
        sends: [],
      }),
      device: { id: 'keys-synth', deviceId: 'sine', params: { level: 0.4 }, bypass: false },
    })
    score.lanes.push({
      id: 'keys-level',
      target: { kind: 'device', device: 'keys-synth', param: 'level' },
      defaultValue: 0,
      breakpoints: [],
    })
    return score
  }

  const keys = (score: Score) => {
    const track = score.tracks.find((candidate) => candidate.id === 'keys')
    if (track?.kind !== 'instrument') throw new Error('no keys')
    return track
  }

  it('puts the preset’s instrument and effects on the track and keeps the strip', () => {
    const document = new ScoreDocument(scoreWithKeys())
    const before = document.score
    document.apply(batch(patchInstrumentOps(document.score, 'keys', PRESET)))

    const track = keys(document.score)
    expect(track.device).toEqual({
      id: 'dunes-1',
      deviceId: 'dunes',
      preset: 'Slow',
      params: { tone: 0.3 },
      bypass: false,
    })
    // `tape-1` is the pad's: the ids are fresh across the whole score.
    expect(track.strip.inserts.map((device) => device.id)).toEqual(['tape-2', 'hall-1'])
    expect(track.strip.level).toBe(0.6)
    // What drove the instrument that left went with it.
    expect(document.score.lanes.map((lane) => lane.id)).toEqual(['wet'])

    // One step back: instrument, effects and the lane.
    document.undo()
    expect(keys(document.score)).toEqual(keys(before))
    expect(document.score.lanes).toEqual(before.lanes)
    expect(document.canUndo).toBe(false)
  })

  it('keeps the instance of an instrument the track already plays, with the preset’s settings', () => {
    const document = new ScoreDocument(scoreWithKeys())
    document.apply(
      batch(
        patchInstrumentOps(document.score, 'keys', {
          instrument: { deviceId: 'sine', params: { level: 0.9 } },
          effects: [],
        }),
      ),
    )
    const track = keys(document.score)
    expect(track.device).toEqual({
      id: 'keys-synth',
      deviceId: 'sine',
      params: { level: 0.9 },
      bypass: false,
    })
    expect(track.strip.inserts).toEqual([])
    // Same instance of the same instrument: its automation stays.
    expect(document.score.lanes.map((lane) => lane.id)).toEqual(['wet', 'keys-level'])
  })

  it('keeps what the kept instance holds besides its parameters, and gives another instrument none of it', () => {
    const score = scoreWithKeys()
    const track = score.tracks.find((candidate) => candidate.id === 'keys')
    if (track?.kind !== 'instrument') throw new Error('no keys')
    track.device.state = 'a sample it loaded'
    const document = new ScoreDocument(score)
    document.apply(
      batch(
        patchInstrumentOps(document.score, 'keys', {
          instrument: { deviceId: 'sine', params: { level: 0.9 } },
          effects: [],
        }),
      ),
    )
    // A patch says nothing of it, and the instance that stays still holds it.
    expect(keys(document.score).device).toEqual({
      id: 'keys-synth',
      deviceId: 'sine',
      params: { level: 0.9 },
      bypass: false,
      state: 'a sample it loaded',
    })

    document.apply(batch(patchInstrumentOps(document.score, 'keys', PRESET)))
    expect(keys(document.score).device.state).toBeUndefined()
    // Undo brings the instrument back with what it held.
    document.undo()
    expect(keys(document.score).device.state).toBe('a sample it loaded')
  })

  it('leaves pinned inserts where they are', () => {
    const document = new ScoreDocument(scoreWithKeys())
    document.apply(batch(patchInstrumentOps(document.score, 'keys', PRESET, { pinned: 1 })))
    expect(keys(document.score).strip.inserts.map((device) => device.id)).toEqual([
      'echo-2',
      'tape-2',
      'hall-1',
    ])
  })

  it('refuses a patch without an instrument and a track that is not an instrument track', () => {
    const score = scoreWithKeys()
    expect(() => patchInstrumentOps(score, 'keys', { effects: [] })).toThrow(/no instrument/)
    expect(() => patchInstrumentOps(score, 'pad', PRESET)).toThrow(/no instrument track "pad"/)
    expect(() => patchInstrumentOps(score, 'nobody', PRESET)).toThrow(/no instrument track/)
  })
})
