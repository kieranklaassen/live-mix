import { describe, expect, it } from 'vitest'

import {
  describePerformFollow,
  drawPerformFollow,
  emptyPerformSet,
  freeId,
  isEmptyPerformSet,
  ladderTargets,
  moveScene,
  normalisePerformSet,
  performSetOf,
  resolvePerformFollow,
  sceneTracksIn,
  shapeDial,
  withCue,
  withDial,
  withScene,
  withoutCue,
  withoutDial,
  withoutScene,
  withoutTrack,
  type PerformScene,
  type PerformSet,
} from '../set'

function scene(id: string, overrides: Partial<PerformScene> = {}): PerformScene {
  return { id, name: id, rides: {}, dials: {}, ...overrides }
}

function setOf(...ids: string[]): PerformSet {
  return { ...emptyPerformSet(), scenes: ids.map((id) => scene(id)) }
}

describe('normalisePerformSet', () => {
  it('gives the empty set for anything that is not one', () => {
    for (const value of [undefined, null, 3, 'set', [], { scenes: 'no' }]) {
      expect(normalisePerformSet(value)).toEqual(emptyPerformSet())
    }
    expect(isEmptyPerformSet(normalisePerformSet(undefined))).toBe(true)
  })

  it('reads a set back as it was written', () => {
    const set: PerformSet = {
      version: 1,
      scenes: [
        {
          id: 'dawn',
          name: 'Dawn',
          rides: { a: 1, b: 0 },
          dials: { energy: 0.2 },
          morphBars: 4,
          follow: {
            a: 'next',
            b: { scene: 'night' },
            chance: 0.7,
            after: { unit: 'bars', value: 8 },
          },
        },
        { id: 'night', name: 'Night', rides: { a: 0.5 }, dials: {} },
      ],
      dials: [
        {
          id: 'energy',
          name: 'Energy',
          value: 0.5,
          targets: [
            { kind: 'ride', track: 'b', input: { min: 0.25, max: 0.75 }, curve: 's' },
            { kind: 'host', id: 'tone', output: { min: 300, max: 18000 }, curve: 'exp' },
          ],
        },
      ],
      cues: [{ id: 'bell', name: 'Bell', sample: 's1', gainDb: -3, quantize: 'bar' }],
      quantize: 4,
      cueQuantize: 'none',
      morphBars: 1,
      follow: true,
    }
    expect(normalisePerformSet(JSON.parse(JSON.stringify(set)))).toEqual(set)
  })

  it('keeps what is well formed, brings values into range and drops the rest', () => {
    const set = normalisePerformSet({
      scenes: [
        { id: 'a', rides: { x: 9, y: -1, z: 'loud' }, dials: { d: 2 }, morphBars: 999, follow: {} },
        { id: 'a', name: 'A again' },
        { name: 'No id' },
        'nonsense',
      ],
      dials: [
        {
          id: 'd',
          value: 7,
          targets: [{ kind: 'ride' }, { kind: 'ride', track: 'x', curve: 'wobbly' }],
        },
      ],
      cues: [{ id: 'c' }, { id: 'c2', sample: 's', pan: -4 }],
      quantize: 'whenever',
      morphBars: -3,
      follow: 'yes',
    })
    expect(set.scenes).toEqual([
      { id: 'a', name: 'a', rides: { x: 2, y: 0 }, dials: { d: 1 }, morphBars: 64 },
    ])
    expect(set.dials).toEqual([
      { id: 'd', name: 'd', value: 1, targets: [{ kind: 'ride', track: 'x' }] },
    ])
    expect(set.cues).toEqual([{ id: 'c2', name: 'c2', sample: 's', pan: -1 }])
    expect(set.quantize).toBe('bar')
    expect(set.morphBars).toBe(0)
    expect(set.follow).toBe(false)
  })

  it('reads the set a score carries under meta.perform', () => {
    const set = withScene(emptyPerformSet(), scene('a'))
    expect(performSetOf({ meta: { perform: JSON.parse(JSON.stringify(set)) } })).toEqual(set)
    expect(performSetOf({})).toEqual(emptyPerformSet())
  })
})

