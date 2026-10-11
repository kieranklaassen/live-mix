// One part of a kit keeps the kit's own level (`kitLevel`): it is not
// brought to the bank's peak, so a row of hats is as far under a kick as the
// kit has it, and parts laid over each other are balanced as one kit.

import { describe, expect, it } from 'vitest'

import { compileFromDisk, toDb } from '../../__tests__/render-support'
import { peakOf } from '../../patch-render'
import { FACTORY_PEAK_DB, FACTORY_SOUNDS, KIT_LEVEL_DB, factorySound, renderFactorySound } from '..'
import { type FactorySound } from '../types'

const node = { compile: compileFromDisk, sliceMs: 0 } as const

const named = (id: string): FactorySound => {
  const sound = factorySound(id)
  if (!sound) throw new Error(`no factory sound "${id}"`)
  return sound
}

const peakDb = async (sound: FactorySound, bpm?: number): Promise<number> =>
  toDb(peakOf((await renderFactorySound(sound, { ...node, bpm })).channels))

describe('a sound at its kit level', () => {
  const kept = FACTORY_SOUNDS.filter((sound) => sound.kitLevel)

  it('is one part of a kit that has a level of its own, or is made from one', () => {
    expect(kept.length).toBeGreaterThan(0)
    for (const sound of kept) {
      // A sound made from a part of a kit takes that part's peak: the part is what keeps the level.
      if (sound.source !== undefined) {
        expect(factorySound(sound.source)?.kitLevel, sound.id).toBe(true)
        continue
      }
      expect(sound.kit, sound.id).toBe(true)
      expect(typeof sound.patch, sound.id).toBe('object')
      if (typeof sound.patch === 'string') continue
      expect(KIT_LEVEL_DB[sound.patch.instrument?.deviceId ?? ''], sound.id).toBeDefined()
    }
  })

  it('has the hardest kick of the kit at the bank peak, and the other drums under it', async () => {
    const kick = await peakDb(named('club-firm-kick-four'))
    expect(Math.abs(kick - FACTORY_PEAK_DB)).toBeLessThan(0.5)
    const clap = await peakDb(named('club-clap-two-four'))
    const hats = await peakDb(named('club-sixteenth-hats'))
    // The clap some 6 dB under the kick and the hats some 11: the kit's balance, not the bank's level.
    expect(kick - clap).toBeGreaterThan(4)
    expect(kick - clap).toBeLessThan(8)
    expect(kick - hats).toBeGreaterThan(9)
    expect(kick - hats).toBeLessThan(13)
  }, 60000)

  it('made from a part of a kit, peaks where that part does', async () => {
    const crash = await peakDb(named('club-crash-hit'))
    expect(crash).toBeLessThan(FACTORY_PEAK_DB - 5)
    expect(Math.abs((await peakDb(named('house-reverse-crash-one'))) - crash)).toBeLessThan(0.1)
  }, 60000)

  it('is as loud at another tempo: the same strokes at the same level', async () => {
    const hats = named('club-sixteenth-hats')
    expect(Math.abs((await peakDb(hats, 96)) - (await peakDb(hats)))).toBeLessThan(0.5)
  }, 60000)

  it('lays over others without going over full scale: a kick, a clap and hats summed', async () => {
    const parts = await Promise.all(
      [
        'club-firm-kick-four',
        'club-clap-two-four',
        'club-sixteenth-hats',
        'club-offbeat-open-hat',
      ].map((id) => renderFactorySound(named(id), node)),
    )
    // Each as long as the longest, played round.
    const frames = Math.max(...parts.map((part) => part.channels[0].length))
    let peak = 0
    for (let i = 0; i < frames; i += 1) {
      let sum = 0
      for (const part of parts) sum += part.channels[0][i % part.channels[0].length]
      peak = Math.max(peak, Math.abs(sum))
    }
    expect(toDb(peak)).toBeLessThan(-3)
    expect(toDb(peak)).toBeGreaterThan(FACTORY_PEAK_DB - 1.5)
  }, 60000)
})
