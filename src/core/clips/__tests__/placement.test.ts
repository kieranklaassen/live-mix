import { describe, expect, it } from 'vitest'

import {
  MAX_SPACE_DB,
  OPEN_CLIP_LOWPASS_HZ,
  SPACE_FLOOR_DB,
  clipLowpassHz,
  clipPan,
  isPlacedClip,
  spaceSendGain,
} from '../placement'

describe('clip placement', () => {
  it('a clip is placed as soon as it names one of the three, a pan of 0 included', () => {
    expect(isPlacedClip({})).toBe(false)
    expect(isPlacedClip({ pan: 0 })).toBe(true)
    expect(isPlacedClip({ lowpassHz: 4000 })).toBe(true)
    expect(isPlacedClip({ spaceDb: -12 })).toBe(true)
  })

  it('keeps the pan between the two sides and centres a clip that names none', () => {
    expect(clipPan(undefined)).toBe(0)
    expect(clipPan(0.4)).toBe(0.4)
    expect(clipPan(-3)).toBe(-1)
    expect(clipPan(Number.NaN)).toBe(0)
  })

  it('opens the low-pass when a placed clip names no cutoff, under half the sample rate', () => {
    expect(clipLowpassHz(undefined, 96000)).toBe(OPEN_CLIP_LOWPASS_HZ)
    expect(clipLowpassHz(undefined, 48000)).toBeCloseTo(48000 * 0.49)
    expect(clipLowpassHz(2400, 48000)).toBe(2400)
    expect(clipLowpassHz(5, 48000)).toBe(20)
    expect(clipLowpassHz(90_000, 96000)).toBe(OPEN_CLIP_LOWPASS_HZ)
  })

  it('sends nothing at the floor or without a level, and caps what it sends', () => {
    expect(spaceSendGain(undefined)).toBe(0)
    expect(spaceSendGain(SPACE_FLOOR_DB)).toBe(0)
    expect(spaceSendGain(-200)).toBe(0)
    expect(spaceSendGain(0)).toBe(1)
    expect(spaceSendGain(-6)).toBeCloseTo(0.501, 3)
    expect(spaceSendGain(90)).toBeCloseTo(10 ** (MAX_SPACE_DB / 20))
  })
})
