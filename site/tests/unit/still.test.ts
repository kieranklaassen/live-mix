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

describe('a still’s axis titles', () => {
  /** The pixels a style gives a side, such as `top:21px`. */
  const side = (style: string, name: string) =>
    Number(new RegExp(`(?:^|;)${name}:(-?[\\d.]+)px`).exec(style)?.[1] ?? Number.NaN)
  /** A span of the still's HTML by its text, as its style. */
  const styleOf = (html: string, text: string) =>
    new RegExp(`<span style="([^"]*)">${text}</span>`).exec(html)?.[1] ?? ''

  it('stand outside the plotted area: the y title over its top, the x title in the row of numbers', async () => {
    const picture = await lessonStill(COMPRESSION, { taps: 'in out', view: 'spectrum' })
    const html = plotHtml(picture)
    const plot = /<svg [^>]*style="([^"]*)"/.exec(html)![1]!
    const plotTop = side(plot, 'top')
    // The y title's row ends above the plotted area: 10 px of type from its top.
    const y = styleOf(html, 'decibels')
    expect(side(y, 'left')).toBe(44)
    expect(side(y, 'top') + 10).toBeLessThanOrEqual(plotTop)
    // The x title stands at the height of the numbers under the picture, at its right end.
    const x = styleOf(html, 'hertz')
    const number = styleOf(html, '100')
    expect(side(x, 'bottom')).toBe(side(number, 'bottom'))
    expect(side(x, 'right')).toBe(10)
    // The plotted area stops 22 px above the still's foot, as it did, and starts under the title.
    expect(plot).toContain(`height:calc(100% - ${plotTop + 22}px)`)
  })

  it('leave the plotted area where it was for a picture with no y title', async () => {
    const html = plotHtml(await lessonStill(COMPRESSION, { taps: 'in out' }))
    expect(side(/<svg [^>]*style="([^"]*)"/.exec(html)![1]!, 'top')).toBe(8)
  })

  it('hide a number of the x axis at the widths where it would run into the title', async () => {
    const picture = await lessonStill(COMPRESSION, { taps: 'in out', view: 'spectrum' })
    const html = plotHtml(picture)
    /** Whether a number shows in a still `wide` px wide: its width is 0 where it must not. */
    const shows = (text: string, wide: number) => {
      const rule =
        /max-width:clamp\(0px, calc\(\(\(100% - 54px\) \* ([\d.]+) - ([\d.]+)px\) \* 1000\), 99px\)/.exec(
          styleOf(html, text),
        )
      expect(rule, text).not.toBeNull()
      expect(styleOf(html, text)).toContain('overflow:hidden')
      return (wide - 54) * Number(rule![1]) - Number(rule![2]) > 0
    }
    /** The same, worked out from where things stand: 6 px a character, 6 px of room. */
    const clear = (text: string, wide: number) => {
      const at = picture.x.ticks.find((tick) => tick.text === text)!.at
      const numberEnd = 44 + at * (wide - 54) + (text.length * 6) / 2
      const titleStart = wide - 10 - 'hertz'.length * 6
      return numberEnd < titleStart - 6
    }
    for (const wide of [300, 358, 620, 760, 1100]) {
      for (const { text } of picture.x.ticks)
        expect(shows(text, wide), text).toBe(clear(text, wide))
    }
    // The last number stands where the title does at any width; the one before it only on a phone.
    expect(shows('20k', 1100)).toBe(false)
    expect(shows('10k', 358)).toBe(false)
    expect(shows('10k', 760)).toBe(true)
    expect(shows('1k', 300)).toBe(true)
  })

  it('leave the numbers of a picture with no x title as they were', async () => {
    const html = plotHtml(await lessonStill(COMPRESSION, { taps: 'curve', view: 'curve' }))
    expect(html).not.toContain('max-width')
  })
})

