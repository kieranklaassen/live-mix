// Stills (src/lib/still.ts): a lab rendered in Node on a bench source, and the picture drawn
// from it. These load the labs `pnpm labs` built, as the build of a page does.

import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { lab, silence as nothing } from '../labs/support.ts'
import {
  benchSource,
  lessonStill,
  lessonTile,
  plotHtml,
  renderStill,
  type StillLesson,
} from '../../src/lib/still.ts'

const FIXTURES = fileURLToPath(new URL('./fixtures/settings', import.meta.url))

/** A lesson whose settings file is the fixture: its lab hands the source on as the tap `in`. */
const SAMPLE: StillLesson = {
  id: 'sample',
  data: { lab: 'through', sources: ['drums', 'sine'], seconds: 4 },
}
/** Lessons with no settings file among the fixtures. */
const COMPRESSION: StillLesson = {
  id: 'compression',
  data: { lab: 'compression', sources: ['drums', 'guitar'], seconds: 4 },
}
const FRAMES: StillLesson = {
  id: 'short-time-fourier',
  data: { lab: 'short-time-fourier', sources: ['guitar'], seconds: 4 },
}
const STRING: StillLesson = {
  id: 'plucked-string',
  data: { lab: 'plucked-string', sources: ['none'], seconds: 4 },
}

const HEX = /#[0-9a-f]{3,8}\b/i

describe('a bench source in Node', () => {
  it('is the bench’s own tap of that name, at the length asked', async () => {
    const drums = await benchSource('drums', 4800)
    const bench = (await lab('bench')).render(nothing(4800), {}, 4800)
    expect(drums.left).toEqual(bench.taps.drums!.channels_data[0])
    expect(drums.right).toEqual(bench.taps.drums!.channels_data[1])
  })

  it('fails on a source the bench does not play', async () => {
    await expect(benchSource('nope', 4800)).rejects.toThrow('The bench plays no source called nope')
  })
})

describe('a render for a still', () => {
  it('is kept: the same lab, values and source are rendered once', async () => {
    const ask = { lab: 'compression', source: 'drums', seconds: 4, values: { ratio: 8 } }
    const first = renderStill(ask)
    expect(renderStill({ ...ask, values: { ratio: 8 } })).toBe(first)
    expect(renderStill({ ...ask, values: { ratio: 2 } })).not.toBe(first)
    expect(renderStill({ ...ask, source: 'guitar' })).not.toBe(first)
  })

  it('carries the values asked for: a harder ratio leaves a quieter output', async () => {
    const level = async (ratio: number) => {
      const ask = { lab: 'compression', source: 'drums', seconds: 4, values: { ratio } }
      const out = (await renderStill(ask)).result.taps.out!.channels_data[0]!
      return Math.sqrt(out.reduce((sum, v) => sum + v * v, 0) / out.length)
    }
    expect(await level(20)).toBeLessThan(0.9 * (await level(1)))
  })
})

