import { describe, expect, it } from 'vitest'

import {
  MIDI_OMNI,
  describeSource,
  parseControlSource,
  sameSource,
  sourceKey,
  sourceMatches,
  type ControlSource,
} from '../source'
import {
  describeTarget,
  isActionTarget,
  isBooleanTarget,
  parseControlTarget,
  sameControlTarget,
  controlTargetKey,
  type ControlTarget,
} from '../target'

const targets: ControlTarget[] = [
  { kind: 'strip', track: 'pad', control: 'level' },
  { kind: 'strip', track: 'pad', control: 'mute' },
  { kind: 'send', track: 'pad', send: 'hall' },
  { kind: 'master', control: 'level' },
  { kind: 'device', device: 'pad-filter', param: 'frequency' },
  { kind: 'macro', macro: 'intensity' },
  { kind: 'transport', action: 'toggle' },
]

describe('ControlTarget', () => {
  it('keys every kind distinctly and stably', () => {
    const keys = targets.map(controlTargetKey)
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys).toEqual([
      'strip:pad:level',
      'strip:pad:mute',
      'send:pad:hall',
      'master:level',
      'device:pad-filter:frequency',
      'macro:intensity',
      'transport:toggle',
    ])
    expect(sameControlTarget(targets[0], { kind: 'strip', track: 'pad', control: 'level' })).toBe(
      true,
    )
    expect(sameControlTarget(targets[0], targets[1])).toBe(false)
  })

  it('describes targets for a mapping row', () => {
    expect(targets.map(describeTarget)).toEqual([
      'pad · level',
      'pad · mute',
      'pad · send hall',
      'master · level',
      'pad-filter · frequency',
      'macro · intensity',
      'transport · toggle',
    ])
  })

  it('classifies on/off and action targets', () => {
    expect(targets.map(isBooleanTarget)).toEqual([false, true, false, false, false, false, true])
    expect(targets.map(isActionTarget)).toEqual([false, false, false, false, false, false, true])
    expect(isBooleanTarget({ kind: 'strip', track: 'a', control: 'solo' })).toBe(true)
  })

  it('round-trips through parse and rejects malformed values', () => {
    for (const target of targets) {
      expect(parseControlTarget(JSON.parse(JSON.stringify(target)))).toEqual(target)
    }
    expect(parseControlTarget(null)).toBeNull()
    expect(parseControlTarget('strip:pad:level')).toBeNull()
    expect(parseControlTarget({ kind: 'strip', track: '', control: 'level' })).toBeNull()
    expect(parseControlTarget({ kind: 'strip', track: 'pad', control: 'gain' })).toBeNull()
    expect(parseControlTarget({ kind: 'send', track: 'pad' })).toBeNull()
    expect(parseControlTarget({ kind: 'master', control: 'pan' })).toBeNull()
    expect(parseControlTarget({ kind: 'device', device: 'x', param: 3 })).toBeNull()
    expect(parseControlTarget({ kind: 'macro' })).toBeNull()
    expect(parseControlTarget({ kind: 'transport', action: 'record' })).toBeNull()
    expect(parseControlTarget({ kind: 'reverb.mix' })).toBeNull()
  })
})

const sources: ControlSource[] = [
  { kind: 'note', channel: 1, note: 36 },
  { kind: 'cc', channel: 1, controller: 74 },
  { kind: 'cc14', channel: 2, controller: 1 },
  { kind: 'pitchbend', channel: 1 },
  { kind: 'aftertouch', channel: 3 },
  { kind: 'osc', address: '/1/fader1', arg: 0 },
]

describe('ControlSource', () => {
  it('keys and describes every kind', () => {
    expect(sources.map(sourceKey)).toEqual([
      'note:1:36',
      'cc:1:74',
      'cc14:2:1',
      'pitchbend:1',
      'aftertouch:3',
      'osc:/1/fader1:0',
    ])
    expect(sources.map(describeSource)).toEqual([
      'Note 36 · ch 1',
      'CC 74 · ch 1',
      'CC 1/33 (14-bit) · ch 2',
      'Pitch bend · ch 1',
      'Aftertouch · ch 3',
      'OSC /1/fader1[0]',
    ])
    expect(describeSource({ kind: 'cc', channel: MIDI_OMNI, controller: 1 })).toBe('CC 1 · any ch')
    expect(sameSource(sources[1], { kind: 'cc', channel: 1, controller: 74 })).toBe(true)
  })

  it('matches concrete events to sources, with omni channels and OSC patterns', () => {
    expect(sourceMatches(sources[1], { kind: 'cc', channel: 1, controller: 74 })).toBe(true)
    expect(sourceMatches(sources[1], { kind: 'cc', channel: 2, controller: 74 })).toBe(false)
    expect(sourceMatches(sources[1], { kind: 'cc14', channel: 1, controller: 74 })).toBe(false)
    expect(
      sourceMatches(
        { kind: 'cc', channel: MIDI_OMNI, controller: 74 },
        { kind: 'cc', channel: 9, controller: 74 },
      ),
    ).toBe(true)
    expect(sourceMatches(sources[0], { kind: 'note', channel: 1, note: 36 })).toBe(true)
    expect(sourceMatches(sources[0], { kind: 'note', channel: 1, note: 37 })).toBe(false)
    expect(sourceMatches(sources[3], { kind: 'pitchbend', channel: 1 })).toBe(true)
    expect(sourceMatches(sources[3], { kind: 'aftertouch', channel: 1 })).toBe(false)
    expect(sourceMatches(sources[4], { kind: 'aftertouch', channel: 3 })).toBe(true)
    expect(sourceMatches(sources[5], { kind: 'osc', address: '/1/fader1', arg: 0 })).toBe(true)
    expect(sourceMatches(sources[5], { kind: 'osc', address: '/1/fader1', arg: 1 })).toBe(false)
    expect(
      sourceMatches(
        { kind: 'osc', address: '/1/fader*', arg: 0 },
        { kind: 'osc', address: '/1/fader7', arg: 0 },
      ),
    ).toBe(true)
    expect(
      sourceMatches(
        { kind: 'osc', address: '/1/fader*', arg: 0 },
        { kind: 'osc', address: '/2/fader7', arg: 0 },
      ),
    ).toBe(false)
  })

  it('round-trips through parse and rejects malformed values', () => {
    for (const source of sources) {
      expect(parseControlSource(JSON.parse(JSON.stringify(source)))).toEqual(source)
    }
    expect(parseControlSource({ kind: 'cc', channel: 0, controller: 1 })).toEqual({
      kind: 'cc',
      channel: 0,
      controller: 1,
    })
    expect(parseControlSource(null)).toBeNull()
    expect(parseControlSource({ kind: 'cc', channel: 17, controller: 74 })).toBeNull()
    expect(parseControlSource({ kind: 'cc', channel: 1, controller: 200 })).toBeNull()
    expect(parseControlSource({ kind: 'cc', channel: 1.5, controller: 1 })).toBeNull()
    expect(parseControlSource({ kind: 'note', channel: 1, note: -1 })).toBeNull()
    expect(parseControlSource({ kind: 'cc14', channel: 1, controller: 40 })).toBeNull()
    expect(parseControlSource({ kind: 'pitch', channel: 1 })).toBeNull()
    expect(parseControlSource({ kind: 'osc', address: 'fader', arg: 0 })).toBeNull()
    expect(parseControlSource({ kind: 'osc', address: '/x', arg: -1 })).toBeNull()
  })
})
