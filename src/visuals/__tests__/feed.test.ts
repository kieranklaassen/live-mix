import { describe, expect, it } from 'vitest'

import {
  followedStrokes,
  hitsOfPass,
  rgbOfHex,
  slotOfKind,
  type PieceRead,
  type PieceStroke,
  type StrokePass,
} from '../feed'
import type { Rgb } from '../follow'

const stroke = (more: Partial<PieceStroke> = {}): PieceStroke => ({
  id: 'stroke-1',
  sampleId: 1,
  startSec: 4,
  durationSec: 8,
  fadeInSec: 1,
  fadeOutSec: 2,
  row: 4,
  rows: 2,
  muted: false,
  ...more,
})

const KINDS: Record<number, string | null> = {
  1: 'pad',
  2: 'beat',
  3: 'oneshot',
  4: 'drone',
  5: null,
}
const BLUE: Rgb = [0.2, 0.4, 0.8]

/** A room of ten rows where every stroke is painted at the usual level. */
const piece = (more: Partial<PieceRead> = {}): PieceRead => ({
  roomRows: 10,
  kindOf: (sampleId) => KINDS[sampleId] ?? null,
  colourOf: () => BLUE,
  levelDbOf: () => 0,
  ...more,
})

describe('the slot a kind of sound is followed in', () => {
  it('follows drones, pads, textures and melodies each as what they are', () => {
    expect(slotOfKind('drone')).toBe('drone')
    expect(slotOfKind('pad')).toBe('pad')
    expect(slotOfKind('texture')).toBe('texture')
    expect(slotOfKind('melodic')).toBe('melodic')
  })

  it('follows one shots and beats as hits', () => {
    expect(slotOfKind('oneshot')).toBe('hits')
    expect(slotOfKind('beat')).toBe('hits')
  })

  it('follows a sound of no known kind as a pad', () => {
    expect(slotOfKind(null)).toBe('pad')
    expect(slotOfKind('')).toBe('pad')
    expect(slotOfKind('something-else')).toBe('pad')
    expect(slotOfKind('hits')).toBe('pad')
  })
})

describe('a colour from its hex', () => {
  it('reads six digits', () => {
    expect(rgbOfHex('#336699')).toEqual([0.2, 0.4, 0.6])
    expect(rgbOfHex('#000000')).toEqual([0, 0, 0])
    expect(rgbOfHex('#FFFFFF')).toEqual([1, 1, 1])
    expect(rgbOfHex('#ff0080')).toEqual([1, 0, 128 / 255])
  })

  it('reads three digits as each one twice', () => {
    expect(rgbOfHex('#369')).toEqual(rgbOfHex('#336699'))
    expect(rgbOfHex('#fff')).toEqual([1, 1, 1])
    expect(rgbOfHex('#F00')).toEqual([1, 0, 0])
  })

  it('does not mind a missing hash or space around it', () => {
    expect(rgbOfHex('336699')).toEqual([0.2, 0.4, 0.6])
    expect(rgbOfHex('  #369 ')).toEqual([0.2, 0.4, 0.6])
  })

  it('is a soft grey for anything else', () => {
    for (const junk of [
      '',
      '#',
      'red',
      '#12',
      '#1234',
      '#12345',
      '#1234567',
      '#gggggg',
      '#ggg',
      'rgb(1, 2, 3)',
    ]) {
      expect(rgbOfHex(junk), junk).toEqual([0.6, 0.6, 0.6])
    }
  })
})

