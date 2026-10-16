import { describe, expect, it, vi } from 'vitest'
import type { LabDescription } from '../../src/lab/describe.ts'
import { createPlayer, volumeGain, type PlayerContext } from '../../src/lab/player.ts'
import {
  BENCH,
  createLabStore,
  waitingText,
  type LabState,
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
    {
      index: 1,
      id: 'tone',
      name: 'Tone',
      unit: '',
      min: 0,
      max: 10,
      initial: 2,
      scale: 'linear',
      choices: [],
    },
    {
      index: 2,
      id: 'build',
      name: 'Build',
      unit: '',
      min: 0,
      max: 2,
      initial: 0,
      scale: 'linear',
      choices: ['A wire', 'Measure', 'Curve'],
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
  const renders: {
    values: Record<string, number>
    source: string
    landed: boolean
    land(r: Result): void
  }[] = []
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
      new Promise((resolve) =>
        renders.push({
          source,
          values: { ...values },
          landed: false,
          land(r) {
            this.landed = true
            resolve(r)
          },
        }),
      ),
    setFile: (left) => files.push(left),
  }
  const tick = () => new Promise((resolve) => setTimeout(resolve, 0))
  /** Land every render asked for, one after another, until none is left in flight. */
  const settle = async () => {
    for (;;) {
      await tick()
      const flying = renders.find((one) => !one.landed)
      if (!flying) return
      flying.land(result())
    }
  }
  return {
    renderer,
    renders,
    files,
    tick,
    settle,
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
    wake: vi.fn(),
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

  it('opens on the last sound of the main path when the build path writes sound after it', async () => {
    const made = fakes()
    void made.store.init({ lab: 'x', sources: ['drums'], seconds: 4 })
    made.load()
    await made.tick()
    const landed = result()
    landed.taps.built = { ...tap('out', 'audio', 'device', 16), id: 'built', index: 3 }
    made.renders[0]!.land(landed)
    await made.tick()
    expect(made.store.getState().sounding).toBe('out')
    made.store.listen('built')
    expect(made.store.getState().sounding).toBe('built')
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

const PUMP = { id: 'pump', label: 'pumping' }
const FLAT = { id: 'flat', label: 'flattened' }
/** The card a page would light: the audition's, and only while it sounds. */
const lit = (state: LabState) => (state.playing ? state.audition?.id : undefined)

describe('a card on a lesson page', () => {
  it('starts from silence on the render that carries its values, and not before', async () => {
    const made = await ready()
    made.store.audition(PUMP, { values: { amount: 0.9 }, tap: 'in' })
    // The audio context is made in the press; the sound waits for the render.
    expect(made.sounder.wake).toHaveBeenCalledTimes(1)
    expect(made.sounder.play).not.toHaveBeenCalled()
    expect(made.store.getState()).toMatchObject({
      playing: false,
      audition: null,
      waiting: { tap: 'in', card: PUMP },
    })
    expect(made.renders).toHaveLength(2)
    expect(made.renders[1]!.values).toEqual({ amount: 0.9, tone: 2, build: 0 })
    await made.settle()
    expect(made.sounder.play).toHaveBeenCalledTimes(1)
    expect(made.sounder.play.mock.calls[0]![0].id).toBe('in')
    const state = made.store.getState()
    expect(state).toMatchObject({ playing: true, sounding: 'in', audition: PUMP, waiting: null })
    // The render says which values it carries.
    expect(state.rendered).toEqual({
      source: 'drums',
      values: { amount: 0.9, tone: 2, build: 0 },
    })
  })

  it('starts on the render with its own values when another was in flight at the press', async () => {
    const made = await ready()
    made.store.setValue('amount', 0.2)
    made.store.audition(PUMP, { values: { amount: 0.9 } })
    expect(made.renders).toHaveLength(2)
    expect(made.renders[1]!.values.amount).toBe(0.2)
    made.renders[1]!.land(result())
    await made.tick()
    // The earlier render landed: still nothing sounds.
    expect(made.sounder.play).not.toHaveBeenCalled()
    expect(made.store.getState()).toMatchObject({ playing: false, waiting: { card: PUMP } })
    expect(made.renders[2]!.values.amount).toBe(0.9)
    made.renders[2]!.land(result())
    await made.tick()
    expect(made.sounder.play).toHaveBeenCalledTimes(1)
    expect(made.store.getState()).toMatchObject({ playing: true, audition: PUMP })
  })

  it('starts at once when the last render already carries its values', async () => {
    const made = await ready()
    made.store.audition(PUMP, { values: { amount: 0.9 } })
    await made.settle()
    made.store.stop()
    const renders = made.renders.length
    made.store.audition(PUMP, { values: { amount: 0.9 } })
    expect(made.sounder.play).toHaveBeenCalledTimes(2)
    expect(made.renders).toHaveLength(renders)
    expect(made.store.getState()).toMatchObject({ playing: true, audition: PUMP, waiting: null })
  })

  it('lights one card at a time: a second card takes over, and the lit card pressed again stops', async () => {
    const made = await ready()
    const seen: (string | undefined)[] = []
    made.store.subscribe(() => {
      const id = lit(made.store.getState())
      if (seen.at(-1) !== id) seen.push(id)
    })
    // A set that names no tap plays the lab's last sound.
    made.store.audition(PUMP, { values: { amount: 0.9 } })
    await made.settle()
    expect(made.sounder.play.mock.calls[0]![0].id).toBe('out')

    made.store.audition(FLAT, { values: { amount: 0.1 }, tap: 'in' })
    // The second card is lit at once; what was sounding carries on until its render lands.
    expect(made.store.getState()).toMatchObject({ playing: true, audition: FLAT, sounding: 'in' })
    expect(made.sounder.update).not.toHaveBeenCalled()
    await made.settle()
    expect(made.sounder.update).toHaveBeenCalledTimes(1)
    expect(made.sounder.update.mock.calls[0]![0].id).toBe('in')
    expect(made.sounder.play).toHaveBeenCalledTimes(1)

    made.store.audition(FLAT, { values: { amount: 0.1 }, tap: 'in' })
    expect(made.sounder.stop).toHaveBeenCalledTimes(1)
    expect(made.store.getState()).toMatchObject({ playing: false, audition: null })
    expect(seen).toEqual(['pump', 'flat', undefined])
  })

  it('crosses a sounding stage over to a card once, on the render with the card’s values', async () => {
    const made = await ready()
    made.store.play()
    made.store.setValue('amount', 0.2)
    made.store.audition(PUMP, { values: { amount: 0.9 }, tap: 'in' })
    made.renders[1]!.land(result())
    await made.tick()
    expect(made.sounder.update).not.toHaveBeenCalled()
    made.renders[2]!.land(result())
    await made.tick()
    expect(made.sounder.update).toHaveBeenCalledTimes(1)
    expect(made.sounder.update.mock.calls[0]![0].id).toBe('in')
    expect(made.sounder.play).toHaveBeenCalledTimes(1)
  })

  it('loses its name when a control or the source is moved by hand, and the sound and the way back stay', async () => {
    const made = await ready()
    made.store.audition(PUMP, { values: { amount: 0.9 } })
    await made.settle()
    made.store.setValue('tone', 7)
    expect(made.store.getState()).toMatchObject({ playing: true, audition: null, sounding: 'out' })
    expect(made.store.getState().memory).not.toBeNull()
    await made.settle()

    made.store.audition(PUMP, { values: { amount: 0.9 } })
    await made.settle()
    expect(made.store.getState().audition).toEqual(PUMP)
    made.store.setSource('sine')
    expect(made.store.getState()).toMatchObject({ playing: true, audition: null })
    expect(made.store.getState().memory).not.toBeNull()
    expect(made.sounder.stop).not.toHaveBeenCalled()
  })

  it('goes back, after two cards and a control moved by hand, to the controls, the source and the stage from before the first card', async () => {
    const made = await ready()
    made.store.setValue('amount', 0.3)
    made.store.setSource('sine')
    made.store.setValue('build', 1)
    await made.settle()
    made.store.listen('in')

    made.store.audition(PUMP, { values: { amount: 0.9, tone: 5 }, source: 'drums', tap: 'out' })
    await made.settle()
    expect(made.store.getState()).toMatchObject({ source: 'drums', sounding: 'out' })
    made.store.audition(FLAT, { values: { amount: 0.1 } })
    await made.settle()
    made.store.setValue('tone', 7)
    made.store.setValue('build', 2)
    await made.settle()
    // Held since the first card: every control but the build step, the source and the stage.
    expect(made.store.getState().memory).toEqual({
      values: { amount: 0.3, tone: 2 },
      source: 'sine',
      sounding: 'in',
    })

    made.store.back()
    expect(made.store.getState()).toMatchObject({
      values: { amount: 0.3, tone: 2, build: 2 },
      source: 'sine',
      sounding: 'in',
      audition: null,
      memory: null,
      playing: true,
    })
    await made.settle()
    expect(made.renders.at(-1)).toMatchObject({
      source: 'sine',
      values: { amount: 0.3, tone: 2, build: 2 },
    })
    expect(made.sounder.update.mock.calls.at(-1)![0].id).toBe('in')
    // The offer is gone: a second "back" does nothing.
    const renders = made.renders.length
    made.store.back()
    expect(made.renders).toHaveLength(renders)
  })

  it('puts a control its set does not name at the lab’s starting value, and never moves the build step', async () => {
    const made = await ready()
    made.store.setValue('tone', 9)
    made.store.setValue('build', 1)
    await made.settle()
    made.store.audition(PUMP, { values: { amount: 0.9, build: 2 } })
    expect(made.store.getState().values).toEqual({ amount: 0.9, tone: 2, build: 1 })
    await made.settle()
    made.store.applySet({ values: { tone: 4, build: 0 } })
    expect(made.store.getState().values).toEqual({ amount: 0.5, tone: 4, build: 1 })
  })

  it('does not start when stop is pressed while it waits, or when it is pressed again', async () => {
    const made = await ready()
    made.store.audition(PUMP, { values: { amount: 0.9 } })
    made.store.stop()
    expect(made.store.getState().waiting).toBeNull()
    await made.settle()

    made.store.audition(PUMP, { values: { amount: 0.8 } })
    expect(made.store.getState().waiting).toEqual({ tap: 'out', card: PUMP })
    made.store.audition(PUMP, { values: { amount: 0.8 } })
    expect(made.store.getState().waiting).toBeNull()
    await made.settle()
    expect(made.sounder.play).not.toHaveBeenCalled()
    expect(made.store.getState().playing).toBe(false)
  })

  it('gives way to another card pressed while it waits', async () => {
    const made = await ready()
    made.store.audition(PUMP, { values: { amount: 0.9 } })
    made.store.audition(FLAT, { values: { amount: 0.1 }, tap: 'in' })
    expect(made.store.getState().waiting).toEqual({ tap: 'in', card: FLAT })
    await made.settle()
    expect(made.sounder.play).toHaveBeenCalledTimes(1)
    expect(made.sounder.play.mock.calls[0]![0].id).toBe('in')
    expect(made.store.getState()).toMatchObject({ playing: true, audition: FLAT })
    expect(made.renders.at(-1)!.values.amount).toBe(0.1)
  })

  it('leaves the way back on offer when it is pressed from silence and then stopped', async () => {
    const made = await ready()
    made.store.setValue('amount', 0.3)
    await made.settle()
    made.store.audition(PUMP, { values: { amount: 0.9 }, source: 'sine' })
    made.store.stop()
    await made.settle()
    expect(made.store.getState()).toMatchObject({
      playing: false,
      source: 'sine',
      values: { amount: 0.9 },
    })
    expect(made.store.getState().memory).not.toBeNull()
    made.store.back()
    expect(made.store.getState()).toMatchObject({
      playing: false,
      source: 'drums',
      values: { amount: 0.3 },
      memory: null,
    })
    await made.settle()
    expect(made.sounder.play).not.toHaveBeenCalled()
  })

  it('moves the sound from the real device to the lab’s tap, and "back" returns it to the device', async () => {
    const made = await ready()
    made.store.openBench()
    made.store.listen(BENCH)
    expect(made.sounder.bench).toHaveBeenCalledTimes(1)
    made.store.audition(PUMP, { values: { amount: 0.9 } })
    await made.settle()
    expect(made.store.getState()).toMatchObject({ playing: true, sounding: 'out', audition: PUMP })
    // Playing the tap is what takes the sound back from the device.
    expect(made.sounder.play.mock.calls.at(-1)![0].id).toBe('out')
    expect(made.sounder.update).not.toHaveBeenCalled()

    made.store.back()
    expect(made.store.getState()).toMatchObject({ playing: true, sounding: BENCH, audition: null })
    await made.settle()
    expect(made.sounder.bench).toHaveBeenCalledTimes(2)
    expect(made.sounder.bench.mock.calls.at(-1)![0].id).toBe('in')
  })
})

describe('the other ways a lesson page is set', () => {
  it('sets the page to the device’s defaults without a sound, and holds the way back', async () => {
    const made = await ready()
    made.store.setValue('amount', 0.3)
    made.store.setValue('build', 1)
    await made.settle()
    made.store.applySet({ values: { amount: 1, tone: 4 } })
    expect(made.store.getState().values).toEqual({ amount: 1, tone: 4, build: 1 })
    expect(made.store.getState().memory).toEqual({
      values: { amount: 0.3, tone: 2 },
      source: 'drums',
      sounding: 'out',
    })
    await made.settle()
    expect(made.store.getState()).toMatchObject({ playing: false, waiting: null })
    expect(made.sounder.play).not.toHaveBeenCalled()
    expect(made.sounder.wake).not.toHaveBeenCalled()

    // During an audition it clears the card's name, as a control moved by hand does, and the
    // memory stays the one from before the first press.
    made.store.audition(PUMP, { values: { amount: 0.9 } })
    await made.settle()
    made.store.applySet({ values: { amount: 1, tone: 4 } })
    expect(made.store.getState()).toMatchObject({ playing: true, audition: null })
    expect(made.store.getState().memory!.values.amount).toBe(0.3)
    expect(made.sounder.stop).not.toHaveBeenCalled()
  })

  it('moves many controls at once with one render, each kept inside its range', async () => {
    const made = await ready()
    made.store.setValues({ amount: 0.9, tone: 99, nothing: 1 })
    expect(made.store.getState().values).toEqual({ amount: 0.9, tone: 10, build: 0 })
    await made.settle()
    expect(made.renders).toHaveLength(2)
  })

  it('holds a stage asked for fresh from silence until the render in flight has landed', async () => {
    const made = await ready()
    made.store.setValue('build', 1)
    made.store.listen('in', true)
    expect(made.sounder.wake).toHaveBeenCalledTimes(1)
    expect(made.sounder.play).not.toHaveBeenCalled()
    expect(made.store.getState()).toMatchObject({ playing: false, waiting: { tap: 'in' } })
    await made.settle()
    expect(made.sounder.play.mock.calls[0]![0].id).toBe('in')
    expect(made.store.getState()).toMatchObject({
      playing: true,
      sounding: 'in',
      audition: null,
      waiting: null,
    })
    // With nothing in flight it starts at once.
    made.store.stop()
    made.store.listen('out', true)
    expect(made.sounder.play).toHaveBeenCalledTimes(2)
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
