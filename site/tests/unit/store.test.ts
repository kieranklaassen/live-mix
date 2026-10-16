import { describe, expect, it, vi } from 'vitest'
import type { LabDescription } from '../../src/lab/describe.ts'
import { createPlayer, volumeGain, type PlayerContext } from '../../src/lab/player.ts'
import {
  BENCH,
  createLabStore,
  waitingText,
  type Renderer,
  type Result,
  type Sounder,
  type Tap,
} from '../../src/lab/store.ts'

const description: LabDescription = {
  sampleRate: 48_000,
  maxFrames: 384_000,
  controls: [
    {
      index: 0,
      id: 'amount',
      name: 'Amount',
      unit: '',
      min: 0,
      max: 1,
      initial: 0.5,
      scale: 'linear',
      choices: [],
    },
  ],
  taps: [
    { index: 0, id: 'in', name: 'Input', unit: '', kind: 'audio', origin: 'source', channels: 2 },
    {
      index: 1,
      id: 'level',
      name: 'Level',
      unit: 'dB',
      kind: 'control',
      origin: 'device',
      channels: 1,
    },
    { index: 2, id: 'out', name: 'Output', unit: '', kind: 'audio', origin: 'device', channels: 2 },
  ],
  checks: [],
}

function tap(id: string, kind: Tap['kind'], origin: Tap['origin'], frames: number): Tap {
  const info = description.taps.find((one) => one.id === id)!
  return {
    ...info,
    kind,
    origin,
    channels_data: [new Float32Array(frames), new Float32Array(frames)],
    length: frames,
    x0: 0,
    x1: 1,
    columns: 0,
    log: false,
  }
}

const result = (frames = 16): Result => ({
  frames,
  ms: 1,
  checks: {},
  taps: {
    in: tap('in', 'audio', 'source', frames),
    level: tap('level', 'control', 'device', frames),
    out: tap('out', 'audio', 'device', frames),
  },
})

/** A renderer whose renders land when the test says so. */
function fakeRenderer() {
  const renders: { values: Record<string, number>; source: string; land: (r: Result) => void }[] =
    []
  let loaded: ((d: LabDescription) => void) | undefined
  let failed: ((e: Error) => void) | undefined
  const files: Float32Array[] = []
  const renderer: Renderer = {
    load: () =>
      new Promise((resolve, reject) => {
        loaded = resolve
        failed = reject
      }),
    render: (source, values) =>
      new Promise((resolve) => renders.push({ source, values: { ...values }, land: resolve })),
    setFile: (left) => files.push(left),
  }
  const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
  return {
    renderer,
    renders,
    files,
    tick,
    load: () => loaded?.(description),
    fail: (e: Error) => failed?.(e),
  }
}

/** The store over that renderer and a sounder that only remembers what it was asked. */
function fakes() {
  const made = fakeRenderer()
  const sounder = {
    play: vi.fn(),
    update: vi.fn(),
    bench: vi.fn(),
    stop: vi.fn(),
    setVolume: vi.fn(),
  } satisfies Sounder
  return { ...made, store: createLabStore(made.renderer, sounder), sounder }
}

async function ready() {
  const made = fakes()
  void made.store.init({ lab: 'x', sources: ['drums', 'sine'], seconds: 4 })
  made.load()
  await made.tick()
  made.renders[0]!.land(result())
  await made.tick()
  return made
}

interface FakeNode {
  gain: { value: number }
  to: unknown[]
}
interface FakeSource {
  buffer: unknown
  loop: boolean
  started?: { when: number; offset: number }
  stopped?: number
  connect(): void
  start(when: number, offset: number): void
  stop(when: number): void
}

/** The context of player.test.ts, cut to what is read here: a clock the test moves, where each
 * source started and stopped, and the gain that goes out. */
