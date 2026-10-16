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

  it('fail a whole build on a lesson the map lists that has no file, naming each one', () => {
    expect(() =>
      mapWith([written('limiting', 'dynamics'), written('one-pole', 'filters')], small),
    ).toThrow(
      'The map lists 2 lessons that have no file: phasing, compression. ' +
        'Each needs site/src/content/lessons/<id>.mdx, or comes off the map (site/src/content/families.json).',
    )
    expect(() =>
      mapWith(
        [
          written('limiting', 'dynamics'),
          written('one-pole', 'filters'),
          written('phasing', 'filters'),
        ],
        small,
      ),
    ).toThrow('The map lists 1 lesson that has no file: compression.')
  })

  it('are the whole map, family by family, when every lesson it lists has its file', () => {
    const all = [
      written('limiting', 'dynamics'),
      written('compression', 'dynamics'),
      written('phasing', 'filters'),
      written('one-pole', 'filters'),
    ]
    const map = mapWith(all, small)
    expect(map.map((family) => family.name)).toEqual(['Filters', 'Dynamics'])
    expect(
      map.flatMap((family) => family.lessons.map((one) => [one.number, one.id, one.lesson?.id])),
    ).toEqual([
      [1, 'one-pole', 'one-pole'],
      [2, 'phasing', 'phasing'],
      [3, 'compression', 'compression'],
      [4, 'limiting', 'limiting'],
    ])
  })

  it('in a build of one lesson leave every other lesson of the map in its place, not built', () => {
    // scripts/lesson.sh builds a site that holds one lesson: only its file is read.
    const map = mapWith([written('limiting', 'dynamics')], small, 'limiting')
    expect(
      map.flatMap((family) =>
        family.lessons.map((one) => [one.number, one.id, one.lesson !== undefined]),
      ),
    ).toEqual([
      [1, 'one-pole', false],
      [2, 'phasing', false],
      [3, 'compression', false],
      [4, 'limiting', true],
    ])
    // The one lesson itself must be there.
    expect(() => mapWith([], small, 'limiting')).toThrow(
      'The map lists 1 lesson that has no file: limiting.',
    )
  })

  it('have a file each: thirty-two of them, as the map lists', () => {
    const folder = fileURLToPath(new URL('../../src/content/lessons/', import.meta.url))
    const files = fs
      .readdirSync(folder)
      .filter((name) => name.endsWith('.mdx'))
      .map((name) => name.replace(/\.mdx$/, ''))
      .sort()
    expect(files).toEqual(
      TABLE.flatMap(([, ids]) => ids)
        .slice()
        .sort(),
    )
    expect(files).toHaveLength(32)
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

describe("what the pages' build takes in", () => {
  it('is no file that finds the map by a path from its own place', () => {
    // scripts/site-env.mjs opens src/content/families.json beside itself when a build holds one
    // lesson. Taken into the pages' build it is moved, the path leads nowhere, and every
    // one-lesson build stops. The content's own settings file is read where it lies, and may.
    const src = fileURLToPath(new URL('../../src/', import.meta.url))
    const taking = fs
      .readdirSync(src, { recursive: true, encoding: 'utf8' })
      .filter((file) => /\.(ts|tsx|astro|mjs)$/.test(file) && file !== 'content.config.ts')
      .filter((file) =>
        /from\s+['"][^'"]*site-env\.mjs['"]/.test(fs.readFileSync(`${src}${file}`, 'utf8')),
      )
    expect(taking).toEqual([])
  })
})
