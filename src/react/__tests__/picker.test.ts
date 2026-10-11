import { describe, expect, it } from 'vitest'

import { PICKER_PHONE_WIDTH, cursorStep, pickerPlace } from '../components/Picker'

const viewport = { width: 1440, height: 900 }

describe('pickerPlace', () => {
  it('stands the panel on the bar, its right edge on the cell’s for a cell at the end of a chain', () => {
    // The Add effect cell: 100 px wide, in the title row of a bar that starts at 760.
    expect(
      pickerPlace({
        anchor: { left: 540, right: 640 },
        edge: 760,
        size: { width: 560, height: 340 },
        viewport,
        align: 'end',
      }),
    ).toEqual({ left: 80, top: 420, width: 560, height: 340 })
  })

  it('lines its left edge up with the Instrument block', () => {
    expect(
      pickerPlace({
        anchor: { left: 500, right: 660 },
        edge: 760,
        size: { width: 640, height: 360 },
        viewport,
        align: 'start',
      }),
    ).toEqual({ left: 500, top: 400, width: 640, height: 360 })
  })

  it('stays inside the window at both sides', () => {
    const size = { width: 560, height: 340 }
    expect(
      pickerPlace({ anchor: { left: 140, right: 240 }, edge: 760, size, viewport, align: 'end' })
        .left,
    ).toBe(0)
    expect(
      pickerPlace({
        anchor: { left: 1300, right: 1400 },
        edge: 760,
        size,
        viewport,
        align: 'start',
      }).left,
    ).toBe(880)
  })

  it('starts at the window’s top where the bar leaves less room than it is tall', () => {
    const size = { width: 560, height: 340 }
    expect(
      pickerPlace({ anchor: { left: 540, right: 640 }, edge: 200, size, viewport, align: 'end' })
        .top,
    ).toBe(0)
  })

  it('is no larger than a small window', () => {
    expect(
      pickerPlace({
        anchor: { left: 0, right: 100 },
        edge: 250,
        size: { width: 560, height: 340 },
        viewport: { width: 400, height: 300 },
        align: 'end',
      }),
    ).toEqual({ left: 0, top: 0, width: 400, height: 300 })
  })

  it('fills a phone\u2019s width, however narrow the panel is, and keeps its own width from there up', () => {
    const narrow = { width: 300, height: 340 }
    // The preset list of an effect is 300 wide: on a phone it does not hang off its cell with a strip of the page beside it.
    expect(
      pickerPlace({
        anchor: { left: 12, right: 120 },
        edge: 500,
        size: narrow,
        viewport: { width: 320, height: 640 },
        align: 'start',
      }),
    ).toEqual({ left: 0, top: 160, width: 320, height: 340 })
    expect(
      pickerPlace({
        anchor: { left: 200, right: 300 },
        edge: 500,
        size: narrow,
        viewport: { width: PICKER_PHONE_WIDTH - 1, height: 640 },
        align: 'end',
      }),
    ).toMatchObject({ left: 0, width: PICKER_PHONE_WIDTH - 1 })
    expect(
      pickerPlace({
        anchor: { left: 100, right: 200 },
        edge: 500,
        size: narrow,
        viewport: { width: PICKER_PHONE_WIDTH, height: 640 },
        align: 'start',
      }),
    ).toMatchObject({ left: 100, width: 300 })
  })
})

describe('cursorStep', () => {
  it('moves one row and stops at both ends', () => {
    expect(cursorStep(0, 1, 3)).toBe(1)
    expect(cursorStep(2, 1, 3)).toBe(2)
    expect(cursorStep(0, -1, 3)).toBe(0)
  })

  it('enters at the near end, and has nowhere to go in an empty list', () => {
    expect(cursorStep(-1, 1, 3)).toBe(0)
    expect(cursorStep(-1, -1, 3)).toBe(2)
    expect(cursorStep(0, 1, 0)).toBe(-1)
  })
})

describe('pickerPlace, below its cell', () => {
  it('hangs the panel from the line, and keeps it whole inside the window', () => {
    const size = { width: 300, height: 340 }
    expect(
      pickerPlace({
        anchor: { left: 400, right: 500 },
        edge: 120,
        size,
        viewport,
        align: 'start',
        side: 'below',
      }),
    ).toEqual({ left: 400, top: 120, width: 300, height: 340 })
    // A cell near the window's foot: the panel ends at the foot and covers part of what it opened from.
    expect(
      pickerPlace({
        anchor: { left: 400, right: 500 },
        edge: 700,
        size,
        viewport,
        align: 'start',
        side: 'below',
      }).top,
    ).toBe(560)
  })
})
