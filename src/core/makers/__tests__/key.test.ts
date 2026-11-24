import { describe, expect, it } from 'vitest'

import {
  above,
  below,
  cleanKey,
  degreeClass,
  inKey,
  indexOf,
  mirrorDegree,
  nearestOfClass,
  noteAt,
  snapNote,
  stepFrom,
  triadOn,
} from '../key'
import { WHITE_KEYS } from '../types'
import { A_MINOR, PENTATONIC } from './support'

describe('counting in a key', () => {
  it('names every scale note by its step and back', () => {
    for (const key of [WHITE_KEYS, A_MINOR, PENTATONIC, { root: 11, steps: [0, 1, 5, 7, 10] }]) {
      for (let index = 5; index < 50; index += 1) {
        expect(indexOf(key, noteAt(key, index))).toBe(index)
        expect(inKey(key, noteAt(key, index))).toBe(true)
      }
    }
  })

  it('takes a note outside the key to the nearest, the lower of two', () => {
    expect(snapNote(WHITE_KEYS, 61)).toBe(60)
    expect(snapNote(WHITE_KEYS, 66)).toBe(65)
    expect(snapNote(WHITE_KEYS, 70.6)).toBe(71)
    expect(snapNote({ root: 0, steps: [0, 2] }, 71)).toBe(72)
    expect(inKey(WHITE_KEYS, 61)).toBe(false)
  })

  it('steps, degrees and triads', () => {
    expect(stepFrom(WHITE_KEYS, 64, 2)).toBe(67)
    expect(stepFrom(WHITE_KEYS, 60, -1)).toBe(59)
    expect(degreeClass(A_MINOR, 2)).toBe(0)
    expect(triadOn(WHITE_KEYS, 5)).toEqual([9, 0, 4])
    expect(triadOn(A_MINOR, 0)).toEqual([9, 0, 4])
    expect(triadOn(WHITE_KEYS, 6)).toEqual([11, 2, 5])
    expect(triadOn(PENTATONIC, 0)).toEqual([5, 9, 0])
  })

  it('finds notes of some pitch classes around a note', () => {
    const tonic = [9, 0, 4]
    expect([69, 71, 72, 74, 76].map((note) => below(tonic, note))).toEqual([64, 69, 69, 72, 72])
    expect([69, 71, 72, 74, 76].map((note) => above(tonic, note))).toEqual([72, 72, 76, 76, 81])
    expect(below(tonic, 69, true)).toBe(69)
    expect(nearestOfClass(0, 66)).toBe(60)
    expect(nearestOfClass(0, 67)).toBe(72)
  })

  it('knows the note a scale is the same from both ways', () => {
    expect(degreeClass(WHITE_KEYS, mirrorDegree(WHITE_KEYS))).toBe(2)
    expect(degreeClass(A_MINOR, mirrorDegree(A_MINOR))).toBe(2)
    expect(degreeClass(PENTATONIC, mirrorDegree(PENTATONIC))).toBe(7)
  })

  it('reads a key from anywhere', () => {
    expect(cleanKey(undefined, WHITE_KEYS)).toBe(WHITE_KEYS)
    expect(cleanKey({ root: 14, steps: [0, 14, 3, 3, -1, 7] }, WHITE_KEYS)).toEqual({
      root: 2,
      steps: [0, 3, 7],
    })
    expect(cleanKey({ root: 0, steps: [] }, WHITE_KEYS)).toEqual({ root: 0, steps: [0] })
    expect(cleanKey({ root: NaN, steps: [0] }, WHITE_KEYS)).toBe(WHITE_KEYS)
  })
})
