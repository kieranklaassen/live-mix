import { describe, expect, it } from 'vitest'

import { clipChance, normaliseSeed, seededRandom, seededUnit, soundsOnPass } from '../chance'

describe('seededUnit', () => {
  it('gives the same draw for the same seed and parts, every time', () => {
    expect(seededUnit(7, 'clip', 'a', 3)).toBe(seededUnit(7, 'clip', 'a', 3))
    expect(seededUnit(7, 'clip', 'a', 3)).toBeGreaterThanOrEqual(0)
    expect(seededUnit(7, 'clip', 'a', 3)).toBeLessThan(1)
  })

  it('gives another draw for another seed, part or order of parts', () => {
    const draws = [
      seededUnit(7, 'clip', 'a', 3),
      seededUnit(8, 'clip', 'a', 3),
      seededUnit(7, 'clip', 'b', 3),
      seededUnit(7, 'clip', 'a', 4),
      seededUnit(7, 'a', 'clip', 3),
      // A number and the string that spells it, and parts cut in another place.
      seededUnit(7, 'clip', 'a', '3'),
      seededUnit(7, 'clipa', 3),
    ]
    expect(new Set(draws).size).toBe(draws.length)
  })

  it('spreads evenly over neighbouring seeds and passes', () => {
    let sum = 0
    const tenths = new Array<number>(10).fill(0)
    for (let seed = 0; seed < 100; seed += 1) {
      for (let pass = 0; pass < 100; pass += 1) {
        const draw = seededUnit(seed, 'clip', 'region-1', pass)
        sum += draw
        tenths[Math.floor(draw * 10)] += 1
      }
    }
    expect(sum / 10000).toBeCloseTo(0.5, 1)
    for (const count of tenths) expect(Math.abs(count - 1000)).toBeLessThan(150)
  })

  it('brings any number to a seed a Uint32 holds', () => {
    expect(normaliseSeed(7.9)).toBe(7)
    expect(normaliseSeed(-1)).toBe(4294967295)
    expect(normaliseSeed(Number.NaN)).toBe(0)
    expect(seededUnit(7.9, 'x')).toBe(seededUnit(7, 'x'))
  })
})

describe('seededRandom', () => {
  it('is a stream that starts again the same from the same seed and parts', () => {
    const first = seededRandom(7, 'drift', 2)
    const again = seededRandom(7, 'drift', 2)
    const run = [first(), first(), first(), first()]
    expect([again(), again(), again(), again()]).toEqual(run)
    expect(new Set(run).size).toBe(4)
    for (const draw of run) {
      expect(draw).toBeGreaterThanOrEqual(0)
      expect(draw).toBeLessThan(1)
    }
  })

  it('is another stream for another part', () => {
    const one = seededRandom(7, 'drift', 2)
    const other = seededRandom(7, 'drift', 3)
    expect([one(), one()]).not.toEqual([other(), other()])
  })
})

describe('soundsOnPass', () => {
  it('always sounds without a chance, and at 1; never at 0', () => {
    for (let pass = 0; pass < 50; pass += 1) {
      expect(soundsOnPass({ id: 'a' }, pass, 7)).toBe(true)
      expect(soundsOnPass({ id: 'a', chance: 1 }, pass, 7)).toBe(true)
      expect(soundsOnPass({ id: 'a', chance: 0 }, pass, 7)).toBe(false)
    }
  })

  it('sounds on about its share of the passes, the same ones each time', () => {
    const clip = { id: 'region-9', chance: 2 / 3 }
    const passes = Array.from({ length: 600 }, (_, pass) => soundsOnPass(clip, pass, 7))
    const share = passes.filter(Boolean).length / passes.length
    expect(share).toBeGreaterThan(0.6)
    expect(share).toBeLessThan(0.73)
    expect(Array.from({ length: 600 }, (_, pass) => soundsOnPass(clip, pass, 7))).toEqual(passes)
  })

  it('picks other passes for another seed and for another clip', () => {
    const run = (id: string, seed: number) =>
      Array.from({ length: 40 }, (_, pass) => soundsOnPass({ id, chance: 0.5 }, pass, seed))
    expect(run('a', 8)).not.toEqual(run('a', 7))
    expect(run('b', 7)).not.toEqual(run('a', 7))
  })

  it('keeps a clip that sounds at a lower chance sounding at a higher one', () => {
    // One draw per clip and pass: raising the chance only adds passes.
    for (let pass = 0; pass < 200; pass += 1) {
      if (soundsOnPass({ id: 'a', chance: 0.25 }, pass, 7)) {
        expect(soundsOnPass({ id: 'a', chance: 0.75 }, pass, 7)).toBe(true)
      }
    }
  })

  it('reads a chance outside 0 to 1 as the nearest end', () => {
    expect(clipChance({ chance: 3 })).toBe(1)
    expect(clipChance({ chance: -1 })).toBe(0)
    expect(clipChance({ chance: Number.NaN })).toBe(1)
    expect(clipChance({})).toBe(1)
  })
})
