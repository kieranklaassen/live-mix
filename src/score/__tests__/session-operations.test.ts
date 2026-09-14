import { describe, expect, it } from 'vitest'

import { defaultSlot, type ScoreSlot, type SlotClip } from '../../core/session/Slot'
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
  findSlot,
  masterDestination,
  normaliseScore,
  parseScore,
  serializeScore,
  slotAt,
  validateScore,
  type Score,
} from '../schema'
import { demoScore, pick, seededRandom } from './fixtures'

function slotClip(sourceId: string, overrides: Partial<SlotClip> = {}): SlotClip {
  return {
    sourceId,
    offsetSec: 0,
    durationSec: 4,
    fadeInSec: 0,
    fadeOutSec: 0,
    fadeCurve: 'equalPower',
    gainDb: 0,
    ...overrides,
  }
}

function gridScore(): Score {
  const score = demoScore()
  score.scenes = [
    { id: 'verse', name: 'Verse' },
    { id: 'chorus', name: 'Chorus' },
  ]
  score.slots = [
    defaultSlot({ id: 'kv', track: 'kick', scene: 'verse', clip: slotClip('a', { loop: true }) }),
    defaultSlot({ id: 'kc', track: 'kick', scene: 'chorus', clip: slotClip('b') }),
    defaultSlot({ id: 'pv', track: 'pad', scene: 'verse', clip: null }),
  ]
  return normaliseScore(score)
}

const canon = normaliseScore

