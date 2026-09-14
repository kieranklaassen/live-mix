import { describe, expect, it } from 'vitest'

import { absoluteEvent, triggerEvent, type ControlEvent } from '../event'
import {
  DEFAULT_RELATIVE_STEP,
  IDLE_LEARN,
  applyCurve,
  createMapping,
  createResolveState,
  describeMapping,
  inferMode,
  isMapped,
  learnFromEvent,
  mapTarget,
  mappingFor,
  mappingsFor,
  normalizeInput,
  nudgedValue,
  pickupAllows,
  resolveControlEvent,
  shapeValue,
  toggledValue,
  unmapSource,
  unmapTarget,
  updateMapping,
  upgradeLearnedSource,
  type MappingTable,
  type PickupMemory,
} from '../mapping'
import { type ControlSource } from '../source'
import { type ControlTarget } from '../target'

const level: ControlTarget = { kind: 'strip', track: 'pad', control: 'level' }
const pan: ControlTarget = { kind: 'strip', track: 'pad', control: 'pan' }
const mute: ControlTarget = { kind: 'strip', track: 'pad', control: 'mute' }
const play: ControlTarget = { kind: 'transport', action: 'toggle' }
const cutoff: ControlTarget = { kind: 'device', device: 'flt', param: 'frequency' }

const cc74: ControlSource = { kind: 'cc', channel: 1, controller: 74 }
const cc1: ControlSource = { kind: 'cc', channel: 1, controller: 1 }
const pad36: ControlSource = { kind: 'note', channel: 1, note: 36 }
const fader: ControlSource = { kind: 'osc', address: '/1/fader1', arg: 0 }

const cc = (source: ControlSource, raw: number): ControlEvent =>
  absoluteEvent(source, raw / 127, raw)
const press = (source: ControlSource, velocity = 100): ControlEvent =>
  triggerEvent(source, true, velocity / 127)
const release = (source: ControlSource): ControlEvent => triggerEvent(source, false, 0)

describe('value shaping', () => {
  it('normalises through the input range and clamps', () => {
    expect(normalizeInput({ min: 0, max: 1 }, 0.25)).toBe(0.25)
    expect(normalizeInput({ min: 0, max: 127 }, 127)).toBe(1)
    expect(normalizeInput({ min: 0, max: 127 }, 200)).toBe(1)
    expect(normalizeInput({ min: -1, max: 1 }, 0)).toBe(0.5)
    expect(normalizeInput({ min: 1, max: 1 }, 5)).toBe(0)
    expect(normalizeInput({ min: 0, max: 1 }, Number.NaN)).toBe(0)
  })

  it('applies curves and clamps the position', () => {
    expect(applyCurve('linear', 0.5)).toBe(0.5)
    expect(applyCurve('exp', 0.5)).toBe(0.25)
    expect(applyCurve('log', 0.25)).toBe(0.5)
    expect(applyCurve('s', 0.5)).toBe(0.5)
    expect(applyCurve('s', 0.25)).toBeCloseTo(0.15625)
    expect(applyCurve('linear', 2)).toBe(1)
    expect(applyCurve('exp', -1)).toBe(0)
  })

  it('shapes through input range, curve and output span, inverting when min > max', () => {
    const plain = createMapping({ source: cc74, target: level })
    expect(shapeValue(plain, 0.5)).toBe(0.5)
    const narrow = createMapping({ source: cc74, target: level, output: { min: 0.2, max: 0.8 } })
    expect(shapeValue(narrow, 0)).toBeCloseTo(0.2)
    expect(shapeValue(narrow, 1)).toBeCloseTo(0.8)
    expect(shapeValue(narrow, 0.5)).toBeCloseTo(0.5)
    const inverted = createMapping({ source: cc74, target: level, output: { min: 1, max: 0 } })
    expect(shapeValue(inverted, 0.25)).toBe(0.75)
    const scaled = createMapping({
      source: fader,
      target: level,
      input: { min: 0, max: 127 },
      curve: 'exp',
    })
    expect(shapeValue(scaled, 127)).toBe(1)
    expect(shapeValue(scaled, 63.5)).toBe(0.25)
  })

  it('describes a mapping briefly', () => {
    expect(describeMapping(createMapping({ source: cc74, target: level }))).toBe('set')
    expect(
      describeMapping(createMapping({ source: cc74, target: level, curve: 'exp', pickup: true })),
    ).toBe('set · exp · pickup')
  })
})