describe('a lesson’s still', () => {
  it('draws each tap in its role’s colour, with no colour written out', async () => {
    const picture = await lessonStill(COMPRESSION, { taps: 'in out' })
    expect(picture.key).toEqual([
      { id: 'in', name: 'Input', role: 'in', dashed: undefined },
      { id: 'out', name: 'Output', role: 'out', dashed: undefined },
    ])
    expect(picture.lines).toContain('var(--sig-in)')
    expect(picture.lines).toContain('var(--sig-out)')
    expect(picture.label).toBe('Input and Output against time')
    const html = plotHtml(picture)
    expect(html).toMatch(/^<div class="still-plot"/)
    expect(html).toContain('<svg ')
    expect(html).not.toMatch(HEX)
  })

  it('draws the span of time asked for, and numbers it', async () => {
    // 5 ms of a loop at 48,000 samples a second, both ends drawn: 241 points, one line.
    const short = await lessonStill(SAMPLE, { taps: 'in', source: 'sine', from: 1, span: 0.005 })
    expect(short.lines.match(/[ML]/g)).toHaveLength(241)
    expect(short.lines).toContain('fill:none')
    // Two seconds are 96,001 points: more than the picture has columns, so a band, closed.
    const long = await lessonStill(SAMPLE, { taps: 'in', source: 'sine', from: 1, span: 2 })
    expect(long.lines).toMatch(/Z"/)
    expect(long.x.ticks.map((tick) => tick.text)).toEqual(['1', '1.5', '2', '2.5', '3'])
    expect(long.x.ticks.map((tick) => tick.at)).toEqual([0, 0.25, 0.5, 0.75, 1])
    expect(long.x.title).toBe('seconds')
  })

  it('is drawn at a named set: on the set’s source, at the set’s values', async () => {
    const start = await lessonStill(SAMPLE, { taps: 'in' }, FIXTURES)
    const dry = await lessonStill(SAMPLE, { taps: 'in', set: 'dry' }, FIXTURES)
    const sine = await lessonStill(SAMPLE, { taps: 'in', source: 'sine' }, FIXTURES)
    expect(dry.lines).toBe(sine.lines)
    expect(dry.lines).not.toBe(start.lines)
  })

  it('stops the build on a tap the lab does not have, naming the lesson', async () => {
    await expect(lessonStill(SAMPLE, { taps: 'in out' }, FIXTURES)).rejects.toThrow(
      'sample: the lab has no tap called "out". It has: in',
    )
  })

  it('stops the build on a set the lesson does not have, naming the lesson', async () => {
    await expect(lessonStill(SAMPLE, { taps: 'in', set: 'wet' }, FIXTURES)).rejects.toThrow(
      'sample: there is no set called "wet". Its settings file has: dry',
    )
    await expect(lessonStill(COMPRESSION, { taps: 'in', set: 'wet' }, FIXTURES)).rejects.toThrow(
      'compression: there is no set called "wet". The lesson has no settings file',
    )
  })

  it('stops the build on a control the lab does not have and a source the lesson does not list', async () => {
    await expect(lessonStill(COMPRESSION, { taps: 'in', values: { ratoi: 8 } })).rejects.toThrow(
      'compression: the control "ratoi", named in the set "a still", is not one the lab has.',
    )
    await expect(lessonStill(COMPRESSION, { taps: 'in', source: 'pad' })).rejects.toThrow(
      'compression: the source "pad", named in the set "a still", is not one the lesson lists.',
    )
  })

  it('draws a spectrum, a curve and a picture of colour', async () => {
    const spectrum = await lessonStill(COMPRESSION, { taps: 'in out', view: 'spectrum' })
    expect(spectrum.label).toBe('The spectrum of Input and Output')
    expect(spectrum.x.ticks.map((tick) => tick.text)).toEqual(
      '20 50 100 200 500 1k 2k 5k 10k 20k'.split(' '),
    )
    expect(spectrum.y.title).toBe('decibels')

    const curve = await lessonStill(COMPRESSION, { taps: 'curve curveFormula', view: 'curve' })
    expect(curve.key.map((line) => line.dashed)).toEqual([false, true])
    expect(curve.lines).toContain('stroke-dasharray')

    const colour = await lessonStill(FRAMES, { taps: 'picture', view: 'spectrogram' })
    expect(colour.lines.match(/<mask /g)).toHaveLength(2)
    // A PNG, said in the letters its first eight bytes make.
    expect(colour.lines.match(/href="data:image\/png;base64,iVBORw0KGgo/g)).toHaveLength(2)
    expect(colour.lines).toContain('fill:var(--sig-ctl)')
    expect(colour.lines).toContain('fill:var(--sig-out)')
    expect(colour.note).toMatch(/seconds across, hertz up, from −\d+ dB .* to −\d+ dB$/)
    expect(plotHtml(colour)).not.toMatch(HEX)
  })

  it('stops the build on a spectrogram of a tap that is not a picture, naming the lesson', async () => {
    await expect(lessonStill(FRAMES, { taps: 'in', view: 'spectrogram' })).rejects.toThrow(
      'short-time-fourier: a still draws "in" as a spectrogram',
    )
  })
})

describe('a lesson’s tile', () => {
  it('is the tile entry of its settings file: the tap it plays and the picture it draws', async () => {
    const tile = await lessonTile(SAMPLE, FIXTURES)
    expect(tile).toMatchObject({
      lab: 'through',
      seconds: 4,
      values: {},
      tap: 'in',
      own: false,
      time: { from: 0, span: 2 },
    })
    expect(tile.picture).toMatch(/^<svg viewBox="0 0 200 72" aria-hidden="true">/)
    expect(tile.picture).not.toMatch(HEX)
  })

  it('with no entry plays and draws the lab’s last sound on its main path, at the starting values', async () => {
    // The compression lab's last sound is `built`, a tap of its build path; before it comes `out`.
    const tile = await lessonTile(COMPRESSION, FIXTURES)
    expect(tile).toMatchObject({
      lab: 'compression',
      values: {},
      tap: 'out',
      own: false,
      time: { from: 0, span: 4 },
    })
    expect(tile.picture).toContain('var(--sig-out)')
  })

  it('of a lab that takes no source plays its own notes', async () => {
    expect((await lessonTile(STRING, FIXTURES)).own).toBe(true)
  })
})
