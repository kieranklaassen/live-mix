import { describe, expect, it } from 'vitest'
import {
  AUDIBLE,
  binHz,
  fromUnit,
  hzToX,
  label,
  laneRows,
  leftSaid,
  levelsKey,
  markRefs,
  markValues,
  minMaxColumns,
  minMaxPlaced,
  namePlaces,
  roomyAxis,
  soundPeaks,
  tickLabels,
  ticks,
  tidyFloor,
  toUnit,
  wholePixel,
  withUnit,
} from '../../src/figures/draw.ts'

describe('a wave in pixel columns', () => {
  it('gives each column the least and the most of its samples', () => {
    const data = new Float32Array(192_000)
    let seed = 7
    for (let i = 0; i < data.length; i += 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      data[i] = seed / 2147483648 - 1
    }
    const columns = 600
    const ends = minMaxColumns(data, 0, data.length, columns)
    expect(ends.length).toBe(columns * 2)
    for (const column of [0, 1, 299, 598, 599]) {
      const a = Math.floor((column * data.length) / columns)
      const b = Math.floor(((column + 1) * data.length) / columns)
      let lo = Infinity
      let hi = -Infinity
      for (let i = a; i < b; i += 1) {
        lo = Math.min(lo, data[i]!)
        hi = Math.max(hi, data[i]!)
      }
      expect(ends[2 * column]).toBe(lo)
      expect(ends[2 * column + 1]).toBe(hi)
    }
  })

  it('draws an empty tap as a flat line and does not throw', () => {
    const ends = minMaxColumns(new Float32Array(0), 0, 0, 40)
    expect(Array.from(ends).every((value) => value === 0)).toBe(true)
  })

  it('keeps a stretch of the signal to that stretch', () => {
    const data = Float32Array.from({ length: 100 }, (_, i) => i)
    const ends = minMaxColumns(data, 20, 30, 5)
    expect(Array.from(ends)).toEqual([20, 21, 22, 23, 24, 25, 26, 27, 28, 29])
  })

  it('places points that do not stand evenly, and leaves the empty columns empty', () => {
    const ends = minMaxPlaced([1, 5, 3], (i) => [0.05, 0.06, 0.95][i]!, 10)
    expect(ends[0]).toBe(1)
    expect(ends[1]).toBe(5)
    expect(ends[18]).toBe(3)
    expect(Number.isNaN(ends[4])).toBe(true)
  })
})

describe('the frequency axis', () => {
  it('puts 1 kHz at the same place whatever the size of the transform', () => {
    const width = 700
    const places = [1024, 4096, 16384].map((size) => {
      const bins = size / 2 + 1
      const bin = (1000 * size) / 48_000
      return hzToX(binHz(bin, bins, 48_000), width)
    })
    expect(places[1]).toBeCloseTo(places[0]!, 9)
    expect(places[2]).toBeCloseTo(places[0]!, 9)
    // On the audible band's logarithmic axis 1 kHz stands 56.6 % of the way across.
    expect(places[0]! / width).toBeCloseTo(Math.log(50) / Math.log(1000), 9)
  })

  it('goes there and back on a linear and on a logarithmic axis', () => {
    for (const axis of [{ min: -60, max: 0 }, AUDIBLE]) {
      for (const unit of [0, 0.25, 0.5, 1]) {
        expect(toUnit(axis, fromUnit(axis, unit))).toBeCloseTo(unit, 9)
      }
    }
  })
})