describe('shapeDial', () => {
  it('maps the whole travel onto 0 to 1 when nothing else is said', () => {
    expect(shapeDial({ kind: 'ride', track: 'a' }, 0)).toBe(0)
    expect(shapeDial({ kind: 'ride', track: 'a' }, 0.3)).toBeCloseTo(0.3)
    expect(shapeDial({ kind: 'ride', track: 'a' }, 1)).toBe(1)
  })

  it('answers only inside its input span, and holds the ends outside it', () => {
    const target = { kind: 'ride', track: 'a', input: { min: 0.5, max: 0.75 } } as const
    expect(shapeDial(target, 0.2)).toBe(0)
    expect(shapeDial(target, 0.5)).toBe(0)
    expect(shapeDial(target, 0.625)).toBeCloseTo(0.5)
    expect(shapeDial(target, 0.9)).toBe(1)
  })

  it('turns round when the output runs from high to low, and goes through the curve', () => {
    const down = { kind: 'host', id: 'tone', output: { min: 18000, max: 300 } } as const
    expect(shapeDial(down, 0)).toBe(18000)
    expect(shapeDial(down, 1)).toBe(300)
    expect(shapeDial({ kind: 'ride', track: 'a', curve: 'exp' }, 0.5)).toBeCloseTo(0.25)
  })

  it('is a switch when the input span has no width', () => {
    const target = { kind: 'ride', track: 'a', input: { min: 0.5, max: 0.5 } } as const
    expect(shapeDial(target, 0.49)).toBe(0)
    expect(shapeDial(target, 0.5)).toBe(1)
  })
})

describe('ladderTargets', () => {
  it('leaves the first track alone and brings the rest in one after another', () => {
    const targets = ladderTargets(['bed', 'pad', 'rain', 'bell'])
    expect(targets.map((target) => (target.kind === 'ride' ? target.track : ''))).toEqual([
      'pad',
      'rain',
      'bell',
    ])
    const at = (value: number) => targets.map((target) => shapeDial(target, value))
    expect(at(0)).toEqual([0, 0, 0])
    // Each has come in before the next is halfway.
    expect(at(0.5)[0]).toBe(1)
    expect(at(0.5)[1]).toBeGreaterThan(0)
    expect(at(0.5)[1]).toBeLessThan(1)
    expect(at(0.5)[2]).toBe(0)
    expect(at(1)).toEqual([1, 1, 1])
  })

  it('has nothing to say for a piece of one track', () => {
    expect(ladderTargets(['only'])).toEqual([])
    expect(ladderTargets([])).toEqual([])
  })
})

describe('editing a set', () => {
  it('adds a scene at the end and replaces one in place', () => {
    const set = withScene(setOf('a', 'b'), scene('c'))
    expect(set.scenes.map((s) => s.id)).toEqual(['a', 'b', 'c'])
    const renamed = withScene(set, scene('b', { name: 'Bee' }))
    expect(renamed.scenes.map((s) => s.name)).toEqual(['a', 'Bee', 'c'])
    expect(set.scenes[1].name).toBe('b')
  })

  it('removes and moves scenes', () => {
    const set = setOf('a', 'b', 'c')
    expect(withoutScene(set, 'b').scenes.map((s) => s.id)).toEqual(['a', 'c'])
    expect(moveScene(set, 'c', 0).scenes.map((s) => s.id)).toEqual(['c', 'a', 'b'])
    expect(moveScene(set, 'a', 99).scenes.map((s) => s.id)).toEqual(['b', 'c', 'a'])
    expect(moveScene(set, 'gone', 0)).toBe(set)
  })

  it('takes a dial out of the scenes that set it', () => {
    let set = withDial(setOf(), { id: 'energy', name: 'Energy', value: 0.5, targets: [] })
    set = withScene(set, scene('a', { dials: { energy: 0.9, tone: 0.1 } }))
    const without = withoutDial(set, 'energy')
    expect(without.dials).toEqual([])
    expect(without.scenes[0].dials).toEqual({ tone: 0.1 })
  })

  it('adds and removes cues', () => {
    const set = withCue(setOf(), { id: 'bell', name: 'Bell', sample: 's' })
    expect(set.cues).toHaveLength(1)
    expect(withoutCue(set, 'bell').cues).toEqual([])
  })

  it('forgets a track that is gone', () => {
    let set = withScene(setOf(), scene('a', { rides: { x: 0, y: 1 } }))
    set = withDial(set, {
      id: 'energy',
      name: 'Energy',
      value: 0,
      targets: [
        { kind: 'ride', track: 'x' },
        { kind: 'ride', track: 'y' },
        { kind: 'host', id: 'x' },
      ],
    })
    const without = withoutTrack(set, 'x')
    expect(without.scenes[0].rides).toEqual({ y: 1 })
    expect(without.dials[0].targets).toEqual([
      { kind: 'ride', track: 'y' },
      { kind: 'host', id: 'x' },
    ])
  })

  it('finds an id nothing has', () => {
    expect(freeId([], 'scene')).toBe('scene')
    expect(freeId([{ id: 'scene' }, { id: 'scene-2' }], 'scene')).toBe('scene-3')
  })

  it('lists the tracks a scene has in', () => {
    expect(sceneTracksIn(scene('a', { rides: { x: 0, y: 1, z: 0.2 } }))).toEqual(['y', 'z'])
  })
})