describe('table edits', () => {
  it('binds one source per target, replaces on rebind and keeps defaults filled', () => {
    let table: MappingTable = []
    table = mapTarget(table, { source: cc74, target: level })
    table = mapTarget(table, { source: cc1, target: level, curve: 'exp' })
    expect(table).toHaveLength(1)
    expect(mappingFor(table, level)).toMatchObject({
      source: cc1,
      mode: 'set',
      curve: 'exp',
      pickup: false,
      input: { min: 0, max: 1 },
      output: { min: 0, max: 1 },
      encoding: 'twos-complement',
      step: DEFAULT_RELATIVE_STEP,
    })
  })

  it('lets one source drive several targets and unbinds per target or per source', () => {
    let table: MappingTable = mapTarget([], { source: cc1, target: level })
    table = mapTarget(table, { source: cc1, target: pan })
    table = mapTarget(table, { source: cc74, target: cutoff })
    expect(table).toHaveLength(3)
    expect(mappingsFor(table, cc(cc1, 0)).map((m) => m.target)).toEqual([level, pan])
    expect(isMapped(table, cc(cc1, 0))).toBe(true)
    expect(isMapped(table, cc({ kind: 'cc', channel: 2, controller: 1 }, 0))).toBe(false)
    table = unmapTarget(table, level)
    expect(table.map((m) => m.target)).toEqual([pan, cutoff])
    table = unmapSource(table, cc1)
    expect(table.map((m) => m.target)).toEqual([cutoff])
  })

  it('updates options of one mapping in place', () => {
    let table: MappingTable = mapTarget([], { source: cc1, target: level })
    table = mapTarget(table, { source: cc74, target: pan })
    table = updateMapping(table, level, { pickup: true, output: { min: 0, max: 0.5 } })
    expect(table[0]).toMatchObject({ target: level, pickup: true, output: { min: 0, max: 0.5 } })
    expect(table[1].pickup).toBe(false)
    expect(updateMapping(table, cutoff, { pickup: true })).toEqual(table)
  })
})

