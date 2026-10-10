// Every instrument's own presets, the list the instrument is stepped through
// where it stands: there are as many as an effect has, each plays, the list
// keeps one level from end to end, and no two of one instrument are the same
// sound under two names.
//
// `INSTRUMENT_PRESETS=harp,flute` runs only those instruments;
// `INSTRUMENT_REPORT=1` prints what each preset measured and its nearest
// sibling, and writes the same to tmp/instrument-presets/<id>.txt and .json,
// for whoever writes presets.

import { mkdirSync, writeFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { resolvePreset } from '../../core/devices/presets'
import { nearestPrints } from '../factory/__tests__/support'
import {
  AS_SHIPPED,
  INSTRUMENTS,
  INSTRUMENT_PRESET_LIMITS,
  instrumentPresetProblems,
  median,
  renderInstrumentPreset,
  unexcused,
} from './instrument-preset-support'
import { measureAudio, soundPrint, type AudioMeasurement, type SoundPrint } from './render-support'

const only = process.env.INSTRUMENT_PRESETS?.split(',').filter(Boolean)
const report = process.env.INSTRUMENT_REPORT === '1'
const instruments = INSTRUMENTS.filter((descriptor) => !only || only.includes(descriptor.id))

describe('the shipped exceptions', () => {
  it('name presets that exist', () => {
    for (const [id, table] of Object.entries(AS_SHIPPED)) {
      const descriptor = INSTRUMENTS.find((instrument) => instrument.id === id)
      expect(descriptor, id).toBeDefined()
      for (const name of Object.keys(table))
        expect(Object.keys(descriptor?.presets ?? {}), `${id}: ${name}`).toContain(name)
    }
  })
})

describe.each(instruments.map((descriptor) => [descriptor.id, descriptor] as const))(
  'presets of %s',
  (id, descriptor) => {
    const names = Object.keys(descriptor.presets ?? {})
    const prints = new Map<string, SoundPrint>()
    const measures = new Map<string, AudioMeasurement>()

    it('are as many as an effect has, with names that fit', () => {
      expect(names.length, id).toBeGreaterThanOrEqual(INSTRUMENT_PRESET_LIMITS.each)
      expect(new Set(names.map((name) => name.toLowerCase())).size, 'two names alike').toBe(
        names.length,
      )
      for (const name of names) {
        expect(name.length, name).toBeLessThanOrEqual(INSTRUMENT_PRESET_LIMITS.name)
        expect(name.trim(), name).toBe(name)
        expect(resolvePreset(descriptor, name), name).toBeDefined()
      }
    })

    it.each(names)(
      '%s plays',
      async (name) => {
        const audio = await renderInstrumentPreset(id, name)
        const measured = measureAudio(audio)
        measures.set(name, measured)
        prints.set(name, soundPrint(audio))
        expect(Number.isFinite(measured.peakDb), 'silence').toBe(true)
      },
      30_000,
    )

    it('keep one level and are different sounds, not one sound under two names', () => {
      const near = new Map(nearestPrints(prints).map((row) => [row.id, row]))
      const middle = median([...measures.values()].map((measured) => measured.loudestDb))
      const rows = names.flatMap((name) => {
        const measured = measures.get(name)
        const nearest = near.get(name)
        if (!measured) return []
        const problems = instrumentPresetProblems(
          measured,
          middle,
          nearest?.distance ?? Number.POSITIVE_INFINITY,
        )
        return [{ name, measured, nearest, problems, left: unexcused(id, name, problems) }]
      })
      if (report) {
        const lines = rows.map(({ name, measured: m, nearest: n, problems, left }) =>
          [
            name.padEnd(INSTRUMENT_PRESET_LIMITS.name + 2),
            `peak ${m.peakDb.toFixed(1).padStart(6)}`,
            `loudest ${m.loudestDb.toFixed(1).padStart(6)}`,
            `attack ${m.attackSec.toFixed(2)}`,
            `tail ${m.tailDb.toFixed(0).padStart(4)}`,
            `centre ${Math.round(m.centroidHz).toString().padStart(5)} Hz`,
            `width ${m.widthDb.toFixed(0).padStart(4)}`,
            n ? `nearest ${n.nearest} (${n.distance.toFixed(1)} dB)` : '',
            left.length
              ? `OUTSIDE: ${left.join(' ')}`
              : problems.length
                ? `(as shipped: ${problems.join(' ')})`
                : '',
          ].join('  '),
        )
        const head = `${id}: ${names.length} presets, the middle one's loudest 400 ms is ${middle.toFixed(1)} dBFS`
        console.log(`\n${head}\n${lines.join('\n')}`)
        mkdirSync('tmp/instrument-presets', { recursive: true })
        writeFileSync(`tmp/instrument-presets/${id}.txt`, `${head}\n${lines.join('\n')}\n`)
        writeFileSync(
          `tmp/instrument-presets/${id}.json`,
          JSON.stringify({ id, middle, rows }, null, 1),
        )
      }
      expect(rows.length, 'rendered').toBe(names.length)
      expect(
        rows
          .filter((row) => row.left.length > 0)
          .map((row) => `${row.name}: ${row.left.join(' ')}`),
      ).toEqual([])
    })
  },
)
