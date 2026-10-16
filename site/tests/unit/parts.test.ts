import { describe, expect, it } from 'vitest'
import type { ControlInfo, LabDescription } from '../../src/lab/describe.ts'
import {
  PARTS,
  defaultsBeside,
  openingTaps,
  partNamed,
  partsIn,
  setInWords,
  valueInWords,
} from '../../src/lib/parts.ts'

const control = (
  index: number,
  id: string,
  name: string,
  unit: string,
  min: number,
  max: number,
  initial: number,
  choices: string[] = [],
): ControlInfo => ({ index, id, name, unit, min, max, initial, scale: 'linear', choices })

const lab: LabDescription = {
  sampleRate: 48_000,
  maxFrames: 192_000,
  controls: [
    control(0, 'threshold', 'Threshold', 'dB', -60, 0, -24),
    control(1, 'ratio', 'Ratio', ':1', 1, 10, 4),
    // As a lab hands a float over: 0.3 that is not quite 0.3.
    control(2, 'release', 'Release', 's', 0.1, 20, 0.30000001192092896),
    control(3, 'tails', 'Tails', '', 0, 1, 1, ['Hold', 'Release']),
    control(4, 'mix', 'Mix', '', 0, 1, 1),
    control(5, 'build', 'Build', '', 0, 2, 0, ['A wire', 'Measure', 'Curve']),
  ],
  taps: [
    { index: 0, id: 'in', name: 'Input', unit: '', kind: 'audio', origin: 'source', channels: 2 },
    {
      index: 1,
      id: 'gain',
      name: 'Gain',
      unit: 'dB',
      kind: 'control',
      origin: 'device',
      channels: 1,
    },
    { index: 2, id: 'out', name: 'Output', unit: '', kind: 'audio', origin: 'device', channels: 2 },
  ],
  checks: [],
}

describe('the nine parts', () => {
  it('are the nine of the plan, in its order and by its names', () => {
    expect(PARTS.map((part) => [part.id, part.name])).toEqual([
      ['why', 'Why you need it'],
      ['picture', 'What it does, in one picture'],
      ['uses', 'What you use it on'],
      ['build', 'Build one, a piece at a time'],
      ['engine', 'Inside the engine, stage by stage'],
      ['ways', 'Ways to use it'],
      ['wrong', 'What goes wrong'],
      ['myths', 'Common misconceptions'],
      ['device', 'The real device'],
    ])
  })

  it('number a part by its place in the nine, whichever of them a lesson has', () => {
    expect(partNamed('why', 'x')).toEqual({ id: 'why', name: 'Why you need it', number: 1 })
    expect(partNamed('wrong', 'x').number).toBe(7)
    expect(partNamed('device', 'x').number).toBe(9)
  })

  it('stop on an id that is not one of the nine, naming the lesson and the nine', () => {
    expect(() => partNamed('inside', 'compression')).toThrow(
      'compression: there is no part called "inside". The parts are: why, picture, uses, build, engine, ways, wrong, myths, device',
    )
  })
})

describe('the parts a lesson writes', () => {
  const text = [
    'Words before any part.',
    '<Part id="why" title="Music is louder than the place it must fit.">',
    'Text.',
    '</Part>',
    '<Part',
    '  id="uses"',
    '  title="Three sounds, three jobs."',
    '>',
    '</Part>',
    "<Part title='Each of these is a setting.' id='wrong'>",
    '</Part>',
  ].join('\n')

  it('are found in the text, in its order, each with its number of the nine', () => {
    expect(partsIn(text, 'compression').map((part) => [part.number, part.id])).toEqual([
      [1, 'why'],
      [3, 'uses'],
      [7, 'wrong'],
    ])
  })

  it('are none in a text that has no part', () => {
    expect(partsIn('A lesson in the old shape.\n\n## Stage by stage\n', 'x')).toEqual([])
  })

  it('stop the build on a part that is not one of the nine', () => {
    expect(() => partsIn('<Part id="inside" title="x">', 'compression')).toThrow(
      'compression: there is no part called "inside".',
    )
  })

  it('stop the build on the last part, which the page adds by itself', () => {
    expect(() => partsIn('<Part id="device" title="x">', 'compression')).toThrow(
      'compression: its text writes the part "device". The page adds that part itself',
    )
  })

  it('stop the build on a part out of its order, and on one written twice', () => {
    expect(() =>
      partsIn('<Part id="uses" title="x"></Part>\n<Part id="why" title="y">', 'compression'),
    ).toThrow('compression: the part "why" comes after "uses". The order is: why, picture, uses')
    expect(() =>
      partsIn('<Part id="why" title="x"></Part>\n<Part id="why" title="y">', 'compression'),
    ).toThrow('compression: the part "why" is written twice.')
  })
})

describe('the opening picture', () => {
  it('takes the two taps the front matter names, where the lab has both', () => {
    expect(openingTaps(lab, { input: 'in', output: 'out' }, 'compression')).toEqual({
      input: 'in',
      output: 'out',
    })
  })

  it('stops the build on a tap the lab lacks, naming the lesson and the taps there are', () => {
    expect(() => openingTaps(lab, { input: 'in', output: 'outt' }, 'compression')).toThrow(
      'compression: its opening picture names the tap "outt", which the lab does not have. It has: in, gain, out',
    )
    expect(() => openingTaps(lab, { input: 'dry', output: 'out' }, 'compression')).toThrow(
      'compression: its opening picture names the tap "dry"',
    )
  })
})

describe('a value in words', () => {
  it('is the number with the unit of its control, as the control itself prints it', () => {
    expect(valueInWords(lab.controls[0]!, -30)).toBe('−30 dB')
    expect(valueInWords(lab.controls[1]!, 6)).toBe('6:1')
    expect(valueInWords(lab.controls[2]!, 0.30000001192092896)).toBe('0.3 s')
    expect(valueInWords(lab.controls[4]!, 0.35)).toBe('0.35')
  })

  it('is the name of the choice, for a control of a few choices', () => {
    expect(valueInWords(lab.controls[3]!, 0)).toBe('Hold')
    expect(valueInWords(lab.controls[3]!, 1)).toBe('Release')
  })
})

describe("a card's settings in words", () => {
  it('are the controls the set names, in the order the lab has them, and its source by name', () => {
    const words = setInWords(lab, {
      values: { tails: 0, ratio: 8, threshold: -40 },
      source: 'drums',
      tap: 'out',
    })
    expect(words).toEqual({
      settings: [
        { id: 'threshold', name: 'Threshold', value: '−40 dB' },
        { id: 'ratio', name: 'Ratio', value: '8:1' },
        { id: 'tails', name: 'Tails', value: 'Hold' },
      ],
      source: 'Drums',
    })
  })

  it('are none for a set that names no control: the page stays at the lesson’s start', () => {
    expect(setInWords(lab, {})).toEqual({ settings: [] })
    expect(setInWords(lab, { values: {} })).toEqual({ settings: [] })
  })
})

describe("the lesson's start beside the device's defaults", () => {
  it('is a row for each control the defaults name, with both values in words', () => {
    expect(defaultsBeside(lab, { values: { release: 2, ratio: 2, tails: 0 } })).toEqual([
      { id: 'ratio', name: 'Ratio', lesson: '4:1', device: '2:1' },
      { id: 'release', name: 'Release', lesson: '0.3 s', device: '2 s' },
      { id: 'tails', name: 'Tails', lesson: 'Release', device: 'Hold' },
    ])
  })
})
