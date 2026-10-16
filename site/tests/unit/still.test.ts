// Stills (src/lib/still.ts): a lab rendered in Node on a bench source, and the picture drawn
// from it. These load the labs `pnpm labs` built, as the build of a page does.

import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { lab, silence as nothing } from '../labs/support.ts'
import {
  benchSource,
  lessonOpening,
  lessonStill,
  lessonTile,
  plotHtml,
  renderStill,
  type Numbers,
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

describe('a still’s ranges', () => {
  /** The two ends of an axis of even steps, worked back from where its numbers stand. */
  const ends = ({ ticks }: Numbers) => {
    const value = (text: string) => Number(text.replace('−', '-').replace('k', 'e3'))
    const [first, last] = [ticks.at(0)!, ticks.at(-1)!]
    const span = (value(last.text) - value(first.text)) / (last.at - first.at)
    const min = value(first.text) - first.at * span
    return [min, min + span].map((end) => Math.round(end * 1e6) / 1e6)
  }

  it('stands a wave on the vertical range it is given, and fits the end it is not', async () => {
    const fitted = await lessonStill(SAMPLE, { taps: 'in', source: 'sine' })
    const ranged = await lessonStill(SAMPLE, { taps: 'in', source: 'sine', min: -2, max: 2 })
    expect(ends(ranged.y)).toEqual([-2, 2])
    expect(ranged.lines).not.toBe(fitted.lines)
    expect(ranged.x).toEqual(fitted.x)
    // Only the top is given: the bottom is the one the still chose by itself.
    const topped = await lessonStill(SAMPLE, { taps: 'in', source: 'sine', max: 8 })
    expect(ends(topped.y)).toEqual([ends(fitted.y)[0], 8])
  })

  it('gives two stills that are given one range the same numbers', async () => {
    const range = { taps: 'in', view: 'spectrum', min: -80, max: 0, top: 5000 } as const
    const drums = await lessonStill(SAMPLE, { ...range, source: 'drums' })
    const sine = await lessonStill(SAMPLE, { ...range, source: 'sine' })
    expect(drums.y).toEqual(sine.y)
    expect(drums.x).toEqual(sine.x)
    expect(drums.lines).not.toBe(sine.lines)
  })

  it('draws a spectrum up to the frequency given, on the levels given', async () => {
    const spectrum = await lessonStill(COMPRESSION, {
      taps: 'in out',
      view: 'spectrum',
      min: -80,
      max: 0,
      top: 5000,
    })
    expect(spectrum.x.ticks.map((tick) => tick.text)).toEqual(
      '20 50 100 200 500 1k 2k 5k'.split(' '),
    )
    expect(spectrum.x.ticks.at(-1)!.at).toBeCloseTo(1, 9)
    expect(ends(spectrum.y)).toEqual([-80, 0])
  })

  it('stands a curve on the range given, in the curve’s own unit', async () => {
    const curve = await lessonStill(COMPRESSION, {
      taps: 'curve curveFormula',
      view: 'curve',
      min: -100,
      max: 20,
    })
    expect(ends(curve.y)).toEqual([-100, 20])
  })

  it('draws a picture of colour up to the frequency given, between the levels given', async () => {
    const colour = await lessonStill(FRAMES, {
      taps: 'picture',
      view: 'spectrogram',
      min: -70,
      max: -10,
      top: 4000,
    })
    expect(ends(colour.y)).toEqual([0, 4000])
    expect(colour.note).toMatch(/from −70 dB .* to −10 dB$/)
    const fitted = await lessonStill(FRAMES, { taps: 'picture', view: 'spectrogram' })
    expect(colour.lines).not.toBe(fitted.lines)
  })

  it('stops the build on a range whose min is not below its max, naming the lesson', async () => {
    await expect(lessonStill(COMPRESSION, { taps: 'in', min: 1, max: -1 })).rejects.toThrow(
      "compression: a picture's range runs from 1 to -1: its min must be below its max.",
    )
    await expect(
      lessonStill(COMPRESSION, { taps: 'in', view: 'spectrum', min: -60, max: -60 }),
    ).rejects.toThrow("compression: a picture's range runs from -60 to -60")
    await expect(
      lessonStill(FRAMES, { taps: 'picture', view: 'spectrogram', min: 0, max: -60 }),
    ).rejects.toThrow("short-time-fourier: a picture's range runs from 0 to -60")
    // One end given, on the wrong side of the end the still fits by itself.
    await expect(lessonStill(COMPRESSION, { taps: 'in', min: 50 })).rejects.toThrow(
      /^compression: a picture's range runs from 50 to /,
    )
  })

  it('stops the build on a top that is not a frequency the picture can reach, naming the lesson', async () => {
    for (const top of [0, -100, 24_001]) {
      await expect(
        lessonStill(FRAMES, { taps: 'picture', view: 'spectrogram', top }),
      ).rejects.toThrow(
        `short-time-fourier: a picture's top is ${top} Hz: it must be above 0 Hz and at most 24000 Hz, half the sample rate.`,
      )
    }
    await expect(
      lessonStill(COMPRESSION, { taps: 'in', view: 'spectrum', top: 30_000 }),
    ).rejects.toThrow("compression: a picture's top is 30000 Hz")
    // A spectrum starts at 20 Hz, so its top is above that.
    await expect(
      lessonStill(COMPRESSION, { taps: 'in', view: 'spectrum', top: 20 }),
    ).rejects.toThrow("compression: a picture's top is 20 Hz: it must be above 20 Hz")
    await expect(
      lessonStill(FRAMES, { taps: 'picture', view: 'spectrogram', top: 24_000 }),
    ).resolves.toBeDefined()
  })
})

describe('a still of a curve', () => {
  it('draws every curve of a tap that holds several, under one line of the key', async () => {
    const render = await renderStill({ lab: 'short-time-fourier', source: 'guitar', seconds: 4 })
    const { columns, length } = render.result.taps.windows!
    expect(columns).toBeGreaterThan(1)
    const picture = await lessonStill(FRAMES, { taps: 'windows', view: 'curve' })
    expect(picture.lines.match(/<path /g)).toHaveLength(columns)
    // Each is a line of its own points, and none is a band of them all run together.
    expect(picture.lines.match(/[ML]/g)).toHaveLength(length)
    expect(picture.lines).not.toMatch(/Z"/)
    expect(picture.key).toEqual([
      { id: 'windows', name: "Each frame's two windows", role: 'out', dashed: false },
    ])
  })
})

describe('the picture a lesson opens on', () => {
  it('is one still of the two taps on one time axis, when it is given nothing more', async () => {
    const opening = await lessonOpening(COMPRESSION, { input: 'in', output: 'out' })
    expect(opening).toHaveLength(1)
    expect(opening[0]).toEqual(await lessonStill(COMPRESSION, { taps: 'in:in out:out' }))
    expect(opening[0]!.label).toBe('Input and Output against time')
  })

  it('takes a view, a span of time and its ranges, as a still does', async () => {
    const [spectrum, ...more] = await lessonOpening(COMPRESSION, {
      input: 'in',
      output: 'out',
      view: 'spectrum',
      min: -80,
      max: 0,
      top: 5000,
    })
    expect(more).toEqual([])
    expect(spectrum!.label).toBe('The spectrum of Input and Output')
    expect(spectrum!.x.ticks.at(-1)!.text).toBe('5k')
    expect(spectrum!.y.ticks.map((tick) => tick.text)).toEqual(['−80', '−60', '−40', '−20', '0'])
    const [short] = await lessonOpening(COMPRESSION, {
      input: 'in',
      output: 'out',
      from: 1,
      span: 2,
    })
    expect(short!.x.ticks.map((tick) => tick.text)).toEqual(['1', '1.5', '2', '2.5', '3'])
  })

  it('draws the two taps apart, each fitted by itself, when it is asked to', async () => {
    const opening = await lessonOpening(COMPRESSION, {
      input: 'in',
      output: 'out',
      separate: true,
    })
    expect(opening.map((picture) => picture.label)).toEqual([
      'Input against time',
      'Output against time',
    ])
    expect(opening.map((picture) => picture.key)).toEqual([
      [{ id: 'in', name: 'Input', role: 'in', dashed: undefined }],
      [{ id: 'out', name: 'Output', role: 'out', dashed: undefined }],
    ])
    expect(opening[1]).toEqual(await lessonStill(COMPRESSION, { taps: 'out:out' }))
  })

  it('draws a picture of colour for each tap, since one holds one tap', async () => {
    const opening = await lessonOpening(FRAMES, {
      input: 'picture',
      output: 'pictureOut',
      view: 'spectrogram',
    })
    expect(opening).toHaveLength(2)
    expect(opening[0]!.note).toMatch(/^Every frame's spectrum: /)
    expect(opening[1]!.note).toMatch(/^Every frame's spectrum, of the output: /)
  })

  it('stops the build on a tap the lab does not have, naming the lesson', async () => {
    await expect(lessonOpening(COMPRESSION, { input: 'in', output: 'outt' })).rejects.toThrow(
      'compression: the lab has no tap called "outt".',
    )
  })
})

describe('a lesson’s tile', () => {
  it('draws its picture on the range its entry gives', async () => {
    const heights = (picture: string) =>
      [...picture.matchAll(/[ML][\d.]+,(\d+)/g)].map((found) => Number(found[1]))
    // The picture is 200 high. Sound lies within −1 to 1, so on −4 to 4 it keeps to the middle
    // quarter; the same sound fitted closely reaches near the picture's top and bottom.
    const ranged = heights((await lessonTile({ ...SAMPLE, id: 'ranged' }, FIXTURES)).picture)
    expect(ranged.length).toBeGreaterThan(100)
    expect(Math.min(...ranged)).toBeGreaterThanOrEqual(75)
    expect(Math.max(...ranged)).toBeLessThanOrEqual(125)
    const fitted = heights((await lessonTile(SAMPLE, FIXTURES)).picture)
    expect(Math.min(...fitted)).toBeLessThan(20)
    expect(Math.max(...fitted)).toBeGreaterThan(180)
  })

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
