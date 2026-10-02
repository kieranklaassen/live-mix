import { describe, expect, it } from 'vitest'

import { clampPushOctave, pushLayoutBase, pushPadPitch, pushPadPitches } from '../layout'

const MAJOR = [0, 2, 4, 5, 7, 9, 11]
const MINOR_PENTATONIC = [0, 3, 5, 7, 10]

describe('Push note layouts', () => {
  it('puts the scale on the pads in fourths, as Push does in key', () => {
    const c = { layout: 'in-key', root: 0, steps: MAJOR, octave: 3 } as const
    expect(pushLayoutBase(0, 3)).toBe(48)
    // The bottom row is the scale from C3; the next row starts a fourth up, on F.
    expect(Array.from({ length: 8 }, (_, column) => pushPadPitch(c, 0, column)?.note)).toEqual([
      48, 50, 52, 53, 55, 57, 59, 60,
    ])
    expect(pushPadPitch(c, 1, 0)?.note).toBe(53)
    expect(pushPadPitch(c, 2, 0)?.note).toBe(59)
    expect(pushPadPitch(c, 7, 7)?.note).toBe(48 + 12 * 4)
    // A pad and the one a row up and three to the left sound the same note.
    expect(pushPadPitch(c, 1, 0)?.note).toBe(pushPadPitch(c, 0, 3)?.note)
  })

  it('marks the roots', () => {
    const d = { layout: 'in-key', root: 2, steps: MAJOR, octave: 2 } as const
    expect(pushPadPitch(d, 0, 0)).toEqual({ note: 38, role: 'root' })
    expect(pushPadPitch(d, 0, 1)).toEqual({ note: 40, role: 'scale' })
    expect(pushPadPitch(d, 0, 7)).toEqual({ note: 50, role: 'root' })
    const roots = pushPadPitches(d).filter((pad) => pad?.role === 'root')
    expect(roots.every((pad) => pad !== null && pad.note % 12 === 2)).toBe(true)
    expect(pushPadPitches(d).some((pad) => pad?.role === 'outside')).toBe(false)
  })

  it('works for a scale of five notes', () => {
    const a = { layout: 'in-key', root: 9, steps: MINOR_PENTATONIC, octave: 2 } as const
    expect(Array.from({ length: 6 }, (_, column) => pushPadPitch(a, 0, column)?.note)).toEqual([
      45, 48, 50, 52, 55, 57,
    ])
    expect(pushPadPitch(a, 1, 0)?.note).toBe(52)
  })

  it('lays the chromatic layout out in semitones and fourths, and says what is outside the scale', () => {
    const c = { layout: 'chromatic', root: 0, steps: MAJOR, octave: 3 } as const
    expect(pushPadPitch(c, 0, 1)).toEqual({ note: 49, role: 'outside' })
    expect(pushPadPitch(c, 0, 2)).toEqual({ note: 50, role: 'scale' })
    expect(pushPadPitch(c, 1, 0)).toEqual({ note: 53, role: 'scale' })
    expect(pushPadPitch(c, 2, 2)).toEqual({ note: 60, role: 'root' })
  })

  it('leaves out pads past the top of MIDI and past the rows it fills', () => {
    const high = { layout: 'in-key', root: 0, steps: MAJOR, octave: 7 } as const
    expect(pushPadPitch(high, 0, 0)?.note).toBe(96)
    expect(pushPadPitch(high, 7, 7)).toBeNull()
    const half = { layout: 'in-key', root: 0, steps: MAJOR, octave: 3, rows: 4 } as const
    expect(pushPadPitch(half, 3, 0)).not.toBeNull()
    expect(pushPadPitch(half, 4, 0)).toBeNull()
    expect(pushPadPitches(half)).toHaveLength(64)
  })

  it('keeps the octave where the bottom-left pad is still a MIDI note', () => {
    expect(clampPushOctave(12, 0)).toBe(9)
    expect(clampPushOctave(12, 11)).toBe(8)
    expect(clampPushOctave(-4, 0)).toBe(-1)
    expect(clampPushOctave(3, 5)).toBe(3)
  })
})
