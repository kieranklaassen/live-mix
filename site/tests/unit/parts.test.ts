import { describe, expect, it } from 'vitest'
import type { ControlInfo, LabDescription } from '../../src/lab/describe.ts'
import {
  PARTS,
  benchFeed,
  defaultsBeside,
  labsOwnRows,
  openingTaps,
  partNamed,
  partsIn,
  ranWords,
  setInWords,
  stageKindWords,
  tableWords,
  valueInWords,
  valueWithUnit,
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

  it('is one of a thing in the singular, where the unit is a plural word', () => {
    const span = control(9, 'span', 'Span', 'octaves', 0, 4, 2)
    expect(valueInWords(span, 1)).toBe('1 octave')
    expect(valueInWords(span, 2)).toBe('2 octaves')
    expect(valueInWords(span, 0)).toBe('0 octaves')
    expect(valueInWords(span, 0.5)).toBe('0.5 octaves')
    expect(valueInWords(span, 1.5)).toBe('1.5 octaves')
    // What is printed as 1 is one of them: a float that is not quite 1 reads "1" too.
    expect(valueInWords(span, 1.0000001192092896)).toBe('1 octave')
    expect(valueWithUnit(1, 'samples')).toBe('1 sample')
    expect(valueWithUnit(1, 'cents')).toBe('1 cent')
    expect(valueWithUnit(1, 'passes')).toBe('1 pass')
    expect(valueWithUnit(3, 'passes')).toBe('3 passes')
  })

  it('leaves a unit that is not a plural word as it is', () => {
    for (const unit of ['s', 'ms', 'Hz', 'dB', 'st', 'oct', 'bit', 'a second', 'kbps', 'gauss']) {
      expect(valueWithUnit(1, unit)).toBe(`1 ${unit}`)
    }
    expect(valueWithUnit(1, '%')).toBe('1%')
    expect(valueWithUnit(1, ':1')).toBe('1:1')
    expect(valueWithUnit(1, '')).toBe('1')
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

describe("which rows of the last part's table are the lab's own", () => {
  // A lab names a control in its own way and the device in the library's: the same control is
  // `predelay` in milliseconds here and `predelayMs` there, "Rate" here and "LFO Rate" there.
  const room: LabDescription = {
    ...lab,
    controls: [
      control(0, 'size', 'Size', '', 0, 1, 0.5),
      control(1, 'predelay', 'Pre-delay', 'ms', 0, 200, 20),
      control(2, 'rate', 'Rate', 'Hz', 0.1, 10, 1),
      control(3, 'wander', 'Wander', '', 0, 1, 0),
      control(4, 'tank', "The tank's delays", '', 0, 1, 1, ['Still', 'Moving']),
      control(5, 'build', 'Build', '', 0, 2, 0, ['A wire', 'One', 'Two']),
    ],
  }
  const params = [
    { key: 'size', name: 'Room size' },
    { key: 'predelayMs', name: 'Pre-delay' },
    { key: 'lfoRateHz', name: 'LFO Rate' },
    { key: 'ratePerSecond', name: 'Grains' },
    { key: 'mix', name: 'Mix' },
  ]
  const every = { values: { size: 0.7, predelay: 0, rate: 0.5, wander: 1, tank: 0 } }

  it('are those no parameter of the device answers to, by its key or by its name', () => {
    expect(labsOwnRows(room, every, params).map((row) => row.id)).toEqual(['wander', 'tank'])
  })

  it('are none where every row is a parameter of the device, however the two spell it', () => {
    expect(labsOwnRows(room, { values: { size: 0.7, predelay: 0, rate: 0.5 } }, params)).toEqual([])
  })

  it('takes a key that ends in the control and its unit, and no key that only begins with it', () => {
    // `rate` in hertz is `lfoRateHz`; it is not `ratePerSecond`, which is another control.
    const grains = [{ key: 'ratePerSecond', name: 'Grains' }]
    expect(labsOwnRows(room, { values: { rate: 0.5 } }, grains).map((row) => row.id)).toEqual([
      'rate',
    ])
    // Nor is a key that ends in another unit than the control's.
    const seconds = [{ key: 'predelaySeconds', name: 'Wait' }]
    expect(labsOwnRows(room, { values: { predelay: 0 } }, seconds).map((row) => row.id)).toEqual([
      'predelay',
    ])
  })

  it('is every row for a device with no parameter', () => {
    expect(labsOwnRows(room, every, []).map((row) => row.id)).toEqual([
      'size',
      'predelay',
      'rate',
      'wander',
      'tank',
    ])
  })
})

describe('the sentence above the last part\u2019s table', () => {
  const row = (id: string, name: string) => ({ id, name, lesson: '0', device: '1' })
  const rows = [row('size', 'Size'), row('wander', 'Wander'), row('tank', "The tank's delays")]

  it("says the lab's controls are the device's own only where every row is the device's", () => {
    expect(tableWords(rows, [])).toBe(
      "The lab's controls are the device's own. Where this lesson starts each of them, and where the device starts it when nothing has been set:",
    )
  })

  it("names the row that is the lab's, and says what its second number is", () => {
    expect(tableWords(rows, [rows[1]!])).toBe(
      "The controls in this table are the device's own, except Wander, which is the lab's: the device has no such control, and that row gives the setting at which the lab does as the device does. Where this lesson starts each of them, and where the device starts it when nothing has been set:",
    )
  })

  it("names every row that is the lab's, where there are several", () => {
    expect(tableWords(rows, [rows[1]!, rows[2]!])).toBe(
      "The controls in this table are the device's own, except Wander and The tank's delays, which are the lab's: the device has no such controls, and those rows give the settings at which the lab does as the device does. Where this lesson starts each of them, and where the device starts it when nothing has been set:",
    )
  })

  it("says so where every row is the lab's", () => {
    expect(tableWords(rows, rows)).toBe(
      "The controls in this table are the lab's, and the device has none of them. Where this lesson starts each of them, and the setting at which the lab does as the device does:",
    )
  })
})

describe('what the last part says ran above it', () => {
  it("is the engine's code and nothing else, for a lesson that says nothing more", () => {
    expect(ranWords()).toBe(
      "Everything above ran in a lab: the engine's code, stopped at each stage so it could be looked at.",
    )
  })

  it("says part of it is the lesson's own where the front matter says which part, in its words", () => {
    expect(ranWords('The sum is written here, because the engine hands it to the browser.')).toBe(
      "Everything above ran in a lab: the engine's code, stopped at each stage so it could be looked at, and with it code written for this lesson. The sum is written here, because the engine hands it to the browser.",
    )
  })
})

describe('what the real device is fed', () => {
  it('is the loop the page plays, for an effect in a lesson with loops', () => {
    expect(benchFeed(lab, ['drums', 'pad'], 'insert')).toBe('on the same loop')
    expect(benchFeed(lab, ['drums'], 'send')).toBe('on the same loop')
  })

  it('is a phrase of its own for an instrument, which takes no sound in', () => {
    expect(benchFeed(lab, ['none'], 'instrument')).toBe('played a short phrase that comes round')
  })

  it('is the sound the lab makes, by its name, for an effect in a lesson with no loop', () => {
    // The page hands the bench the first tap that is the source's, as the store does.
    expect(benchFeed(lab, ['none'], 'insert')).toBe(
      'fed the sound the lab itself makes, \u201cInput\u201d, since this lesson plays no loop',
    )
    // Without one, the first that is sound.
    const taps = lab.taps.map((tap) => ({ ...tap, origin: 'device' as const }))
    expect(benchFeed({ ...lab, taps: [taps[1]!, taps[2]!, taps[0]!] }, ['none'], 'send')).toBe(
      'fed the sound the lab itself makes, \u201cOutput\u201d, since this lesson plays no loop',
    )
  })
})

describe('what a stage that is not sound says of itself', () => {
  const NAMES = [
    'Gain reduction',
    'The grain: the piece times the window',
    'The delayed path alone, measured',
    "The note's partials",
    'Bins, level',
  ]
  const KINDS = ['control', 'curve', 'spectrum', 'frames'] as const

  it('says what each kind of tap is, as the lab declares the kind', () => {
    expect(stageKindWords('Gain reduction', 'control')).toBe(
      '“Gain reduction” is a value that changes over time. It is not sound, so this stage has no button to hear it.',
    )
    expect(stageKindWords('The bell', 'curve')).toMatch(
      /^“The bell” is a curve of one value against another\. /,
    )
    expect(stageKindWords('Bins, level', 'spectrum')).toMatch(
      /^“Bins, level” is a spectrum, a level for each frequency\. /,
    )
    // A tap of frames is columns of values: a spectrum over time, the windows of overlapping
    // frames or anything else a lab lays out so. The words claim no more than that.
    expect(stageKindWords("The note's partials", 'frames')).toMatch(
      /^“The note's partials” is a picture made of columns of values\. /,
    )
    expect(stageKindWords("The note's partials", 'frames')).not.toMatch(/over time/)
  })

  it('reads as sentences whatever the tap is called: the name is quoted whole, and the page adds no colon', () => {
    for (const name of NAMES) {
      for (const kind of KINDS) {
        const words = stageKindWords(name, kind)
        expect(words.startsWith(`“${name}” is a `), words).toBe(true)
        expect(words.replace(`“${name}”`, '').includes(':'), words).toBe(false)
        expect(words.endsWith(' It is not sound, so this stage has no button to hear it.')).toBe(
          true,
        )
      }
    }
  })
})