describe('a still of a level', () => {
  it('starts its axis where the level does, not a whole step of the grid below', async () => {
    const render = await renderStill({ lab: 'compression', source: 'drums', seconds: 4 })
    const level = render.result.taps.level!.channels_data[0]!
    const lowest = level.reduce((least, value) => Math.min(least, value), Infinity)
    // On the drums the level runs from −63.6 to −16.2 dB: 47 dB, so it is rounded down in fives.
    expect(lowest).toBeGreaterThan(-65)
    expect(lowest).toBeLessThan(-60)
    const picture = await lessonStill(COMPRESSION, { taps: 'level' })
    const [first, last] = [picture.y.ticks.at(0)!, picture.y.ticks.at(-1)!]
    // Its numbers are −60 to 0 in twenties; the axis runs on under the first to −65.
    expect(picture.y.ticks.map((tick) => tick.text)).toEqual(['−60', '−40', '−20', '0'])
    expect(last.at).toBeCloseTo(1, 9)
    expect(first.at).toBeCloseTo(5 / 65, 9)
  })

  it('keeps the bottom it is given', async () => {
    const picture = await lessonStill(COMPRESSION, { taps: 'level', min: -80 })
    expect(picture.y.ticks.at(0)).toEqual({ at: 0, text: '−80' })
  })

  it('leaves a curve on its round axis', async () => {
    // The gain between two readings, 0.82 to 0.87: its axis starts on a number of its grid.
    const picture = await lessonStill(COMPRESSION, { taps: 'gainRamped', view: 'curve' })
    expect(picture.y.ticks.at(0)!.at).toBe(0)
  })
})

