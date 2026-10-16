import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  inMapOrder,
  MAP,
  mapWith,
  mention,
  placeOf,
  places,
  type MapFamily,
} from '../../src/lib/lesson-map.ts'

// The table of the plan, written out again: the families in their order, each with its four.
const TABLE: [string, string[]][] = [
  ['Signals', ['samples-and-aliasing', 'level-and-loudness', 'bit-depth-and-dither', 'wavetables']],
  [
    'Spectrum',
    ['fourier-transform', 'short-time-fourier', 'spectral-processing', 'frequency-shifting'],
  ],
  ['Filters', ['one-pole', 'state-variable-filter', 'equalising', 'phasing']],
  ['Dynamics', ['compression', 'limiting', 'saturation', 'tremolo-and-ring-modulation']],
  ['Delays', ['delay-and-echo', 'chorus-and-flanging', 'pitch-shifting', 'granular']],
  ['Rooms', ['plate-reverb', 'feedback-delay-network', 'convolution-reverb', 'spring-reverb']],
  ['Space and motion', ['envelopes-and-lfos', 'stereo', 'rotary-speaker', 'binaural-beats']],
  [
    'Synthesis',
    [
      'oscillators-and-subtractive-voice',
      'plucked-string',
      'frequency-modulation',
      'modal-synthesis',
    ],
  ],
]

// A small map to break: two families of two.
const small: MapFamily[] = [
  {
    id: 'filters',
    name: 'Filters',
    lessons: [
      { id: 'one-pole', title: 'The one-pole filter' },
      { id: 'phasing', title: 'Phasing' },
    ],
  },
  {
    id: 'dynamics',
    name: 'Dynamics',
    lessons: [
      { id: 'compression', title: 'Compression' },
      { id: 'limiting', title: 'Limiting' },
    ],
  },
]
const written = (id: string, family: string) => ({ id, data: { family } })

describe('the map of the lessons', () => {
  it('lists eight families of four, in the order of the table', () => {
    expect(MAP.map((family) => [family.name, family.lessons.map((lesson) => lesson.id)])).toEqual(
      TABLE,
    )
    expect(MAP).toHaveLength(8)
    for (const family of MAP) expect(family.lessons).toHaveLength(4)
  })

  it('numbers thirty-two distinct lessons from 1 by that order', () => {
    const all = places()
    expect(new Set(all.map((place) => place.id)).size).toBe(32)
    expect(all.map((place) => place.number)).toEqual(Array.from({ length: 32 }, (_, i) => i + 1))
    expect(all.map((place) => place.id)).toEqual(TABLE.flatMap(([, ids]) => ids))
  })

  it('says where a lesson stands: its number, its family and its place in the family', () => {
    expect(placeOf('compression')).toEqual({
      id: 'compression',
      title: 'Compression',
      number: 13,
      family: 'dynamics',
      familyName: 'Dynamics',
      inFamily: 1,
      ofFamily: 4,
    })
    expect(placeOf('binaural-beats')).toMatchObject({
      number: 28,
      family: 'space-and-motion',
      familyName: 'Space and motion',
      inFamily: 4,
    })
    expect(placeOf('modal-synthesis').number).toBe(32)
  })

  it('fails on an id listed twice, naming it', () => {
    const twice: MapFamily[] = [
      small[0]!,
      { ...small[1]!, lessons: [...small[1]!.lessons, { id: 'phasing', title: 'Phasing again' }] },
    ]
    expect(() => places(twice)).toThrow('The map lists the lesson "phasing" twice')
    expect(() => inMapOrder([written('compression', 'dynamics')], twice)).toThrow(
      'The map lists the lesson "phasing" twice',
    )
  })
})

describe('the lessons that are written', () => {
  it('come in the order of the map, whatever order their files are read in', () => {
    const lessons = [
      written('limiting', 'dynamics'),
      written('phasing', 'filters'),
      written('compression', 'dynamics'),
    ]
    expect(inMapOrder(lessons, small).map((lesson) => lesson.id)).toEqual([
      'phasing',
      'compression',
      'limiting',
    ])
  })

  it('fail when one names a family the map does not put it in, with a message naming the lesson', () => {
    expect(() => inMapOrder([written('compression', 'filters')], small)).toThrow(
      'compression: its front matter says the family "filters", and the map puts it in "dynamics".',
    )
  })

  it('fail when the map does not list one', () => {
    expect(() => inMapOrder([written('07-compression', 'dynamics')], small)).toThrow(
      '07-compression: the map does not list it.',
    )
  })

  it('leave a listed lesson with no file as not yet written, and do not fail', () => {
    const map = mapWith([written('limiting', 'dynamics'), written('one-pole', 'filters')], small)
    expect(map.map((family) => family.name)).toEqual(['Filters', 'Dynamics'])
    expect(
      map.flatMap((family) =>
        family.lessons.map((one) => [one.number, one.id, one.lesson !== undefined]),
      ),
    ).toEqual([
      [1, 'one-pole', true],
      [2, 'phasing', false],
      [3, 'compression', false],
      [4, 'limiting', true],
    ])
  })

  it('are each in the map, under the family their front matter names', () => {
    const folder = fileURLToPath(new URL('../../src/content/lessons/', import.meta.url))
    const lessons = fs
      .readdirSync(folder)
      .filter((name) => name.endsWith('.mdx'))
      .map((name) => {
        const text = fs.readFileSync(`${folder}${name}`, 'utf8')
        return written(name.replace(/\.mdx$/, ''), /^family: (.+)$/m.exec(text)?.[1] ?? '')
      })
    expect(lessons.length).toBeGreaterThan(0)
    expect(() => inMapOrder(lessons)).not.toThrow()
  })
})

describe('a lesson named in the text', () => {
  it('is printed as its number and title from the map', () => {
    expect(mention('compression')).toBe('lesson 13, Compression')
    expect(mention('fourier-transform')).toBe('lesson 5, The Fourier transform')
  })

  it('takes a capital where it starts a sentence', () => {
    expect(mention('compression', true)).toBe('Lesson 13, Compression')
  })

  it('stops the build on an id the map does not list, naming the id and the page', () => {
    expect(() => mention('07-compression', false, 'limiting')).toThrow(
      'limiting: <Lesson id="07-compression" /> names a lesson the map does not list.',
    )
  })
})
