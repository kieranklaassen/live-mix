import { describe, expect, it } from 'vitest'
import { MakerBase } from '../base'
import { SIX_VOICES } from '../six-voices'
import type { MadeEvent } from '../types'

/** Two voices of one pitch: the second a set time after the first, and as hard as it is told. */
class Pair extends MakerBase {
  constructor(
    private readonly late: number,
    private readonly second: number,
  ) {
    super(SIX_VOICES)
  }

  protected onNote(atSec: number, held: { note: number; gain: number }): void {
    this.play(held.note, held.gain, 1)
    this.at(atSec + this.late, () => this.play(held.note, this.second, 1))
  }

  protected onRelease(): void {}
}

function ons(late: number, second: number, first = 0.3): [number, number][] {
  const maker = new Pair(late, second)
  const out: MadeEvent[] = []
  maker.noteOn(0, 1, 60, first)
  maker.advance(5, (event) => out.push({ ...event }))
  expect(out.filter((event) => !event.on)).toHaveLength(out.filter((event) => event.on).length)
  return out.filter((event) => event.on).map((event) => [event.atSec, event.gain])
}

describe('two voices of one pitch', () => {
  it('are one attack when they begin together', () => {
    expect(ons(0, 0.8)).toEqual([[0, 0.3]])
    expect(ons(0.01, 0.3)).toEqual([[0, 0.3]])
    expect(ons(0.01, 0.4)).toEqual([[0, 0.3]])
  })

  it('are two when the second comes later, or much harder', () => {
    expect(ons(0.03, 0.1)).toEqual([
      [0, 0.3],
      [0.03, 0.1],
    ])
    expect(ons(0.01, 0.8)).toEqual([
      [0, 0.3],
      [0.01, 0.8],
    ])
  })

  it('reckon with a loudness between nothing and all', () => {
    expect(ons(1.5, 4, NaN)).toEqual([
      [0, 0],
      [1.5, 1],
    ])
  })
})