function fakeContext() {
  const sources: FakeSource[] = []
  const gains: FakeNode[] = []
  const node = () => ({
    to: [] as unknown[],
    gain: {
      value: 1,
      setValueAtTime(value: number) {
        this.value = value
      },
      linearRampToValueAtTime(value: number) {
        this.value = value
      },
      setTargetAtTime(value: number) {
        this.value = value
      },
    },
    connect(other: unknown) {
      this.to.push(other)
    },
  })
  const analyser = { ...node(), fftSize: 2048, getFloatTimeDomainData: () => {} }
  const context = {
    currentTime: 0,
    sampleRate: 48_000,
    state: 'running',
    destination: node(),
    resume: async () => {},
    createGain: () => {
      const made = node()
      gains.push(made)
      return made
    },
    createAnalyser: () => analyser,
    createBuffer: (_channels: number, length: number, rate: number) => ({
      duration: length / rate,
      getChannelData: () => new Float32Array(length),
    }),
    createBufferSource: () => {
      const made: FakeSource = {
        buffer: null,
        loop: false,
        connect() {},
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
  /** The gain everything leaves through: the one that goes on to the analyser. */
  const master = () => gains.find((gain) => gain.to.includes(analyser))
  return { context, sources, master }
}

/** The store over the real player, with a loop of four seconds rendered. */
async function withPlayer() {
  const made = fakeRenderer()
  const audio = fakeContext()
  const player = createPlayer(() => audio.context as unknown as PlayerContext)
  const store = createLabStore(made.renderer, player)
  void store.init({ lab: 'x', sources: ['drums'], seconds: 4 })
  made.load()
  await made.tick()
  made.renders[0]!.land(result(4 * 48_000))
  await made.tick()
  return { ...audio, store }
}

describe('the store of a lesson page', () => {
  it('renders once more, with the latest values, however many changes arrive during a render', async () => {
    const made = fakes()
    void made.store.init({ lab: 'x', sources: ['drums'], seconds: 4 })
    made.load()
    await made.tick()
    expect(made.renders).toHaveLength(1)
    for (const value of [0.1, 0.2, 0.3, 0.4, 0.9]) made.store.setValue('amount', value)
    expect(made.renders).toHaveLength(1)
    made.renders[0]!.land(result())
    await made.tick()
    expect(made.renders).toHaveLength(2)
    expect(made.renders[1]!.values.amount).toBe(0.9)
    made.renders[1]!.land(result())
    await made.tick()
    expect(made.renders).toHaveLength(2)
    expect(made.store.getState().rendering).toBe(false)
  })

  it('says it is loading until the lab has loaded, and never offers a silent signal meanwhile', async () => {
    const made = fakes()
    expect(waitingText(made.store.getState())).toBe('Loading the lab…')
    void made.store.init({ lab: 'x', sources: ['drums'], seconds: 4 })
    expect(made.store.getState().status).toBe('loading')
    expect(made.store.getState().result).toBeUndefined()
    expect(waitingText(made.store.getState())).toBe('Loading the lab…')
    made.load()
    await made.tick()
    expect(waitingText(made.store.getState())).toBe('Rendering…')
    made.renders[0]!.land(result())
    await made.tick()
    expect(waitingText(made.store.getState())).toBeUndefined()
  })

  it('shows why a lab did not load', async () => {
    const made = fakes()
    void made.store.init({ lab: 'x', sources: ['drums'], seconds: 4 })
    made.fail(new Error('labs/x.wasm answered 404'))
    await made.tick()
    expect(made.store.getState().status).toBe('failed')
    expect(made.store.getState().result).toBeUndefined()
    expect(waitingText(made.store.getState())).toBe(
      'The lab did not load: labs/x.wasm answered 404',
    )
  })

  it('keeps a control inside its range', async () => {
    const made = await ready()
    made.store.setValue('amount', 7)
    expect(made.store.getState().values.amount).toBe(1)
    made.store.setValue('nothing', 1)
    expect(made.store.getState().values.nothing).toBeUndefined()
  })

  it('cuts a file of twelve seconds to its first eight, and says so', async () => {
    const made = await ready()
    const twelve = new Float32Array(12 * 48_000).fill(0.5)
    made.store.setFile('take.wav', twelve, twelve)
    expect(made.files[0]!.length).toBe(8 * 48_000)
    // Faded at each end, whole in the middle.
    expect(made.files[0]![0]).toBe(0)
    expect(made.files[0]![made.files[0]!.length - 1]).toBe(0)
    expect(made.files[0]![48_000]).toBe(0.5)
    const state = made.store.getState()
    expect(state.source).toBe('file')
    expect(state.file).toEqual({ name: 'take.wav', note: 'the first 8.0 s of 12.0 s' })
    await made.tick()
    expect(made.renders.at(-1)!.source).toBe('file')
  })

  it('leaves the source as it was when a file cannot be read', async () => {
    const made = await ready()
    made.store.setSource('sine')
    made.store.fileFailed()
    const state = made.store.getState()
    expect(state.source).toBe('sine')
    expect(state.file).toBeUndefined()
    expect(state.sourceMessage).toBe('This file could not be read.')
    made.store.setSource('drums')
    expect(made.store.getState().sourceMessage).toBeUndefined()
  })

  it('lets only a stage that is sound become the sounding stage', async () => {
    const made = await ready()
    made.store.listen('level')
    expect(made.sounder.play).not.toHaveBeenCalled()
    expect(made.store.getState().playing).toBe(false)
    made.store.listen('in')
    expect(made.sounder.play).toHaveBeenCalledTimes(1)
    expect(made.store.getState()).toMatchObject({ playing: true, sounding: 'in' })
    // Another stage while playing carries on from the same place.
    made.store.listen('out')
    expect(made.sounder.update).toHaveBeenCalledTimes(1)
    expect(made.store.getState().sounding).toBe('out')
  })

  it('plays the output by default, and hands a new render to what is playing', async () => {
    const made = await ready()
    expect(made.store.getState().sounding).toBe('out')
    made.store.play()
    expect(made.sounder.play.mock.calls[0]![0].id).toBe('out')
    made.store.setValue('amount', 0.2)
    made.renders.at(-1)!.land(result())
    await made.tick()
    expect(made.sounder.update).toHaveBeenCalledTimes(1)
  })

  it('makes the bench the sounding stage only once it is open, and feeds it the source', async () => {
    const made = await ready()
    made.store.listen(BENCH)
    expect(made.sounder.bench).not.toHaveBeenCalled()
    made.store.openBench()
    made.store.listen(BENCH)
    expect(made.sounder.bench.mock.calls[0]![0].id).toBe('in')
    expect(made.store.getState()).toMatchObject({ playing: true, sounding: BENCH })
    made.store.stop()
    expect(made.sounder.stop).toHaveBeenCalledTimes(1)
    expect(made.store.getState().playing).toBe(false)
    // Back to a stage of the lab: the stage is played, and playing it is what takes the sound
    // back. Taking the feed away first would leave nothing sounding, and the loop would restart.
    made.store.listen(BENCH)
    made.store.listen('out')
    expect(made.sounder.play.mock.calls.at(-1)![0].id).toBe('out')
    expect(made.sounder.bench).not.toHaveBeenCalledWith(null)
  })
})

describe('the store over the real player', () => {
  it('carries on from the same place when a stage takes the sound back from the bench', async () => {
    const { store, sources, context } = await withPlayer()
    store.openBench()
    store.listen('out')
    expect(sources[0]!.started).toEqual({ when: 0, offset: 0 })
    context.currentTime = 1
    store.listen(BENCH)
    expect(sources[1]!.started).toEqual({ when: 1, offset: 1 })
    context.currentTime = 2.5
    store.listen('out')
    expect(sources).toHaveLength(3)
    expect(sources[2]!.started!.when).toBe(2.5)
    expect(sources[2]!.started!.offset).toBeCloseTo(2.5, 6)
    // The bench's feed is faded out under the stage that took over.
    expect(sources[1]!.stopped).toBeCloseTo(2.52, 6)
  })

  it('starts at the volume that was set before the first play', async () => {
    const { store, master } = await withPlayer()
    store.setVolume(0.2)
    // No context yet: the player keeps the volume for the one a play makes.
    expect(master()).toBeUndefined()
    store.play()
    expect(master()!.gain.value).toBe(volumeGain(0.2))
    expect(store.getState().volume).toBe(0.2)
  })
})
