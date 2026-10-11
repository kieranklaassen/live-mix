import { describe, expect, it } from 'vitest'

import { matchRanges, queryWords, searchRows, searchScore } from '../components/pick-search'

describe('pick-search', () => {
  it('splits a query into lower-case words', () => {
    expect(queryWords('  Glass  PAD ')).toEqual(['glass', 'pad'])
    expect(queryWords('   ')).toEqual([])
  })

  it('finds each word in a name and merges stretches that touch', () => {
    expect(matchRanges('Warm chorus pad', 'pad warm')).toEqual([
      [0, 4],
      [12, 15],
    ])
    expect(matchRanges('ValhallaVintageVerb', 'val valh')).toEqual([[0, 4]])
    expect(matchRanges('Tape Echo', 'glass')).toEqual([])
  })

  it('marks the letters that were found in a name whose lower case is longer than the name', () => {
    // The dotted capital I is two characters in lower case: what follows it is still found where it stands.
    const name = 'İlk pad'
    expect(matchRanges(name, 'pad').map(([start, end]) => name.slice(start, end))).toEqual(['pad'])
    expect(matchRanges('İİ low hum', 'low hum')).toEqual([
      [3, 6],
      [7, 10],
    ])
    // The letter itself is found whole, typed as it is written or as a plain i.
    expect(matchRanges(name, 'İlk')).toEqual([[0, 3]])
    expect(matchRanges(name, 'i')).toEqual([[0, 1]])
  })

  it('ranks a name that starts with the word over one that holds it, over a match elsewhere', () => {
    expect(searchScore({ name: 'Glass pad' }, 'glass')).toBe(0)
    expect(searchScore({ name: 'Slow glass' }, 'glass')).toBe(1)
    expect(searchScore({ name: 'Crystal pad', more: ['Glass'] }, 'glass')).toBe(2)
    expect(searchScore({ name: 'Tape Echo', more: ['Delay'] }, 'glass')).toBeNull()
    expect(searchScore({ name: 'Anything' }, '')).toBe(0)
  })

  it('needs every word, each from the name or the rest', () => {
    expect(searchScore({ name: 'Glass pad', more: ['Ember'] }, 'ember glass')).toBe(2)
    expect(searchScore({ name: 'Glass pad', more: ['Ember'] }, 'ember bell')).toBeNull()
  })

  it('returns the matches best first and otherwise in their own order', () => {
    const rows = [
      { name: 'Slow glass' },
      { name: 'Crystal pad', more: ['Glass'] },
      { name: 'Glass bell' },
      { name: 'Tine keys' },
      { name: 'Glass pad' },
    ]
    expect(searchRows(rows, 'glass').map((row) => row.name)).toEqual([
      'Glass bell',
      'Glass pad',
      'Slow glass',
      'Crystal pad',
    ])
    expect(searchRows(rows, '')).toEqual(rows)
  })

  it('puts the name that is the query before one that only starts with it', () => {
    const rows = [
      { name: 'Chorused' },
      { name: 'Slow chorus' },
      { name: 'Chorus' },
      { name: 'chorus  ' },
    ]
    expect(searchRows(rows, 'Chorus').map((row) => row.name)).toEqual([
      'Chorus',
      'chorus  ',
      'Chorused',
      'Slow chorus',
    ])
    // Two words: the whole name, whatever the spaces between them.
    const two = [{ name: 'Tape Echo wide' }, { name: 'Tape  Echo' }]
    expect(searchRows(two, 'tape echo').map((row) => row.name)).toEqual([
      'Tape  Echo',
      'Tape Echo wide',
    ])
  })

  it('puts a row that stands alone before one under another, where they answer alike', () => {
    const rows = [
      { name: 'Chorused', nested: true },
      { name: 'Chord Delay' },
      { name: 'Chorale', nested: true },
      { name: 'Chorus' },
      { name: 'Deep chorus' },
    ]
    expect(searchRows(rows, 'chor').map((row) => row.name)).toEqual([
      'Chord Delay',
      'Chorus',
      'Chorused',
      'Chorale',
      'Deep chorus',
    ])
    // A better score still leads: a nested name that starts with the word, before a lone one that only holds it.
    expect(
      searchRows([{ name: 'Deep chorus' }, { name: 'Chorused', nested: true }], 'chorus').map(
        (row) => row.name,
      ),
    ).toEqual(['Chorused', 'Deep chorus'])
    // With nothing typed the list is as it stands.
    expect(searchRows(rows, '  ')).toEqual(rows)
  })
})