describe('resolveControlEvent', () => {
  const table: MappingTable = [
    createMapping({ source: cc74, target: level }),
    createMapping({ source: cc74, target: cutoff, curve: 'exp' }),
    createMapping({ source: pad36, target: mute, mode: 'toggle' }),
    createMapping({ source: cc1, target: mute }),
    createMapping({ source: { kind: 'note', channel: 1, note: 37 }, target: level }),
    createMapping({ source: { kind: 'note', channel: 1, note: 38 }, target: play }),
    createMapping({ source: { kind: 'cc', channel: 1, controller: 20 }, target: play }),
  ]

  it('turns a position into a set on every target bound to it, shaped per mapping', () => {
    expect(resolveControlEvent(table, cc(cc74, 127))).toEqual([
      { kind: 'set', target: level, unit: 1, mapping: table[0] },
      { kind: 'set', target: cutoff, unit: 1, mapping: table[1] },
    ])
    expect(
      resolveControlEvent(table, cc(cc74, 64))[1].kind === 'set' &&
        resolveControlEvent(table, cc(cc74, 64))[1],
    ).toMatchObject({
      unit: (64 / 127) ** 2,
    })
    expect(resolveControlEvent(table, cc({ kind: 'cc', channel: 2, controller: 74 }, 0))).toEqual(
      [],
    )
  })

  it('toggles on a press and never on a release; an absolute switch sets on/off at the midpoint', () => {
    expect(resolveControlEvent(table, press(pad36))).toEqual([
      { kind: 'toggle', target: mute, mapping: table[2] },
    ])
    expect(resolveControlEvent(table, release(pad36))).toEqual([])
    expect(resolveControlEvent(table, cc(cc1, 127))).toEqual([
      { kind: 'set', target: mute, unit: 1, mapping: table[3] },
    ])
    expect(resolveControlEvent(table, cc(cc1, 0))).toEqual([
      { kind: 'set', target: mute, unit: 0, mapping: table[3] },
    ])
  })

  it('sets a continuous target from velocity on a press and ignores the release', () => {
    const note37 = { kind: 'note', channel: 1, note: 37 } as const
    expect(resolveControlEvent(table, press(note37, 127))).toEqual([
      { kind: 'set', target: level, unit: 1, mapping: table[4] },
    ])
    expect(resolveControlEvent(table, release(note37))).toEqual([])
  })

  it('fires an action target on a press or on a rising edge of an absolute source', () => {
    const note38 = { kind: 'note', channel: 1, note: 38 } as const
    const cc20 = { kind: 'cc', channel: 1, controller: 20 } as const
    expect(resolveControlEvent(table, press(note38))).toEqual([
      { kind: 'trigger', target: play, mapping: table[5] },
    ])
    expect(resolveControlEvent(table, release(note38))).toEqual([])
    const state = createResolveState()
    expect(resolveControlEvent(table, cc(cc20, 127), { state })).toHaveLength(1)
    expect(resolveControlEvent(table, cc(cc20, 127), { state })).toHaveLength(0)
    expect(resolveControlEvent(table, cc(cc20, 0), { state })).toHaveLength(0)
    expect(resolveControlEvent(table, cc(cc20, 100), { state })).toHaveLength(1)
  })

  it('toggle mode on an absolute source flips on each rise past the midpoint', () => {
    const toggling: MappingTable = [createMapping({ source: cc1, target: mute, mode: 'toggle' })]
    const state = createResolveState()
    expect(resolveControlEvent(toggling, cc(cc1, 127), { state })).toHaveLength(1)
    expect(resolveControlEvent(toggling, cc(cc1, 127), { state })).toHaveLength(0)
    expect(resolveControlEvent(toggling, cc(cc1, 0), { state })).toHaveLength(0)
    expect(resolveControlEvent(toggling, cc(cc1, 64), { state })).toHaveLength(1)
  })

  it('nudges in relative mode by the decoded steps times the step size, inverted with the output span', () => {
    const relative: MappingTable = [
      createMapping({ source: cc1, target: level, mode: 'relative', step: 0.01 }),
      createMapping({
        source: cc74,
        target: pan,
        mode: 'relative',
        encoding: 'binary-offset',
        output: { min: 1, max: 0 },
      }),
      createMapping({ source: fader, target: cutoff, mode: 'relative', step: 0.1 }),
    ]
    expect(resolveControlEvent(relative, cc(cc1, 3))).toEqual([
      { kind: 'nudge', target: level, delta: 0.03, mapping: relative[0] },
    ])
    expect(resolveControlEvent(relative, cc(cc1, 127))[0]).toMatchObject({ delta: -0.01 })
    expect(resolveControlEvent(relative, cc(cc1, 0))).toEqual([])
    expect(resolveControlEvent(relative, cc(cc74, 66))[0]).toMatchObject({
      delta: -2 * DEFAULT_RELATIVE_STEP,
    })
    expect(resolveControlEvent(relative, absoluteEvent(fader, -1, -1))[0]).toMatchObject({
      delta: -0.1,
    })
    expect(resolveControlEvent(relative, press(cc1))).toEqual([])
  })

  it('computes toggled and nudged values against the current position', () => {
    const boolMap = createMapping({ source: pad36, target: mute, mode: 'toggle' })
    expect(toggledValue(boolMap, 0)).toBe(1)
    expect(toggledValue(boolMap, 1)).toBe(0)
    expect(toggledValue(boolMap, null)).toBe(1)
    const spanMap = createMapping({
      source: pad36,
      target: level,
      mode: 'toggle',
      output: { min: 0.2, max: 0.8 },
    })
    expect(toggledValue(spanMap, 0.2)).toBe(0.8)
    expect(toggledValue(spanMap, 0.8)).toBe(0.2)
    expect(toggledValue(spanMap, null)).toBe(0.8)
    expect(nudgedValue(spanMap, 0.75, 0.1)).toBe(0.8)
    expect(nudgedValue(spanMap, 0.25, -0.1)).toBe(0.2)
    expect(nudgedValue(spanMap, null, 0.1)).toBeCloseTo(0.3)
  })
})