describe('the grid', () => {
  it('finds round values on a linear axis', () => {
    expect(ticks({ min: -60, max: 0 }, 6)).toEqual([-60, -50, -40, -30, -20, -10, 0])
    expect(ticks({ min: -1, max: 1 }, 4)).toEqual([-1, -0.5, 0, 0.5, 1])
  })

  it('steps 1, 2, 5 through each decade of a logarithmic axis', () => {
    expect(ticks(AUDIBLE)).toEqual([20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000])
  })

  it('has no grid for an axis with no real span, and does not go round for ever on one', () => {
    expect(ticks({ min: 0, max: 1, log: true })).toEqual([])
    expect(ticks({ min: -5, max: 100, log: true })).toEqual([])
    expect(ticks({ min: Infinity, max: -Infinity })).toEqual([])
    expect(ticks({ min: Number.NaN, max: 1 })).toEqual([])
  })

  it('prints numbers short, with a real minus sign', () => {
    expect(label(1500)).toBe('1.5k')
    expect(label(20000)).toBe('20k')
    expect(label(-12)).toBe('−12')
    expect(label(0.25)).toBe('0.25')
    expect(label(0)).toBe('0')
    expect(withUnit(4, ':1')).toBe('4:1')
    expect(withUnit(-24, 'dB')).toBe('−24 dB')
    expect(withUnit(0.5, '')).toBe('0.5')
  })

  it('fits an axis with round ends around what it must hold', () => {
    expect(roomyAxis(-37, -2)).toEqual({ min: -40, max: 0 })
    const flat = roomyAxis(3, 3)
    expect(flat.min).toBeLessThan(3)
    expect(flat.max).toBeGreaterThan(3)
  })
})

describe('the numbers of a range', () => {
  it('gives a range about nothing three numbers or more, where one step would leave only 0', () => {
    // 96 across in four steps of 50 has room for one of them, 0: the steps are taken finer.
    expect(ticks({ min: -48, max: 48 }, 4)).toEqual([-40, -20, 0, 20, 40])
    expect(ticks({ min: -60, max: 60 }, 2)).toEqual([-50, 0, 50])
  })

  it('gives any range at least three numbers, each inside it', () => {
    const ranges = [
      [-48, 48],
      [-60, 60],
      [-7, 113],
      [0.3, 0.72],
      [990, 1010],
      [-0.004, 0.019],
      [3, 4],
    ] as const
    for (const [min, max] of ranges) {
      for (const count of [2, 3, 4, 6]) {
        const found = ticks({ min, max }, count)
        expect(found.length, `${min} to ${max} in ${count}`).toBeGreaterThanOrEqual(3)
        const room = (max - min) * 1e-6
        for (const value of found) {
          expect(value).toBeGreaterThanOrEqual(min - room)
          expect(value).toBeLessThanOrEqual(max + room)
        }
      }
    }
  })

  it('numbers a logarithmic axis too short for three of its 1, 2 and 5', () => {
    // 300 to 450 Hz holds none of 1, 2 and 5 times a power of ten.
    const found = ticks({ min: 300, max: 450, log: true }, 4)
    expect(found).toEqual([300, 350, 400, 450])
    // An octave holds two of them, and gets more.
    expect(ticks({ min: 100, max: 200, log: true }, 4).length).toBeGreaterThanOrEqual(3)
  })

  it('leaves a range that already has three as it was', () => {
    expect(ticks({ min: 0, max: 4 }, 2)).toEqual([0, 2, 4])
    expect(ticks({ min: -24, max: 0 }, 4)).toEqual([-20, -10, 0])
  })

  it('writes numbers that stand close together so that each reads differently', () => {
    // A millisecond a second into a loop: four figures write 1.0002 and 1.0004 both as "1".
    expect(tickLabels([1.0002, 1.0004, 1.0006, 1.0008])).toEqual([
      '1.0002',
      '1.0004',
      '1.0006',
      '1.0008',
    ])
    expect(tickLabels([10200, 10250, 10300])).toEqual(['10.2k', '10.25k', '10.3k'])
    const close = ticks({ min: 0.3, max: 0.3005 }, 4)
    expect(new Set(tickLabels(close)).size).toBe(close.length)
  })

  it('writes the numbers of any other range as it always has', () => {
    for (const values of [
      [-20, -10, 0],
      [0, 0.25, 0.5],
      [20, 50, 100, 1000, 20000],
      [3, 3.02, 3.04],
    ]) {
      expect(tickLabels(values)).toEqual(values.map((value) => label(value)))
    }
  })
})