describe('session operations: apply', () => {
  const base = gridScore()

  it('scenes: add at an index, rename, move, remove with its slots', () => {
    let score = apply(base, {
      type: 'scene.add',
      scene: { id: 'bridge', name: 'Bridge' },
      index: 1,
    })
    expect(score.scenes.map((scene) => scene.id)).toEqual(['verse', 'bridge', 'chorus'])
    score = apply(score, { type: 'scene.rename', id: 'bridge', name: 'B' })
    expect(score.scenes[1].name).toBe('B')
    score = apply(score, { type: 'scene.move', id: 'bridge', index: 0 })
    expect(score.scenes.map((scene) => scene.id)).toEqual(['bridge', 'verse', 'chorus'])
    score = apply(score, { type: 'scene.remove', id: 'verse' })
    expect(score.scenes.map((scene) => scene.id)).toEqual(['bridge', 'chorus'])
    expect(score.slots.map((slot) => slot.id)).toEqual(['kc'])
    expect(validateScore(score)).toEqual([])
    expect(() => apply(base, { type: 'scene.add', scene: { id: 'verse', name: '' } })).toThrow(
      /already exists/,
    )
    expect(() => apply(base, { type: 'scene.remove', id: 'x' })).toThrow(ScoreOperationError)
    expect(() => apply(base, { type: 'scene.move', id: 'verse', index: 5 })).toThrow(/outside/)
  })

  it('slots: add in a free audio cell, update settings, clear optionals, move cells, remove', () => {
    const slot: ScoreSlot = defaultSlot({
      id: 'pc',
      track: 'pad',
      scene: 'chorus',
      clip: slotClip('a'),
      quantize: 4,
      follow: { a: 'any', b: 'none', chance: 0.5 },
    })
    let score = apply(base, { type: 'slot.add', slot, index: 0 })
    expect(score.slots[0]).toEqual(slot)
    score = apply(score, {
      type: 'slot.update',
      id: 'pc',
      patch: { launchMode: 'gate', legato: true, quantize: null, follow: null, clip: null },
    })
    expect(findSlot(score, 'pc')).toEqual({
      id: 'pc',
      track: 'pad',
      scene: 'chorus',
      clip: null,
      launchMode: 'gate',
      legato: true,
    })
    // pv occupies pad × verse: the move is refused until pv has gone, then lands there.
    expect(() =>
      apply(score, { type: 'slot.update', id: 'pc', patch: { scene: 'verse' } }),
    ).toThrow(/already sits/)
    expect(() =>
      apply(score, { type: 'slot.update', id: 'pc', patch: { track: 'kick', scene: 'verse' } }),
    ).toThrow(/slot "kv" already sits/)
    score = apply(score, { type: 'slot.remove', id: 'pv' })
    score = apply(score, { type: 'slot.update', id: 'pc', patch: { scene: 'verse' } })
    expect(slotAt(score, 'pad', 'verse')?.id).toBe('pc')
    expect(slotAt(score, 'pad', 'chorus')).toBeUndefined()
    expect(validateScore(score)).toEqual([])
    // Patching a slot onto itself is fine (its own cell does not count as occupied).
    expect(apply(score, { type: 'slot.update', id: 'pc', patch: { scene: 'verse' } })).toEqual(
      score,
    )
  })

  it('slot.add refuses bad cells, ids and settings', () => {
    const add = (slot: Partial<ScoreSlot>): Operation => ({
      type: 'slot.add',
      slot: defaultSlot({ id: 'x', track: 'pad', scene: 'chorus', clip: slotClip('a'), ...slot }),
    })
    expect(() => apply(base, add({ id: 'kv' }))).toThrow(/already exists/)
    expect(() => apply(base, add({ track: 'voice' }))).toThrow(/live track/)
    expect(() => apply(base, add({ track: 'nobody' }))).toThrow(/no track/)
    expect(() => apply(base, add({ scene: 'bridge' }))).toThrow(/no scene/)
    expect(() => apply(base, add({ scene: 'verse' }))).toThrow(/already sits at pad × verse/)
    expect(() => apply(base, add({ clip: slotClip('zzz') }))).toThrow(/no source/)
    expect(() => apply(base, add({ quantize: -1 }))).toThrow(/quantize/)
    expect(() => apply(base, add({ launchMode: 'hold' as never }))).toThrow(/launch mode/)
    expect(() => apply(base, add({ follow: { a: 'next', b: 'stop', chance: 3 } }))).toThrow(
      /follow/,
    )
    expect(() => apply(base, { type: 'slot.remove', id: 'nope' })).toThrow(/no slot/)
    expect(() =>
      apply(base, { type: 'slot.update', id: 'kv', patch: { id: 'kv2' } as never }),
    ).toThrow(/cannot be changed/)
  })

  it('transport.quantize sets the global grid and refuses nonsense', () => {
    const score = apply(base, { type: 'transport.quantize', quantize: { seconds: 2 } })
    expect(score.transport.quantize).toEqual({ seconds: 2 })
    expect(() => apply(base, { type: 'transport.quantize', quantize: 'bars' as never })).toThrow(
      /quantize/,
    )
  })

  it('track.remove takes the track’s slots with it; source.remove is refused while a slot uses it', () => {
    const score = apply(base, { type: 'track.remove', id: 'kick' })
    expect(score.slots.map((slot) => slot.id)).toEqual(['pv'])
    expect(validateScore(score)).toEqual([])
    const noClips = apply(apply(base, { type: 'clip.remove', track: 'kick', id: 'b1' }), {
      type: 'clip.remove',
      track: 'kick',
      id: 'a1',
    })
    // `a` is still used by the pad clip and the kv slot; `b` only by the kc slot now.
    expect(() => apply(noClips, { type: 'source.remove', id: 'b' })).toThrow(/used by slot "kc"/)
    const freed = apply(noClips, { type: 'slot.remove', id: 'kc' })
    expect(apply(freed, { type: 'source.remove', id: 'b' }).sources.map((s) => s.id)).toEqual(['a'])
  })

  it('every applied result stays valid and serialises', () => {
    const ops: Operation[] = [
      { type: 'transport.quantize', quantize: 'beat' },
      { type: 'scene.add', scene: { id: 'outro', name: 'Outro' } },
      {
        type: 'slot.add',
        slot: defaultSlot({ id: 'po', track: 'pad', scene: 'outro', clip: slotClip('b') }),
      },
      { type: 'slot.update', id: 'po', patch: { follow: { a: 'first', b: 'last', chance: 0.25 } } },
      { type: 'scene.move', id: 'outro', index: 0 },
      { type: 'scene.rename', id: 'outro', name: 'Intro' },
      { type: 'slot.update', id: 'kv', patch: { clip: slotClip('b', { semitones: 2 }) } },
      { type: 'slot.remove', id: 'pv' },
      { type: 'scene.remove', id: 'chorus' },
    ]
    let score = base
    for (const op of ops) {
      score = apply(score, op)
      expect(validateScore(score), op.type).toEqual([])
    }
    expect(parseScore(serializeScore(score))).toEqual(canon(score))
  })

  it('is in the vocabulary, discrete, and described', () => {
    for (const type of [
      'transport.quantize',
      'scene.add',
      'scene.remove',
      'scene.move',
      'scene.rename',
      'slot.add',
      'slot.remove',
      'slot.update',
    ] as const) {
      expect(OPERATION_TYPES).toContain(type)
      expect(isOperation({ type })).toBe(true)
    }
    expect(coalesceKey({ type: 'scene.move', id: 'verse', index: 1 })).toBeNull()
    expect(coalesceKey({ type: 'slot.update', id: 'kv', patch: { legato: true } })).toBeNull()
    expect(describeOperation({ type: 'transport.quantize', quantize: 2 })).toBe(
      'launch quantisation 2 bars',
    )
    expect(describeOperation({ type: 'scene.add', scene: { id: 's', name: '' } })).toBe(
      'add scene s',
    )
    expect(describeOperation({ type: 'scene.rename', id: 's', name: 'X' })).toBe(
      'rename scene s to "X"',
    )
    expect(describeOperation({ type: 'slot.add', slot: base.slots[0] })).toBe(
      'add slot kv at kick × verse',
    )
    expect(
      describeOperation({
        type: 'slot.update',
        id: 'kv',
        patch: { follow: { a: 'next', b: 'stop', chance: 1 } },
      }),
    ).toBe('slot kv follow: next at clip end')
    expect(describeOperation({ type: 'slot.update', id: 'kv', patch: { legato: true } })).toBe(
      'edit slot kv',
    )
    expect(describeOperation({ type: 'scene.remove', id: 's' })).toBe('remove scene s')
    expect(describeOperation({ type: 'scene.move', id: 's', index: 0 })).toBe('move scene s')
    expect(describeOperation({ type: 'slot.remove', id: 'kv' })).toBe('remove slot kv')
  })
})