describe('follow rules', () => {
  const scenes = setOf('a', 'b', 'c').scenes

  it('draws A with its chance', () => {
    const rule = { a: 'next', b: 'previous', chance: 0.7 } as const
    expect(drawPerformFollow(rule, () => 0.69)).toBe('next')
    expect(drawPerformFollow(rule, () => 0.7)).toBe('previous')
    expect(drawPerformFollow({ ...rule, chance: 1 }, () => 0.999)).toBe('next')
    expect(drawPerformFollow({ ...rule, chance: 0 }, () => 0)).toBe('previous')
  })

  it('resolves neighbours with wrapping, and the ends', () => {
    const never = (): number => {
      throw new Error('no draw needed')
    }
    expect(resolvePerformFollow('next', 'c', scenes, never)).toBe('a')
    expect(resolvePerformFollow('previous', 'a', scenes, never)).toBe('c')
    expect(resolvePerformFollow('first', 'b', scenes, never)).toBe('a')
    expect(resolvePerformFollow('last', 'b', scenes, never)).toBe('c')
    expect(resolvePerformFollow('stay', 'b', scenes, never)).toBeNull()
    expect(resolvePerformFollow({ scene: 'c' }, 'a', scenes, never)).toBe('c')
  })

  it('stays when the rule leads to where the music already is, or nowhere', () => {
    expect(resolvePerformFollow('first', 'a', scenes, () => 0)).toBeNull()
    expect(resolvePerformFollow({ scene: 'gone' }, 'a', scenes, () => 0)).toBeNull()
    expect(resolvePerformFollow('next', 'a', setOf('a').scenes, () => 0)).toBeNull()
    expect(resolvePerformFollow('other', 'a', setOf('a').scenes, () => 0)).toBeNull()
    expect(resolvePerformFollow('next', 'a', [], () => 0)).toBeNull()
  })

  it('draws any over all the scenes and other over the rest', () => {
    expect(resolvePerformFollow('any', 'a', scenes, () => 0)).toBeNull()
    expect(resolvePerformFollow('any', 'a', scenes, () => 0.5)).toBe('b')
    expect(resolvePerformFollow('other', 'a', scenes, () => 0)).toBe('b')
    expect(resolvePerformFollow('other', 'a', scenes, () => 0.99)).toBe('c')
  })

  it('says a rule in a few words', () => {
    const named = [scene('a', { name: 'Dawn' }), scene('b', { name: 'Night' })]
    expect(
      describePerformFollow(
        { a: { scene: 'a' }, b: 'other', chance: 0.7, after: { unit: 'bars', value: 8 } },
        named,
      ),
    ).toBe('Dawn 70%, any other 30%, after 8 bars')
    expect(
      describePerformFollow({
        a: 'next',
        b: 'next',
        chance: 0.5,
        after: { unit: 'bars', value: 1 },
      }),
    ).toBe('next, after 1 bar')
    expect(
      describePerformFollow({
        a: 'stay',
        b: 'any',
        chance: 0,
        after: { unit: 'seconds', value: 30 },
      }),
    ).toBe('any, after 30 s')
  })
})