describe('the bottom of a level axis', () => {
  it('is the lowest value drawn, rounded down to a round number near it', () => {
    // A level that rests on −120 dB and reaches −3: the axis starts there, not at −200.
    expect(tidyFloor(-120, -3)).toBe(-120)
    expect(tidyFloor(-97.3, -3)).toBe(-100)
    expect(tidyFloor(-37, -2)).toBe(-40)
    expect(tidyFloor(-8.2, 0)).toBe(-9)
  })

  it('is never below the floor it is given, for a value that is not below it', () => {
    // 205 dB across rounds down in fifties, to −150: the lab writes nothing under −140.
    expect(tidyFloor(-135, 70)).toBe(-150)
    expect(tidyFloor(-135, 70, -140)).toBe(-140)
    expect(tidyFloor(-140, -3, -140)).toBe(-140)
    // A value under the floor is not one the floor speaks for.
    expect(tidyFloor(-155, 50, -140)).toBe(-200)
  })

  it('is the value itself where there is no span to round by', () => {
    expect(tidyFloor(-12, -12)).toBe(-12)
  })
})

describe('the names of upright lines', () => {
  it('stand beside their lines, on the side with more room', () => {
    expect(namePlaces([{ at: 100, wide: 60 }], 600)).toEqual([{ left: 105, row: 0 }])
    expect(namePlaces([{ at: 500, wide: 60 }], 600)).toEqual([{ left: 435, row: 0 }])
  })

  it('go to a second row where one would run into another', () => {
    // Two lines 30 px apart, each name 60 px wide and to the right of its line.
    expect(
      namePlaces(
        [
          { at: 100, wide: 60 },
          { at: 130, wide: 60 },
        ],
        600,
      ),
    ).toEqual([
      { left: 105, row: 0 },
      { left: 135, row: 1 },
    ])
    // One from each half, reaching towards each other across the middle.
    expect(
      namePlaces(
        [
          { at: 280, wide: 60 },
          { at: 330, wide: 60 },
        ],
        600,
      ),
    ).toEqual([
      { left: 285, row: 0 },
      { left: 265, row: 1 },
    ])
  })

  it('share a row where they are clear of each other, and take a third where two are full', () => {
    const places = namePlaces(
      [
        { at: 100, wide: 60 },
        { at: 120, wide: 60 },
        { at: 140, wide: 60 },
        { at: 300, wide: 60 },
      ],
      800,
    )
    expect(places.map((place) => place.row)).toEqual([0, 1, 2, 0])
  })
})

describe('the scale of a sound among lanes', () => {
  const sounds = [
    { id: 'in', peak: 0.02 },
    { id: 'ring', peak: 0.9 },
    { id: 'out', peak: 0.05 },
  ]

  it('is the loudest of them all for every sound', () => {
    expect(soundPeaks(sounds)).toEqual({ in: 0.9, ring: 0.9, out: 0.9 })
  })

  it('is its own peak for a sound named, and the loudest of the others for the rest', () => {
    expect(soundPeaks(sounds, ['ring'])).toEqual({ in: 0.05, ring: 0.9, out: 0.05 })
    expect(soundPeaks(sounds, ['in', 'out'])).toEqual({ in: 0.02, ring: 0.9, out: 0.05 })
  })

  it('is never nothing, so that silence is a flat line and not a division by zero', () => {
    const quiet = soundPeaks([{ id: 'in', peak: 0 }], ['in'])
    expect(quiet.in).toBeGreaterThan(0)
  })
})

describe('the lines a figure draws across itself', () => {
  const controls = [
    { id: 'threshold', name: 'Threshold' },
    { id: 'level', name: 'A control called level' },
  ]
  const taps = [
    { id: 'level', name: 'Level' },
    { id: 'ceiling', name: 'Ceiling' },
  ]

  it('takes a control by its id, as before, and names the line after it', () => {
    expect(markRefs('threshold', controls, taps)).toEqual([['threshold', 'Threshold']])
    expect(markRefs(undefined, controls, taps)).toEqual([])
    expect(markRefs('', controls, taps)).toEqual([])
  })

  it('takes a fixed number with a name, whose underscores are spaces', () => {
    expect(markRefs('0.5:Half', controls, taps)).toEqual([[0.5, 'Half']])
    expect(markRefs('-6:Six_under, 24000:Half_the_rate', controls, taps)).toEqual([
      [-6, 'Six under'],
      [24000, 'Half the rate'],
    ])
  })

  it('takes a tap by its id, where no control has that id', () => {
    expect(markRefs('threshold 0.5:Half ceiling level', controls, taps)).toEqual([
      ['threshold', 'Threshold'],
      [0.5, 'Half'],
      ['ceiling', 'Ceiling', 'tap'],
      ['level', 'A control called level'],
    ])
  })

  it('stops the build on a name that is none of the three, with the names there are', () => {
    expect(() => markRefs('treshold', controls, taps, 'compression')).toThrow(
      /compression: .*"treshold".*threshold, level.*level, ceiling/,
    )
    expect(() => markRefs('half:Half', controls, taps, 'compression')).toThrow(/"half:Half"/)
    expect(() => markRefs('0.5:', controls, taps, 'compression')).toThrow(/"0.5:"/)
  })

  it("stands each line at its value: a control's now, the number as written, a tap's first point", () => {
    const refs = markRefs('threshold 0.5:Half ceiling', controls, taps)
    const tap = (id: string) => (id === 'ceiling' ? -1 : undefined)
    expect(markValues(refs, { threshold: -24 }, tap)).toEqual([
      { value: -24, text: 'Threshold' },
      { value: 0.5, text: 'Half' },
      { value: -1, text: 'Ceiling' },
    ])
    // A control the page has no value for yet, and a tap that has not been rendered, draw nothing.
    expect(markValues(refs, {}, () => undefined)).toEqual([{ value: 0.5, text: 'Half' }])
  })
})