describe('session operations: invert', () => {
  const base = gridScore()

  it('scene.remove inverts to a batch restoring the scene and its slots at their indices', () => {
    const inverse = invert(base, { type: 'scene.remove', id: 'verse' })
    expect(inverse).toEqual({
      type: 'batch',
      label: 'undo scene.remove',
      ops: [
        { type: 'scene.add', scene: { id: 'verse', name: 'Verse' }, index: 0 },
        { type: 'slot.add', slot: base.slots[0], index: 0 },
        { type: 'slot.add', slot: base.slots[2], index: 2 },
      ],
    })
    expect(canon(apply(apply(base, { type: 'scene.remove', id: 'verse' }), inverse))).toEqual(base)
  })

  it('track.remove restores the track’s slots too; slot.update inverts field by field', () => {
    const removed = applyWithInverse(base, { type: 'track.remove', id: 'kick' })
    expect(removed.inverse.type).toBe('batch')
    expect(canon(apply(removed.score, removed.inverse))).toEqual(base)

    const patched = applyWithInverse(base, {
      type: 'slot.update',
      id: 'kv',
      patch: { quantize: 8, follow: { a: 'stop', b: 'stop', chance: 1 }, legato: true },
    })
    expect(patched.inverse).toEqual({
      type: 'slot.update',
      id: 'kv',
      patch: { quantize: null, follow: null, legato: false },
    })
    expect(canon(apply(patched.score, patched.inverse))).toEqual(base)
  })

  it('simple inverses', () => {
    expect(invert(base, { type: 'transport.quantize', quantize: 'none' })).toEqual({
      type: 'transport.quantize',
      quantize: 'bar',
    })
    expect(invert(base, { type: 'scene.add', scene: { id: 'x', name: '' } })).toEqual({
      type: 'scene.remove',
      id: 'x',
    })
    expect(invert(base, { type: 'scene.move', id: 'chorus', index: 0 })).toEqual({
      type: 'scene.move',
      id: 'chorus',
      index: 1,
    })
    expect(invert(base, { type: 'scene.rename', id: 'chorus', name: 'C' })).toEqual({
      type: 'scene.rename',
      id: 'chorus',
      name: 'Chorus',
    })
    expect(invert(base, { type: 'slot.remove', id: 'kc' })).toEqual({
      type: 'slot.add',
      slot: base.slots[1],
      index: 1,
    })
    expect(invert(base, { type: 'slot.add', slot: base.slots[1] })).toEqual({
      type: 'slot.remove',
      id: 'kc',
    })
    expect(() => invert(base, { type: 'scene.remove', id: 'x' })).toThrow(ScoreOperationError)
    expect(() => invert(base, { type: 'slot.remove', id: 'x' })).toThrow(ScoreOperationError)
  })
})

// --- Property test: random grid edits round-trip through their inverses -------------------

const CLIP_SOURCES = ['a', 'b']