describe('a still of a spectrum', () => {
  it('lays its frequencies out evenly when asked, from 0 Hz to its top', async () => {
    const linear = await lessonStill(COMPRESSION, {
      taps: 'in',
      view: 'spectrum',
      scale: 'linear',
      top: 4000,
    })
    expect(linear.x.ticks.map((tick) => tick.text)).toEqual(['0', '1k', '2k', '3k', '4k'])
    expect(linear.x.ticks.map((tick) => tick.at)).toEqual([0, 0.25, 0.5, 0.75, 1])
    expect(linear.x.title).toBe('hertz')
    // With no top it runs to half the sample rate.
    const whole = await lessonStill(COMPRESSION, { taps: 'in', view: 'spectrum', scale: 'linear' })
    expect(whole.x.ticks.at(-1)!.text).toBe('20k')
    expect(whole.x.ticks.at(-1)!.at).toBeCloseTo(20 / 24, 9)
    // Its top may be anything above 0 Hz, where a logarithmic axis must start above 20.
    await expect(
      lessonStill(COMPRESSION, { taps: 'in', view: 'spectrum', scale: 'linear', top: 15 }),
    ).resolves.toBeDefined()
    await expect(
      lessonStill(COMPRESSION, { taps: 'in', view: 'spectrum', scale: 'linear', top: 0 }),
    ).rejects.toThrow("compression: a picture's top is 0 Hz: it must be above 0 Hz")
  })

  it('draws the few points of a short linear stretch as one line through them', async () => {
    // 1 kHz of a spectrum of 11.72 Hz bins holds 86 of them: a line, not a band.
    const short = await lessonStill(COMPRESSION, {
      taps: 'in',
      view: 'spectrum',
      scale: 'linear',
      top: 1000,
    })
    expect(short.lines).not.toMatch(/Z"/)
    expect(short.lines).toContain('fill:none')
    const points = short.lines.match(/[ML]/g)!.length
    expect(points).toBeGreaterThanOrEqual(86)
    expect(points).toBeLessThanOrEqual(89)
  })

  it('draws two taps as two lines, so that neither is hidden under the other’s band', async () => {
    const two = await lessonStill(COMPRESSION, { taps: 'in out', view: 'spectrum' })
    expect(two.lines.match(/<path /g)).toHaveLength(2)
    expect(two.lines).not.toMatch(/Z"/)
    expect(two.lines).not.toContain('fill-opacity')
    expect(two.lines.match(/fill:none/g)).toHaveLength(2)
    // One tap alone keeps its band: there is nothing for it to hide.
    const one = await lessonStill(COMPRESSION, { taps: 'in', view: 'spectrum' })
    expect(one.lines).toMatch(/Z"/)
  })
})

describe('a still of a stretch, with a title and stems', () => {
  it('draws the stretch of a curve asked for, and fits its height to that stretch', async () => {
    // The gain between two readings: 128 points, standing at 0 to 127 samples.
    const whole = await lessonStill(COMPRESSION, { taps: 'gainRamped', view: 'curve' })
    expect(whole.x.ticks.at(0)).toEqual({ at: 0, text: '0' })
    const stretch = await lessonStill(COMPRESSION, {
      taps: 'gainRamped',
      view: 'curve',
      from: 32,
      span: 16,
    })
    // Samples 32 to 48: the fives among them are numbered, 3, 8 and 13 sixteenths of the way.
    expect(stretch.x.ticks.map((tick) => tick.text)).toEqual(['35', '40', '45'])
    expect(stretch.x.ticks.map((tick) => tick.at)).toEqual([3 / 16, 8 / 16, 13 / 16])
    // From a place to the curve's end, when no span is given.
    const rest = await lessonStill(COMPRESSION, { taps: 'gainRamped', view: 'curve', from: 100 })
    expect(rest.x.ticks.at(0)).toEqual({ at: 0, text: '100' })
    expect(rest.x.ticks.at(-1)!.text).toBe('125')
    // Sixteen samples of a ramp cover less height than the whole of it: the axis is closer.
    const height = ({ y }: typeof whole) => {
      const value = (text: string) => Number(text.replace('−', '-'))
      const [a, b] = [y.ticks.at(0)!, y.ticks.at(-1)!]
      return (value(b.text) - value(a.text)) / (b.at - a.at)
    }
    expect(height(stretch)).toBeLessThan(height(whole))
  })

  it('writes the x title it is given, on a curve and against time', async () => {
    const curve = await lessonStill(COMPRESSION, {
      taps: 'gainRamped',
      view: 'curve',
      xTitle: 'samples',
    })
    expect(curve.x.title).toBe('samples')
    expect(plotHtml(curve)).toContain('>samples</span>')
    const untitled = await lessonStill(COMPRESSION, { taps: 'gainRamped', view: 'curve' })
    expect(untitled.x.title).toBe('')
    const wave = await lessonStill(SAMPLE, { taps: 'in', source: 'sine', xTitle: 'seconds in' })
    expect(wave.x.title).toBe('seconds in')
  })

  it('draws a tap as dots on stems, one for each point', async () => {
    const plain = await lessonStill(COMPRESSION, {
      taps: 'gainRamped',
      view: 'curve',
      from: 32,
      span: 16,
    })
    const stemmed = await lessonStill(COMPRESSION, {
      taps: 'gainRamped',
      view: 'curve',
      from: 32,
      span: 16,
      stems: true,
    })
    expect(plain.lines).not.toContain('stroke-linecap:round')
    // Samples 32 to 48, both ends drawn: seventeen stems up from the foot, and seventeen dots.
    const [stems, dots] = stemmed.lines.match(/<path [^>]*>/g)!
    expect(stemmed.lines.match(/<path /g)).toHaveLength(2)
    expect(stems!.match(/M[\d.]+,[\d.]+V[\d.]+/g)).toHaveLength(17)
    expect(dots!.match(/M[\d.]+,[\d.]+h0/g)).toHaveLength(17)
    expect(dots).toContain('stroke-linecap:round')
    expect(stemmed.lines).toContain('var(--sig-out)')
    expect(plotHtml(stemmed)).not.toMatch(HEX)
  })

  it('draws stems for the taps named and lines for the rest', async () => {
    const mixed = await lessonStill(COMPRESSION, {
      taps: 'gainHeld gainRamped',
      view: 'curve',
      from: 32,
      span: 16,
      stems: 'gainHeld',
    })
    // The held gain as stems and dots, the ramped as one line.
    const paths = mixed.lines.match(/<path [^>]*>/g)!
    expect(paths).toHaveLength(3)
    expect(paths.filter((one) => one.includes('stroke-linecap:round'))).toHaveLength(1)
    // The line starts a point before the stretch, so that it runs in from the picture's edge.
    expect(paths.at(-1)).toMatch(/d="M-?[\d.]+,[\d.]+L/)
  })

  it('draws a stretch of sound as stems too, where its samples are few', async () => {
    // 1 ms at 48,000 samples a second, both ends drawn: 49 samples.
    const wave = await lessonStill(SAMPLE, {
      taps: 'in',
      source: 'sine',
      from: 1,
      span: 0.001,
      stems: true,
    })
    expect(wave.lines.match(/M[\d.]+,[\d.]+V[\d.]+/g)).toHaveLength(49)
  })

  it('stops the build on stems for a tap the still does not draw, naming the lesson', async () => {
    await expect(
      lessonStill(COMPRESSION, {
        taps: 'gainHeld gainRamped',
        view: 'curve',
        stems: 'gainHeld curve',
      }),
    ).rejects.toThrow(
      'compression: a still draws stems for "curve", which is not one of its taps. They are: gainHeld, gainRamped',
    )
  })

  it('says what runs across a picture of colour when that is not seconds', async () => {
    const plain = await lessonStill(FRAMES, { taps: 'picture', view: 'spectrogram' })
    expect(plain.x.title).toBe('seconds')
    const named = await lessonStill(FRAMES, {
      taps: 'picture',
      view: 'spectrogram',
      xTitle: 'frames',
    })
    expect(named.x.title).toBe('frames')
    expect(named.note).toMatch(/^Every frame's spectrum: frames across, hertz up, from /)
    expect(named.lines).toBe(plain.lines)
  })
})

describe('a still of a build step', () => {
  it('is drawn at the step its values give: the built taps as they stand there', async () => {
    const step = (build: number) =>
      lessonStill(COMPRESSION, { taps: 'builtLevel', values: { build } })
    // At the first step the build is a wire and measures nothing: its level lies flat. At the
    // second it measures, and the lane moves.
    const flat = (await step(0)).lines.match(/[ML][\d.]+,([\d.]+)/g)!
    expect(new Set(flat.map((point) => point.split(',')[1])).size).toBe(1)
    const measured = (await step(1)).lines.match(/[ML][\d.]+,([\d.]+)/g)!
    expect(new Set(measured.map((point) => point.split(',')[1])).size).toBeGreaterThan(20)
  })

  it('renders the lab at that step: what the wire lets through is the input', async () => {
    const wire = await renderStill({
      lab: 'compression',
      source: 'drums',
      seconds: 4,
      values: { build: 0 },
    })
    const [built, input] = [wire.result.taps.built!, wire.result.taps.in!].map(
      (tap) => tap.channels_data[0]!,
    )
    let apart = 0
    for (let i = 0; i < input!.length; i += 1) {
      apart = Math.max(apart, Math.abs(built![i]! - input![i]!))
    }
    expect(apart).toBeLessThan(1e-6)
    const whole = await lessonStill(COMPRESSION, { taps: 'built', values: { build: 6, ratio: 10 } })
    const start = await lessonStill(COMPRESSION, { taps: 'built', values: { build: 0, ratio: 10 } })
    expect(whole.lines).not.toBe(start.lines)
  })

  it('stops the build on a step for a lab with no build path, naming the lesson', async () => {
    await expect(
      lessonStill(SAMPLE, { taps: 'in', set: 'dry', values: { build: 1 } }, FIXTURES),
    ).rejects.toThrow('sample: a still is drawn at build step 1, and the lab has no build path.')
  })

  it('stops the build on a step the lab does not have, naming the lesson', async () => {
    for (const build of [7, -1, 1.5]) {
      await expect(lessonStill(COMPRESSION, { taps: 'built', values: { build } })).rejects.toThrow(
        `compression: a still is drawn at build step ${build}: the lab's steps are the whole numbers 0 to 6.`,
      )
    }
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