describe('soft takeover (pickup)', () => {
  it('engages when the controller lands on or crosses the target, then owns it until it is moved elsewhere', () => {
    const state = new Map<string, PickupMemory>()
    // Target sits at 0.5; controller starts at 0.9 and moves down.
    expect(pickupAllows(state, 'k', 0.9, 0.5)).toBe(false)
    expect(pickupAllows(state, 'k', 0.7, 0.5)).toBe(false)
    expect(pickupAllows(state, 'k', 0.45, 0.5)).toBe(true) // crossed
    expect(pickupAllows(state, 'k', 0.3, 0.45)).toBe(true) // target followed the last write
    expect(pickupAllows(state, 'k', 0.9, 0.3)).toBe(true) // still engaged: big jumps are fine
    // Automation moved the target to 0.1 → the controller (at 0.9) must catch it again.
    expect(pickupAllows(state, 'k', 0.8, 0.1)).toBe(false)
    expect(pickupAllows(state, 'k', 0.05, 0.1)).toBe(true)
    // Exactly on target (within one 7-bit step) also engages.
    const fresh = new Map<string, PickupMemory>()
    expect(pickupAllows(fresh, 'k', 0.505, 0.5)).toBe(true)
    // Unknown current position: take over immediately.
    expect(pickupAllows(new Map(), 'k', 0.9, null)).toBe(true)
  })

  it('blocks a set until the controller reaches the target when the mapping has pickup', () => {
    const table: MappingTable = [createMapping({ source: cc74, target: level, pickup: true })]
    const state = createResolveState()
    let current = 0.5
    const read = (): number => current
    expect(resolveControlEvent(table, cc(cc74, 127), { read, state })).toEqual([])
    expect(resolveControlEvent(table, cc(cc74, 100), { read, state })).toEqual([])
    const engaged = resolveControlEvent(table, cc(cc74, 60), { read, state })
    expect(engaged).toHaveLength(1)
    if (engaged[0].kind !== 'set') throw new Error('expected a set')
    current = engaged[0].unit
    expect(resolveControlEvent(table, cc(cc74, 30), { read, state })).toHaveLength(1)
    // Without pickup the same table follows the controller at once.
    expect(
      resolveControlEvent([createMapping({ source: cc74, target: level })], cc(cc74, 127), {
        read,
      }),
    ).toHaveLength(1)
  })

  it('compares in output space so ranges and curves do not defeat pickup', () => {
    const table: MappingTable = [
      createMapping({ source: cc74, target: level, pickup: true, output: { min: 0, max: 0.5 } }),
    ]
    const state = createResolveState()
    const read = (): number => 0.25 // = controller at 50 %
    expect(resolveControlEvent(table, cc(cc74, 127), { read, state })).toEqual([])
    expect(resolveControlEvent(table, cc(cc74, 60), { read, state })).toHaveLength(1)
  })
})