function randomGridOp(random: () => number, score: Score, counter: { n: number }): Operation {
  const fresh = (): string => `g${counter.n++}`
  const audioTracks = score.tracks.filter((track) => track.kind === 'audio')
  const kinds = [
    'scene.add',
    'scene.remove',
    'scene.move',
    'scene.rename',
    'slot.add',
    'slot.add',
    'slot.remove',
    'slot.update',
    'slot.update',
    'transport.quantize',
    'track.add',
    'track.remove',
    'source.remove',
  ] as const
  const kind = pick(random, kinds)
  const scene = score.scenes.length ? pick(random, score.scenes) : undefined
  const slot = score.slots.length ? pick(random, score.slots) : undefined
  const track = audioTracks.length ? pick(random, audioTracks) : undefined
  switch (kind) {
    case 'scene.add':
      return {
        type: 'scene.add',
        scene: { id: fresh(), name: fresh() },
        index: Math.floor(random() * (score.scenes.length + 1)),
      }
    case 'scene.remove':
      return { type: 'scene.remove', id: scene?.id ?? 'none' }
    case 'scene.move':
      return {
        type: 'scene.move',
        id: scene?.id ?? 'none',
        index: Math.floor(random() * Math.max(1, score.scenes.length)),
      }
    case 'scene.rename':
      return { type: 'scene.rename', id: scene?.id ?? 'none', name: fresh() }
    case 'slot.add':
      return {
        type: 'slot.add',
        slot: defaultSlot({
          id: fresh(),
          track: track?.id ?? 'none',
          scene: scene?.id ?? 'none',
          clip:
            random() < 0.2 ? null : slotClip(pick(random, CLIP_SOURCES), { loop: random() < 0.5 }),
          quantize:
            random() < 0.5 ? pick(random, ['none', 'bar', 'beat', 2, { seconds: 1 }]) : undefined,
          launchMode: pick(random, ['trigger', 'gate', 'toggle']),
          legato: random() < 0.5,
          follow:
            random() < 0.5
              ? {
                  a: pick(random, ['next', 'any', 'stop']),
                  b: pick(random, ['none', 'previous']),
                  chance: Math.round(random() * 100) / 100,
                  time:
                    random() < 0.5
                      ? { unit: 'bars', value: 1 + Math.floor(random() * 4) }
                      : undefined,
                }
              : undefined,
        }),
        index: Math.floor(random() * (score.slots.length + 1)),
      }
    case 'slot.remove':
      return { type: 'slot.remove', id: slot?.id ?? 'none' }
    case 'slot.update': {
      const patch: Extract<Operation, { type: 'slot.update' }>['patch'] = {}
      if (random() < 0.3) patch.track = track?.id ?? 'none'
      if (random() < 0.3) patch.scene = scene?.id ?? 'none'
      if (random() < 0.3) patch.clip = random() < 0.3 ? null : slotClip(pick(random, CLIP_SOURCES))
      if (random() < 0.3) patch.quantize = random() < 0.3 ? null : pick(random, ['bar', 4])
      if (random() < 0.3) patch.launchMode = pick(random, ['trigger', 'gate', 'toggle'])
      if (random() < 0.3) patch.legato = random() < 0.5
      if (random() < 0.3)
        patch.follow = random() < 0.3 ? null : { a: 'again', b: 'other', chance: 0.5 }
      return { type: 'slot.update', id: slot?.id ?? 'none', patch }
    }
    case 'transport.quantize':
      return { type: 'transport.quantize', quantize: pick(random, ['none', 'bar', 'beat', 1, 4]) }
    case 'track.add': {
      const id = fresh()
      return {
        type: 'track.add',
        track: {
          kind: 'audio',
          id,
          name: id,
          destination: masterDestination(),
          strip: defaultStrip(),
          clips: [],
        },
      }
    }
    case 'track.remove':
      return { type: 'track.remove', id: track?.id ?? 'none' }
    case 'source.remove':
      return { type: 'source.remove', id: pick(random, CLIP_SOURCES) }
    default: {
      const exhaustive: never = kind
      return exhaustive
    }
  }
}

describe('apply(inverse(op), apply(op)) restores the grid (property-style)', () => {
  it.each([1, 2, 3, 4, 5, 6])('seed %i: 200 random grid operations round-trip', (seed) => {
    const random = seededRandom(seed)
    const counter = { n: 0 }
    let score = gridScore()
    let applied = 0
    for (let step = 0; step < 200; step += 1) {
      const op = randomGridOp(random, score, counter)
      let result
      try {
        result = applyWithInverse(score, op)
      } catch (error) {
        if (!(error instanceof ScoreOperationError)) throw error
        continue
      }
      applied += 1
      const after = result.score
      expect(validateScore(after), `${op.type} left an invalid score`).toEqual([])
      expect(canon(apply(after, result.inverse)), `undo of ${op.type}`).toEqual(score)
      expect(canon(apply(apply(after, result.inverse), op)), `redo of ${op.type}`).toEqual(
        canon(after),
      )
      score = canon(after)
    }
    expect(applied).toBeGreaterThan(60)
    expect(parseScore(serializeScore(score))).toEqual(score)
  })
})
