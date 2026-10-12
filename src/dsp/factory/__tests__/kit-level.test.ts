// One part of a kit keeps the kit's own level (`kitLevel`): it is not
// brought to the bank's peak, so a row of hats is as far under a kick as the
// kit has it, and parts laid over each other are balanced as one kit.

import { describe, expect, it } from 'vitest'

import { compileFromDisk, toDb } from '../../__tests__/render-support'
import { peakOf } from '../../patch-render'
import { describeStockWasmDevice } from '../../registry'
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

  it('names only controls its instrument has where it says one keeps time, and keeps time itself', () => {
    const timed = FACTORY_SOUNDS.filter((sound) => sound.timedParams)
    expect(timed.length).toBeGreaterThan(0)
    for (const sound of timed) {
      expect(sound.bpm, sound.id).toBeDefined()
      if (typeof sound.patch === 'string') throw new Error(`${sound.id} names a preset`)
      const descriptor = describeStockWasmDevice(sound.patch.instrument?.deviceId ?? '')
      for (const name of Object.keys(sound.timedParams ?? {})) {
        expect(descriptor?.params[name], `${sound.id}: ${name}`).toBeDefined()
      }
    }
  })

  it('takes its peak after the fades only where a sound is new with that rule', () => {
    // `renderFactorySound` asks `renderPatch` for the peak the fades leave for a sound that
    // keeps time and ends and for one made from a part of a kit. Every sound numbered under 401
    // shipped before there was a choice and is rendered as it was: none of them is either.
    const asks = (sound: FactorySound): boolean =>
      (Boolean(sound.kitLevel) && sound.source !== undefined) ||
      (sound.bpm !== undefined && !sound.loopCrossfadeSec)
    expect(FACTORY_SOUNDS.filter(asks).length).toBeGreaterThan(0)
    expect(
      FACTORY_SOUNDS.filter((sound) => sound.number < 401 && asks(sound)).map((sound) => sound.id),
    ).toEqual([])
  })

  it('refuses to keep the level of a kit that has none', async () => {
    const soft = { ...named('club-firm-kick-four'), id: 'soft-kick', kitLevel: true as const }
    if (typeof soft.patch === 'string') throw new Error('a preset')
    const patch = { ...soft.patch, instrument: { deviceId: 'drum-kit', params: {} } }
    await expect(renderFactorySound({ ...soft, patch }, node)).rejects.toThrow(
      /keeps the level of a kit that has none/,
    )
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

  it('played backwards into a bar line, ends on the stick at 96, 120 and 140', async () => {
    for (const id of ['house-reverse-crash-one', 'house-reverse-crash-two']) {
      for (const bpm of [96, 120, 140]) {
        const { channels, sampleRate } = await renderFactorySound(named(id), { ...node, bpm })
        const frames = channels[0].length
        let at = 0
        let most = 0
        for (const channel of channels) {
          for (let i = 0; i < frames; i += 1) {
            if (Math.abs(channel[i]) > most) {
              most = Math.abs(channel[i])
              at = i
            }
          }
        }
        // The crash's largest sample is a few ms after its stick: as near the end of its reverse.
        expect((frames - at) / sampleRate, `${id} at ${bpm}`).toBeLessThan(0.01)
      }
    }
  }, 120000)

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
