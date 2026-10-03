// A saved piece knows a factory sound by its number (a host's sample id is
// built on it) and its id (the `factory:<id>` address), and a stroke laid
// over a loop repeats at the sound's length. So once a sound has shipped,
// its number, its id, its length and whether it loops never change:
// shipped-sounds.json holds every one that has, and this fails when a row
// no longer matches the bank.
//
// A new sound adds a row:
//   UPDATE_SHIPPED_SOUNDS=1 pnpm vitest run src/dsp/factory/__tests__/shipped-sounds.test.ts
// That never changes a row that is there. To change what a shipped sound is,
// give the new one a new number and id, and leave the old one as it was.

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { FACTORY_SOUNDS } from '..'

interface ShippedSound {
  id: string
  durationSec: number
  loops: boolean
}

const file = join(dirname(fileURLToPath(import.meta.url)), 'shipped-sounds.json')
const shipped = JSON.parse(readFileSync(file, 'utf8')) as Record<string, ShippedSound>

const asShipped = (sound: (typeof FACTORY_SOUNDS)[number]): ShippedSound => ({
  id: sound.id,
  durationSec: sound.durationSec,
  loops: Boolean(sound.loopCrossfadeSec),
})

if (process.env.UPDATE_SHIPPED_SOUNDS) {
  for (const sound of FACTORY_SOUNDS) shipped[String(sound.number)] ??= asShipped(sound)
  const sorted = Object.fromEntries(
    Object.entries(shipped).sort(([a], [b]) => Number(a) - Number(b)),
  )
  writeFileSync(file, `${JSON.stringify(sorted, null, 2)}\n`)
}

describe('shipped factory sounds', () => {
  it('keeps every sound that has shipped under its number, with its id, its length and its loop', () => {
    const now = new Map(FACTORY_SOUNDS.map((sound) => [String(sound.number), asShipped(sound)]))
    for (const [number, row] of Object.entries(shipped)) {
      expect(now.get(number), `factory sound ${number} (${row.id})`).toEqual(row)
    }
  })

  it('has a row for every sound of the bank', () => {
    const missing = FACTORY_SOUNDS.filter((sound) => !(String(sound.number) in shipped)).map(
      (sound) => `${sound.number} ${sound.id}`,
    )
    expect(missing, 'add them with UPDATE_SHIPPED_SOUNDS=1').toEqual([])
  })
})