describe('what a picture says of the side it draws', () => {
  const input = { name: 'Input' }
  const output = { name: 'Output' }
  const level = { name: 'Level' }

  it('says nothing where no sound drawn has two channels', () => {
    expect(leftSaid([input, level], [])).toBeUndefined()
  })

  it('says the left channel of the one sound, of each, or of those that have two', () => {
    expect(leftSaid([input], [input])).toBe('the left channel')
    expect(leftSaid([input, output], [input, output])).toBe('the left channel of each')
    expect(leftSaid([input, level, output], [input, output])).toBe(
      'the left channel of Input and Output',
    )
  })
})

describe('the key of a picture of levels', () => {
  it('names the two ends of its ramp by what they stand for, and names no colour', () => {
    const key = levelsKey('Output', 'seconds', -90, 0)
    expect(key).toBe(
      'Output: seconds across, hertz up, from −90 dB, the quietest shown, to 0 dB, the loudest shown',
    )
    expect(key).not.toMatch(/colour/)
    expect(levelsKey('Output', 'frames', -64, -40)).toMatch(/^Output: frames across, hertz up, /)
  })
})

describe('a stem one pixel wide', () => {
  it('stands on a whole pixel: its middle is half a pixel in, wherever its point falls', () => {
    expect(wholePixel(10)).toBe(10.5)
    expect(wholePixel(10.49)).toBe(10.5)
    expect(wholePixel(10.99)).toBe(10.5)
    expect(wholePixel(11)).toBe(11.5)
    expect(wholePixel(0.2)).toBe(0.5)
  })

  it('moves a point by less than a pixel', () => {
    for (let at = 0; at < 4; at += 0.07) {
      expect(Math.abs(wholePixel(at) - at)).toBeLessThanOrEqual(0.5)
    }
  })
})

describe('the lanes of taps', () => {
  const input = { id: 'in', name: 'Input', kind: 'audio', channels: 2 }
  const level = { id: 'level', name: 'Level', kind: 'control', channels: 1 }
  const pluck = { id: 'pluck', name: 'The pluck', kind: 'audio', channels: 1 }

  it('are one a tap, and a sound of two channels says that its lane is its left', () => {
    expect(laneRows([input, level, pluck])).toEqual([
      { tap: input, channel: 0, key: 'in', name: 'Input', side: 'left channel' },
      { tap: level, channel: 0, key: 'level', name: 'Level' },
      { tap: pluck, channel: 0, key: 'pluck', name: 'The pluck' },
    ])
    expect(laneRows([input], 'left')).toEqual(laneRows([input]))
  })

  it('are one a channel of a sound that has two, when both are asked for', () => {
    expect(laneRows([input, level, pluck], 'both')).toEqual([
      { tap: input, channel: 0, key: 'in left', name: 'Input, left' },
      { tap: input, channel: 1, key: 'in right', name: 'Input, right' },
      { tap: level, channel: 0, key: 'level', name: 'Level' },
      { tap: pluck, channel: 0, key: 'pluck', name: 'The pluck' },
    ])
  })
})
