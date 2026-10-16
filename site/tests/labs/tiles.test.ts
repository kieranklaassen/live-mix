// The home map's tiles, as loud as they will sound: every tile that plays is rendered here as
// the page renders it, on every loop it takes, and its level is held inside one band. A tile
// far outside it would jump out of the map, or be lost in it, when its button is pressed.

import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { LOOPS } from '../../src/lab/tiles.ts'
import { lessonTile, renderStill, type StillLesson } from '../../src/lib/still.ts'
import { gainToDb } from './support.ts'

const FOLDER = fileURLToPath(new URL('../../src/content/lessons/', import.meta.url))

/**
 * The band, in dB of RMS level against full scale, over the whole loop and both channels. The
 * loops themselves lie between −30 and −21 dB. The band is as wide as today's tiles need: none of
 * them has an entry in its lesson's settings file yet, so each plays its lab's starting values.
 */
const BAND = { min: -36, max: -5 }

/** The lessons that are written, with what a tile needs of their front matter. */
const lessons: StillLesson[] = fs
  .readdirSync(FOLDER)
  .filter((name) => name.endsWith('.mdx'))
  .map((name) => {
    const text = fs.readFileSync(`${FOLDER}${name}`, 'utf8')
    const said = (key: string) => new RegExp(`^${key}: (.+)$`, 'm').exec(text)?.[1]
    return {
      id: name.replace(/\.mdx$/, ''),
      data: {
        lab: said('lab') ?? '',
        sources: (said('sources') ?? '').replace(/[[\]]/g, '').split(/,\s*/),
        seconds: Number(said('seconds') ?? 4),
      },
    }
  })

describe('every tile that plays', () => {
  it('there are lessons to play', () => {
    expect(lessons.length).toBeGreaterThan(0)
  })

  for (const lesson of lessons) {
    it(`${lesson.id}: its level is inside the band on every loop it takes`, async () => {
      const tile = await lessonTile(lesson)
      const { lab, seconds } = lesson.data
      const levels: Record<string, number> = {}
      for (const loop of tile.own ? ['none'] : LOOPS) {
        const render = await renderStill({ lab, source: loop, seconds, values: tile.values })
        const channels = render.result.taps[tile.tap]!.channels_data
        let sum = 0
        let count = 0
        for (const channel of channels) {
          for (const sample of channel) sum += sample * sample
          count += channel.length
        }
        levels[loop] = gainToDb(Math.sqrt(sum / count))
      }
      const outside = Object.entries(levels).filter(
        ([, level]) => !(level >= BAND.min && level <= BAND.max),
      )
      expect(outside, `${lesson.id}, the tap "${tile.tap}", dB by loop`).toEqual([])
    })
  }
})
