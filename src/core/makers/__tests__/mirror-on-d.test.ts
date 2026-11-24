import { describe, expect, it } from 'vitest'

import { MIRROR_ON_D } from '../mirror-on-d'
import { A_MINOR, chord, line, made, makerContract, notesOf } from './support'

const REPLACE = { params: { mode: 0 } }

describe('Mirror on D', () => {
  it('turns n into 124 - n on the white keys', () => {
    for (const note of [48, 50, 52, 53, 55, 57, 59, 60, 61, 66, 76]) {
      expect(notesOf(made(MIRROR_ON_D, chord([note], 1), REPLACE))).toEqual([124 - note])
    }
  })

  it('makes C E G into E C A', () => {
    expect(notesOf(made(MIRROR_ON_D, chord([60, 64, 67], 1), REPLACE)).map((n) => n % 12)).toEqual([
      4, 0, 9,
    ])
  })

  it('stays in A minor about its own D', () => {
    const notes = notesOf(
      made(
        MIRROR_ON_D,
        line([
          [57, 1],
          [59, 1],
          [60, 1],
          [64, 1],
          [65, 1],
        ]),
        {
          ...REPLACE,
          key: A_MINOR,
        },
      ),
    )
    expect(notes).toEqual([67, 65, 64, 60, 59])
  })
})

makerContract(MIRROR_ON_D)
