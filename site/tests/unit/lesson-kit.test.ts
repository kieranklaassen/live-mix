import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Stage from '../../src/figures/Stage.tsx'
import { tapRefs } from '../../src/figures/roles.ts'
import { describeLab, ORIGINS, ORIGIN_TEXT, type TapInfo } from '../../src/lab/describe.ts'
import type { LabExports } from '../../src/lab/wasm.ts'
import { labInfo } from '../../src/lib/lab-info.ts'
import { checkClaims, claimsIn, holds } from '../../scripts/check-claims.mjs'

const taps: TapInfo[] = [
  { index: 0, id: 'in', name: 'Input', unit: '', kind: 'audio', origin: 'source', channels: 2 },
  {
    index: 1,
    id: 'side',
    name: 'Side chain',
    unit: '',
    kind: 'audio',
    origin: 'device',
    channels: 2,
  },
  {
    index: 2,
    id: 'level',
    name: 'Level',
    unit: 'dB',
    kind: 'control',
    origin: 'lesson',
    channels: 1,
  },
  {
    index: 3,
    id: 'gain',
    name: 'Gain',
    unit: 'dB',
    kind: 'control',
    origin: 'device',
    channels: 1,
  },
  { index: 4, id: 'out', name: 'Output', unit: '', kind: 'audio', origin: 'device', channels: 2 },
]

describe('the colour of a signal', () => {
  it('goes by what the signal is: in grey, out the accent, a control blue', () => {
    const refs = tapRefs('in side level out', taps)
    expect(refs.map((ref) => ref.role)).toEqual(['in', 'alt', 'ctl', 'out'])
  })

  it('gives two controls in one picture a colour each, and takes a role named after a colon', () => {
    expect(tapRefs('level gain', taps).map((ref) => ref.role)).toEqual(['ctl', 'alt'])
    expect(tapRefs('in:out out:alt2', taps).map((ref) => ref.role)).toEqual(['out', 'alt2'])
  })

  it('lets a strip of stages repeat a role', () => {
    expect(tapRefs('in level gain out', taps, 'x', false).map((ref) => ref.role)).toEqual([
      'in',
      'ctl',
      'ctl',
      'out',
    ])
  })

  it('stops on a tap the lab does not have, naming the lesson and the taps there are', () => {
    expect(() => tapRefs('in outt', taps, 'compression')).toThrow(
      'compression: the lab has no tap called "outt". It has: in, side, level, gain, out',
    )
    expect(() => tapRefs('in:loud', taps, 'x')).toThrow('"loud" is not a role')
  })
})

describe('a stage', () => {
  const html = (id: string) =>
    renderToStaticMarkup(createElement(Stage, { tap: tapRefs(id, taps)[0]!, step: 1 }))

  it('has a listen button where it is sound', () => {
    expect(html('side')).toContain('<button')
    expect(html('side')).toContain('Listen')
    expect(html('side')).toContain('Read from the running device')
  })

  it('has no button where it is a value over time, and says what it is', () => {
    expect(html('level')).not.toContain('<button')
    expect(html('level')).toContain('A value over time')
    expect(html('level')).toContain('Written for this lesson')
  })
})

describe('where a stage comes from', () => {
  // The origins in the order site/labs/lab.h numbers them, each with the words the page prints.
  const WORDS: [name: string, origin: string, words: string][] = [
    ['kDevice', 'device', 'Read from the running device'],
    ['kKit', 'kit', "Computed by the engine's kit"],
    ['kLesson', 'lesson', 'Written for this lesson'],
    ['kSource', 'source', 'The sound going in'],
    ['kEngine', 'engine', "Made by the engine's own code"],
    ['kCalled', 'called', 'Computed by an engine function called on its own'],
  ]

  it('has the origins lab.h declares, under the numbers it gives them', () => {
    const header = fs.readFileSync(new URL('../../labs/lab.h', import.meta.url), 'utf8')
    const [, body] = /enum Origin : int \{([^}]*)\}/.exec(header)!
    const declared = body!.split(',').map((one) => one.trim().split(/\s*=\s*/))
    expect(declared).toEqual(WORDS.map(([name], index) => [name, String(index)]))
    expect(ORIGINS).toEqual(WORDS.map(([, origin]) => origin))
  })

  it('has words for each, and reads a function called on its own as that and not as the device', () => {
    expect(ORIGIN_TEXT).toEqual(
      Object.fromEntries(WORDS.map(([, origin, words]) => [origin, words])),
    )
    // A lab of two taps, as its module answers: the first read from the device, the second (5)
    // a function of the engine that the lab called by itself.
    const memory = new WebAssembly.Memory({ initial: 1 })
    const answers: Record<string, unknown> = {
      memory,
      lab_tap_count: () => 2,
      lab_tap_kind: () => 1,
      lab_tap_origin: (i: number) => [0, 5][i],
      lab_tap_channels: () => 1,
    }
    const exports = new Proxy(answers, {
      get: (target, name: string) => target[name] ?? (() => 0),
    }) as unknown as LabExports
    expect(describeLab(exports).taps.map((tap) => tap.origin)).toEqual(['device', 'called'])
    expect(ORIGIN_TEXT[describeLab(exports).taps[1]!.origin]).not.toBe(ORIGIN_TEXT.device)
  })
})

describe('a lesson and its lab', () => {
  it('stops the build, naming the lesson, when the lab it names does not exist', () => {
    expect(() => labInfo('no-such-lab', 'nothing')).toThrow(
      'nothing: it names the lab "no-such-lab", and there is no site/labs/no-such-lab.cpp.',
    )
  })

  it('reads what a built lab says of itself', async () => {
    const lab = await labInfo('bench', 'the bench')
    expect(lab.taps.map((tap) => tap.id)).toContain('drums')
  })
})

describe('claims', () => {
  it('finds the ids of the claims in a lesson', () => {
    const text =
      'A <Claim id="ratio-4">3 dB</Claim> and <Claim id=\'rise\'>40 ms</Claim>, <Claim id="ratio-4">again</Claim>.'
    expect(claimsIn(text)).toEqual({ ids: ['ratio-4', 'rise'], twice: ['ratio-4'] })
  })

  it('takes a claim as held only by its whole id', () => {
    expect(holds("it('settles 3 dB over (claim ratio-4)', …)", 'ratio-4')).toBe(true)
    expect(holds("it('settles (claim ratio-40)', …)", 'ratio-4')).toBe(false)
    expect(holds("it('settles (claim ratio-4-knee)', …)", 'ratio-4')).toBe(false)
  })

  it('fails a lesson whose claim no test holds, and passes it once one does', () => {
    const site = fs.mkdtempSync(path.join(os.tmpdir(), 'claims-'))
    fs.mkdirSync(path.join(site, 'src/content/lessons'), { recursive: true })
    fs.mkdirSync(path.join(site, 'tests/labs'), { recursive: true })
    fs.writeFileSync(
      path.join(site, 'src/content/lessons/falling.mdx'),
      'Falls <Claim id="six-db">6 dB</Claim> an octave.',
    )
    expect(checkClaims(site).problems).toHaveLength(1)
    expect(checkClaims(site).problems[0]).toContain(
      'falling: the claim "six-db" is held by no test',
    )
    fs.writeFileSync(
      path.join(site, 'tests/labs/falling.test.ts'),
      "it('falls 6 dB an octave (claim six-db)', () => {})",
    )
    expect(checkClaims(site)).toEqual({ problems: [], count: 1, lessons: 1 })
    fs.rmSync(site, { recursive: true })
  })
})
