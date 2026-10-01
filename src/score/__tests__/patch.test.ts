import { describe, expect, it } from 'vitest'

import { ScoreDocument } from '../ScoreDocument'
import { type Operation } from '../operations'
import { patchEffectOps, scoreDeviceFromPatch } from '../patch'
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
