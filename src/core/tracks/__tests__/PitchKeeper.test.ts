import { describe, expect, it } from 'vitest'

import {
  asAudioContext,
  asAudioNode,
  createMockContext,
  type MockAudioContext,
} from '../../../testing'
import { createEngine } from '../../Engine'
import {
  type StretchNode,
  type StretchNodeFactory,
  type StretchScheduleChange,
} from '../../sources/StretchSource'
import { ChannelStrip } from '../ChannelStrip'
import { keptSemitones } from '../PitchKeeper'

/** A stand-in for signalsmith's node: a gain node that remembers what it was asked. */
function keeperFactory(ctx: MockAudioContext) {
  const made: (ReturnType<MockAudioContext['createGain']> & {
    scheduled: StretchScheduleChange[]
    blockMs?: number | null
  })[] = []
  const create: StretchNodeFactory = () => {
    const node = Object.assign(ctx.createGain(), {
      scheduled: [] as StretchScheduleChange[],
      blockMs: undefined as number | null | undefined,
      schedule(change: StretchScheduleChange) {
        node.scheduled.push(change)
      },
      start() {},
      stop() {},
      addBuffers: () => Promise.resolve(0),
      dropBuffers: () => Promise.resolve(undefined),
      latency: () => 0.06,
      inputTime: 0,
      configure(options: { blockMs?: number | null }) {
        node.blockMs = options.blockMs
      },
    })
    made.push(node)
    return Promise.resolve(node as unknown as StretchNode)
  }
  return { create, made }
}

describe('keeping the pitch at another rate', () => {
  it('gives the semitones that bring a sound read faster back to its pitch', () => {
    expect(keptSemitones(2)).toBeCloseTo(-12, 10)
    expect(keptSemitones(1.5)).toBeCloseTo(-7.02, 2)
    expect(keptSemitones(1)).toBeCloseTo(0, 10)
  })

  it('makes no keeper without the option, and a rate is tape’s', async () => {
    const ctx = createMockContext()
    const engine = createEngine({ context: asAudioContext(ctx) })
    const track = engine.addAudioTrack('voice')
    await engine.preparePitch()
    engine.transport.setRate(2)
    expect(track.strip.keptBy).toBeNull()
    expect(engine.ioLatency().keptSec).toBe(0)
    engine.dispose()
  })

  it('makes keepers only when asked, out of the path at 1, in it at another rate, and out again at 1', async () => {
    const ctx = createMockContext()
    const keepers = keeperFactory(ctx)
    const engine = createEngine({
      context: asAudioContext(ctx),
      keepPitch: { create: keepers.create },
    })
    const voice = engine.addAudioTrack('voice')
    const music = engine.addAudioTrack('music')
    expect(keepers.made).toHaveLength(0)

    await engine.preparePitch()
    expect(keepers.made).toHaveLength(2)
    expect(keepers.made[0].blockMs).toBe(70)
    expect(voice.strip.keptBy).toBeNull()
    expect(engine.ioLatency().keptSec).toBe(0)

    engine.transport.setRate(2)
    const [kept] = keepers.made
    expect(voice.strip.keptBy).toBe(kept)
    expect(music.strip.keptBy).toBe(keepers.made[1])
    expect(kept.scheduled.at(-1)).toEqual({ active: true, semitones: keptSemitones(2) })
    expect(engine.ioLatency().keptSec).toBe(0.06)

    engine.transport.setRate(1.5)
    expect(voice.strip.keptBy).toBe(kept)
    expect(kept.scheduled.at(-1)?.semitones).toBeCloseTo(-7.02, 2)

    engine.transport.setRate(1)
    expect(voice.strip.keptBy).toBeNull()
    expect(kept.scheduled.at(-1)).toEqual({ active: false, semitones: 0 })
    expect(engine.ioLatency().keptSec).toBe(0)

    // Asked again, nothing more is made.
    await engine.preparePitch()
    expect(keepers.made).toHaveLength(2)
    engine.dispose()
  })

  it('takes a rate already set when the keepers are made after it', async () => {
    const ctx = createMockContext()
    const keepers = keeperFactory(ctx)
    const engine = createEngine({
      context: asAudioContext(ctx),
      keepPitch: { create: keepers.create, blockMs: 40 },
    })
    const voice = engine.addAudioTrack('voice')
    engine.transport.setRate(3)

    await engine.preparePitch()

    expect(voice.strip.keptBy).toBe(keepers.made[0])
    expect(keepers.made[0].blockMs).toBe(40)
    expect(keepers.made[0].scheduled.at(-1)?.semitones).toBeCloseTo(keptSemitones(3), 10)
    engine.dispose()
  })

  it('lets a removed track’s keeper go', async () => {
    const ctx = createMockContext()
    const keepers = keeperFactory(ctx)
    const engine = createEngine({
      context: asAudioContext(ctx),
      keepPitch: { create: keepers.create },
    })
    engine.addAudioTrack('voice')
    await engine.preparePitch()
    engine.transport.setRate(2)

    engine.removeTrack('voice')

    expect(keepers.made[0].scheduled.at(-1)).toEqual({ active: false })
    expect(engine.ioLatency().keptSec).toBe(0)
    engine.dispose()
  })
})

describe('a strip’s sources summed into a keeper', () => {
  it('moves every source into the keeper and the keeper into the strip, and back', () => {
    const ctx = createMockContext()
    const destination = ctx.createGain()
    const strip = new ChannelStrip(asAudioContext(ctx), {
      name: 'voice',
      destination: asAudioNode(destination),
    })
    const first = ctx.createGain()
    strip.connectSource(asAudioNode(first))
    const keeper = ctx.createGain()

    strip.keepPitch(asAudioNode(keeper))
    const later = ctx.createGain()
    strip.connectSource(asAudioNode(later))

    expect(first.isConnectedTo(keeper)).toBe(true)
    expect(first.isConnectedTo(destination)).toBe(false)
    expect(later.isConnectedTo(keeper)).toBe(true)
    expect(keeper.isConnectedTo(destination)).toBe(true)

    // The strip's nodes come while kept: the keeper feeds them, not the sources.
    strip.setLevel(0.5)
    expect(keeper.isConnectedTo(destination)).toBe(false)
    expect(first.isConnectedTo(keeper)).toBe(true)

    strip.keepPitch(null)
    expect(first.isConnectedTo(keeper)).toBe(false)
    expect(later.isConnectedTo(keeper)).toBe(false)
    expect(strip.keptBy).toBeNull()
    strip.dispose()
  })
})