describe('learn', () => {
  it('is a no-op while idle', () => {
    const outcome = learnFromEvent(IDLE_LEARN, [], cc(cc74, 1))
    expect(outcome).toEqual({ learn: IDLE_LEARN, table: [], consumed: false, mapping: null })
  })

  it('binds the armed target to the next position and returns to idle, consuming the event', () => {
    const outcome = learnFromEvent(
      { target: level },
      [],
      cc({ kind: 'cc', channel: 3, controller: 74 }, 1),
    )
    expect(outcome.consumed).toBe(true)
    expect(outcome.learn).toEqual({ target: null })
    expect(outcome.mapping).toMatchObject({
      source: { kind: 'cc', channel: 3, controller: 74 },
      target: level,
      mode: 'set',
    })
    expect(outcome.table).toEqual([outcome.mapping])
  })

  it('binds to a press but keeps waiting through a release; a press on an on/off target toggles', () => {
    const waiting = learnFromEvent({ target: mute }, [], release(pad36))
    expect(waiting.consumed).toBe(false)
    expect(waiting.learn).toEqual({ target: mute })
    const bound = learnFromEvent(waiting.learn, waiting.table, press(pad36))
    expect(bound.mapping).toMatchObject({ source: pad36, target: mute, mode: 'toggle' })
    const velocity = learnFromEvent({ target: level }, [], press(pad36))
    expect(velocity.mapping?.mode).toBe('set')
    const transport = learnFromEvent({ target: play }, [], cc(cc1, 127))
    expect(transport.mapping?.mode).toBe('set')
  })

  it('honours a forced mode and keeps a previous mapping’s options on re-learn', () => {
    const forced = learnFromEvent({ target: level, mode: 'relative' }, [], cc(cc1, 1))
    expect(forced.mapping?.mode).toBe('relative')
    const table = mapTarget([], {
      source: cc74,
      target: level,
      curve: 'exp',
      pickup: true,
      mode: 'relative',
    })
    const relearned = learnFromEvent({ target: level }, table, cc(cc1, 1))
    expect(relearned.mapping).toMatchObject({
      source: cc1,
      curve: 'exp',
      pickup: true,
      mode: 'relative',
    })
    // A pad cannot be a relative encoder: the mode falls back.
    const asPad = learnFromEvent({ target: level }, table, press(pad36))
    expect(asPad.mapping?.mode).toBe('set')
    expect(inferMode(mute, press(pad36))).toBe('toggle')
    expect(inferMode(level, cc(cc1, 0))).toBe('set')
  })

  it('binds OSC sources from their first argument', () => {
    const outcome = learnFromEvent({ target: level }, [], absoluteEvent(fader, 0.3, 0.3))
    expect(outcome.mapping?.source).toEqual(fader)
  })

  it('upgrades a 7-bit learn to 14-bit when the matching LSB follows at once', () => {
    const learned = learnFromEvent({ target: level }, [], cc(cc1, 64))
    if (!learned.mapping) throw new Error('expected a mapping')
    const lsb = absoluteEvent({ kind: 'cc14', channel: 1, controller: 1 }, 0.5, 8192)
    const upgraded = upgradeLearnedSource(learned.table, learned.mapping, lsb)
    expect(upgraded).not.toBeNull()
    expect(mappingFor(upgraded ?? [], level)?.source).toEqual({
      kind: 'cc14',
      channel: 1,
      controller: 1,
    })
    // Not for another controller, another channel, a non-14-bit event, or once the binding changed.
    expect(
      upgradeLearnedSource(
        learned.table,
        learned.mapping,
        absoluteEvent({ kind: 'cc14', channel: 1, controller: 2 }, 0.5),
      ),
    ).toBeNull()
    expect(
      upgradeLearnedSource(
        learned.table,
        learned.mapping,
        absoluteEvent({ kind: 'cc14', channel: 2, controller: 1 }, 0.5),
      ),
    ).toBeNull()
    expect(upgradeLearnedSource(learned.table, learned.mapping, cc(cc1, 65))).toBeNull()
    const rebound = mapTarget(learned.table, { source: cc74, target: level })
    expect(upgradeLearnedSource(rebound, learned.mapping, lsb)).toBeNull()
    const highCc = learnFromEvent({ target: level }, [], cc(cc74, 64))
    if (!highCc.mapping) throw new Error('expected a mapping')
    expect(upgradeLearnedSource(highCc.table, highCc.mapping, lsb)).toBeNull()
  })
})
