import { describe, expect, it } from 'vitest'

import { mirrorSlice, reversedSourceSec } from '../reverse'

describe('mirrorSlice', () => {
  it('a slice inside the source is read from its far end, for as long as the slice is', () => {
    // Source seconds 2..5 of a 10 s source: on the mirrored copy that is 5..8.
    expect(mirrorSlice({ offsetSec: 2, durationSec: 3 }, 10)).toEqual({ offsetSec: 5, soundSec: 3 })
    // The whole source.
    expect(mirrorSlice({ offsetSec: 0, durationSec: 10 }, 10)).toEqual({
      offsetSec: 0,
      soundSec: 10,
    })
  })

  it('a clip that outlives its source without looping sounds only as long as the slice', () => {
    // Forward this plays 6..10 and then nothing; backwards it must not read on into 0..6.
    expect(mirrorSlice({ offsetSec: 6, durationSec: 9 }, 10)).toEqual({ offsetSec: 0, soundSec: 4 })
    // An offset past the end leaves nothing to play.
    expect(mirrorSlice({ offsetSec: 12, durationSec: 2 }, 10)).toEqual({
      offsetSec: 0,
      soundSec: 0,
    })
  })

  it('a looping clip cycles over the same region, mirrored, entering at its far end', () => {
    // Default region: from the offset to the end of the source.
    expect(mirrorSlice({ offsetSec: 4, durationSec: 20, loop: true }, 10)).toEqual({
      offsetSec: 0,
      loopStartSec: 0,
      loopEndSec: 6,
    })
    // An explicit region, entered at its start.
    expect(
      mirrorSlice(
        { offsetSec: 2, durationSec: 20, loop: true, loopStartSec: 2, loopEndSec: 7 },
        10,
      ),
    ).toEqual({ offsetSec: 3, loopStartSec: 3, loopEndSec: 8 })
  })

  it('a loop entered partway in is entered the same distance from the far end', () => {
    expect(
      mirrorSlice(
        { offsetSec: 3, durationSec: 20, loop: true, loopStartSec: 2, loopEndSec: 7 },
        10,
      ),
    ).toEqual({ offsetSec: 4, loopStartSec: 3, loopEndSec: 8 })
    // An offset outside the region is held to it.
    expect(
      mirrorSlice(
        { offsetSec: 9, durationSec: 20, loop: true, loopStartSec: 2, loopEndSec: 7 },
        10,
      ),
    ).toEqual({ offsetSec: 8, loopStartSec: 3, loopEndSec: 8 })
  })
})

describe('reversedSourceSec', () => {
  it('walks the slice backwards and stops where it runs out', () => {
    const clip = { offsetSec: 2, durationSec: 3 }
    expect(reversedSourceSec(clip, 10, 0)).toBe(5)
    expect(reversedSourceSec(clip, 10, 1)).toBe(4)
    expect(reversedSourceSec(clip, 10, 2.5)).toBe(2.5)
    expect(reversedSourceSec(clip, 10, 3)).toBeNull()
  })

  it('wraps a looping clip from the start of its region back to the end', () => {
    const clip = { offsetSec: 4, durationSec: 20, loop: true }
    expect(reversedSourceSec(clip, 10, 0)).toBe(10)
    expect(reversedSourceSec(clip, 10, 5)).toBe(5)
    // One pass is 6 s: the seventh second is one second into the second pass.
    expect(reversedSourceSec(clip, 10, 7)).toBe(9)
    expect(reversedSourceSec({ offsetSec: 4, durationSec: 20, loop: true }, 4, 1)).toBeNull()
  })
})