describe('the strokes of a piece as the visuals follow them', () => {
  it('keeps where a stroke is in time, and its id', () => {
    const [followed] = followedStrokes([stroke()], piece())
    expect(followed).toMatchObject({
      id: 'stroke-1',
      startSec: 4,
      durationSec: 8,
      fadeInSec: 1,
      fadeOutSec: 2,
    })
    expect(followedStrokes([], piece())).toEqual([])
    expect(
      followedStrokes([stroke({ id: 'a' }), stroke({ id: 'b' })], piece()).map((item) => item.id),
    ).toEqual(['a', 'b'])
  })

  it('puts the first row at the front of the room and the last at the back', () => {
    const depthOf = (row: number, rows: number) =>
      followedStrokes([stroke({ row, rows })], piece())[0].depth
    expect(depthOf(0, 2)).toBeCloseTo(0.9, 10)
    expect(depthOf(4, 2)).toBeCloseTo(0.5, 10)
    expect(depthOf(8, 2)).toBeCloseTo(0.1, 10)
    expect(depthOf(0, 10)).toBeCloseTo(0.5, 10)
    // Held inside the room, whatever the rows say.
    expect(depthOf(40, 2)).toBe(0)
    expect(depthOf(-40, 2)).toBe(1)
  })

  it('says how much of the room a stroke takes up', () => {
    const thicknessOf = (rows: number) => followedStrokes([stroke({ rows })], piece())[0].thickness
    expect(thicknessOf(2)).toBeCloseTo(0.2, 10)
    expect(thicknessOf(10)).toBe(1)
    expect(thicknessOf(30)).toBe(1)
  })

  it('reads how loud a stroke is painted from its level in dB', () => {
    const gainAt = (db: number) =>
      followedStrokes([stroke()], piece({ levelDbOf: () => db }))[0].gain
    // The usual level is most of the way up.
    expect(gainAt(0)).toBeCloseTo(0.8, 10)
    expect(gainAt(-6)).toBeCloseTo(0.8 * Math.pow(10, -6 / 20), 10)
    expect(gainAt(-20)).toBeCloseTo(0.08, 10)
    expect(gainAt(-6)).toBeLessThan(gainAt(0))
    expect(gainAt(6)).toBe(1)
    expect(gainAt(-Infinity)).toBe(0)
  })

  it('hands the level of each stroke the stroke itself', () => {
    const levelDbOf = (item: PieceStroke) => (item.id === 'quiet' ? -20 : 0)
    const [quiet, usual] = followedStrokes(
      [stroke({ id: 'quiet' }), stroke({ id: 'usual' })],
      piece({ levelDbOf }),
    )
    expect(quiet.gain).toBeCloseTo(0.08, 10)
    expect(usual.gain).toBeCloseTo(0.8, 10)
  })

  it('paints a muted stroke with no level', () => {
    const [muted, heard] = followedStrokes([stroke({ muted: true }), stroke()], piece())
    expect(muted.gain).toBe(0)
    expect(heard.gain).toBeGreaterThan(0)
  })

  it('paints a sound nothing is heard of with no level', () => {
    const silent = (sampleId: number) => sampleId === 4
    const [drone, pad] = followedStrokes(
      [stroke({ sampleId: 4 }), stroke({ sampleId: 1 })],
      piece({ silent }),
    )
    expect(drone.gain).toBe(0)
    expect(pad.gain).toBeCloseTo(0.8, 10)
  })

  it('gives each stroke the slot of its kind and the colour of its sound', () => {
    const colourOf = (sampleId: number): Rgb => [sampleId / 10, 0, 0]
    const strokes = [1, 2, 3, 4, 5].map((sampleId) => stroke({ id: `s${sampleId}`, sampleId }))
    const followed = followedStrokes(strokes, piece({ colourOf }))
    expect(followed.map((item) => item.slot)).toEqual(['pad', 'hits', 'hits', 'drone', 'pad'])
    expect(followed.map((item) => item.colour)).toEqual(
      [1, 2, 3, 4, 5].map((sampleId) => [sampleId / 10, 0, 0]),
    )
  })

  it('carries where the hits fall only for a hit', () => {
    const onsets = [0, 0.5, 1]
    const asked: number[] = []
    const onsetsOf = (sampleId: number) => {
      asked.push(sampleId)
      return sampleId === 2 ? onsets : [9]
    }
    const [pad, beat, oneshot, drone] = followedStrokes(
      [1, 2, 3, 4].map((sampleId) => stroke({ sampleId })),
      piece({ onsetsOf }),
    )
    expect(beat.onsets).toBe(onsets)
    expect(oneshot.onsets).toEqual([9])
    expect(pad.onsets).toBeUndefined()
    expect(drone.onsets).toBeUndefined()
    // A sound that is no hit is not even asked.
    expect(asked).toEqual([2, 3])
  })

  it('carries the hits of the part a stroke plays, and how it repeats it', () => {
    const pass: StrokePass = {
      fromSec: 1,
      lengthSec: 2,
      repeats: true,
      phaseSec: 0.5,
      reversed: false,
    }
    const [beat] = followedStrokes(
      [stroke({ sampleId: 2 })],
      piece({ onsetsOf: () => [0.5, 1, 1.5, 2.5, 3, 4], passOf: () => pass }),
    )
    // Those from one second to three, counted from where the pass begins.
    expect(beat.onsets).toEqual([0, 0.5, 1.5])
    expect(beat.repeatSec).toBe(2)
    expect(beat.phaseSec).toBe(0.5)
    const [once] = followedStrokes(
      [stroke({ sampleId: 2 })],
      piece({ onsetsOf: () => [0.5, 1.5], passOf: () => ({ ...pass, repeats: false }) }),
    )
    expect(once.onsets).toEqual([0.5])
    expect(once.repeatSec).toBeUndefined()
    expect(once.phaseSec).toBeUndefined()
    // A sound that is no hit is not asked how it is played.
    const [pad] = followedStrokes(
      [stroke({ sampleId: 1 })],
      piece({
        passOf: () => {
          throw new Error('asked')
        },
      }),
    )
    expect(pad.repeatSec).toBeUndefined()
  })

  it('turns the hits round with a stroke that plays backwards', () => {
    expect(
      hitsOfPass([0.5, 1, 2.5], {
        fromSec: 0,
        lengthSec: 2,
        repeats: true,
        phaseSec: 0,
        reversed: true,
      }),
    ).toEqual([1, 1.5])
  })

  it('has no hits to carry where the piece cannot say where they fall', () => {
    const [beat] = followedStrokes([stroke({ sampleId: 2 })], piece())
    expect(beat.slot).toBe('hits')
    expect(beat.onsets).toBeUndefined()
    const [unknown] = followedStrokes(
      [stroke({ sampleId: 2 })],
      piece({ onsetsOf: () => undefined }),
    )
    expect(unknown.onsets).toBeUndefined()
  })
})
