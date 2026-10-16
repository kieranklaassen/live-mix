import { describe, expect, it } from 'vitest'
import { createPlayer, volumeGain, type PlayerContext } from '../../src/lab/player.ts'
import type { Tap } from '../../src/lab/store.ts'

interface FakeSource {
  buffer: { duration: number } | null
  loop: boolean
  into?: FakeNode
  started?: { when: number; offset: number }
  stopped?: number
  connect(node: FakeNode): void
  start(when: number, offset: number): void
  stop(when: number): void
}
interface FakeNode {
  name: string
  gain: { value: number; ramps: { value: number; at: number }[] }
  to: FakeNode[]
  connect(node: FakeNode): void
}

/** A context whose clock the test moves, and which remembers what was started and stopped. */
function fakeContext() {
  const sources: FakeSource[] = []
  const node = (name: string): FakeNode => {
    const made: FakeNode = {
      name,
      to: [],
      gain: {
        value: 1,
        ramps: [],
        setValueAtTime(value: number) {
          this.value = value
        },
        linearRampToValueAtTime(value: number, at: number) {
          this.ramps.push({ value, at })
          this.value = value
        },
        setTargetAtTime(value: number) {
          this.value = value
        },
      } as FakeNode['gain'],
      connect(other) {
        this.to.push(other)
      },
    }
    return made
  }
  const gains: FakeNode[] = []
  const context = {
    currentTime: 0,
    sampleRate: 48_000,
    state: 'running',
    destination: node('destination'),
    resume: async () => {},
    createGain: () => {
      const made = node(`gain${gains.length}`)
      gains.push(made)
      return made
    },
    createAnalyser: () => ({
      ...node('analyser'),
      fftSize: 2048,
      getFloatTimeDomainData: () => {},
    }),
    createBuffer: (_channels: number, length: number, rate: number) => ({
      duration: length / rate,
      getChannelData: () => new Float32Array(length),
    }),
    createBufferSource: () => {
      const made: FakeSource = {
        buffer: null,
        loop: false,
        connect(other) {
          this.into = other
        },
        start(when, offset) {
          this.started = { when, offset }
        },
        stop(when) {
          this.stopped = when
        },
      }
      sources.push(made)
      return made
    },
  }
  return { context, sources, gains }
}

const tap = (id: string, seconds = 4): Tap => ({
  index: 0,
  id,
  name: id,
  unit: '',
  kind: 'audio',
  origin: 'device',
  channels: 2,
  channels_data: [new Float32Array(seconds * 48_000), new Float32Array(seconds * 48_000)],
  length: seconds * 48_000,
  x0: 0,
  x1: 1,
  columns: 0,
  log: false,
})

function made() {
  const fake = fakeContext()
  const player = createPlayer(() => fake.context as unknown as PlayerContext)
  return { ...fake, player }
}

/** The node a voice ends in: source → its own gain → there. */
const bus = (source: FakeSource) => source.into!.to[0]!

describe('the player', () => {
  it('makes no context until something is played', () => {
    let count = 0
    const player = createPlayer(() => {
      count += 1
      return fakeContext().context as unknown as PlayerContext
    })
    player.stop()
    player.setVolume(0.3)
    expect(player.position()).toBeNull()
    expect(count).toBe(0)
  })

  it('makes or resumes its context in a press without starting a sound', () => {
    const fake = fakeContext()
    fake.context.state = 'suspended'
    let resumed = 0
    fake.context.resume = async () => {
      resumed += 1
    }
    let count = 0
    const player = createPlayer(() => {
      count += 1
      return fake.context as unknown as PlayerContext
    })
    player.wake()
    expect(count).toBe(1)
    expect(resumed).toBe(1)
    expect(fake.sources).toHaveLength(0)
    expect(player.position()).toBeNull()
    // A second press makes no second context, and resumes the one that is still suspended.
    player.wake()
    expect(count).toBe(1)
    expect(resumed).toBe(2)
    // The sound that starts later, outside the press, starts at the start of the loop.
    fake.context.currentTime = 0.4
    player.play(tap('out'))
    expect(count).toBe(1)
    expect(fake.sources[0]!.started).toEqual({ when: 0.4, offset: 0 })
  })

  it('starts a stage at the start of the loop', () => {
    const { player, sources } = made()
    player.play(tap('out'))
    expect(sources).toHaveLength(1)
    expect(sources[0]!.loop).toBe(true)
    expect(sources[0]!.started).toEqual({ when: 0, offset: 0 })
  })

  it('keeps the place in the loop when the stage changes or a new render lands', () => {
    const { player, sources, context } = made()
    player.play(tap('in'))
    context.currentTime = 1.234
    player.update(tap('out'))
    expect(sources).toHaveLength(2)
    // Within one render quantum of where the first voice is.
    expect(Math.abs(sources[1]!.started!.offset - 1.234)).toBeLessThan(128 / 48_000)
    expect(sources[0]!.stopped).toBeCloseTo(1.254, 6)
    // Past the loop's end the place wraps.
    context.currentTime = 9.5
    player.play(tap('sidechain'))
    expect(sources[2]!.started!.offset).toBeCloseTo(1.5, 6)
    expect(player.position()).toBeCloseTo(1.5, 6)
  })

  it('starts from the start of the loop after a stop', () => {
    const { player, sources, context } = made()
    player.play(tap('out'))
    context.currentTime = 2.7
    player.stop()
    expect(sources[0]!.stopped).toBeCloseTo(2.72, 6)
    expect(player.position()).toBeNull()
    context.currentTime = 3.1
    player.play(tap('out'))
    expect(sources[1]!.started).toEqual({ when: 3.1, offset: 0 })
  })

  it('hands the loop to the bench, in place, and stops the stage that was sounding', () => {
    const { player, sources, context } = made()
    player.play(tap('out'))
    context.currentTime = 1
    player.bench(tap('in'))
    expect(sources[0]!.stopped).toBeCloseTo(1.02, 6)
    expect(sources[1]!.started).toEqual({ when: 1, offset: 1 })
    // The stage went to the page's output; the bench's feed goes to the device, and the
    // device's return is opened.
    expect(bus(sources[1]!)).toBe(player.benchFeed())
    expect(bus(sources[1]!)).not.toBe(bus(sources[0]!))
    const back = player.benchReturn() as unknown as FakeNode
    expect(back.gain.ramps.at(-1)!.value).toBe(1)

    context.currentTime = 2
    player.stop()
    expect(sources[1]!.stopped).toBeCloseTo(2.02, 6)
    expect(back.gain.ramps.at(-1)!.value).toBe(0)
  })

  it('takes the sound back from the bench without losing the place', () => {
    const { player, sources, context } = made()
    player.bench(tap('in'))
    context.currentTime = 2.5
    player.play(tap('out'))
    expect(sources[1]!.started!.offset).toBeCloseTo(2.5, 6)
    expect(sources[0]!.stopped).toBeCloseTo(2.52, 6)
    const back = player.benchReturn() as unknown as FakeNode
    expect(back.gain.ramps.at(-1)!.value).toBe(0)
  })

  it('plays every stage 12 dB under full scale with the volume where it starts', () => {
    expect(20 * Math.log10(volumeGain(0.7))).toBeCloseTo(-12.2, 1)
    expect(volumeGain(0)).toBe(0)
    expect(volumeGain(1)).toBe(0.5)
  })
})
