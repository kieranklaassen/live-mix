// The two readers of a separation's names: the stems in order, the parts in
// order, and the separations they refuse to read.

import { describe, expect, it } from 'vitest'

import { partNames, stemNames } from '../names'
import { SeparationError, type Channels, type Separation } from '../types'

const part = (): Channels => [new Float32Array(4), new Float32Array(4)]

describe('the names of a separation', () => {
  it('reads a separation that says no names as the four, and its parts as the five', () => {
    // As a host writes one by hand: no names and no report.
    const separation: Omit<Separation, 'report'> = {
      sampleRate: 44100,
      stems: { vocals: part(), drums: part(), bass: part(), other: part() },
      remainder: part(),
    }
    expect(stemNames(separation)).toEqual(['vocals', 'drums', 'bass', 'other'])
    expect(partNames(separation)).toEqual(['vocals', 'drums', 'bass', 'other', 'remainder'])
  })

  it('reads the names a separation says in the order it says them, not its record’s', () => {
    const separation = {
      names: ['kick', 'snare', 'bass'] as const,
      stems: { bass: part(), snare: part(), kick: part() },
    }
    expect(stemNames(separation)).toEqual(['kick', 'snare', 'bass'])
    expect(partNames(separation)).toEqual(['kick', 'snare', 'bass', 'remainder'])
  })

  it('refuses a record with a stem the names do not say, by that stem’s name', () => {
    // Six stems written by hand with no names: never read as the four.
    const six = {
      stems: {
        vocals: part(),
        drums: part(),
        bass: part(),
        guitar: part(),
        piano: part(),
        other: part(),
      },
    }
    expect(() => stemNames(six)).toThrow(SeparationError)
    expect(() => stemNames(six)).toThrow(/guitar/)
    expect(() => partNames(six)).toThrow(/guitar/)

    const said = { names: ['kick'] as const, stems: { kick: part(), snare: part() } }
    expect(() => stemNames(said)).toThrow(/snare/)
  })

  it('refuses names that say a stem the record does not hold, by that stem’s name', () => {
    const separation: Pick<Separation<'kick' | 'snare'>, 'names' | 'stems'> = {
      names: ['kick', 'snare'],
      stems: { kick: part() } as Record<'kick' | 'snare', Channels>,
    }
    expect(() => stemNames(separation)).toThrow(SeparationError)
    expect(() => stemNames(separation)).toThrow(/snare/)
    expect(() => partNames(separation)).toThrow(/snare/)

    const three = { stems: { vocals: part(), drums: part(), bass: part() } } as Pick<
      Separation,
      'names' | 'stems'
    >
    expect(() => stemNames(three)).toThrow(/other/)
  })

  it('holds a record to its own keys: a name every object answers to is not held', () => {
    const separation = {
      names: ['kick', 'constructor'],
      stems: { kick: part() } as Record<string, Channels>,
    }
    expect(() => stemNames(separation)).toThrow(SeparationError)
    expect(() => stemNames(separation)).toThrow(/constructor/)
  })

  it.each<[string, string[], RegExp]>([
    ['an empty list', [], /names are empty/],
    ['a name said twice', ['kick', 'kick'], /name kick twice/],
    ['a name of another shape', ['Kick'], /"Kick"/],
    ['the remainder', ['kick', 'remainder'], /name remainder/],
  ])('refuses %s as a separation’s names', (_name, names, message) => {
    const stems: Record<string, Channels> = {}
    for (const name of names) stems[name] = part()
    expect(() => stemNames({ names, stems })).toThrow(SeparationError)
    expect(() => stemNames({ names, stems })).toThrow(message)
  })
})
